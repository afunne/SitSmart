namespace Piletimyyk.Api.Dtos;

/// <summary>Values of <see cref="SeatDto.State"/>.</summary>
public static class SeatStates
{
    public const string Free = "Free";

    /// <summary>Held by an active (unexpired) reservation of another user.</summary>
    public const string Reserved = "Reserved";

    /// <summary>Held by an active reservation of the current user.</summary>
    public const string Mine = "Mine";

    public const string Sold = "Sold";
}
