using Microsoft.AspNetCore.Mvc;
using TennisClubSaaS.Application.DTOs;
using TennisClubSaaS.Application.Interfaces;
using TennisClubSaaS.Domain.Entities;

namespace TennisClubSaaS.Api.Controllers;

[ApiController]
[Route("api/public")]
public class PublicController(IUnitOfWork uow) : ControllerBase
{
    [HttpGet("tenants/{slug}")]
    public IActionResult Tenant(string slug)
    {
        var normalizedSlug = NormalizeSlug(slug);
        if (string.IsNullOrWhiteSpace(normalizedSlug))
            return BadRequest(ApiResponse<object>.Fail("Slug requerido."));

        var tenant = uow.Repository<ClubTenant>().QueryIgnoreFilters()
            .FirstOrDefault(x => x.Slug == normalizedSlug && x.IsActive);

        return tenant is null
            ? NotFound(ApiResponse<object>.Fail("Club no encontrado o inactivo."))
            : Ok(ApiResponse<PublicTenantDto>.Ok(new PublicTenantDto(
                tenant.Name,
                tenant.Slug,
                tenant.LogoUrl,
                tenant.PrimaryColor,
                tenant.SecondaryColor)));
    }

    private static string NormalizeSlug(string value) =>
        string.Join("-", value.Trim().ToLowerInvariant().Split(' ', StringSplitOptions.RemoveEmptyEntries));
}
