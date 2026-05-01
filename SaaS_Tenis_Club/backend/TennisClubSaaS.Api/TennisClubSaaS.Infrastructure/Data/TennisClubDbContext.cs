using Microsoft.EntityFrameworkCore;
using TennisClubSaaS.Application.Interfaces;
using TennisClubSaaS.Domain.Common;
using TennisClubSaaS.Domain.Entities;
using TennisClubSaaS.Domain.Enums;

namespace TennisClubSaaS.Infrastructure.Data;

public class TennisClubDbContext(DbContextOptions<TennisClubDbContext> options, ITenantProvider? tenantProvider = null) : DbContext(options)
{
    private Guid? CurrentTenantId => tenantProvider?.CurrentTenantId;
    private bool CurrentUserIsSuperAdmin => tenantProvider?.IsSuperAdmin == true;
    public DbSet<ClubTenant> ClubTenants => Set<ClubTenant>();
    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<MemberProfile> MemberProfiles => Set<MemberProfile>();
    public DbSet<Membership> Memberships => Set<Membership>();
    public DbSet<Court> Courts => Set<Court>();
    public DbSet<CourtAvailability> CourtAvailabilities => Set<CourtAvailability>();
    public DbSet<Reservation> Reservations => Set<Reservation>();
    public DbSet<ReservationParticipant> ReservationParticipants => Set<ReservationParticipant>();
    public DbSet<TrainingClass> TrainingClasses => Set<TrainingClass>();
    public DbSet<ClassEnrollment> ClassEnrollments => Set<ClassEnrollment>();
    public DbSet<ClassSession> ClassSessions => Set<ClassSession>();
    public DbSet<ClassAttendance> ClassAttendances => Set<ClassAttendance>();
    public DbSet<CoachProfile> CoachProfiles => Set<CoachProfile>();
    public DbSet<ClubSetting> ClubSettings => Set<ClubSetting>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(TennisClubDbContext).Assembly);

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (typeof(BaseEntity).IsAssignableFrom(entityType.ClrType))
            {
                modelBuilder.Entity(entityType.ClrType).HasIndex(nameof(BaseEntity.ClubTenantId));
            }
        }

        modelBuilder.Entity<ClubTenant>(b =>
        {
            b.HasIndex(x => x.Slug).IsUnique();
            b.Property(x => x.Name).HasMaxLength(160).IsRequired();
            b.Property(x => x.Slug).HasMaxLength(80).IsRequired();
            b.Property(x => x.PlanType).HasDefaultValue(TenantPlanType.Pro);
            b.Property(x => x.BillingStatus).HasDefaultValue(TenantBillingStatus.Trial);
            b.Property(x => x.MonthlyPrice).HasPrecision(18, 2).HasDefaultValue(5990m);
            b.Property(x => x.BillingCurrency).HasMaxLength(8).HasDefaultValue("UYU");
        });

        modelBuilder.Entity<AppUser>(b =>
        {
            b.ToTable("AppUsers");
            b.HasIndex(x => new { x.ClubTenantId, x.Email }).IsUnique();
            b.Property(x => x.Email).HasMaxLength(180).IsRequired();
            b.Property(x => x.PasswordHash).HasMaxLength(300).IsRequired();
            b.HasOne(x => x.ClubTenant).WithMany(x => x.Users).HasForeignKey(x => x.ClubTenantId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<MemberProfile>().HasIndex(x => new { x.ClubTenantId, x.MemberNumber }).IsUnique();
        modelBuilder.Entity<ClubSetting>().HasIndex(x => new { x.ClubTenantId, x.Key }).IsUnique();
        modelBuilder.Entity<ClassEnrollment>().HasIndex(x => new { x.ClubTenantId, x.TrainingClassId, x.MemberProfileId }).IsUnique();
        modelBuilder.Entity<Reservation>().HasIndex(x => new { x.ClubTenantId, x.CourtId, x.StartDateTime, x.EndDateTime });
        modelBuilder.Entity<Reservation>().Property(x => x.GuestFeePerPlayer).HasPrecision(18, 2);
        modelBuilder.Entity<Reservation>().Property(x => x.GuestFeeTotal).HasPrecision(18, 2);
        modelBuilder.Entity<ReservationParticipant>(b =>
        {
            b.HasIndex(x => new { x.ClubTenantId, x.ReservationId, x.Position }).IsUnique();
            b.Property(x => x.FullName).HasMaxLength(180).IsRequired();
        });
        modelBuilder.Entity<Payment>(b =>
        {
            b.Property(x => x.Amount).HasPrecision(18, 2);
            b.Property(x => x.Purpose).HasDefaultValue(PaymentPurpose.Membership);
            b.HasIndex(x => new { x.ClubTenantId, x.Purpose, x.PaymentDate });
            b.HasOne(x => x.Reservation).WithMany(x => x.Payments).HasForeignKey(x => x.ReservationId).OnDelete(DeleteBehavior.Restrict);
        });
        modelBuilder.Entity<Membership>().Property(x => x.Amount).HasPrecision(18, 2);

        foreach (var foreignKey in modelBuilder.Model.GetEntityTypes().SelectMany(e => e.GetForeignKeys()))
        {
            foreignKey.DeleteBehavior = DeleteBehavior.Restrict;
        }

        AddTenantFilters(modelBuilder);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = DateTime.UtcNow;
                if (entry.Entity.ClubTenantId == Guid.Empty && tenantProvider?.CurrentTenantId is Guid tenantId)
                    entry.Entity.ClubTenantId = tenantId;
            }
            if (entry.State == EntityState.Modified)
                entry.Entity.UpdatedAt = DateTime.UtcNow;
        }

        foreach (var entry in ChangeTracker.Entries<TenantlessEntity>())
        {
            if (entry.State == EntityState.Added) entry.Entity.CreatedAt = DateTime.UtcNow;
            if (entry.State == EntityState.Modified) entry.Entity.UpdatedAt = DateTime.UtcNow;
        }

        return base.SaveChangesAsync(cancellationToken);
    }

    private void AddTenantFilters(ModelBuilder modelBuilder)
    {
        // Filtro global: salvo SuperAdmin, toda entidad BaseEntity queda aislada por ClubTenantId.
        modelBuilder.Entity<AppUser>().HasQueryFilter(x => !x.IsDeleted && (CurrentUserIsSuperAdmin || x.ClubTenantId == Guid.Empty || x.ClubTenantId == CurrentTenantId));
        modelBuilder.Entity<RefreshToken>().HasQueryFilter(x => !x.IsDeleted && (CurrentUserIsSuperAdmin || x.ClubTenantId == CurrentTenantId || x.ClubTenantId == Guid.Empty));
        modelBuilder.Entity<MemberProfile>().HasQueryFilter(x => !x.IsDeleted && (CurrentUserIsSuperAdmin || x.ClubTenantId == CurrentTenantId));
        modelBuilder.Entity<Membership>().HasQueryFilter(x => !x.IsDeleted && (CurrentUserIsSuperAdmin || x.ClubTenantId == CurrentTenantId));
        modelBuilder.Entity<Court>().HasQueryFilter(x => !x.IsDeleted && (CurrentUserIsSuperAdmin || x.ClubTenantId == CurrentTenantId));
        modelBuilder.Entity<CourtAvailability>().HasQueryFilter(x => !x.IsDeleted && (CurrentUserIsSuperAdmin || x.ClubTenantId == CurrentTenantId));
        modelBuilder.Entity<Reservation>().HasQueryFilter(x => !x.IsDeleted && (CurrentUserIsSuperAdmin || x.ClubTenantId == CurrentTenantId));
        modelBuilder.Entity<ReservationParticipant>().HasQueryFilter(x => !x.IsDeleted && (CurrentUserIsSuperAdmin || x.ClubTenantId == CurrentTenantId));
        modelBuilder.Entity<TrainingClass>().HasQueryFilter(x => !x.IsDeleted && (CurrentUserIsSuperAdmin || x.ClubTenantId == CurrentTenantId));
        modelBuilder.Entity<ClassEnrollment>().HasQueryFilter(x => !x.IsDeleted && (CurrentUserIsSuperAdmin || x.ClubTenantId == CurrentTenantId));
        modelBuilder.Entity<ClassSession>().HasQueryFilter(x => !x.IsDeleted && (CurrentUserIsSuperAdmin || x.ClubTenantId == CurrentTenantId));
        modelBuilder.Entity<ClassAttendance>().HasQueryFilter(x => !x.IsDeleted && (CurrentUserIsSuperAdmin || x.ClubTenantId == CurrentTenantId));
        modelBuilder.Entity<CoachProfile>().HasQueryFilter(x => !x.IsDeleted && (CurrentUserIsSuperAdmin || x.ClubTenantId == CurrentTenantId));
        modelBuilder.Entity<ClubSetting>().HasQueryFilter(x => !x.IsDeleted && (CurrentUserIsSuperAdmin || x.ClubTenantId == CurrentTenantId));
        modelBuilder.Entity<Payment>().HasQueryFilter(x => !x.IsDeleted && (CurrentUserIsSuperAdmin || x.ClubTenantId == CurrentTenantId));
        modelBuilder.Entity<Notification>().HasQueryFilter(x => !x.IsDeleted && (CurrentUserIsSuperAdmin || x.ClubTenantId == CurrentTenantId));
        modelBuilder.Entity<AuditLog>().HasQueryFilter(x => !x.IsDeleted && (CurrentUserIsSuperAdmin || x.ClubTenantId == CurrentTenantId));
    }
}
