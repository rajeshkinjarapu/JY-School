import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';

class MyClassesTimetableScreen extends StatefulWidget {
  const MyClassesTimetableScreen({super.key});

  @override
  State<MyClassesTimetableScreen> createState() => _MyClassesTimetableScreenState();
}

class _MyClassesTimetableScreenState extends State<MyClassesTimetableScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  Map<String, dynamic> _timetable = {};
  bool _isLoading = true;
  String _className = '';
  
  final List<String> _days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  final List<String> _shortDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  final List<Color> _accentColors = [
    const Color(0xFF4F46E5), // Indigo
    const Color(0xFF0EA5E9), // Sky Blue
    const Color(0xFFF59E0B), // Amber
    const Color(0xFF10B981), // Emerald
    const Color(0xFFEC4899), // Pink
    const Color(0xFF8B5CF6), // Purple
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _days.length, vsync: this);
    
    // Set default tab to current day if it's Mon-Sat
    int currentDay = DateTime.now().weekday;
    if (currentDay >= 1 && currentDay <= 6) {
      _tabController.index = currentDay - 1;
    }
    
    _fetchTimetable();
  }

  Future<void> _fetchTimetable() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userString = prefs.getString('user');
      if (userString == null) return;
      
      final user = jsonDecode(userString);
      
      if (user['role'] == 'STUDENT') {
        final classData = user['student']['class'];
        if (classData != null) {
          _className = '${classData['name']} ${classData['section']}';
        } else {
          _className = 'Your Class';
        }
        
        final res = await ApiService.getTimetable(user['student']['classId']);
        if (mounted) {
          setState(() {
            _timetable = res['success'] ? res['data'] : {};
            _isLoading = false;
          });
        }
      } else {
        setState(() => _isLoading = false);
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC), // Very light grey background
      appBar: AppBar(
        leading: GestureDetector(
          onTap: () => Navigator.pop(context),
          child: const Icon(Icons.arrow_back_ios_new_rounded, size: 20, color: Color(0xFF1E293B)),
        ),
        title: Text(
          'My Schedule',
          style: GoogleFonts.outfit(color: const Color(0xFF1E293B), fontSize: 22, fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16.0),
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.calendar_today_rounded, color: Color(0xFF64748B), size: 18),
            ),
          )
        ],
      ),
      body: Column(
        children: [
          _buildTabBar(),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF4F46E5)))
                : TabBarView(
                    controller: _tabController,
                    children: _days.map((day) => _buildDayTimetable(day)).toList(),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabBar() {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.only(bottom: 12, top: 8),
      child: Container(
        height: 50,
        margin: const EdgeInsets.symmetric(horizontal: 20),
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          color: const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(25),
        ),
        child: TabBar(
          controller: _tabController,
          indicatorSize: TabBarIndicatorSize.tab,
          indicator: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 4, offset: const Offset(0, 2)),
            ],
          ),
          labelColor: const Color(0xFF1E293B),
          unselectedLabelColor: const Color(0xFF94A3B8),
          labelStyle: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 13),
          unselectedLabelStyle: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 13),
          dividerColor: Colors.transparent,
          tabs: _shortDays.map((day) => Tab(text: day)).toList(),
        ),
      ),
    );
  }

  Widget _buildDayTimetable(String day) {
    final List<dynamic> periods = _timetable[day] ?? [];
    
    if (periods.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 20)],
              ),
              child: const Icon(Icons.hotel_class_rounded, size: 60, color: Color(0xFFCBD5E1)),
            ),
            const SizedBox(height: 24),
            Text('No Classes Today', style: GoogleFonts.outfit(fontSize: 22, color: const Color(0xFF64748B), fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text('Enjoy your day off!', style: GoogleFonts.poppins(fontSize: 14, color: const Color(0xFF94A3B8))),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.only(top: 24, bottom: 40, left: 16, right: 16),
      itemCount: periods.length,
      itemBuilder: (context, index) {
        final period = periods[index];
        final subjectNameStr = (period['subject']?['name'] as String?)?.toLowerCase() ?? '';
        final isLunch = subjectNameStr.contains('lunch');
        final isBreak = subjectNameStr.contains('break');
        final isFreePeriod = period['subject'] == null || subjectNameStr.contains('free') || isLunch || isBreak;
        
        final color = _accentColors[index % _accentColors.length];
        
        return IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Time & Period Column
              SizedBox(
                width: 75,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      period['startTime'] ?? '00:00',
                      style: GoogleFonts.outfit(color: const Color(0xFF1E293B), fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'to ${period['endTime'] ?? '00:00'}',
                      style: GoogleFonts.poppins(color: const Color(0xFF94A3B8), fontSize: 10, fontWeight: FontWeight.w500),
                    ),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        'Period ${period['periodNumber']}',
                        style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 9, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
              ),
              
              // Timeline Connector Column
              SizedBox(
                width: 40,
                child: Column(
                  children: [
                    Expanded(child: Container(width: 2, color: index == 0 ? Colors.transparent : const Color(0xFFE2E8F0))),
                    Container(
                      width: 14,
                      height: 14,
                      decoration: BoxDecoration(
                        color: color,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 3),
                        boxShadow: [
                          BoxShadow(color: color.withOpacity(0.4), blurRadius: 4, offset: const Offset(0, 2))
                        ]
                      ),
                    ),
                    Expanded(child: Container(width: 2, color: index == periods.length - 1 ? Colors.transparent : const Color(0xFFE2E8F0))),
                  ],
                ),
              ),
              
              // Card Column
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 16.0),
                  child: isFreePeriod
                      ? _buildFreePeriodCard(period, isLunch, isBreak)
                      : _buildSubjectCard(period, color),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildSubjectCard(dynamic period, Color accentColor) {
    final subjectName = period['subject']?['name'] ?? 'Unknown Subject';
    final teacherName = period['teacher']?['user']?['name'] ?? 'Not Assigned';
    final roomName = period['room'] ?? 'Room TBD';
    
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10, offset: const Offset(0, 4)),
        ],
        border: Border.all(color: const Color(0xFFF1F5F9), width: 1.5),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: Container(
          decoration: BoxDecoration(
            border: Border(left: BorderSide(color: accentColor, width: 4)),
          ),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      subjectName,
                      style: GoogleFonts.outfit(color: const Color(0xFF1E293B), fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: accentColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      roomName,
                      style: GoogleFonts.poppins(color: accentColor, fontSize: 10, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.person_outline_rounded, color: Color(0xFF64748B), size: 16),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      teacherName,
                      style: GoogleFonts.poppins(color: const Color(0xFF475569), fontSize: 13, fontWeight: FontWeight.w500),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFreePeriodCard(dynamic period, bool isLunch, bool isBreak) {
    String title = 'Free Period';
    String subtitle = 'Relax and recharge!';
    IconData icon = Icons.self_improvement_rounded;
    Color color = const Color(0xFF64748B);
    
    if (isLunch) {
        title = 'Lunch Break';
        subtitle = 'Enjoy your meal!';
        icon = Icons.restaurant_rounded;
        color = const Color(0xFFF59E0B);
    } else if (isBreak) {
        title = 'Break Time';
        subtitle = 'Take a short break!';
        icon = Icons.coffee_rounded;
        color = const Color(0xFF0EA5E9);
    }

    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0), width: 1.5),
      ),
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 4, offset: const Offset(0, 2))
              ]
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  title,
                  style: GoogleFonts.outfit(color: const Color(0xFF1E293B), fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 12, fontWeight: FontWeight.w500),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
