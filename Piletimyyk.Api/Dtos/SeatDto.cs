namespace Piletimyyk.Api.Dtos;

// State is one of the SeatStates values.
public record SeatDto(int SeatId, int Row, int Number, string State);
