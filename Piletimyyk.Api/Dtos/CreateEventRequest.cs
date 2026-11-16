namespace Piletimyyk.Api.Dtos;

/// <summary>StartsAt should be sent in UTC (ISO 8601 with "Z"); a time without an offset is treated as UTC.</summary>
public record CreateEventRequest(
    string Name,
    string Description,
    string? ImageUrl,
    DateTime StartsAt,
    int HallId,
    decimal Price);
