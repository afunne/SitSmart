namespace Piletimyyk.Api.Dtos;

// A ticket that was just checked in at the door. UsedAt is in UTC.
public record CheckInResultDto(string Code, string EventName, int Row, int Number, DateTime UsedAt);
