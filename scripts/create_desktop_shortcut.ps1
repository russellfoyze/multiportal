# Create Windows Desktop Shortcut with Abir Vai Logo
$ws = New-Object -ComObject WScript.Shell

$currentDir = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path "$currentDir\package.json")) {
    $currentDir = (Get-Location).Path
}

# Check Desktop directories (both regular Desktop and OneDrive Desktop)
$destinations = @(
    "C:\Users\Flindor\OneDrive\Desktop",
    [Environment]::GetFolderPath('Desktop'),
    "$env:USERPROFILE\OneDrive\Desktop",
    "$env:USERPROFILE\Desktop"
)

$targetBat = "$currentDir\portal.bat"
$targetIcon = "$currentDir\portal.ico"

$createdCount = 0

foreach ($desktopPath in $destinations) {
    if (Test-Path $desktopPath) {
        $shortcutFile = Join-Path $desktopPath "PORTAL.lnk"
        $s = $ws.CreateShortcut($shortcutFile)
        $s.TargetPath = $targetBat
        $s.WorkingDirectory = $currentDir
        $s.WindowStyle = 1
        $s.Description = "MA HOSSAIN Private Document Vault (Abir Vai)"
        if (Test-Path $targetIcon) {
            $s.IconLocation = "$targetIcon,0"
        }
        $s.Save()
        Write-Host "Created shortcut: $shortcutFile (Icon: $targetIcon)"
        $createdCount++
    }
}

if ($createdCount -eq 0) {
    Write-Host "No desktop folder found to place shortcut."
}
