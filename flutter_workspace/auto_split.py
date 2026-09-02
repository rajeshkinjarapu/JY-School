import os
import shutil

workspace = r"c:\Users\SRI\Desktop\JY School\JY-School-main\flutter_workspace"
core_lib = os.path.join(workspace, "packages", "core", "lib")
admin_lib = os.path.join(workspace, "packages", "admin_feature", "lib")
student_lib = os.path.join(workspace, "packages", "student_feature", "lib")
teacher_lib = os.path.join(workspace, "packages", "teacher_feature", "lib")

admin_files = [
    "screens/gate_pass_screen.dart",
    "screens/gate_pass_view_screen.dart",
    "screens/admin_app_installs_screen.dart",
    "screens/admin_attendance_dashboard.dart",
    "screens/admin_payment_settings_screen.dart",
    "screens/admin_pending_fees_screen.dart",
    "screens/id_cards/id_card_preview_screen.dart"
]

student_files = [
    "widgets/latex_preview_widget.dart",
    "screens/question_bank/saved_papers_screen.dart",
    "screens/question_bank/question_paper_generator_screen.dart",
    "screens/question_bank/navodaya_paper_generator_screen.dart",
    "screens/question_bank/exam_paper_generator_screen.dart",
    "screens/question_bank/mcq_paper_generator_screen.dart"
]

def move_file(src_rel, target_lib, pkg_name):
    src = os.path.join(core_lib, src_rel)
    dst = os.path.join(target_lib, src_rel)
    if os.path.exists(src):
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.move(src, dst)
        print(f"Moved {src_rel} to {pkg_name}")

for f in admin_files: move_file(f, admin_lib, "admin_feature")
for f in student_files: move_file(f, student_lib, "student_feature")

print("Files moved successfully. Now updating imports is required.")
