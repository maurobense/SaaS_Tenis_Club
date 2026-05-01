using Microsoft.EntityFrameworkCore;
using TennisClubSaaS.Application.Interfaces;
using TennisClubSaaS.Domain.Entities;
using TennisClubSaaS.Domain.Enums;
using TennisClubSaaS.Infrastructure.Data;

namespace TennisClubSaaS.Infrastructure.Seed;

public static class DbSeeder
{
    public static async Task SeedAsync(TennisClubDbContext db, IPasswordHasher hasher, CancellationToken ct = default)
    {
        var clubId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var platformId = Guid.Parse("99999999-9999-9999-9999-999999999999");
        var adminId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        var coachUserId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        var memberUserId = Guid.Parse("44444444-4444-4444-4444-444444444444");
        var coachProfileId = Guid.Parse("55555555-5555-5555-5555-555555555555");
        var memberProfileId = Guid.Parse("66666666-6666-6666-6666-666666666666");

        var existingPlatform = await db.ClubTenants.IgnoreQueryFilters().FirstOrDefaultAsync(x => x.Slug == "platform", ct);
        if (existingPlatform is not null)
        {
            platformId = existingPlatform.Id;
            existingPlatform.PlanType = TenantPlanType.Custom;
            existingPlatform.BillingStatus = TenantBillingStatus.Active;
            existingPlatform.MonthlyPrice = 0;
            existingPlatform.BillingCurrency = "UYU";
            existingPlatform.MaxCourts = null;
            existingPlatform.MaxMembers = null;
            existingPlatform.MaxCoaches = null;
        }
        else
            db.ClubTenants.Add(new ClubTenant { Id = platformId, Name = "SaaS Platform", Slug = "platform", ContactEmail = "superadmin@saastennis.com", IsActive = true, PlanType = TenantPlanType.Custom, BillingStatus = TenantBillingStatus.Active, MonthlyPrice = 0, BillingCurrency = "UYU", MaxCourts = null, MaxMembers = null, MaxCoaches = null });

        var existingDemo = await db.ClubTenants.IgnoreQueryFilters().FirstOrDefaultAsync(x => x.Id == clubId, ct);
        if (existingDemo is null)
            db.ClubTenants.Add(new ClubTenant { Id = clubId, Name = "Club Demo Tenis", Slug = "club-demo", ContactEmail = "admin@clubdemo.com", PrimaryColor = "#2563eb", SecondaryColor = "#10b981", Address = "Montevideo, Uruguay", PlanType = TenantPlanType.Pro, BillingStatus = TenantBillingStatus.Active, MonthlyPrice = 5990, BillingCurrency = "UYU", MaxCourts = 10, MaxMembers = 500, MaxCoaches = 15, SubscriptionStartedAt = DateTime.UtcNow });
        else
        {
            existingDemo.PlanType = TenantPlanType.Pro;
            existingDemo.BillingStatus = TenantBillingStatus.Active;
            existingDemo.MonthlyPrice = existingDemo.MonthlyPrice > 0 ? existingDemo.MonthlyPrice : 5990;
            existingDemo.BillingCurrency = string.IsNullOrWhiteSpace(existingDemo.BillingCurrency) ? "UYU" : existingDemo.BillingCurrency;
            existingDemo.MaxCourts ??= 10;
            existingDemo.MaxMembers ??= 500;
            existingDemo.MaxCoaches ??= 15;
        }

        await db.SaveChangesAsync(ct);

        var existingSuperAdmin = await db.Users.IgnoreQueryFilters().FirstOrDefaultAsync(x => x.Email == "superadmin@saastennis.com", ct);
        if (existingSuperAdmin is not null)
        {
            existingSuperAdmin.ClubTenantId = platformId;
            existingSuperAdmin.FirstName = "Super";
            existingSuperAdmin.LastName = "Admin";
            existingSuperAdmin.Role = UserRole.SuperAdmin;
            existingSuperAdmin.IsActive = true;
            existingSuperAdmin.IsDeleted = false;
            existingSuperAdmin.PasswordHash = hasher.Hash("Admin123!");
            existingSuperAdmin.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);
            return;
        }

        db.Users.AddRange(
            new AppUser { Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"), ClubTenantId = platformId, FirstName = "Super", LastName = "Admin", Email = "superadmin@saastennis.com", PasswordHash = hasher.Hash("Admin123!"), Role = UserRole.SuperAdmin },
            new AppUser { Id = adminId, ClubTenantId = clubId, FirstName = "Admin", LastName = "Demo", Email = "admin@clubdemo.com", PasswordHash = hasher.Hash("Admin123!"), Role = UserRole.ClubAdmin },
            new AppUser { Id = coachUserId, ClubTenantId = clubId, FirstName = "Carla", LastName = "Coach", Email = "coach@clubdemo.com", PasswordHash = hasher.Hash("Coach123!"), Role = UserRole.Coach },
            new AppUser { Id = memberUserId, ClubTenantId = clubId, FirstName = "Sofía", LastName = "Socio", Email = "socio@clubdemo.com", PasswordHash = hasher.Hash("Socio123!"), Role = UserRole.Member }
        );

        db.CoachProfiles.Add(new CoachProfile { Id = coachProfileId, ClubTenantId = clubId, UserId = coachUserId, Specialty = "Competición y adultos", Bio = "Profesora principal del club." });
        db.MemberProfiles.Add(new MemberProfile { Id = memberProfileId, ClubTenantId = clubId, UserId = memberUserId, MemberNumber = "M-0001", DocumentNumber = "12345678", MembershipStatus = MembershipStatus.Active });
        db.Memberships.Add(new Membership { ClubTenantId = clubId, MemberProfileId = memberProfileId, Month = DateTime.UtcNow.Month, Year = DateTime.UtcNow.Year, Amount = 1800, Status = MonthlyMembershipStatus.Paid, PaidAt = DateTime.UtcNow });

        var courts = Enumerable.Range(1, 4).Select(i => new Court
        {
            Id = Guid.Parse($"77777777-7777-7777-7777-77777777777{i}"),
            ClubTenantId = clubId,
            Name = $"Cancha {i}",
            SurfaceType = i <= 2 ? SurfaceType.Clay : SurfaceType.Hard,
            HasLights = i != 4,
            SlotDurationMinutes = 60
        }).ToList();
        db.Courts.AddRange(courts);
        foreach (var court in courts)
        {
            foreach (var day in Enum.GetValues<DayOfWeek>())
                db.CourtAvailabilities.Add(new CourtAvailability { ClubTenantId = clubId, CourtId = court.Id, DayOfWeek = day, StartTime = new TimeOnly(8, 0), EndTime = new TimeOnly(22, 0), IsAvailable = true });
        }

        db.TrainingClasses.AddRange(
            new TrainingClass { ClubTenantId = clubId, Name = "Adultos Intermedio", CoachId = coachProfileId, CourtId = courts[0].Id, DayOfWeek = DayOfWeek.Tuesday, StartTime = new TimeOnly(19, 0), EndTime = new TimeOnly(20, 30), MaxStudents = 8, Level = ClassLevel.Intermediate },
            new TrainingClass { ClubTenantId = clubId, Name = "Kids Inicial", CoachId = coachProfileId, CourtId = courts[1].Id, DayOfWeek = DayOfWeek.Saturday, StartTime = new TimeOnly(10, 0), EndTime = new TimeOnly(11, 0), MaxStudents = 10, Level = ClassLevel.Kids }
        );

        db.Reservations.Add(new Reservation { ClubTenantId = clubId, CourtId = courts[0].Id, MemberProfileId = memberProfileId, StartDateTime = DateTime.Today.AddDays(1).AddHours(18), EndDateTime = DateTime.Today.AddDays(1).AddHours(19), Status = ReservationStatus.Confirmed });

        db.ClubSettings.AddRange(DefaultSettings(clubId));
        await db.SaveChangesAsync(ct);
    }

    private static IEnumerable<ClubSetting> DefaultSettings(Guid clubId) =>
    [
        new() { ClubTenantId = clubId, Key = "ReservationReleaseHour", Value = "09:00", ValueType = SettingValueType.Time, Description = "Hora en que se liberan reservas." },
        new() { ClubTenantId = clubId, Key = "ReservationReleaseDaysBefore", Value = "1", ValueType = SettingValueType.Number },
        new() { ClubTenantId = clubId, Key = "MaxReservationsPerWeek", Value = "1", ValueType = SettingValueType.Number, Description = "Reservas totales permitidas por socio por semana." },
        new() { ClubTenantId = clubId, Key = "WeekendReservationLimitPerWeek", Value = "1", ValueType = SettingValueType.Number },
        new() { ClubTenantId = clubId, Key = "MaxClassEnrollmentsPerWeek", Value = "2", ValueType = SettingValueType.Number, Description = "Clases semanales activas o en espera permitidas por socio." },
        new() { ClubTenantId = clubId, Key = "GuestPlayerFee", Value = "300", ValueType = SettingValueType.Number, Description = "Importe que paga cada invitado no socio por reserva." },
        new() { ClubTenantId = clubId, Key = "AllowBookingWithOverduePayment", Value = "false", ValueType = SettingValueType.Boolean },
        new() { ClubTenantId = clubId, Key = "PaymentDueStartDay", Value = "1", ValueType = SettingValueType.Number },
        new() { ClubTenantId = clubId, Key = "PaymentDueEndDay", Value = "10", ValueType = SettingValueType.Number },
        new() { ClubTenantId = clubId, Key = "DefaultSlotDurationMinutes", Value = "60", ValueType = SettingValueType.Number },
        new() { ClubTenantId = clubId, Key = "AllowWaitingList", Value = "true", ValueType = SettingValueType.Boolean },
        new() { ClubTenantId = clubId, Key = "MaxDaysAheadForBooking", Value = "7", ValueType = SettingValueType.Number },
        new() { ClubTenantId = clubId, Key = "CancellationLimitHoursBefore", Value = "12", ValueType = SettingValueType.Number },
        new() { ClubTenantId = clubId, Key = "AllowMemberSelfRegistration", Value = "false", ValueType = SettingValueType.Boolean },
        new() { ClubTenantId = clubId, Key = "ClubTimezone", Value = "America/Montevideo", ValueType = SettingValueType.String }
    ];
}
