import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';
import '../screens/login_screen.dart';
import '../screens/dashboard_screen.dart';
import '../screens/attendance_screen.dart';
import '../screens/fees_screen.dart';
import '../screens/finance_screen.dart';
import '../screens/exams_screen.dart';
import '../screens/timetable_screen.dart';
import '../screens/homework_screen.dart';
import '../screens/teacher_attendance_screen.dart';
import '../screens/teacher_homework_screen.dart';
import '../screens/teacher_marks_screen.dart';
import '../screens/profile_screen.dart';
import '../screens/leave_screen.dart';
import '../screens/transport_screen.dart';
import '../screens/events_screen.dart';
import '../screens/messages_screen.dart';
import '../screens/gate_pass_screen.dart';
import '../screens/salary_screen.dart';
import '../screens/slip_test_screen.dart';
import '../screens/notifications_screen.dart';
import '../screens/study_materials_screen.dart';
import '../screens/students_screen.dart';
import '../screens/teachers_screen.dart';
import '../screens/classes_screen.dart';
import '../screens/subjects_screen.dart';
import '../screens/settings_screen.dart';
import '../screens/announcements_screen.dart';
import '../screens/reports_screen.dart';
import '../screens/hr_salary_screen.dart';
import '../screens/office_tools_screen.dart';
import '../screens/question_bank_screen.dart';
import '../screens/answer_key_screen.dart';
import '../screens/settings_screen.dart';
import '../screens/teacher_profile_screen.dart';
import '../screens/student_profile_screen.dart';
import '../screens/admin_attendance_dashboard.dart';
import '../screens/examination_dashboard_screen.dart';

class AppDrawer extends StatefulWidget {
  final String currentRoute;
  const AppDrawer({super.key, required this.currentRoute});

  @override
  State<AppDrawer> createState() => _AppDrawerState();
}

class _AppDrawerState extends State<AppDrawer> {
  Map<String, dynamic>? _user;

  @override
  void initState() {
    super.initState();
    _loadUser();
  }

  Future<void> _loadUser() async {
    final prefs = await SharedPreferences.getInstance();
    final userString = prefs.getString('user');
    if (userString != null && mounted) {
      setState(() {
        _user = jsonDecode(userString);
      });
    }
  }

  Future<void> _handleLogout() async {
    await ApiService.logout();
    if (mounted) {
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (context) => const LoginScreen()),
        (route) => false,
      );
    }
  }

  void _navigateTo(Widget screen, String routeName) {
    Navigator.of(context).pop(); // Close drawer
    if (widget.currentRoute == routeName) return; // Already on this screen

    if (routeName == 'dashboard') {
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (context) => screen),
        (route) => false,
      );
    } else {
      Navigator.of(context).push(
        MaterialPageRoute(builder: (context) => screen),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final name = _user?['name'] ?? 'User';
    final role = _user?['role'] ?? 'SUPER_ADMIN'; // Default to admin for testing the new UI

    // A premium dark indigo sidebar color palette matching screenshot 1
    const Color sidebarBg = Color(0xFF2E2A66);
    const Color activeBg = Color(0xFF3B3580);
    const Color textInactive = Color(0xFF9EA3CB);

    return Drawer(
      backgroundColor: sidebarBg,
      elevation: 0,
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Header Logo Area
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              child: Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: Text('JY', style: GoogleFonts.outfit(color: const Color(0xFF2E2A66), fontWeight: FontWeight.bold)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    'JY School',
                    style: GoogleFonts.outfit(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const Spacer(),
                  IconButton(
                    icon: const Icon(Icons.close, color: textInactive, size: 20),
                    onPressed: () => Navigator.of(context).pop(),
                  )
                ],
              ),
            ),
            
            // Menu Items List
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                children: [
                  _buildDrawerItem(
                    icon: Icons.grid_view_rounded,
                    title: 'Dashboard',
                    routeName: 'dashboard',
                    isActive: widget.currentRoute == 'dashboard',
                    onTap: () => _navigateTo(const DashboardScreen(), 'dashboard'),
                  ),
                  
                  if (role == 'SUPER_ADMIN' || role == 'ADMIN') ...[
                    _buildDrawerItem(
                      icon: Icons.people_outline_rounded,
                      title: 'Students',
                      routeName: 'students',
                      isActive: widget.currentRoute == 'students',
                      onTap: () => _navigateTo(const StudentsScreen(), 'students'),
                    ),
                    _buildDrawerItem(
                      icon: Icons.school_outlined,
                      title: 'Teachers',
                      routeName: 'teachers',
                      isActive: widget.currentRoute == 'teachers',
                      onTap: () => _navigateTo(const TeachersScreen(), 'teachers'),
                    ),
                    _buildDrawerItem(
                      icon: Icons.domain_rounded,
                      title: 'Classes',
                      routeName: 'classes',
                      isActive: widget.currentRoute == 'classes',
                      onTap: () => _navigateTo(const ClassesScreen(), 'classes'),
                    ),
                    _buildDrawerItem(
                      icon: Icons.menu_book_rounded,
                      title: 'Subjects',
                      routeName: 'subjects',
                      isActive: widget.currentRoute == 'subjects',
                      onTap: () => _navigateTo(const SubjectsScreen(), 'subjects'),
                    ),
                    _buildDrawerItem(
                      icon: Icons.how_to_reg_rounded,
                      title: 'Attendance',
                      routeName: 'attendance_admin',
                      isActive: widget.currentRoute == 'attendance_admin',
                      onTap: () => _navigateTo(const AdminAttendanceDashboardScreen(), 'attendance_admin'),
                    ),
                    _buildDrawerItem(
                      icon: Icons.description_outlined,
                      title: 'Examination',
                      routeName: 'exams',
                      isActive: widget.currentRoute == 'exams',
                      onTap: () => _navigateTo(const ExaminationDashboardScreen(), 'exams'),
                    ),
                    _buildDrawerItem(
                      icon: Icons.calendar_today_outlined,
                      title: 'Timetable',
                      routeName: 'timetable',
                      isActive: widget.currentRoute == 'timetable',
                      onTap: () => _navigateTo(const TimetableScreen(), 'timetable'),
                    ),
                    _buildDrawerItem(
                      icon: Icons.location_on_outlined,
                      title: 'Gate Pass',
                      routeName: 'gatepass',
                      isActive: widget.currentRoute == 'gatepass',
                      onTap: () => _navigateTo(const GatePassScreen(), 'gatepass'),
                    ),
                    _buildDrawerItem(
                      icon: Icons.person_off_outlined,
                      title: 'Leave',
                      routeName: 'leave',
                      isActive: widget.currentRoute == 'leave',
                      onTap: () => _navigateTo(const LeaveScreen(), 'leave'),
                    ),
                    _buildDrawerItem(
                      icon: Icons.account_balance_wallet_outlined,
                      title: 'Finance',
                      routeName: 'fees',
                      isActive: widget.currentRoute == 'fees',
                      onTap: () => _navigateTo(const FinanceScreen(), 'fees'),
                    ),
                    _buildDrawerItem(
                      icon: Icons.campaign_outlined,
                      title: 'Announcements',
                      routeName: 'announcements',
                      isActive: widget.currentRoute == 'announcements',
                      onTap: () => _navigateTo(const AnnouncementsScreen(), 'announcements'),
                    ),
                    _buildDrawerItem(
                      icon: Icons.message_outlined,
                      title: 'Messages',
                      routeName: 'messages',
                      isActive: widget.currentRoute == 'messages',
                      onTap: () => _navigateTo(const MessagesScreen(), 'messages'),
                    ),
                    _buildDrawerItem(
                      icon: Icons.bar_chart_outlined,
                      title: 'Reports',
                      routeName: 'reports',
                      isActive: widget.currentRoute == 'reports',
                      onTap: () => _navigateTo(const ReportsScreen(), 'reports'),
                    ),
                    _buildDrawerItem(
                      icon: Icons.monetization_on_outlined,
                      title: 'HR Salary',
                      routeName: 'hr_salary',
                      isActive: widget.currentRoute == 'hr_salary',
                      onTap: () => _navigateTo(const HrSalaryScreen(), 'hr_salary'),
                    ),
                    _buildDrawerItem(
                      icon: Icons.co_present_outlined,
                      title: 'Staff Attendance',
                      routeName: 'staff_attendance',
                      isActive: widget.currentRoute == 'staff_attendance',
                      onTap: () => _navigateTo(const TeacherAttendanceScreen(), 'staff_attendance'),
                    ),
                    _buildDrawerItem(
                      icon: Icons.menu_book_outlined,
                      title: 'Homework',
                      routeName: 'homework',
                      isActive: widget.currentRoute == 'homework',
                      onTap: () => _navigateTo(const HomeworkScreen(), 'homework'),
                    ),
                    if (role == 'SUPER_ADMIN') ...[
                      _buildDrawerItem(
                        icon: Icons.build_circle_outlined,
                        title: 'Office Tools',
                        routeName: 'office_tools',
                        isActive: widget.currentRoute == 'office_tools',
                        onTap: () => _navigateTo(const OfficeToolsScreen(), 'office_tools'),
                      ),
                      _buildDrawerItem(
                        icon: Icons.library_books_outlined,
                        title: 'Question Bank',
                        routeName: 'question_bank',
                        isActive: widget.currentRoute == 'question_bank',
                        onTap: () => _navigateTo(const QuestionBankScreen(), 'question_bank'),
                      ),
                    ],
                    _buildDrawerItem(
                      icon: Icons.directions_bus_outlined,
                      title: 'Transport',
                      routeName: 'transport',
                      isActive: widget.currentRoute == 'transport',
                      onTap: () => _navigateTo(const TransportScreen(), 'transport'),
                    ),
                    _buildDrawerItem(
                      icon: Icons.settings_outlined,
                      title: 'Settings',
                      routeName: 'settings',
                      isActive: widget.currentRoute == 'settings',
                      onTap: () => _navigateTo(const SettingsScreen(), 'settings'),
                    ),
                  ] else if (role == 'TEACHER') ...[
                    _buildDrawerItem(
                      icon: Icons.people_outline_rounded,
                      title: 'Total Students',
                      routeName: 'students',
                      isActive: widget.currentRoute == 'students',
                      onTap: () => _navigateTo(const StudentsScreen(), 'students'),
                    ),
                    _buildDrawerItem(
                      icon: Icons.how_to_reg_rounded,
                      title: 'Attendance',
                      routeName: 'attendance',
                      isActive: widget.currentRoute == 'attendance',
                      onTap: () => _navigateTo(const TeacherAttendanceScreen(), 'attendance'),
                    ),
                    _buildDrawerItem(
                      icon: Icons.key_outlined,
                      title: 'Answer Key',
                      routeName: 'answer_key',
                      isActive: widget.currentRoute == 'answer_key',
                      onTap: () => _navigateTo(const AnswerKeyScreen(), 'answer_key'),
                    ),
                    _buildDrawerItem(
                      icon: Icons.menu_book_outlined,
                      title: 'Homework',
                      routeName: 'homework',
                      isActive: widget.currentRoute == 'homework',
                      onTap: () => _navigateTo(const TeacherHomeworkScreen(), 'homework'),
                    ),
                    _buildDrawerItem(
                      icon: Icons.description_outlined,
                      title: 'Examination',
                      routeName: 'exams',
                      isActive: widget.currentRoute == 'exams',
                      onTap: () => _navigateTo(const ExaminationDashboardScreen(), 'exams'),
                    ),
                    _buildDrawerItem(
                      icon: Icons.calendar_today_outlined,
                      title: 'Timetable',
                      routeName: 'timetable',
                      isActive: widget.currentRoute == 'timetable',
                      onTap: () => _navigateTo(const TimetableScreen(), 'timetable'),
                    ),
                    _buildDrawerItem(
                      icon: Icons.person_off_outlined,
                      title: 'Leave',
                      routeName: 'leave',
                      isActive: widget.currentRoute == 'leave',
                      onTap: () => _navigateTo(const LeaveScreen(), 'leave'),
                    ),
                    _buildDrawerItem(
                      icon: Icons.account_balance_wallet_outlined,
                      title: 'My Salary',
                      routeName: 'my_salary',
                      isActive: widget.currentRoute == 'my_salary',
                      onTap: () => _navigateTo(const SalaryScreen(), 'my_salary'),
                    ),
                    _buildDrawerItem(
                      icon: Icons.campaign_outlined,
                      title: 'Announcements',
                      routeName: 'announcements',
                      isActive: widget.currentRoute == 'announcements',
                      onTap: () => _navigateTo(const AnnouncementsScreen(), 'announcements'),
                    ),
                    _buildDrawerItem(
                      icon: Icons.message_outlined,
                      title: 'Messages',
                      routeName: 'messages',
                      isActive: widget.currentRoute == 'messages',
                      onTap: () => _navigateTo(const MessagesScreen(), 'messages'),
                    ),
                  ] else if (role == 'STUDENT') ...[
                    _buildDrawerItem(
                      icon: Icons.grading_outlined,
                      title: 'My Grades',
                      routeName: 'my_grades',
                      isActive: widget.currentRoute == 'my_grades',
                      onTap: () => _navigateTo(const ExamsScreen(), 'my_grades'),
                    ),
                    _buildDrawerItem(
                      icon: Icons.calendar_month_outlined,
                      title: 'Attendance',
                      routeName: 'attendance',
                      isActive: widget.currentRoute == 'attendance',
                      onTap: () => _navigateTo(const AttendanceScreen(), 'attendance'),
                    ),
                    _buildDrawerItem(
                      icon: Icons.calendar_today_outlined,
                      title: 'Timetable',
                      routeName: 'timetable',
                      isActive: widget.currentRoute == 'timetable',
                      onTap: () => _navigateTo(const TimetableScreen(), 'timetable'),
                    ),
                    _buildDrawerItem(
                      icon: Icons.menu_book_outlined,
                      title: 'Homework',
                      routeName: 'homework',
                      isActive: widget.currentRoute == 'homework',
                      onTap: () => _navigateTo(const HomeworkScreen(), 'homework'),
                    ),
                    _buildDrawerItem(
                      icon: Icons.currency_rupee_outlined,
                      title: 'My Fees',
                      routeName: 'fees',
                      isActive: widget.currentRoute == 'fees',
                      onTap: () => _navigateTo(const FeesScreen(), 'fees'),
                    ),
                    _buildDrawerItem(
                      icon: Icons.campaign_outlined,
                      title: 'Announcements',
                      routeName: 'announcements',
                      isActive: widget.currentRoute == 'announcements',
                      onTap: () => _navigateTo(const AnnouncementsScreen(), 'announcements'),
                    ),
                    _buildDrawerItem(
                      icon: Icons.message_outlined,
                      title: 'Messages',
                      routeName: 'messages',
                      isActive: widget.currentRoute == 'messages',
                      onTap: () => _navigateTo(const MessagesScreen(), 'messages'),
                    ),
                  ] else if (role == 'ACCOUNTANT') ...[
                    _buildDrawerItem(
                      icon: Icons.account_balance_wallet_outlined,
                      title: 'Finance',
                      routeName: 'fees',
                      isActive: widget.currentRoute == 'fees',
                      onTap: () => _navigateTo(const FinanceScreen(), 'fees'),
                    ),
                    _buildDrawerItem(
                      icon: Icons.campaign_outlined,
                      title: 'Announcements',
                      routeName: 'announcements',
                      isActive: widget.currentRoute == 'announcements',
                      onTap: () => _navigateTo(const AnnouncementsScreen(), 'announcements'),
                    ),
                    _buildDrawerItem(
                      icon: Icons.message_outlined,
                      title: 'Messages',
                      routeName: 'messages',
                      isActive: widget.currentRoute == 'messages',
                      onTap: () => _navigateTo(const MessagesScreen(), 'messages'),
                    ),
                  ],
                ],
              ),
            ),
            
            // Bottom Install App Button (As per screenshot)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              child: ElevatedButton.icon(
                onPressed: () {},
                icon: const Icon(Icons.install_mobile, color: Colors.white, size: 18),
                label: Text('Install App', style: GoogleFonts.outfit(color: Colors.white)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF6366F1), // Indigo
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  elevation: 0,
                ),
              ),
            ),

            // Profile Footer
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
              child: GestureDetector(
                onTap: () => _navigateTo(const ProfileScreen(), 'profile'),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF221E52),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          image: DecorationImage(
                            image: NetworkImage('https://ui-avatars.com/api/?name=${Uri.encodeComponent(name)}&background=8B5CF6&color=fff'),
                            fit: BoxFit.cover,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              name,
                              style: GoogleFonts.outfit(
                                color: Colors.white,
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            Text(
                              role.replaceAll('_', ' '),
                              style: GoogleFonts.poppins(
                                color: textInactive,
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.logout_rounded, color: textInactive, size: 20),
                        onPressed: _handleLogout,
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                      )
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDrawerItem({
    required IconData icon,
    required String title,
    required String routeName,
    required bool isActive,
    required VoidCallback onTap,
  }) {
    const Color textInactive = Color(0xFF9EA3CB);
    const Color activeBg = Color(0xFF3B3580); // Lighter purple for active

    return Container(
      margin: const EdgeInsets.only(bottom: 4),
      decoration: BoxDecoration(
        color: isActive ? activeBg : Colors.transparent,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isActive ? Colors.white.withOpacity(0.1) : Colors.transparent,
        ),
      ),
      child: Material(
        color: Colors.transparent,
        child: ListTile(
          onTap: onTap,
          dense: true,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          leading: Icon(
            icon,
            color: isActive ? Colors.white : textInactive,
            size: 22,
          ),
          title: Text(
            title,
            style: GoogleFonts.outfit(
              color: isActive ? Colors.white : textInactive,
              fontWeight: isActive ? FontWeight.w500 : FontWeight.w400,
              fontSize: 15,
            ),
          ),
          trailing: isActive 
              ? Container(
                  width: 6,
                  height: 6,
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                  ),
                )
              : null,
        ),
      ),
    );
  }
}

