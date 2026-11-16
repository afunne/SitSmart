using System.Security.Claims;

namespace Piletimyyk.Api.Controllers;

public static class ClaimsPrincipalExtensions
{
    /// <summary>
    /// The logged-in user's id (the NameIdentifier claim set by TokenService),
    /// or null for anonymous requests.
    /// </summary>
    public static int? GetUserId(this ClaimsPrincipal user)
    {
        return int.TryParse(user.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;
    }

    /// <summary>The logged-in user's id, for actions behind [Authorize].</summary>
    public static int GetRequiredUserId(this ClaimsPrincipal user)
    {
        return user.GetUserId()
            ?? throw new InvalidOperationException("Authenticated user has no NameIdentifier claim.");
    }
}
