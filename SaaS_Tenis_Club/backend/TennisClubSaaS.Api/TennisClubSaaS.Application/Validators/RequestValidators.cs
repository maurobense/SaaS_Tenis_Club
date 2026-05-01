using FluentValidation;
using TennisClubSaaS.Application.DTOs;

namespace TennisClubSaaS.Application.Validators;

public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email).EmailAddress().NotEmpty();
        RuleFor(x => x.Password).MinimumLength(6).NotEmpty();
        RuleFor(x => x.TenantSlug).NotEmpty();
    }
}

public class CreateReservationRequestValidator : AbstractValidator<CreateReservationRequest>
{
    public CreateReservationRequestValidator()
    {
        RuleFor(x => x.CourtId).NotEmpty();
        RuleFor(x => x.StartDateTime).GreaterThan(DateTime.UtcNow.AddMinutes(-5));
        RuleFor(x => x.EndDateTime).GreaterThan(x => x.StartDateTime);
    }
}

public class UpsertClassRequestValidator : AbstractValidator<UpsertClassRequest>
{
    public UpsertClassRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(120);
        RuleFor(x => x.MaxStudents).InclusiveBetween(1, 80);
        RuleFor(x => x.EndTime).GreaterThan(x => x.StartTime);
    }
}
