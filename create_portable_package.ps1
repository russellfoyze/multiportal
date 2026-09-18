# Create Portable Zip Package for MA HOSSAIN Document Portal
$sourceDir = "d:\PORTAL"
$zipPath = "d:\PORTAL\MA_HOSSAIN_PORTAL_PORTABLE.zip"
$desktopZip = "C:\Users\russe\Desktop\MA_HOSSAIN_PORTAL_PORTABLE.zip"

if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
if (Test-Path $desktopZip) { Remove-Item $desktopZip -Force }

$itemsToInclude = @(
    "app",
    "components",
    "lib",
    "public",
    "demo_files",
    "package.json",
    "tsconfig.json",
    "next.config.mjs",
    "tailwind.config.ts",
    "postcss.config.mjs",
    "next-env.d.ts",
    "middleware.ts",
    "run-portal.bat",
    "run-portal.sh",
    "HOW_TO_RUN_ON_OTHER_COMPUTER.md",
    "README.md",
    "SECURITY_AUDIT_REPORT.md",
    "security_audit_suite.mjs",
    ".env.example",
    ".env.local",
    ".gitignore",
    "Dockerfile",
    "docker-compose.yml"
)

$tempFolder = "$env:TEMP\portal_portable_pack"
if (Test-Path $tempFolder) { Remove-Item $tempFolder -Recurse -Force }
New-Item -ItemType Directory -Path $tempFolder -Force | Out-Null

foreach ($item in $itemsToInclude) {
    $fullPath = Join-Path $sourceDir $item
    if (Test-Path $fullPath) {
        Copy-Item -Path $fullPath -Destination $tempFolder -Recurse -Force
    }
}

Compress-Archive -Path "$tempFolder\*" -DestinationPath $zipPath -CompressionLevel Optimal -Force
Copy-Item -Path $zipPath -Destination $desktopZip -Force

Remove-Item $tempFolder -Recurse -Force

Write-Host "Portable package created at: $zipPath"
Write-Host "Desktop copy created at: $desktopZip"
Get-Item $zipPath | Select-Object Name, Length, LastWriteTime
