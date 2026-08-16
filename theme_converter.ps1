$libPath = "flutter_mobile\lib"

# Get all .dart files
$files = Get-ChildItem -Path $libPath -Filter "*.dart" -Recurse -File

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName)
    $originalContent = $content

    # Backgrounds
    $content = $content -replace "Color\(0xFF0B0F19\)", "Color(0xFFF4F7FE)"
    $content = $content -replace "Color\(0xFF1E1B4B\)", "Color(0xFFF8FAFC)"
    $content = $content -replace "Color\(0xFF0F172A\)", "Color(0xFFE2E8F0)"

    # Opacities & Borders
    $content = $content -replace "Colors\.white\.withOpacity\(0\.0[2-4]\)", "Colors.white"
    $content = $content -replace "Colors\.white\.withOpacity\(0\.0[5-9]\)", "const Color(0xFFE2E8F0)"
    $content = $content -replace "Colors\.white\.withOpacity\(0\.1[0-9]?\)", "const Color(0xFFE2E8F0)"
    $content = $content -replace "Colors\.white\.withOpacity\(0\.2\)", "const Color(0xFFCBD5E1)"

    # Text Colors
    $content = $content -replace "Colors\.white70", "const Color(0xFF475569)"
    $content = $content -replace "Colors\.white60", "const Color(0xFF64748B)"
    $content = $content -replace "Colors\.white54", "const Color(0xFF64748B)"
    $content = $content -replace "Colors\.white38", "const Color(0xFF94A3B8)"
    $content = $content -replace "Colors\.white24", "const Color(0xFFCBD5E1)"
    $content = $content -replace "Colors\.white12", "const Color(0xFFE2E8F0)"

    # Primary Text (Requires regex lookahead/lookbehind equivalent, or just a simple group)
    $content = [regex]::Replace($content, "color:\s*Colors\.white([^a-zA-Z0-9_])", "color: const Color(0xFF1E293B)`$1")

    if ($content -ne $originalContent) {
        [System.IO.File]::WriteAllText($file.FullName, $content)
        Write-Host "Updated: $($file.FullName)"
    }
}

Write-Host "Theme conversion completed."
