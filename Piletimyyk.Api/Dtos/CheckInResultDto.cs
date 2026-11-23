namespace Piletimyyk.Api.Dtos;

/// <summary>A ticket that was just checked in at the door. UsedAt is in UTC.</summary>
public record CheckInResultDto(string Code, string EventName, int Row, int Number, DateTime UsedAt);
