namespace Piletimyyk.Api.Dtos;

/// <summary>State is one of the <see cref="SeatStates"/> values.</summary>
public record SeatDto(int SeatId, int Row, int Number, string State);
