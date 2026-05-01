using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TennisClubSaaS.Application.DTOs;
using TennisClubSaaS.Application.Interfaces;

namespace TennisClubSaaS.Api.Controllers;

[Authorize(Roles = "ClubAdmin,SuperAdmin")]
public class SettingsController(ISettingService settings) : BaseApiController
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct) => Ok(ApiResponse<object>.Ok(await settings.GetAllAsync(ct)));

    [HttpPut]
    public async Task<IActionResult> Put(IReadOnlyCollection<SettingDto> items, CancellationToken ct)
    {
        foreach (var item in items) await settings.UpsertAsync(item.Key, item.Value, ct);
        return Ok(ApiResponse<bool>.Ok(true));
    }

    [HttpGet("{key}")]
    public async Task<IActionResult> Get(string key, CancellationToken ct) => Ok(ApiResponse<string>.Ok(await settings.GetAsync(key, "", ct)));

    [HttpPut("{key}")]
    public async Task<IActionResult> Put(string key, [FromBody] string value, CancellationToken ct)
    {
        await settings.UpsertAsync(key, value, ct);
        return Ok(ApiResponse<bool>.Ok(true));
    }
}
