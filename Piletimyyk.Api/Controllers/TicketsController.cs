using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Piletimyyk.Api.Dtos;
using Piletimyyk.Api.Models;
using Piletimyyk.Api.Services;

namespace Piletimyyk.Api.Controllers;

/* Buyers see the tickets they have bought; owners and admins can get a ticket's QR code;
   controllers check tickets in at the door. */
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
    private readonly ICheckInService _checkInService;

    public TicketsController(ITicketService ticketService, ICheckInService checkInService)
    {
        _ticketService = ticketService;
        _checkInService = checkInService;
    }

    // The caller's tickets: upcoming events first (soonest first), then past ones.
    [HttpGet("my")]
    [Authorize(Roles = Roles.Buyer)]
    [ProducesResponseType(typeof(IReadOnlyList<TicketDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<TicketDto>>> GetMine()
    {
        return Ok(await _ticketService.GetForUserAsync(User.GetRequiredUserId()));
    }

    // QR code of the ticket code as a PNG. Only for the ticket's owner or an admin.
    [HttpGet("{code}/qr")]
    [Produces("image/png", "application/problem+json")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK, "image/png")]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound, "application/problem+json")]
    public async Task<IActionResult> GetQr(string code)
    {
        var result = await _ticketService.GetQrPngAsync(code, User.GetRequiredUserId(), User.IsInRole(Roles.Admin));
        return this.ToFileResult(result, "image/png");
    }

    // Marks the ticket as used. 409 if it was already used (the message says when).
    [HttpPost("{code}/check-in")]
    [Authorize(Roles = Roles.Controller)]
    [ProducesResponseType(typeof(CheckInResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<CheckInResultDto>> CheckIn(string code)
    {
        return this.ToActionResult(await _checkInService.CheckInAsync(code));
    }
}
