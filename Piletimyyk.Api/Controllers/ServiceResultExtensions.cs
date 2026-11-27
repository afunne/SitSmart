using Microsoft.AspNetCore.Mvc;
using Piletimyyk.Api.Services;

namespace Piletimyyk.Api.Controllers;

/* Maps ServiceResult to HTTP responses. Errors are returned as ProblemDetails with the
   user-facing message in "detail" (and "message"):
   NotFound → 404, Validation → 400, Conflict → 409, Forbidden → 403. */
public static class ServiceResultExtensions
{
    // 200 OK with the value, or the error response.
    public static ActionResult<T> ToActionResult<T>(this ControllerBase controller, ServiceResult<T> result)
    {
        return result.Success ? controller.Ok(result.Value) : controller.ToErrorResult(result);
    }

    // 201 Created with a Location header pointing to actionName, or the error response.
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

    // 200 OK with the bytes as a file of contentType, or the error response.
    public static IActionResult ToFileResult(this ControllerBase controller, ServiceResult<byte[]> result, string contentType)
    {
        return result.Success ? controller.File(result.Value!, contentType) : controller.ToErrorResult(result);
    }

    // 204 No Content, or the error response.
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
            ServiceErrorType.Forbidden => StatusCodes.Status403Forbidden,
            _ => StatusCodes.Status500InternalServerError
        };

        var problem = controller.Problem(detail: result.Error, statusCode: statusCode);

        // Also expose the message as "message", so clients can read either
        // { "detail": ... } (ProblemDetails) or { "message": ... }.
        var extensions = ((ProblemDetails)problem.Value!).Extensions;
        extensions["message"] = result.Error;

        if (result.ErrorData is not null)
        {
            foreach (var (key, value) in result.ErrorData)
            {
                extensions[key] = value;
            }
        }

        return problem;
    }
}
