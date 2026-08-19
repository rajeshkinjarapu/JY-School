import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';
import 'login_screen.dart';
import 'attendance_screen.dart';
import 'fees_screen.dart';
import 'finance_screen.dart';
import 'exams_screen.dart';
import 'timetable_screen.dart';
import 'teacher_attendance_screen.dart';
import 'teacher_homework_screen.dart';
import 'teacher_marks_screen.dart';
import 'profile_screen.dart';
import '../widgets/app_drawer.dart';
import 'students_screen.dart';
import 'teachers_screen.dart';
import 'classes_screen.dart';
import 'subjects_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  Map<String, dynamic>? _user;
  bool _isLoading = true;

  // Student metrics
  double _attendanceRate = 0.0;
  double _feeDues = 0.0;

  // Teacher metrics
  int _teacherTotalStudents = 0;
  int _teacherTodayPresent = 0;
  int _teacherTodayAbsent = 0;
  double _teacherAttendancePercent = 0.0;

  // Admin metrics
  int _adminTotalStudents = 0;
  int _adminTotalTeachers = 0;
  int _adminTotalClasses = 0;
  double _adminFeeCollected = 0.0;
  double _adminFeePending = 0.0;

  List<dynamic> _adminAttendanceTrend = [];
  List<dynamic> _adminMonthlyFeeCollection = [];
  List<dynamic> _recentAnnouncements = [];

  @override
  void initState() {
    super.initState();
    _loadDashboardData();
  }

  Future<void> _loadDashboardData() async {
    final prefs = await SharedPreferences.getInstance();
    final userString = prefs.getString('user');
    
    if (userString != null) {
      if (mounted) {
        setState(() {
          _user = jsonDecode(userString);
        });
      }
      await _fetchLiveStats();
    } else {
      final res = await ApiService.getMe();
      if (res['success'] && mounted) {
        setState(() {
          _user = res['data'];
        });
        await _fetchLiveStats();
      } else if (mounted) {
        _handleLogout();
      }
    }
  }

  Future<void> _fetchLiveStats() async {
    final userRole = _user?['role'] ?? 'STUDENT';
    
    if (userRole == 'STUDENT') {
      final studentId = _user?['student']?['id'];
      if (studentId == null) {
        if (mounted) setState(() => _isLoading = false);
        return;
      }

      final results = await Future.wait([
        ApiService.getAttendance(studentId),
        ApiService.getFeeStatus(studentId),
      ]);

      double rate = 100.0;
      double dues = 0.0;

      if (results[0]['success']) {
        final List<dynamic> records = results[0]['data'] ?? [];
        if (records.isNotEmpty) {
          int present = 0;
          int late = 0;
          for (var r in records) {
            final status = r['status']?.toString().toUpperCase();
            if (status == 'PRESENT') present++;
            if (status == 'LATE') late++;
          }
          rate = ((present + late) / records.length) * 100;
        }
      }

      if (results[1]['success']) {
        final List<dynamic> feeList = results[1]['data'] ?? [];
        for (var item in feeList) {
          dues += double.tryParse(item['amountDue']?.toString() ?? '0') ?? 0.0;
        }
      }

      if (mounted) {
        setState(() {
          _attendanceRate = rate;
          _feeDues = dues;
          _isLoading = false;
        });
      }
    } else if (userRole == 'TEACHER') {
      // Fetch teacher statistics
      final result = await ApiService.getAttendanceStats();
      if (mounted) {
        if (result['success']) {
          final data = result['data'] ?? {};
          final attendanceSummary = data['todayAttendanceSummary'] ?? {};
          setState(() {
            _teacherTotalStudents = int.tryParse(data['totalStudents']?.toString() ?? '0') ?? 0;
            _teacherTodayPresent = int.tryParse(attendanceSummary['present']?.toString() ?? '0') ?? 0;
            _teacherTodayAbsent = int.tryParse(attendanceSummary['absent']?.toString() ?? '0') ?? 0;
            _teacherAttendancePercent = double.tryParse(attendanceSummary['rate']?.toString() ?? '0.0') ?? 0.0;
            _adminAttendanceTrend = data['attendanceTrend'] ?? [];
            _isLoading = false;
          });
        } else {
          setState(() {
            _isLoading = false;
          });
        }
      }
    } else {
      // Admin statistics
      final result = await ApiService.getAdminDashboardStats();
      if (mounted) {
        if (result['success']) {
          final stats = result['data'] ?? {};
          setState(() {
            _adminTotalStudents = int.tryParse(stats['totalStudents']?.toString() ?? '0') ?? 0;
            _adminTotalTeachers = int.tryParse(stats['totalTeachers']?.toString() ?? '0') ?? 0;
            _adminTotalClasses = int.tryParse(stats['totalClasses']?.toString() ?? '24') ?? 24; 
            _adminFeeCollected = double.tryParse(stats['totalRevenue']?.toString() ?? '0') ?? 0.0;
            _adminFeePending = 0.0; // API doesn't return pending directly in admin dashboard
            _adminAttendanceTrend = stats['attendanceTrend'] ?? [];
            _adminMonthlyFeeCollection = stats['monthlyFeeCollection'] ?? [];
            _recentAnnouncements = stats['recentAnnouncements'] ?? [];
            _isLoading = false;
          });
        } else {
          setState(() => _isLoading = false);
        }
      }
    }
  }

  Future<void> _handleLogout() async {
    await ApiService.logout();
    if (mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (context) => const LoginScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final userName = _user?['name'] ?? 'User';
    final userRole = _user?['role'] ?? 'STUDENT';
    
    // Role-based metadata
    String metaLabel = 'N/A';
    String metaValue = 'N/A';
    
    if (userRole == 'STUDENT') {
      metaLabel = 'Class';
      metaValue = _user?['student']?['class'] != null
          ? '${_user?['student']?['class']?['name']}-${_user?['student']?['class']?['section']}'
          : 'N/A';
    } else if (userRole == 'TEACHER') {
      metaLabel = 'Subject';
      metaValue = _user?['teacher']?['specialization'] ?? 'Staff';
    } else {
      metaLabel = 'Access';
      metaValue = 'Administrator';
    }

    return Scaffold(
      key: _scaffoldKey,
      drawer: AppDrawer(currentRoute: 'dashboard'),
      backgroundColor: const Color(0xFFF4F7FE),
      appBar: AppBar(
        iconTheme: const IconThemeData(color: Colors.white),
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF2E2A66), Color(0xFF222854)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.menu, color: Colors.white),
          onPressed: () => _scaffoldKey.currentState?.openDrawer(),
        ),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.15),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.home_outlined, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 12),
            Text(
              'Dashboard',
              style: GoogleFonts.outfit(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_none, color: Colors.white),
            onPressed: () {}, 
          ),
        ],
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(
                color: Color(0xFF6366F1),
              ),
            )
          : SafeArea(
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildProfileCard(userName, userRole, metaLabel, metaValue),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (userRole == 'SUPER_ADMIN' || userRole == 'ADMIN') ...[
                            _buildAdminCombinedGrid(),
                            if (_adminAttendanceTrend.isNotEmpty) _buildAttendanceChart(),
                            if (_recentAnnouncements.isNotEmpty) _buildAnnouncements(),
                          ] else ...[
                            _buildQuickMetrics(userRole),
                            const SizedBox(height: 32),
                            Text(
                              userRole == 'STUDENT' ? 'Academic Portal' : 'Teacher Toolkit',
                              style: GoogleFonts.outfit(
                                fontSize: 22,
                                fontWeight: FontWeight.bold,
                                color: const Color(0xFF1E293B),
                              ),
                            ),
                            const SizedBox(height: 16),
                            _buildMenuGrid(userRole),
                          ],
                          const SizedBox(height: 30),
                        ],
                      ),
                    )
                  ],
                ),
              ),
            ),
    );
  }

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'GOOD MORNING';
    if (hour < 17) return 'GOOD AFTERNOON';
    return 'GOOD EVENING';
  }

  String _getFormattedDate() {
    final now = DateTime.now();
    final weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    final months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return '${weekdays[now.weekday - 1]}, ${now.day} ${months[now.month - 1]} ${now.year}';
  }

  Widget _buildProfileCard(String name, String role, String metaLabel, String metaValue) {
    return Container(
      margin: const EdgeInsets.fromLTRB(20, 16, 20, 16),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF4C4296), Color(0xFF2E2A66)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF2E2A66).withOpacity(0.3),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ]
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: const BoxDecoration(
                        color: Color(0xFF8B5CF6),
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      _getGreeting(),
                      style: GoogleFonts.poppins(
                        color: const Color(0xFFC4B5FD),
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.5,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  name,
                  style: GoogleFonts.outfit(
                    color: Colors.white,
                    fontSize: 26,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${role.replaceAll('_', ' ')} • JY School',
                  style: GoogleFonts.poppins(
                    color: Colors.white70,
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.white.withOpacity(0.3)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.calendar_today_outlined, color: Colors.white70, size: 14),
                      const SizedBox(width: 8),
                      Text(
                        _getFormattedDate(),
                        style: GoogleFonts.poppins(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                )
              ],
            ),
          ),
          const SizedBox(width: 16),
          GestureDetector(
            onTap: () {
              Navigator.push(context, MaterialPageRoute(builder: (context) => const ProfileScreen()));
            },
            child: Container(
              width: 90,
              height: 90,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.1),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.white.withOpacity(0.2), width: 2),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(18),
                child: _user?['photoUrl']?.isNotEmpty == true
                    ? Image.network(
                        _user!['photoUrl'],
                        fit: BoxFit.cover,
                        errorBuilder: (c, e, s) => const Icon(Icons.person, color: Colors.white, size: 40),
                      )
                    : Center(
                        child: Text(
                          name.isNotEmpty ? name[0].toUpperCase() : 'U',
                          style: GoogleFonts.outfit(color: Colors.white, fontSize: 36, fontWeight: FontWeight.bold),
                        ),
                      ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickMetrics(String role) {
    if (role == 'STUDENT') {
      return Row(
        children: [
          Expanded(
            child: Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Icon(Icons.analytics_rounded, color: Color(0xFF34D399), size: 24),
                      Text(
                        '${_attendanceRate.toStringAsFixed(0)}%',
                        style: GoogleFonts.outfit(
                          color: const Color(0xFF34D399),
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Attendance',
                    style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 13),
                  ),
                  Text(
                    _attendanceRate >= 75 ? 'Excellent' : 'Needs Care',
                    style: GoogleFonts.poppins(
                      color: _attendanceRate >= 75 ? const Color(0xFF475569) : const Color(0xFFF87171),
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Icon(Icons.account_balance_wallet_rounded, color: Color(0xFFF87171), size: 24),
                      Text(
                        '₹${_feeDues.toStringAsFixed(0)}',
                        style: GoogleFonts.outfit(
                          color: const Color(0xFFF87171),
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Fee Dues',
                    style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 13),
                  ),
                  Text(
                    _feeDues == 0 ? 'No Dues' : 'Pay Pending',
                    style: GoogleFonts.poppins(
                      color: _feeDues == 0 ? const Color(0xFF475569) : const Color(0xFFFBBF24),
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      );
    } else if (role == 'TEACHER') {
      // Teacher statistics view
      return Row(
        children: [
          Expanded(
            child: Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Icon(Icons.people_alt_rounded, color: Color(0xFF818CF8), size: 24),
                      Text(
                        '$_teacherTotalStudents',
                        style: GoogleFonts.outfit(
                          color: const Color(0xFF818CF8),
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Enrolled Students',
                    style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 12),
                  ),
                  Text(
                    'Active classes',
                    style: GoogleFonts.poppins(
                      color: const Color(0xFF475569),
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Icon(Icons.fact_check_rounded, color: Color(0xFF34D399), size: 24),
                      Text(
                        '${_teacherAttendancePercent.toStringAsFixed(0)}%',
                        style: GoogleFonts.outfit(
                          color: const Color(0xFF34D399),
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Today Attendance',
                    style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 12),
                  ),
                  Text(
                    'P: $_teacherTodayPresent / A: $_teacherTodayAbsent',
                    style: GoogleFonts.poppins(
                      color: const Color(0xFF475569),
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      );
    } else {
      // Fallback if needed, but not used by admin anymore
      return const SizedBox();
    }
  }

  String _formatIndianCurrency(double amount) {
    String amtStr = amount.toStringAsFixed(0);
    if (amtStr.length <= 3) return amtStr;
    String lastThree = amtStr.substring(amtStr.length - 3);
    String otherNumbers = amtStr.substring(0, amtStr.length - 3);
    if (otherNumbers != '') {
      lastThree = ',' + lastThree;
    }
    String res = otherNumbers.replaceAllMapped(RegExp(r".{1,2}(?=(.{2})+(?!.))"), (Match m) => "${m[0]},") + lastThree;
    return res;
  }

  Widget _buildAdminCombinedGrid() {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      crossAxisSpacing: 10,
      mainAxisSpacing: 10,
      childAspectRatio: 1.55,
      children: [
        _buildUniversalCard(
          subtitle: 'TOTAL STUDENTS',
          title: '$_adminTotalStudents',
          bottomText: 'Enrolled this year',
          icon: Icons.people_outline,
          gradientStart: const Color(0xFF7B66FF),
          gradientEnd: const Color(0xFF9080FF),
          onTap: () {
            Navigator.push(context, MaterialPageRoute(builder: (context) => const StudentsScreen()));
          },
        ),
        _buildUniversalCard(
          subtitle: 'TOTAL TEACHERS',
          title: '$_adminTotalTeachers',
          bottomText: 'On staff',
          icon: Icons.school_outlined,
          gradientStart: const Color(0xFF2DD38A),
          gradientEnd: const Color(0xFF4EEB9E),
          onTap: () {
            Navigator.push(context, MaterialPageRoute(builder: (context) => const TeachersScreen()));
          },
        ),
        _buildUniversalCard(
          subtitle: 'TOTAL CLASSES',
          title: '$_adminTotalClasses',
          bottomText: 'Active sections',
          icon: Icons.domain,
          gradientStart: const Color(0xFFFBB117),
          gradientEnd: const Color(0xFFFFC648),
          onTap: () {
            Navigator.push(context, MaterialPageRoute(builder: (context) => const ClassesScreen()));
          },
        ),
        _buildUniversalCard(
          subtitle: 'TOTAL REVENUE',
          title: '₹${_formatIndianCurrency(_adminFeeCollected)}',
          bottomText: 'Fees collected',
          icon: Icons.account_balance_wallet_outlined,
          gradientStart: const Color(0xFFFF4E6A),
          gradientEnd: const Color(0xFFFF7286),
          onTap: () {
            Navigator.push(context, MaterialPageRoute(builder: (context) => const FeesScreen()));
          },
        ),
        _buildUniversalCard(
          subtitle: 'COLLECT PAYMENT',
          title: 'Fees',
          bottomText: 'Process new fees',
          icon: Icons.payment_outlined,
          gradientStart: const Color(0xFF9E7AFF),
          gradientEnd: const Color(0xFFB193FF),
          onTap: () {
            Navigator.push(context, MaterialPageRoute(builder: (context) => const FeesScreen()));
          },
        ),
        _buildUniversalCard(
          subtitle: 'RESULTS',
          title: 'Exams',
          bottomText: 'View exam scores',
          icon: Icons.description_outlined,
          gradientStart: const Color(0xFF2DBDFD),
          gradientEnd: const Color(0xFF55CBFF),
          onTap: () {
            Navigator.push(context, MaterialPageRoute(builder: (context) => const ExamsScreen()));
          },
        ),
        _buildUniversalCard(
          subtitle: 'FEE DETAILS',
          title: 'Student Fees',
          bottomText: 'Student balances & dues',
          icon: Icons.receipt_long_outlined,
          gradientStart: const Color(0xFFFF56A5),
          gradientEnd: const Color(0xFFFF7DBA),
          onTap: () {
            Navigator.push(context, MaterialPageRoute(builder: (context) => const FeesScreen()));
          },
        ),
        _buildUniversalCard(
          subtitle: 'PROGRESS CARDS',
          title: 'Reports',
          bottomText: 'Generate & View',
          icon: Icons.workspace_premium_outlined,
          gradientStart: const Color(0xFF27B484),
          gradientEnd: const Color(0xFF45CA9E),
          onTap: () {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Reports module coming soon!'),
                backgroundColor: Color(0xFF6366F1),
              )
            );
          },
        ),
      ],
    );
  }

  Widget _buildUniversalCard({
    required String title,
    required String subtitle,
    required String bottomText,
    required IconData icon,
    required Color gradientStart,
    required Color gradientEnd,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [gradientStart, gradientEnd],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: gradientStart.withOpacity(0.3),
              blurRadius: 8,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.3),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(icon, color: Colors.white, size: 18),
                ),
                Container(
                  padding: const EdgeInsets.all(3),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.3),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.arrow_outward, color: Colors.white, size: 12),
                ),
              ],
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  subtitle,
                  style: GoogleFonts.outfit(
                    color: Colors.white,
                    fontSize: 9,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.5,
                  ),
                ),
                Text(
                  title,
                  style: GoogleFonts.outfit(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
            Row(
              children: [
                Container(
                  width: 4,
                  height: 4,
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    bottomText,
                    style: GoogleFonts.poppins(
                      color: Colors.white,
                      fontSize: 9,
                      fontWeight: FontWeight.w500,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMenuGrid(String role) {
    if (role == 'STUDENT') {
      return GridView.count(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        crossAxisCount: 2,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
        childAspectRatio: 1.3,
        children: [
          _buildNavigationCard(
            icon: Icons.calendar_month_rounded,
            color: const Color(0xFF6366F1),
            title: 'Attendance',
            subtitle: 'Daily check-in logs',
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const AttendanceScreen()),
              );
            },
          ),
          _buildNavigationCard(
            icon: Icons.currency_rupee_rounded,
            color: const Color(0xFF10B981),
            title: 'Fees',
            subtitle: 'Dues & invoices',
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const FeesScreen()),
              );
            },
          ),
          _buildNavigationCard(
            icon: Icons.quiz_rounded,
            color: const Color(0xFFF59E0B),
            title: 'Exams',
            subtitle: 'Grades & Admit Cards',
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const ExamsScreen()),
              );
            },
          ),
          _buildNavigationCard(
            icon: Icons.schedule_rounded,
            color: const Color(0xFFEF4444),
            title: 'Timetable',
            subtitle: 'Your weekly classes',
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const TimetableScreen()),
              );
            },
          ),
        ],
      );
    } else if (role == 'TEACHER') {
      // Teacher grid dashboard options
      return GridView.count(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        crossAxisCount: 2,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
        childAspectRatio: 1.3,
        children: [
          _buildNavigationCard(
            icon: Icons.how_to_reg_rounded,
            color: const Color(0xFF10B981),
            title: 'Mark Attendance',
            subtitle: 'Mark student logs',
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const TeacherAttendanceScreen()),
              );
            },
          ),
          _buildNavigationCard(
            icon: Icons.edit_note_rounded,
            color: const Color(0xFF6366F1),
            title: 'Post Homework',
            subtitle: 'Assign homework tasks',
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const TeacherHomeworkScreen()),
              );
            },
          ),
          _buildNavigationCard(
            icon: Icons.grade_rounded,
            color: const Color(0xFFF59E0B),
            title: 'Enter Marks',
            subtitle: 'Record test grades',
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const TeacherMarksScreen()),
              );
            },
          ),
          _buildNavigationCard(
            icon: Icons.schedule_rounded,
            color: const Color(0xFFEF4444),
            title: 'My Timetable',
            subtitle: 'Weekly class schedule',
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const TimetableScreen()),
              );
            },
          ),
        ],
      );
    } else {
      // Admin grid dashboard options
      return GridView.count(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        crossAxisCount: 2,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
        childAspectRatio: 1.3,
        children: [
          _buildAdminActionCard(
            title: 'Fees',
            subtitle: 'COLLECT PAYMENT',
            bottomText: 'Process new fees',
            icon: Icons.payment_outlined,
            gradientStart: const Color(0xFF9E7AFF),
            gradientEnd: const Color(0xFFB193FF),
            onTap: () {
              Navigator.push(context, MaterialPageRoute(builder: (context) => const FinanceScreen()));
            },
          ),
          _buildAdminActionCard(
            title: 'Exams',
            subtitle: 'RESULTS',
            bottomText: 'View exam scores',
            icon: Icons.description_outlined,
            gradientStart: const Color(0xFF2DBDFD),
            gradientEnd: const Color(0xFF55CBFF),
            onTap: () {
              Navigator.push(context, MaterialPageRoute(builder: (context) => const ExamsScreen()));
            },
          ),
          _buildAdminActionCard(
            title: 'Student Fees',
            subtitle: 'FEE DETAILS',
            bottomText: 'Student balances & dues',
            icon: Icons.receipt_long_outlined,
            gradientStart: const Color(0xFFFF56A5),
            gradientEnd: const Color(0xFFFF7DBA),
            onTap: () {
              Navigator.push(context, MaterialPageRoute(builder: (context) => const FinanceScreen()));
            },
          ),
          _buildAdminActionCard(
            title: 'Reports',
            subtitle: 'PROGRESS CARDS',
            bottomText: 'Generate & View',
            icon: Icons.workspace_premium_outlined,
            gradientStart: const Color(0xFF27B484),
            gradientEnd: const Color(0xFF45CA9E),
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Reports module coming soon!'),
                  backgroundColor: Color(0xFF6366F1),
                )
              );
            },
          ),
        ],
      );
    }
  }

  Widget _buildAdminActionCard({
    required String title,
    required String subtitle,
    required String bottomText,
    required IconData icon,
    required Color gradientStart,
    required Color gradientEnd,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [gradientStart, gradientEnd],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: gradientStart.withOpacity(0.3),
              blurRadius: 8,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(icon, color: const Color(0xFF64748B), size: 24),
                ),
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.arrow_outward, color: const Color(0xFF64748B), size: 16),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              subtitle,
              style: GoogleFonts.outfit(
                color: const Color(0xFF1E293B),
                fontSize: 11,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.5,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              title,
              style: GoogleFonts.outfit(
                color: const Color(0xFF1E293B),
                fontSize: 26,
                fontWeight: FontWeight.bold,
              ),
            ),
            const Spacer(),
            Row(
              children: [
                Container(
                  width: 4,
                  height: 4,
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 6),
                Text(
                  bottomText,
                  style: GoogleFonts.poppins(
                    color: const Color(0xFF1E293B).withOpacity(0.9),
                    fontSize: 10,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
  Widget _buildNavigationCard({
    required IconData icon,
    required Color color,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              color.withOpacity(0.8),
              color,
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: color.withOpacity(0.3),
              blurRadius: 8,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(icon, color: const Color(0xFF64748B), size: 24),
                ),
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.arrow_outward, color: const Color(0xFF64748B), size: 16),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              subtitle.toUpperCase(),
              style: GoogleFonts.outfit(
                color: const Color(0xFF1E293B),
                fontSize: 11,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.5,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              title,
              style: GoogleFonts.outfit(
                color: const Color(0xFF1E293B),
                fontSize: 22,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }
}


