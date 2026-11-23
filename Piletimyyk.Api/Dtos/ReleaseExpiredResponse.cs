namespace Piletimyyk.Api.Dtos;

/// <summary>Result of POST /api/reservations/release-expired. Seats are ordered by event, row, number.</summary>
public record ReleaseExpiredResponse(int ReleasedCount, IReadOnlyList<ReleasedSeatDto> Seats);
