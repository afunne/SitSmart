using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text.Json;

namespace Piletimyyk.Api.WebSockets;

/* Keeps the open /ws/seats connections, grouped by name (for example one group per event), and
   pushes JSON messages to every socket in a group. Registered as a singleton. */
public class SeatSocketManager(ILogger<SeatSocketManager> logger)
{
    // camelCase property names, the same as the API's JSON responses.
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    // A client that stops reading must not hold up the request that is broadcasting.
    private static readonly TimeSpan SendTimeout = TimeSpan.FromSeconds(5);

    // Client messages are tiny ({"type":"join","eventId":5}); anything longer is dropped unread.
    private const int MaxMessageBytes = 4 * 1024;

    private readonly ConcurrentDictionary<string, ConcurrentDictionary<Guid, WebSocket>> _groups = new();

    /* A WebSocket allows only one SendAsync at a time, but two requests can broadcast to the same
       group at once, so every connection gets its own send lock. */
    private readonly ConcurrentDictionary<Guid, SemaphoreSlim> _sendLocks = new();

    // The group that receives seat updates for one event.
    public static string EventGroup(int eventId) => $"event-{eventId}";

    /* Runs one accepted /ws/seats connection until it closes. The client picks the event it
       watches with {"type":"join","eventId":5} (one event at a time) and stops with
       {"type":"leave"}. Invalid JSON and unknown types are ignored. */
    public async Task HandleConnectionAsync(WebSocket socket, CancellationToken cancellationToken)
    {
        var connectionId = Guid.NewGuid();
        var buffer = new byte[MaxMessageBytes];
        string? currentGroup = null;

        try
        {
            while (socket.State == WebSocketState.Open)
            {
                var (messageType, length) = await ReceiveMessageAsync(socket, buffer, cancellationToken);

                if (messageType == WebSocketMessageType.Close)
                {
                    RemoveFromAll(connectionId);
                    await socket.CloseAsync(WebSocketCloseStatus.NormalClosure, null, CancellationToken.None);
                    break;
                }

                if (messageType != WebSocketMessageType.Text || length < 0)
                {
                    logger.LogDebug("Ignoring WebSocket message from {ConnectionId}: binary or too long.", connectionId);
                    continue;
                }

                currentGroup = HandleClientMessage(connectionId, socket, buffer.AsSpan(0, length), currentGroup);
            }
        }
        catch (Exception ex) when (ex is WebSocketException or OperationCanceledException)
        {
            // Client disappeared without a close message, or the server is shutting down.
        }
        finally
        {
            RemoveFromAll(connectionId);
        }
    }

    /* Reads one whole message, which may arrive in several frames. Returns length -1 when it did
       not fit in the buffer (the rest is read and thrown away). */
    private static async Task<(WebSocketMessageType Type, int Length)> ReceiveMessageAsync(
        WebSocket socket, byte[] buffer, CancellationToken cancellationToken)
    {
        var count = 0;
        var tooLong = false;

        while (true)
        {
            if (count == buffer.Length)
            {
                tooLong = true;
                count = 0;
            }

            var result = await socket.ReceiveAsync(buffer.AsMemory(count), cancellationToken);
            if (result.MessageType == WebSocketMessageType.Close)
                return (WebSocketMessageType.Close, 0);

            count += result.Count;
            if (result.EndOfMessage)
                return (result.MessageType, tooLong ? -1 : count);
        }
    }

    // Applies one join/leave message and returns the group the connection is in afterwards.
    private string? HandleClientMessage(Guid connectionId, WebSocket socket, ReadOnlySpan<byte> json, string? currentGroup)
    {
        ClientMessage? message;
        try
        {
            message = JsonSerializer.Deserialize<ClientMessage>(json, JsonOptions);
        }
        catch (JsonException ex)
        {
            logger.LogDebug(ex, "Ignoring WebSocket message from {ConnectionId}: invalid JSON.", connectionId);
            return currentGroup;
        }

        switch (message?.Type)
        {
            case "join" when message.EventId is > 0:
                var group = EventGroup(message.EventId.Value);
                if (currentGroup is not null && currentGroup != group)
                    RemoveFromGroup(currentGroup, connectionId);
                AddToGroup(group, connectionId, socket);
                return group;

            case "join":
                logger.LogDebug("Ignoring join from {ConnectionId}: missing or invalid eventId.", connectionId);
                return currentGroup;

            case "leave":
                if (currentGroup is not null)
                    RemoveFromGroup(currentGroup, connectionId);
                return null;

            default:
                logger.LogDebug("Ignoring WebSocket message from {ConnectionId}: unknown type {Type}.", connectionId, message?.Type);
                return currentGroup;
        }
    }

    public void AddToGroup(string group, Guid connectionId, WebSocket socket)
    {
        _sendLocks.GetOrAdd(connectionId, _ => new SemaphoreSlim(1, 1));
        _groups.GetOrAdd(group, _ => new ConcurrentDictionary<Guid, WebSocket>())[connectionId] = socket;
    }

    public void RemoveFromGroup(string group, Guid connectionId)
    {
        if (_groups.TryGetValue(group, out var members))
            members.TryRemove(connectionId, out _);
    }

    /* Removes the connection from every group. Empty groups are kept (there is at most one per
       event), because removing one could race with a socket being added to it. */
    public void RemoveFromAll(Guid connectionId)
    {
        foreach (var members in _groups.Values)
            members.TryRemove(connectionId, out _);

        // Not disposed: a send that is still running may hold it.
        _sendLocks.TryRemove(connectionId, out _);
    }

    // Sends the message as JSON to every open socket in the group; closed or failing sockets are removed.
    public async Task SendToGroupAsync(string group, object message)
    {
        if (!_groups.TryGetValue(group, out var members) || members.IsEmpty)
            return;

        var bytes = JsonSerializer.SerializeToUtf8Bytes(message, message.GetType(), JsonOptions);
        await Task.WhenAll(members.Select(m => SendAsync(m.Key, m.Value, bytes)));
    }

    private async Task SendAsync(Guid connectionId, WebSocket socket, byte[] bytes)
    {
        if (socket.State != WebSocketState.Open || !_sendLocks.TryGetValue(connectionId, out var sendLock))
        {
            RemoveFromAll(connectionId);
            return;
        }

        await sendLock.WaitAsync();
        try
        {
            using var timeout = new CancellationTokenSource(SendTimeout);
            await socket.SendAsync(bytes, WebSocketMessageType.Text, endOfMessage: true, timeout.Token);
        }
        catch (Exception ex) when (ex is WebSocketException or OperationCanceledException or ObjectDisposedException)
        {
            // Closed, gone or too slow (a cancelled send aborts the socket): drop it everywhere.
            logger.LogDebug(ex, "Removing WebSocket {ConnectionId}: send failed.", connectionId);
            RemoveFromAll(connectionId);
        }
        finally
        {
            sendLock.Release();
        }
    }

    // What a client sends: {"type":"join","eventId":5} or {"type":"leave"}.
    private sealed record ClientMessage(string? Type, int? EventId);
}
