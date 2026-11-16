namespace Piletimyyk.Api.Dtos;

/// <summary>StartsAt is in UTC.</summary>
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
