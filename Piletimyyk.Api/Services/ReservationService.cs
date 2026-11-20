using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Piletimyyk.Api.Data;
using Piletimyyk.Api.Dtos;
using Piletimyyk.Api.Models;

namespace Piletimyyk.Api.Services;

public interface IReservationService
{
    /// <summary>
    /// Holds a seat for the user for Reservations:HoldMinutes.
    /// NotFound: event or seat doesn't exist. Validation: event has started, or the seat is
    /// in another hall. Conflict: seat is sold or held, or the user is at the reservation limit.
    /// </summary>
    Task<ServiceResult<ReservationDto>> ReserveAsync(int eventId, int seatId, int userId);

    /// <summary>
    /// Releases a hold. NotFound: no such reservation. Forbidden: it belongs to another user.
    /// </summary>
    Task<ServiceResult> CancelAsync(int reservationId, int userId);
}

public class ReservationService : IReservationService
{
    public const int MaxActiveReservationsPerUser = 6;

    /// <summary>Same message for sold and held seats: buyers don't need to know which.</summary>
    private const string SeatTaken = "Koht on juba võetud";

    private readonly AppDbContext _db;
    private readonly ReservationOptions _options;

    public ReservationService(AppDbContext db, IOptions<ReservationOptions> options)
    {
        _db = db;
        _options = options.Value;
    }

    public async Task<ServiceResult<ReservationDto>> ReserveAsync(int eventId, int seatId, int userId)
    {
        // Event and seat don't change during a purchase, so these checks can run
        // before the transaction.
        var ev = await _db.Events.AsNoTracking()
            .Where(e => e.Id == eventId)
            .Select(e => new { e.HallId, e.StartTime })
            .SingleOrDefaultAsync();

        if (ev is null)
        {
            return ServiceResult<ReservationDto>.NotFound($"Üritust {eventId} ei leitud.");
        }

        if (ev.StartTime <= DateTime.UtcNow)
        {
            return ServiceResult<ReservationDto>.Validation("Üritus on juba alanud, kohti ei saa enam broneerida.");
        }

        var seat = await _db.Seats.AsNoTracking()
            .Where(s => s.Id == seatId)
            .Select(s => new { s.HallId, s.Row, s.Number })
            .SingleOrDefaultAsync();

        if (seat is null)
        {
            return ServiceResult<ReservationDto>.NotFound($"Kohta {seatId} ei leitud.");
        }

        if (seat.HallId != ev.HallId)
        {
            return ServiceResult<ReservationDto>.Validation("See koht ei kuulu ürituse saali.");
        }

        // Availability is checked inside the transaction, right before inserting. With SQLite,
        // BeginTransaction issues BEGIN IMMEDIATE, which takes the database write lock at once:
        // a second request for the same seat waits here until this one commits, then sees the
        // new reservation and gets a Conflict.
        //
        // These checks are not what guarantees one hold per seat, though: that relies on SQLite's
        // locking, and on a database with weaker isolation (e.g. READ COMMITTED) two requests
        // could both pass them. The unique index on Reservations (EventId, SeatId) is the real
        // guarantee; the checks exist to return a specific message, and the catch around
        // SaveChanges turns a lost race into the same 409. A hold on an already sold seat can't
        // lead to a double sale either: the unique index on Tickets rejects the purchase.
        await using var transaction = await _db.Database.BeginTransactionAsync();

        var now = DateTime.UtcNow;

        if (await _db.Tickets.AnyAsync(t => t.EventId == eventId && t.SeatId == seatId))
        {
            return ServiceResult<ReservationDto>.Conflict(SeatTaken);
        }

        var holder = await _db.Reservations
            .Where(r => r.EventId == eventId && r.SeatId == seatId && r.ExpiresAt > now)
            .Select(r => (int?)r.UserId)
            .FirstOrDefaultAsync();

        if (holder is not null)
        {
            return ServiceResult<ReservationDto>.Conflict(holder == userId
                ? "Sa oled selle koha juba broneerinud."
                : SeatTaken);
        }

        // Across all events, so one buyer can't block seats everywhere.
        var activeCount = await _db.Reservations.CountAsync(r => r.UserId == userId && r.ExpiresAt > now);
        if (activeCount >= MaxActiveReservationsPerUser)
        {
            return ServiceResult<ReservationDto>.Conflict(
                $"Korraga saab broneerida kuni {MaxActiveReservationsPerUser} kohta. Osta või tühista olemasolevad broneeringud.");
        }

        var reservation = new Reservation
        {
            EventId = eventId,
            SeatId = seatId,
            UserId = userId,
            CreatedAt = now,
            ExpiresAt = now.AddMinutes(_options.HoldMinutes)
        };

        // An expired hold no longer blocks the seat, but its row would still hit the unique
        // index, so remove it first. Part of the transaction, so a failed insert restores it.
        await _db.Reservations
            .Where(r => r.EventId == eventId && r.SeatId == seatId && r.ExpiresAt <= now)
            .ExecuteDeleteAsync();

        _db.Reservations.Add(reservation);
        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (ex.IsUniqueViolation())
        {
            // Someone else got the seat between the checks and the insert.
            return ServiceResult<ReservationDto>.Conflict(SeatTaken);
        }

        await transaction.CommitAsync();

        return ServiceResult<ReservationDto>.Ok(new ReservationDto(
            reservation.Id, eventId, seatId, seat.Row, seat.Number, reservation.ExpiresAt));
    }

    public async Task<ServiceResult> CancelAsync(int reservationId, int userId)
    {
        var reservation = await _db.Reservations.FindAsync(reservationId);
        if (reservation is null)
        {
            return ServiceResult.NotFound($"Broneeringut {reservationId} ei leitud.");
        }

        if (reservation.UserId != userId)
        {
            return ServiceResult.Forbidden("Saad tühistada ainult enda broneeringuid.");
        }

        // An expired hold is deleted too; the seat is already free, this just tidies up.
        _db.Reservations.Remove(reservation);
        await _db.SaveChangesAsync();

        return ServiceResult.Ok();
    }
}
