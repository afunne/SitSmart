namespace Piletimyyk.Api.Dtos;

/// <summary>A seat that became free again because its hold expired.</summary>
public record ReleasedSeatDto(int EventId, int SeatId, int Row, int Number);
