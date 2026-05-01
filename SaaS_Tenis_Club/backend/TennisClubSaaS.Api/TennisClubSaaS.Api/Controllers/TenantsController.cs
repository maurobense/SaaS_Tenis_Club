using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TennisClubSaaS.Application.DTOs;
using TennisClubSaaS.Application.Interfaces;
using TennisClubSaaS.Domain.Entities;
using TennisClubSaaS.Domain.Enums;

namespace TennisClubSaaS.Api.Controllers;

[Authorize(Roles = "SuperAdmin")]
public class TenantsController(IUnitOfWork uow, IPasswordHasher passwords) : BaseApiController
{
    [HttpGet]
    public IActionResult Get()
    {
        var tenants = uow.Repository<ClubTenant>().Query()
            .OrderBy(x => x.Name)
            .AsEnumerable()
            .Select(MapTenant)
            .ToList();

        return Ok(ApiResponse<object>.Ok(tenants));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
    {
        var tenant = await uow.Repository<ClubTenant>().GetByIdAsync(id, ct);
        return tenant is null
            ? NotFound(ApiResponse<object>.Fail("Tenant no encontrado."))
            : Ok(ApiResponse<TenantDto>.Ok(MapTenant(tenant)));
    }

    [HttpPost]
    public async Task<IActionResult> Post(UpsertTenantRequest request, CancellationToken ct)
    {
        var validation = ValidateTenant(request);
        if (validation is not null) return BadRequest(ApiResponse<object>.Fail(validation));

        var slug = NormalizeSlug(request.Slug);
        if (uow.Repository<ClubTenant>().Query().Any(x => x.Slug == slug))
            return BadRequest(ApiResponse<object>.Fail("Ya existe un club con ese slug."));

        var tenant = new ClubTenant
        {
            Name = request.Name.Trim(),
            Slug = slug,
            ContactEmail = request.ContactEmail.Trim().ToLowerInvariant(),
            ContactPhone = CleanOptional(request.ContactPhone),
            LogoUrl = CleanOptional(request.LogoUrl),
            PrimaryColor = CleanColor(request.PrimaryColor, "#2563eb"),
            SecondaryColor = CleanColor(request.SecondaryColor, "#10b981"),
            Address = CleanOptional(request.Address),
            IsActive = true
        };
        ApplyPlan(request, tenant);

        await uow.Repository<ClubTenant>().AddAsync(tenant, ct);
        foreach (var setting in DefaultSettings(tenant.Id))
            await uow.Repository<ClubSetting>().AddAsync(setting, ct);

        await uow.SaveChangesAsync(ct);
        return Ok(ApiResponse<TenantDto>.Ok(MapTenant(tenant), "Club creado correctamente."));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Put(Guid id, UpsertTenantRequest request, CancellationToken ct)
    {
        var validation = ValidateTenant(request);
        if (validation is not null) return BadRequest(ApiResponse<object>.Fail(validation));

        var tenant = await uow.Repository<ClubTenant>().GetByIdAsync(id, ct);
        if (tenant is null) return NotFound(ApiResponse<object>.Fail("Tenant no encontrado."));

        var slug = NormalizeSlug(request.Slug);
        if (uow.Repository<ClubTenant>().Query().Any(x => x.Id != id && x.Slug == slug))
            return BadRequest(ApiResponse<object>.Fail("Ya existe otro club con ese slug."));

        tenant.Name = request.Name.Trim();
        tenant.Slug = slug;
        tenant.ContactEmail = request.ContactEmail.Trim().ToLowerInvariant();
        tenant.ContactPhone = CleanOptional(request.ContactPhone);
        tenant.LogoUrl = CleanOptional(request.LogoUrl);
        tenant.PrimaryColor = CleanColor(request.PrimaryColor, tenant.PrimaryColor);
        tenant.SecondaryColor = CleanColor(request.SecondaryColor, tenant.SecondaryColor);
        tenant.Address = CleanOptional(request.Address);
        ApplyPlan(request, tenant);
        tenant.UpdatedAt = DateTime.UtcNow;

        await uow.SaveChangesAsync(ct);
        return Ok(ApiResponse<TenantDto>.Ok(MapTenant(tenant), "Club actualizado correctamente."));
    }

    [HttpPatch("{id:guid}/activate")]
    public Task<IActionResult> Activate(Guid id, CancellationToken ct) => SetActive(id, true, ct);

    [HttpPatch("{id:guid}/deactivate")]
    public Task<IActionResult> Deactivate(Guid id, CancellationToken ct) => SetActive(id, false, ct);

    [HttpGet("{id:guid}/admins")]
    public IActionResult Admins(Guid id)
    {
        var admins = uow.Repository<AppUser>().Query()
            .Where(x => x.ClubTenantId == id && x.Role == UserRole.ClubAdmin)
            .OrderBy(x => x.LastName)
            .ThenBy(x => x.FirstName)
            .Select(x => new TenantAdminDto(x.Id, x.FirstName, x.LastName, x.Email, x.Phone, x.IsActive, x.LastLoginAt))
            .ToList();

        return Ok(ApiResponse<object>.Ok(admins));
    }

    [HttpPost("{id:guid}/admins")]
    public async Task<IActionResult> CreateAdmin(Guid id, CreateTenantAdminRequest request, CancellationToken ct)
    {
        var tenant = await uow.Repository<ClubTenant>().GetByIdAsync(id, ct);
        if (tenant is null) return NotFound(ApiResponse<object>.Fail("Tenant no encontrado."));
        if (!tenant.IsActive) return BadRequest(ApiResponse<object>.Fail("No se pueden crear administradores para un club inactivo."));
        if (string.IsNullOrWhiteSpace(request.FirstName) || string.IsNullOrWhiteSpace(request.LastName))
            return BadRequest(ApiResponse<object>.Fail("Nombre y apellido son obligatorios."));
        if (string.IsNullOrWhiteSpace(request.Email))
            return BadRequest(ApiResponse<object>.Fail("El correo electronico es obligatorio."));
        if (request.Password != request.ConfirmPassword)
            return BadRequest(ApiResponse<object>.Fail("La confirmacion de contrasena no coincide."));
        if (!IsStrongPassword(request.Password))
            return BadRequest(ApiResponse<object>.Fail("La contrasena debe tener al menos 8 caracteres, una mayuscula, una minuscula, un numero y un simbolo."));

        var email = request.Email.Trim().ToLowerInvariant();
        if (uow.Repository<AppUser>().Query().Any(x => x.ClubTenantId == id && x.Email == email))
            return BadRequest(ApiResponse<object>.Fail("Ya existe un usuario con ese email en este club."));

        var admin = new AppUser
        {
            ClubTenantId = id,
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Email = email,
            Phone = CleanOptional(request.Phone),
            Role = UserRole.ClubAdmin,
            IsActive = request.IsActive,
            PasswordHash = passwords.Hash(request.Password)
        };

        await uow.Repository<AppUser>().AddAsync(admin, ct);
        await uow.SaveChangesAsync(ct);
        return Ok(ApiResponse<TenantAdminDto>.Ok(new TenantAdminDto(admin.Id, admin.FirstName, admin.LastName, admin.Email, admin.Phone, admin.IsActive, admin.LastLoginAt), "Administrador creado correctamente."));
    }

    [HttpPatch("{id:guid}/admins/{adminId:guid}/activate")]
    public Task<IActionResult> ActivateAdmin(Guid id, Guid adminId, CancellationToken ct) => SetAdminActive(id, adminId, true, ct);

    [HttpPatch("{id:guid}/admins/{adminId:guid}/deactivate")]
    public Task<IActionResult> DeactivateAdmin(Guid id, Guid adminId, CancellationToken ct) => SetAdminActive(id, adminId, false, ct);

    [HttpPatch("{id:guid}/admins/{adminId:guid}/reset-password")]
    public async Task<IActionResult> ResetAdminPassword(Guid id, Guid adminId, ResetPasswordRequest request, CancellationToken ct)
    {
        var admin = await FindClubAdmin(id, adminId, ct);
        if (admin is null) return NotFound(ApiResponse<object>.Fail("Administrador no encontrado."));
        if (request.NewPassword != request.ConfirmPassword)
            return BadRequest(ApiResponse<object>.Fail("La confirmacion de contrasena no coincide."));
        if (!IsStrongPassword(request.NewPassword))
            return BadRequest(ApiResponse<object>.Fail("La contrasena debe tener al menos 8 caracteres, una mayuscula, una minuscula, un numero y un simbolo."));

        admin.PasswordHash = passwords.Hash(request.NewPassword);
        admin.UpdatedAt = DateTime.UtcNow;
        await uow.SaveChangesAsync(ct);
        return Ok(ApiResponse<bool>.Ok(true, "Contrasena del administrador actualizada."));
    }

    private async Task<IActionResult> SetActive(Guid id, bool active, CancellationToken ct)
    {
        var tenant = await uow.Repository<ClubTenant>().GetByIdAsync(id, ct);
        if (tenant is null) return NotFound(ApiResponse<object>.Fail("Tenant no encontrado."));
        if (tenant.Slug == "platform" && !active)
            return BadRequest(ApiResponse<object>.Fail("No se puede desactivar el tenant de plataforma."));

        tenant.IsActive = active;
        tenant.UpdatedAt = DateTime.UtcNow;
        await uow.SaveChangesAsync(ct);
        return Ok(ApiResponse<bool>.Ok(true, active ? "Club activado." : "Club desactivado."));
    }

    private async Task<IActionResult> SetAdminActive(Guid tenantId, Guid adminId, bool active, CancellationToken ct)
    {
        var admin = await FindClubAdmin(tenantId, adminId, ct);
        if (admin is null) return NotFound(ApiResponse<object>.Fail("Administrador no encontrado."));

        admin.IsActive = active;
        admin.UpdatedAt = DateTime.UtcNow;
        await uow.SaveChangesAsync(ct);
        return Ok(ApiResponse<bool>.Ok(true, active ? "Administrador activado." : "Administrador desactivado."));
    }

    private async Task<AppUser?> FindClubAdmin(Guid tenantId, Guid adminId, CancellationToken ct)
    {
        var admin = await uow.Repository<AppUser>().GetByIdAsync(adminId, ct);
        return admin is { Role: UserRole.ClubAdmin } && admin.ClubTenantId == tenantId ? admin : null;
    }

    private static TenantDto MapTenant(ClubTenant tenant) =>
        new(tenant.Id, tenant.Name, tenant.Slug, tenant.ContactEmail, tenant.ContactPhone, tenant.LogoUrl, tenant.PrimaryColor, tenant.SecondaryColor, tenant.Address, tenant.IsActive, tenant.PlanType, tenant.BillingStatus, tenant.MonthlyPrice, tenant.BillingCurrency, tenant.MaxCourts, tenant.MaxMembers, tenant.MaxCoaches, tenant.TrialEndsAt, tenant.SubscriptionStartedAt, tenant.SubscriptionEndsAt, tenant.BillingNotes);

    private static string? ValidateTenant(UpsertTenantRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name)) return "El nombre del club es obligatorio.";
        if (string.IsNullOrWhiteSpace(request.Slug)) return "El slug del club es obligatorio.";
        if (string.IsNullOrWhiteSpace(request.ContactEmail)) return "El email de contacto es obligatorio.";
        return null;
    }

    private static string NormalizeSlug(string value) =>
        string.Join("-", value.Trim().ToLowerInvariant().Split(' ', StringSplitOptions.RemoveEmptyEntries));

    private static string? CleanOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static string CleanColor(string? value, string fallback) =>
        string.IsNullOrWhiteSpace(value) ? fallback : value.Trim();

    private static void ApplyPlan(UpsertTenantRequest request, ClubTenant tenant)
    {
        tenant.PlanType = request.PlanType ?? tenant.PlanType;
        tenant.BillingStatus = request.BillingStatus ?? tenant.BillingStatus;
        tenant.MonthlyPrice = request.MonthlyPrice is > 0 ? request.MonthlyPrice.Value : tenant.MonthlyPrice > 0 ? tenant.MonthlyPrice : DefaultMonthlyPrice(tenant.PlanType);
        tenant.BillingCurrency = string.IsNullOrWhiteSpace(request.BillingCurrency) ? "UYU" : request.BillingCurrency.Trim().ToUpperInvariant();
        tenant.MaxCourts = NormalizeLimit(request.MaxCourts, DefaultMaxCourts(tenant.PlanType));
        tenant.MaxMembers = NormalizeLimit(request.MaxMembers, DefaultMaxMembers(tenant.PlanType));
        tenant.MaxCoaches = NormalizeLimit(request.MaxCoaches, DefaultMaxCoaches(tenant.PlanType));
        tenant.TrialEndsAt = request.TrialEndsAt;
        tenant.SubscriptionStartedAt = request.SubscriptionStartedAt ?? tenant.SubscriptionStartedAt ?? DateTime.UtcNow;
        tenant.SubscriptionEndsAt = request.SubscriptionEndsAt;
        tenant.BillingNotes = CleanOptional(request.BillingNotes);
    }

    private static int? NormalizeLimit(int? value, int? fallback) =>
        value is null ? fallback : value < 0 ? null : value;

    private static decimal DefaultMonthlyPrice(TenantPlanType plan) => plan switch
    {
        TenantPlanType.Basic => 3490,
        TenantPlanType.Premium => 9990,
        TenantPlanType.Custom => 0,
        _ => 5990
    };

    private static int? DefaultMaxCourts(TenantPlanType plan) => plan switch
    {
        TenantPlanType.Basic => 4,
        TenantPlanType.Premium => null,
        TenantPlanType.Custom => null,
        _ => 10
    };

    private static int? DefaultMaxMembers(TenantPlanType plan) => plan switch
    {
        TenantPlanType.Basic => 150,
        TenantPlanType.Premium => null,
        TenantPlanType.Custom => null,
        _ => 500
    };

    private static int? DefaultMaxCoaches(TenantPlanType plan) => plan switch
    {
        TenantPlanType.Basic => 4,
        TenantPlanType.Premium => null,
        TenantPlanType.Custom => null,
        _ => 15
    };

    private static bool IsStrongPassword(string password) =>
        password.Length >= 8 &&
        password.Any(char.IsUpper) &&
        password.Any(char.IsLower) &&
        password.Any(char.IsDigit) &&
        password.Any(ch => !char.IsLetterOrDigit(ch));

    private static IEnumerable<ClubSetting> DefaultSettings(Guid tenantId) =>
    [
        new() { ClubTenantId = tenantId, Key = "ReservationReleaseHour", Value = "09:00", ValueType = SettingValueType.Time, Description = "Hora en que se liberan reservas." },
        new() { ClubTenantId = tenantId, Key = "ReservationReleaseDaysBefore", Value = "1", ValueType = SettingValueType.Number },
        new() { ClubTenantId = tenantId, Key = "MaxReservationsPerWeek", Value = "1", ValueType = SettingValueType.Number, Description = "Reservas totales permitidas por socio por semana." },
        new() { ClubTenantId = tenantId, Key = "WeekendReservationLimitPerWeek", Value = "1", ValueType = SettingValueType.Number },
        new() { ClubTenantId = tenantId, Key = "MaxClassEnrollmentsPerWeek", Value = "2", ValueType = SettingValueType.Number, Description = "Clases semanales activas o en espera permitidas por socio." },
        new() { ClubTenantId = tenantId, Key = "GuestPlayerFee", Value = "300", ValueType = SettingValueType.Number, Description = "Importe que paga cada invitado no socio por reserva." },
        new() { ClubTenantId = tenantId, Key = "AllowBookingWithOverduePayment", Value = "false", ValueType = SettingValueType.Boolean },
        new() { ClubTenantId = tenantId, Key = "PaymentDueStartDay", Value = "1", ValueType = SettingValueType.Number },
        new() { ClubTenantId = tenantId, Key = "PaymentDueEndDay", Value = "10", ValueType = SettingValueType.Number },
        new() { ClubTenantId = tenantId, Key = "DefaultSlotDurationMinutes", Value = "60", ValueType = SettingValueType.Number },
        new() { ClubTenantId = tenantId, Key = "AllowWaitingList", Value = "true", ValueType = SettingValueType.Boolean },
        new() { ClubTenantId = tenantId, Key = "MaxDaysAheadForBooking", Value = "7", ValueType = SettingValueType.Number },
        new() { ClubTenantId = tenantId, Key = "CancellationLimitHoursBefore", Value = "12", ValueType = SettingValueType.Number },
        new() { ClubTenantId = tenantId, Key = "AllowMemberSelfRegistration", Value = "false", ValueType = SettingValueType.Boolean },
        new() { ClubTenantId = tenantId, Key = "ClubTimezone", Value = "America/Montevideo", ValueType = SettingValueType.String },
        new() { ClubTenantId = tenantId, Key = "Language", Value = "es-UY", ValueType = SettingValueType.String }
    ];
}
