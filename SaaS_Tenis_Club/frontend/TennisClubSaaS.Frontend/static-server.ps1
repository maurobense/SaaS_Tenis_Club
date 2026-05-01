$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://localhost:5500/")
$listener.Start()
while ($listener.IsListening) {
    $context = $listener.GetContext()
    $path = [Uri]::UnescapeDataString($context.Request.Url.AbsolutePath.TrimStart("/"))
    if ([string]::IsNullOrWhiteSpace($path)) { $path = "index.html" }
    $file = Join-Path $root $path
    if (-not (Test-Path -LiteralPath $file -PathType Leaf)) { $file = Join-Path $root "index.html" }
    $ext = [IO.Path]::GetExtension($file).ToLowerInvariant()
    $contentType = switch ($ext) {
        ".html" { "text/html; charset=utf-8" }
        ".js" { "text/javascript; charset=utf-8" }
        ".css" { "text/css; charset=utf-8" }
        ".json" { "application/json; charset=utf-8" }
        ".svg" { "image/svg+xml" }
        default { "application/octet-stream" }
    }
    $bytes = [IO.File]::ReadAllBytes($file)
    $context.Response.ContentType = $contentType
    $context.Response.Headers.Add("Cache-Control", "no-store, no-cache, must-revalidate")
    $context.Response.Headers.Add("Pragma", "no-cache")
    $context.Response.ContentLength64 = $bytes.Length
    $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    $context.Response.Close()
}
