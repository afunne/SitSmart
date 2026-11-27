namespace Piletimyyk.Api.Dtos;

// Result of POST /api/reservations/release-expired. Seats are ordered by event, row, number.
public record ReleaseExpiredResponse(int ReleasedCount, IReadOnlyList<ReleasedSeatDto> Seats);
