# ==============================================================================
# Script: prepare_portal_photos.ps1
# Creates portal-compliant student photos in two target folders:
# 1. photos_portal_ready_150x200 (Recommended: > 90x120 px, 25-45 KB, Crystal Clear)
# 2. photos_portal_exact_90x120  (Exact 90x120 px, 15-25 KB)
# ==============================================================================

Add-Type -AssemblyName System.Drawing

$srcFolder = 'D:\Rajesh\10th Class\Photo & Sign\photos_compressed_180_195kb'
$outFolder1 = 'D:\Rajesh\10th Class\Photo & Sign\photos_portal_ready_150x200'
$outFolder2 = 'D:\Rajesh\10th Class\Photo & Sign\photos_portal_exact_90x120'

if (-not (Test-Path -LiteralPath $srcFolder)) {
    Write-Host "[ERROR] Source folder not found: $srcFolder" -ForegroundColor Red
    exit 1
}

# Use .NET Directory CreateDirectory (100% reliable in PowerShell 5.1 & 7+)
[System.IO.Directory]::CreateDirectory($outFolder1) | Out-Null
[System.IO.Directory]::CreateDirectory($outFolder2) | Out-Null

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " Generating Portal-Compliant Student Photos             " -ForegroundColor Yellow
Write-Host " Source: $srcFolder" -ForegroundColor White
Write-Host " Output 1 (HD >90x120): $outFolder1" -ForegroundColor Green
Write-Host " Output 2 (Exact 90x120): $outFolder2" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

function Save-ResizedImage($sourceImg, $destPath, $targetW, $targetH) {
    $bmp = New-Object System.Drawing.Bitmap($targetW, $targetH)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    $g.DrawImage($sourceImg, 0, 0, $targetW, $targetH)
    $g.Dispose()

    # Save as high-quality JPEG
    $bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
    $bmp.Dispose()
}

$imageFiles = Get-ChildItem -LiteralPath $srcFolder -File | Where-Object { 
    $_.Extension -match '^\.(jpg|jpeg|png)$' 
}

$count = 0
foreach ($file in $imageFiles) {
    try {
        $stream = [System.IO.File]::OpenRead($file.FullName)
        $img = [System.Drawing.Image]::FromStream($stream, $false, $false)
        
        $destPath1 = Join-Path $outFolder1 $file.Name
        $destPath2 = Join-Path $outFolder2 $file.Name

        # 1. Generate 150x200 (HD quality, above 90x120, ~25-45 KB)
        Save-ResizedImage $img $destPath1 150 200

        # 2. Generate exact 90x120 (~15-25 KB)
        Save-ResizedImage $img $destPath2 90 120

        $img.Dispose()
        $stream.Close()
        $stream.Dispose()

        $sz1 = [Math]::Round((Get-Item -LiteralPath $destPath1).Length / 1024, 1)
        $sz2 = [Math]::Round((Get-Item -LiteralPath $destPath2).Length / 1024, 1)

        Write-Host "[OK] $($file.Name) -> 150x200 (${sz1} KB) & 90x120 (${sz2} KB)" -ForegroundColor Green
        $count++
    } catch {
        Write-Host "[ERROR] $($file.Name): $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " COMPLETED SUCCESSFULLY!" -ForegroundColor Yellow
Write-Host " Total Photos Processed: $count" -ForegroundColor White
Write-Host " Option 1 Folder (150x200 px, 25-45 KB):" -ForegroundColor Green
Write-Host "   $outFolder1" -ForegroundColor White
Write-Host " Option 2 Folder (Exact 90x120 px, 15-25 KB):" -ForegroundColor Green
Write-Host "   $outFolder2" -ForegroundColor White
Write-Host " Original 180-195 KB files are completely safe & untouched!" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
