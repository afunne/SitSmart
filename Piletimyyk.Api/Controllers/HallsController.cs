using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Piletimyyk.Api.Dtos;
using Piletimyyk.Api.Models;
using Piletimyyk.Api.Services;

namespace Piletimyyk.Api.Controllers;

[ApiController]
[Route("api/halls")]
[Authorize(Roles = Roles.Admin)]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public class HallsController : ControllerBase
{
    private readonly IHallService _hallService;

    public HallsController(IHallService hallService)
    {
        _hallService = hallService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<HallDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<HallDto>>> GetAll()
    {
        return Ok(await _hallService.GetAllAsync());
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(HallDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<HallDto>> GetById(int id)
    {
        return this.ToActionResult(await _hallService.GetByIdAsync(id));
    }

    [HttpPost]
    [ProducesResponseType(typeof(HallDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<HallDto>> Create(CreateHallRequest request)
    {
        var result = await _hallService.CreateAsync(request);
        return this.ToCreatedResult(result, nameof(GetById), hall => new { id = hall.Id });
    }

    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(HallDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<HallDto>> Update(int id, UpdateHallRequest request)
    {
        return this.ToActionResult(await _hallService.UpdateAsync(id, request));
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Delete(int id)
    {
        return this.ToNoContentResult(await _hallService.DeleteAsync(id));
    }
}
