Add-Type -AssemblyName System.Drawing

$outputPathPng = "d:\PORTAL\public\logo.png"
$outputPathIco = "d:\PORTAL\portal.ico"

$size = 256
$bmp = New-Object System.Drawing.Bitmap($size, $size)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

# Transparent background
$g.Clear([System.Drawing.Color]::Transparent)

# Outer rounded rectangle (with slight padding for crisp borders)
$rect = New-Object System.Drawing.Rectangle(10, 10, 236, 236)
$radius = 46
$dia = $radius * 2

$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$path.AddArc($rect.X, $rect.Y, $dia, $dia, 180, 90)
$path.AddArc($rect.Right - $dia, $rect.Y, $dia, $dia, 270, 90)
$path.AddArc($rect.Right - $dia, $rect.Bottom - $dia, $dia, $dia, 0, 90)
$path.AddArc($rect.X, $rect.Bottom - $dia, $dia, $dia, 90, 90)
$path.CloseFigure()

# Vibrant Deep Indigo to Violet Gradient (#4f46e5 to #7c3aed to #4338ca)
$gradBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.PointF(10, 10)),
    (New-Object System.Drawing.PointF(246, 246)),
    [System.Drawing.Color]::FromArgb(255, 67, 56, 202),   # Deep Indigo
    [System.Drawing.Color]::FromArgb(255, 124, 58, 237)  # Electric Violet
)
$g.FillPath($gradBrush, $path)

# Add subtle inner highlight gradient on top half
$topRect = New-Object System.Drawing.Rectangle(12, 12, 232, 110)
$topBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.PointF(12, 12)),
    (New-Object System.Drawing.PointF(12, 122)),
    [System.Drawing.Color]::FromArgb(50, 255, 255, 255),
    [System.Drawing.Color]::FromArgb(0, 255, 255, 255)
)
$g.FillRectangle($topBrush, $topRect)

# Elegant crisp border
$borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(160, 165, 180, 252), 3.5)
$g.DrawPath($borderPen, $path)

# Subtle outer dark edge
$shadowPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(90, 15, 23, 42), 1.5)
$g.DrawPath($shadowPen, $path)

# Draw central MP Monogram
$fontFam = New-Object System.Drawing.FontFamily("Segoe UI")
$fontMP = New-Object System.Drawing.Font($fontFam, 42, [System.Drawing.FontStyle]::Bold)
$formatCenter = New-Object System.Drawing.StringFormat
$formatCenter.Alignment = [System.Drawing.StringAlignment]::Center
$formatCenter.LineAlignment = [System.Drawing.StringAlignment]::Center

# Text Drop Shadow for 3D depth
$shadowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(120, 15, 23, 42))
$rectShadow = New-Object System.Drawing.RectangleF(10, 37, 236, 80)
$g.DrawString("MP", $fontMP, $shadowBrush, $rectShadow, $formatCenter)

# Main White Typography
$whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$rectMP = New-Object System.Drawing.RectangleF(10, 35, 236, 80)
$g.DrawString("MP", $fontMP, $whiteBrush, $rectMP, $formatCenter)

# Decorative divider line with glow
$linePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(140, 199, 210, 254), 2)
$g.DrawLine($linePen, 50, 124, 206, 124)

# "MULTIPORTAL" Title
$fontName = New-Object System.Drawing.Font($fontFam, 14, [System.Drawing.FontStyle]::Bold)
$rectName = New-Object System.Drawing.RectangleF(10, 134, 236, 30)
$g.DrawString("MULTIPORTAL", $fontName, $whiteBrush, $rectName, $formatCenter)

# "PRIVATE VAULT" Subtitle Badge
$fontSub = New-Object System.Drawing.Font($fontFam, 10, [System.Drawing.FontStyle]::Bold)
$subBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(210, 199, 210, 254))
$rectSub = New-Object System.Drawing.RectangleF(10, 168, 236, 26)
$g.DrawString("PRIVATE VAULT", $fontSub, $subBrush, $rectSub, $formatCenter)

# Small "RUSSELL" accent badge at bottom
$fontSub2 = New-Object System.Drawing.Font($fontFam, 8, [System.Drawing.FontStyle]::Bold)
$sub2Brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(170, 224, 231, 255))
$rectSub2 = New-Object System.Drawing.RectangleF(10, 196, 236, 20)
$g.DrawString("RUSSELL FOYZE", $fontSub2, $sub2Brush, $rectSub2, $formatCenter)

# Save high-res PNG
$bmp.Save($outputPathPng, [System.Drawing.Imaging.ImageFormat]::Png)

# Save standard ICO for Windows Shortcut
$hIcon = $bmp.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)
$fs = New-Object System.IO.FileStream($outputPathIco, [System.IO.FileMode]::Create)
$icon.Save($fs)
$fs.Close()

$icon.Dispose()
$bmp.Dispose()
$g.Dispose()

Write-Host "Updated $outputPathPng and $outputPathIco successfully."
