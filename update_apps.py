import os
import re
import yaml

apps = {
    'admin_app': 'JY Admin',
    'student_app': 'JY Student',
    'teacher_app': 'JY Teacher',
    'universal_app': 'JY School'
}

base_dir = r'c:\Users\SRI\Desktop\JY School\JY-School-main\flutter_workspace\apps'

for app, name in apps.items():
    app_dir = os.path.join(base_dir, app)
    
    # 1. Update AndroidManifest.xml
    manifest_path = os.path.join(app_dir, 'android', 'app', 'src', 'main', 'AndroidManifest.xml')
    if os.path.exists(manifest_path):
        with open(manifest_path, 'r', encoding='utf-8') as f:
            content = f.read()
        content = re.sub(r'android:label="[^"]*"', f'android:label="{name}"', content)
        with open(manifest_path, 'w', encoding='utf-8') as f:
            f.write(content)
            
    # 2. Update Info.plist
    plist_path = os.path.join(app_dir, 'ios', 'Runner', 'Info.plist')
    if os.path.exists(plist_path):
        with open(plist_path, 'r', encoding='utf-8') as f:
            content = f.read()
        content = re.sub(r'<key>CFBundleName</key>\s*<string>[^<]*</string>', f'<key>CFBundleName</key>\\n\\t<string>{name}</string>', content)
        content = re.sub(r'<key>CFBundleDisplayName</key>\s*<string>[^<]*</string>', f'<key>CFBundleDisplayName</key>\\n\\t<string>{name}</string>', content)
        with open(plist_path, 'w', encoding='utf-8') as f:
            f.write(content)

    # 3. Add flutter_launcher_icons to pubspec.yaml
    pubspec_path = os.path.join(app_dir, 'pubspec.yaml')
    if os.path.exists(pubspec_path):
        with open(pubspec_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        if 'flutter_launcher_icons' not in content:
            # append it
            content += '''
flutter_launcher_icons:
  android: true
  ios: true
  image_path: "../../packages/core/assets/images/logo.png"
'''
            content = content.replace('dev_dependencies:\\n  flutter_test:\\n    sdk: flutter\\n', 'dev_dependencies:\\n  flutter_test:\\n    sdk: flutter\\n  flutter_launcher_icons: ^0.13.1\\n')
            with open(pubspec_path, 'w', encoding='utf-8') as f:
                f.write(content)
