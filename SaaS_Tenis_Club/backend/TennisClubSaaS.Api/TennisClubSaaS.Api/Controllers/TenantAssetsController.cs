using Amazon.S3;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TennisClubSaaS.Application.DTOs;
using TennisClubSaaS.Application.Interfaces;
using TennisClubSaaS.Domain.Entities;
using TennisClubSaaS.Infrastructure.Storage;

namespace TennisClubSaaS.Api.Controllers;

[ApiController]
[Route("api/tenant-assets")]
[Authorize(Roles = "ClubAdmin,SuperAdmin")]
public class TenantAssetsController(
    IUnitOfWork uow,
    ITenantProvider tenantProvider,
    IMediaStorageService storage) : ControllerBase
{
    private const long MaxUploadRequestBytes = 25_000_000;

    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp"
    };

    [HttpPost("upload")]
    [RequestSizeLimit(MaxUploadRequestBytes)]
    public async Task<IActionResult> UploadImage([FromForm] IFormFile file, [FromForm] string? folder = "uploads", CancellationToken ct = default)
    {
        var validation = ValidateImage(file);
        if (validation is not null)
            return BadRequest(ApiResponse<object>.Fail(validation));

        try
        {
            var normalizedFolder = MediaStorageService.NormalizeFolder(folder);
            var result = await UploadAsync(file, normalizedFolder, ct);
            return Ok(ApiResponse<MediaUploadResult>.Ok(result, "Imagen subida correctamente."));
        }
        catch (AmazonS3Exception)
        {
            return StatusCode(StatusCodes.Status502BadGateway, ApiResponse<object>.Fail("No se pudo subir la imagen a S3. Revisa permisos del bucket o del usuario IAM."));
        }
    }

    [HttpPost("logo")]
    [RequestSizeLimit(MaxUploadRequestBytes)]
    public async Task<IActionResult> UploadCurrentTenantLogo([FromForm] IFormFile file, CancellationToken ct)
    {
        var tenant = await ResolveCurrentTenantAsync(ct);
        if (tenant is null)
            return BadRequest(ApiResponse<object>.Fail("No se pudo resolver el club actual."));

        return await UploadLogoAsync(tenant, file, ct);
    }

    [Authorize(Roles = "SuperAdmin")]
    [HttpPost("{tenantId:guid}/logo")]
    [RequestSizeLimit(MaxUploadRequestBytes)]
    public async Task<IActionResult> UploadTenantLogo(Guid tenantId, [FromForm] IFormFile file, CancellationToken ct)
    {
        var tenant = await uow.Repository<ClubTenant>().GetByIdAsync(tenantId, ct);
        if (tenant is null)
            return NotFound(ApiResponse<object>.Fail("Club no encontrado."));

        return await UploadLogoAsync(tenant, file, ct);
    }

    private async Task<IActionResult> UploadLogoAsync(ClubTenant tenant, IFormFile file, CancellationToken ct)
    {
        var validation = ValidateImage(file);
        if (validation is not null)
            return BadRequest(ApiResponse<object>.Fail(validation));

        MediaUploadResult result;
        try
        {
            var folder = MediaStorageService.ClubFolder(tenant.Id, tenant.Name, "logos");
            result = await UploadAsync(file, folder, ct);
        }
        catch (AmazonS3Exception)
        {
            return StatusCode(StatusCodes.Status502BadGateway, ApiResponse<object>.Fail("No se pudo subir el logo a S3. Revisa permisos del bucket o del usuario IAM."));
        }

        tenant.LogoUrl = result.Url;
        tenant.UpdatedAt = DateTime.UtcNow;
        await uow.SaveChangesAsync(ct);

        return Ok(ApiResponse<MediaUploadResult>.Ok(result, "Logo actualizado correctamente."));
    }

    private async Task<ClubTenant?> ResolveCurrentTenantAsync(CancellationToken ct)
    {
        if (tenantProvider.CurrentTenantId is Guid tenantId && tenantId != Guid.Empty)
            return await uow.Repository<ClubTenant>().GetByIdAsync(tenantId, ct);

        return await tenantProvider.ResolveTenantAsync(ct);
    }

    private async Task<MediaUploadResult> UploadAsync(IFormFile file, string folder, CancellationToken ct)
    {
        await using var stream = file.OpenReadStream();
        return await storage.UploadAsync(folder, file.FileName, stream, file.ContentType, file.Length, ct);
    }

    private string? ValidateImage(IFormFile? file)
    {
        if (file is null || file.Length == 0)
            return "No se detecto ninguna imagen.";

        if (file.Length > storage.MaxFileSizeBytes)
            return $"La imagen no puede superar {storage.MaxFileSizeBytes / 1024 / 1024} MB.";

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension))
            return "Solo se permiten imagenes JPG, PNG o WEBP.";

        if (!file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
            return "El archivo no parece ser una imagen.";

        return null;
    }
}
