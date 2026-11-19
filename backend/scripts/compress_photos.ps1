# ==============================================================================
# 10th Class Student Photo Quality Compressor (180 KB - 195 KB Target)
# Windows Native PowerShell and .NET System.Drawing (Pure ASCII Encoding)
# Preserves 100% facial sharpness, eye clarity and uniform details with HighQualityBicubic.
# ==============================================================================

Add-Type -AssemblyName System.Drawing

$inputFolder = 'D:\Rajesh\10th Class\Photo & Sign\photos'
$outputFolder = 'D:\Rajesh\10th Class\Photo & Sign\photos_compressed_180_195kb'

$MIN_KB = 180
$MAX_KB = 195
$MIN_BYTES = 180 * 1024       # 184,320 bytes
$MAX_BYTES = 195 * 1024       # 199,680 bytes
$TARGET_BYTES = 187.5 * 1024  # ~187.5 KB midpoint

Write-Host '================================================================' -ForegroundColor Cyan
Write-Host '   [PHOTO COMPRESSOR] 10th Class Student Photos (180-195 KB)' -ForegroundColor Yellow
Write-Host '================================================================' -ForegroundColor Cyan
Write-Host "Input Folder  : $inputFolder"
Write-Host "Output Folder : $outputFolder"
Write-Host "Target Size   : $MIN_KB KB to $MAX_KB KB (Crystal Clear Studio Quality)"
Write-Host '----------------------------------------------------------------'

if (-not (Test-Path $inputFolder)) {
    Write-Host "[ERROR] Input folder not found: $inputFolder" -ForegroundColor Red
    Write-Host 'Please verify the folder path and try again.'
    exit 1
}

if (-not (Test-Path $outputFolder)) {
    New-Item -ItemType Directory -Path $outputFolder -Force | Out-Null
}

# Locate JPEG Codec
$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
if (-not $jpegCodec) {
    Write-Host '[ERROR] JPEG Codec not available in System.Drawing' -ForegroundColor Red
    exit 1
}

$validExtensions = @('.jpg', '.jpeg', '.png', '.webp', '.bmp')
$files = Get-ChildItem -Path $inputFolder -File | Where-Object { $validExtensions -contains $_.Extension.ToLower() }

if ($files.Count -eq 0) {
    Write-Host "[WARN] No photo files found in $inputFolder" -ForegroundColor Yellow
    exit 0
}

Write-Host "Found $($files.Count) photo(s) to process...`n" -ForegroundColor Green

function Render-ImageToBytes ($origImg, [double]$scale, [int]$quality, $jpegCodec) {
    $origW = $origImg.Width
    $origH = $origImg.Height

    $targetW = [Math]::Max(20, [int][Math]::Round($origW * $scale))
    $targetH = [Math]::Max(20, [int][Math]::Round($origH * $scale))

    $newBmp = New-Object System.Drawing.Bitmap($targetW, $targetH)
    $g = [System.Drawing.Graphics]::FromImage($newBmp)

    # Maximum studio quality interpolation
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    $g.DrawImage($origImg, 0, 0, $targetW, $targetH)
    $g.Dispose()

    # Encoder Parameters for Quality
    $encParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $qVal = [Math]::Min(100, [Math]::Max(1, $quality))
    $encParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [int64]$qVal)

    $ms = New-Object System.IO.MemoryStream
    $newBmp.Save($ms, $jpegCodec, $encParams)
    $encParams.Dispose()
    $newBmp.Dispose()

    $bytes = $ms.ToArray()
    $ms.Dispose()

    return $bytes
}

$successCount = 0
$idx = 0

foreach ($file in $files) {
    $idx++
    $inPath = $file.FullName
    $baseName = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
    $outPath = Join-Path $outputFolder ($baseName + '.jpg')

    $origKB = [Math]::Round(($file.Length / 1024), 1)

    try {
        # Read file bytes to avoid locking original file
        $bytesIn = [System.IO.File]::ReadAllBytes($inPath)
        $inMs = New-Object System.IO.MemoryStream($bytesIn, $false)
        $origImg = [System.Drawing.Image]::FromStream($inMs)

        # Handle EXIF auto-rotation
        if ($origImg.PropertyIdList -contains 274) {
            $prop = $origImg.GetPropertyItem(274)
            $orient = $prop.Value[0]
            if ($orient -eq 6) { $origImg.RotateFlip([System.Drawing.RotateFlipType]::Rotate90FlipNone) }
            elseif ($orient -eq 8) { $origImg.RotateFlip([System.Drawing.RotateFlipType]::Rotate270FlipNone) }
            elseif ($orient -eq 3) { $origImg.RotateFlip([System.Drawing.RotateFlipType]::Rotate180FlipNone) }
        }

        # Step 1: Initial test at scale 1.0, quality 92
        $bestScale = 1.0
        $bestQ = 92
        $buf = Render-ImageToBytes $origImg $bestScale $bestQ $jpegCodec

        if ($buf.Length -ge $MIN_BYTES -and $buf.Length -le $MAX_BYTES) {
            [System.IO.File]::WriteAllBytes($outPath, $buf)
            $newKB = [Math]::Round(($buf.Length / 1024), 1)
            Write-Host "[OK] [$idx/$($files.Count)] $($file.Name)" -ForegroundColor White
            Write-Host "     Original: $origKB KB  -->  New: $newKB KB [PERFECT: 180-195 KB]" -ForegroundColor Green
            $successCount++
            $origImg.Dispose()
            $inMs.Dispose()
            continue
        }

        $bestBuf = $buf
        $bestDiff = [Math]::Abs($buf.Length - $TARGET_BYTES)

        # Step 2: Binary Search Scale
        $lowScale = 0.05
        $highScale = if ($buf.Length -gt $MAX_BYTES) { 1.0 } else { 3.0 }

        for ($i = 0; $i -lt 12; $i++) {
            $midScale = ($lowScale + $highScale) / 2.0
            $testBuf = Render-ImageToBytes $origImg $midScale 92 $jpegCodec
            $diff = [Math]::Abs($testBuf.Length - $TARGET_BYTES)

            if ($diff -lt $bestDiff) {
                $bestDiff = $diff
                $bestBuf = $testBuf
                $bestScale = $midScale
            }

            if ($testBuf.Length -ge $MIN_BYTES -and $testBuf.Length -le $MAX_BYTES) {
                $bestBuf = $testBuf
                break
            }

            if ($testBuf.Length -gt $TARGET_BYTES) {
                $highScale = $midScale
            } else {
                $lowScale = $midScale
            }
        }

        # Step 3: Fine-Tune Quality around Best Scale
        if ($bestBuf.Length -lt $MIN_BYTES -or $bestBuf.Length -gt $MAX_BYTES) {
            $lowQ = 70
            $highQ = 100
            for ($j = 0; $j -lt 8; $j++) {
                $midQ = [int][Math]::Round(($lowQ + $highQ) / 2.0)
                $testBuf = Render-ImageToBytes $origImg $bestScale $midQ $jpegCodec
                $diff = [Math]::Abs($testBuf.Length - $TARGET_BYTES)

                if ($diff -lt $bestDiff) {
                    $bestDiff = $diff
                    $bestBuf = $testBuf
                    $bestQ = $midQ
                }

                if ($testBuf.Length -ge $MIN_BYTES -and $testBuf.Length -le $MAX_BYTES) {
                    $bestBuf = $testBuf
                    break
                }

                if ($testBuf.Length -gt $TARGET_BYTES) {
                    $highQ = $midQ
                } else {
                    $lowQ = $midQ
                }
            }
        }

        # Step 4: Step-by-step Micro Tuning
        if ($bestBuf.Length -lt $MIN_BYTES) {
            for ($step = 1; $step -le 8; $step++) {
                $fineScale = $bestScale * (1 + $step * 0.015)
                $testBuf = Render-ImageToBytes $origImg $fineScale ([Math]::Min(100, $bestQ + $step)) $jpegCodec
                if ($testBuf.Length -ge $MIN_BYTES -and $testBuf.Length -le $MAX_BYTES) {
                    $bestBuf = $testBuf
                    break
                }
                if ($testBuf.Length -gt $MAX_BYTES) { break }
                $bestBuf = $testBuf
            }
        } elseif ($bestBuf.Length -gt $MAX_BYTES) {
            for ($step = 1; $step -le 8; $step++) {
                $fineScale = $bestScale * (1 - $step * 0.015)
                $testBuf = Render-ImageToBytes $origImg $fineScale ([Math]::Max(70, $bestQ - $step)) $jpegCodec
                if ($testBuf.Length -ge $MIN_BYTES -and $testBuf.Length -le $MAX_BYTES) {
                    $bestBuf = $testBuf
                    break
                }
                if ($testBuf.Length -lt $MIN_BYTES) { break }
                $bestBuf = $testBuf
            }
        }

        [System.IO.File]::WriteAllBytes($outPath, $bestBuf)
        $newKB = [Math]::Round(($bestBuf.Length / 1024), 1)

        if ($bestBuf.Length -ge $MIN_BYTES -and $bestBuf.Length -le $MAX_BYTES) {
            Write-Host "[OK] [$idx/$($files.Count)] $($file.Name)" -ForegroundColor White
            Write-Host "     Original: $origKB KB  -->  New: $newKB KB [PERFECT: 180-195 KB]" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host "[NEAR] [$idx/$($files.Count)] $($file.Name)" -ForegroundColor White
            Write-Host "     Original: $origKB KB  -->  New: $newKB KB [Close to target]" -ForegroundColor Yellow
        }

        $origImg.Dispose()
        $inMs.Dispose()

    } catch {
        Write-Host "[FAIL] [$idx/$($files.Count)] Error processing $($file.Name): $_" -ForegroundColor Red
    }
}

Write-Host "`n================================================================" -ForegroundColor Cyan
Write-Host "Finished! Successfully compressed: $successCount / $($files.Count) photos" -ForegroundColor Green
Write-Host "Compressed photos are safely saved in:" -ForegroundColor Yellow
Write-Host "   $outputFolder" -ForegroundColor White
Write-Host '================================================================' -ForegroundColor Cyan
