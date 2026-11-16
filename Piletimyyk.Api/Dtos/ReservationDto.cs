namespace Piletimyyk.Api.Dtos;

/// <summary>ExpiresAt is in UTC.</summary>
public record ReservationDto(int Id, int EventId, int SeatId, int Row, int Number, DateTime ExpiresAt);
