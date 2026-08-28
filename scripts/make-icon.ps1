Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = "Stop"

$repo = if ($args.Count -gt 0) { $args[0] } else { (Resolve-Path (Join-Path $PSScriptRoot "..")).Path }
$outDir = Join-Path $repo "build"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$out = Join-Path $outDir "icon.png"

$size = 512
$bmp = New-Object System.Drawing.Bitmap $size, $size
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.Clear([System.Drawing.Color]::FromArgb(255, 16, 27, 26))

$teal = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 20, 99, 92))
$gold = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 196, 137, 58))

$gp = New-Object System.Drawing.Drawing2D.GraphicsPath
$d = 160
$x = 36
$y = 36
$w = 440
$h = 440
$gp.AddArc($x, $y, $d, $d, 180, 90)
$gp.AddArc(($x + $w - $d), $y, $d, $d, 270, 90)
$gp.AddArc(($x + $w - $d), ($y + $h - $d), $d, $d, 0, 90)
$gp.AddArc($x, ($y + $h - $d), $d, $d, 90, 90)
$gp.CloseFigure()
$g.FillPath($teal, $gp)

function New-Star([int]$cx, [int]$cy, [float]$outer, [float]$inner) {
  $pts = New-Object System.Collections.Generic.List[System.Drawing.PointF]
  $spikes = 4
  $step = [Math]::PI / $spikes
  $rot = -[Math]::PI / 2
  for ($i = 0; $i -lt ($spikes * 2); $i++) {
    $r = if (($i % 2) -eq 0) { $outer } else { $inner }
    $ang = $rot + $i * $step
    $pts.Add((New-Object System.Drawing.PointF (($cx + [Math]::Cos($ang) * $r), ($cy + [Math]::Sin($ang) * $r))))
  }
  return $pts.ToArray()
}

$g.FillPolygon($gold, (New-Star 256 214 96 38))
$g.FillPolygon($gold, (New-Star 170 348 44 17))
$g.FillPolygon($gold, (New-Star 342 348 44 17))

$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
$gp.Dispose()
$teal.Dispose()
$gold.Dispose()
Write-Output $out
