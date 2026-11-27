namespace Piletimyyk.Api.Dtos;

// StartsAt, PurchasedAt and UsedAt are in UTC. UsedAt is null until the ticket is scanned.
public record TicketDto(
    int Id,
    string Code,
    string EventName,
    DateTime StartsAt,
    string HallName,
    int Row,
    int Number,
    decimal Price,
    DateTime PurchasedAt,
    DateTime? UsedAt);
