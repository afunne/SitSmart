namespace Piletimyyk.Worker;

/// <summary>The "Worker" section of appsettings.json. Password comes from user-secrets.</summary>
public class WorkerSettings
{
    public const string SectionName = "Worker";

    /// <summary>Base URL of the API, ending in "/" so relative paths are appended to it.</summary>
    public string ApiBaseUrl { get; set; } = string.Empty;

    /// <summary>Login endpoint, relative to ApiBaseUrl.</summary>
    public string LoginPath { get; set; } = string.Empty;

    /// <summary>Account with the Service role that the worker logs in as.</summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>Not in appsettings: set with <c>dotnet user-secrets set "Worker:Password" "..."</c>.</summary>
    public string Password { get; set; } = string.Empty;

    /// <summary>How often expired reservations are released.</summary>
    public int IntervalSeconds { get; set; } = 60;
}
