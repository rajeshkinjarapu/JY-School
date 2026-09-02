import os
import re

workspace = r"c:\Users\SRI\Desktop\JY School\JY-School-main\flutter_workspace"

# 1. Update Core Pubspec
core_pubspec = os.path.join(workspace, "packages", "core", "pubspec.yaml")
with open(core_pubspec, 'r') as f: content = f.read()
content = re.sub(r'^\s*mobile_scanner:.*$\n', '', content, flags=re.MULTILINE)
content = re.sub(r'^\s*qr_flutter:.*$\n', '', content, flags=re.MULTILINE)
content = re.sub(r'^\s*flutter_tex:.*$\n', '', content, flags=re.MULTILINE)
with open(core_pubspec, 'w') as f: f.write(content)

# 2. Add dependencies to feature pubspecs
def add_dep(pubspec_path, dep_str):
    with open(pubspec_path, 'r') as f: content = f.read()
    if dep_str not in content:
        content = content.replace("dependencies:\n  flutter:\n    sdk: flutter\n", f"dependencies:\n  flutter:\n    sdk: flutter\n  {dep_str}\n")
        with open(pubspec_path, 'w') as f: f.write(content)

admin_pubspec = os.path.join(workspace, "packages", "admin_feature", "pubspec.yaml")
add_dep(admin_pubspec, "mobile_scanner: ^5.0.0\n  qr_flutter: ^4.1.0")

student_pubspec = os.path.join(workspace, "packages", "student_feature", "pubspec.yaml")
add_dep(student_pubspec, "flutter_tex: ^4.0.3+2")

# 3. Comment out broken imports in core
core_lib = os.path.join(workspace, "packages", "core", "lib")
files_to_fix = [
    "screens/dashboard_screen.dart",
    "screens/modules_screen.dart",
    "widgets/app_drawer.dart"
]

for rel_path in files_to_fix:
    path = os.path.join(core_lib, rel_path)
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f: lines = f.readlines()
        with open(path, 'w', encoding='utf-8') as f:
            for line in lines:
                if 'gate_pass_screen.dart' in line or 'question_paper_generator_screen.dart' in line or 'GatePassScreen' in line:
                    f.write('// ' + line)
                else:
                    f.write(line)

print("Pubspecs updated and broken imports commented out successfully.")
