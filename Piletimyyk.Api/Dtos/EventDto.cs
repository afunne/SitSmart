namespace Piletimyyk.Api.Dtos;

// StartsAt is in UTC.
public record EventDto(
    int Id,
    string Name,
    string Description,
    string? ImageUrl,
    DateTime StartsAt,
    int HallId,
    string HallName,
    decimal Price,
    int TotalSeats);
