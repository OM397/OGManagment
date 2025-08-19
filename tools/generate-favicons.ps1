param(
  [Parameter(Mandatory=$true)][string]$Source,
  [Parameter(Mandatory=$true)][string]$FrontendPublic,
  [Parameter(Mandatory=$true)][string]$BackendPublic
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

function Save-Resized {
  param(
    [Parameter(Mandatory=$true)][System.Drawing.Bitmap]$Image,
    [Parameter(Mandatory=$true)][int]$Size,
    [Parameter(Mandatory=$true)][string]$Path
  )
  $targetBmp = New-Object System.Drawing.Bitmap($Size, $Size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($targetBmp)
  $g.Clear([System.Drawing.Color]::Transparent)
  $g.SmoothingMode = 'HighQuality'
  $g.InterpolationMode = 'HighQualityBicubic'
  $g.PixelOffsetMode = 'HighQuality'

  $margin = [Math]::Round($Size * 0.12)
  $avail = $Size - (2 * $margin)
  $scale = [Math]::Min($avail / $Image.Width, $avail / $Image.Height)
  $w = [Math]::Round($Image.Width * $scale)
  $h = [Math]::Round($Image.Height * $scale)
  $x = [Math]::Round(($Size - $w) / 2)
  $y = [Math]::Round(($Size - $h) / 2)

  $g.DrawImage($Image, $x, $y, $w, $h)
  $g.Dispose()
  $targetBmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $targetBmp.Dispose()
}

function New-CroppedResizedIcons {
  param(
    [Parameter(Mandatory=$true)][string]$SrcPath,
    [Parameter(Mandatory=$true)][string]$OutDir
  )

  $bmp = [System.Drawing.Bitmap]::FromFile($SrcPath)
  # Find non-transparent bounds
  $minX = $bmp.Width; $minY = $bmp.Height; $maxX = -1; $maxY = -1
  for ($y = 0; $y -lt $bmp.Height; $y++) {
    for ($x = 0; $x -lt $bmp.Width; $x++) {
      $px = $bmp.GetPixel($x, $y)
      if ($px.A -gt 0) {
        if ($x -lt $minX) { $minX = $x }
        if ($y -lt $minY) { $minY = $y }
        if ($x -gt $maxX) { $maxX = $x }
        if ($y -gt $maxY) { $maxY = $y }
      }
    }
  }
  if ($maxX -eq -1) { $minX = 0; $minY = 0; $maxX = $bmp.Width - 1; $maxY = $bmp.Height - 1 }
  $rect = New-Object System.Drawing.Rectangle($minX, $minY, ($maxX - $minX + 1), ($maxY - $minY + 1))
  $cropped = $bmp.Clone($rect, $bmp.PixelFormat)

  New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
  Save-Resized -Image $cropped -Size 32 -Path (Join-Path $OutDir 'favicon-32.png')
  Save-Resized -Image $cropped -Size 16 -Path (Join-Path $OutDir 'favicon-16.png')
  Save-Resized -Image $cropped -Size 180 -Path (Join-Path $OutDir 'apple-touch-icon.png')

  $cropped.Dispose(); $bmp.Dispose()
}

New-CroppedResizedIcons -SrcPath $Source -OutDir $FrontendPublic
New-CroppedResizedIcons -SrcPath $Source -OutDir $BackendPublic
Write-Host 'Favicons generated in both public folders.'
