using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Piletimyyk.Api.Dtos;
using Piletimyyk.Api.Models;
using Piletimyyk.Api.Services;

namespace Piletimyyk.Api.Controllers;

/// <summary>Anyone can browse events; only admins can create, change or delete them.</summary>
[ApiController]
[Route("api/events")]
[Authorize(Roles = Roles.Admin)]
public class EventsController : ControllerBase
{
    private readonly IEventService _eventService;

    public EventsController(IEventService eventService)
    {
        _eventService = eventService;
    }

    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(IReadOnlyList<EventDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<EventDto>>> GetAll()
    {
        return Ok(await _eventService.GetAllAsync());
    }

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(EventDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EventDto>> GetById(int id)
    {
        return this.ToActionResult(await _eventService.GetByIdAsync(id));
    }

    [HttpPost]
    [ProducesResponseType(typeof(EventDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<EventDto>> Create(CreateEventRequest request)
    {
        var result = await _eventService.CreateAsync(request);
        return this.ToCreatedResult(result, nameof(GetById), ev => new { id = ev.Id });
    }

    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(EventDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<EventDto>> Update(int id, UpdateEventRequest request)
    {
        return this.ToActionResult(await _eventService.UpdateAsync(id, request));
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Delete(int id)
    {
        return this.ToNoContentResult(await _eventService.DeleteAsync(id));
    }
}
