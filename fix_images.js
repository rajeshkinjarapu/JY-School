const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

const libDir = path.join('flutter_mobile', 'lib');
const widgetsDir = path.join(libDir, 'widgets');
if (!fs.existsSync(widgetsDir)) fs.mkdirSync(widgetsDir, { recursive: true });
const customImgPath = path.join(widgetsDir, 'custom_network_image.dart');

const customImgCode = `import 'dart:convert';
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
        final base64String = imageUrl.split(',').last.replaceAll(RegExp(r'\\s+'), '');
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
`;

fs.writeFileSync(customImgPath, customImgCode, 'utf8');

let modifiedCount = 0;
walkDir(libDir, function(filePath) {
    if (!filePath.endsWith('.dart') || filePath.endsWith('custom_network_image.dart')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('Image.network')) {
        // Find relative path for import
        let depth = filePath.split(path.sep).length - libDir.split(path.sep).length - 1;
        let prefix = depth > 0 ? '../'.repeat(depth) : '';
        let importStmt = \`import '\${prefix}widgets/custom_network_image.dart';\`;
        
        if (!content.includes('custom_network_image.dart')) {
            let importIndex = content.indexOf('import ');
            if (importIndex !== -1) {
                let endOfLine = content.indexOf('\\n', importIndex);
                content = content.substring(0, endOfLine + 1) + importStmt + '\\n' + content.substring(endOfLine + 1);
            } else {
                content = importStmt + '\\n' + content;
            }
        }
        
        content = content.replace(/Image\\.network\\(/g, 'CustomNetworkImage(');
        fs.writeFileSync(filePath, content, 'utf8');
        modifiedCount++;
    }
});

console.log('Modified files:', modifiedCount);
