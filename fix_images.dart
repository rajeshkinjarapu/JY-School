import 'dart:io';

void main() {
  final libDir = Directory('flutter_mobile/lib');
  final widgetsDir = Directory('flutter_mobile/lib/widgets');
  if (!widgetsDir.existsSync()) {
    widgetsDir.createSync(recursive: true);
  }
  
  final customImgFile = File('flutter_mobile/lib/widgets/custom_network_image.dart');
  final customImgCode = '''
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
''';
  
  customImgFile.writeAsStringSync(customImgCode);
  
  int modifiedCount = 0;
  
  void walkDir(Directory dir) {
    for (var entity in dir.listSync(recursive: false)) {
      if (entity is Directory) {
        walkDir(entity);
      } else if (entity is File) {
        if (!entity.path.endsWith('.dart') || entity.path.endsWith('custom_network_image.dart')) {
          continue;
        }
        
        String content = entity.readAsStringSync();
        if (content.contains('Image.network')) {
          // Determine relative path for import
          int libIndex = entity.path.split(Platform.pathSeparator).indexOf('lib');
          int depth = entity.path.split(Platform.pathSeparator).length - libIndex - 2;
          String prefix = depth > 0 ? '../' * depth : '';
          String importStmt = "import '${prefix}widgets/custom_network_image.dart';";
          
          if (!content.contains('custom_network_image.dart')) {
            int importIndex = content.indexOf('import ');
            if (importIndex != -1) {
              int endOfLine = content.indexOf('\\n', importIndex);
              content = content.substring(0, endOfLine + 1) + importStmt + '\\n' + content.substring(endOfLine + 1);
            } else {
              content = importStmt + '\\n' + content;
            }
          }
          
          content = content.replaceAll('Image.network(', 'CustomNetworkImage(');
          entity.writeAsStringSync(content);
          modifiedCount++;
        }
      }
    }
  }
  
  walkDir(libDir);
  print('Modified files: \$modifiedCount');
}
