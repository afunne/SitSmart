namespace Piletimyyk.Worker;

// Copies of the API's JSON contracts (Piletimyyk.Api/Dtos). The worker talks to the API only
// over HTTP and doesn't reference that project, so keep these in sync by hand. Only the fields
// the worker uses are declared; System.Text.Json ignores the rest.

/// <summary>Body of POST api/auth/login.</summary>
public record LoginRequest(string Email, string Password);

/// <summary>Response of POST api/auth/login (the API also sends email, role and expiresAt).</summary>
public record LoginResponse(string Token);

/// <summary>A seat that became free again because its hold expired.</summary>
public record ReleasedSeatDto(int EventId, int SeatId, int Row, int Number);

/// <summary>Response of POST api/reservations/release-expired.</summary>
public record ReleaseExpiredResponse(int ReleasedCount, IReadOnlyList<ReleasedSeatDto> Seats);
