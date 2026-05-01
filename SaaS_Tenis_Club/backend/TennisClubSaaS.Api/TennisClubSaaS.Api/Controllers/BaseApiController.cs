using Microsoft.AspNetCore.Mvc;
using TennisClubSaaS.Application.DTOs;

namespace TennisClubSaaS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public abstract class BaseApiController : ControllerBase
{
    protected IActionResult FromResponse<T>(ApiResponse<T> response) => response.Success ? Ok(response) : BadRequest(response);
}
