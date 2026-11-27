namespace Piletimyyk.Api.Dtos;

// ExpiresAt is in UTC.
public record ReservationDto(int Id, int EventId, int SeatId, int Row, int Number, DateTime ExpiresAt);
