namespace Piletimyyk.Api.Services;

/// <summary>Why a service call failed. Controllers map these to 404 / 400 / 409.</summary>
public enum ServiceErrorType
{
    NotFound,
    Validation,
    Conflict
}

/// <summary>Outcome of a service call without a return value.</summary>
public class ServiceResult
{
    protected ServiceResult(bool success, string? error, ServiceErrorType? errorType)
    {
        Success = success;
        Error = error;
        ErrorType = errorType;
    }

    public bool Success { get; }

    /// <summary>User-facing error message; null when Success is true.</summary>
    public string? Error { get; }

    public ServiceErrorType? ErrorType { get; }

    public static ServiceResult Ok() => new(true, null, null);
    public static ServiceResult NotFound(string error) => new(false, error, ServiceErrorType.NotFound);
    public static ServiceResult Validation(string error) => new(false, error, ServiceErrorType.Validation);
    public static ServiceResult Conflict(string error) => new(false, error, ServiceErrorType.Conflict);
}

/// <summary>Outcome of a service call that returns a value on success.</summary>
public class ServiceResult<T> : ServiceResult
{
    private ServiceResult(bool success, T? value, string? error, ServiceErrorType? errorType)
        : base(success, error, errorType)
    {
        Value = value;
    }

    /// <summary>The result; only set when Success is true.</summary>
    public T? Value { get; }

    public static ServiceResult<T> Ok(T value) => new(true, value, null, null);
    public new static ServiceResult<T> NotFound(string error) => new(false, default, error, ServiceErrorType.NotFound);
    public new static ServiceResult<T> Validation(string error) => new(false, default, error, ServiceErrorType.Validation);
    public new static ServiceResult<T> Conflict(string error) => new(false, default, error, ServiceErrorType.Conflict);
}
