namespace Piletimyyk.Worker;

/// <summary>Talks to the Piletimyyk API over HTTP.</summary>
public class PiletimyykApiClient
{
    /// <summary>Calls POST api/reservations/release-expired and returns the seats that were freed.</summary>
    public Task<ReleaseExpiredResponse> ReleaseExpiredAsync(CancellationToken cancellationToken)
    {
        // Implemented in the next step (login + HTTP call).
        throw new NotImplementedException();
    }
}
