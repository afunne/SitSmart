using Microsoft.EntityFrameworkCore;
using Piletimyyk.Api.Data;
using Piletimyyk.Api.Dtos;
using Piletimyyk.Api.Models;

namespace Piletimyyk.Api.Services;

public interface IPurchaseService
{
    /// <summary>
    /// Turns the user's reservation into a ticket at the event's current price and deletes the
    /// reservation. NotFound: no such reservation. Forbidden: it belongs to another user.
    /// Conflict: the hold has expired.
    /// </summary>
    Task<ServiceResult<TicketDto>> PurchaseAsync(int reservationId, int userId);
}

public class PurchaseService : IPurchaseService
{
    private readonly AppDbContext _db;
    private readonly ITicketCodeGenerator _codeGenerator;

    public PurchaseService(AppDbContext db, ITicketCodeGenerator codeGenerator)
    {
        _db = db;
        _codeGenerator = codeGenerator;
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
        await _db.SaveChangesAsync();
        await transaction.CommitAsync();

        var ev = reservation.Event;
        var seat = reservation.Seat;
        return ServiceResult<TicketDto>.Ok(new TicketDto(
            ticket.Id, ticket.Code, ev.Name, ev.StartTime, ev.Hall.Name,
            seat.Row, seat.Number, ticket.Price, ticket.PurchasedAt, ticket.UsedAt));
    }
}
