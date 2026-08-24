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
import 'notifications_screen.dart';
import '../widgets/app_drawer.dart';
import 'students_screen.dart';
import 'teachers_screen.dart';
import 'classes_screen.dart';
import 'subjects_screen.dart';
import 'record_fee_payment_screen.dart';
import 'student_fee_search_screen.dart';
import 'progress_card_screen.dart';
import 'results_screen.dart';

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
  Map<String, dynamic> _adminGenderDistribution = {};
  List<dynamic> _adminEnrollmentByClass = [];
  List<dynamic> _adminRecentPayments = [];
  List<dynamic> _timetableToday = [];
  List<dynamic> _recentHomework = [];
  List<dynamic> _recentMarks = [];
  Map<String, dynamic> _feeStatusData = {};

  int _unreadNotifications = 0;

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

      // Also fetch dashboard specific student stats (today classes, recent marks)
      final dashboardRes = await ApiService.getStudentDashboardStats();
      if (dashboardRes['success']) {
          final sData = dashboardRes['data'] ?? {};
          if(mounted) {
             _timetableToday = sData['timetableToday'] ?? [];
             _recentMarks = sData['recentMarks'] ?? [];
             _feeStatusData = sData['feeStatus'] ?? {};
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
            _timetableToday = data['timetableToday'] ?? [];
            _recentHomework = data['recentHomework'] ?? [];
            _recentAnnouncements = data['announcements'] ?? [];
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
            _adminGenderDistribution = stats['genderDistribution'] ?? {};
            _adminEnrollmentByClass = stats['enrollmentByClass'] ?? [];
            _adminRecentPayments = stats['recentPayments'] ?? [];
            _isLoading = false;
          });
        } else {
          setState(() => _isLoading = false);
        }
      }
    }

    // Fetch live unread notifications count
    try {
      final notifRes = await ApiService.getNotifications();
      if (mounted && notifRes['success']) {
        final data = notifRes['data'];
        if (data is Map<String, dynamic>) {
          setState(() {
            _unreadNotifications = data['unreadCount'] ?? 0;
          });
        } else if (data is List) {
          int unread = data.where((n) => n['isRead'] != true).length;
          setState(() {
            _unreadNotifications = unread;
          });
        }
      }
    } catch (e) {
      // Ignore network errors for notifications
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
        toolbarHeight: 70,
        iconTheme: const IconThemeData(color: Colors.white),
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF00114F), Color(0xFF000A30)],
              begin: Alignment.centerLeft,
              end: Alignment.centerRight,
            ),
          ),
        ),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.menu_rounded, color: Colors.white, size: 30),
          onPressed: () => _scaffoldKey.currentState?.openDrawer(),
        ),
        titleSpacing: 0,
        title: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Image.asset('assets/images/logo.png', height: 48, fit: BoxFit.contain),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'SRI VENKATESWARA',
                  style: GoogleFonts.poppins(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w600, letterSpacing: 0.5),
                ),
                Text(
                  'JY SCHOOL',
                  style: GoogleFonts.outfit(color: const Color(0xFFFFD12A), fontSize: 22, fontWeight: FontWeight.w900, height: 1.1, letterSpacing: 0.5),
                ),
                Text(
                  'Narasannapeta',
                  style: GoogleFonts.poppins(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w500),
                ),
              ],
            ),
          ],
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 8.0),
            child: IconButton(
              icon: Stack(
                clipBehavior: Clip.none,
                children: [
                  const Icon(Icons.notifications_none_rounded, color: Colors.white, size: 28),
                  if (_unreadNotifications > 0)
                    Positioned(
                      right: -2,
                      top: -2,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFF3D5E),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          _unreadNotifications > 9 ? '9+' : _unreadNotifications.toString(),
                          style: GoogleFonts.poppins(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold, height: 1.1),
                        ),
                      ),
                    ),
                ],
              ),
              onPressed: () {
                Navigator.push(context, MaterialPageRoute(builder: (context) => const NotificationsScreen()));
              }, 
            ),
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
                      padding: const EdgeInsets.symmetric(horizontal: 12.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (userRole == 'SUPER_ADMIN' || userRole == 'ADMIN') ...[
                            _buildAdminCombinedGrid(),
                            const SizedBox(height: 24),
                            _buildRecentPayments(),
                            const SizedBox(height: 24),
                            _buildAnnouncements(),
                          ] else if (userRole == 'TEACHER') ...[
                            _buildQuickMetrics(userRole),
                            const SizedBox(height: 24),
                            _buildMenuGrid(userRole),
                            const SizedBox(height: 24),
                            _buildTimetableToday(),
                            const SizedBox(height: 24),
                            _buildRecentHomework(),
                            const SizedBox(height: 24),
                            _buildAnnouncements(),
                          ] else ...[
                            _buildQuickMetrics(userRole),
                            const SizedBox(height: 24),
                            _buildMenuGrid(userRole),
                            const SizedBox(height: 24),
                            _buildTimetableToday(),
                            const SizedBox(height: 24),
                            _buildRecentMarks(),
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
      margin: const EdgeInsets.fromLTRB(12, 12, 12, 12),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF4C4296), Color(0xFF2E2A66)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF2E2A66).withOpacity(0.3),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ]
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 7,
                      height: 7,
                      decoration: const BoxDecoration(
                        color: Color(0xFF8B5CF6),
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 7),
                    Text(
                      _getGreeting(),
                      style: GoogleFonts.poppins(
                        color: const Color(0xFFC4B5FD),
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.2,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.outfit(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  '${role.replaceAll('_', ' ')} • JY School',
                  style: GoogleFonts.poppins(
                    color: Colors.white70,
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          GestureDetector(
            onTap: () {
              Navigator.push(context, MaterialPageRoute(builder: (context) => const ProfileScreen()));
            },
            child: Container(
              width: 78,
              height: 78,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.1),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: Colors.white.withOpacity(0.25), width: 2),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: _user?['photoUrl'] != null && _user!['photoUrl'].toString().isNotEmpty
                    ? Image.network(
                        ApiService.getImageUrl(_user!['photoUrl'].toString()),
                        fit: BoxFit.cover,
                        headers: const {'ngrok-skip-browser-warning': '69420'},
                        errorBuilder: (c, e, s) => Icon(Icons.person, color: Colors.white.withOpacity(0.7), size: 42),
                      )
                    : Icon(Icons.person, color: Colors.white.withOpacity(0.7), size: 42),
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
    double screenHeight = MediaQuery.of(context).size.height;
    double screenWidth = MediaQuery.of(context).size.width;
    // Calculate aspect ratio so the 8 boxes (4 rows) fit perfectly on the screen
    // Estimated fixed height: AppBar(70) + HeaderCard(160) + BottomNav(60) + Titles/Padding(100) = 390
    double availableHeight = screenHeight - 320; 
    if (availableHeight < 400) availableHeight = 400; // increased minimum fallback
    
    double itemWidth = (screenWidth - 46) / 2; // 2 columns, padding 16*2, gap 14
    double itemHeight = (availableHeight - (14 * 3)) / 4; // 4 rows, 3 gaps of 14
    double dynamicAspectRatio = itemWidth / itemHeight;

    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
                      crossAxisSpacing: 14,
      mainAxisSpacing: 14,
      childAspectRatio: dynamicAspectRatio, // Dynamically fitted
      children: [
        _buildPremiumCard(
          subtitle: 'STUDENT MANAGEMENT',
          title: '$_adminTotalStudents',
          bottomText: 'Admission & Records',
          icon: Icons.groups_rounded,
          gradientColors: [const Color(0xFF4C3AE3), const Color(0xFF28189D)],
          accentColor: const Color(0xFF6366F1),
          imagePath: 'assets/images/admin_icons/student.jpg',
          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const StudentsScreen())),
        ),
        _buildPremiumCard(
          subtitle: 'TEACHER MANAGEMENT',
          title: '$_adminTotalTeachers',
          bottomText: 'Staff & Activities',
          icon: Icons.school_rounded,
          gradientColors: [const Color(0xFF00BFA5), const Color(0xFF00796B)],
          accentColor: const Color(0xFF1DE9B6),
          imagePath: 'assets/images/admin_icons/teacher.jpg',
          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const TeachersScreen())),
        ),
        _buildPremiumCard(
          subtitle: 'CLASSES MANAGEMENT',
          title: '$_adminTotalClasses',
          bottomText: 'Syllabus & Timetable',
          icon: Icons.account_balance_rounded,
          gradientColors: [const Color(0xFF0277BD), const Color(0xFF014670)],
          accentColor: const Color(0xFF039BE5),
          imagePath: 'assets/images/admin_icons/classes.jpg',
          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ClassesScreen())),
        ),
        _buildPremiumCard(
          subtitle: 'REVENUE TRACKING',
          title: '₹${_formatIndianCurrency(_adminFeeCollected)}',
          bottomText: 'Total Income',
          icon: Icons.account_balance_wallet_rounded,
          gradientColors: [const Color(0xFFE91E63), const Color(0xFF880E4F)],
          accentColor: const Color(0xFFF06292),
          imagePath: 'assets/images/admin_icons/revenue.jpg',
          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const FinanceScreen())),
        ),
        _buildPremiumCard(
          subtitle: 'FEE COLLECTION',
          title: 'Collect Fees',
          bottomText: 'Payment Tracking',
          icon: Icons.credit_card_rounded,
          gradientColors: [const Color(0xFF7B1FA2), const Color(0xFF4A148C)],
          accentColor: const Color(0xFF9C27B0),
          imagePath: 'assets/images/admin_icons/collect_fees.jpg',
          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const StudentFeeSearchScreen())),
        ),
        _buildPremiumCard(
          subtitle: 'EXAMINATIONS',
          title: 'Exams',
          bottomText: 'Marks & Results',
          icon: Icons.fact_check_rounded,
          gradientColors: [const Color(0xFF1565C0), const Color(0xFF0D47A1)],
          accentColor: const Color(0xFF1E88E5),
          imagePath: 'assets/images/admin_icons/exams.jpg',
          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ResultsScreen())),
        ),
        _buildPremiumCard(
          subtitle: 'FEE DETAILS',
          title: 'Balances',
          bottomText: 'Invoices & Dues',
          icon: Icons.receipt_long_rounded,
          gradientColors: [const Color(0xFFFF8F00), const Color(0xFFFF6F00)],
          accentColor: const Color(0xFFFFA000),
          imagePath: 'assets/images/admin_icons/student_fees.jpg',
          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const StudentFeeSearchScreen())),
        ),
        _buildPremiumCard(
          subtitle: 'REPORTS & ANALYTICS',
          title: 'Reports',
          bottomText: 'Performance Analysis',
          icon: Icons.emoji_events_rounded,
          gradientColors: [const Color(0xFF00C853), const Color(0xFF009624)],
          accentColor: const Color(0xFF00E676),
          imagePath: 'assets/images/admin_icons/reports.jpg',
          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ProgressCardScreen())),
        ),
      ],
    );
  }

  Widget _buildPremiumCard({
    required String title,
    required String subtitle,
    required String bottomText,
    required IconData icon,
    required List<Color> gradientColors,
    required Color accentColor,
    required String imagePath,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: gradientColors,
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: gradientColors[0].withOpacity(0.4),
              blurRadius: 15,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Stack(
          clipBehavior: Clip.hardEdge,
          children: [
            // Floating 3D image bubble removed based on user preference
            Padding(
              padding: const EdgeInsets.all(12.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      // Icon Badge
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: Colors.white.withOpacity(0.4), width: 1),
                        ),
                        child: Icon(icon, color: Colors.white, size: 16),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          subtitle,
                          style: GoogleFonts.poppins(
                            color: Colors.white.withOpacity(0.95),
                            fontSize: 9,
                            fontWeight: FontWeight.w700,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const Spacer(),
                  Text(
                    title,
                    style: GoogleFonts.outfit(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                      height: 1.1,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: accentColor.withOpacity(0.7),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      bottomText,
                      style: GoogleFonts.poppins(color: Colors.white, fontSize: 8, fontWeight: FontWeight.w600),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
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
              Navigator.push(context, MaterialPageRoute(builder: (context) => const StudentFeeSearchScreen()));
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

  // ================= ADMIN WIDGETS =================
  
  Widget _buildAttendanceChart() {
    if (_adminAttendanceTrend.isEmpty) return const SizedBox();
    
    List<FlSpot> presentSpots = [];
    List<FlSpot> absentSpots = [];
    
    for (int i = 0; i < _adminAttendanceTrend.length; i++) {
      final item = _adminAttendanceTrend[i];
      final p = double.tryParse(item['present']?.toString() ?? '0') ?? 0;
      final a = double.tryParse(item['absent']?.toString() ?? '0') ?? 0;
      presentSpots.add(FlSpot(i.toDouble(), p));
      absentSpots.add(FlSpot(i.toDouble(), a));
    }

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: const Color(0xFF10B981).withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                child: const Icon(Icons.show_chart, color: Color(0xFF10B981), size: 20),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Attendance Overview', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
                  Text('Present vs Absent (Last 7 Days)', style: GoogleFonts.poppins(fontSize: 11, color: const Color(0xFF64748B))),
                ],
              ),
            ],
          ),
          const SizedBox(height: 24),
          SizedBox(
            height: 200,
            child: LineChart(
              LineChartData(
                gridData: const FlGridData(show: false),
                titlesData: const FlTitlesData(
                  topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 22,
                      interval: 1,
                    ),
                  ),
                ),
                borderData: FlBorderData(show: false),
                lineBarsData: [
                  LineChartBarData(
                    spots: presentSpots,
                    isCurved: true,
                    color: const Color(0xFF10B981),
                    barWidth: 3,
                    isStrokeCapRound: true,
                    dotData: const FlDotData(show: true),
                    belowBarData: BarAreaData(
                      show: true,
                      color: const Color(0xFF10B981).withOpacity(0.1),
                    ),
                  ),
                  LineChartBarData(
                    spots: absentSpots,
                    isCurved: true,
                    color: const Color(0xFFEF4444),
                    barWidth: 3,
                    isStrokeCapRound: true,
                    dotData: const FlDotData(show: true),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDemographicsChart() {
    if (_adminGenderDistribution.isEmpty) return const SizedBox();
    
    final male = double.tryParse(_adminGenderDistribution['male']?.toString() ?? '0') ?? 0;
    final female = double.tryParse(_adminGenderDistribution['female']?.toString() ?? '0') ?? 0;
    final other = double.tryParse(_adminGenderDistribution['other']?.toString() ?? '0') ?? 0;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: const Color(0xFF6366F1).withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                child: const Icon(Icons.pie_chart, color: Color(0xFF6366F1), size: 20),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Demographics', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
                  Text('Student gender distribution', style: GoogleFonts.poppins(fontSize: 11, color: const Color(0xFF64748B))),
                ],
              ),
            ],
          ),
          const SizedBox(height: 24),
          SizedBox(
            height: 180,
            child: PieChart(
              PieChartData(
                sectionsSpace: 2,
                centerSpaceRadius: 50,
                sections: [
                  if (male > 0) PieChartSectionData(color: const Color(0xFF6366F1), value: male, title: 'M', radius: 40, titleStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white)),
                  if (female > 0) PieChartSectionData(color: const Color(0xFFEC4899), value: female, title: 'F', radius: 40, titleStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white)),
                  if (other > 0) PieChartSectionData(color: const Color(0xFFF59E0B), value: other, title: 'O', radius: 40, titleStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _buildLegendItem(const Color(0xFF6366F1), 'Male: ${male.toInt()}'),
              const SizedBox(width: 16),
              _buildLegendItem(const Color(0xFFEC4899), 'Female: ${female.toInt()}'),
            ],
          )
        ],
      ),
    );
  }

  Widget _buildLegendItem(Color color, String text) {
    return Row(
      children: [
        Container(width: 10, height: 10, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        const SizedBox(width: 6),
        Text(text, style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF475569), fontWeight: FontWeight.w600)),
      ],
    );
  }

  Widget _buildEnrollmentChart() {
    if (_adminEnrollmentByClass.isEmpty) return const SizedBox();
    
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: const Color(0xFFF59E0B).withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                child: const Icon(Icons.bar_chart, color: Color(0xFFF59E0B), size: 20),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Class Enrollment', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
                  Text('Students per class', style: GoogleFonts.poppins(fontSize: 11, color: const Color(0xFF64748B))),
                ],
              ),
            ],
          ),
          const SizedBox(height: 24),
          SizedBox(
            height: 220,
            child: BarChart(
              BarChartData(
                alignment: BarChartAlignment.spaceAround,
                maxY: _adminEnrollmentByClass.map((e) => double.tryParse(e['count']?.toString() ?? '0') ?? 0).reduce((a, b) => a > b ? a : b) * 1.2,
                barTouchData: BarTouchData(enabled: false),
                titlesData: FlTitlesData(
                  show: true,
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      getTitlesWidget: (value, meta) {
                        if (value.toInt() < 0 || value.toInt() >= _adminEnrollmentByClass.length) return const SizedBox();
                        return Padding(
                          padding: const EdgeInsets.only(top: 8.0),
                          child: Text(
                            _adminEnrollmentByClass[value.toInt()]['name']?.toString() ?? '',
                            style: GoogleFonts.poppins(fontSize: 10, color: const Color(0xFF64748B)),
                          ),
                        );
                      },
                    ),
                  ),
                  leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                ),
                gridData: const FlGridData(show: false),
                borderData: FlBorderData(show: false),
                barGroups: List.generate(_adminEnrollmentByClass.length, (i) {
                  final val = double.tryParse(_adminEnrollmentByClass[i]['count']?.toString() ?? '0') ?? 0;
                  return BarChartGroupData(
                    x: i,
                    barRods: [
                      BarChartRodData(
                        toY: val,
                        color: const Color(0xFFF59E0B),
                        width: 12,
                        borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                      )
                    ],
                  );
                }),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecentPayments() {
    if (_adminRecentPayments.isEmpty) return const SizedBox();
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: const Color(0xFF3B82F6).withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                child: const Icon(Icons.receipt_long, color: Color(0xFF3B82F6), size: 20),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Recent Payments', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
                  Text('Latest fee transactions', style: GoogleFonts.poppins(fontSize: 11, color: const Color(0xFF64748B))),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _adminRecentPayments.length > 5 ? 5 : _adminRecentPayments.length,
            separatorBuilder: (c, i) => const Divider(color: Color(0xFFF1F5F9)),
            itemBuilder: (context, index) {
              final p = _adminRecentPayments[index];
              final studentName = p['student']?['user']?['name'] ?? p['student']?['name'] ?? 'Unknown';
              final amount = double.tryParse(p['amountPaid']?.toString() ?? '0') ?? 0;
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 8.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        studentName,
                        style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF334155)),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    Text(
                      '₹${amount.toInt()}',
                      style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.bold, color: const Color(0xFF10B981)),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  // ================= SHARED / COMMON WIDGETS =================

  Widget _buildAnnouncements() {
    if (_recentAnnouncements.isEmpty) return const SizedBox();
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: const Color(0xFF8B5CF6).withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                child: const Icon(Icons.campaign, color: Color(0xFF8B5CF6), size: 20),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Notice Board', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
                  Text('Latest announcements', style: GoogleFonts.poppins(fontSize: 11, color: const Color(0xFF64748B))),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _recentAnnouncements.length > 3 ? 3 : _recentAnnouncements.length,
            separatorBuilder: (c, i) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final a = _recentAnnouncements[index];
              return Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFF1F5F9)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      a['title'] ?? '',
                      style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF1E293B)),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      a['content'] ?? '',
                      style: GoogleFonts.poppins(fontSize: 11, color: const Color(0xFF64748B)),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  // ================= TEACHER / STUDENT WIDGETS =================

  Widget _buildTimetableToday() {
    if (_timetableToday.isEmpty) return const SizedBox();
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: const Color(0xFF06B6D4).withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                child: const Icon(Icons.schedule, color: Color(0xFF06B6D4), size: 20),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Today\'s Classes', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
                  Text('Your schedule for today', style: GoogleFonts.poppins(fontSize: 11, color: const Color(0xFF64748B))),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _timetableToday.length,
            separatorBuilder: (c, i) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final slot = _timetableToday[index];
              return Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(12)),
                    child: Center(child: Icon(Icons.book, size: 16, color: const Color(0xFF64748B))),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(slot['subject']?['name'] ?? 'Subject', style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
                        Text('${slot['class']?['name'] ?? ''}-${slot['class']?['section'] ?? ''}', style: GoogleFonts.poppins(fontSize: 11, color: const Color(0xFF64748B))),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(color: const Color(0xFFECFEFF), borderRadius: BorderRadius.circular(20)),
                    child: Text(slot['startTime'] ?? '', style: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFF0891B2))),
                  )
                ],
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildRecentHomework() {
    if (_recentHomework.isEmpty) return const SizedBox();
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: const Color(0xFF8B5CF6).withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                child: const Icon(Icons.assignment, color: Color(0xFF8B5CF6), size: 20),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Recent Homework', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
                  Text('Latest assignments given', style: GoogleFonts.poppins(fontSize: 11, color: const Color(0xFF64748B))),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
          ..._recentHomework.take(3).map((hw) => Padding(
            padding: const EdgeInsets.only(bottom: 12.0),
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(12)),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(hw['title'] ?? '', style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
                  const SizedBox(height: 4),
                  Text('${hw['subject']?['name'] ?? ''} | Due: ${hw['dueDate']?.toString().substring(0,10) ?? ''}', style: GoogleFonts.poppins(fontSize: 11, color: const Color(0xFF64748B))),
                ],
              ),
            ),
          )).toList(),
        ],
      ),
    );
  }

  Widget _buildRecentMarks() {
    if (_recentMarks.isEmpty) return const SizedBox();
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: const Color(0xFFF59E0B).withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                child: const Icon(Icons.workspace_premium, color: Color(0xFFF59E0B), size: 20),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Recent Results', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
                  Text('Latest examination scores', style: GoogleFonts.poppins(fontSize: 11, color: const Color(0xFF64748B))),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
          ..._recentMarks.take(3).map((mark) => Padding(
            padding: const EdgeInsets.only(bottom: 12.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(mark['examName'] ?? 'Exam', style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
                      Text(mark['subjectName'] ?? '', style: GoogleFonts.poppins(fontSize: 11, color: const Color(0xFF64748B))),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(color: const Color(0xFFF59E0B).withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
                  child: Text('${mark['marksObtained']}/${mark['maxMarks']}', style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.bold, color: const Color(0xFFD97706))),
                ),
              ],
            ),
          )).toList(),
        ],
      ),
    );
  }
}


