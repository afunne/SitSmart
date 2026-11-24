using Microsoft.Extensions.Options;

namespace Piletimyyk.Worker;

/// <summary>
/// Asks the API to release expired seat holds: once at startup, then every Worker:IntervalSeconds.
/// A failed run is logged and the next tick tries again; the worker never stops because of it.
/// </summary>
public class ReleaseExpiredReservationsWorker(
    IServiceScopeFactory scopeFactory,
    IOptions<WorkerSettings> settings,
    ILogger<ReleaseExpiredReservationsWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var interval = TimeSpan.FromSeconds(settings.Value.IntervalSeconds);
        logger.LogInformation("Releasing expired reservations every {Interval}.", interval);

        using var timer = new PeriodicTimer(interval);
        try
        {
            do
            {
                await RunOnceAsync(stoppingToken);
            }
            while (await timer.WaitForNextTickAsync(stoppingToken));
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            // Host is shutting down.
        }
    }

    private async Task RunOnceAsync(CancellationToken stoppingToken)
    {
        try
        {
            // A new scope per run, so the API client (and its HttpClient) isn't held for the
            // lifetime of this singleton service.
            using var scope = scopeFactory.CreateScope();
            var api = scope.ServiceProvider.GetRequiredService<PiletimyykApiClient>();

            var result = await api.ReleaseExpiredAsync(stoppingToken);

            if (result.ReleasedCount == 0)
            {
                logger.LogDebug("Released 0 expired reservation(s).");
                return;
            }

            logger.LogInformation("Released {Count} expired reservation(s).", result.ReleasedCount);
            foreach (var seat in result.Seats)
            {
                logger.LogInformation("  Event {EventId}: row {Row}, seat {Number}",
                    seat.EventId, seat.Row, seat.Number);
            }
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            throw; // Shutting down: let ExecuteAsync stop the loop.
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Releasing expired reservations failed; will retry on the next tick.");
        }
    }
}
