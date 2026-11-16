namespace Piletimyyk.Api.Services;

public class ReservationOptions
{
    public const string SectionName = "Reservations";

    /// <summary>How long a reserved seat is held before it is released again.</summary>
    public int HoldMinutes { get; set; } = 10;
}
