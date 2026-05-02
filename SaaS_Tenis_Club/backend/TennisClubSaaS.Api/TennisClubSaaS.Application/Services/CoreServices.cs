using TennisClubSaaS.Application.DTOs;
using TennisClubSaaS.Application.Interfaces;
using TennisClubSaaS.Domain.Entities;
using TennisClubSaaS.Domain.Enums;

namespace TennisClubSaaS.Application.Services;

public class SettingService(IUnitOfWork uow, ITenantProvider tenantProvider) : ISettingService
{
    public Task<string> GetAsync(string key, string fallback, CancellationToken ct = default)
    {
        var value = uow.Repository<ClubSetting>().Query().FirstOrDefault(x => x.Key == key)?.Value;
        return Task.FromResult(value ?? fallback);
    }

    public async Task<int> GetIntAsync(string key, int fallback, CancellationToken ct = default) =>
        int.TryParse(await GetAsync(key, fallback.ToString(), ct), out var value) ? value : fallback;

    public async Task<bool> GetBoolAsync(string key, bool fallback, CancellationToken ct = default) =>
        bool.TryParse(await GetAsync(key, fallback.ToString(), ct), out var value) ? value : fallback;

    public Task<IReadOnlyCollection<SettingDto>> GetAllAsync(CancellationToken ct = default)
    {
        var rows = uow.Repository<ClubSetting>().Query()
            .OrderBy(x => x.Key)
            .Select(x => new SettingDto(x.Key, x.Value, x.ValueType, x.Description))
            .ToList();
        return Task.FromResult<IReadOnlyCollection<SettingDto>>(rows);
    }

    public async Task UpsertAsync(string key, string value, CancellationToken ct = default)
    {
        var setting = uow.Repository<ClubSetting>().Query().FirstOrDefault(x => x.Key == key);
        if (setting is null)
        {
            var tenantId = tenantProvider.CurrentTenantId ?? throw new InvalidOperationException("Tenant requerido.");
            await uow.Repository<ClubSetting>().AddAsync(new ClubSetting { ClubTenantId = tenantId, Key = key, Value = value }, ct);
        }
        else
        {
            setting.Value = value;
            setting.UpdatedAt = DateTime.UtcNow;
        }
        await uow.SaveChangesAsync(ct);
    }
}

public class AuthService(IUnitOfWork uow, IPasswordHasher passwords, IJwtTokenService jwt) : IAuthService
{
    public async Task<ApiResponse<LoginResponse>> LoginAsync(LoginRequest request, CancellationToken ct = default)
    {
        var tenantSlug = string.IsNullOrWhiteSpace(request.TenantSlug) ? "" : request.TenantSlug.Trim().ToLowerInvariant();
        var email = string.IsNullOrWhiteSpace(request.Email) ? "" : request.Email.Trim().ToLowerInvariant();
        // El login no puede depender del tenant resuelto por header: antes de autenticar
        // el navegador puede traer guardado otro X-Tenant-Slug. Se valida con el slug
        // enviado en el formulario e ignorando filtros globales de multitenancy.
        var tenants = uow.Repository<ClubTenant>().QueryIgnoreFilters();
        var tenant = tenants.FirstOrDefault(x => x.Slug == tenantSlug && x.IsActive);
        if (tenant is null && tenantSlug != "platform")
            return ApiResponse<LoginResponse>.Fail("Club no encontrado o inactivo.");

        var users = uow.Repository<AppUser>().QueryIgnoreFilters();
        var user = tenantSlug == "platform"
            ? users.FirstOrDefault(x => x.Email == email && x.Role == UserRole.SuperAdmin)
            : users.FirstOrDefault(x => x.Email == email && (x.Role == UserRole.SuperAdmin || x.ClubTenantId == tenant!.Id));
        if (user is null || !user.IsActive || !passwords.Verify(request.Password, user.PasswordHash))
            return ApiResponse<LoginResponse>.Fail("Credenciales inválidas.");

        if (user.Role == UserRole.SuperAdmin && tenant is null)
            tenant = tenants.FirstOrDefault(x => x.Slug == "platform");

        user.LastLoginAt = DateTime.UtcNow;
        var refresh = jwt.GenerateRefreshToken();
        await uow.Repository<RefreshToken>().AddAsync(new RefreshToken
        {
            ClubTenantId = user.ClubTenantId,
            UserId = user.Id,
            TokenHash = jwt.HashToken(refresh),
            ExpiresAt = DateTime.UtcNow.AddDays(30)
        }, ct);
        await uow.SaveChangesAsync(ct);

        return ApiResponse<LoginResponse>.Ok(jwt.CreateLoginResponse(user, tenant, refresh), "Login correcto.");
    }

    public async Task<ApiResponse<LoginResponse>> RegisterMemberAsync(RegisterMemberRequest request, CancellationToken ct = default)
    {
        var tenant = uow.Repository<ClubTenant>().QueryIgnoreFilters().FirstOrDefault(x => x.Slug == request.TenantSlug && x.IsActive);
        if (tenant is null) return ApiResponse<LoginResponse>.Fail("Club no encontrado.");

        var allow = uow.Repository<ClubSetting>().Query().FirstOrDefault(x => x.ClubTenantId == tenant.Id && x.Key == "AllowMemberSelfRegistration")?.Value;
        if (!bool.TryParse(allow, out var canRegister) || !canRegister)
            return ApiResponse<LoginResponse>.Fail("El registro público no está habilitado para este club.");

        if (await uow.Repository<AppUser>().AnyAsync(x => x.ClubTenantId == tenant.Id && x.Email == request.Email, ct))
            return ApiResponse<LoginResponse>.Fail("El email ya existe para este club.");

        var user = new AppUser
        {
            ClubTenantId = tenant.Id,
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            Phone = request.Phone,
            PasswordHash = passwords.Hash(request.Password),
            Role = UserRole.Member
        };
        await uow.Repository<AppUser>().AddAsync(user, ct);
        await uow.Repository<MemberProfile>().AddAsync(new MemberProfile
        {
            ClubTenantId = tenant.Id,
            UserId = user.Id,
            DocumentNumber = request.DocumentNumber,
            MemberNumber = $"M-{DateTime.UtcNow:yyyyMMddHHmmss}"
        }, ct);

        var refresh = jwt.GenerateRefreshToken();
        await uow.Repository<RefreshToken>().AddAsync(new RefreshToken { ClubTenantId = tenant.Id, UserId = user.Id, TokenHash = jwt.HashToken(refresh), ExpiresAt = DateTime.UtcNow.AddDays(30) }, ct);
        await uow.SaveChangesAsync(ct);
        return ApiResponse<LoginResponse>.Ok(jwt.CreateLoginResponse(user, tenant, refresh), "Socio registrado.");
    }

    public async Task<ApiResponse<LoginResponse>> RefreshAsync(RefreshTokenRequest request, CancellationToken ct = default)
    {
        var hash = jwt.HashToken(request.RefreshToken);
        var token = uow.Repository<RefreshToken>().QueryIgnoreFilters().FirstOrDefault(x => x.TokenHash == hash && x.RevokedAt == null && x.ExpiresAt > DateTime.UtcNow);
        if (token is null) return ApiResponse<LoginResponse>.Fail("Refresh token inválido.");

        var user = uow.Repository<AppUser>().QueryIgnoreFilters().FirstOrDefault(x => x.Id == token.UserId);
        if (user is null || !user.IsActive) return ApiResponse<LoginResponse>.Fail("Usuario inválido.");

        token.RevokedAt = DateTime.UtcNow;
        var replacement = jwt.GenerateRefreshToken();
        token.ReplacedByTokenHash = jwt.HashToken(replacement);
        await uow.Repository<RefreshToken>().AddAsync(new RefreshToken { ClubTenantId = user.ClubTenantId, UserId = user.Id, TokenHash = token.ReplacedByTokenHash, ExpiresAt = DateTime.UtcNow.AddDays(30) }, ct);
        await uow.SaveChangesAsync(ct);
        var tenant = uow.Repository<ClubTenant>().QueryIgnoreFilters().FirstOrDefault(x => x.Id == user.ClubTenantId);
        return ApiResponse<LoginResponse>.Ok(jwt.CreateLoginResponse(user, tenant, replacement));
    }

    public async Task<ApiResponse<UserDto>> MeAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await uow.Repository<AppUser>().GetByIdAsync(userId, ct);
        if (user is null) return ApiResponse<UserDto>.Fail("Usuario no encontrado.");
        return ApiResponse<UserDto>.Ok(new UserDto(user.Id, user.FirstName, user.LastName, user.Email, user.Phone, user.Role, user.IsActive, user.Role == UserRole.SuperAdmin ? null : user.ClubTenantId));
    }

    public async Task<ApiResponse<UserDto>> UpdateProfileAsync(Guid userId, UpdateProfileRequest request, CancellationToken ct = default)
    {
        var user = await uow.Repository<AppUser>().GetByIdAsync(userId, ct);
        if (user is null || !user.IsActive) return ApiResponse<UserDto>.Fail("Usuario no encontrado o inactivo.");
        if (string.IsNullOrWhiteSpace(request.FirstName) || string.IsNullOrWhiteSpace(request.LastName))
            return ApiResponse<UserDto>.Fail("Nombre y apellido son obligatorios.");

        user.FirstName = request.FirstName.Trim();
        user.LastName = request.LastName.Trim();
        user.Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim();
        user.UpdatedAt = DateTime.UtcNow;
        await uow.SaveChangesAsync(ct);

        return ApiResponse<UserDto>.Ok(new UserDto(user.Id, user.FirstName, user.LastName, user.Email, user.Phone, user.Role, user.IsActive, user.Role == UserRole.SuperAdmin ? null : user.ClubTenantId), "Perfil actualizado correctamente.");
    }

    public async Task<ApiResponse<bool>> ChangePasswordAsync(Guid userId, ChangePasswordRequest request, CancellationToken ct = default)
    {
        var user = await uow.Repository<AppUser>().GetByIdAsync(userId, ct);
        if (user is null || !user.IsActive) return ApiResponse<bool>.Fail("Usuario no encontrado o inactivo.");
        if (!passwords.Verify(request.CurrentPassword, user.PasswordHash))
            return ApiResponse<bool>.Fail("La contrasena actual no es correcta.");
        if (request.NewPassword != request.ConfirmPassword)
            return ApiResponse<bool>.Fail("La confirmacion no coincide.");
        if (!IsStrongPassword(request.NewPassword))
            return ApiResponse<bool>.Fail("La nueva contrasena debe tener al menos 8 caracteres, una mayuscula, una minuscula, un numero y un simbolo.");

        user.PasswordHash = passwords.Hash(request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;
        await uow.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(true, "Contrasena actualizada correctamente.");
    }

    private static bool IsStrongPassword(string password) =>
        password.Length >= 8 &&
        password.Any(char.IsUpper) &&
        password.Any(char.IsLower) &&
        password.Any(char.IsDigit) &&
        password.Any(ch => !char.IsLetterOrDigit(ch));
}

public class ReservationService(IUnitOfWork uow, ITenantProvider tenantProvider, ISettingService settings) : IReservationService
{
    public Task<IReadOnlyCollection<ReservationDto>> ListAsync(CancellationToken ct = default) =>
        Task.FromResult<IReadOnlyCollection<ReservationDto>>(MapReservations(uow.Repository<Reservation>().Query().OrderByDescending(x => x.StartDateTime).Take(200).ToList()));

    public async Task<ApiResponse<ReservationDto>> CreateMemberReservationAsync(Guid userId, CreateReservationRequest request, CancellationToken ct = default)
    {
        var member = uow.Repository<MemberProfile>().Query().FirstOrDefault(x => x.UserId == userId);
        if (member is null || member.MembershipStatus is MembershipStatus.Inactive or MembershipStatus.Suspended)
            return ApiResponse<ReservationDto>.Fail("Socio inactivo o no encontrado.");

        var allowDebt = await settings.GetBoolAsync("AllowBookingWithOverduePayment", false, ct);
        var hasOverdue = uow.Repository<Membership>().Query().Any(x => x.MemberProfileId == member.Id && x.Status == MonthlyMembershipStatus.Overdue);
        if (hasOverdue && !allowDebt)
            return ApiResponse<ReservationDto>.Fail("No se puede reservar con membresía o pagos vencidos.");

        return await CreateReservationInternalAsync(request.CourtId, member.Id, request.StartDateTime, request.EndDateTime, ReservationType.MemberBooking, request.PlayFormat, request.Players, ct);
    }

    public Task<ApiResponse<ReservationDto>> CreateAdminReservationAsync(AdminReservationRequest request, CancellationToken ct = default) =>
        CreateReservationInternalAsync(request.CourtId, request.MemberProfileId, request.StartDateTime, request.EndDateTime, request.ReservationType, request.PlayFormat, request.Players, ct, request.Reason);

    private async Task<ApiResponse<ReservationDto>> CreateReservationInternalAsync(Guid courtId, Guid? memberId, DateTime start, DateTime end, ReservationType type, ReservationPlayFormat playFormat, IReadOnlyCollection<ReservationPlayerRequest>? players, CancellationToken ct, string? adminReason = null)
    {
        var tenantId = tenantProvider.CurrentTenantId ?? throw new InvalidOperationException("Tenant requerido.");
        var court = uow.Repository<Court>().Query().FirstOrDefault(x => x.Id == courtId && x.IsActive);
        if (court is null) return ApiResponse<ReservationDto>.Fail("Cancha no disponible.");
        if (playFormat is not ReservationPlayFormat.Singles and not ReservationPlayFormat.Doubles)
            return ApiResponse<ReservationDto>.Fail("Debe indicar si la reserva es singles o dobles.");
        var reservationParticipants = new List<ReservationParticipant>();
        if (type is ReservationType.MemberBooking or ReservationType.AdminBooking)
        {
            var participantResult = BuildParticipants(tenantId, playFormat, players);
            if (!participantResult.Success) return ApiResponse<ReservationDto>.Fail(participantResult.Message);
            reservationParticipants = participantResult.Data ?? [];
        }
        if (end <= start) return ApiResponse<ReservationDto>.Fail("Horario inválido.");

        // La ventana de apertura viene de settings para evitar reglas hardcodeadas por club.
        var releaseDays = await settings.GetIntAsync("ReservationReleaseDaysBefore", 1, ct);
        var releaseHour = await settings.GetAsync("ReservationReleaseHour", "09:00", ct);
        var releaseTime = TimeOnly.TryParse(releaseHour, out var parsed) ? parsed : new TimeOnly(9, 0);
        var opensAt = start.Date.AddDays(-releaseDays).Add(releaseTime.ToTimeSpan());
        if (type == ReservationType.MemberBooking && DateTime.UtcNow < opensAt)
            return ApiResponse<ReservationDto>.Fail($"Las reservas abren el {opensAt:dd/MM/yyyy HH:mm}.");

        var dayAvailability = uow.Repository<CourtAvailability>().Query()
            .Where(x => x.CourtId == courtId && x.DayOfWeek == start.DayOfWeek && x.IsAvailable)
            .ToList();
        if (dayAvailability.Count > 0 && !dayAvailability.Any(x => x.StartTime <= TimeOnly.FromDateTime(start) && x.EndTime >= TimeOnly.FromDateTime(end)))
            return ApiResponse<ReservationDto>.Fail("El horario está fuera de la disponibilidad configurada.");

        var overlaps = uow.Repository<Reservation>().Query().Any(x =>
            x.CourtId == courtId &&
            x.Status != ReservationStatus.Cancelled &&
            start < x.EndDateTime && end > x.StartDateTime);
        if (overlaps) return ApiResponse<ReservationDto>.Fail("Ya existe una reserva o bloqueo en ese horario.");

        if ((type == ReservationType.MemberBooking || type == ReservationType.AdminBooking) && memberId.HasValue)
        {
            var weekStart = start.Date.AddDays(-(int)start.DayOfWeek);
            var weekEnd = weekStart.AddDays(7);
            var weeklyLimit = await settings.GetIntAsync("MaxReservationsPerWeek", 1, ct);
            var weeklyCount = uow.Repository<Reservation>().Query().Count(x => x.MemberProfileId == memberId && x.StartDateTime >= weekStart && x.StartDateTime < weekEnd && x.Status != ReservationStatus.Cancelled);
            if (weeklyCount >= weeklyLimit) return ApiResponse<ReservationDto>.Fail($"Se alcanzo el limite semanal de {weeklyLimit} reserva(s).");
        }

        if (type == ReservationType.MemberBooking && memberId.HasValue && start.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday)
        {
            var limit = await settings.GetIntAsync("WeekendReservationLimitPerWeek", 1, ct);
            var weekStart = start.Date.AddDays(-(int)start.DayOfWeek);
            var sundayStart = weekStart;
            var mondayStart = weekStart.AddDays(1);
            var saturdayStart = weekStart.AddDays(6);
            var nextSundayStart = weekStart.AddDays(7);
            var count = uow.Repository<Reservation>().Query().Count(x =>
                x.MemberProfileId == memberId &&
                x.Status != ReservationStatus.Cancelled &&
                ((x.StartDateTime >= sundayStart && x.StartDateTime < mondayStart) ||
                 (x.StartDateTime >= saturdayStart && x.StartDateTime < nextSundayStart)));
            if (count >= limit) return ApiResponse<ReservationDto>.Fail("Se alcanzó el límite semanal de reservas de fin de semana.");
        }

        var guestCount = reservationParticipants.Count(x => !x.IsClubMember);
        var guestFee = await settings.GetIntAsync("GuestPlayerFee", 300, ct);
        var normalizedReason = string.IsNullOrWhiteSpace(adminReason) ? null : adminReason.Trim();
        var reservation = new Reservation { ClubTenantId = tenantId, CourtId = courtId, MemberProfileId = memberId, StartDateTime = start, EndDateTime = end, ReservationType = type, PlayFormat = playFormat, GuestFeePerPlayer = guestFee, GuestFeeTotal = guestCount * guestFee, GuestFeePaidAt = guestCount == 0 ? DateTime.UtcNow : null, CancellationReason = type is ReservationType.MemberBooking or ReservationType.AdminBooking ? null : normalizedReason, Status = ReservationStatus.Confirmed };
        await uow.Repository<Reservation>().AddAsync(reservation, ct);
        foreach (var participant in reservationParticipants)
        {
            participant.ReservationId = reservation.Id;
            await uow.Repository<ReservationParticipant>().AddAsync(participant, ct);
        }
        await uow.Repository<AuditLog>().AddAsync(new AuditLog { ClubTenantId = tenantId, Action = "CreateReservation", EntityName = nameof(Reservation), EntityId = reservation.Id.ToString(), NewValues = $"{court.Name} {start:o}-{end:o} tipo={type} motivo={normalizedReason ?? "-"} invitados={guestCount} totalInvitados={reservation.GuestFeeTotal}" }, ct);
        await uow.SaveChangesAsync(ct);
        return ApiResponse<ReservationDto>.Ok(MapReservation(reservation, court.Name, reservationParticipants), "Reserva confirmada.");
    }

    public async Task<ApiResponse<bool>> CancelAsync(Guid id, Guid userId, string? reason, CancellationToken ct = default)
    {
        var reservation = await uow.Repository<Reservation>().GetByIdAsync(id, ct);
        if (reservation is null) return ApiResponse<bool>.Fail("Reserva no encontrada.");
        var limitHours = await settings.GetIntAsync("CancellationLimitHoursBefore", 12, ct);
        if (reservation.StartDateTime < DateTime.UtcNow.AddHours(limitHours))
            return ApiResponse<bool>.Fail($"Solo se puede cancelar hasta {limitHours} horas antes.");
        reservation.Status = ReservationStatus.Cancelled;
        reservation.CancelledAt = DateTime.UtcNow;
        reservation.CancellationReason = reason;
        await uow.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(true, "Reserva cancelada.");
    }

    public async Task<ApiResponse<bool>> MarkGuestFeePaidAsync(Guid id, CancellationToken ct = default)
    {
        var reservation = await uow.Repository<Reservation>().GetByIdAsync(id, ct);
        if (reservation is null) return ApiResponse<bool>.Fail("Reserva no encontrada.");
        if (reservation.GuestFeeTotal <= 0) return ApiResponse<bool>.Fail("La reserva no tiene invitados no socios para cobrar.");
        reservation.GuestFeePaidAt = DateTime.UtcNow;
        await uow.SaveChangesAsync(ct);
        return ApiResponse<bool>.Ok(true, "Importe de invitados marcado como pago.");
    }

    public Task<IReadOnlyCollection<AvailableSlotDto>> GetAvailableSlotsAsync(DateOnly date, Guid? courtId, CancellationToken ct = default)
    {
        var courts = uow.Repository<Court>().Query().Where(x => x.IsActive && (!courtId.HasValue || x.Id == courtId)).ToList();
        var dayStart = date.ToDateTime(TimeOnly.MinValue);
        var dayEnd = dayStart.AddDays(1);
        var reservations = uow.Repository<Reservation>().Query().Where(x => x.StartDateTime >= dayStart && x.StartDateTime < dayEnd && x.Status != ReservationStatus.Cancelled).ToList();
        var slots = new List<AvailableSlotDto>();
        foreach (var court in courts)
        {
            for (var start = date.ToDateTime(court.OpeningTime); start.AddMinutes(court.SlotDurationMinutes) <= date.ToDateTime(court.ClosingTime); start = start.AddMinutes(court.SlotDurationMinutes))
            {
                var end = start.AddMinutes(court.SlotDurationMinutes);
                var block = reservations.FirstOrDefault(x => x.CourtId == court.Id && start < x.EndDateTime && end > x.StartDateTime);
                slots.Add(new AvailableSlotDto(court.Id, court.Name, start, end, block is null, block?.ReservationType.ToString()));
            }
        }
        return Task.FromResult<IReadOnlyCollection<AvailableSlotDto>>(slots);
    }

    private ApiResponse<List<ReservationParticipant>> BuildParticipants(Guid tenantId, ReservationPlayFormat playFormat, IReadOnlyCollection<ReservationPlayerRequest>? players)
    {
        var expected = playFormat == ReservationPlayFormat.Singles ? 1 : 3;
        if (players is null || players.Count != expected)
            return ApiResponse<List<ReservationParticipant>>.Fail(playFormat == ReservationPlayFormat.Singles ? "Singles requiere indicar 1 acompanante o rival." : "Dobles requiere indicar 3 jugadores adicionales.");

        var normalized = new List<ReservationParticipant>();
        var position = 1;
        foreach (var player in players)
        {
            var name = player.FullName?.Trim() ?? "";
            Guid? memberProfileId = null;
            if (player.IsClubMember)
            {
                if (!player.MemberProfileId.HasValue) return ApiResponse<List<ReservationParticipant>>.Fail("Debe seleccionar el socio jugador.");
                var member = uow.Repository<MemberProfile>().Query().FirstOrDefault(x => x.Id == player.MemberProfileId.Value && x.User != null && x.User.IsActive);
                if (member is null) return ApiResponse<List<ReservationParticipant>>.Fail("Uno de los socios seleccionados no existe o esta inactivo.");
                memberProfileId = member.Id;
                name = member.User is null ? member.MemberNumber : $"{member.User.FirstName} {member.User.LastName}";
            }
            else if (string.IsNullOrWhiteSpace(name))
            {
                return ApiResponse<List<ReservationParticipant>>.Fail("Debe ingresar el nombre de cada jugador que no es socio.");
            }

            normalized.Add(new ReservationParticipant { ClubTenantId = tenantId, IsClubMember = player.IsClubMember, MemberProfileId = memberProfileId, FullName = name, Position = position++ });
        }

        return ApiResponse<List<ReservationParticipant>>.Ok(normalized);
    }

    private IReadOnlyCollection<ReservationDto> MapReservations(IReadOnlyCollection<Reservation> reservations)
    {
        var reservationIds = reservations.Select(x => x.Id).ToHashSet();
        var participants = uow.Repository<ReservationParticipant>().Query()
            .Where(x => reservationIds.Contains(x.ReservationId))
            .OrderBy(x => x.Position)
            .ToList()
            .GroupBy(x => x.ReservationId)
            .ToDictionary(x => x.Key, x => x.ToList());

        return reservations.Select(x => MapReservation(x, x.Court?.Name ?? "", participants.TryGetValue(x.Id, out var rows) ? rows : [])).ToList();
    }

    private static ReservationDto MapReservation(Reservation reservation, string courtName, IReadOnlyCollection<ReservationParticipant> participants) =>
        new(reservation.Id, reservation.CourtId, courtName, reservation.MemberProfileId, reservation.MemberProfile?.User is null ? null : reservation.MemberProfile.User.FirstName + " " + reservation.MemberProfile.User.LastName, reservation.StartDateTime, reservation.EndDateTime, reservation.Status, reservation.ReservationType, reservation.PlayFormat, participants.OrderBy(x => x.Position).Select(x => new ReservationParticipantDto(x.MemberProfileId, x.IsClubMember, x.FullName, x.Position)).ToList(), participants.Count(x => !x.IsClubMember), reservation.GuestFeePerPlayer, reservation.GuestFeeTotal, reservation.GuestFeePaidAt.HasValue);
}

public class ClassService(IUnitOfWork uow, ITenantProvider tenantProvider, ISettingService settings) : IClassService
{
    public Task<IReadOnlyCollection<ClassDto>> ListAsync(CancellationToken ct = default)
    {
        var rows = uow.Repository<TrainingClass>().Query()
            .OrderBy(x => x.DayOfWeek).ThenBy(x => x.StartTime)
            .Select(x => new ClassDto(x.Id, x.Name, x.Coach != null && x.Coach.User != null ? x.Coach.User.FirstName + " " + x.Coach.User.LastName : null, x.Court != null ? x.Court.Name : null, x.DayOfWeek, x.StartTime, x.EndTime, x.MaxStudents, x.Enrollments.Count(e => e.Status == EnrollmentStatus.Active), x.Enrollments.Count(e => e.Status == EnrollmentStatus.WaitingList), x.Level, x.IsActive))
            .ToList();
        return Task.FromResult<IReadOnlyCollection<ClassDto>>(rows);
    }

    public async Task<ApiResponse<ClassDto>> UpsertAsync(Guid? id, UpsertClassRequest request, CancellationToken ct = default)
    {
        var tenantId = tenantProvider.CurrentTenantId ?? throw new InvalidOperationException("Tenant requerido.");
        var entity = id.HasValue ? await uow.Repository<TrainingClass>().GetByIdAsync(id.Value, ct) : null;
        entity ??= new TrainingClass { ClubTenantId = tenantId };
        entity.Name = request.Name; entity.Description = request.Description; entity.CoachId = request.CoachId; entity.CourtId = request.CourtId; entity.DayOfWeek = request.DayOfWeek; entity.StartTime = request.StartTime; entity.EndTime = request.EndTime; entity.MaxStudents = request.MaxStudents; entity.Level = request.Level; entity.IsActive = request.IsActive;
        if (!id.HasValue) await uow.Repository<TrainingClass>().AddAsync(entity, ct);
        await uow.SaveChangesAsync(ct);
        var dto = (await ListAsync(ct)).First(x => x.Id == entity.Id);
        return ApiResponse<ClassDto>.Ok(dto);
    }

    public async Task<ApiResponse<string>> EnrollAsync(Guid classId, Guid userId, CancellationToken ct = default)
    {
        var cls = await uow.Repository<TrainingClass>().GetByIdAsync(classId, ct);
        var member = uow.Repository<MemberProfile>().Query().FirstOrDefault(x => x.UserId == userId);
        if (cls is null || member is null) return ApiResponse<string>.Fail("Clase o socio no encontrado.");
        return await EnrollMemberInternalAsync(cls, member, ct);
    }

    public async Task<ApiResponse<string>> EnrollMemberAsync(Guid classId, Guid memberProfileId, CancellationToken ct = default)
    {
        var cls = await uow.Repository<TrainingClass>().GetByIdAsync(classId, ct);
        var member = await uow.Repository<MemberProfile>().GetByIdAsync(memberProfileId, ct);
        if (cls is null || member is null) return ApiResponse<string>.Fail("Clase o socio no encontrado.");
        return await EnrollMemberInternalAsync(cls, member, ct);
    }

    private async Task<ApiResponse<string>> EnrollMemberInternalAsync(TrainingClass cls, MemberProfile member, CancellationToken ct)
    {
        if (!cls.IsActive) return ApiResponse<string>.Fail("La clase no esta activa.");

        var existing = uow.Repository<ClassEnrollment>().Query().FirstOrDefault(x => x.TrainingClassId == cls.Id && x.MemberProfileId == member.Id);
        if (existing is not null && existing.Status != EnrollmentStatus.Cancelled)
            return ApiResponse<string>.Fail("El socio ya esta inscripto en esta clase.");

        var weeklyLimit = await settings.GetIntAsync("MaxClassEnrollmentsPerWeek", 2, ct);
        var activeWeeklyCount = uow.Repository<ClassEnrollment>().Query().Count(x => x.MemberProfileId == member.Id && x.Status != EnrollmentStatus.Cancelled);
        if (activeWeeklyCount >= weeklyLimit)
            return ApiResponse<string>.Fail($"Se alcanzo el limite de {weeklyLimit} clase(s) por semana para este socio.");

        var activeCount = uow.Repository<ClassEnrollment>().Query().Count(x => x.TrainingClassId == cls.Id && x.Status == EnrollmentStatus.Active);
        var allowWaitingList = await settings.GetBoolAsync("AllowWaitingList", true, ct);
        var status = activeCount < cls.MaxStudents ? EnrollmentStatus.Active : allowWaitingList ? EnrollmentStatus.WaitingList : EnrollmentStatus.Cancelled;
        if (status == EnrollmentStatus.Cancelled) return ApiResponse<string>.Fail("La clase esta completa.");

        if (existing is null)
        {
            await uow.Repository<ClassEnrollment>().AddAsync(new ClassEnrollment { ClubTenantId = cls.ClubTenantId, TrainingClassId = cls.Id, MemberProfileId = member.Id, Status = status }, ct);
        }
        else
        {
            existing.Status = status;
            existing.EnrolledAt = DateTime.UtcNow;
            existing.CancelledAt = null;
        }

        await uow.SaveChangesAsync(ct);
        return ApiResponse<string>.Ok(status.ToString(), status == EnrollmentStatus.Active ? "Inscripcion confirmada." : "Clase completa: socio agregado a lista de espera.");
    }

    public async Task<ApiResponse<string>> CancelEnrollmentAsync(Guid classId, Guid userId, CancellationToken ct = default)
    {
        var member = uow.Repository<MemberProfile>().Query().FirstOrDefault(x => x.UserId == userId);
        var enrollment = member is null ? null : uow.Repository<ClassEnrollment>().Query().FirstOrDefault(x => x.TrainingClassId == classId && x.MemberProfileId == member.Id && x.Status != EnrollmentStatus.Cancelled);
        if (enrollment is null) return ApiResponse<string>.Fail("Inscripción no encontrada.");
        enrollment.Status = EnrollmentStatus.Cancelled;
        enrollment.CancelledAt = DateTime.UtcNow;

        // Lista de espera inteligente: al cancelar un cupo activo, se promueve al primero en espera.
        var next = uow.Repository<ClassEnrollment>().Query().Where(x => x.TrainingClassId == classId && x.Status == EnrollmentStatus.WaitingList).OrderBy(x => x.EnrolledAt).FirstOrDefault();
        if (next is not null) next.Status = EnrollmentStatus.Active;
        await uow.SaveChangesAsync(ct);
        return ApiResponse<string>.Ok(next is null ? "Cancelled" : "PromotedWaitingList", "Inscripción cancelada.");
    }

    public async Task<ApiResponse<string>> CancelMemberEnrollmentAsync(Guid classId, Guid memberProfileId, CancellationToken ct = default)
    {
        var enrollment = uow.Repository<ClassEnrollment>().Query().FirstOrDefault(x => x.TrainingClassId == classId && x.MemberProfileId == memberProfileId && x.Status != EnrollmentStatus.Cancelled);
        if (enrollment is null) return ApiResponse<string>.Fail("Inscripcion no encontrada.");

        enrollment.Status = EnrollmentStatus.Cancelled;
        enrollment.CancelledAt = DateTime.UtcNow;

        // Lista de espera inteligente: al liberar un cupo, sube el primer socio en espera.
        var next = uow.Repository<ClassEnrollment>().Query()
            .Where(x => x.TrainingClassId == classId && x.Status == EnrollmentStatus.WaitingList)
            .OrderBy(x => x.EnrolledAt)
            .FirstOrDefault();
        if (next is not null) next.Status = EnrollmentStatus.Active;

        await uow.SaveChangesAsync(ct);
        return ApiResponse<string>.Ok(next is null ? "Cancelled" : "PromotedWaitingList", "Inscripcion cancelada.");
    }

    public Task<IReadOnlyCollection<ClassEnrollmentStateDto>> MyEnrollmentsAsync(Guid userId, CancellationToken ct = default)
    {
        var member = uow.Repository<MemberProfile>().Query().FirstOrDefault(x => x.UserId == userId);
        if (member is null) return Task.FromResult<IReadOnlyCollection<ClassEnrollmentStateDto>>(Array.Empty<ClassEnrollmentStateDto>());

        var rows = uow.Repository<ClassEnrollment>().Query()
            .Where(x => x.MemberProfileId == member.Id && x.Status != EnrollmentStatus.Cancelled)
            .Select(x => new ClassEnrollmentStateDto(x.TrainingClassId, x.MemberProfileId, x.Status.ToString()))
            .ToList();

        return Task.FromResult<IReadOnlyCollection<ClassEnrollmentStateDto>>(rows);
    }

    public Task<IReadOnlyCollection<ClassStudentDto>> StudentsAsync(Guid classId, CancellationToken ct = default)
    {
        var rows = uow.Repository<ClassEnrollment>().Query()
            .Where(x => x.TrainingClassId == classId && x.Status != EnrollmentStatus.Cancelled)
            .OrderBy(x => x.Status == EnrollmentStatus.WaitingList)
            .ThenBy(x => x.EnrolledAt)
            .Select(x => new ClassStudentDto(
                x.MemberProfileId,
                x.MemberProfile != null && x.MemberProfile.User != null ? x.MemberProfile.User.FirstName + " " + x.MemberProfile.User.LastName : "Socio",
                x.MemberProfile != null && x.MemberProfile.User != null ? x.MemberProfile.User.Email : "",
                x.Status.ToString(),
                x.EnrolledAt))
            .ToList();

        return Task.FromResult<IReadOnlyCollection<ClassStudentDto>>(rows);
    }

    public Task<IReadOnlyCollection<EligibleMemberDto>> EligibleMembersAsync(Guid classId, CancellationToken ct = default)
    {
        var enrolledMemberIds = uow.Repository<ClassEnrollment>().Query()
            .Where(x => x.TrainingClassId == classId && x.Status != EnrollmentStatus.Cancelled)
            .Select(x => x.MemberProfileId)
            .ToHashSet();

        var rows = uow.Repository<MemberProfile>().Query()
            .Where(x => !enrolledMemberIds.Contains(x.Id) && x.User != null && x.User.IsActive)
            .OrderBy(x => x.User!.LastName)
            .ThenBy(x => x.User!.FirstName)
            .Select(x => new EligibleMemberDto(
                x.Id,
                x.User != null ? x.User.FirstName + " " + x.User.LastName : "Socio",
                x.User != null ? x.User.Email : "",
                x.MemberNumber,
                x.MembershipStatus.ToString()))
            .ToList();

        return Task.FromResult<IReadOnlyCollection<EligibleMemberDto>>(rows);
    }

    public async Task<ApiResponse<string>> SaveAttendanceAsync(Guid sessionId, IReadOnlyCollection<AttendanceRequest> attendances, CancellationToken ct = default)
    {
        var session = await uow.Repository<ClassSession>().GetByIdAsync(sessionId, ct);
        if (session is null) return ApiResponse<string>.Fail("Sesión no encontrada.");
        foreach (var item in attendances)
        {
            var row = uow.Repository<ClassAttendance>().Query().FirstOrDefault(x => x.ClassSessionId == sessionId && x.MemberProfileId == item.MemberProfileId);
            var isNew = row is null;
            row ??= new ClassAttendance { ClubTenantId = session.ClubTenantId, ClassSessionId = sessionId, MemberProfileId = item.MemberProfileId };
            row.AttendanceStatus = item.AttendanceStatus; row.Notes = item.Notes;
            if (isNew) await uow.Repository<ClassAttendance>().AddAsync(row, ct);
        }
        await uow.SaveChangesAsync(ct);
        return ApiResponse<string>.Ok("Saved", "Asistencia guardada.");
    }
}

public class DashboardService(IUnitOfWork uow) : IDashboardService
{
    public Task<AdminDashboardDto> GetAdminAsync(CancellationToken ct = default)
    {
        var today = DateTime.Today;
        var monthStart = new DateTime(today.Year, today.Month, 1);
        var cards = new List<DashboardCardDto>
        {
            new("Socios activos", uow.Repository<MemberProfile>().Query().Count(x => x.MembershipStatus == MembershipStatus.Active).ToString(), "en el club", "success"),
            new("Pagos vencidos", uow.Repository<Membership>().Query().Count(x => x.Status == MonthlyMembershipStatus.Overdue).ToString(), "requiere acción", "danger"),
            new("Reservas hoy", uow.Repository<Reservation>().Query().Count(x => x.StartDateTime.Date == today).ToString(), "agenda", "primary"),
            new("Ingresos del mes", uow.Repository<Payment>().Query().Where(x => x.PaymentDate >= monthStart && x.Status == PaymentStatus.Paid).Sum(x => x.Amount).ToString("C0"), "cobrados", "success")
        };
        var reservations = uow.Repository<Reservation>().Query().Where(x => x.StartDateTime >= DateTime.UtcNow).OrderBy(x => x.StartDateTime).Take(8).Select(x => new ReservationDto(x.Id, x.CourtId, x.Court != null ? x.Court.Name : "", x.MemberProfileId, x.MemberProfile != null && x.MemberProfile.User != null ? x.MemberProfile.User.FirstName + " " + x.MemberProfile.User.LastName : null, x.StartDateTime, x.EndDateTime, x.Status, x.ReservationType, x.PlayFormat, Array.Empty<ReservationParticipantDto>(), 0, x.GuestFeePerPlayer, x.GuestFeeTotal, x.GuestFeePaidAt.HasValue)).ToList();
        var overdue = uow.Repository<Payment>().Query().Where(x => x.Status == PaymentStatus.Pending).Take(8).Select(x => new PaymentDto(
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
            x.Notes)).ToList();
        return Task.FromResult(new AdminDashboardDto(cards, reservations, overdue, BuildWeeklyOccupancy(today)));
    }

    private WeeklyOccupancyDto BuildWeeklyOccupancy(DateTime today)
    {
        var weekStart = today.Date.AddDays(-(((int)today.DayOfWeek + 6) % 7));
        var weekEnd = weekStart.AddDays(7);
        var courts = uow.Repository<Court>().Query()
            .Where(x => x.IsActive)
            .Select(x => new { x.Id, x.OpeningTime, x.ClosingTime })
            .ToList();

        if (courts.Count == 0)
        {
            return EmptyOccupancy();
        }

        var courtIds = courts.Select(x => x.Id).ToHashSet();
        var availability = uow.Repository<CourtAvailability>().Query()
            .Where(x => x.IsAvailable && courtIds.Contains(x.CourtId))
            .ToList();
        var reservations = uow.Repository<Reservation>().Query()
            .Where(x => x.StartDateTime < weekEnd && x.EndDateTime > weekStart && x.Status != ReservationStatus.Cancelled && x.Status != ReservationStatus.NoShow)
            .ToList();

        var labels = new[] { "Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom" };
        var days = new List<WeeklyOccupancyDayDto>();
        var totalBooked = 0;
        var totalAvailable = 0;

        for (var index = 0; index < 7; index++)
        {
            var dayStart = weekStart.AddDays(index);
            var dayEnd = dayStart.AddDays(1);
            var dayOfWeek = dayStart.DayOfWeek;
            var availableMinutes = courts.Sum(court =>
            {
                var rows = availability.Where(x => x.CourtId == court.Id && x.DayOfWeek == dayOfWeek).ToList();
                if (rows.Count > 0)
                {
                    return rows.Sum(x => MinutesBetween(x.StartTime, x.EndTime));
                }

                return MinutesBetween(court.OpeningTime, court.ClosingTime);
            });
            var bookedMinutes = reservations
                .Where(x => x.StartDateTime < dayEnd && x.EndDateTime > dayStart)
                .Sum(x => OverlapMinutes(x.StartDateTime, x.EndDateTime, dayStart, dayEnd));
            var percentage = availableMinutes > 0 ? Math.Clamp((int)Math.Round(bookedMinutes * 100m / availableMinutes), 0, 100) : 0;

            totalBooked += bookedMinutes;
            totalAvailable += availableMinutes;
            days.Add(new WeeklyOccupancyDayDto(labels[index], percentage, bookedMinutes, availableMinutes));
        }

        if (totalAvailable == 0)
        {
            return EmptyOccupancy();
        }

        var peak = days.OrderByDescending(x => x.Percentage).First();
        var average = Math.Clamp((int)Math.Round(totalBooked * 100m / totalAvailable), 0, 100);
        return new WeeklyOccupancyDto(true, average, peak.Day, peak.Percentage, totalBooked, totalAvailable, days);
    }

    private static WeeklyOccupancyDto EmptyOccupancy() =>
        new(false, 0, null, 0, 0, 0, Array.Empty<WeeklyOccupancyDayDto>());

    private static int MinutesBetween(TimeOnly start, TimeOnly end)
    {
        var minutes = (int)(end.ToTimeSpan() - start.ToTimeSpan()).TotalMinutes;
        return Math.Max(0, minutes);
    }

    private static int OverlapMinutes(DateTime start, DateTime end, DateTime windowStart, DateTime windowEnd)
    {
        var overlapStart = start > windowStart ? start : windowStart;
        var overlapEnd = end < windowEnd ? end : windowEnd;
        return Math.Max(0, (int)(overlapEnd - overlapStart).TotalMinutes);
    }

    public Task<IReadOnlyCollection<DashboardCardDto>> GetCoachAsync(Guid userId, CancellationToken ct = default) =>
        BuildCoachDashboard(userId);

    private Task<IReadOnlyCollection<DashboardCardDto>> BuildCoachDashboard(Guid userId)
    {
        var coach = uow.Repository<CoachProfile>().Query().FirstOrDefault(x => x.UserId == userId);
        if (coach is null)
        {
            return Task.FromResult<IReadOnlyCollection<DashboardCardDto>>([
                new("Clases hoy", "0", "agenda", "primary"),
                new("Alumnos", "0", "activos", "success"),
                new("Asistencia", "-", "sin registros", "primary"),
                new("Notas", "0", "seguimiento", "primary")
            ]);
        }

        var today = DateTime.Today;
        var since = DateOnly.FromDateTime(today.AddDays(-7));
        var classIds = uow.Repository<TrainingClass>().Query()
            .Where(x => x.CoachId == coach.Id && x.IsActive)
            .Select(x => x.Id)
            .ToList();
        var classesToday = uow.Repository<TrainingClass>().Query()
            .Count(x => x.CoachId == coach.Id && x.IsActive && x.DayOfWeek == today.DayOfWeek);
        var activeStudents = uow.Repository<ClassEnrollment>().Query()
            .Count(x => classIds.Contains(x.TrainingClassId) && x.Status == EnrollmentStatus.Active);
        var attendances = uow.Repository<ClassAttendance>().Query()
            .Where(x => x.ClassSession != null && classIds.Contains(x.ClassSession.TrainingClassId) && x.ClassSession.SessionDate >= since)
            .ToList();
        var attendanceRate = attendances.Count == 0
            ? "-"
            : $"{Math.Round(attendances.Count(x => x.AttendanceStatus == AttendanceStatus.Present) * 100m / attendances.Count):0}%";

        return Task.FromResult<IReadOnlyCollection<DashboardCardDto>>([
            new("Clases hoy", classesToday.ToString(), "agenda", "primary"),
            new("Alumnos", activeStudents.ToString(), "activos", "success"),
            new("Asistencia", attendanceRate, attendances.Count == 0 ? "sin registros" : "ultimos 7 dias", "success"),
            new("Notas", attendances.Count(x => !string.IsNullOrWhiteSpace(x.Notes)).ToString(), "seguimiento", "primary")
        ]);
    }

    public Task<IReadOnlyCollection<DashboardCardDto>> GetMemberAsync(Guid userId, CancellationToken ct = default) =>
        BuildMemberDashboard(userId);

    private Task<IReadOnlyCollection<DashboardCardDto>> BuildMemberDashboard(Guid userId)
    {
        var member = uow.Repository<MemberProfile>().Query().FirstOrDefault(x => x.UserId == userId);
        if (member is null)
        {
            return Task.FromResult<IReadOnlyCollection<DashboardCardDto>>([
                new("Membresia", "-", "sin perfil", "primary"),
                new("Proxima reserva", "-", "sin reservas", "primary"),
                new("Proxima clase", "-", "sin clases", "primary"),
                new("Pagos pendientes", "0", "sin deuda", "success")
            ]);
        }

        var now = DateTime.UtcNow;
        var nextReservation = uow.Repository<Reservation>().Query()
            .Where(x => x.MemberProfileId == member.Id && x.StartDateTime >= now && x.Status != ReservationStatus.Cancelled && x.Status != ReservationStatus.NoShow)
            .OrderBy(x => x.StartDateTime)
            .Select(x => new { x.StartDateTime, CourtName = x.Court != null ? x.Court.Name : null })
            .FirstOrDefault();
        var nextClass = uow.Repository<ClassEnrollment>().Query()
            .Where(x => x.MemberProfileId == member.Id && (x.Status == EnrollmentStatus.Active || x.Status == EnrollmentStatus.WaitingList) && x.TrainingClass != null && x.TrainingClass.IsActive)
            .Select(x => new { x.TrainingClass!.Name, x.TrainingClass.DayOfWeek, x.TrainingClass.StartTime })
            .ToList()
            .OrderBy(x => DaysUntil(x.DayOfWeek, DateTime.Today.DayOfWeek))
            .ThenBy(x => x.StartTime)
            .FirstOrDefault();
        var pendingCount = uow.Repository<Membership>().Query()
            .Count(x => x.MemberProfileId == member.Id && (x.Status == MonthlyMembershipStatus.Pending || x.Status == MonthlyMembershipStatus.Overdue));

        return Task.FromResult<IReadOnlyCollection<DashboardCardDto>>([
            new("Membresia", MembershipLabel(member.MembershipStatus), MembershipTrend(member.MembershipStatus), member.MembershipStatus == MembershipStatus.Active ? "success" : "danger"),
            new("Proxima reserva", nextReservation is null ? "-" : nextReservation.StartDateTime.ToString("HH:mm"), nextReservation is null ? "sin reservas" : nextReservation.CourtName ?? nextReservation.StartDateTime.ToString("dd/MM"), "primary"),
            new("Proxima clase", nextClass is null ? "-" : ShortDay(nextClass.DayOfWeek), nextClass is null ? "sin clases" : nextClass.Name, "primary"),
            new("Pagos pendientes", pendingCount.ToString(), pendingCount == 0 ? "sin deuda" : "a revisar", pendingCount == 0 ? "success" : "danger")
        ]);
    }

    private static int DaysUntil(DayOfWeek target, DayOfWeek today) =>
        ((int)target - (int)today + 7) % 7;

    private static string ShortDay(DayOfWeek value) => value switch
    {
        DayOfWeek.Monday => "Lun",
        DayOfWeek.Tuesday => "Mar",
        DayOfWeek.Wednesday => "Mie",
        DayOfWeek.Thursday => "Jue",
        DayOfWeek.Friday => "Vie",
        DayOfWeek.Saturday => "Sab",
        DayOfWeek.Sunday => "Dom",
        _ => "-"
    };

    private static string MembershipLabel(MembershipStatus value) => value switch
    {
        MembershipStatus.Active => "Activa",
        MembershipStatus.Inactive => "Inactiva",
        MembershipStatus.Pending => "Pendiente",
        MembershipStatus.Overdue => "Vencida",
        MembershipStatus.Suspended => "Suspendida",
        _ => "-"
    };

    private static string MembershipTrend(MembershipStatus value) => value switch
    {
        MembershipStatus.Active => "al dia",
        MembershipStatus.Pending => "pendiente",
        MembershipStatus.Overdue => "requiere pago",
        MembershipStatus.Suspended => "suspendida",
        _ => "a revisar"
    };

    public Task<IReadOnlyCollection<DashboardCardDto>> GetSuperAdminAsync(CancellationToken ct = default) =>
        Task.FromResult<IReadOnlyCollection<DashboardCardDto>>([new("Clubes", uow.Repository<ClubTenant>().Query().Count().ToString(), "total", "primary"), new("Clubes activos", uow.Repository<ClubTenant>().Query().Count(x => x.IsActive).ToString(), "operativos", "success"), new("Usuarios", uow.Repository<AppUser>().Query().Count().ToString(), "plataforma", "primary")]);
}
