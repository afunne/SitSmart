namespace Piletimyyk.Api.Services;

// Why a service call failed. Controllers map these to 404 / 400 / 409 / 403.
public enum ServiceErrorType
{
    NotFound,
    Validation,
    Conflict,

    // The resource exists but belongs to someone else.
    Forbidden
}

// Outcome of a service call without a return value.
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

    // User-facing error message; null when Success is true.
    public string? Error { get; }

    public ServiceErrorType? ErrorType { get; }

    /* Extra machine-readable fields for the error response (e.g. "usedAt"), so clients don't
       have to parse them out of the message. Added to the ProblemDetails as extensions. */
    public IReadOnlyDictionary<string, object?>? ErrorData { get; }

    public static ServiceResult Ok() => new(true, null, null);
    public static ServiceResult NotFound(string error) => new(false, error, ServiceErrorType.NotFound);
    public static ServiceResult Validation(string error) => new(false, error, ServiceErrorType.Validation);
    public static ServiceResult Conflict(string error) => new(false, error, ServiceErrorType.Conflict);
    public static ServiceResult Forbidden(string error) => new(false, error, ServiceErrorType.Forbidden);
}

// Outcome of a service call that returns a value on success.
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

    // The result; only set when Success is true.
    public T? Value { get; }

    public static ServiceResult<T> Ok(T value) => new(true, value, null, null);
    public new static ServiceResult<T> NotFound(string error) => new(false, default, error, ServiceErrorType.NotFound);
    public new static ServiceResult<T> Validation(string error) => new(false, default, error, ServiceErrorType.Validation);
    public new static ServiceResult<T> Conflict(string error) => new(false, default, error, ServiceErrorType.Conflict);

    // Conflict with extra fields for the client; see ServiceResult.ErrorData.
    public static ServiceResult<T> Conflict(string error, IReadOnlyDictionary<string, object?> errorData) =>
        new(false, default, error, ServiceErrorType.Conflict, errorData);
    public new static ServiceResult<T> Forbidden(string error) => new(false, default, error, ServiceErrorType.Forbidden);
}
