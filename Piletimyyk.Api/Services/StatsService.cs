using Microsoft.EntityFrameworkCore;
using Piletimyyk.Api.Data;
using Piletimyyk.Api.Dtos;
using Piletimyyk.Api.Models;

namespace Piletimyyk.Api.Services;

public interface IStatsService
{
    // NotFound: no such event.
    Task<ServiceResult<EventStatsDto>> GetEventStatsAsync(int eventId);

    // Every event, in order of start time.
    Task<IReadOnlyList<EventStatsDto>> GetAllStatsAsync();
}

public class StatsService : IStatsService
{
    private readonly AppDbContext _db;

    public StatsService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<ServiceResult<EventStatsDto>> GetEventStatsAsync(int eventId)
    {
        var stats = await GetStatsAsync(_db.Events.Where(e => e.Id == eventId));
        return stats.Count == 0
            ? ServiceResult<EventStatsDto>.NotFound($"Üritust {eventId} ei leitud.")
            : ServiceResult<EventStatsDto>.Ok(stats[0]);
    }

    public async Task<IReadOnlyList<EventStatsDto>> GetAllStatsAsync()
    {
        return await GetStatsAsync(_db.Events);
    }

    /* Two queries however many events there are: the counts in one (subqueries per event), the
       ticket prices in the other. */
    private async Task<List<EventStatsDto>> GetStatsAsync(IQueryable<Event> events)
    {
        var now = DateTime.UtcNow;

        var counts = await events.AsNoTracking()
            .OrderBy(e => e.StartTime)
            .ThenBy(e => e.Id)
            .Select(e => new
            {
                e.Id,
                e.Name,
                TotalSeats = e.Hall.Seats.Count,
                Sold = _db.Tickets.Count(t => t.EventId == e.Id),
                CheckedIn = _db.Tickets.Count(t => t.EventId == e.Id && t.UsedAt != null),
                // Like the seat map: a sold seat counts as Sold even if a stale hold still points at it.
                Reserved = _db.Reservations.Count(r => r.EventId == e.Id && r.ExpiresAt > now
                    && !_db.Tickets.Any(t => t.EventId == r.EventId && t.SeatId == r.SeatId))
            })
            .ToListAsync();

        // SQLite can't SUM decimals (EF stores them as text), so the prices are added up here.
        var prices = await _db.Tickets.AsNoTracking()
            .Where(t => events.Select(e => e.Id).Contains(t.EventId))
            .Select(t => new { t.EventId, t.Price })
            .ToListAsync();

        var revenueByEvent = prices
            .GroupBy(t => t.EventId)
            .ToDictionary(g => g.Key, g => g.Sum(t => t.Price));

        return counts
            .Select(c => new EventStatsDto(
                c.Id,
                c.Name,
                c.TotalSeats,
                c.Sold,
                c.Reserved,
                Math.Max(0, c.TotalSeats - c.Sold - c.Reserved),
                c.CheckedIn,
                FillPercent(c.Sold, c.TotalSeats),
                revenueByEvent.GetValueOrDefault(c.Id)))
            .ToList();
    }

    // 1 of 3 sold → 33.3. A hall without seats is 0 % full rather than a division by zero.
    private static decimal FillPercent(int sold, int totalSeats) =>
        totalSeats == 0 ? 0 : Math.Round(sold * 100m / totalSeats, 1, MidpointRounding.AwayFromZero);
}
