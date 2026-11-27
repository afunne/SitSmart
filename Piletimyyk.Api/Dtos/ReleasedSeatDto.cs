namespace Piletimyyk.Api.Dtos;

// A seat that became free again because its hold expired.
public record ReleasedSeatDto(int EventId, int SeatId, int Row, int Number);
