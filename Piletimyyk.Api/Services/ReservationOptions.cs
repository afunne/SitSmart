namespace Piletimyyk.Api.Services;

public class ReservationOptions
{
    public const string SectionName = "Reservations";

    // How long a reserved seat is held before it is released again.
    public int HoldMinutes { get; set; } = 10;
}
