import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../widgets/app_drawer.dart';

class TeacherAttendanceScreen extends StatefulWidget {
  const TeacherAttendanceScreen({super.key});

  @override
  State<TeacherAttendanceScreen> createState() => _TeacherAttendanceScreenState();
}

class _TeacherAttendanceScreenState extends State<TeacherAttendanceScreen> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  
  List<dynamic> _classes = [];
  List<dynamic> _students = [];
  
  String? _selectedClassId;
  DateTime _selectedDate = DateTime.now();
  
  bool _loadingClasses = true;
  bool _loadingStudents = false;
  bool _isSubmitting = false;
  String? _errorMessage;

  // Local attendance status tracking map: studentId -> status (PRESENT / ABSENT / LATE / EXCUSED)
  final Map<String, String> _studentStatusMap = {};
  final Map<String, TextEditingController> _notesControllers = {};

  @override
  void initState() {
    super.initState();
    _fetchClasses();
  }

  @override
  void dispose() {
    _notesControllers.forEach((_, controller) => controller.dispose());
    super.dispose();
  }

  Future<void> _fetchClasses() async {
    final result = await ApiService.getClasses();
    if (mounted) {
      if (result['success']) {
        final classList = result['data'] ?? [];
        setState(() {
          _classes = classList;
          _loadingClasses = false;
          if (classList.isNotEmpty) {
            _selectedClassId = classList[0]['id'];
            _fetchStudents();
          }
        });
      } else {
        setState(() {
          _errorMessage = result['message'];
          _loadingClasses = false;
        });
      }
    }
  }

  Future<void> _fetchStudents() async {
    if (_selectedClassId == null) return;
    setState(() {
      _loadingStudents = true;
      _errorMessage = null;
      _students = [];
      _studentStatusMap.clear();
      _notesControllers.forEach((_, controller) => controller.dispose());
      _notesControllers.clear();
    });

    final dateStr = _selectedDate.toIso8601String().split('T')[0];
    final result = await ApiService.getAttendanceByClass(_selectedClassId!, dateStr);

    if (mounted) {
      if (result['success']) {
        final List<dynamic> studentList = result['data'] ?? [];
        setState(() {
          _students = studentList;
          _loadingStudents = false;
          
          // Pre-populate local status map from fetched records (if already marked)
          for (var s in studentList) {
            final studentId = s['studentId'];
            final status = s['status']?.toString().toUpperCase() ?? 'PRESENT'; // default to PRESENT
            final note = s['attendance']?['note']?.toString() ?? '';

            _studentStatusMap[studentId] = status;
            _notesControllers[studentId] = TextEditingController(text: note);
          }
        });
      } else {
        setState(() {
          _errorMessage = result['message'];
          _loadingStudents = false;
        });
      }
    }
  }

  Future<void> _selectDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2025),
      lastDate: DateTime.now(),
    );
    if (picked != null && picked != _selectedDate) {
      setState(() {
        _selectedDate = picked;
      });
      _fetchStudents();
    }
  }

  Future<void> _handleSubmit() async {
    if (_selectedClassId == null || _students.isEmpty) return;

    setState(() {
      _isSubmitting = true;
    });

    final dateStr = _selectedDate.toIso8601String().split('T')[0];
    final List<Map<String, dynamic>> records = _students.map((s) {
      final studentId = s['studentId'];
      return {
        'studentId': studentId,
        'status': _studentStatusMap[studentId] ?? 'PRESENT',
        'note': _notesControllers[studentId]?.text.trim(),
      };
    }).toList();

    final result = await ApiService.submitBulkAttendance(_selectedClassId!, dateStr, records);

    if (mounted) {
      setState(() {
        _isSubmitting = false;
      });

      if (result['success']) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Attendance saved successfully!',
              style: GoogleFonts.poppins(fontWeight: FontWeight.w600, color: const Color(0xFF1E293B)),
            ),
            backgroundColor: const Color(0xFF10B981),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          ),
        );
      } else {
        setState(() {
          _errorMessage = result['message'];
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final dateStr = '${_selectedDate.day}/${_selectedDate.month}/${_selectedDate.year}';

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: const Color(0xFFF4F7FE), // Match theme
      drawer: const AppDrawer(currentRoute: 'attendance'),
      appBar: AppBar(
        leading: const BackButton(),
        title: Text(
          'Mark Attendance',
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white),
        ),
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
      ),
      body: _loadingClasses
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF6366F1)))
          : Column(
              children: [
                // Top Filtering Bar (Glass card style)
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    border: Border(bottom: BorderSide(color: const Color(0xFFE2E8F0))),
                  ),
                  child: Row(
                    children: [
                      // Class Selector
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                          ),
                          child: DropdownButtonHideUnderline(
                            child: DropdownButton<String>(
                              value: _selectedClassId,
                              dropdownColor: const Color(0xFFE2E8F0),
                              style: GoogleFonts.poppins(color: const Color(0xFF1E293B), fontWeight: FontWeight.w600),
                              icon: const Icon(Icons.arrow_drop_down, color: const Color(0xFF475569)),
                              items: _classes.map<DropdownMenuItem<String>>((c) {
                                return DropdownMenuItem<String>(
                                  value: c['id'],
                                  child: Text('${c['name']}-${c['section']}'),
                                );
                              }).toList(),
                              onChanged: (value) {
                                setState(() {
                                  _selectedClassId = value;
                                });
                                _fetchStudents();
                              },
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 14),
                      // Date Picker Trigger
                      InkWell(
                        onTap: _selectDate,
                        borderRadius: BorderRadius.circular(14),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.calendar_today_rounded, color: Color(0xFF818CF8), size: 18),
                              const SizedBox(width: 10),
                              Text(
                                dateStr,
                                style: GoogleFonts.poppins(
                                  color: const Color(0xFF1E293B),
                                  fontWeight: FontWeight.w600,
                                  fontSize: 14,
                                ),
                              ),
                            ],
                          ),
                        ),
                      )
                    ],
                  ),
                ),
                
                // Student list display area
                Expanded(
                  child: _loadingStudents
                      ? const Center(child: CircularProgressIndicator(color: Color(0xFF6366F1)))
                      : _errorMessage != null
                          ? Center(
                              child: Text(
                                _errorMessage!,
                                style: GoogleFonts.poppins(color: const Color(0xFF475569)),
                              ),
                            )
                          : _students.isEmpty
                              ? Center(
                                  child: Text(
                                    'No students enrolled in this class.',
                                    style: GoogleFonts.poppins(color: const Color(0xFF475569)),
                                  ),
                                )
                              : ListView.builder(
                                  padding: const EdgeInsets.all(20),
                                  itemCount: _students.length,
                                  itemBuilder: (context, index) {
                                    final s = _students[index];
                                    final studentId = s['studentId'];
                                    final name = s['name'] ?? 'Student';
                                    final rollNo = s['rollNo'] ?? '-';
                                    final currentStatus = _studentStatusMap[studentId] ?? 'PRESENT';

                                    return Container(
                                      margin: const EdgeInsets.only(bottom: 16),
                                      padding: const EdgeInsets.all(16),
                                      decoration: BoxDecoration(
                                        color: Colors.white,
                                        borderRadius: BorderRadius.circular(20),
                                        border: Border.all(color: const Color(0xFFE2E8F0)),
                                      ),
                                      child: Column(
                                        children: [
                                          Row(
                                            children: [
                                              // Avatar
                                              CircleAvatar(
                                                backgroundColor: const Color(0xFF6366F1).withOpacity(0.15),
                                                child: Text(
                                                  name.isNotEmpty ? name[0].toUpperCase() : 'S',
                                                  style: GoogleFonts.outfit(
                                                    color: const Color(0xFF818CF8),
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                                ),
                                              ),
                                              const SizedBox(width: 14),
                                              // Student Name
                                              Expanded(
                                                child: Column(
                                                  crossAxisAlignment: CrossAxisAlignment.start,
                                                  children: [
                                                    Text(
                                                      name,
                                                      style: GoogleFonts.outfit(
                                                        color: const Color(0xFF1E293B),
                                                        fontSize: 15,
                                                        fontWeight: FontWeight.bold,
                                                      ),
                                                    ),
                                                    Text(
                                                      'Roll No: $rollNo',
                                                      style: GoogleFonts.poppins(
                                                        color: const Color(0xFF475569),
                                                        fontSize: 12,
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 14),
                                          
                                          // Status Buttons Row
                                          Row(
                                            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                                            children: [
                                              _buildStatusBtn(studentId, 'PRESENT', const Color(0xFF10B981)),
                                              _buildStatusBtn(studentId, 'ABSENT', const Color(0xFFEF4444)),
                                              _buildStatusBtn(studentId, 'LATE', const Color(0xFFF59E0B)),
                                            ],
                                          ),
                                        ],
                                      ),
                                    );
                                  },
                                ),
                ),

                // Submit Button
                if (_students.isNotEmpty && !_loadingStudents)
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: const Color(0xFFE2E8F0),
                      border: Border(top: BorderSide(color: const Color(0xFFE2E8F0))),
                    ),
                    child: Container(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF6366F1).withOpacity(0.3),
                            blurRadius: 15,
                            offset: const Offset(0, 4),
                          )
                        ],
                      ),
                      child: ElevatedButton(
                        onPressed: _isSubmitting ? null : _handleSubmit,
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          backgroundColor: Colors.transparent,
                          shadowColor: Colors.transparent,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                        child: Ink(
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFF6366F1), Color(0xFFD946EF)],
                            ),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Container(
                            alignment: Alignment.center,
                            height: 54,
                            child: _isSubmitting
                                ? const SizedBox(
                                    height: 24,
                                    width: 24,
                                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                                  )
                                : Text(
                                    'Submit Attendance',
                                    style: GoogleFonts.poppins(
                                      color: const Color(0xFF1E293B),
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                          ),
                        ),
                      ),
                    ),
                  )
              ],
            ),
    );
  }

  Widget _buildStatusBtn(String studentId, String status, Color color) {
    final isSelected = _studentStatusMap[studentId] == status;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() {
            _studentStatusMap[studentId] = status;
          });
        },
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 6),
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isSelected ? color.withOpacity(0.15) : Colors.white,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: isSelected ? color : const Color(0xFFE2E8F0),
              width: 1.2,
            ),
          ),
          child: Text(
            status,
            textAlign: TextAlign.center,
            style: GoogleFonts.poppins(
              color: isSelected ? color : const Color(0xFF64748B),
              fontSize: 12,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
            ),
          ),
        ),
      ),
    );
  }
}


