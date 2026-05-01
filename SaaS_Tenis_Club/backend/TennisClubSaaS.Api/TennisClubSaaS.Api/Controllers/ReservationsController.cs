using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TennisClubSaaS.Api.Extensions;
using TennisClubSaaS.Application.DTOs;
using TennisClubSaaS.Application.Interfaces;

namespace TennisClubSaaS.Api.Controllers;

[Authorize]
public class ReservationsController(IReservationService reservations, ISettingService settings) : BaseApiController
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct) => Ok(ApiResponse<object>.Ok(await reservations.ListAsync(ct)));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
    {
        var item = (await reservations.ListAsync(ct)).FirstOrDefault(x => x.Id == id);
        return item is null ? NotFound(ApiResponse<object>.Fail("Reserva no encontrada.")) : Ok(ApiResponse<object>.Ok(item));
    }

    [HttpPost]
    public async Task<IActionResult> Post(CreateReservationRequest request, CancellationToken ct) => FromResponse(await reservations.CreateMemberReservationAsync(User.UserId(), request, ct));

    [Authorize(Roles = "ClubAdmin,SuperAdmin")]
    [HttpPost("admin")]
    public async Task<IActionResult> Admin(AdminReservationRequest request, CancellationToken ct) => FromResponse(await reservations.CreateAdminReservationAsync(request, ct));

    [HttpPatch("{id:guid}/cancel")]
    public async Task<IActionResult> Cancel(Guid id, [FromBody] string? reason, CancellationToken ct) => FromResponse(await reservations.CancelAsync(id, User.UserId(), reason, ct));

    [Authorize(Roles = "ClubAdmin,SuperAdmin")]
    [HttpPatch("{id:guid}/guest-fee-paid")]
    public async Task<IActionResult> GuestFeePaid(Guid id, CancellationToken ct) => FromResponse(await reservations.MarkGuestFeePaidAsync(id, ct));

    [HttpGet("available-slots")]
    public async Task<IActionResult> Slots([FromQuery] DateOnly date, [FromQuery] Guid? courtId, CancellationToken ct) => Ok(ApiResponse<object>.Ok(await reservations.GetAvailableSlotsAsync(date, courtId, ct)));

    [HttpGet("rules")]
    public async Task<IActionResult> Rules(CancellationToken ct) => Ok(ApiResponse<ReservationRulesDto>.Ok(new ReservationRulesDto(
        await settings.GetIntAsync("GuestPlayerFee", 300, ct),
        await settings.GetIntAsync("MaxReservationsPerWeek", 1, ct),
        await settings.GetIntAsync("MaxClassEnrollmentsPerWeek", 2, ct))));

    [HttpGet("my-reservations")]
    public async Task<IActionResult> Mine(CancellationToken ct) => Ok(ApiResponse<object>.Ok(await reservations.ListAsync(ct)));
}
