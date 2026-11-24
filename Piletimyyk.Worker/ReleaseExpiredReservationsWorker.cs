using Microsoft.Extensions.Options;

namespace Piletimyyk.Worker;

/* Asks the API to release expired seat holds: once at startup, then every Worker:IntervalSeconds.
   A failed run is logged and the next tick tries again; the worker never stops because of it. */
public class ReleaseExpiredReservationsWorker(
    PiletimyykApiClient api,
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
