import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'exams_screen.dart';
import 'marks_upload_screen.dart';
import 'question_papers_screen.dart';
import 'admit_card_screen.dart';
import 'results_screen.dart';
import 'progress_card_screen.dart';
import 'exam_status_screen.dart';
import 'slip_test_screen.dart';
import '../services/api_service.dart';
import '../widgets/app_drawer.dart';

class ExaminationDashboardScreen extends StatelessWidget {
  const ExaminationDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      drawer: const AppDrawer(currentRoute: 'exams'),
      appBar: AppBar(
        title: Text(
          'Examination Dashboard',
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 18),
        ),
        backgroundColor: const Color(0xFF0F172A),
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              GridView.count(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisCount: 2,
                crossAxisSpacing: 14,
                mainAxisSpacing: 14,
                childAspectRatio: 1.4, // Increased to decrease box height
                children: [
                  _buildDashboardCard(
                    context,
                    title: 'Exams List',
                    subtitle: 'Manage exams',
                    icon: Icons.assignment_outlined,
                    gradient: const LinearGradient(colors: [Color(0xFF4F46E5), Color(0xFF7C3AED)]), // Indigo to Purple
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const ExamsScreen())),
                  ),
                  _buildDashboardCard(
                    context,
                    title: 'Admit Card',
                    subtitle: 'Hall tickets',
                    icon: Icons.badge_outlined,
                    gradient: const LinearGradient(colors: [Color(0xFF0EA5E9), Color(0xFF2563EB)]), // Sky to Blue
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const AdmitCardScreen())),
                  ),
                  _buildDashboardCard(
                    context,
                    title: 'Question Papers',
                    subtitle: 'Upload & manage',
                    icon: Icons.library_books_outlined,
                    gradient: const LinearGradient(colors: [Color(0xFFF59E0B), Color(0xFFEA580C)]), // Amber to Orange
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const QuestionPapersScreen())),
                  ),
                  _buildDashboardCard(
                    context,
                    title: 'Marks Upload',
                    subtitle: 'Enter student marks',
                    icon: Icons.edit_note_rounded,
                    gradient: const LinearGradient(colors: [Color(0xFF10B981), Color(0xFF059669)]), // Emerald
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const MarksUploadScreen())),
                  ),
                  _buildDashboardCard(
                    context,
                    title: 'Results',
                    subtitle: 'Grade sheets',
                    icon: Icons.workspace_premium_outlined,
                    gradient: const LinearGradient(colors: [Color(0xFF8B5CF6), Color(0xFF6D28D9)]), // Violet
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const ResultsScreen())),
                  ),
                  _buildDashboardCard(
                    context,
                    title: 'Progress Card',
                    subtitle: 'Detailed progress',
                    icon: Icons.analytics_outlined,
                    gradient: const LinearGradient(colors: [Color(0xFFF43F5E), Color(0xFFE11D48)]), // Rose
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const ProgressCardScreen())),
                  ),
                  _buildDashboardCard(
                    context,
                    title: 'Slip Test Rank',
                    subtitle: 'Manual ranks',
                    icon: Icons.military_tech_outlined,
                    gradient: const LinearGradient(colors: [Color(0xFF06B6D4), Color(0xFF0284C7)]), // Cyan
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const SlipTestScreen())),
                  ),
                  _buildDashboardCard(
                    context,
                    title: 'Send Marks SMS',
                    subtitle: 'Notify parents',
                    icon: Icons.sms_outlined,
                    gradient: const LinearGradient(colors: [Color(0xFFEC4899), Color(0xFFBE185D)]), // Pink
                    onTap: () => _showSendSmsBottomSheet(context),
                  ),
                  _buildDashboardCard(
                    context,
                    title: 'Status Overview',
                    subtitle: 'Track progress',
                    icon: Icons.security_outlined,
                    gradient: const LinearGradient(colors: [Color(0xFFF97316), Color(0xFFC2410C)]), // Orange
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const ExamStatusScreen())),
                  ),
                  _buildDashboardCard(
                    context,
                    title: 'Settings',
                    subtitle: 'Configurations',
                    icon: Icons.settings_outlined,
                    gradient: const LinearGradient(colors: [Color(0xFF64748B), Color(0xFF475569)]), // Slate
                    onTap: () => _showPlaceholder(context, 'Settings'),
                  ),
                ],
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDashboardCard(
    BuildContext context, {
    required String title,
    required String subtitle,
    required IconData icon,
    required Gradient gradient,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        decoration: BoxDecoration(
          gradient: gradient,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: (gradient as LinearGradient).colors.first.withOpacity(0.4),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Stack(
          children: [
            // Decorative background icon
            Positioned(
              right: -15,
              bottom: -15,
              child: Icon(
                icon,
                size: 90,
                color: Colors.white.withOpacity(0.15),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 14.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.25),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(icon, color: Colors.white, size: 24),
                  ),
                  const Spacer(),
                  Text(
                    title,
                    style: GoogleFonts.outfit(
                      color: Colors.white,
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: GoogleFonts.poppins(
                      color: Colors.white.withOpacity(0.9),
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            // Optional subtle arrow icon
            Positioned(
              right: 12,
              top: 14,
              child: Icon(Icons.arrow_forward_ios, color: Colors.white.withOpacity(0.5), size: 14),
            ),
          ],
        ),
      ),
    );
  }

  void _showPlaceholder(BuildContext context, String moduleName) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$moduleName module is currently under development.', style: GoogleFonts.poppins()),
        backgroundColor: const Color(0xFF6366F1),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _showSendSmsBottomSheet(BuildContext context) async {
    // Show a beautifully designed bottom sheet to send SMS
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (BuildContext context) {
        return const _SendSmsBottomSheet();
      },
    );
  }
}

class _SendSmsBottomSheet extends StatefulWidget {
  const _SendSmsBottomSheet();

  @override
  State<_SendSmsBottomSheet> createState() => _SendSmsBottomSheetState();
}

class _SendSmsBottomSheetState extends State<_SendSmsBottomSheet> {
  bool _isLoading = false;
  List<dynamic> _exams = [];
  List<dynamic> _classes = [];
  String? _selectedExam;
  String? _selectedClass;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final eRes = await ApiService.getExams();
    final cRes = await ApiService.getClasses();
    if (mounted) {
      setState(() {
        _exams = eRes['success'] ? (eRes['data'] ?? []) : [];
        _classes = cRes['success'] ? (cRes['data'] ?? []) : [];
      });
    }
  }

  Future<void> _sendSms() async {
    if (_selectedExam == null || _selectedClass == null) return;
    setState(() => _isLoading = true);
    final res = await ApiService.sendMarksSMS(_selectedExam!, _selectedClass!, {});
    if (mounted) {
      setState(() => _isLoading = false);
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(res['success'] ? 'SMS Sent Successfully' : res['message'] ?? 'Failed to send SMS'),
        backgroundColor: res['success'] ? const Color(0xFF10B981) : const Color(0xFFEF4444),
      ));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.only(topLeft: Radius.circular(24), topRight: Radius.circular(24)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Send Marks SMS', style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
                IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
              ],
            ),
            const SizedBox(height: 16),
            Text('Select Exam', style: GoogleFonts.poppins(fontSize: 13, color: const Color(0xFF64748B))),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFFE2E8F0))),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  isExpanded: true,
                  value: _selectedExam,
                  hint: const Text('Select Exam'),
                  items: _exams.map((e) => DropdownMenuItem<String>(value: e['id'].toString(), child: Text(e['name'] ?? 'Unknown'))).toList(),
                  onChanged: (val) => setState(() => _selectedExam = val),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text('Select Class', style: GoogleFonts.poppins(fontSize: 13, color: const Color(0xFF64748B))),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFFE2E8F0))),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  isExpanded: true,
                  value: _selectedClass,
                  hint: const Text('Select Class'),
                  items: _classes.map((c) => DropdownMenuItem<String>(value: c['id'].toString(), child: Text('${c['name']} - ${c['section']}'))).toList(),
                  onChanged: (val) => setState(() => _selectedClass = val),
                ),
              ),
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: _isLoading || _selectedExam == null || _selectedClass == null ? null : _sendSms,
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF6366F1), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                child: _isLoading ? const CircularProgressIndicator(color: Colors.white) : Text('Send SMS', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}



