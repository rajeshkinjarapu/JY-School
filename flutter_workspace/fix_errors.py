import os

workspace = r"c:\Users\SRI\Desktop\JY School\JY-School-main\flutter_workspace"
core_lib = os.path.join(workspace, "packages", "core", "lib")

files = [
    "screens/dashboard_screen.dart",
    "screens/finance_screen.dart",
    "widgets/app_drawer.dart",
    "screens/question_bank/question_bank_dashboard_screen.dart",
    "screens/id_cards/id_card_students_screen.dart"
]

def fix_file(filepath):
    path = os.path.join(core_lib, filepath)
    if not os.path.exists(path): return
    with open(path, 'r', encoding='utf-8') as f: lines = f.readlines()
    with open(path, 'w', encoding='utf-8') as f:
        for line in lines:
            # Fix Drawer error from previous script
            if 'Required named parameter \'onTap\' must be provided' in line:
                pass # just a note
                
            if 'gate_pass_screen.dart' in line and '//' in line:
                f.write(line)
                continue
                
            # If the line was previously commented because of GatePassScreen
            if 'GatePassScreen' in line and line.strip().startswith('//'):
                # We need to replace it with a dummy onTap if it was an onTap
                if 'onTap:' in line:
                    f.write("onTap: () {}, // Temporarily disabled\n")
                    continue
            
            # Check for imports
            if any(x in line for x in [
                "import 'admin_payment_settings_screen.dart';",
                "import 'admin_app_installs_screen.dart';",
                "import 'admin_pending_fees_screen.dart';",
                "import '../screens/admin_attendance_dashboard.dart';",
                "import 'question_paper_generator_screen.dart';",
                "import 'exam_paper_generator_screen.dart';",
                "import 'mcq_paper_generator_screen.dart';",
                "import 'navodaya_paper_generator_screen.dart';",
                "import 'saved_papers_screen.dart';",
                "import 'id_card_preview_screen.dart';"
            ]):
                f.write("// " + line)
                continue

            # Check for UI elements
            if any(x in line for x in [
                "AdminAppInstallsScreen",
                "AdminPendingFeesScreen",
                "AdminPaymentSettingsScreen",
                "AdminAttendanceDashboardScreen",
                "QuestionPaperGeneratorScreen",
                "SavedPapersScreen",
                "NavodayaPaperGeneratorScreen",
                "McqPaperGeneratorScreen",
                "IdCardPreviewScreen"
            ]):
                if 'nextScreen =' in line:
                    f.write("              nextScreen = Scaffold(body: Center(child: Text('Coming Soon')));\n")
                elif 'onTap:' in line:
                    f.write("onTap: () {}, // Temp disabled\n")
                elif 'builder:' in line:
                    f.write(line.replace(line, line.split("builder:")[0] + "builder: (_) => const Scaffold(body: Center(child: Text('Coming Soon'))),"))
                elif "'screen':" in line:
                    f.write(line.replace(line, line.split("'screen':")[0] + "'screen': const Scaffold(body: Center(child: Text('Coming Soon')))},"))
                else:
                    f.write("// " + line)
                continue
            
            f.write(line)

for filepath in files:
    fix_file(filepath)

print("Errors fixed.")
