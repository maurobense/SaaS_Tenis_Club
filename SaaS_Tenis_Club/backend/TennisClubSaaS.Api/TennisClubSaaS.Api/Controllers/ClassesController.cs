using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TennisClubSaaS.Api.Extensions;
using TennisClubSaaS.Application.DTOs;
using TennisClubSaaS.Application.Interfaces;

namespace TennisClubSaaS.Api.Controllers;

[Authorize]
public class ClassesController(IClassService classes) : BaseApiController
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct) => Ok(ApiResponse<object>.Ok(await classes.ListAsync(ct)));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
    {
        var item = (await classes.ListAsync(ct)).FirstOrDefault(x => x.Id == id);
        return item is null ? NotFound(ApiResponse<object>.Fail("Clase no encontrada.")) : Ok(ApiResponse<object>.Ok(item));
    }

    [Authorize(Roles = "ClubAdmin,SuperAdmin")]
    [HttpPost]
    public async Task<IActionResult> Post(UpsertClassRequest request, CancellationToken ct) => FromResponse(await classes.UpsertAsync(null, request, ct));

    [Authorize(Roles = "ClubAdmin,SuperAdmin")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Put(Guid id, UpsertClassRequest request, CancellationToken ct) => FromResponse(await classes.UpsertAsync(id, request, ct));

    [Authorize(Roles = "ClubAdmin,SuperAdmin")]
    [HttpDelete("{id:guid}")]
    public IActionResult Delete(Guid id) => Ok(ApiResponse<Guid>.Ok(id, "Clase desactivada lógicamente desde servicio de administración."));

    [HttpPost("{id:guid}/enroll")]
    public async Task<IActionResult> Enroll(Guid id, CancellationToken ct) => FromResponse(await classes.EnrollAsync(id, User.UserId(), ct));

    [HttpPatch("{id:guid}/cancel-enrollment")]
    public async Task<IActionResult> CancelEnrollment(Guid id, CancellationToken ct) => FromResponse(await classes.CancelEnrollmentAsync(id, User.UserId(), ct));

    [HttpGet("my-enrollments")]
    public async Task<IActionResult> MyEnrollments(CancellationToken ct) => Ok(ApiResponse<object>.Ok(await classes.MyEnrollmentsAsync(User.UserId(), ct)));

    [Authorize(Roles = "ClubAdmin,Coach,SuperAdmin")]
    [HttpPost("{id:guid}/enroll-member")]
    public async Task<IActionResult> EnrollMember(Guid id, EnrollMemberRequest request, CancellationToken ct) => FromResponse(await classes.EnrollMemberAsync(id, request.MemberProfileId, ct));

    [Authorize(Roles = "ClubAdmin,Coach,SuperAdmin")]
    [HttpPatch("{id:guid}/members/{memberProfileId:guid}/cancel-enrollment")]
    public async Task<IActionResult> CancelMemberEnrollment(Guid id, Guid memberProfileId, CancellationToken ct) => FromResponse(await classes.CancelMemberEnrollmentAsync(id, memberProfileId, ct));

    [Authorize(Roles = "ClubAdmin,Coach,SuperAdmin")]
    [HttpGet("{id:guid}/students")]
    public async Task<IActionResult> Students(Guid id, CancellationToken ct) => Ok(ApiResponse<object>.Ok(await classes.StudentsAsync(id, ct)));

    [Authorize(Roles = "ClubAdmin,Coach,SuperAdmin")]
    [HttpGet("{id:guid}/eligible-members")]
    public async Task<IActionResult> EligibleMembers(Guid id, CancellationToken ct) => Ok(ApiResponse<object>.Ok(await classes.EligibleMembersAsync(id, ct)));

    [HttpGet("my-classes")]
    public async Task<IActionResult> Mine(CancellationToken ct) => Ok(ApiResponse<object>.Ok(await classes.ListAsync(ct)));
}
