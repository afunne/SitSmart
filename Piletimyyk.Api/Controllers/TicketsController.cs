using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Piletimyyk.Api.Dtos;
using Piletimyyk.Api.Models;
using Piletimyyk.Api.Services;

namespace Piletimyyk.Api.Controllers;

/// <summary>Buyers see the tickets they have bought.</summary>
[ApiController]
[Route("api/tickets")]
[Authorize(Roles = Roles.Buyer)]
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
    [ProducesResponseType(typeof(IReadOnlyList<TicketDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<TicketDto>>> GetMine()
    {
        return Ok(await _ticketService.GetForUserAsync(User.GetRequiredUserId()));
    }
}
