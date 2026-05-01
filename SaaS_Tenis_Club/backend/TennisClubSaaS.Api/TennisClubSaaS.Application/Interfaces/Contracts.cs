using System.Linq.Expressions;
using TennisClubSaaS.Application.DTOs;
using TennisClubSaaS.Domain.Common;
using TennisClubSaaS.Domain.Entities;

namespace TennisClubSaaS.Application.Interfaces;

public interface ITenantProvider
{
    Guid? CurrentTenantId { get; }
    string? CurrentTenantSlug { get; }
    bool IsSuperAdmin { get; }
    Task<ClubTenant?> ResolveTenantAsync(CancellationToken ct = default);
}

public interface IRepository<T> where T : class
{
    IQueryable<T> Query();
    IQueryable<T> QueryIgnoreFilters();
    Task<T?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task AddAsync(T entity, CancellationToken ct = default);
    void Update(T entity);
    void Remove(T entity);
    Task<bool> AnyAsync(Expression<Func<T, bool>> predicate, CancellationToken ct = default);
}

public interface IUnitOfWork
{
    IRepository<T> Repository<T>() where T : class;
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}

public interface IPasswordHasher
{
    string Hash(string password);
    bool Verify(string password, string hash);
}

public interface IJwtTokenService
{
    LoginResponse CreateLoginResponse(AppUser user, ClubTenant? tenant, string refreshToken);
    string GenerateRefreshToken();
    string HashToken(string token);
}

public interface ISettingService
{
    Task<string> GetAsync(string key, string fallback, CancellationToken ct = default);
    Task<int> GetIntAsync(string key, int fallback, CancellationToken ct = default);
    Task<bool> GetBoolAsync(string key, bool fallback, CancellationToken ct = default);
    Task<IReadOnlyCollection<SettingDto>> GetAllAsync(CancellationToken ct = default);
    Task UpsertAsync(string key, string value, CancellationToken ct = default);
}

public interface IAuthService
{
    Task<ApiResponse<LoginResponse>> LoginAsync(LoginRequest request, CancellationToken ct = default);
    Task<ApiResponse<LoginResponse>> RegisterMemberAsync(RegisterMemberRequest request, CancellationToken ct = default);
    Task<ApiResponse<LoginResponse>> RefreshAsync(RefreshTokenRequest request, CancellationToken ct = default);
    Task<ApiResponse<UserDto>> MeAsync(Guid userId, CancellationToken ct = default);
    Task<ApiResponse<UserDto>> UpdateProfileAsync(Guid userId, UpdateProfileRequest request, CancellationToken ct = default);
    Task<ApiResponse<bool>> ChangePasswordAsync(Guid userId, ChangePasswordRequest request, CancellationToken ct = default);
}

public interface IReservationService
{
    Task<IReadOnlyCollection<ReservationDto>> ListAsync(CancellationToken ct = default);
    Task<ApiResponse<ReservationDto>> CreateMemberReservationAsync(Guid userId, CreateReservationRequest request, CancellationToken ct = default);
    Task<ApiResponse<ReservationDto>> CreateAdminReservationAsync(AdminReservationRequest request, CancellationToken ct = default);
    Task<ApiResponse<bool>> CancelAsync(Guid id, Guid userId, string? reason, CancellationToken ct = default);
    Task<ApiResponse<bool>> MarkGuestFeePaidAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyCollection<AvailableSlotDto>> GetAvailableSlotsAsync(DateOnly date, Guid? courtId, CancellationToken ct = default);
}

public interface IClassService
{
    Task<IReadOnlyCollection<ClassDto>> ListAsync(CancellationToken ct = default);
    Task<ApiResponse<ClassDto>> UpsertAsync(Guid? id, UpsertClassRequest request, CancellationToken ct = default);
    Task<ApiResponse<string>> EnrollAsync(Guid classId, Guid userId, CancellationToken ct = default);
    Task<ApiResponse<string>> EnrollMemberAsync(Guid classId, Guid memberProfileId, CancellationToken ct = default);
    Task<ApiResponse<string>> CancelEnrollmentAsync(Guid classId, Guid userId, CancellationToken ct = default);
    Task<ApiResponse<string>> CancelMemberEnrollmentAsync(Guid classId, Guid memberProfileId, CancellationToken ct = default);
    Task<IReadOnlyCollection<ClassEnrollmentStateDto>> MyEnrollmentsAsync(Guid userId, CancellationToken ct = default);
    Task<IReadOnlyCollection<ClassStudentDto>> StudentsAsync(Guid classId, CancellationToken ct = default);
    Task<IReadOnlyCollection<EligibleMemberDto>> EligibleMembersAsync(Guid classId, CancellationToken ct = default);
    Task<ApiResponse<string>> SaveAttendanceAsync(Guid sessionId, IReadOnlyCollection<AttendanceRequest> attendances, CancellationToken ct = default);
}

public interface IDashboardService
{
    Task<AdminDashboardDto> GetAdminAsync(CancellationToken ct = default);
    Task<IReadOnlyCollection<DashboardCardDto>> GetCoachAsync(Guid userId, CancellationToken ct = default);
    Task<IReadOnlyCollection<DashboardCardDto>> GetMemberAsync(Guid userId, CancellationToken ct = default);
    Task<IReadOnlyCollection<DashboardCardDto>> GetSuperAdminAsync(CancellationToken ct = default);
}
