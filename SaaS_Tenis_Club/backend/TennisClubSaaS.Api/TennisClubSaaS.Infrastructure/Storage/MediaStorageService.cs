using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Configuration;
using TennisClubSaaS.Application.Interfaces;

namespace TennisClubSaaS.Infrastructure.Storage;

public partial class MediaStorageService(IAmazonS3 s3, IConfiguration configuration) : IMediaStorageService
{
    private static readonly Regex InvalidSlugChars = InvalidSlugCharsRegex();
    private static readonly Regex DuplicateDashes = DuplicateDashesRegex();

    public long MaxFileSizeBytes => Settings.From(configuration).MaxFileSizeMb * 1024L * 1024L;

    public string BuildUploadKey(string folder, string fileName)
    {
        var settings = Settings.From(configuration);
        var normalizedPrefix = NormalizeFolder(settings.KeyPrefix);
        var normalizedFolder = NormalizeFolder(folder);
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        var safeName = Slugify(Path.GetFileNameWithoutExtension(fileName));
        var token = Guid.NewGuid().ToString("N")[..8];
        var finalName = $"{DateTime.UtcNow:yyyyMMddHHmmss}-{token}-{safeName}{extension}";

        return string.IsNullOrWhiteSpace(normalizedFolder)
            ? $"{normalizedPrefix}/{finalName}"
            : $"{normalizedPrefix}/{normalizedFolder}/{finalName}";
    }

    public string BuildPublicUrl(string key)
    {
        var settings = Settings.From(configuration);
        return $"{settings.PublicBaseUrl}/{EscapeKey(key)}";
    }

    public async Task<MediaUploadResult> UploadAsync(string folder, string fileName, Stream content, string contentType, long length, CancellationToken ct = default)
    {
        var settings = Settings.From(configuration);
        var key = BuildUploadKey(folder, fileName);

        await s3.PutObjectAsync(new PutObjectRequest
        {
            BucketName = settings.BucketName,
            Key = key,
            InputStream = content,
            ContentType = contentType,
            AutoCloseStream = false
        }, ct);

        return new MediaUploadResult(BuildPublicUrl(key), key, NormalizeFolder(folder), Path.GetFileName(key), length);
    }

    public static string ClubFolder(Guid clubId, string clubName, string subfolder)
    {
        var name = Slugify(clubName);
        return NormalizeFolder($"clubs/club-{clubId:N}-{name}/{subfolder}");
    }

    public static string NormalizeFolder(string? folder)
    {
        var cleaned = string.Join(
            "/",
            (folder ?? "uploads")
                .Replace('\\', '/')
                .Split('/', StringSplitOptions.RemoveEmptyEntries)
                .Select(Slugify)
                .Where(x => !string.IsNullOrWhiteSpace(x)));

        return string.IsNullOrWhiteSpace(cleaned) ? "uploads" : cleaned;
    }

    public static string Slugify(string? value)
    {
        var text = RemoveDiacritics(value ?? "").ToLowerInvariant();
        text = InvalidSlugChars.Replace(text, "-");
        text = DuplicateDashes.Replace(text, "-").Trim('-');
        return string.IsNullOrWhiteSpace(text) ? "file" : text;
    }

    private static string EscapeKey(string key) =>
        string.Join("/", key.Split('/', StringSplitOptions.RemoveEmptyEntries).Select(Uri.EscapeDataString));

    private static string RemoveDiacritics(string value)
    {
        var normalized = value.Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(capacity: normalized.Length);

        foreach (var ch in normalized)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(ch) != UnicodeCategory.NonSpacingMark)
                builder.Append(ch);
        }

        return builder.ToString().Normalize(NormalizationForm.FormC);
    }

    private sealed record Settings(string BucketName, string KeyPrefix, string PublicBaseUrl, int MaxFileSizeMb)
    {
        public static Settings From(IConfiguration configuration)
        {
            var section = configuration.GetSection("Storage:S3");
            var bucketName = Required(section["BucketName"], "Storage:S3:BucketName");
            var keyPrefix = string.IsNullOrWhiteSpace(section["KeyPrefix"]) ? "tenisclub" : section["KeyPrefix"]!.Trim();
            var publicBaseUrl = string.IsNullOrWhiteSpace(section["PublicBaseUrl"])
                ? $"https://{bucketName}.s3.{(section["Region"] ?? "us-east-1").Trim()}.amazonaws.com"
                : section["PublicBaseUrl"]!.Trim().TrimEnd('/');
            var maxFileSizeMb = int.TryParse(section["MaxFileSizeMb"], out var parsed) && parsed > 0 ? parsed : 20;

            return new Settings(bucketName, keyPrefix, publicBaseUrl, maxFileSizeMb);
        }

        private static string Required(string? value, string key) =>
            string.IsNullOrWhiteSpace(value)
                ? throw new InvalidOperationException($"{key} no esta configurado.")
                : value.Trim();
    }

    [GeneratedRegex("[^a-z0-9]+", RegexOptions.Compiled)]
    private static partial Regex InvalidSlugCharsRegex();

    [GeneratedRegex("-+", RegexOptions.Compiled)]
    private static partial Regex DuplicateDashesRegex();
}
