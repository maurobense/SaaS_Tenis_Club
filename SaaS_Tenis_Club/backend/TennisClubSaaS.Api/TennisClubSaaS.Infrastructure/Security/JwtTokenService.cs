using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using TennisClubSaaS.Application.DTOs;
using TennisClubSaaS.Application.Interfaces;
using TennisClubSaaS.Domain.Entities;
using TennisClubSaaS.Domain.Enums;

namespace TennisClubSaaS.Infrastructure.Security;

public class JwtTokenService(IConfiguration config) : IJwtTokenService
{
    public LoginResponse CreateLoginResponse(AppUser user, ClubTenant? tenant, string refreshToken)
    {
        var expiresAt = DateTime.UtcNow.AddMinutes(int.Parse(config["Jwt:AccessTokenMinutes"] ?? "60"));
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key requerido.")));
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Role, user.Role.ToString()),
            new("tenant_id", user.Role == UserRole.SuperAdmin ? "" : user.ClubTenantId.ToString()),
            new("tenant_slug", tenant?.Slug ?? "platform")
        };

        var token = new JwtSecurityToken(
            issuer: config["Jwt:Issuer"],
            audience: config["Jwt:Audience"],
            claims: claims,
            expires: expiresAt,
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

        var accessToken = new JwtSecurityTokenHandler().WriteToken(token);
        var dto = new UserDto(user.Id, user.FirstName, user.LastName, user.Email, user.Phone, user.Role, user.IsActive, user.Role == UserRole.SuperAdmin ? null : user.ClubTenantId);
        var tenantDto = tenant is null ? null : new TenantDto(tenant.Id, tenant.Name, tenant.Slug, tenant.ContactEmail, tenant.ContactPhone, tenant.LogoUrl, tenant.PrimaryColor, tenant.SecondaryColor, tenant.Address, tenant.IsActive, tenant.PlanType, tenant.BillingStatus, tenant.MonthlyPrice, tenant.BillingCurrency, tenant.MaxCourts, tenant.MaxMembers, tenant.MaxCoaches, tenant.TrialEndsAt, tenant.SubscriptionStartedAt, tenant.SubscriptionEndsAt, tenant.BillingNotes);
        return new LoginResponse(accessToken, refreshToken, expiresAt, dto, tenantDto);
    }

    public string GenerateRefreshToken() => Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
    public string HashToken(string token) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
}
