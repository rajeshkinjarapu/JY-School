$libDir = "flutter_mobile\lib"
$widgetsDir = "$libDir\widgets"
if (-Not (Test-Path -Path $widgetsDir)) {
    New-Item -ItemType Directory -Path $widgetsDir
}

$customImgPath = "$widgetsDir\custom_network_image.dart"
$customImgCode = @"
import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';

class CustomNetworkImage extends StatelessWidget {
  final String imageUrl;
  final BoxFit? fit;
  final Widget Function(BuildContext, Object, StackTrace?)? errorBuilder;
  final double? width;
  final double? height;
  final Map<String, String>? headers;

  const CustomNetworkImage(
    this.imageUrl, {
    super.key,
    this.fit,
    this.errorBuilder,
    this.width,
    this.height,
    this.headers,
  });

  @override
  Widget build(BuildContext context) {
    if (imageUrl.startsWith('data:image')) {
      try {
        final base64String = imageUrl.split(',').last.replaceAll(RegExp(r'\s+'), '');
        final Uint8List bytes = base64Decode(base64String);
        return Image.memory(
          bytes,
          fit: fit,
          width: width,
          height: height,
          errorBuilder: errorBuilder,
        );
      } catch (e) {
        if (errorBuilder != null) {
          return errorBuilder!(context, e, null);
        }
        return const Icon(Icons.broken_image);
      }
    }

    return Image.network(
      imageUrl,
      fit: fit,
      width: width,
      height: height,
      headers: headers,
      errorBuilder: errorBuilder,
    );
  }
}
"@

Set-Content -Path $customImgPath -Value $customImgCode -Encoding UTF8

$count = 0
$files = Get-ChildItem -Path $libDir -Filter *.dart -Recurse

foreach ($file in $files) {
    if ($file.Name -eq "custom_network_image.dart") { continue }
    
    $content = Get-Content -Path $file.FullName -Raw
    if ($content -match "Image.network") {
        # Determine relative path
        $relPath = $file.FullName.Replace((Resolve-Path $libDir).Path + "\", "")
        $depth = ($relPath -split "\\").Count - 1
        $prefix = ""
        for ($i = 0; $i -lt $depth; $i++) { $prefix += "../" }
        $importStmt = "import '${prefix}widgets/custom_network_image.dart';"
        
        if ($content -notmatch "custom_network_image.dart") {
            $importIndex = $content.IndexOf("import ")
            if ($importIndex -ne -1) {
                $endOfLine = $content.IndexOf("`n", $importIndex)
                $content = $content.Substring(0, $endOfLine + 1) + $importStmt + "`n" + $content.Substring($endOfLine + 1)
            } else {
                $content = $importStmt + "`n" + $content
            }
        }
        
        $content = $content -replace "Image.network\(", "CustomNetworkImage("
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8
        $count++
    }
}

Write-Output "Modified files: $count"
