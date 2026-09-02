import os

workspace = r"c:\Users\SRI\Desktop\JY School\JY-School-main\flutter_workspace"
apps = ["teacher_app", "admin_app", "student_app", "universal_app"]

assets_yaml = """
  assets:
    - assets/images/
    - assets/images/admin_icons/
    - assets/images/student_icons/
    - assets/images/teacher_icons/
    - assets/illustrations/
"""

for app in apps:
    pubspec = os.path.join(workspace, "apps", app, "pubspec.yaml")
    if os.path.exists(pubspec):
        with open(pubspec, 'r') as f:
            content = f.read()
        
        # If it doesn't have the uncommented assets block
        if '\n  assets:' not in content:
            # We will just append it under flutter:
            # Let's replace 'uses-material-design: true'
            if 'uses-material-design: true' in content:
                content = content.replace('uses-material-design: true', 'uses-material-design: true\n' + assets_yaml)
                with open(pubspec, 'w') as f:
                    f.write(content)
                print(f"Force updated pubspec.yaml for {app}")
