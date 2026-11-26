using Microsoft.EntityFrameworkCore;
using Piletimyyk.Api.Data;
using Piletimyyk.Api.Dtos;
using Piletimyyk.Api.Models;
using Piletimyyk.Api.WebSockets;

namespace Piletimyyk.Api.Services;

public interface IPurchaseService
{
    /// <summary>
    /// Turns the user's reservation into a ticket at the event's current price and deletes the
    /// reservation. NotFound: no such reservation. Forbidden: it belongs to another user.
    /// Conflict: the hold has expired, or the seat is already sold.
    /// </summary>
    Task<ServiceResult<TicketDto>> PurchaseAsync(int reservationId, int userId);
}

public class PurchaseService : IPurchaseService
{
    private const string SeatSold = "See koht on juba müüdud.";

    private readonly AppDbContext _db;
    private readonly ITicketCodeGenerator _codeGenerator;
    private readonly ISeatNotifier _notifier;

    public PurchaseService(AppDbContext db, ITicketCodeGenerator codeGenerator, ISeatNotifier notifier)
    {
        _db = db;
        _codeGenerator = codeGenerator;
        _notifier = notifier;
    }

    public async Task<ServiceResult<TicketDto>> PurchaseAsync(int reservationId, int userId)
    {
        // BEGIN IMMEDIATE on SQLite (see ReservationService): two concurrent purchases of the
        // same reservation run one after the other, and the second no longer finds it.
        await using var transaction = await _db.Database.BeginTransactionAsync();

        var reservation = await _db.Reservations
            .Include(r => r.Event).ThenInclude(e => e.Hall)
            .Include(r => r.Seat)
            .SingleOrDefaultAsync(r => r.Id == reservationId);

        if (reservation is null)
        {
            return ServiceResult<TicketDto>.NotFound($"Broneeringut {reservationId} ei leitud.");
        }

        if (reservation.UserId != userId)
        {
            return ServiceResult<TicketDto>.Forbidden("Saad osta ainult enda broneeritud kohti.");
        }

        var now = DateTime.UtcNow;
        if (reservation.ExpiresAt <= now)
        {
            return ServiceResult<TicketDto>.Conflict("Broneering on aegunud");
        }

        // Normally unreachable: a valid hold means the seat wasn't sold when it was taken.
        // This check is not the guarantee against double sale, only a clear message. The unique
        // index on Tickets (EventId, SeatId) is: it rejects a second ticket for the seat no
        // matter how it gets inserted or what isolation level the database uses, and the catch
        // around SaveChanges turns that into the same 409.
        if (await _db.Tickets.AnyAsync(t => t.EventId == reservation.EventId && t.SeatId == reservation.SeatId))
        {
            return ServiceResult<TicketDto>.Conflict(SeatSold);
        }

        var ticket = new Ticket
        {
            Code = _codeGenerator.Generate(),
            EventId = reservation.EventId,
            SeatId = reservation.SeatId,
            UserId = userId,
            Price = reservation.Event.Price,
            PurchasedAt = now
        };

        _db.Tickets.Add(ticket);
        _db.Reservations.Remove(reservation);
        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (ex.IsUniqueViolation())
        {
            // The seat was sold in the meantime. (Tickets.Code is unique too, but a code
            // collision is ~2^-60 likely; it would also land here and the buyer can retry,
            // since the rollback keeps the reservation.)
            return ServiceResult<TicketDto>.Conflict(SeatSold);
        }

        await transaction.CommitAsync();

        // Only after the commit: a rolled-back sale must never mark the seat as sold.
        await _notifier.SeatSoldAsync(ticket.EventId, ticket.SeatId);

        var ev = reservation.Event;
        var seat = reservation.Seat;
        return ServiceResult<TicketDto>.Ok(new TicketDto(
            // StartTime comes from SQLite without a DateTimeKind; it's stored as UTC.
            ticket.Id, ticket.Code, ev.Name, DateTime.SpecifyKind(ev.StartTime, DateTimeKind.Utc), ev.Hall.Name,
            seat.Row, seat.Number, ticket.Price, ticket.PurchasedAt, ticket.UsedAt));
    }
}
