namespace Piletimyyk.Worker;

// The "Worker" section of appsettings.json. Password comes from user-secrets.
public class WorkerSettings
{
    public const string SectionName = "Worker";

    // Base URL of the API, ending in "/" so relative paths are appended to it.
    public string ApiBaseUrl { get; set; } = string.Empty;

    // Login endpoint, relative to ApiBaseUrl.
    public string LoginPath { get; set; } = string.Empty;

    // Account with the Service role that the worker logs in as.
    public string Email { get; set; } = string.Empty;

    // Not in appsettings: set with dotnet user-secrets set "Worker:Password" "...".
    public string Password { get; set; } = string.Empty;

    // How often expired reservations are released.
    public int IntervalSeconds { get; set; } = 60;
}
