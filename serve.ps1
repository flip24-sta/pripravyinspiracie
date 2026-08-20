$root = "C:\Users\PRPRAV~1\OneDrive\Desktop\Portfolio"
$port = 8123
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "Serving $root on http://localhost:$port/"

$mime = @{
    ".html" = "text/html"; ".css" = "text/css"; ".js" = "application/javascript"
    ".jpg" = "image/jpeg"; ".jpeg" = "image/jpeg"; ".png" = "image/png"
    ".gif" = "image/gif"; ".svg" = "image/svg+xml"; ".ico" = "image/x-icon"
    ".pdf" = "application/pdf"; ".json" = "application/json"
}

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response
    try {
        $path = [System.Uri]::UnescapeDataString($request.Url.AbsolutePath)
        if ($path -eq "/") { $path = "/index.html" }
        $filePath = Join-Path $root ($path.TrimStart('/'))
        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $contentType = $mime[$ext]
            if (-not $contentType) { $contentType = "application/octet-stream" }
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentType = $contentType
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.OutputStream.Write($msg, 0, $msg.Length)
        }
    } catch {
    } finally {
        $response.OutputStream.Close()
    }
}
