using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Piletimyyk.Api.Dtos;
using Piletimyyk.Api.Models;
using Piletimyyk.Api.Services;

namespace Piletimyyk.Api.Controllers;

/// <summary>Buyers hold seats while they check out, then buy them or release them again.</summary>
[ApiController]
[Authorize(Roles = Roles.Buyer)]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public class ReservationsController : ControllerBase
{
    private readonly IReservationService _reservationService;

    private readonly IPurchaseService _purchaseService;

    public ReservationsController(IReservationService reservationService, IPurchaseService purchaseService)
    {
        _reservationService = reservationService;
        _purchaseService = purchaseService;
    }

    /// <summary>Holds a seat for Reservations:HoldMinutes. 409 if the seat is taken or the user is at the limit.</summary>
    [HttpPost("api/events/{eventId:int}/reservations")]
    [ProducesResponseType(typeof(ReservationDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ReservationDto>> Create(int eventId, CreateReservationRequest request)
    {
        var result = await _reservationService.ReserveAsync(eventId, request.SeatId, User.GetRequiredUserId());

        // There is no GET endpoint for a single reservation, so no Location header.
        return result.Success
            ? StatusCode(StatusCodes.Status201Created, result.Value)
            : this.ToActionResult(result);
    }

    /// <summary>The caller's active holds (all events), so the client can list and cancel them after a reload.</summary>
    [HttpGet("api/reservations/my")]
    [ProducesResponseType(typeof(IReadOnlyList<ReservationDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<ReservationDto>>> GetMine()
    {
        return Ok(await _reservationService.GetActiveAsync(User.GetRequiredUserId()));
    }

    /// <summary>Cancels one of the caller's own holds.</summary>
    [HttpDelete("api/reservations/{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Cancel(int id)
    {
        return this.ToNoContentResult(await _reservationService.CancelAsync(id, User.GetRequiredUserId()));
    }

    /// <summary>Buys a held seat: the reservation becomes a ticket. 409 if the hold has expired.</summary>
    [HttpPost("api/reservations/{id:int}/purchase")]
    [ProducesResponseType(typeof(TicketDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<TicketDto>> Purchase(int id)
    {
        return this.ToActionResult(await _purchaseService.PurchaseAsync(id, User.GetRequiredUserId()));
    }
}
