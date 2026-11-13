using Microsoft.EntityFrameworkCore;
using Piletimyyk.Api.Data;
using Piletimyyk.Api.Dtos;
using Piletimyyk.Api.Models;

namespace Piletimyyk.Api.Services;

public interface IHallService
{
    Task<IReadOnlyList<HallDto>> GetAllAsync();
    Task<ServiceResult<HallDto>> GetByIdAsync(int id);
    Task<ServiceResult<HallDto>> CreateAsync(CreateHallRequest request);
    Task<ServiceResult<HallDto>> UpdateAsync(int id, UpdateHallRequest request);
    Task<ServiceResult> DeleteAsync(int id);
}

public class HallService : IHallService
{
    public const int MaxNameLength = 100; // matches HasMaxLength(100) in AppDbContext
    public const int MaxRows = 50;
    public const int MaxSeatsPerRow = 50;

    private readonly AppDbContext _db;

    public HallService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<HallDto>> GetAllAsync()
    {
        // Sort before projecting: EF can't translate ordering on the HallDto constructor.
        return await ToDtos(_db.Halls.AsNoTracking().OrderBy(h => h.Name))
            .ToListAsync();
    }

    public async Task<ServiceResult<HallDto>> GetByIdAsync(int id)
    {
        var hall = await ToDtos(_db.Halls.AsNoTracking().Where(h => h.Id == id))
            .SingleOrDefaultAsync();

        return hall is null
            ? ServiceResult<HallDto>.NotFound(HallNotFound(id))
            : ServiceResult<HallDto>.Ok(hall);
    }

    public async Task<ServiceResult<HallDto>> CreateAsync(CreateHallRequest request)
    {
        var errors = new List<string>();
        var name = ValidateName(request.Name, errors);

        if (request.Rows is < 1 or > MaxRows)
        {
            errors.Add($"Ridade arv peab olema 1 kuni {MaxRows}.");
        }

        if (request.SeatsPerRow is < 1 or > MaxSeatsPerRow)
        {
            errors.Add($"Kohtade arv reas peab olema 1 kuni {MaxSeatsPerRow}.");
        }

        if (errors.Count > 0)
        {
            return ServiceResult<HallDto>.Validation(string.Join(" ", errors));
        }

        var hall = new Hall { Name = name };
        for (var row = 1; row <= request.Rows; row++)
        {
            for (var number = 1; number <= request.SeatsPerRow; number++)
            {
                hall.Seats.Add(new Seat { Row = row, Number = number });
            }
        }

        _db.Halls.Add(hall);
        await _db.SaveChangesAsync();

        return ServiceResult<HallDto>.Ok(new HallDto(
            hall.Id, hall.Name, request.Rows, request.SeatsPerRow, request.Rows * request.SeatsPerRow));
    }

    public async Task<ServiceResult<HallDto>> UpdateAsync(int id, UpdateHallRequest request)
    {
        var errors = new List<string>();
        var name = ValidateName(request.Name, errors);
        if (errors.Count > 0)
        {
            return ServiceResult<HallDto>.Validation(string.Join(" ", errors));
        }

        var hall = await _db.Halls.FindAsync(id);
        if (hall is null)
        {
            return ServiceResult<HallDto>.NotFound(HallNotFound(id));
        }

        hall.Name = name;
        await _db.SaveChangesAsync();

        return await GetByIdAsync(id);
    }

    public async Task<ServiceResult> DeleteAsync(int id)
    {
        var hall = await _db.Halls.FindAsync(id);
        if (hall is null)
        {
            return ServiceResult.NotFound(HallNotFound(id));
        }

        // Events reference the hall with DeleteBehavior.Restrict, so check first and
        // return a clear message instead of a database error.
        var eventCount = await _db.Events.CountAsync(e => e.HallId == id);
        if (eventCount > 0)
        {
            var events = eventCount == 1 ? "1 üritus" : $"{eventCount} üritust";
            return ServiceResult.Conflict(
                $"Saali ei saa kustutada, sest sellel on {events}. Kustuta või tõsta üritused enne ümber.");
        }

        // Seats are removed with the hall (cascade delete).
        _db.Halls.Remove(hall);
        await _db.SaveChangesAsync();

        return ServiceResult.Ok();
    }

    /// <summary>
    /// Rows and SeatsPerRow aren't stored; seats always form a full grid
    /// (rows 1..Rows, numbers 1..SeatsPerRow), so they are the highest row and seat number.
    /// </summary>
    private static IQueryable<HallDto> ToDtos(IQueryable<Hall> halls)
    {
        return halls.Select(h => new HallDto(
            h.Id,
            h.Name,
            h.Seats.Max(s => (int?)s.Row) ?? 0,
            h.Seats.Max(s => (int?)s.Number) ?? 0,
            h.Seats.Count()));
    }

    private static string ValidateName(string? name, List<string> errors)
    {
        var trimmed = name?.Trim() ?? string.Empty;

        if (trimmed.Length == 0)
        {
            errors.Add("Saali nimi on kohustuslik.");
        }
        else if (trimmed.Length > MaxNameLength)
        {
            errors.Add($"Saali nimi võib olla kuni {MaxNameLength} tähemärki.");
        }

        return trimmed;
    }

    private static string HallNotFound(int id) => $"Saali {id} ei leitud.";
}
