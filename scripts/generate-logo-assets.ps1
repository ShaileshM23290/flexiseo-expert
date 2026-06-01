Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

function New-FlexiSeoLogo {
    param([int]$Size)

    $bitmap = New-Object System.Drawing.Bitmap $Size, $Size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bitmap)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    $scale = $Size / 512.0
    $s = { param([double]$v) [int][math]::Round($v * $scale) }

    $radius = & $s 112
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddArc(0, 0, $radius * 2, $radius * 2, 180, 90)
    $path.AddArc($Size - ($radius * 2), 0, $radius * 2, $radius * 2, 270, 90)
    $path.AddArc($Size - ($radius * 2), $Size - ($radius * 2), $radius * 2, $radius * 2, 0, 90)
    $path.AddArc(0, $Size - ($radius * 2), $radius * 2, $radius * 2, 90, 90)
    $path.CloseFigure()

    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush (
        (New-Object System.Drawing.Rectangle 0, 0, $Size, $Size),
        [System.Drawing.Color]::FromArgb(255, 197, 48, 48),
        [System.Drawing.Color]::FromArgb(255, 123, 20, 20),
        135
    )
    $g.FillPath($brush, $path)
    $brush.Dispose()

    $penBorder = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(36, 255, 255, 255)), (& $s 3)
    $inset = & $s 28
    $innerRadius = & $s 96
    $innerPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $innerSize = $Size - ($inset * 2)
    $innerPath.AddArc($inset, $inset, $innerRadius * 2, $innerRadius * 2, 180, 90)
    $innerPath.AddArc($inset + $innerSize - ($innerRadius * 2), $inset, $innerRadius * 2, $innerRadius * 2, 270, 90)
    $innerPath.AddArc($inset + $innerSize - ($innerRadius * 2), $inset + $innerSize - ($innerRadius * 2), $innerRadius * 2, $innerRadius * 2, 0, 90)
    $innerPath.AddArc($inset, $inset + $innerSize - ($innerRadius * 2), $innerRadius * 2, $innerRadius * 2, 90, 90)
    $innerPath.CloseFigure()
    $g.DrawPath($penBorder, $innerPath)
    $penBorder.Dispose()
    $innerPath.Dispose()

    $white = [System.Drawing.Color]::White
    $lensX = & $s 214
    $lensY = & $s 214
    $lensR = & $s 86
    $lensPen = New-Object System.Drawing.Pen $white, (& $s 28)
    $lensPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $lensPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawEllipse($lensPen, $lensX - $lensR, $lensY - $lensR, $lensR * 2, $lensR * 2)
    $lensPen.Dispose()

    function Draw-Bar([int]$x, [int]$y, [int]$w, [int]$h, [int]$alpha) {
        if ($w -lt 1 -or $h -lt 1) { return }
        $barBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb($alpha, 255, 255, 255))
        if ($w -ge 4 -and $h -ge 4) {
            $scaledRadius = & $s 7
            $barRadius = [math]::Max(1, $scaledRadius)
            $diameter = [math]::Min($barRadius * 2, [math]::Min($w, $h))
            $barPath = New-Object System.Drawing.Drawing2D.GraphicsPath
            $barPath.AddArc($x, $y, $diameter, $diameter, 180, 90)
            $barPath.AddArc($x + $w - $diameter, $y, $diameter, $diameter, 270, 90)
            $barPath.AddArc($x + $w - $diameter, $y + $h - $diameter, $diameter, $diameter, 0, 90)
            $barPath.AddArc($x, $y + $h - $diameter, $diameter, $diameter, 90, 90)
            $barPath.CloseFigure()
            $g.FillPath($barBrush, $barPath)
            $barPath.Dispose()
        } else {
            $g.FillRectangle($barBrush, $x, $y, $w, $h)
        }
        $barBrush.Dispose()
    }

    $barW = & $s 24
    Draw-Bar (& $s 168) (& $s 236) $barW (& $s 52) 199
    Draw-Bar (& $s 200) (& $s 214) $barW (& $s 74) 235
    Draw-Bar (& $s 232) (& $s 192) $barW (& $s 96) 255

    $handlePen = New-Object System.Drawing.Pen $white, (& $s 28)
    $handlePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $handlePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawLine($handlePen, (& $s 278), (& $s 278), (& $s 358), (& $s 358))
    $handlePen.Dispose()

    $path.Dispose()
    $g.Dispose()
    return $bitmap
}

function Save-Png {
    param(
        [System.Drawing.Bitmap]$Bitmap,
        [string]$Path
    )

    $encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
        Where-Object { $_.MimeType -eq "image/png" } |
        Select-Object -First 1
    $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
        [System.Drawing.Imaging.Encoder]::Compression,
        [long]0
    )
    $Bitmap.Save($Path, $encoder, $encoderParams)
}

$public = Join-Path $root "public"
$app = Join-Path $root "src\app"

$logo512 = New-FlexiSeoLogo -Size 512
Save-Png -Bitmap $logo512 -Path (Join-Path $public "logo.png")
Write-Output "Created public/logo.png (512x512)"
$logo512.Dispose()

$sizes = @{
    "favicon.png"    = 32
    "favicon-32.png" = 32
    "apple-icon.png" = 180
    "icon-192.png"   = 192
}

foreach ($entry in $sizes.GetEnumerator()) {
    $icon = New-FlexiSeoLogo -Size $entry.Value
    $outPath = Join-Path $public $entry.Key
    Save-Png -Bitmap $icon -Path $outPath
    $icon.Dispose()
    Write-Output "Created public/$($entry.Key) ($($entry.Value)x$($entry.Value))"

    if ($entry.Key -eq "favicon.png" -or $entry.Key -eq "apple-icon.png") {
        $appName = if ($entry.Key -eq "favicon.png") { "icon.png" } else { "apple-icon.png" }
        Copy-Item -Force $outPath (Join-Path $app $appName)
        Write-Output "Copied to src/app/$appName"
    }
}

Write-Output "Done."
