Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$source = Join-Path $root "public\favicon-source.png"
$brand = [System.Drawing.Color]::FromArgb(255, 5, 150, 105)

function Import-BitmapWithAlpha {
    param([string]$Path)

    $loaded = [System.Drawing.Bitmap]::FromFile($Path)
    try {
        $bitmap = New-Object System.Drawing.Bitmap $loaded.Width, $loaded.Height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $g = [System.Drawing.Graphics]::FromImage($bitmap)
        $g.Clear([System.Drawing.Color]::Transparent)
        $g.DrawImage($loaded, 0, 0, $loaded.Width, $loaded.Height)
        $g.Dispose()
        return $bitmap
    }
    finally {
        $loaded.Dispose()
    }
}

function Remove-LightBackground {
    param(
        [System.Drawing.Bitmap]$Bitmap,
        [int]$Threshold = 248
    )

    for ($y = 0; $y -lt $Bitmap.Height; $y++) {
        for ($x = 0; $x -lt $Bitmap.Width; $x++) {
            $c = $Bitmap.GetPixel($x, $y)
            if ($c.A -gt 0 -and $c.R -ge $Threshold -and $c.G -ge $Threshold -and $c.B -ge $Threshold) {
                $Bitmap.SetPixel($x, $y, [System.Drawing.Color]::Transparent)
            }
        }
    }
    return $Bitmap
}

function Save-PngWithAlpha {
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

function New-CircularIcon {
    param(
        [System.Drawing.Bitmap]$Source,
        [int]$Size,
        [System.Drawing.Color]$Background
    )

    $output = New-Object System.Drawing.Bitmap $Size, $Size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($output)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
    $g.Clear([System.Drawing.Color]::Transparent)

    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddEllipse(0, 0, $Size - 1, $Size - 1)
    $g.SetClip($path)

    $g.FillEllipse([System.Drawing.SolidBrush]::new($Background), 0, 0, $Size - 1, $Size - 1)

    $padding = [math]::Round($Size * 0.14)
    $inner = $Size - ($padding * 2)
    $scale = [math]::Min($inner / $Source.Width, $inner / $Source.Height)
    $drawW = [math]::Round($Source.Width * $scale)
    $drawH = [math]::Round($Source.Height * $scale)
    $x = [math]::Round(($Size - $drawW) / 2)
    $y = [math]::Round(($Size - $drawH) / 2)

    $attrs = New-Object System.Drawing.Imaging.ImageAttributes
    $attrs.SetWrapMode([System.Drawing.Drawing2D.WrapMode]::Clamp)

    $destRect = New-Object System.Drawing.Rectangle $x, $y, $drawW, $drawH
    $g.DrawImage(
        $Source,
        $destRect,
        0, 0, $Source.Width, $Source.Height,
        [System.Drawing.GraphicsUnit]::Pixel,
        $attrs
    )

    $attrs.Dispose()
    $g.Dispose()
    $path.Dispose()
    return $output
}

if (-not (Test-Path $source)) {
    $source = Join-Path $root "public\favicon-source.ico"
}

$bitmap = Import-BitmapWithAlpha -Path $source
$bitmap = Remove-LightBackground -Bitmap $bitmap -Threshold 248

$sizes = @{
    "favicon-32.png" = 32
    "favicon.png"    = 32
    "apple-icon.png" = 180
    "icon-192.png"   = 192
}

$appDir = Join-Path $root "src\app"

foreach ($entry in $sizes.GetEnumerator()) {
    $circular = New-CircularIcon -Source $bitmap -Size $entry.Value -Background $brand
    $outPath = Join-Path $root "public\$($entry.Key)"
    Save-PngWithAlpha -Bitmap $circular -Path $outPath
    $circular.Dispose()
    Write-Output "Created public/$($entry.Key) ($($entry.Value)x$($entry.Value))"

    if ($entry.Key -eq "favicon.png" -or $entry.Key -eq "apple-icon.png") {
        $appName = if ($entry.Key -eq "favicon.png") { "icon.png" } else { "apple-icon.png" }
        Copy-Item -Force $outPath (Join-Path $appDir $appName)
        Write-Output "Copied to src/app/$appName"
    }
}

$bitmap.Dispose()
Write-Output "Done."
