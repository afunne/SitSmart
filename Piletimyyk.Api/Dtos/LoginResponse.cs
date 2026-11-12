namespace Piletimyyk.Api.Dtos;

public record LoginResponse(string Token, string Email, string Role, DateTime ExpiresAt);
