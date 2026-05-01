using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using TennisClubSaaS.Application.Interfaces;
using TennisClubSaaS.Domain.Entities;
using TennisClubSaaS.Domain.Enums;
using TennisClubSaaS.Infrastructure.Data;

namespace TennisClubSaaS.Infrastructure.Security;

public class TenantProvider(IHttpContextAccessor accessor, IDbContextFactory<TennisClubDbContext> dbFactory) : ITenantProvider
{
    public Guid? CurrentTenantId
    {
        get
        {
            var claim = accessor.HttpContext?.User.FindFirst("tenant_id")?.Value;
            return Guid.TryParse(claim, out var id) ? id : cachedTenantId;
        }
    }

    public string? CurrentTenantSlug => accessor.HttpContext?.Request.Headers["X-Tenant-Slug"].FirstOrDefault()
        ?? accessor.HttpContext?.User.FindFirst("tenant_slug")?.Value
        ?? ResolveSlugFromHost();

    public bool IsSuperAdmin => accessor.HttpContext?.User.IsInRole(UserRole.SuperAdmin.ToString()) == true;

    private Guid? cachedTenantId;

    public async Task<ClubTenant?> ResolveTenantAsync(CancellationToken ct = default)
    {
        if (CurrentTenantSlug is not { Length: > 0 } slug) return null;
        await using var db = await dbFactory.CreateDbContextAsync(ct);
        var tenant = await db.ClubTenants.IgnoreQueryFilters().FirstOrDefaultAsync(x => x.Slug == slug && x.IsActive, ct);
        cachedTenantId = tenant?.Id;
        return tenant;
    }

    private string? ResolveSlugFromHost()
    {
        var host = accessor.HttpContext?.Request.Host.Host;
        if (string.IsNullOrWhiteSpace(host) || host.Equals("localhost", StringComparison.OrdinalIgnoreCase)) return null;
        var parts = host.Split('.');
        return parts.Length > 2 ? parts[0] : null;
    }
}
