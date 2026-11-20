using Microsoft.EntityFrameworkCore;
using Piletimyyk.Api.Data;
using Piletimyyk.Api.Dtos;

namespace Piletimyyk.Api.Services;

public interface ITicketService
{
    /// <summary>
    /// The user's tickets: upcoming events first (soonest first), then past events
    /// (most recent first).
    /// </summary>
    Task<IReadOnlyList<TicketDto>> GetForUserAsync(int userId);
}

public class TicketService : ITicketService
{
    private readonly AppDbContext _db;

    public TicketService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<TicketDto>> GetForUserAsync(int userId)
    {
        // SQLite doesn't store DateTimeKind; times are saved as UTC, so mark them as such
        // (otherwise they serialize without the "Z").
        var tickets = await _db.Tickets.AsNoTracking()
            .Where(t => t.UserId == userId)
            .Select(t => new TicketDto(
                t.Id, t.Code, t.Event.Name,
                DateTime.SpecifyKind(t.Event.StartTime, DateTimeKind.Utc),
                t.Event.Hall.Name, t.Seat.Row, t.Seat.Number, t.Price,
                DateTime.SpecifyKind(t.PurchasedAt, DateTimeKind.Utc),
                t.UsedAt.HasValue ? DateTime.SpecifyKind(t.UsedAt.Value, DateTimeKind.Utc) : null))
            .ToListAsync();

        // Sorted in memory: one user has few tickets, and the two halves sort in
        // opposite directions, which doesn't translate to a single ORDER BY cleanly.
        var now = DateTime.UtcNow;
        var upcoming = tickets.Where(t => t.StartsAt >= now)
            .OrderBy(t => t.StartsAt).ThenBy(t => t.Row).ThenBy(t => t.Number);
        var past = tickets.Where(t => t.StartsAt < now)
            .OrderByDescending(t => t.StartsAt).ThenBy(t => t.Row).ThenBy(t => t.Number);

        return upcoming.Concat(past).ToList();
    }
}
