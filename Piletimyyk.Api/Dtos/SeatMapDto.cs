namespace Piletimyyk.Api.Dtos;

/// <summary>Seats are ordered by row, then by number.</summary>
public record SeatMapDto(int EventId, string HallName, int Rows, int SeatsPerRow, IReadOnlyList<SeatDto> Seats);
