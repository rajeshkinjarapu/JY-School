import os
import re

def main():
    lib_dir = os.path.join('flutter_mobile', 'lib')
    
    # 1. Create the CustomNetworkImage widget
    widgets_dir = os.path.join(lib_dir, 'widgets')
    os.makedirs(widgets_dir, exist_ok=True)
    custom_img_path = os.path.join(widgets_dir, 'custom_network_image.dart')
    
    custom_img_code = """import 'dart:convert';
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
        final base64String = imageUrl.split(',').last;
        final Uint8List bytes = base64Decode(base64String.replaceAll('\\n', ''));
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
"""
    with open(custom_img_path, 'w', encoding='utf-8') as f:
        f.write(custom_img_code)

    # 2. Find and replace Image.network -> CustomNetworkImage
    modified_files = []
    for root, dirs, files in os.walk(lib_dir):
        for file in files:
            if not file.endswith('.dart'):
                continue
            if file == 'custom_network_image.dart':
                continue
                
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                
            if 'Image.network' in content:
                # Add import if missing
                import_stmt = "import 'package:jy_school/widgets/custom_network_image.dart';"
                
                # Determine relative import path based on depth
                rel_path = '../' * (filepath.count(os.sep) - lib_dir.count(os.sep) - 1) + 'widgets/custom_network_image.dart'
                if filepath.count(os.sep) - lib_dir.count(os.sep) == 1:
                    rel_path = 'widgets/custom_network_image.dart'
                    
                import_stmt = f"import '{rel_path}';"
                
                if 'custom_network_image.dart' not in content:
                    # insert after first import
                    first_import = content.find('import ')
                    if first_import != -1:
                        end_of_line = content.find('\\n', first_import)
                        content = content[:end_of_line+1] + import_stmt + '\\n' + content[end_of_line+1:]
                    else:
                        content = import_stmt + '\\n' + content
                        
                # Replace Image.network with CustomNetworkImage
                content = content.replace('Image.network(', 'CustomNetworkImage(')
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                modified_files.append(filepath)
                
    print(f"Successfully modified {len(modified_files)} files to use CustomNetworkImage.")

if __name__ == '__main__':
    main()
