namespace Piletimyyk.Api.Services;

/// <summary>Why a service call failed. Controllers map these to 404 / 400 / 409 / 403.</summary>
public enum ServiceErrorType
{
    NotFound,
    Validation,
    Conflict,

    /// <summary>The resource exists but belongs to someone else.</summary>
    Forbidden
}

/// <summary>Outcome of a service call without a return value.</summary>
public class ServiceResult
{
    protected ServiceResult(
        bool success,
        string? error,
        ServiceErrorType? errorType,
        IReadOnlyDictionary<string, object?>? errorData = null)
    {
        Success = success;
        Error = error;
        ErrorType = errorType;
        ErrorData = errorData;
    }

    public bool Success { get; }

    /// <summary>User-facing error message; null when Success is true.</summary>
    public string? Error { get; }

    public ServiceErrorType? ErrorType { get; }

    /// <summary>
    /// Extra machine-readable fields for the error response (e.g. "usedAt"), so clients don't
    /// have to parse them out of the message. Added to the ProblemDetails as extensions.
    /// </summary>
    public IReadOnlyDictionary<string, object?>? ErrorData { get; }

    public static ServiceResult Ok() => new(true, null, null);
    public static ServiceResult NotFound(string error) => new(false, error, ServiceErrorType.NotFound);
    public static ServiceResult Validation(string error) => new(false, error, ServiceErrorType.Validation);
    public static ServiceResult Conflict(string error) => new(false, error, ServiceErrorType.Conflict);
    public static ServiceResult Forbidden(string error) => new(false, error, ServiceErrorType.Forbidden);
}

/// <summary>Outcome of a service call that returns a value on success.</summary>
public class ServiceResult<T> : ServiceResult
{
    private ServiceResult(
        bool success,
        T? value,
        string? error,
        ServiceErrorType? errorType,
        IReadOnlyDictionary<string, object?>? errorData = null)
        : base(success, error, errorType, errorData)
    {
        Value = value;
    }

    /// <summary>The result; only set when Success is true.</summary>
    public T? Value { get; }

    public static ServiceResult<T> Ok(T value) => new(true, value, null, null);
    public new static ServiceResult<T> NotFound(string error) => new(false, default, error, ServiceErrorType.NotFound);
    public new static ServiceResult<T> Validation(string error) => new(false, default, error, ServiceErrorType.Validation);
    public new static ServiceResult<T> Conflict(string error) => new(false, default, error, ServiceErrorType.Conflict);

    /// <summary>Conflict with extra fields for the client; see <see cref="ServiceResult.ErrorData"/>.</summary>
    public static ServiceResult<T> Conflict(string error, IReadOnlyDictionary<string, object?> errorData) =>
        new(false, default, error, ServiceErrorType.Conflict, errorData);
    public new static ServiceResult<T> Forbidden(string error) => new(false, default, error, ServiceErrorType.Forbidden);
}
