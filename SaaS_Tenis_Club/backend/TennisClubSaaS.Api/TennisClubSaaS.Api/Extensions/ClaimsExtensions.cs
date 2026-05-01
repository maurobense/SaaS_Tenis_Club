using System.Security.Claims;

namespace TennisClubSaaS.Api.Extensions;

public static class ClaimsExtensions
{
    public static Guid UserId(this ClaimsPrincipal user) =>
        Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? throw new UnauthorizedAccessException("Usuario no autenticado."));
}
