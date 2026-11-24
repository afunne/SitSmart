using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.Extensions.Options;

namespace Piletimyyk.Worker;

/* Talks to the Piletimyyk API over HTTP as the Service account. Registered as a singleton so the
   JWT is cached between runs; it logs in on first use and again whenever the API answers 401. */
public class PiletimyykApiClient(
    IHttpClientFactory httpClientFactory,
    IOptions<WorkerSettings> settings,
    ILogger<PiletimyykApiClient> logger)
{
    // Name of the HttpClient registered in Program.cs (BaseAddress = Worker:ApiBaseUrl).
    public const string HttpClientName = "PiletimyykApi";

    private const string ReleaseExpiredPath = "api/reservations/release-expired";

    private readonly SemaphoreSlim _loginLock = new(1, 1);
    private string? _token;

    // Calls POST api/reservations/release-expired and returns the seats that were freed.
    public async Task<ReleaseExpiredResponse> ReleaseExpiredAsync(CancellationToken cancellationToken)
    {
        using var response = await SendAuthorizedAsync(HttpMethod.Post, ReleaseExpiredPath, cancellationToken);
        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<ReleaseExpiredResponse>(cancellationToken)
            ?? throw new InvalidOperationException($"{ReleaseExpiredPath} returned an empty body.");
    }

    // Sends a request with the cached token; on 401 logs in again and retries once.
    private async Task<HttpResponseMessage> SendAuthorizedAsync(
        HttpMethod method, string path, CancellationToken cancellationToken)
    {
        var client = httpClientFactory.CreateClient(HttpClientName);

        var token = await GetTokenAsync(staleToken: null, cancellationToken);
        var response = await SendAsync(client, method, path, token, cancellationToken);
        if (response.StatusCode != HttpStatusCode.Unauthorized)
            return response;

        response.Dispose();
        logger.LogInformation("API answered 401 for {Path}; logging in again.", path);

        token = await GetTokenAsync(staleToken: token, cancellationToken);
        return await SendAsync(client, method, path, token, cancellationToken);
    }

    private static async Task<HttpResponseMessage> SendAsync(
        HttpClient client, HttpMethod method, string path, string token, CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(method, path);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return await client.SendAsync(request, cancellationToken);
    }

    /* Returns the cached token, or logs in if there is none or the cached one is
       staleToken (the token the API just rejected). */
    private async Task<string> GetTokenAsync(string? staleToken, CancellationToken cancellationToken)
    {
        await _loginLock.WaitAsync(cancellationToken);
        try
        {
            // Another caller may have logged in while we waited for the lock.
            if (_token is not null && _token != staleToken)
                return _token;

            _token = null;
            _token = await LoginAsync(cancellationToken);
            return _token;
        }
        finally
        {
            _loginLock.Release();
        }
    }

    private async Task<string> LoginAsync(CancellationToken cancellationToken)
    {
        var s = settings.Value;
        var client = httpClientFactory.CreateClient(HttpClientName);

        using var response = await client.PostAsJsonAsync(
            s.LoginPath, new LoginRequest(s.Email, s.Password), cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException(
                $"Login as {s.Email} failed: {(int)response.StatusCode} {response.ReasonPhrase}.",
                inner: null, response.StatusCode);
        }

        var login = await response.Content.ReadFromJsonAsync<LoginResponse>(cancellationToken);
        if (string.IsNullOrEmpty(login?.Token))
            throw new InvalidOperationException($"Login as {s.Email} returned no token.");

        logger.LogInformation("Logged in to the API as {Email}.", s.Email);
        return login.Token;
    }
}
