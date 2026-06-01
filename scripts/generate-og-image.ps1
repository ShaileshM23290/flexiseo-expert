Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$outPath = Join-Path $root "public\og-image.png"

$width = 1200
$height = 630
$bitmap = New-Object System.Drawing.Bitmap $width, $height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($bitmap)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

$bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush (
  (New-Object System.Drawing.Rectangle 0, 0, $width, $height),
  [System.Drawing.Color]::FromArgb(255, 197, 48, 48),
  [System.Drawing.Color]::FromArgb(255, 123, 20, 20),
  45
)
$g.FillRectangle($bgBrush, 0, 0, $width, $height)
$bgBrush.Dispose()

$panelBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(28, 255, 255, 255))
$g.FillEllipse($panelBrush, 80, 130, 370, 370)
$panelBrush.Dispose()

$white = [System.Drawing.Color]::White
$lensPen = New-Object System.Drawing.Pen $white, 18
$g.DrawEllipse($lensPen, 170, 220, 190, 190)
$lensPen.Dispose()

$barBrush = New-Object System.Drawing.SolidBrush $white
$g.FillRectangle($barBrush, 215, 315, 18, 45)
$g.FillRectangle($barBrush, 243, 295, 18, 65)
$g.FillRectangle($barBrush, 271, 275, 18, 85)
$barBrush.Dispose()

$handlePen = New-Object System.Drawing.Pen $white, 18
$handlePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$handlePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
$g.DrawLine($handlePen, 330, 370, 390, 430)
$handlePen.Dispose()

$titleFont = New-Object System.Drawing.Font("Segoe UI", 54, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$subFont = New-Object System.Drawing.Font("Segoe UI", 28, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$tagFont = New-Object System.Drawing.Font("Segoe UI", 22, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)

$titleBrush = New-Object System.Drawing.SolidBrush $white
$subBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(235, 255, 255, 255))

$g.DrawString("FlexiSeo Expert", $titleFont, $titleBrush, 520, 210)
$g.DrawString("Free AI SEO Audit", $subFont, $subBrush, 520, 290)
$g.DrawString("Lighthouse / CrUX / Security / AI Recommendations", $tagFont, $subBrush, 520, 360)

$titleFont.Dispose()
$subFont.Dispose()
$tagFont.Dispose()
$titleBrush.Dispose()
$subBrush.Dispose()
$g.Dispose()

$encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
  Where-Object { $_.MimeType -eq "image/png" } |
  Select-Object -First 1
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
  [System.Drawing.Imaging.Encoder]::Compression,
  [long]0
)
$bitmap.Save($outPath, $encoder, $encoderParams)
$bitmap.Dispose()

Write-Output "Created public/og-image.png (1200x630)"
