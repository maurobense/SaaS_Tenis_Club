using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TennisClubSaaS.Api.Extensions;
using TennisClubSaaS.Application.DTOs;
using TennisClubSaaS.Application.Interfaces;

namespace TennisClubSaaS.Api.Controllers;

public class AuthController(IAuthService auth) : BaseApiController
{
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request, CancellationToken ct) => FromResponse(await auth.LoginAsync(request, ct));

    [HttpPost("register-member")]
    public async Task<IActionResult> RegisterMember(RegisterMemberRequest request, CancellationToken ct) => FromResponse(await auth.RegisterMemberAsync(request, ct));

    [HttpPost("refresh-token")]
    public async Task<IActionResult> Refresh(RefreshTokenRequest request, CancellationToken ct) => FromResponse(await auth.RefreshAsync(request, ct));

    [Authorize]
    [HttpPost("logout")]
    public IActionResult Logout() => Ok(ApiResponse<string>.Ok("LoggedOut", "Sesión cerrada del lado del cliente."));

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me(CancellationToken ct) => FromResponse(await auth.MeAsync(User.UserId(), ct));

    [Authorize]
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile(UpdateProfileRequest request, CancellationToken ct) =>
        FromResponse(await auth.UpdateProfileAsync(User.UserId(), request, ct));

    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest request, CancellationToken ct) =>
        FromResponse(await auth.ChangePasswordAsync(User.UserId(), request, ct));
}
