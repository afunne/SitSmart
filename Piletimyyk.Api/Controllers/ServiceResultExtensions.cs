using Microsoft.AspNetCore.Mvc;
using Piletimyyk.Api.Services;

namespace Piletimyyk.Api.Controllers;

/// <summary>
/// Maps ServiceResult to HTTP responses. Errors are returned as ProblemDetails with the
/// user-facing message in "detail": NotFound → 404, Validation → 400, Conflict → 409.
/// </summary>
public static class ServiceResultExtensions
{
    /// <summary>200 OK with the value, or the error response.</summary>
    public static ActionResult<T> ToActionResult<T>(this ControllerBase controller, ServiceResult<T> result)
    {
        return result.Success ? controller.Ok(result.Value) : controller.ToErrorResult(result);
    }

    /// <summary>201 Created with a Location header pointing to <paramref name="actionName"/>, or the error response.</summary>
    public static ActionResult<T> ToCreatedResult<T>(
        this ControllerBase controller,
        ServiceResult<T> result,
        string actionName,
        Func<T, object> routeValues)
    {
        return result.Success
            ? controller.CreatedAtAction(actionName, routeValues(result.Value!), result.Value)
            : controller.ToErrorResult(result);
    }

    /// <summary>204 No Content, or the error response.</summary>
    public static IActionResult ToNoContentResult(this ControllerBase controller, ServiceResult result)
    {
        return result.Success ? controller.NoContent() : controller.ToErrorResult(result);
    }

    private static ObjectResult ToErrorResult(this ControllerBase controller, ServiceResult result)
    {
        var statusCode = result.ErrorType switch
        {
            ServiceErrorType.NotFound => StatusCodes.Status404NotFound,
            ServiceErrorType.Validation => StatusCodes.Status400BadRequest,
            ServiceErrorType.Conflict => StatusCodes.Status409Conflict,
            _ => StatusCodes.Status500InternalServerError
        };

        return controller.Problem(detail: result.Error, statusCode: statusCode);
    }
}
