using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TennisClubSaaS.Api.Extensions;
using TennisClubSaaS.Application.DTOs;
using TennisClubSaaS.Application.Interfaces;

namespace TennisClubSaaS.Api.Controllers;

[Authorize]
public class DashboardController(IDashboardService dashboard) : BaseApiController
{
    [Authorize(Roles = "ClubAdmin,SuperAdmin")]
    [HttpGet("admin")]
    public async Task<IActionResult> Admin(CancellationToken ct) => Ok(ApiResponse<object>.Ok(await dashboard.GetAdminAsync(ct)));

    [Authorize(Roles = "Coach,ClubAdmin,SuperAdmin")]
    [HttpGet("coach")]
    public async Task<IActionResult> Coach(CancellationToken ct) => Ok(ApiResponse<object>.Ok(await dashboard.GetCoachAsync(User.UserId(), ct)));

    [Authorize(Roles = "Member,ClubAdmin,SuperAdmin")]
    [HttpGet("member")]
    public async Task<IActionResult> Member(CancellationToken ct) => Ok(ApiResponse<object>.Ok(await dashboard.GetMemberAsync(User.UserId(), ct)));

    [Authorize(Roles = "SuperAdmin")]
    [HttpGet("superadmin")]
    public async Task<IActionResult> SuperAdmin(CancellationToken ct) => Ok(ApiResponse<object>.Ok(await dashboard.GetSuperAdminAsync(ct)));
}
