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
        final teacher = period['teacher']?['user']?['name'] ?? 'No Teacher';
        final startTime = period['startTime'] ?? '--:--';
        final endTime = period['endTime'] ?? '--:--';

        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Time Column
            SizedBox(
              width: 70,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(startTime, style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
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
                    color: Colors.white,
                    border: Border.all(color: const Color(0xFF6366F1), width: 3),
                    shape: BoxShape.circle,
                  ),
                ),
                if (index != periods.length - 1)
                  Container(
                    width: 2,
                    height: 90, // Card height approximation
                    color: const Color(0xFFE2E8F0),
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
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4))
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      subject,
                      style: GoogleFonts.poppins(color: const Color(0xFF1E293B), fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Icon(Icons.person_rounded, size: 14, color: Color(0xFF64748B)),
                        const SizedBox(width: 6),
                        Text(
                          teacher,
                          style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 13),
                        ),
                      ],
                    ),
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
