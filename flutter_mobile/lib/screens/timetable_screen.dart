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
      
      // If student, use their classId
      if (_userRole == 'STUDENT') {
        _selectedClassId = user['student']?['classId'];
        if (_selectedClassId == null) {
          setState(() {
            _errorMessage = 'Class details not found for this profile';
            _isLoading = false;
          });
          return;
        }
      } else {
        // Admin or Teacher, fetch classes if not fetched
        if (_classes.isEmpty) {
          final classesResult = await ApiService.getClasses(limit: 100);
          if (classesResult['success']) {
            _classes = classesResult['data'] ?? [];
            if (_classes.isNotEmpty && _selectedClassId == null) {
              _selectedClassId = _classes.first['id'];
            }
          }
        }
      }

      if (_selectedClassId == null) {
        setState(() {
          _errorMessage = 'Please select a class';
          _isLoading = false;
        });
        return;
      }

      setState(() => _isLoading = true);
      final result = await ApiService.getTimetable(_selectedClassId!);

      if (mounted) {
        if (result['success']) {
          setState(() {
            _timetable = result['data'] ?? {};
            _errorMessage = null;
            _isLoading = false;
          });
        } else {
          setState(() {
            _errorMessage = result['message'];
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F7FE), // Premium dark theme
      drawer: const AppDrawer(currentRoute: 'timetable'),
      appBar: AppBar(
        leading: const BackButton(),
        title: Text(
          'Class Timetable',
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold),
        ),
        backgroundColor: const Color(0xFFE2E8F0),
        foregroundColor: Colors.white,
        elevation: 0,
        bottom: PreferredSize(
          preferredSize: Size.fromHeight(_userRole != 'STUDENT' ? 100 : 50),
          child: Column(
            children: [
              if (_userRole != 'STUDENT')
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      isExpanded: true,
                      value: _selectedClassId,
                      icon: const Icon(Icons.keyboard_arrow_down, color: Color(0xFF6366F1)),
                      style: GoogleFonts.outfit(color: const Color(0xFF1E293B), fontWeight: FontWeight.w600),
                      items: _classes.map((dynamic classItem) {
                        return DropdownMenuItem<String>(
                          value: classItem['id'],
                          child: Text('${classItem['name']} ${classItem['section'] ?? ''}'.trim()),
                        );
                      }).toList(),
                      onChanged: (String? newValue) {
                        if (newValue != null) {
                          setState(() {
                            _selectedClassId = newValue;
                          });
                          _fetchTimetable();
                        }
                      },
                    ),
                  ),
                ),
              TabBar(
                controller: _dayTabController,
                isScrollable: true,
                labelColor: const Color(0xFF818CF8),
                unselectedLabelColor: const Color(0xFF94A3B8),
                indicatorColor: const Color(0xFF818CF8),
                tabs: _days.map((day) => Tab(text: day.substring(0, 3))).toList(),
              ),
            ],
          ),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF6366F1)))
          : _errorMessage != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.error_outline, size: 60, color: Colors.redAccent),
                        const SizedBox(height: 16),
                        Text(
                          _errorMessage!,
                          textAlign: TextAlign.center,
                          style: GoogleFonts.poppins(fontSize: 16, color: Colors.blueGrey.shade400),
                        ),
                        const SizedBox(height: 20),
                        ElevatedButton(
                          onPressed: () {
                            setState(() {
                              _isLoading = true;
                              _errorMessage = null;
                            });
                            _fetchTimetable();
                          },
                          child: const Text('Retry'),
                        )
                      ],
                    ),
                  ),
                )
              : TabBarView(
                  controller: _dayTabController,
                  children: _days.map((day) {
                    final List<dynamic> slots = _timetable[day] ?? [];
                    
                    // Sort slots by period number
                    slots.sort((a, b) => (a['periodNumber'] ?? 0).compareTo(b['periodNumber'] ?? 0));

                    return RefreshIndicator(
                      onRefresh: _fetchTimetable,
                      child: slots.isEmpty
                          ? Center(
                              child: Text(
                                'No classes scheduled for $day.',
                                style: GoogleFonts.poppins(color: const Color(0xFF94A3B8), fontSize: 16),
                              ),
                            )
                          : ListView.builder(
                              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
                              itemCount: slots.length,
                              itemBuilder: (context, index) {
                                final slot = slots[index];
                                final period = slot['periodNumber'] ?? (index + 1);
                                final startTime = slot['startTime'] ?? '--:--';
                                final endTime = slot['endTime'] ?? '--:--';
                                final subjectName = slot['subject']?['name'] ?? 'Subject';
                                final teacherName = slot['teacher']?['user']?['name'] ?? 'Teacher';
                                final room = slot['room']?.toString() ?? 'N/A';

                                return IntrinsicHeight(
                                  child: Row(
                                    crossAxisAlignment: CrossAxisAlignment.stretch,
                                    children: [
                                      // Time side column
                                      SizedBox(
                                        width: 70,
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.end,
                                          children: [
                                            Text(
                                              startTime,
                                              style: GoogleFonts.poppins(
                                                color: const Color(0xFF475569),
                                                fontSize: 14,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                            Text(
                                              endTime,
                                              style: GoogleFonts.poppins(
                                                color: const Color(0xFF94A3B8),
                                                fontSize: 11,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      
                                      // Timeline Connector Indicator
                                      _buildTimelineConnector(index, slots.length),
                                      
                                      // Class card info
                                      Expanded(
                                        child: Container(
                                          margin: const EdgeInsets.only(bottom: 24),
                                          padding: const EdgeInsets.all(18),
                                          decoration: BoxDecoration(
                                            color: Colors.white,
                                            borderRadius: BorderRadius.circular(20),
                                            border: Border.all(color: const Color(0xFFE2E8F0)),
                                            boxShadow: [
                                              BoxShadow(
                                                color: Colors.black.withOpacity(0.02),
                                                blurRadius: 8,
                                                offset: const Offset(0, 4),
                                              )
                                            ]
                                          ),
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Row(
                                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                                children: [
                                                  Expanded(
                                                    child: Text(
                                                      subjectName,
                                                      style: GoogleFonts.outfit(
                                                        color: const Color(0xFF1E293B),
                                                        fontSize: 16,
                                                        fontWeight: FontWeight.bold,
                                                      ),
                                                    ),
                                                  ),
                                                  Container(
                                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                                    decoration: BoxDecoration(
                                                      color: const Color(0xFF6366F1).withOpacity(0.1),
                                                      borderRadius: BorderRadius.circular(8),
                                                    ),
                                                    child: Text(
                                                      'Period $period',
                                                      style: GoogleFonts.poppins(
                                                        color: const Color(0xFF818CF8),
                                                        fontSize: 11,
                                                        fontWeight: FontWeight.bold,
                                                      ),
                                                    ),
                                                  )
                                                ],
                                              ),
                                              const SizedBox(height: 6),
                                              Row(
                                                children: [
                                                  const Icon(Icons.person_outline_rounded, color: Color(0xFF94A3B8), size: 14),
                                                  const SizedBox(width: 6),
                                                  Text(
                                                    teacherName,
                                                    style: GoogleFonts.poppins(
                                                      color: const Color(0xFF64748B),
                                                      fontSize: 13,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                              const SizedBox(height: 4),
                                              Row(
                                                children: [
                                                  const Icon(Icons.meeting_room_outlined, color: Color(0xFF94A3B8), size: 14),
                                                  const SizedBox(width: 6),
                                                  Text(
                                                    'Room: $room',
                                                    style: GoogleFonts.poppins(
                                                      color: const Color(0xFF64748B),
                                                      fontSize: 13,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ],
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                );
                              },
                            ),
                    );
                  }).toList(),
                ),
    );
  }

  Widget _buildTimelineConnector(int index, int total) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: Column(
        children: [
          // Period Dot
          Container(
            width: 14,
            height: 14,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: const Color(0xFF818CF8),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF6366F1).withOpacity(0.4),
                  blurRadius: 6,
                  spreadRadius: 1,
                )
              ],
            ),
          ),
          // Vertical Line
          Expanded(
            child: index == total - 1
                ? const SizedBox.shrink()
                : Container(
                    width: 2,
                    color: const Color(0xFFE2E8F0),
                  ),
          ),
        ],
      ),
    );
  }
}
