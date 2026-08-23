import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../services/api_service.dart';
import '../widgets/app_drawer.dart';
import 'package:intl/intl.dart';

class TimetableScreen extends StatefulWidget {
  const TimetableScreen({super.key});

  @override
  State<TimetableScreen> createState() => _TimetableScreenState();
}

class _TimetableScreenState extends State<TimetableScreen> {
  int _currentIndex = 0;
  String? _userRole;

  @override
  void initState() {
    super.initState();
    _loadUserRole();
  }

  Future<void> _loadUserRole() async {
    final prefs = await SharedPreferences.getInstance();
    final userString = prefs.getString('user');
    if (userString != null) {
      final user = jsonDecode(userString);
      setState(() {
        _userRole = user['role'];
      });
    }
  }

  bool _hasFullAccess() {
    return _userRole == 'SUPER_ADMIN' || _userRole == 'ADMIN';
  }

  @override
  Widget build(BuildContext context) {
    if (_userRole == null) return const Scaffold(body: Center(child: CircularProgressIndicator()));

    List<Widget> screens = [
      const TimetableDashboardTab(),
      const TimetableViewTab(),
      if (_hasFullAccess() || _userRole == 'TEACHER') const TimetableRequestsTab(),
      if (_hasFullAccess()) const TimetableManageTab(),
      if (_hasFullAccess()) const TimetableReportsTab(),
    ];

    List<BottomNavigationBarItem> navItems = [
      const BottomNavigationBarItem(icon: Icon(Icons.dashboard), label: 'Dashboard'),
      const BottomNavigationBarItem(icon: Icon(Icons.calendar_month), label: 'Timetable'),
      if (_hasFullAccess() || _userRole == 'TEACHER') const BottomNavigationBarItem(icon: Icon(Icons.approval), label: 'Requests'),
      if (_hasFullAccess()) const BottomNavigationBarItem(icon: Icon(Icons.edit), label: 'Manage'),
      if (_hasFullAccess()) const BottomNavigationBarItem(icon: Icon(Icons.bar_chart), label: 'Reports'),
    ];

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      drawer: const AppDrawer(currentRoute: 'timetable'),
      appBar: AppBar(
        title: Text('Timetable ERP', style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 20)),
        iconTheme: const IconThemeData(color: Colors.white),
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
        elevation: 0,
      ),
      body: screens[_currentIndex],
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // Emergency substitute
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Emergency Substitute Routing Triggered')));
        },
        backgroundColor: Colors.redAccent,
        child: const Icon(Icons.warning_amber_rounded, color: Colors.white),
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 20, offset: const Offset(0, -5))],
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (index) => setState(() => _currentIndex = index),
          type: BottomNavigationBarType.fixed,
          backgroundColor: Colors.white,
          selectedItemColor: const Color(0xFF6366F1),
          unselectedItemColor: const Color(0xFF94A3B8),
          selectedLabelStyle: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 11),
          unselectedLabelStyle: GoogleFonts.poppins(fontWeight: FontWeight.w500, fontSize: 11),
          items: navItems,
        ),
      ),
    );
  }
}

// ----------------------------------------------------------------------
// 1. DASHBOARD TAB
// ----------------------------------------------------------------------
class TimetableDashboardTab extends StatefulWidget {
  const TimetableDashboardTab({super.key});
  @override
  State<TimetableDashboardTab> createState() => _TimetableDashboardTabState();
}

class _TimetableDashboardTabState extends State<TimetableDashboardTab> {
  Map<String, dynamic> _stats = {};
  List<dynamic> _clashes = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    try {
      final statsRes = await ApiService.getTimetableStats();
      final clashesRes = await ApiService.getTimetableClashes();
      
      if (mounted) {
        setState(() {
          _stats = statsRes['success'] ? (statsRes['data'] ?? {}) : {};
          _clashes = clashesRes['success'] ? (clashesRes['data'] ?? []) : [];
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Center(child: CircularProgressIndicator());

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(child: _buildStatCard('Classes', _stats['classes']?.toString() ?? '0', Icons.menu_book, const Color(0xFFECFDF5), const Color(0xFF10B981))),
              const SizedBox(width: 12),
              Expanded(child: _buildStatCard('Teachers', _stats['teachers']?.toString() ?? '0', Icons.people, const Color(0xFFEFF6FF), const Color(0xFF3B82F6))),
              const SizedBox(width: 12),
              Expanded(child: _buildStatCard('Subjects', _stats['subjects']?.toString() ?? '0', Icons.library_books, const Color(0xFFFEF2F2), const Color(0xFFEF4444))),
            ],
          ),
          const SizedBox(height: 24),
          
          Row(
            children: [
              const Icon(Icons.error_outline, color: Colors.redAccent),
              const SizedBox(width: 8),
              Text('Clash Detection Alerts', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(color: Colors.redAccent.withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
                child: Text('${_clashes.length} Issues', style: GoogleFonts.poppins(color: Colors.redAccent, fontWeight: FontWeight.bold, fontSize: 12)),
              ),
            ],
          ),
          const SizedBox(height: 16),
          
          if (_clashes.isEmpty)
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: const Color(0xFFE2E8F0))),
              child: Center(
                child: Column(
                  children: [
                    const Icon(Icons.check_circle_outline, color: Colors.green, size: 48),
                    const SizedBox(height: 8),
                    Text('No Clashes Detected', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
                    Text('Timetable is perfectly synced.', style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 12)),
                  ],
                ),
              ),
            )
          else
            ..._clashes.map((clash) => Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF2F2),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFFECACA)),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: const BoxDecoration(color: Colors.redAccent, shape: BoxShape.circle),
                    child: const Icon(Icons.warning_amber_rounded, color: Colors.white, size: 20),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Conflict for ${clash['teacher']}', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, color: const Color(0xFF991B1B))),
                        Text('${clash['day']} - Period ${clash['periodNumber']}', style: GoogleFonts.poppins(fontSize: 13, color: const Color(0xFFB91C1C))),
                      ],
                    ),
                  ),
                ],
              ),
            )).toList(),
        ],
      ),
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color bgColor, Color iconColor) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: const Color(0xFFE2E8F0)), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4))]),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(padding: const EdgeInsets.all(8), decoration: BoxDecoration(color: bgColor, borderRadius: BorderRadius.circular(12)), child: Icon(icon, color: iconColor, size: 20)),
          const SizedBox(height: 12),
          Text(value, style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
          Text(title, style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w500, color: const Color(0xFF64748B))),
        ],
      ),
    );
  }
}

// ----------------------------------------------------------------------
// 2. TIMETABLE VIEW TAB
// ----------------------------------------------------------------------
class TimetableViewTab extends StatefulWidget {
  const TimetableViewTab({super.key});
  @override
  State<TimetableViewTab> createState() => _TimetableViewTabState();
}

class _TimetableViewTabState extends State<TimetableViewTab> with SingleTickerProviderStateMixin {
  late TabController _dayTabController;
  Map<String, dynamic> _timetable = {};
  List<dynamic> _classes = [];
  String? _selectedClassId;
  String? _userRole;
  bool _isLoading = true;
  final List<String> _days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  @override
  void initState() {
    super.initState();
    _dayTabController = TabController(length: _days.length, vsync: this);
    _fetchTimetable();
  }

  Future<void> _fetchTimetable() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userString = prefs.getString('user');
      final user = jsonDecode(userString!);
      _userRole = user['role'];

      if (_userRole == 'SUPER_ADMIN' || _userRole == 'ADMIN') {
        final classesRes = await ApiService.getClasses();
        if (mounted) {
          setState(() {
            _classes = classesRes['success'] ? (classesRes['data'] ?? []) : [];
            if (_classes.isNotEmpty) _selectedClassId = _classes[0]['id'].toString();
          });
          if (_selectedClassId != null) await _fetchClassTimetable(_selectedClassId!);
        }
      } else if (_userRole == 'TEACHER') {
        final res = await ApiService.getTeacherTimetable(user['teacherId']);
        if (mounted) setState(() { _timetable = res['success'] ? res['data'] : {}; _isLoading = false; });
      } else {
        final res = await ApiService.getTimetable(user['student']['classId']);
        if (mounted) setState(() { _timetable = res['success'] ? res['data'] : {}; _isLoading = false; });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _fetchClassTimetable(String classId) async {
    setState(() => _isLoading = true);
    final res = await ApiService.getTimetable(classId);
    if (mounted) setState(() { _timetable = res['success'] ? res['data'] : {}; _isLoading = false; });
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Center(child: CircularProgressIndicator());
    return Column(
      children: [
        if (_userRole == 'SUPER_ADMIN' || _userRole == 'ADMIN')
          Container(
            margin: const EdgeInsets.all(16),
            padding: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: const Color(0xFFE2E8F0))),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                isExpanded: true,
                value: _selectedClassId,
                items: _classes.map((cls) => DropdownMenuItem(value: cls['id'].toString(), child: Text('${cls['className']} ${cls['section']}'))).toList(),
                onChanged: (v) { setState(() => _selectedClassId = v); if(v!=null) _fetchClassTimetable(v); },
              ),
            ),
          ),
        Container(
          color: Colors.white,
          child: TabBar(
            controller: _dayTabController,
            isScrollable: true,
            labelColor: const Color(0xFF6366F1),
            unselectedLabelColor: const Color(0xFF94A3B8),
            indicatorColor: const Color(0xFF6366F1),
            tabs: _days.map((d) => Tab(text: d.substring(0,3))).toList(),
          ),
        ),
        Expanded(
          child: TabBarView(
            controller: _dayTabController,
            children: _days.map((day) => _buildDayView(day)).toList(),
          ),
        )
      ],
    );
  }

  Widget _buildDayView(String day) {
    final List<dynamic> periods = _timetable[day] ?? [];
    if (periods.isEmpty) return const Center(child: Text('No classes scheduled'));
    
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: periods.length,
      itemBuilder: (context, index) {
        final period = periods[index];
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: const Color(0xFFE2E8F0)), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0,4))]),
          child: Row(
            children: [
              Container(
                width: 60,
                padding: const EdgeInsets.symmetric(vertical: 8),
                decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(12)),
                child: Column(
                  children: [
                    Text(period['startTime'] ?? '', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 13, color: const Color(0xFF1E293B))),
                    Text(period['endTime'] ?? '', style: GoogleFonts.poppins(fontSize: 10, color: const Color(0xFF94A3B8))),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(period['subject']?['name'] ?? 'Free Period', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 16, color: const Color(0xFF1E293B))),
                    if (period['teacher'] != null)
                      Text(period['teacher']['user']['name'], style: GoogleFonts.poppins(fontSize: 13, color: const Color(0xFF64748B))),
                  ],
                ),
              )
            ],
          ),
        );
      },
    );
  }
}

// ----------------------------------------------------------------------
// 3. REQUESTS TAB (Substitutes)
// ----------------------------------------------------------------------
class TimetableRequestsTab extends StatefulWidget {
  const TimetableRequestsTab({super.key});
  @override
  State<TimetableRequestsTab> createState() => _TimetableRequestsTabState();
}

class _TimetableRequestsTabState extends State<TimetableRequestsTab> {
  List<dynamic> _requests = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchRequests();
  }

  Future<void> _fetchRequests() async {
    try {
      final res = await ApiService.getLeaveRequests();
      if (mounted) setState(() { _requests = res['success'] ? res['data'] : []; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Center(child: CircularProgressIndicator());
    if (_requests.isEmpty) return const Center(child: Text('No substitute requests pending.'));

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _requests.length,
      itemBuilder: (context, index) {
        final req = _requests[index];
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: const Color(0xFFE2E8F0))),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(req['requester']?['name'] ?? 'Teacher', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 16)),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(color: const Color(0xFFFEF2F2), borderRadius: BorderRadius.circular(20)),
                    child: Text(req['status'], style: GoogleFonts.poppins(color: Colors.red, fontSize: 11, fontWeight: FontWeight.bold)),
                  )
                ],
              ),
              const SizedBox(height: 8),
              Text(req['reason'] ?? '', style: GoogleFonts.poppins(color: const Color(0xFF64748B))),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                      onPressed: () {},
                      child: const Text('Approve Sub'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(side: const BorderSide(color: Color(0xFFEF4444)), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                      onPressed: () {},
                      child: const Text('Reject', style: TextStyle(color: Color(0xFFEF4444))),
                    ),
                  ),
                ],
              )
            ],
          ),
        );
      },
    );
  }
}

// ----------------------------------------------------------------------
// 4. MANAGE TAB (Admin Edit)
// ----------------------------------------------------------------------
class TimetableManageTab extends StatelessWidget {
  const TimetableManageTab({super.key});
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.desktop_windows, size: 64, color: Color(0xFFCBD5E1)),
            const SizedBox(height: 24),
            Text('Timetable Management', style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
            const SizedBox(height: 8),
            Text('To edit timetable slots and assign teachers, please use the web dashboard for a better drag-and-drop experience.', textAlign: TextAlign.center, style: GoogleFonts.poppins(color: const Color(0xFF64748B))),
          ],
        ),
      ),
    );
  }
}

// ----------------------------------------------------------------------
// 5. REPORTS TAB
// ----------------------------------------------------------------------
class TimetableReportsTab extends StatelessWidget {
  const TimetableReportsTab({super.key});
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.insert_chart_outlined, size: 64, color: Color(0xFFCBD5E1)),
            const SizedBox(height: 24),
            Text('Teacher Workload Reports', style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
            const SizedBox(height: 8),
            Text('Comprehensive analytics on teacher free periods, active classes, and subject distributions are available on the web admin panel.', textAlign: TextAlign.center, style: GoogleFonts.poppins(color: const Color(0xFF64748B))),
          ],
        ),
      ),
    );
  }
}
