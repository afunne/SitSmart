namespace Piletimyyk.Api.Dtos;

// Seats are ordered by row, then by number.
public record SeatMapDto(int EventId, string HallName, int Rows, int SeatsPerRow, IReadOnlyList<SeatDto> Seats);
