# Create Windows Desktop Shortcut with Abir Vai Logo (Flindor)
$ws = New-Object -ComObject WScript.Shell

# Priority list of possible app locations
$possibleAppDirs = @(
    "D:\New folder\PORTAL\PORTAL",
    "C:\Users\Flindor\OneDrive\Desktop\PORTAL",
    (Split-Path -Parent $PSScriptRoot),
    (Get-Location).Path,
    "D:\PORTAL"
)

$appDir = $null
foreach ($dir in $possibleAppDirs) {
    if (Test-Path "$dir\package.json") {
        $appDir = $dir
        break
    }
}

if (-not $appDir) {
    $appDir = (Get-Location).Path
}

$targetBat = "$appDir\portal.bat"
$targetIcon = "$appDir\portal.ico"

# Target desktop folders
$destinations = @(
    "C:\Users\Flindor\OneDrive\Desktop",
    "C:\Users\Flindor\Desktop",
    [Environment]::GetFolderPath('Desktop'),
    "$env:USERPROFILE\OneDrive\Desktop",
    "$env:USERPROFILE\Desktop"
)

$createdCount = 0

foreach ($desktopPath in $destinations) {
    if (Test-Path $desktopPath) {
        $shortcutFile = Join-Path $desktopPath "PORTAL.lnk"
        $s = $ws.CreateShortcut($shortcutFile)
        $s.TargetPath = $targetBat
        $s.WorkingDirectory = $appDir
        $s.WindowStyle = 1
        $s.Description = "MA HOSSAIN Private Document Vault - Abir Vai"
        if (Test-Path $targetIcon) {
            $s.IconLocation = "$targetIcon,0"
        }
        $s.Save()
        Write-Host "Created desktop shortcut: $shortcutFile"
        Write-Host "  Target: $targetBat"
        Write-Host "  Icon:   $targetIcon"
        $createdCount++
    }
}

if ($createdCount -eq 0) {
    Write-Host "No desktop folder found to place shortcut."
}
