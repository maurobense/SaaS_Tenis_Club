using TennisClubSaaS.Domain.Enums;

namespace TennisClubSaaS.Application.DTOs;

public record ApiResponse<T>(bool Success, string Message, T? Data = default, IReadOnlyCollection<string>? Errors = null)
{
    public static ApiResponse<T> Ok(T data, string message = "Operación realizada correctamente") => new(true, message, data);
    public static ApiResponse<T> Fail(string message, params string[] errors) => new(false, message, default, errors);
}

public record PagedResult<T>(IReadOnlyCollection<T> Items, int Total, int Page, int PageSize);

public record LoginRequest(string Email, string Password, string TenantSlug);
public record LoginResponse(string AccessToken, string RefreshToken, DateTime ExpiresAt, UserDto User, TenantDto? Tenant);
public record RefreshTokenRequest(string RefreshToken);
public record ChangePasswordRequest(string CurrentPassword, string NewPassword, string ConfirmPassword);
public record UpdateProfileRequest(string FirstName, string LastName, string? Phone);
public record RegisterMemberRequest(string TenantSlug, string FirstName, string LastName, string Email, string Password, string? Phone, string? DocumentNumber);
public record UserDto(Guid Id, string FirstName, string LastName, string Email, string? Phone, UserRole Role, bool IsActive, Guid? ClubTenantId);
public record TenantDto(Guid Id, string Name, string Slug, string ContactEmail, string? ContactPhone, string? LogoUrl, string PrimaryColor, string SecondaryColor, string? Address, bool IsActive, TenantPlanType PlanType, TenantBillingStatus BillingStatus, decimal MonthlyPrice, string BillingCurrency, int? MaxCourts, int? MaxMembers, int? MaxCoaches, DateTime? TrialEndsAt, DateTime? SubscriptionStartedAt, DateTime? SubscriptionEndsAt, string? BillingNotes);

public record UpsertTenantRequest(string Name, string Slug, string ContactEmail, string? ContactPhone, string? LogoUrl, string PrimaryColor, string SecondaryColor, string? Address, TenantPlanType? PlanType, TenantBillingStatus? BillingStatus, decimal? MonthlyPrice, string? BillingCurrency, int? MaxCourts, int? MaxMembers, int? MaxCoaches, DateTime? TrialEndsAt, DateTime? SubscriptionStartedAt, DateTime? SubscriptionEndsAt, string? BillingNotes);
public record CreateTenantAdminRequest(string FirstName, string LastName, string Email, string Password, string ConfirmPassword, string? Phone, bool IsActive = true);
public record TenantAdminDto(Guid Id, string FirstName, string LastName, string Email, string? Phone, bool IsActive, DateTime? LastLoginAt);
public record UpsertCourtRequest(string Name, SurfaceType SurfaceType, CourtLocationType IndoorOutdoor, bool HasLights, bool IsActive, TimeOnly OpeningTime, TimeOnly ClosingTime, int SlotDurationMinutes);
public record CourtDto(Guid Id, string Name, SurfaceType SurfaceType, CourtLocationType IndoorOutdoor, bool HasLights, bool IsActive, TimeOnly OpeningTime, TimeOnly ClosingTime, int SlotDurationMinutes);

public record ReservationPlayerRequest(bool IsClubMember, Guid? MemberProfileId, string? FullName);
public record ReservationParticipantDto(Guid? MemberProfileId, bool IsClubMember, string FullName, int Position);
public record ReservationRulesDto(decimal GuestPlayerFee, int MaxReservationsPerWeek, int MaxClassEnrollmentsPerWeek);
public record CreateReservationRequest(Guid CourtId, DateTime StartDateTime, DateTime EndDateTime, ReservationPlayFormat PlayFormat = ReservationPlayFormat.Singles, IReadOnlyCollection<ReservationPlayerRequest>? Players = null);
public record AdminReservationRequest(Guid CourtId, Guid? MemberProfileId, DateTime StartDateTime, DateTime EndDateTime, ReservationType ReservationType, string? Reason, ReservationPlayFormat PlayFormat = ReservationPlayFormat.Singles, IReadOnlyCollection<ReservationPlayerRequest>? Players = null);
public record ReservationDto(Guid Id, Guid CourtId, string CourtName, Guid? MemberProfileId, string? MemberName, DateTime StartDateTime, DateTime EndDateTime, ReservationStatus Status, ReservationType ReservationType, ReservationPlayFormat PlayFormat, IReadOnlyCollection<ReservationParticipantDto> Players, int GuestPlayerCount, decimal GuestFeePerPlayer, decimal GuestFeeTotal, bool GuestFeePaid);
public record AvailableSlotDto(Guid CourtId, string CourtName, DateTime Start, DateTime End, bool IsAvailable, string? BlockReason);

public record MemberDto(Guid Id, Guid UserId, string FullName, string Email, string MemberNumber, MembershipStatus MembershipStatus, int NoShowCount, bool IsActive);
public record UpsertMemberRequest(string FirstName, string LastName, string Email, string? Phone, string? DocumentNumber, DateOnly? BirthDate, string? Notes);
public record CreateCoachRequest(string FirstName, string LastName, string Email, string Password, string ConfirmPassword, string? Phone, string? Specialty, string? Bio, bool IsActive = true);
public record ResetPasswordRequest(string NewPassword, string ConfirmPassword);

public record UpsertClassRequest(string Name, string? Description, Guid CoachId, Guid? CourtId, DayOfWeek DayOfWeek, TimeOnly StartTime, TimeOnly EndTime, int MaxStudents, ClassLevel Level, bool IsActive);
public record ClassDto(Guid Id, string Name, string? CoachName, string? CourtName, DayOfWeek DayOfWeek, TimeOnly StartTime, TimeOnly EndTime, int MaxStudents, int ActiveStudents, int WaitingList, ClassLevel Level, bool IsActive);
public record ClassEnrollmentStateDto(Guid TrainingClassId, Guid MemberProfileId, string Status);
public record EnrollMemberRequest(Guid MemberProfileId);
public record ClassStudentDto(Guid MemberProfileId, string FullName, string Email, string Status, DateTime EnrolledAt);
public record EligibleMemberDto(Guid MemberProfileId, string FullName, string Email, string MemberNumber, string MembershipStatus);
public record AttendanceRequest(Guid MemberProfileId, AttendanceStatus AttendanceStatus, string? Notes);

public record PaymentDto(Guid Id, Guid? MemberProfileId, string? MemberName, Guid? MembershipId, Guid? ReservationId, string? ReservationLabel, PaymentPurpose Purpose, decimal Amount, DateTime PaymentDate, PaymentMethod PaymentMethod, PaymentStatus Status, string? Reference, string? Notes);
public record CreatePaymentRequest(Guid? MemberProfileId, Guid? MembershipId, Guid? ReservationId, PaymentPurpose Purpose, decimal Amount, PaymentMethod PaymentMethod, string? Reference, string? Notes);
public record SettingDto(string Key, string Value, SettingValueType ValueType, string? Description);
public record DashboardCardDto(string Label, string Value, string Trend, string Tone);
public record AdminDashboardDto(IReadOnlyCollection<DashboardCardDto> Cards, IReadOnlyCollection<ReservationDto> UpcomingReservations, IReadOnlyCollection<PaymentDto> OverduePayments);
