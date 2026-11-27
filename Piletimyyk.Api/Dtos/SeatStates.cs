namespace Piletimyyk.Api.Dtos;

// Values of SeatDto.State.
public static class SeatStates
{
    public const string Free = "Free";

    // Held by an active (unexpired) reservation of another user.
    public const string Reserved = "Reserved";

    // Held by an active reservation of the current user.
    public const string Mine = "Mine";

    public const string Sold = "Sold";
}
