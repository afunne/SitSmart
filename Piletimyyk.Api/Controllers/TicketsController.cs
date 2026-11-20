using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Piletimyyk.Api.Dtos;
using Piletimyyk.Api.Models;
using Piletimyyk.Api.Services;

namespace Piletimyyk.Api.Controllers;

/// <summary>Buyers see the tickets they have bought; owners and admins can get a ticket's QR code.</summary>
[ApiController]
[Route("api/tickets")]
// Roles are set per action: a class-level role would also apply to every action and can't be
// loosened there.
[Authorize]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public class TicketsController : ControllerBase
{
    private readonly ITicketService _ticketService;

    public TicketsController(ITicketService ticketService)
    {
        _ticketService = ticketService;
    }

    /// <summary>The caller's tickets: upcoming events first (soonest first), then past ones.</summary>
    [HttpGet("my")]
    [Authorize(Roles = Roles.Buyer)]
    [ProducesResponseType(typeof(IReadOnlyList<TicketDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<TicketDto>>> GetMine()
    {
        return Ok(await _ticketService.GetForUserAsync(User.GetRequiredUserId()));
    }

    /// <summary>QR code of the ticket code as a PNG. Only for the ticket's owner or an admin.</summary>
    [HttpGet("{code}/qr")]
    [Produces("image/png", "application/problem+json")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK, "image/png")]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound, "application/problem+json")]
    public async Task<IActionResult> GetQr(string code)
    {
        var result = await _ticketService.GetQrPngAsync(code, User.GetRequiredUserId(), User.IsInRole(Roles.Admin));
        return this.ToFileResult(result, "image/png");
    }
}
