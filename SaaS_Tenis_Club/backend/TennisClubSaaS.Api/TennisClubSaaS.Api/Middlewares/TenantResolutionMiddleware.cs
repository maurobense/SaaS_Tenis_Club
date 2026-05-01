using System.Security.Claims;
using TennisClubSaaS.Application.Interfaces;

namespace TennisClubSaaS.Api.Middlewares;

public class TenantResolutionMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, ITenantProvider tenantProvider)
    {
        // Fuerza la resolución temprana del tenant desde X-Tenant-Slug o claim.
        // Los filtros globales del DbContext usan este provider para aislar datos.
        await tenantProvider.ResolveTenantAsync(context.RequestAborted);
        await next(context);
    }
}
