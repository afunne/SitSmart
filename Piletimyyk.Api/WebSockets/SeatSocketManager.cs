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

    private readonly ConcurrentDictionary<string, ConcurrentDictionary<Guid, WebSocket>> _groups = new();

    /* A WebSocket allows only one SendAsync at a time, but two requests can broadcast to the same
       group at once, so every connection gets its own send lock. */
    private readonly ConcurrentDictionary<Guid, SemaphoreSlim> _sendLocks = new();

    public void AddToGroup(string group, Guid connectionId, WebSocket socket)
    {
        _sendLocks.GetOrAdd(connectionId, _ => new SemaphoreSlim(1, 1));
        _groups.GetOrAdd(group, _ => new ConcurrentDictionary<Guid, WebSocket>())[connectionId] = socket;
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
}
