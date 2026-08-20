import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';
import '../widgets/app_drawer.dart';

class TimetableScreen extends StatefulWidget {
  const TimetableScreen({super.key});

  @override
  State<TimetableScreen> createState() => _TimetableScreenState();
}

class _TimetableScreenState extends State<TimetableScreen> with SingleTickerProviderStateMixin {
  late TabController _dayTabController;
  Map<String, dynamic> _timetable = {};
  List<dynamic> _classes = [];
  String? _selectedClassId;
  String? _userRole;
  bool _isLoading = true;
  String? _errorMessage;

  final List<String> _days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Subject Colors Mapping (from Web App)
  Map<String, Color> _getSubjectColors(String subjectName) {
    final name = subjectName.toLowerCase().trim();
    if (name.contains('math')) return const { 'bg': Color(0xFFDCFCE7), 'text': Color(0xFF166534), 'border': Color(0xFFBBF7D0) }!;
    if (name.contains('science') || name.contains('physics') || name.contains('chemistry') || name.contains('biology')) return const { 'bg': Color(0xFFCCFBF1), 'text': Color(0xFF115E59), 'border': Color(0xFF99F6E4) }!;
    if (name.contains('english') || name.contains('hindi') || name.contains('telugu') || name.contains('language')) return const { 'bg': Color(0xFFFCE7F3), 'text': Color(0xFF9D174D), 'border': Color(0xFFFBCFE8) }!;
    if (name.contains('physical') || name.contains('sports') || name.contains('pt')) return const { 'bg': Color(0xFFFEF3C7), 'text': Color(0xFF92400E), 'border': Color(0xFFFDE68A) }!;
    if (name.contains('social') || name.contains('history')) return const { 'bg': Color(0xFFE0F2FE), 'text': Color(0xFF0369A1), 'border': Color(0xFFBAE6FD) }!;
    if (name.contains('art')) return const { 'bg': Color(0xFFF3E8FF), 'text': Color(0xFF6B21A8), 'border': Color(0xFFE9D5FF) }!;
    
    // Default Fallback
    return const { 'bg': Color(0xFFF1F5F9), 'text': Color(0xFF334155), 'border': Color(0xFFE2E8F0) }!;
  }

  @override
  void initState() {
    super.initState();
    _dayTabController = TabController(length: _days.length, vsync: this);
    _fetchTimetable();
  }

  @override
  void dispose() {
    _dayTabController.dispose();
    super.dispose();
  }

  Future<void> _fetchTimetable() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userString = prefs.getString('user');
      if (userString == null) {
        setState(() {
          _errorMessage = 'User session not found';
          _isLoading = false;
        });
        return;
      }

      final user = jsonDecode(userString);
      _userRole = user['role'];

      if (_userRole == 'STUDENT') {
        final classId = user['student']?['classId']?.toString();
        if (classId != null) {
          final res = await ApiService.getTimetable(classId);
          if (mounted) {
            setState(() {
              _timetable = res['success'] ? (res['data'] ?? {}) : {};
              _isLoading = false;
            });
          }
        } else {
          setState(() {
            _errorMessage = 'Class ID not found for student.';
            _isLoading = false;
          });
        }
      } else if (_userRole == 'TEACHER') {
        final teacherId = user['teacherId']?.toString();
        if (teacherId != null) {
          final res = await ApiService.getTeacherTimetable(teacherId);
          if (mounted) {
            setState(() {
              _timetable = res['success'] ? (res['data'] ?? {}) : {};
              _isLoading = false;
            });
          }
        } else {
          setState(() {
            _errorMessage = 'Teacher ID not found.';
            _isLoading = false;
          });
        }
      } else {
        // Admin
        final classesRes = await ApiService.getClasses();
        if (mounted) {
          setState(() {
            _classes = classesRes['success'] ? (classesRes['data'] ?? []) : [];
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'An error occurred: $e';
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _fetchClassTimetable(String classId) async {
    setState(() { _isLoading = true; });
    try {
      final res = await ApiService.getTimetable(classId);
      if (mounted) {
        setState(() {
          _timetable = res['success'] ? (res['data'] ?? {}) : {};
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'An error occurred: $e';
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      drawer: const AppDrawer(currentRoute: 'timetable'),
      appBar: AppBar(
        title: Text('Timetable', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 18)),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF1E293B),
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                if (_userRole == 'SUPER_ADMIN' || _userRole == 'ADMIN')
                  Container(
                    margin: const EdgeInsets.all(16),
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 8, offset: const Offset(0, 2))],
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        isExpanded: true,
                        hint: Text('Select Class', style: GoogleFonts.poppins(color: const Color(0xFF64748B))),
                        value: _selectedClassId,
                        icon: const Icon(Icons.keyboard_arrow_down_rounded, color: Color(0xFF94A3B8)),
                        items: _classes.map((cls) {
                          final name = cls['className'] ?? 'Unknown';
                          final sec = cls['section'] ?? '';
                          return DropdownMenuItem<String>(
                            value: cls['id'].toString(),
                            child: Text('$name $sec', style: GoogleFonts.poppins(color: const Color(0xFF1E293B))),
                          );
                        }).toList(),
                        onChanged: (val) {
                          setState(() { _selectedClassId = val; });
                          if (val != null) _fetchClassTimetable(val);
                        },
                      ),
                    ),
                  ),

                // Days TabBar
                Container(
                  color: Colors.white,
                  child: TabBar(
                    controller: _dayTabController,
                    isScrollable: true,
                    indicatorColor: Colors.transparent,
                    labelColor: Colors.white,
                    unselectedLabelColor: const Color(0xFF64748B),
                    padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 8),
                    indicator: BoxDecoration(
                      color: const Color(0xFF6366F1),
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [BoxShadow(color: const Color(0xFF6366F1).withOpacity(0.3), blurRadius: 8, offset: const Offset(0, 4))],
                    ),
                    tabs: _days.map((d) {
                      return Tab(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: Text(d.substring(0, 3), style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 13)),
                        ),
                      );
                    }).toList(),
                  ),
                ),

                // Timeline View
                Expanded(
                  child: TabBarView(
                    controller: _dayTabController,
                    children: _days.map((day) => _buildDayTimetable(day)).toList(),
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildDayTimetable(String day) {
    if (_timetable.isEmpty) {
      return Center(child: Text('No timetable available', style: GoogleFonts.poppins(color: const Color(0xFF94A3B8))));
    }

    final List<dynamic> periods = _timetable[day] ?? [];
    if (periods.isEmpty) {
      return Center(child: Text('No periods scheduled for $day', style: GoogleFonts.poppins(color: const Color(0xFF94A3B8))));
    }

    periods.sort((a, b) => (a['startTime'] ?? '').compareTo(b['startTime'] ?? ''));

    return ListView.builder(
      padding: const EdgeInsets.only(top: 24, left: 16, right: 16, bottom: 40),
      itemCount: periods.length,
      itemBuilder: (context, index) {
        final period = periods[index];
        final subject = period['subject']?['name'] ?? 'Free Period';
        final isBreak = period['isBreak'] ?? false;
        final teacher = period['teacher']?['user']?['name'] ?? 'No Teacher';
        final startTime = period['startTime'] ?? '--:--';
        final endTime = period['endTime'] ?? '--:--';
        final room = period['room'] ?? '';

        final colors = isBreak 
            ? const { 'bg': Color(0xFFFFFBEB), 'text': Color(0xFFB45309), 'border': Color(0xFFFDE68A) }!
            : _getSubjectColors(subject);

        // Check if current time falls in this period
        final now = DateTime.now();
        final currentDay = [
          'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
        ][now.weekday % 7];
        
        bool isCurrentPeriod = false;
        if (currentDay == day && startTime != '--:--' && endTime != '--:--') {
          try {
            final nowMins = now.hour * 60 + now.minute;
            final startParts = startTime.split(':');
            final endParts = endTime.split(':');
            final startMins = int.parse(startParts[0]) * 60 + int.parse(startParts[1]);
            final endMins = int.parse(endParts[0]) * 60 + int.parse(endParts[1]);
            if (nowMins >= startMins && nowMins < endMins) {
              isCurrentPeriod = true;
            }
          } catch (_) {}
        }

        return Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Time Column
            SizedBox(
              width: 70,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(startTime, style: GoogleFonts.poppins(fontSize: 13, fontWeight: isCurrentPeriod ? FontWeight.w900 : FontWeight.bold, color: isCurrentPeriod ? const Color(0xFF6366F1) : const Color(0xFF1E293B))),
                  Text(endTime, style: GoogleFonts.poppins(fontSize: 11, color: const Color(0xFF94A3B8))),
                ],
              ),
            ),
            const SizedBox(width: 16),
            
            // Timeline Line & Dot
            Column(
              children: [
                Container(
                  width: 14,
                  height: 14,
                  decoration: BoxDecoration(
                    color: isCurrentPeriod ? const Color(0xFF6366F1) : Colors.white,
                    border: Border.all(color: isCurrentPeriod ? const Color(0xFF6366F1) : colors['text']!, width: isCurrentPeriod ? 0 : 3),
                    shape: BoxShape.circle,
                    boxShadow: isCurrentPeriod ? [
                      BoxShadow(color: const Color(0xFF6366F1).withOpacity(0.5), blurRadius: 8, spreadRadius: 2)
                    ] : null,
                  ),
                ),
                if (index != periods.length - 1)
                  Expanded(
                    child: Container(
                      width: 2,
                      color: const Color(0xFFE2E8F0),
                    ),
                  )
              ],
            ),
            const SizedBox(width: 16),
            
            // Period Card
            Expanded(
              child: Container(
                margin: const EdgeInsets.only(bottom: 24),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isBreak ? const Color(0xFFFFFBEB) : colors['bg'],
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: colors['border']!),
                  boxShadow: [
                    BoxShadow(color: colors['text']!.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4))
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            isBreak ? 'BREAK' : subject,
                            style: GoogleFonts.poppins(color: colors['text'], fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                        ),
                        if (room.isNotEmpty)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.5),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              children: [
                                Icon(Icons.meeting_room_rounded, size: 12, color: colors['text']),
                                const SizedBox(width: 4),
                                Text(room, style: GoogleFonts.poppins(fontSize: 10, fontWeight: FontWeight.bold, color: colors['text'])),
                              ],
                            ),
                          )
                      ],
                    ),
                    if (!isBreak) ...[
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Icon(Icons.person_rounded, size: 14, color: colors['text']!.withOpacity(0.7)),
                          const SizedBox(width: 6),
                          Text(
                            teacher,
                            style: GoogleFonts.poppins(color: colors['text']!.withOpacity(0.8), fontSize: 13, fontWeight: FontWeight.w500),
                          ),
                        ],
                      ),
                    ]
                  ],
                ),
              ),
            )
          ],
        );
      },
    );
  }
}
