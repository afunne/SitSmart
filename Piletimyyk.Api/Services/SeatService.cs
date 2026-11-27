using Microsoft.EntityFrameworkCore;
using Piletimyyk.Api.Data;
using Piletimyyk.Api.Dtos;

namespace Piletimyyk.Api.Services;

public interface ISeatService
{
    /* Seat map of an event's hall with the current state of every seat.
       When currentUserId is given, seats held by that user's active
       reservations are marked SeatStates.Mine instead of Reserved. */
    Task<ServiceResult<SeatMapDto>> GetSeatMapAsync(int eventId, int? currentUserId = null);
}

public class SeatService : ISeatService
{
    private readonly AppDbContext _db;

    public SeatService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<ServiceResult<SeatMapDto>> GetSeatMapAsync(int eventId, int? currentUserId = null)
    {
        var ev = await _db.Events.AsNoTracking()
            .Where(e => e.Id == eventId)
            .Select(e => new { e.HallId, HallName = e.Hall.Name })
            .SingleOrDefaultAsync();

        if (ev is null)
        {
            return ServiceResult<SeatMapDto>.NotFound($"Üritust {eventId} ei leitud.");
        }

        // Three set-based queries instead of one per seat.
        var seats = await _db.Seats.AsNoTracking()
            .Where(s => s.HallId == ev.HallId)
            .OrderBy(s => s.Row)
            .ThenBy(s => s.Number)
            .Select(s => new { s.Id, s.Row, s.Number })
            .ToListAsync();

        var soldSeatIds = (await _db.Tickets.AsNoTracking()
                .Where(t => t.EventId == eventId)
                .Select(t => t.SeatId)
                .ToListAsync())
            .ToHashSet();

        var now = DateTime.UtcNow;
        var activeReservations = await _db.Reservations.AsNoTracking()
            .Where(r => r.EventId == eventId && r.ExpiresAt > now)
            .Select(r => new { r.SeatId, r.UserId })
            .ToListAsync();

        // Seat id -> held by the current user. A seat should have at most one active
        // reservation, but if there are several, the current user's one wins.
        var reservedSeats = activeReservations
            .GroupBy(r => r.SeatId)
            .ToDictionary(g => g.Key, g => currentUserId is not null && g.Any(r => r.UserId == currentUserId));

        var seatDtos = seats
            .Select(s => new SeatDto(s.Id, s.Row, s.Number, GetState(s.Id)))
            .ToList();

        // Seats always form a full grid (see HallService), so the highest row and
        // number are the hall's dimensions.
        var rows = seats.Count == 0 ? 0 : seats.Max(s => s.Row);
        var seatsPerRow = seats.Count == 0 ? 0 : seats.Max(s => s.Number);

        return ServiceResult<SeatMapDto>.Ok(new SeatMapDto(eventId, ev.HallName, rows, seatsPerRow, seatDtos));

        string GetState(int seatId)
        {
            // A sold seat stays Sold even if a stale reservation still points at it.
            if (soldSeatIds.Contains(seatId))
            {
                return SeatStates.Sold;
            }

            if (reservedSeats.TryGetValue(seatId, out var mine))
            {
                return mine ? SeatStates.Mine : SeatStates.Reserved;
            }

            return SeatStates.Free;
        }
    }
}
