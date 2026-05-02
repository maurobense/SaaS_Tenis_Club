using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TennisClubSaaS.Api.Extensions;
using TennisClubSaaS.Application.DTOs;
using TennisClubSaaS.Application.Interfaces;
using TennisClubSaaS.Domain.Entities;
using TennisClubSaaS.Domain.Enums;

namespace TennisClubSaaS.Api.Controllers;

[Authorize(Roles = "ClubAdmin,SuperAdmin")]
public class MembersController(IUnitOfWork uow, ITenantProvider tenant, IPasswordHasher passwords) : BaseApiController
{
    [HttpGet] public IActionResult Get() => Ok(ApiResponse<object>.Ok(uow.Repository<MemberProfile>().Query().Select(x => new MemberDto(x.Id, x.UserId, x.User!.FirstName + " " + x.User.LastName, x.User.Email, x.MemberNumber, x.MembershipStatus, x.NoShowCount, x.User.IsActive)).ToList()));
    [HttpGet("{id:guid}")] public async Task<IActionResult> Get(Guid id, CancellationToken ct)
    {
        var item = await uow.Repository<MemberProfile>().Query()
            .Where(x => x.Id == id)
            .Select(x => new
            {
                x.Id,
                x.UserId,
                FullName = x.User!.FirstName + " " + x.User.LastName,
                x.User.Email,
                x.User.Phone,
                x.MemberNumber,
                x.DocumentNumber,
                x.BirthDate,
                x.EmergencyContactName,
                x.EmergencyContactPhone,
                x.MembershipStatus,
                x.JoinedAt,
                x.Notes,
                x.NoShowCount,
                IsActive = x.User.IsActive
            })
            .FirstOrDefaultAsync(ct);
        return item is null ? NotFound(ApiResponse<object>.Fail("Socio no encontrado.")) : Ok(ApiResponse<object>.Ok(item));
    }
    [HttpPost] public async Task<IActionResult> Post(UpsertMemberRequest request, CancellationToken ct)
    {
        var tenantId = tenant.CurrentTenantId ?? Guid.Empty;
        var user = new AppUser { ClubTenantId = tenantId, FirstName = request.FirstName, LastName = request.LastName, Email = request.Email, Phone = request.Phone, Role = UserRole.Member, PasswordHash = passwords.Hash("Socio123!") };
        await uow.Repository<AppUser>().AddAsync(user, ct);
        var profile = new MemberProfile { ClubTenantId = tenantId, UserId = user.Id, DocumentNumber = request.DocumentNumber, BirthDate = request.BirthDate, Notes = request.Notes, MemberNumber = $"M-{DateTime.UtcNow:yyyyMMddHHmmss}" };
        await uow.Repository<MemberProfile>().AddAsync(profile, ct);
        await uow.SaveChangesAsync(ct);
        return Ok(ApiResponse<Guid>.Ok(profile.Id));
    }
    [HttpPut("{id:guid}")] public async Task<IActionResult> Put(Guid id, UpsertMemberRequest request, CancellationToken ct) { var p = await uow.Repository<MemberProfile>().GetByIdAsync(id, ct); if (p is null) return NotFound(ApiResponse<object>.Fail("Socio no encontrado.")); p.DocumentNumber = request.DocumentNumber; p.BirthDate = request.BirthDate; p.Notes = request.Notes; await uow.SaveChangesAsync(ct); return Ok(ApiResponse<bool>.Ok(true)); }
    [HttpPatch("{id:guid}/activate")] public Task<IActionResult> Activate(Guid id, CancellationToken ct) => SetActive(id, true, ct);
    [HttpPatch("{id:guid}/deactivate")] public Task<IActionResult> Deactivate(Guid id, CancellationToken ct) => SetActive(id, false, ct);
    [HttpGet("{id:guid}/payments")] public IActionResult Payments(Guid id) => Ok(ApiResponse<object>.Ok(uow.Repository<Payment>().Query().Where(x => x.MemberProfileId == id).ToList()));
    [HttpGet("{id:guid}/reservations")] public IActionResult Reservations(Guid id) => Ok(ApiResponse<object>.Ok(uow.Repository<Reservation>().Query().Where(x => x.MemberProfileId == id).ToList()));
    [HttpGet("{id:guid}/classes")] public IActionResult Classes(Guid id) => Ok(ApiResponse<object>.Ok(uow.Repository<ClassEnrollment>().Query().Where(x => x.MemberProfileId == id).ToList()));
    private async Task<IActionResult> SetActive(Guid id, bool active, CancellationToken ct) { var p = await uow.Repository<MemberProfile>().GetByIdAsync(id, ct); if (p?.User is null) return NotFound(ApiResponse<object>.Fail("Socio no encontrado.")); p.User.IsActive = active; p.MembershipStatus = active ? MembershipStatus.Active : MembershipStatus.Inactive; await uow.SaveChangesAsync(ct); return Ok(ApiResponse<bool>.Ok(true)); }
}

[Authorize]
public class CoachesController(IUnitOfWork uow, ITenantProvider tenant, IPasswordHasher passwords) : BaseApiController
{
    [HttpGet] public IActionResult Get() => Ok(ApiResponse<object>.Ok(uow.Repository<CoachProfile>().Query().Select(x => new { x.Id, x.UserId, Name = x.User!.FirstName + " " + x.User.LastName, x.User.Email, x.User.Phone, x.Specialty, x.Bio, x.IsActive, UserIsActive = x.User.IsActive }).ToList()));
    [HttpGet("{id:guid}")] public async Task<IActionResult> Get(Guid id, CancellationToken ct) { var item = await uow.Repository<CoachProfile>().GetByIdAsync(id, ct); return item is null ? NotFound(ApiResponse<object>.Fail("Profesor no encontrado.")) : Ok(ApiResponse<object>.Ok(item)); }
    [Authorize(Roles = "ClubAdmin,SuperAdmin")][HttpPost] public async Task<IActionResult> Post(CreateCoachRequest request, CancellationToken ct)
    {
        var tenantId = tenant.CurrentTenantId ?? Guid.Empty;
        if (tenantId == Guid.Empty) return BadRequest(ApiResponse<object>.Fail("Tenant requerido."));
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(ApiResponse<object>.Fail("Email y contrasena son obligatorios."));
        if (request.Password != request.ConfirmPassword)
            return BadRequest(ApiResponse<object>.Fail("La confirmacion de contrasena no coincide."));
        if (!IsStrongPassword(request.Password))
            return BadRequest(ApiResponse<object>.Fail("La contrasena debe tener al menos 8 caracteres, una mayuscula, una minuscula, un numero y un simbolo."));
        if (await uow.Repository<AppUser>().AnyAsync(x => x.ClubTenantId == tenantId && x.Email == request.Email, ct))
            return BadRequest(ApiResponse<object>.Fail("Ya existe un usuario con ese email en este club."));

        var user = new AppUser { ClubTenantId = tenantId, FirstName = request.FirstName.Trim(), LastName = request.LastName.Trim(), Email = request.Email.Trim().ToLowerInvariant(), Phone = request.Phone, Role = UserRole.Coach, IsActive = request.IsActive, PasswordHash = passwords.Hash(request.Password) };
        await uow.Repository<AppUser>().AddAsync(user, ct);
        var coach = new CoachProfile { ClubTenantId = tenantId, UserId = user.Id, Specialty = request.Specialty, Bio = request.Bio, IsActive = request.IsActive };
        await uow.Repository<CoachProfile>().AddAsync(coach, ct);
        await uow.SaveChangesAsync(ct);
        return Ok(ApiResponse<Guid>.Ok(coach.Id, "Profesor creado con credenciales de acceso."));
    }
    [Authorize(Roles = "ClubAdmin,SuperAdmin")][HttpPut("{id:guid}")] public async Task<IActionResult> Put(Guid id, CoachProfile request, CancellationToken ct) { var c = await uow.Repository<CoachProfile>().GetByIdAsync(id, ct); if (c is null) return NotFound(ApiResponse<object>.Fail("Profesor no encontrado.")); c.Bio = request.Bio; c.Specialty = request.Specialty; c.IsActive = request.IsActive; await uow.SaveChangesAsync(ct); return Ok(ApiResponse<bool>.Ok(true)); }
    [HttpGet("{id:guid}/classes")] public IActionResult Classes(Guid id) => Ok(ApiResponse<object>.Ok(uow.Repository<TrainingClass>().Query().Where(x => x.CoachId == id).ToList()));
    [Authorize(Roles = "ClubAdmin,SuperAdmin")][HttpPatch("{id:guid}/reset-password")] public async Task<IActionResult> ResetPassword(Guid id, ResetPasswordRequest request, CancellationToken ct)
    {
        var coach = await uow.Repository<CoachProfile>().GetByIdAsync(id, ct);
        if (coach is null) return NotFound(ApiResponse<object>.Fail("Profesor no encontrado."));
        if (request.NewPassword != request.ConfirmPassword) return BadRequest(ApiResponse<object>.Fail("La confirmacion de contrasena no coincide."));
        if (!IsStrongPassword(request.NewPassword)) return BadRequest(ApiResponse<object>.Fail("La contrasena debe tener al menos 8 caracteres, una mayuscula, una minuscula, un numero y un simbolo."));
        var user = await uow.Repository<AppUser>().GetByIdAsync(coach.UserId, ct);
        if (user is null) return NotFound(ApiResponse<object>.Fail("Usuario del profesor no encontrado."));
        user.PasswordHash = passwords.Hash(request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;
        await uow.SaveChangesAsync(ct);
        return Ok(ApiResponse<bool>.Ok(true, "Contrasena del profesor actualizada."));
    }

    private static bool IsStrongPassword(string password) =>
        password.Length >= 8 &&
        password.Any(char.IsUpper) &&
        password.Any(char.IsLower) &&
        password.Any(char.IsDigit) &&
        password.Any(ch => !char.IsLetterOrDigit(ch));
}

[ApiController]
[Authorize]
[Route("api/members/directory")]
public class MemberDirectoryController(IUnitOfWork uow) : ControllerBase
{
    [HttpGet]
    public IActionResult Get() => Ok(ApiResponse<object>.Ok(uow.Repository<MemberProfile>().Query()
        .Where(x => x.User != null && x.User.IsActive && x.MembershipStatus == MembershipStatus.Active)
        .OrderBy(x => x.User!.LastName)
        .ThenBy(x => x.User!.FirstName)
        .Select(x => new { memberProfileId = x.Id, fullName = x.User!.FirstName + " " + x.User.LastName, x.MemberNumber })
        .ToList()));
}

[Authorize]
public class PaymentsController(IUnitOfWork uow, ITenantProvider tenant) : BaseApiController
{
    [Authorize(Roles = "ClubAdmin,SuperAdmin")]
    [HttpGet] public IActionResult Get() => Ok(ApiResponse<object>.Ok(uow.Repository<Payment>().Query().OrderByDescending(x => x.PaymentDate).Select(x => new PaymentDto(
        x.Id,
        x.MemberProfileId,
        x.MemberProfile != null && x.MemberProfile.User != null ? x.MemberProfile.User.FirstName + " " + x.MemberProfile.User.LastName : null,
        x.MembershipId,
        x.ReservationId,
        x.Reservation != null && x.Reservation.Court != null ? x.Reservation.Court.Name + " - " + x.Reservation.StartDateTime.ToString("dd/MM HH:mm") : null,
        x.Purpose,
        x.Amount,
        x.PaymentDate,
        x.PaymentMethod,
        x.Status,
        x.Reference,
        x.Notes)).ToList()));

    [Authorize(Roles = "Member")]
    [HttpGet("me")]
    public IActionResult Me()
    {
        var profile = uow.Repository<MemberProfile>().Query().FirstOrDefault(x => x.UserId == User.UserId());
        if (profile is null) return NotFound(ApiResponse<object>.Fail("Socio no encontrado."));

        var memberships = uow.Repository<Membership>().Query().Where(x => x.MemberProfileId == profile.Id).ToList();
        var rows = uow.Repository<Payment>().Query()
            .Where(x => x.MemberProfileId == profile.Id)
            .OrderByDescending(x => x.PaymentDate)
            .Select(x => new PaymentDto(
                x.Id,
                x.MemberProfileId,
                x.MemberProfile != null && x.MemberProfile.User != null ? x.MemberProfile.User.FirstName + " " + x.MemberProfile.User.LastName : null,
                x.MembershipId,
                x.ReservationId,
                x.Reservation != null && x.Reservation.Court != null ? x.Reservation.Court.Name + " - " + x.Reservation.StartDateTime.ToString("dd/MM HH:mm") : null,
                x.Purpose,
                x.Amount,
                x.PaymentDate,
                x.PaymentMethod,
                x.Status,
                x.Reference,
                x.Notes))
            .ToList();
        var latestMembership = memberships.OrderByDescending(x => x.Year).ThenByDescending(x => x.Month).FirstOrDefault();
        var pendingAmount = memberships.Where(x => x.Status == MonthlyMembershipStatus.Pending || x.Status == MonthlyMembershipStatus.Overdue).Sum(x => x.Amount);
        var lastPaid = rows.Where(x => x.Status == PaymentStatus.Paid).OrderByDescending(x => x.PaymentDate).FirstOrDefault();

        return Ok(ApiResponse<object>.Ok(new
        {
            membershipStatus = profile.MembershipStatus.ToString(),
            pendingAmount,
            dueFromDay = latestMembership?.DueFromDay ?? 1,
            dueToDay = latestMembership?.DueToDay ?? 10,
            lastPaymentAmount = lastPaid?.Amount ?? 0,
            payments = rows
        }));
    }

    [Authorize(Roles = "ClubAdmin,SuperAdmin")]
    [HttpGet("overdue")] public IActionResult Overdue() => Ok(ApiResponse<object>.Ok(uow.Repository<Membership>().Query().Where(x => x.Status == MonthlyMembershipStatus.Overdue).ToList()));
    [Authorize(Roles = "ClubAdmin,SuperAdmin")]
    [HttpPost] public async Task<IActionResult> Post(CreatePaymentRequest request, CancellationToken ct)
    {
        var tenantId = tenant.CurrentTenantId ?? Guid.Empty;
        var purpose = request.Purpose == 0 ? PaymentPurpose.Membership : request.Purpose;
        var amount = request.Amount;
        Guid? memberProfileId = request.MemberProfileId;
        Guid? membershipId = request.MembershipId;
        Guid? reservationId = request.ReservationId;
        var reference = request.Reference;

        if (amount <= 0) return BadRequest(ApiResponse<object>.Fail("El monto del pago debe ser mayor a cero."));

        if (purpose == PaymentPurpose.Membership)
        {
            if (memberProfileId is null) return BadRequest(ApiResponse<object>.Fail("Debe seleccionar el socio para un pago de membresia."));
            if (membershipId is Guid id && await uow.Repository<Membership>().GetByIdAsync(id, ct) is Membership membership)
            {
                membership.Status = MonthlyMembershipStatus.Paid;
                membership.PaidAt = DateTime.UtcNow;
            }
            reference = string.IsNullOrWhiteSpace(reference) ? "Membresia mensual" : reference;
        }

        if (purpose == PaymentPurpose.CourtGuestFee)
        {
            if (reservationId is null) return BadRequest(ApiResponse<object>.Fail("Debe seleccionar la reserva asociada al pago de invitados."));
            var reservation = await uow.Repository<Reservation>().Query().Include(x => x.Court).FirstOrDefaultAsync(x => x.Id == reservationId, ct);
            if (reservation is null) return BadRequest(ApiResponse<object>.Fail("Reserva no encontrada."));
            if (reservation.GuestFeeTotal <= 0) return BadRequest(ApiResponse<object>.Fail("La reserva seleccionada no tiene invitados no socios para cobrar."));
            memberProfileId ??= reservation.MemberProfileId;
            reservation.GuestFeePaidAt = DateTime.UtcNow;
            reference = string.IsNullOrWhiteSpace(reference) ? $"Invitados cancha - {reservation.Court?.Name} {reservation.StartDateTime:dd/MM HH:mm}" : reference;
        }

        if (purpose == PaymentPurpose.CourtReservation)
        {
            if (reservationId is Guid id && await uow.Repository<Reservation>().GetByIdAsync(id, ct) is Reservation reservation)
                memberProfileId ??= reservation.MemberProfileId;
            reference = string.IsNullOrWhiteSpace(reference) ? "Reserva de cancha" : reference;
        }

        if (purpose == PaymentPurpose.Other)
            reference = string.IsNullOrWhiteSpace(reference) ? "Otro pago" : reference;

        var payment = new Payment
        {
            ClubTenantId = tenantId,
            MemberProfileId = memberProfileId,
            MembershipId = membershipId,
            ReservationId = reservationId,
            Purpose = purpose,
            Amount = amount,
            PaymentMethod = request.PaymentMethod,
            Reference = reference,
            Notes = request.Notes,
            Status = PaymentStatus.Paid
        };
        await uow.Repository<Payment>().AddAsync(payment, ct);
        await uow.SaveChangesAsync(ct);
        return Ok(ApiResponse<Guid>.Ok(payment.Id, "Pago registrado."));
    }
    [Authorize(Roles = "ClubAdmin,SuperAdmin")]
    [HttpPatch("{id:guid}/mark-paid")] public async Task<IActionResult> MarkPaid(Guid id, CancellationToken ct)
    {
        var p = await uow.Repository<Payment>().GetByIdAsync(id, ct);
        if (p is null) return NotFound(ApiResponse<object>.Fail("Pago no encontrado."));
        p.Status = PaymentStatus.Paid;
        p.PaymentDate = DateTime.UtcNow;
        if (p.Purpose == PaymentPurpose.CourtGuestFee && p.ReservationId is Guid reservationId && await uow.Repository<Reservation>().GetByIdAsync(reservationId, ct) is Reservation reservation)
            reservation.GuestFeePaidAt = DateTime.UtcNow;
        await uow.SaveChangesAsync(ct);
        return Ok(ApiResponse<bool>.Ok(true));
    }
    [Authorize(Roles = "ClubAdmin,SuperAdmin")]
    [HttpGet("monthly-summary")] public IActionResult Summary() => Ok(ApiResponse<object>.Ok(uow.Repository<Payment>().Query().Where(x => x.PaymentDate.Month == DateTime.UtcNow.Month && x.Status == PaymentStatus.Paid).GroupBy(x => new { x.PaymentMethod, x.Purpose }).Select(g => new { Method = g.Key.PaymentMethod, g.Key.Purpose, Total = g.Sum(x => x.Amount), Count = g.Count() }).ToList()));
}

[Authorize(Roles = "ClubAdmin,SuperAdmin")]
public class MembershipsController(IUnitOfWork uow, ITenantProvider tenant, ISettingService settings) : BaseApiController
{
    [HttpGet] public IActionResult Get() => Ok(ApiResponse<object>.Ok(uow.Repository<Membership>().Query().OrderByDescending(x => x.Year).ThenByDescending(x => x.Month).ToList()));
    [HttpPost("generate-monthly")] public async Task<IActionResult> GenerateMonthly(CancellationToken ct)
    {
        var dueStart = await settings.GetIntAsync("PaymentDueStartDay", 1, ct); var dueEnd = await settings.GetIntAsync("PaymentDueEndDay", 10, ct);
        foreach (var member in uow.Repository<MemberProfile>().Query().Where(x => x.MembershipStatus == MembershipStatus.Active).ToList())
            if (!uow.Repository<Membership>().Query().Any(x => x.MemberProfileId == member.Id && x.Month == DateTime.UtcNow.Month && x.Year == DateTime.UtcNow.Year))
                await uow.Repository<Membership>().AddAsync(new Membership { ClubTenantId = tenant.CurrentTenantId ?? member.ClubTenantId, MemberProfileId = member.Id, Month = DateTime.UtcNow.Month, Year = DateTime.UtcNow.Year, Amount = 1800, DueFromDay = dueStart, DueToDay = dueEnd }, ct);
        await uow.SaveChangesAsync(ct); return Ok(ApiResponse<bool>.Ok(true));
    }
    [HttpPatch("{id:guid}/mark-paid")] public async Task<IActionResult> Paid(Guid id, CancellationToken ct) { var m = await uow.Repository<Membership>().GetByIdAsync(id, ct); if (m is null) return NotFound(ApiResponse<object>.Fail("Membresía no encontrada.")); m.Status = MonthlyMembershipStatus.Paid; m.PaidAt = DateTime.UtcNow; await uow.SaveChangesAsync(ct); return Ok(ApiResponse<bool>.Ok(true)); }
    [HttpPatch("{id:guid}/mark-overdue")] public async Task<IActionResult> Overdue(Guid id, CancellationToken ct) { var m = await uow.Repository<Membership>().GetByIdAsync(id, ct); if (m is null) return NotFound(ApiResponse<object>.Fail("Membresía no encontrada.")); m.Status = MonthlyMembershipStatus.Overdue; await uow.SaveChangesAsync(ct); return Ok(ApiResponse<bool>.Ok(true)); }
}

[Authorize]
[Route("api/class-sessions")]
public class ClassSessionsController(IUnitOfWork uow, IClassService classes, ITenantProvider tenant) : BaseApiController
{
    [HttpGet] public IActionResult Get() => Ok(ApiResponse<object>.Ok(uow.Repository<ClassSession>().Query().OrderBy(x => x.StartDateTime).ToList()));
    [HttpGet("{id:guid}")] public async Task<IActionResult> Get(Guid id, CancellationToken ct) { var item = await uow.Repository<ClassSession>().GetByIdAsync(id, ct); return item is null ? NotFound(ApiResponse<object>.Fail("Sesión no encontrada.")) : Ok(ApiResponse<object>.Ok(item)); }
    [Authorize(Roles = "ClubAdmin,Coach,SuperAdmin")][HttpPost] public async Task<IActionResult> Post(ClassSession session, CancellationToken ct) { session.ClubTenantId = tenant.CurrentTenantId ?? session.ClubTenantId; await uow.Repository<ClassSession>().AddAsync(session, ct); await uow.SaveChangesAsync(ct); return Ok(ApiResponse<Guid>.Ok(session.Id)); }
    [Authorize(Roles = "ClubAdmin,Coach,SuperAdmin")][HttpPatch("{id:guid}/complete")] public async Task<IActionResult> Complete(Guid id, CancellationToken ct) { var s = await uow.Repository<ClassSession>().GetByIdAsync(id, ct); if (s is null) return NotFound(ApiResponse<object>.Fail("Sesión no encontrada.")); s.Status = ClassSessionStatus.Completed; await uow.SaveChangesAsync(ct); return Ok(ApiResponse<bool>.Ok(true)); }
    [Authorize(Roles = "ClubAdmin,Coach,SuperAdmin")][HttpPatch("{id:guid}/cancel")] public async Task<IActionResult> Cancel(Guid id, CancellationToken ct) { var s = await uow.Repository<ClassSession>().GetByIdAsync(id, ct); if (s is null) return NotFound(ApiResponse<object>.Fail("Sesión no encontrada.")); s.Status = ClassSessionStatus.Cancelled; await uow.SaveChangesAsync(ct); return Ok(ApiResponse<bool>.Ok(true)); }
    [Authorize(Roles = "ClubAdmin,Coach,SuperAdmin")][HttpPost("{id:guid}/attendance")] public async Task<IActionResult> Attendance(Guid id, IReadOnlyCollection<AttendanceRequest> items, CancellationToken ct) => FromResponse(await classes.SaveAttendanceAsync(id, items, ct));
}

[Authorize]
public class NotificationsController(IUnitOfWork uow) : BaseApiController
{
    [HttpGet] public IActionResult Get() => Ok(ApiResponse<object>.Ok(uow.Repository<Notification>().Query().OrderByDescending(x => x.CreatedAt).Take(50).ToList()));
    [HttpPatch("{id:guid}/read")] public async Task<IActionResult> Read(Guid id, CancellationToken ct) { var n = await uow.Repository<Notification>().GetByIdAsync(id, ct); if (n is null) return NotFound(ApiResponse<object>.Fail("Notificación no encontrada.")); n.IsRead = true; await uow.SaveChangesAsync(ct); return Ok(ApiResponse<bool>.Ok(true)); }
    [HttpPatch("read-all")] public async Task<IActionResult> ReadAll(CancellationToken ct) { foreach (var n in uow.Repository<Notification>().Query().Where(x => !x.IsRead).ToList()) n.IsRead = true; await uow.SaveChangesAsync(ct); return Ok(ApiResponse<bool>.Ok(true)); }
}

[Authorize(Roles = "ClubAdmin,SuperAdmin")]
public class AuditLogsController(IUnitOfWork uow) : BaseApiController
{
    [HttpGet] public IActionResult Get() => Ok(ApiResponse<object>.Ok(uow.Repository<AuditLog>().Query().OrderByDescending(x => x.CreatedAt).Take(250).ToList()));
}
