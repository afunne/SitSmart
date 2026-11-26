using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Piletimyyk.Api.Dtos;
using Piletimyyk.Api.Models;
using Piletimyyk.Api.Services;

namespace Piletimyyk.Api.Controllers;

// Sales statistics for admins: one event, or all of them.
[ApiController]
[Route("api")]
[Authorize(Roles = Roles.Admin)]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public class StatsController : ControllerBase
{
    private readonly IStatsService _statsService;

    public StatsController(IStatsService statsService)
    {
        _statsService = statsService;
    }

    [HttpGet("events/{id:int}/stats")]
    [ProducesResponseType(typeof(EventStatsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EventStatsDto>> GetEventStats(int id)
    {
        return this.ToActionResult(await _statsService.GetEventStatsAsync(id));
    }

    [HttpGet("stats/events")]
    [ProducesResponseType(typeof(IReadOnlyList<EventStatsDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<EventStatsDto>>> GetAllStats()
    {
        return Ok(await _statsService.GetAllStatsAsync());
    }
}
