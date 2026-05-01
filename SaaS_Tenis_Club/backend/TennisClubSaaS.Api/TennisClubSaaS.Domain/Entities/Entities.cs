using TennisClubSaaS.Domain.Common;
using TennisClubSaaS.Domain.Enums;

namespace TennisClubSaaS.Domain.Entities;

public class ClubTenant : TenantlessEntity
{
    public string Name { get; set; } = "";
    public string Slug { get; set; } = "";
    public string ContactEmail { get; set; } = "";
    public string? ContactPhone { get; set; }
    public string? LogoUrl { get; set; }
    public string PrimaryColor { get; set; } = "#2563eb";
    public string SecondaryColor { get; set; } = "#10b981";
    public string? Address { get; set; }
    public bool IsActive { get; set; } = true;
    public TenantPlanType PlanType { get; set; } = TenantPlanType.Pro;
    public TenantBillingStatus BillingStatus { get; set; } = TenantBillingStatus.Trial;
    public decimal MonthlyPrice { get; set; } = 5990;
    public string BillingCurrency { get; set; } = "UYU";
    public int? MaxCourts { get; set; } = 8;
    public int? MaxMembers { get; set; } = 300;
    public int? MaxCoaches { get; set; } = 10;
    public DateTime? TrialEndsAt { get; set; }
    public DateTime? SubscriptionStartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? SubscriptionEndsAt { get; set; }
    public string? BillingNotes { get; set; }
    public ICollection<AppUser> Users { get; set; } = [];
    public ICollection<Court> Courts { get; set; } = [];
}

public class AppUser : BaseEntity
{
    public Guid? ClubTenantIdNullable { get; set; }
    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
    public string Email { get; set; } = "";
    public string? Phone { get; set; }
    public string PasswordHash { get; set; } = "";
    public UserRole Role { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? LastLoginAt { get; set; }
    public ClubTenant? ClubTenant { get; set; }
    public MemberProfile? MemberProfile { get; set; }
    public CoachProfile? CoachProfile { get; set; }
    public ICollection<RefreshToken> RefreshTokens { get; set; } = [];
}

public class RefreshToken : BaseEntity
{
    public Guid UserId { get; set; }
    public string TokenHash { get; set; } = "";
    public DateTime ExpiresAt { get; set; }
    public DateTime? RevokedAt { get; set; }
    public string? ReplacedByTokenHash { get; set; }
    public AppUser? User { get; set; }
    public bool IsActive => RevokedAt is null && DateTime.UtcNow < ExpiresAt;
}

public class MemberProfile : BaseEntity
{
    public Guid UserId { get; set; }
    public string MemberNumber { get; set; } = "";
    public string? DocumentNumber { get; set; }
    public DateOnly? BirthDate { get; set; }
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactPhone { get; set; }
    public MembershipStatus MembershipStatus { get; set; } = MembershipStatus.Active;
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    public string? Notes { get; set; }
    public int NoShowCount { get; set; }
    public AppUser? User { get; set; }
    public ICollection<Membership> Memberships { get; set; } = [];
    public ICollection<Reservation> Reservations { get; set; } = [];
}

public class Membership : BaseEntity
{
    public Guid MemberProfileId { get; set; }
    public int Month { get; set; }
    public int Year { get; set; }
    public decimal Amount { get; set; }
    public MonthlyMembershipStatus Status { get; set; } = MonthlyMembershipStatus.Pending;
    public int DueFromDay { get; set; } = 1;
    public int DueToDay { get; set; } = 10;
    public DateTime? PaidAt { get; set; }
    public MemberProfile? MemberProfile { get; set; }
    public ICollection<Payment> Payments { get; set; } = [];
}

public class Court : BaseEntity
{
    public string Name { get; set; } = "";
    public SurfaceType SurfaceType { get; set; } = SurfaceType.Clay;
    public CourtLocationType IndoorOutdoor { get; set; } = CourtLocationType.Outdoor;
    public bool HasLights { get; set; }
    public bool IsActive { get; set; } = true;
    public TimeOnly OpeningTime { get; set; } = new(8, 0);
    public TimeOnly ClosingTime { get; set; } = new(22, 0);
    public int SlotDurationMinutes { get; set; } = 60;
    public ICollection<CourtAvailability> Availabilities { get; set; } = [];
    public ICollection<Reservation> Reservations { get; set; } = [];
}

public class CourtAvailability : BaseEntity
{
    public Guid CourtId { get; set; }
    public DayOfWeek DayOfWeek { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public bool IsAvailable { get; set; } = true;
    public Court? Court { get; set; }
}

public class Reservation : BaseEntity
{
    public Guid CourtId { get; set; }
    public Guid? MemberProfileId { get; set; }
    public DateTime StartDateTime { get; set; }
    public DateTime EndDateTime { get; set; }
    public ReservationStatus Status { get; set; } = ReservationStatus.Confirmed;
    public ReservationType ReservationType { get; set; } = ReservationType.MemberBooking;
    public ReservationPlayFormat PlayFormat { get; set; } = ReservationPlayFormat.Singles;
    public decimal GuestFeePerPlayer { get; set; }
    public decimal GuestFeeTotal { get; set; }
    public DateTime? GuestFeePaidAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    public string? CancellationReason { get; set; }
    public Court? Court { get; set; }
    public MemberProfile? MemberProfile { get; set; }
    public ICollection<ReservationParticipant> Participants { get; set; } = [];
    public ICollection<Payment> Payments { get; set; } = [];
}

public class ReservationParticipant : BaseEntity
{
    public Guid ReservationId { get; set; }
    public Guid? MemberProfileId { get; set; }
    public bool IsClubMember { get; set; }
    public string FullName { get; set; } = "";
    public int Position { get; set; }
    public Reservation? Reservation { get; set; }
    public MemberProfile? MemberProfile { get; set; }
}

public class TrainingClass : BaseEntity
{
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public Guid CoachId { get; set; }
    public Guid? CourtId { get; set; }
    public DayOfWeek DayOfWeek { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public int MaxStudents { get; set; } = 8;
    public ClassLevel Level { get; set; } = ClassLevel.Beginner;
    public bool IsActive { get; set; } = true;
    public CoachProfile? Coach { get; set; }
    public Court? Court { get; set; }
    public ICollection<ClassEnrollment> Enrollments { get; set; } = [];
}

public class ClassEnrollment : BaseEntity
{
    public Guid TrainingClassId { get; set; }
    public Guid MemberProfileId { get; set; }
    public EnrollmentStatus Status { get; set; } = EnrollmentStatus.Active;
    public DateTime EnrolledAt { get; set; } = DateTime.UtcNow;
    public DateTime? CancelledAt { get; set; }
    public TrainingClass? TrainingClass { get; set; }
    public MemberProfile? MemberProfile { get; set; }
}

public class ClassSession : BaseEntity
{
    public Guid TrainingClassId { get; set; }
    public DateOnly SessionDate { get; set; }
    public DateTime StartDateTime { get; set; }
    public DateTime EndDateTime { get; set; }
    public ClassSessionStatus Status { get; set; } = ClassSessionStatus.Scheduled;
    public string? Notes { get; set; }
    public TrainingClass? TrainingClass { get; set; }
    public ICollection<ClassAttendance> Attendances { get; set; } = [];
}

public class ClassAttendance : BaseEntity
{
    public Guid ClassSessionId { get; set; }
    public Guid MemberProfileId { get; set; }
    public AttendanceStatus AttendanceStatus { get; set; }
    public string? Notes { get; set; }
    public ClassSession? ClassSession { get; set; }
    public MemberProfile? MemberProfile { get; set; }
}

public class CoachProfile : BaseEntity
{
    public Guid UserId { get; set; }
    public string? Bio { get; set; }
    public string? Specialty { get; set; }
    public bool IsActive { get; set; } = true;
    public AppUser? User { get; set; }
    public ICollection<TrainingClass> Classes { get; set; } = [];
}

public class ClubSetting : BaseEntity
{
    public string Key { get; set; } = "";
    public string Value { get; set; } = "";
    public SettingValueType ValueType { get; set; } = SettingValueType.String;
    public string? Description { get; set; }
}

public class Payment : BaseEntity
{
    public Guid? MemberProfileId { get; set; }
    public Guid? MembershipId { get; set; }
    public Guid? ReservationId { get; set; }
    public PaymentPurpose Purpose { get; set; } = PaymentPurpose.Membership;
    public decimal Amount { get; set; }
    public DateTime PaymentDate { get; set; } = DateTime.UtcNow;
    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.Cash;
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
    public string? Reference { get; set; }
    public string? Notes { get; set; }
    public MemberProfile? MemberProfile { get; set; }
    public Membership? Membership { get; set; }
    public Reservation? Reservation { get; set; }
}

public class Notification : BaseEntity
{
    public Guid UserId { get; set; }
    public string Title { get; set; } = "";
    public string Message { get; set; } = "";
    public NotificationType Type { get; set; } = NotificationType.System;
    public bool IsRead { get; set; }
    public AppUser? User { get; set; }
}

public class AuditLog : BaseEntity
{
    public Guid? UserId { get; set; }
    public string Action { get; set; } = "";
    public string EntityName { get; set; } = "";
    public string? EntityId { get; set; }
    public string? OldValues { get; set; }
    public string? NewValues { get; set; }
}
