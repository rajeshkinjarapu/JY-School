import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';

class MarkStaffAttendanceScreen extends StatefulWidget {
  const MarkStaffAttendanceScreen({super.key});

  @override
  State<MarkStaffAttendanceScreen> createState() => _MarkStaffAttendanceScreenState();
}

class _MarkStaffAttendanceScreenState extends State<MarkStaffAttendanceScreen> {
  DateTime _selectedDate = DateTime.now();
  bool _isLoading = true;
  bool _isSaving = false;
  String? _errorMessage;

  List<dynamic> _teachers = [];
  // Map of teacherId -> Status String
  final Map<String, String> _attendanceMap = {};
  // Map of teacherId -> Notes TextEditingController
  final Map<String, TextEditingController> _notesControllers = {};

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  @override
  void dispose() {
    for (var ctrl in _notesControllers.values) {
      ctrl.dispose();
    }
    super.dispose();
  }

  Future<void> _fetchData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final dateStr = DateFormat('yyyy-MM-dd').format(_selectedDate);
      
      final results = await Future.wait([
        ApiService.getTeachers(),
        ApiService.getTeacherAttendance(date: dateStr),
      ]);

      final teachersRes = results[0];
      final attendanceRes = results[1];

      if (teachersRes['success']) {
        _teachers = teachersRes['data'] ?? [];
        
        // Initialize all to PRESENT by default
        for (var t in _teachers) {
          final tId = t['id'].toString();
          _attendanceMap[tId] = 'PRESENT';
          if (!_notesControllers.containsKey(tId)) {
            _notesControllers[tId] = TextEditingController();
          } else {
            _notesControllers[tId]!.text = '';
          }
        }

        // Apply any existing attendance records
        if (attendanceRes['success']) {
          final List<dynamic> records = attendanceRes['data'] ?? [];
          for (var r in records) {
            final tId = r['teacherId']?.toString();
            if (tId != null && _attendanceMap.containsKey(tId)) {
              _attendanceMap[tId] = r['status']?.toString().toUpperCase() ?? 'PRESENT';
              _notesControllers[tId]!.text = r['note'] ?? '';
            }
          }
        }

        setState(() {
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = teachersRes['message'] ?? 'Failed to load staff list';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'An error occurred: $e';
        _isLoading = false;
      });
    }
  }

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: Color(0xFF6366F1), // header background color
              onPrimary: Colors.white, // header text color
              onSurface: Colors.black, // body text color
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null && picked != _selectedDate) {
      setState(() {
        _selectedDate = picked;
      });
      _fetchData();
    }
  }

  Future<void> _saveAttendance() async {
    setState(() => _isSaving = true);

    final records = _teachers.map((t) {
      final tId = t['id'].toString();
      return {
        'teacherId': tId,
        'status': _attendanceMap[tId],
        'note': _notesControllers[tId]!.text.trim()
      };
    }).toList();

    final payload = {
      'date': DateFormat('yyyy-MM-dd').format(_selectedDate),
      'records': records,
    };

    final res = await ApiService.bulkMarkTeacherAttendance(payload);

    setState(() => _isSaving = false);

    if (mounted) {
      if (res['success']) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Staff attendance saved successfully!'), backgroundColor: Colors.green),
        );
        Navigator.pop(context);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(res['message'] ?? 'Failed to save'), backgroundColor: Colors.red),
        );
      }
    }
  }

  Widget _buildStatusToggle(String tId, String status, String label, Color color) {
    final isSelected = _attendanceMap[tId] == status;
    return GestureDetector(
      onTap: () {
        setState(() {
          _attendanceMap[tId] = status;
        });
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        margin: const EdgeInsets.only(right: 8),
        decoration: BoxDecoration(
          color: isSelected ? color : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isSelected ? color : Colors.grey.shade300),
        ),
        child: Text(
          label,
          style: GoogleFonts.poppins(
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
            color: isSelected ? Colors.white : Colors.grey.shade600,
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final dateStr = DateFormat('EEE, MMM d, yyyy').format(_selectedDate);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text('Mark Staff Attendance', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white)),
        iconTheme: const IconThemeData(color: Colors.white),
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF6366F1), Color(0xFF4F46E5)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
      ),
      body: Column(
        children: [
          // Date selector bar
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.white,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Date', style: GoogleFonts.poppins(color: Colors.grey, fontSize: 12)),
                    Text(dateStr, style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
                  ],
                ),
                ElevatedButton.icon(
                  onPressed: () => _selectDate(context),
                  icon: const Icon(Icons.calendar_month_rounded, size: 18),
                  label: const Text('Change'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFEEF2FF),
                    foregroundColor: const Color(0xFF4F46E5),
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ],
            ),
          ),
          
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _errorMessage != null
                    ? Center(child: Text(_errorMessage!, style: const TextStyle(color: Colors.red)))
                    : _teachers.isEmpty
                        ? Center(child: Text('No staff found', style: GoogleFonts.poppins()))
                        : ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: _teachers.length,
                            itemBuilder: (context, index) {
                              final t = _teachers[index];
                              final tId = t['id'].toString();
                              final name = t['user'] != null ? t['user']['name'] : 'Unknown';
                              final empId = t['employeeId'] ?? 'N/A';
                              final isAbsentOrLate = _attendanceMap[tId] != 'PRESENT';

                              return Card(
                                margin: const EdgeInsets.only(bottom: 16),
                                elevation: 0,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(16),
                                  side: BorderSide(color: Colors.grey.shade200)
                                ),
                                child: Padding(
                                  padding: const EdgeInsets.all(16),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          CircleAvatar(
                                            backgroundColor: const Color(0xFFEEF2FF),
                                            child: Text(name[0].toUpperCase(), style: const TextStyle(color: Color(0xFF4F46E5), fontWeight: FontWeight.bold)),
                                          ),
                                          const SizedBox(width: 12),
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(name, style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16)),
                                                Text('ID: $empId', style: GoogleFonts.poppins(color: Colors.grey, fontSize: 12)),
                                              ],
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 16),
                                      SingleChildScrollView(
                                        scrollDirection: Axis.horizontal,
                                        child: Row(
                                          children: [
                                            _buildStatusToggle(tId, 'PRESENT', 'Present', const Color(0xFF10B981)),
                                            _buildStatusToggle(tId, 'ABSENT', 'Absent', const Color(0xFFEF4444)),
                                            _buildStatusToggle(tId, 'LATE', 'Late', const Color(0xFFF59E0B)),
                                            _buildStatusToggle(tId, 'HALF_DAY', 'Half Day', const Color(0xFF3B82F6)),
                                          ],
                                        ),
                                      ),
                                      if (isAbsentOrLate) ...[
                                        const SizedBox(height: 12),
                                        TextField(
                                          controller: _notesControllers[tId],
                                          decoration: InputDecoration(
                                            hintText: 'Reason / Note (Optional)',
                                            hintStyle: GoogleFonts.poppins(fontSize: 12),
                                            isDense: true,
                                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                            filled: true,
                                            fillColor: const Color(0xFFF8FAFC),
                                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                                          ),
                                          style: GoogleFonts.poppins(fontSize: 13),
                                        ),
                                      ]
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
          ),
          
          if (!_isLoading && _teachers.isNotEmpty)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -5))],
              ),
              child: SizedBox(
                width: double.infinity,
                height: 54,
                child: ElevatedButton.icon(
                  onPressed: _isSaving ? null : _saveAttendance,
                  icon: _isSaving ? const SizedBox() : const Icon(Icons.check_circle_rounded, color: Colors.white),
                  label: _isSaving 
                      ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : Text('Save Attendance', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF4F46E5),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
