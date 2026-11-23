using Microsoft.EntityFrameworkCore;
using Piletimyyk.Api.Data;
using Piletimyyk.Api.Dtos;

namespace Piletimyyk.Api.Services;

public interface ICheckInService
{
    /// <summary>
    /// Marks the ticket as used. NotFound: no such ticket. Conflict: it was already used
    /// (the message includes when).
    /// </summary>
    Task<ServiceResult<CheckInResultDto>> CheckInAsync(string code);
}

public class CheckInService : ICheckInService
{
    private readonly AppDbContext _db;

    public CheckInService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<ServiceResult<CheckInResultDto>> CheckInAsync(string code)
    {
        // Codes are generated in upper case; accept a hand-typed lower-case one too.
        var normalized = code.Trim().ToUpperInvariant();
        var now = DateTime.UtcNow;

        // A single conditional UPDATE instead of read-then-save: if two controllers scan the
        // same ticket at once, the database lets only one of them change UsedAt from null, and
        // the other gets 0 affected rows.
        var updated = await _db.Tickets
            .Where(t => t.Code == normalized && t.UsedAt == null)
            .ExecuteUpdateAsync(s => s.SetProperty(t => t.UsedAt, now));

        var ticket = await _db.Tickets.AsNoTracking()
            .Where(t => t.Code == normalized)
            .Select(t => new { t.Code, EventName = t.Event.Name, t.Seat.Row, t.Seat.Number, t.UsedAt })
            .SingleOrDefaultAsync();

        if (ticket is null)
        {
            return ServiceResult<CheckInResultDto>.NotFound("Piletit ei leitud.");
        }

        if (updated == 0)
        {
            // UsedAt is never cleared, so 0 rows for an existing ticket means it was already used.
            // SQLite doesn't store DateTimeKind; the time was saved as UTC.
            var usedAt = DateTime.SpecifyKind(ticket.UsedAt!.Value, DateTimeKind.Utc);
            return ServiceResult<CheckInResultDto>.Conflict(
                $"Pilet on juba kasutatud ({usedAt:yyyy-MM-dd HH:mm:ss} UTC).");
        }

        return ServiceResult<CheckInResultDto>.Ok(
            new CheckInResultDto(ticket.Code, ticket.EventName, ticket.Row, ticket.Number, now));
    }
}
