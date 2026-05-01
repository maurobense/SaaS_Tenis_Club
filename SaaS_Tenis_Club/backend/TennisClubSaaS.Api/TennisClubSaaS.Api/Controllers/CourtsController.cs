using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TennisClubSaaS.Application.DTOs;
using TennisClubSaaS.Application.Interfaces;
using TennisClubSaaS.Domain.Entities;

namespace TennisClubSaaS.Api.Controllers;

[Authorize]
public class CourtsController(IUnitOfWork uow, ITenantProvider tenant) : BaseApiController
{
    [HttpGet]
    public IActionResult Get() => Ok(ApiResponse<object>.Ok(uow.Repository<Court>().Query().OrderBy(x => x.Name).Select(x => new CourtDto(x.Id, x.Name, x.SurfaceType, x.IndoorOutdoor, x.HasLights, x.IsActive, x.OpeningTime, x.ClosingTime, x.SlotDurationMinutes)).ToList()));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
    {
        var x = await uow.Repository<Court>().GetByIdAsync(id, ct);
        return x is null ? NotFound(ApiResponse<object>.Fail("Cancha no encontrada.")) : Ok(ApiResponse<CourtDto>.Ok(new(x.Id, x.Name, x.SurfaceType, x.IndoorOutdoor, x.HasLights, x.IsActive, x.OpeningTime, x.ClosingTime, x.SlotDurationMinutes)));
    }

    [Authorize(Roles = "ClubAdmin,SuperAdmin")]
    [HttpPost]
    public async Task<IActionResult> Post(UpsertCourtRequest request, CancellationToken ct)
    {
        var c = new Court { ClubTenantId = tenant.CurrentTenantId ?? Guid.Empty, Name = request.Name, SurfaceType = request.SurfaceType, IndoorOutdoor = request.IndoorOutdoor, HasLights = request.HasLights, IsActive = request.IsActive, OpeningTime = request.OpeningTime, ClosingTime = request.ClosingTime, SlotDurationMinutes = request.SlotDurationMinutes };
        await uow.Repository<Court>().AddAsync(c, ct);
        await uow.SaveChangesAsync(ct);
        return Ok(ApiResponse<Guid>.Ok(c.Id));
    }

    [Authorize(Roles = "ClubAdmin,SuperAdmin")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Put(Guid id, UpsertCourtRequest request, CancellationToken ct)
    {
        var c = await uow.Repository<Court>().GetByIdAsync(id, ct);
        if (c is null) return NotFound(ApiResponse<object>.Fail("Cancha no encontrada."));
        c.Name = request.Name; c.SurfaceType = request.SurfaceType; c.IndoorOutdoor = request.IndoorOutdoor; c.HasLights = request.HasLights; c.IsActive = request.IsActive; c.OpeningTime = request.OpeningTime; c.ClosingTime = request.ClosingTime; c.SlotDurationMinutes = request.SlotDurationMinutes;
        await uow.SaveChangesAsync(ct);
        return Ok(ApiResponse<bool>.Ok(true));
    }

    [Authorize(Roles = "ClubAdmin,SuperAdmin")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var c = await uow.Repository<Court>().GetByIdAsync(id, ct);
        if (c is null) return NotFound(ApiResponse<object>.Fail("Cancha no encontrada."));
        c.IsDeleted = true; c.IsActive = false;
        await uow.SaveChangesAsync(ct);
        return Ok(ApiResponse<bool>.Ok(true));
    }

    [HttpGet("availability")]
    public IActionResult Availability() => Ok(ApiResponse<object>.Ok(uow.Repository<CourtAvailability>().Query().ToList()));

    [Authorize(Roles = "ClubAdmin,SuperAdmin")]
    [HttpPost("{id:guid}/availability")]
    public async Task<IActionResult> SaveAvailability(Guid id, CourtAvailability availability, CancellationToken ct)
    {
        availability.CourtId = id;
        availability.ClubTenantId = tenant.CurrentTenantId ?? availability.ClubTenantId;
        await uow.Repository<CourtAvailability>().AddAsync(availability, ct);
        await uow.SaveChangesAsync(ct);
        return Ok(ApiResponse<Guid>.Ok(availability.Id));
    }
}
