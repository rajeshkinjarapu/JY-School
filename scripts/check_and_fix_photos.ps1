# ==============================================================================
# Script: check_and_fix_photos.ps1
# Target Folder: D:\Rajesh\10th Class\Photo & Sign\photos_compressed_180_195kb
# Requirement: Width >= 90 px, Height >= 120 px
# ==============================================================================

Add-Type -AssemblyName System.Drawing

$folderPath = 'D:\Rajesh\10th Class\Photo & Sign\photos_compressed_180_195kb'

if (-not (Test-Path -LiteralPath $folderPath)) {
    Write-Host "[ERROR] Folder not found: $folderPath" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " 10th Class Photos Dimension Verification (Min: 90x120) " -ForegroundColor Yellow
Write-Host " Folder: $folderPath" -ForegroundColor White
Write-Host " Rule: Width >= 90 px, Height >= 120 px" -ForegroundColor White
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$imageFiles = Get-ChildItem -LiteralPath $folderPath -File | Where-Object { 
    $_.Extension -match '^\.(jpg|jpeg|png)$' 
}

if ($imageFiles.Count -eq 0) {
    Write-Host "[WARNING] No JPG/PNG images found in this folder!" -ForegroundColor Yellow
    exit 0
}

$total = $imageFiles.Count
$passed = 0
$fixed = 0

foreach ($file in $imageFiles) {
    try {
        # Read image dimensions
        $stream = [System.IO.File]::OpenRead($file.FullName)
        $img = [System.Drawing.Image]::FromStream($stream, $false, $false)
        $w = $img.Width
        $h = $img.Height
        $stream.Close()
        $stream.Dispose()
        $img.Dispose()

        $sizeKB = [Math]::Round($file.Length / 1024, 1)

        # Verification: Width >= 90 and Height >= 120
        if ($w -ge 90 -and $h -ge 120) {
            Write-Host "[PASS] $($file.Name) -> ${w} x ${h} px (${sizeKB} KB)" -ForegroundColor Green
            $passed++
        } else {
            Write-Host "[BELOW MINIMUM] $($file.Name) -> ${w} x ${h} px (Requirement: Min 90x120)" -ForegroundColor Yellow
            
            # Calculate upscale factor to preserve aspect ratio
            $scaleW = 90.0 / $w
            $scaleH = 120.0 / $h
            $scale = [Math]::Max($scaleW, $scaleH)
            
            $newW = [Math]::Ceiling($w * $scale)
            $newH = [Math]::Ceiling($h * $scale)

            # High-quality resize
            $origImg = [System.Drawing.Image]::FromFile($file.FullName)
            $newBmp = New-Object System.Drawing.Bitmap($newW, $newH)
            $g = [System.Drawing.Graphics]::FromImage($newBmp)
            $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
            $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
            $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

            $g.DrawImage($origImg, 0, 0, $newW, $newH)
            $g.Dispose()
            $origImg.Dispose()

            # Save to temp and replace
            $tempPath = "$($file.FullName).tmp"
            $newBmp.Save($tempPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
            $newBmp.Dispose()

            Move-Item -LiteralPath $tempPath -Destination $file.FullName -Force
            $newSizeKB = [Math]::Round((Get-Item -LiteralPath $file.FullName).Length / 1024, 1)

            Write-Host "   -> [RESIZED] New Dimensions: ${newW} x ${newH} px (${newSizeKB} KB)" -ForegroundColor Cyan
            $fixed++
        }
    } catch {
        Write-Host "[ERROR] $($file.Name) : $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " SUMMARY REPORT:" -ForegroundColor Yellow
Write-Host "   Total Photos Checked: $total" -ForegroundColor White
Write-Host "   Already Compliant (Pass): $passed" -ForegroundColor Green
if ($fixed -gt 0) {
    Write-Host "   Resized to Meet Min 90x120: $fixed" -ForegroundColor Cyan
}
Write-Host " All photos in folder are now compliant (>= 90x120 px)!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
