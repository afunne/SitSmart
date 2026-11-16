using Microsoft.EntityFrameworkCore;
using Piletimyyk.Api.Data;
using Piletimyyk.Api.Dtos;
using Piletimyyk.Api.Models;

namespace Piletimyyk.Api.Services;

public interface IEventService
{
    Task<IReadOnlyList<EventDto>> GetAllAsync();
    Task<ServiceResult<EventDto>> GetByIdAsync(int id);
    Task<ServiceResult<EventDto>> CreateAsync(CreateEventRequest request);
    Task<ServiceResult<EventDto>> UpdateAsync(int id, UpdateEventRequest request);
    Task<ServiceResult> DeleteAsync(int id);
}

public class EventService : IEventService
{
    // These match the column limits in AppDbContext.
    public const int MaxNameLength = 100;
    public const int MaxDescriptionLength = 1000;
    public const int MaxImageUrlLength = 500;
    public const decimal MaxPrice = 99_999_999.99m; // decimal(10,2)

    private readonly AppDbContext _db;

    public EventService(AppDbContext db)
    {
        _db = db;
    }

    /// <summary>Upcoming events first (soonest first), then past events (most recent first).</summary>
    public async Task<IReadOnlyList<EventDto>> GetAllAsync()
    {
        var now = DateTime.UtcNow;

        // Sort before projecting: EF can't translate ordering on the EventDto constructor.
        var events = _db.Events.AsNoTracking()
            .OrderBy(e => e.StartTime < now)
            .ThenBy(e => e.StartTime >= now ? e.StartTime : DateTime.MaxValue)
            .ThenByDescending(e => e.StartTime);

        return await ToDtos(events).ToListAsync();
    }

    public async Task<ServiceResult<EventDto>> GetByIdAsync(int id)
    {
        var ev = await ToDtos(_db.Events.AsNoTracking().Where(e => e.Id == id))
            .SingleOrDefaultAsync();

        return ev is null
            ? ServiceResult<EventDto>.NotFound(EventNotFound(id))
            : ServiceResult<EventDto>.Ok(ev);
    }

    public async Task<ServiceResult<EventDto>> CreateAsync(CreateEventRequest request)
    {
        var errors = new List<string>();
        var input = await ValidateAsync(
            request.Name, request.Description, request.ImageUrl, request.StartsAt, request.HallId, request.Price,
            requireFutureStart: true, errors);

        if (errors.Count > 0)
        {
            return ServiceResult<EventDto>.Validation(string.Join(" ", errors));
        }

        var ev = new Event();
        input.ApplyTo(ev);

        _db.Events.Add(ev);
        await _db.SaveChangesAsync();

        return await GetByIdAsync(ev.Id);
    }

    public async Task<ServiceResult<EventDto>> UpdateAsync(int id, UpdateEventRequest request)
    {
        var ev = await _db.Events.FindAsync(id);
        if (ev is null)
        {
            return ServiceResult<EventDto>.NotFound(EventNotFound(id));
        }

        // Only require a future start when the time is being changed, so an event that has
        // already started (or passed) can still get e.g. a corrected description.
        var startsAt = ToUtc(request.StartsAt);
        var errors = new List<string>();
        var input = await ValidateAsync(
            request.Name, request.Description, request.ImageUrl, startsAt, request.HallId, request.Price,
            requireFutureStart: startsAt != ev.StartTime, errors);

        if (errors.Count > 0)
        {
            return ServiceResult<EventDto>.Validation(string.Join(" ", errors));
        }

        // Tickets and reservations point at seats of the current hall, so moving the event
        // to another hall would leave them pointing at seats that no longer belong to it.
        if (input.HallId != ev.HallId)
        {
            var now = DateTime.UtcNow;
            var seatsTaken =
                await _db.Tickets.AnyAsync(t => t.EventId == id) ||
                await _db.Reservations.AnyAsync(r => r.EventId == id && r.ExpiresAt > now);

            if (seatsTaken)
            {
                return ServiceResult<EventDto>.Conflict(
                    "Ürituse saali ei saa muuta, sest sellele on juba müüdud või broneeritud kohti.");
            }
        }

        input.ApplyTo(ev);
        await _db.SaveChangesAsync();

        return await GetByIdAsync(id);
    }

    public async Task<ServiceResult> DeleteAsync(int id)
    {
        var ev = await _db.Events.FindAsync(id);
        if (ev is null)
        {
            return ServiceResult.NotFound(EventNotFound(id));
        }

        // Tickets reference the event with DeleteBehavior.Restrict, so check first and
        // return a clear message instead of a database error.
        var ticketCount = await _db.Tickets.CountAsync(t => t.EventId == id);
        if (ticketCount > 0)
        {
            return ServiceResult.Conflict(TicketsSold(ticketCount));
        }

        // Reservations are only temporary seat holds, so they go with the event
        // (they are also Restrict in the database, so they must be removed explicitly).
        var reservations = await _db.Reservations.Where(r => r.EventId == id).ToListAsync();
        _db.Reservations.RemoveRange(reservations);
        _db.Events.Remove(ev);

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            // A ticket was sold between the check above and the delete.
            return ServiceResult.Conflict(TicketsSold(await _db.Tickets.CountAsync(t => t.EventId == id)));
        }

        return ServiceResult.Ok();
    }

    private static IQueryable<EventDto> ToDtos(IQueryable<Event> events)
    {
        return events.Select(e => new EventDto(
            e.Id,
            e.Name,
            e.Description ?? string.Empty,
            e.ImageUrl,
            // SQLite doesn't store DateTimeKind; times are saved as UTC, so mark them as such
            // to get a "Z" suffix in the JSON response.
            DateTime.SpecifyKind(e.StartTime, DateTimeKind.Utc),
            e.HallId,
            e.Hall.Name,
            e.Price,
            e.Hall.Seats.Count()));
    }

    private async Task<EventInput> ValidateAsync(
        string? name,
        string? description,
        string? imageUrl,
        DateTime startsAt,
        int hallId,
        decimal price,
        bool requireFutureStart,
        List<string> errors)
    {
        var trimmedName = name?.Trim() ?? string.Empty;
        if (trimmedName.Length == 0)
        {
            errors.Add("Ürituse nimi on kohustuslik.");
        }
        else if (trimmedName.Length > MaxNameLength)
        {
            errors.Add($"Ürituse nimi võib olla kuni {MaxNameLength} tähemärki.");
        }

        var trimmedDescription = description?.Trim() ?? string.Empty;
        if (trimmedDescription.Length > MaxDescriptionLength)
        {
            errors.Add($"Kirjeldus võib olla kuni {MaxDescriptionLength} tähemärki.");
        }

        var trimmedImageUrl = string.IsNullOrWhiteSpace(imageUrl) ? null : imageUrl.Trim();
        if (trimmedImageUrl is not null)
        {
            if (trimmedImageUrl.Length > MaxImageUrlLength)
            {
                errors.Add($"Pildi URL võib olla kuni {MaxImageUrlLength} tähemärki.");
            }
            else if (!Uri.TryCreate(trimmedImageUrl, UriKind.Absolute, out var uri) ||
                     (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
            {
                errors.Add("Pildi URL peab olema kehtiv http- või https-aadress.");
            }
        }

        var startsAtUtc = ToUtc(startsAt);
        if (requireFutureStart && startsAtUtc <= DateTime.UtcNow)
        {
            errors.Add("Algusaeg peab olema tulevikus.");
        }

        if (price < 0)
        {
            errors.Add("Hind ei tohi olla negatiivne.");
        }
        else if (price > MaxPrice)
        {
            errors.Add($"Hind võib olla kuni {MaxPrice}.");
        }
        else if (price != decimal.Round(price, 2))
        {
            errors.Add("Hinnal võib olla kuni 2 komakohta.");
        }

        if (!await _db.Halls.AnyAsync(h => h.Id == hallId))
        {
            errors.Add($"Saali {hallId} ei leitud.");
        }

        return new EventInput(
            trimmedName,
            trimmedDescription.Length == 0 ? null : trimmedDescription,
            trimmedImageUrl,
            startsAtUtc,
            hallId,
            price);
    }

    /// <summary>
    /// Times are stored in UTC. JSON times with "Z" or an offset arrive as Utc/Local;
    /// a time without an offset (Unspecified) is assumed to already be UTC.
    /// </summary>
    private static DateTime ToUtc(DateTime value) => value.Kind switch
    {
        DateTimeKind.Utc => value,
        DateTimeKind.Local => value.ToUniversalTime(),
        _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
    };

    private static string EventNotFound(int id) => $"Üritust {id} ei leitud.";

    private static string TicketsSold(int count)
    {
        var tickets = count == 1 ? "1 pilet" : $"{count} piletit";
        return $"Üritust ei saa kustutada, sest sellele on müüdud {tickets}.";
    }

    /// <summary>Validated and normalized request values.</summary>
    private record EventInput(
        string Name,
        string? Description,
        string? ImageUrl,
        DateTime StartsAt,
        int HallId,
        decimal Price)
    {
        public void ApplyTo(Event ev)
        {
            ev.Name = Name;
            ev.Description = Description;
            ev.ImageUrl = ImageUrl;
            ev.StartTime = StartsAt;
            ev.HallId = HallId;
            ev.Price = Price;
        }
    }
}
