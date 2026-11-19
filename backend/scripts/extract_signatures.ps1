# ==============================================================================
# 10th Class Student Signature Extractor & Optimizer (PowerShell Native)
# Windows Native System.Drawing (No npm or python installations required)
# Generates individual .jpg signature files named with Student Names
# Target: Only JPEG | Min 100x30 px | Size: 2 KB to 30 KB
# ==============================================================================

Add-Type -AssemblyName System.Drawing

$inputFolder = 'D:\Rajesh\10th Class\Photo & Sign\Orginal Sign'
$outputFolder = 'D:\Rajesh\10th Class\Photo & Sign\Student_Signatures_JPEG'

$MIN_KB = 2.0
$MAX_KB = 30.0
$MIN_BYTES = 2048
$MAX_BYTES = 30720

Write-Host '================================================================' -ForegroundColor Cyan
Write-Host '   [10th CLASS SIGNATURE EXTRACTOR & OPTIMIZER]' -ForegroundColor Yellow
Write-Host '   Target: Only JPEG | Min 100x30 px | Size: 2 KB to 30 KB'
Write-Host '================================================================' -ForegroundColor Cyan
Write-Host "Input Folder  : $inputFolder"
Write-Host "Output Folder : $outputFolder"
Write-Host '----------------------------------------------------------------'

if (-not (Test-Path $inputFolder)) {
    Write-Host "[ERROR] Input folder not found: $inputFolder" -ForegroundColor Red
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

# Define Verified 31 Students across 3 Sheets
$sheet1Students = @(
    "TARRA LEKHANA",
    "YALLA TEJA CHARAN",
    "CHAKKA SHARAT KUMAR",
    "METTA LAHARI",
    "SIRASANA DHEERAJ",
    "SANAPALA JAYANTH",
    "CHALLA BALA SAI SIRI VARSHINI",
    "PALLI HARI SURYA CHANDRAN",
    "BOMMALI RESHMA",
    "SURAVARAPU TEJASWINI"
)

$sheet2Students = @(
    "YALAMANCHI MOHITH",
    "RADA VIJAY KUMAR",
    "MENDA NISHITA",
    "KORADA MADHUKSHARA",
    "VUNNA KOUSHIK",
    "DIVVALA MAHIDHAR",
    "KINJARAPU SYAMALA SHRI",
    "RUNKU TEJESH",
    "TANGI PRAVEEN",
    "JAMMU HARSHAVARDHAN",
    "PANGA LIKHITESWARI"
)

$sheet3Students = @(
    "LAVETI SANJANA",
    "GONDU JAHNAVI",
    "CHINTU BHASHINI",
    "RAVADA HARSHA VARDHAN",
    "DONKANA GOWTHAM",
    "GEMBALI DURGA SRIKAR",
    "MUDDADA BALARAJU",
    "MARLA JOYSI",
    "KARRI BHARGAVI",
    "KORADA SAI PHANI HARSHA"
)

$sheets = @(
    @{ Index = 1; YStart = 0.125; YEnd = 0.952; Students = $sheet1Students },
    @{ Index = 2; YStart = 0.080; YEnd = 0.990; Students = $sheet2Students },
    @{ Index = 3; YStart = 0.075; YEnd = 0.910; Students = $sheet3Students }
)

$validExts = @('.jpg', '.jpeg', '.png', '.bmp', '.webp')
$files = Get-ChildItem -Path $inputFolder -File | Where-Object { $validExts -contains $_.Extension.ToLower() } | Sort-Object Name

if ($files.Count -eq 0) {
    Write-Host "[ERROR] No sheet images found in $inputFolder" -ForegroundColor Red
    exit 1
}

Write-Host "Found $($files.Count) sheet image(s): $(($files | ForEach-Object { $_.Name }) -join ', ')`n" -ForegroundColor Green

function Save-JpegWithinBounds ($bmp, $filePath, $jpegCodec) {
    $q = 88
    $encParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $encParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [int64]$q)

    $ms = New-Object System.IO.MemoryStream
    $bmp.Save($ms, $jpegCodec, $encParams)
    $len = $ms.Length

    # If within 2 KB and 30 KB
    if ($len -ge 2048 -and $len -le 30720) {
        [System.IO.File]::WriteAllBytes($filePath, $ms.ToArray())
        $encParams.Dispose()
        $ms.Dispose()
        return $len
    }

    # Binary search quality in [50..96]
    $lowQ = 50
    $highQ = 96
    $bestBytes = $ms.ToArray()
    $bestLen = $len

    for ($k = 0; $k -lt 6; $k++) {
        $midQ = [int][Math]::Round(($lowQ + $highQ) / 2.0)
        $encParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [int64]$midQ)
        
        $testMs = New-Object System.IO.MemoryStream
        $bmp.Save($testMs, $jpegCodec, $encParams)
        $testLen = $testMs.Length

        if ($testLen -ge 2048 -and $testLen -le 30720) {
            $bestBytes = $testMs.ToArray()
            $bestLen = $testLen
            $testMs.Dispose()
            break
        }

        if ($testLen -gt 30720) {
            $highQ = $midQ
        } else {
            $lowQ = $midQ
            $bestBytes = $testMs.ToArray()
            $bestLen = $testLen
        }
        $testMs.Dispose()
    }

    [System.IO.File]::WriteAllBytes($filePath, $bestBytes)
    $encParams.Dispose()
    $ms.Dispose()
    return $bestLen
}

$totalExtracted = 0
$overallIdx = 0

for ($s = 0; $s -lt $sheets.Count; $s++) {
    if ($s -ge $files.Count) {
        Write-Host "[WARN] File for Sheet $($s + 1) not found." -ForegroundColor Yellow
        continue
    }

    $file = $files[$s]
    $sheetInfo = $sheets[$s]
    $studentsList = $sheetInfo.Students

    Write-Host ">>> Processing Sheet $($sheetInfo.Index): $($file.Name) ($($studentsList.Count) students)" -ForegroundColor Cyan

    $bytesIn = [System.IO.File]::ReadAllBytes($file.FullName)
    $inMs = New-Object System.IO.MemoryStream($bytesIn, $false)
    $sheetImg = [System.Drawing.Image]::FromStream($inMs)

    # Handle EXIF auto-rotation
    if ($sheetImg.PropertyIdList -contains 274) {
        $prop = $sheetImg.GetPropertyItem(274)
        $orient = $prop.Value[0]
        if ($orient -eq 6) { $sheetImg.RotateFlip([System.Drawing.RotateFlipType]::Rotate90FlipNone) }
        elseif ($orient -eq 8) { $sheetImg.RotateFlip([System.Drawing.RotateFlipType]::Rotate270FlipNone) }
        elseif ($orient -eq 3) { $sheetImg.RotateFlip([System.Drawing.RotateFlipType]::Rotate180FlipNone) }
    }

    $W = $sheetImg.Width
    $H = $sheetImg.Height

    # Column 3 (Signatures) bounds
    $colX1 = [int][Math]::Round($W * 0.585)
    $colX2 = [int][Math]::Round($W * 0.970)
    $cellW = $colX2 - $colX1

    $yStart = $sheetInfo.YStart * $H
    $yEnd = $sheetInfo.YEnd * $H
    $totalRows = $studentsList.Count
    $rowHeight = ($yEnd - $yStart) / $totalRows

    for ($r = 0; $r -lt $totalRows; $r++) {
        $overallIdx++
        $studentName = $studentsList[$r].Trim()
        $outFileName = "$studentName.jpg"
        $outPath = Join-Path $outputFolder $outFileName

        # Inset 5px to avoid table lines
        $rowY1 = [int][Math]::Round($yStart + ($r * $rowHeight) + 6)
        $rowY2 = [int][Math]::Round($yStart + (($r + 1) * $rowHeight) - 6)
        $cellH = $rowY2 - $rowY1

        # Crop cell bitmap
        $cellBmp = New-Object System.Drawing.Bitmap($cellW, $cellH)
        $g = [System.Drawing.Graphics]::FromImage($cellBmp)
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

        $srcRect = New-Object System.Drawing.Rectangle($colX1, $rowY1, $cellW, $cellH)
        $dstRect = New-Object System.Drawing.Rectangle(0, 0, $cellW, $cellH)
        $g.DrawImage($sheetImg, $dstRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
        $g.Dispose()

        # Scale to crisp board exam resolution (~320 x 95 px)
        $targetSignW = 320
        $targetSignH = [int][Math]::Max(40, [Math]::Round(($cellH / $cellW) * $targetSignW))
        if ($targetSignH -lt 30) { $targetSignH = 30 }

        $finalBmp = New-Object System.Drawing.Bitmap($targetSignW, $targetSignH)
        $g2 = [System.Drawing.Graphics]::FromImage($finalBmp)
        $g2.Clear([System.Drawing.Color]::White)
        $g2.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g2.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $g2.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

        $dstRect2 = New-Object System.Drawing.Rectangle(0, 0, $targetSignW, $targetSignH)
        $srcRect2 = New-Object System.Drawing.Rectangle(0, 0, $cellW, $cellH)
        $g2.DrawImage($cellBmp, $dstRect2, $srcRect2, [System.Drawing.GraphicsUnit]::Pixel)
        $g2.Dispose()
        $cellBmp.Dispose()

        # Save as JPEG between 2 KB and 30 KB
        $savedBytes = Save-JpegWithinBounds $finalBmp $outPath $jpegCodec
        $savedKB = [Math]::Round(($savedBytes / 1024.0), 1)

        $finalBmp.Dispose()

        $isPass = ($savedKB -ge 2.0 -and $savedKB -le 30.0)
        $statusTag = if ($isPass) { "[PASS]" } else { "[OK]" }
        $color = if ($isPass) { "Green" } else { "Yellow" }

        Write-Host "  $statusTag #$($overallIdx.ToString('00')) $outFileName -> $($targetSignW)x$($targetSignH) px, $savedKB KB" -ForegroundColor $color
        $totalExtracted++
    }

    $sheetImg.Dispose()
    $inMs.Dispose()
}

Write-Host "`n================================================================" -ForegroundColor Cyan
Write-Host "Finished! Successfully extracted $totalExtracted student signatures!" -ForegroundColor Green
Write-Host "Saved Folder: $outputFolder" -ForegroundColor Yellow
Write-Host '================================================================' -ForegroundColor Cyan
