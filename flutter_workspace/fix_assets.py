import os
import shutil

workspace = r"c:\Users\SRI\Desktop\JY School\JY-School-main\flutter_workspace"
core_assets = os.path.join(workspace, "packages", "core", "assets")
apps = ["teacher_app", "admin_app", "student_app", "universal_app"]

assets_yaml = """
flutter:
  uses-material-design: true
  assets:
    - assets/images/
    - assets/images/admin_icons/
    - assets/images/student_icons/
    - assets/images/teacher_icons/
    - assets/illustrations/
"""

for app in apps:
    app_dir = os.path.join(workspace, "apps", app)
    if not os.path.exists(app_dir): continue
    
    # Copy assets folder
    dest_assets = os.path.join(app_dir, "assets")
    if os.path.exists(dest_assets):
        shutil.rmtree(dest_assets)
    shutil.copytree(core_assets, dest_assets)
    print(f"Copied assets to {app}")
    
    # Update pubspec.yaml
    pubspec = os.path.join(app_dir, "pubspec.yaml")
    if os.path.exists(pubspec):
        with open(pubspec, 'r') as f:
            content = f.read()
        
        if 'assets:' not in content:
            # Replace 'uses-material-design: true' with the full assets block
            if 'uses-material-design: true' in content:
                content = content.replace('uses-material-design: true', assets_yaml.strip())
            else:
                content += "\n" + assets_yaml
            
            with open(pubspec, 'w') as f:
                f.write(content)
            print(f"Updated pubspec.yaml for {app}")
