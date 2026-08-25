import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

import 'students_screen.dart';
import 'teachers_screen.dart';
import 'classes_screen.dart';
import 'finance_screen.dart';
import 'student_fee_search_screen.dart';
import 'exams_screen.dart';
import 'progress_card_screen.dart';
import 'attendance_screen.dart';
import 'transport_screen.dart';
import 'fee_reminder_search_screen.dart';
import 'leave_screen.dart';
import 'leave_dashboard_screen.dart';
import 'timetable_screen.dart';

class ModulesScreen extends StatefulWidget {
  const ModulesScreen({super.key});

  @override
  State<ModulesScreen> createState() => _ModulesScreenState();
}

class _ModulesScreenState extends State<ModulesScreen> {
  String _userRole = '';
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
        _userRole = jsonDecode(userStr)['role'] ?? '';
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

    // A comprehensive list of modules for the More page
    final List<Map<String, dynamic>> modules = [
      {'title': 'Students', 'icon': Icons.groups_rounded, 'color': const Color(0xFF6366F1), 'page': const StudentsScreen()},
      {'title': 'Teachers', 'icon': Icons.school_rounded, 'color': const Color(0xFF10B981), 'page': const TeachersScreen()},
      {'title': 'Classes', 'icon': Icons.account_balance_rounded, 'color': const Color(0xFF0EA5E9), 'page': ClassesScreen()},
      if (!isTeacher) {'title': 'Finance', 'icon': Icons.account_balance_wallet_rounded, 'color': const Color(0xFFF43F5E), 'page': const FinanceScreen()},
      if (!isTeacher) {'title': 'Fee Collection', 'icon': Icons.credit_card_rounded, 'color': const Color(0xFF8B5CF6), 'page': const StudentFeeSearchScreen()},
      {'title': 'Fee Reminder', 'icon': Icons.notifications_active_rounded, 'color': const Color(0xFFEAB308), 'page': const FeeReminderSearchScreen()},
      {'title': 'Exams', 'icon': Icons.fact_check_rounded, 'color': const Color(0xFF0284C7), 'page': const ExamsScreen()},
      {'title': 'Reports', 'icon': Icons.emoji_events_rounded, 'color': const Color(0xFF059669), 'page': const ProgressCardScreen()},
      {'title': 'Attendance', 'icon': Icons.how_to_reg_rounded, 'color': const Color(0xFFD97706), 'page': const AttendanceScreen()},
      {'title': 'Leave', 'icon': Icons.time_to_leave_rounded, 'color': const Color(0xFFEF4444), 'page': isTeacher ? const LeaveDashboardScreen() : const LeaveScreen()},
      {'title': 'Timetable', 'icon': Icons.schedule_rounded, 'color': const Color(0xFFEA580C), 'page': const TimetableScreen()},
      {'title': 'Transport', 'icon': Icons.directions_bus_rounded, 'color': const Color(0xFFDB2777), 'page': const TransportScreen()},
      {'title': 'Settings', 'icon': Icons.settings_rounded, 'color': const Color(0xFF475569), 'page': null},
    ];

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
        padding: const EdgeInsets.all(16.0),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 3,
          crossAxisSpacing: 16.0,
          mainAxisSpacing: 16.0,
          childAspectRatio: 0.85,
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
          );
        },
      ),
    );
  }

  Widget _buildModuleCard(BuildContext context, String title, IconData icon, Color color, Widget? page) {
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
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: color.withOpacity(0.15),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withOpacity(0.15),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 28),
            ),
            const SizedBox(height: 12),
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
    );
  }
}
