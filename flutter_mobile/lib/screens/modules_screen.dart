import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../widgets/custom_network_image.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

import 'profile_screen.dart';
import 'students_screen.dart';
import 'teachers_screen.dart';
import 'classes_screen.dart';
import 'finance_screen.dart';
import 'student_fee_search_screen.dart';
import 'exams_screen.dart';
import 'progress_card_screen.dart';
import 'student_exams_dashboard_screen.dart';
import 'student_finance_dashboard_screen.dart';
import 'student_profile_screen.dart';
import 'homework_screen.dart';
import 'messages_screen.dart';
import 'announcements_screen.dart';
import 'attendance_screen.dart';
import 'transport_screen.dart';
import 'fee_reminder_search_screen.dart';
import 'leave_screen.dart';
import 'leave_dashboard_screen.dart';
import 'timetable_screen.dart';
import 'gate_pass_screen.dart';
import 'teacher_gate_pass_screen.dart';
import 'events_screen.dart';
import 'live_tracking_screen.dart';
import 'salary_screen.dart';
import 'admissions_list_screen.dart';
import 'admission_registration_screen.dart';
import 'student_address_collection_screen.dart';
import 'results_screen.dart';
import 'question_papers_screen.dart';
import 'answer_keys_screen.dart';
import 'marks_upload_screen.dart';
import 'subjects_screen.dart';
import 'fee_installment_report_screen.dart';
import 'transactions_screen.dart';
import 'admin_app_installs_screen.dart';

class ModulesScreen extends StatefulWidget {
  const ModulesScreen({super.key});

  @override
  State<ModulesScreen> createState() => _ModulesScreenState();
}

class _ModulesScreenState extends State<ModulesScreen> {
  String _userRole = '';
  Map<String, dynamic> _userMap = {};
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _initRole();
  }

  Future<void> _initRole() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      final userStr = prefs.getString('user');
      if (userStr != null) {
        _userMap = jsonDecode(userStr);
        _userRole = _userMap['role'] ?? '';
      }
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    
    final isTeacher = _userRole == 'TEACHER';
    final isStudent = _userRole == 'STUDENT';

    // A comprehensive list of modules for the More page
    final List<Map<String, dynamic>> adminModules = [
      if (!isTeacher) {'title': 'Students', 'icon': Icons.groups_rounded, 'assetIcon': 'app icons/my studens.png', 'color': const Color(0xFF4285F4), 'page': const StudentsScreen()},
      if (!isTeacher) {'title': 'Teachers', 'icon': Icons.person_pin_rounded, 'assetIcon': 'app icons/teachers.png', 'color': const Color(0xFFEA4335), 'page': const TeachersScreen()},
      if (!isTeacher) {'title': 'Classes', 'icon': Icons.school_rounded, 'assetIcon': 'app icons/classes.png', 'color': const Color(0xFF34A853), 'page': ClassesScreen()},
      {
        'title': 'Admissions',
        'icon': Icons.person_add_alt_1_rounded,
        'assetIcon': 'app icons/admissions.png',
        'color': const Color(0xFF4F46E5),
        'page': isTeacher ? const AdmissionRegistrationScreen() : const AdmissionsListScreen(),
      },
      if (!isTeacher) {'title': 'Fee Collection', 'icon': Icons.credit_card_rounded, 'assetIcon': 'app icons/collect fee.png', 'color': const Color(0xFFFBBC05), 'page': const StudentFeeSearchScreen()},
      if (!isTeacher) {'title': 'Installments', 'icon': Icons.receipt_long_rounded, 'assetIcon': 'app icons/installments.png', 'color': const Color(0xFF00ACC1), 'page': const FeeInstallmentReportScreen()},
      if (!isTeacher) {'title': 'Transactions', 'icon': Icons.sync_alt_rounded, 'assetIcon': 'app icons/transactions.png', 'color': const Color(0xFFFF7043), 'page': const TransactionsScreen()},
      {'title': 'Fee Reminder', 'icon': Icons.notifications_active_rounded, 'assetIcon': 'app icons/fee remainder.png', 'color': const Color(0xFFEAB308), 'page': const FeeReminderSearchScreen()},
      if (!isTeacher) {'title': 'Finance', 'icon': Icons.account_balance_wallet_rounded, 'assetIcon': 'app icons/my salary.png', 'color': const Color(0xFFF43F5E), 'page': const FinanceScreen()},
      {'title': 'Results', 'icon': Icons.fact_check_rounded, 'assetIcon': 'app icons/results.png', 'color': const Color(0xFF8E24AA), 'page': const ResultsScreen()},
      {'title': 'Progress Card', 'icon': Icons.emoji_events_rounded, 'assetIcon': 'app icons/progress card.png', 'color': const Color(0xFFF06292), 'page': const ProgressCardScreen()},
      {'title': 'Question Papers', 'icon': Icons.description_rounded, 'assetIcon': 'app icons/question papers.png', 'color': const Color(0xFFF59E0B), 'page': const QuestionPapersScreen()},
      {'title': 'Answer Keys', 'icon': Icons.vpn_key_rounded, 'assetIcon': 'app icons/answer key.png', 'color': const Color(0xFF10B981), 'page': const AnswerKeysScreen()},
      {'title': 'Marks Entry', 'icon': Icons.edit_note_rounded, 'assetIcon': 'app icons/marks entry.png', 'color': const Color(0xFFF97316), 'page': const MarksUploadScreen()},
      {'title': 'Attendance', 'icon': Icons.how_to_reg_rounded, 'assetIcon': 'app icons/mark attendance.png', 'color': const Color(0xFFD97706), 'page': const AttendanceScreen()},
      {'title': 'Home Work', 'icon': Icons.edit_document, 'assetIcon': 'app icons/home work.png', 'color': const Color(0xFFD79F17), 'page': const HomeworkScreen()},
      {'title': 'Subjects', 'icon': Icons.menu_book_rounded, 'assetIcon': 'app icons/subjects.png', 'color': const Color(0xFF7CB342), 'page': const SubjectsScreen()},
      {'title': 'Address Data', 'icon': Icons.location_on_rounded, 'assetIcon': 'app icons/address data.png', 'color': const Color(0xFF10B981), 'page': StudentAddressCollectionScreen()},
      {'title': 'Gate Pass', 'icon': Icons.exit_to_app_rounded, 'assetIcon': 'app icons/gate pass.png', 'color': const Color(0xFF8B5CF6), 'page': isTeacher ? const TeacherGatePassScreen() : const GatePassScreen()},
      {'title': 'Leave', 'icon': Icons.time_to_leave_rounded, 'assetIcon': 'app icons/leave apply.png', 'color': const Color(0xFFEF4444), 'page': isTeacher ? const LeaveDashboardScreen() : const LeaveScreen()},
      {'title': 'Timetable', 'icon': Icons.schedule_rounded, 'assetIcon': 'app icons/timetable.png', 'color': const Color(0xFFEA580C), 'page': const TimetableScreen()},
      if (!isTeacher) {'title': 'App Installs', 'icon': Icons.install_mobile_rounded, 'assetIcon': 'app icons/app installs.png', 'color': const Color(0xFF673AB7), 'page': const AdminAppInstallsScreen()},
      {'title': 'School Events', 'icon': Icons.festival_rounded, 'assetIcon': 'app icons/overview.png', 'color': const Color(0xFFD946EF), 'page': const EventsScreen()},
      {'title': 'Transport', 'icon': Icons.directions_bus_rounded, 'assetIcon': 'app icons/overview.png', 'color': const Color(0xFF6366F1), 'page': const TransportScreen()},
      {'title': 'My Salary', 'icon': Icons.monetization_on_rounded, 'assetIcon': 'app icons/my salary.png', 'color': const Color(0xFF10B981), 'page': const SalaryScreen()},
      {'title': 'Settings', 'icon': Icons.settings_rounded, 'assetIcon': 'app icons/settings.png', 'color': const Color(0xFF475569), 'page': const ProfileScreen()},
    ];

    final List<Map<String, dynamic>> studentModules = [
      {'title': 'Gate Pass', 'icon': Icons.exit_to_app_rounded, 'assetIcon': 'app icons/gate pass.png', 'color': const Color(0xFFEF4444), 'page': const GatePassScreen()},
      {'title': 'Apply Leave', 'icon': Icons.time_to_leave_rounded, 'assetIcon': 'app icons/leave apply.png', 'color': const Color(0xFFF97316), 'page': const LeaveScreen()},
      {'title': 'ID Card', 'icon': Icons.badge_rounded, 'color': const Color(0xFF3B82F6), 'page': null},
      {'title': 'Message Teacher', 'icon': Icons.chat_rounded, 'assetIcon': 'app icons/messaging.png', 'color': const Color(0xFF14B8A6), 'page': const MessagesScreen()},
      {'title': 'Exam Schedule', 'icon': Icons.event_note_rounded, 'assetIcon': 'app icons/results.png', 'color': const Color(0xFF0284C7), 'page': StudentExamsDashboardScreen(user: _userMap)},
      {'title': 'Timetable', 'icon': Icons.schedule_rounded, 'assetIcon': 'app icons/timetable.png', 'color': const Color(0xFFEA580C), 'page': const TimetableScreen()},
      {'title': 'Attendance', 'icon': Icons.how_to_reg_rounded, 'assetIcon': 'app icons/mark attendance.png', 'color': const Color(0xFF10B981), 'page': const AttendanceScreen()},
      {'title': 'Home Work', 'icon': Icons.edit_document, 'assetIcon': 'app icons/home work.png', 'color': const Color(0xFFEAB308), 'page': const HomeworkScreen()},
      {'title': 'Fee Details', 'icon': Icons.account_balance_wallet_rounded, 'assetIcon': 'app icons/fee remainder.png', 'color': const Color(0xFF8B5CF6), 'page': StudentFinanceDashboardScreen(user: _userMap)},
      {'title': 'School Events', 'icon': Icons.festival_rounded, 'assetIcon': 'app icons/overview.png', 'color': const Color(0xFFD946EF), 'page': const EventsScreen()},
      {'title': 'Transport Details', 'icon': Icons.directions_bus_rounded, 'assetIcon': 'app icons/overview.png', 'color': const Color(0xFF6366F1), 'page': const TransportScreen()},
      {'title': 'Bus Tracking', 'icon': Icons.location_on_rounded, 'color': const Color(0xFFF59E0B), 'page': const LiveTrackingScreen(routeData: {})},
      {'title': 'Online Classes', 'icon': Icons.video_camera_front_rounded, 'color': const Color(0xFF8B5CF6), 'page': null},
      {'title': 'Certificate Request', 'icon': Icons.workspace_premium_rounded, 'color': const Color(0xFFEAB308), 'page': null},
      {'title': 'Academic Calendar', 'icon': Icons.calendar_month_rounded, 'color': const Color(0xFF06B6D4), 'page': null},
      {'title': 'School Calendar', 'icon': Icons.date_range_rounded, 'color': const Color(0xFF10B981), 'page': null},
      {'title': 'Gallery', 'icon': Icons.photo_library_rounded, 'color': const Color(0xFFF43F5E), 'page': null},
      {'title': 'Lost & Found', 'icon': Icons.search_rounded, 'color': const Color(0xFF64748B), 'page': null},
      {'title': 'Feedback', 'icon': Icons.feedback_rounded, 'color': const Color(0xFF84CC16), 'page': null},
      {'title': 'Complaints / Grievance', 'icon': Icons.report_problem_rounded, 'color': const Color(0xFFDC2626), 'page': null},
      {'title': 'Quiz', 'icon': Icons.quiz_rounded, 'color': const Color(0xFF0EA5E9), 'page': null},
    ];

    final modules = isStudent ? studentModules : adminModules;

    return Scaffold(
      backgroundColor: const Color(0xFFF4F7FE),
      appBar: AppBar(
        title: Text(
          'All Modules',
          style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        iconTheme: const IconThemeData(color: Colors.white),
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF00114F), Color(0xFF000A30)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
        elevation: 0,
      ),
      body: GridView.builder(
        padding: EdgeInsets.fromLTRB(16.0, 16.0, 16.0, 16.0 + MediaQuery.of(context).padding.bottom + 20),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 3,
          crossAxisSpacing: 14.0,
          mainAxisSpacing: 14.0,
          childAspectRatio: 1.0,
        ),
        itemCount: modules.length,
        itemBuilder: (context, index) {
          final module = modules[index];
          return _buildModuleCard(
            context,
            module['title'],
            module['icon'],
            module['color'],
            module['page'],
            assetIcon: module['assetIcon'],
          );
        },
      ),
    );
  }

  Widget _buildModuleCard(BuildContext context, String title, IconData icon, Color color, Widget? page, {String? assetIcon}) {
    return GestureDetector(
      onTap: () {
        if (page != null) {
          Navigator.push(context, MaterialPageRoute(builder: (context) => page));
        } else {
           ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Module coming soon...')));
        }
      },
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: color.withOpacity(0.18),
              blurRadius: 12,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: assetIcon != null
              ? CustomNetworkImage(
                  ApiService.getAppIconUrl(assetIcon),
                  fit: BoxFit.cover,
                  width: double.infinity,
                  height: double.infinity,
                  errorBuilder: (c, e, s) => Container(
                    color: color.withOpacity(0.08),
                    padding: const EdgeInsets.all(6),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(icon, color: color, size: 32),
                        const SizedBox(height: 4),
                        FittedBox(
                          fit: BoxFit.scaleDown,
                          child: Text(
                            title,
                            textAlign: TextAlign.center,
                            style: GoogleFonts.poppins(
                              color: const Color(0xFF1E293B),
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              : Container(
                  color: color.withOpacity(0.08),
                  padding: const EdgeInsets.all(8),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(icon, color: color, size: 32),
                      const SizedBox(height: 6),
                      Text(
                        title,
                        textAlign: TextAlign.center,
                        style: GoogleFonts.poppins(
                          color: const Color(0xFF1E293B),
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
        ),
      ),
    );
  }
}
