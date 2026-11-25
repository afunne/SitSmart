namespace Piletimyyk.Api.WebSockets;

/* Tells the clients watching an event (group "event-{eventId}") that one of its seats changed.
   Never throws: a failed notification must not undo a reservation or a sale. */
public interface ISeatNotifier
{
    Task SeatReservedAsync(int eventId, int seatId);
    Task SeatReleasedAsync(int eventId, int seatId);
    Task SeatSoldAsync(int eventId, int seatId);
}

public class SeatNotifier(SeatSocketManager sockets, ILogger<SeatNotifier> logger) : ISeatNotifier
{
    public Task SeatReservedAsync(int eventId, int seatId) => NotifyAsync("SeatReserved", eventId, seatId);

    public Task SeatReleasedAsync(int eventId, int seatId) => NotifyAsync("SeatReleased", eventId, seatId);

    public Task SeatSoldAsync(int eventId, int seatId) => NotifyAsync("SeatSold", eventId, seatId);

    private async Task NotifyAsync(string type, int eventId, int seatId)
    {
        try
        {
            await sockets.SendToGroupAsync(SeatSocketManager.EventGroup(eventId), new SeatMessage(type, eventId, seatId));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Could not send {Type} for seat {SeatId} of event {EventId}.", type, seatId, eventId);
        }
    }

    // Serialized camelCase: {"type":"SeatSold","eventId":1,"seatId":5}
    private sealed record SeatMessage(string Type, int EventId, int SeatId);
}
