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
    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() {
            _attendanceMap[tId] = status;
          });
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 10),
          margin: const EdgeInsets.symmetric(horizontal: 4),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: isSelected ? color : Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: isSelected ? color : Colors.grey.shade300, width: 1.5),
            boxShadow: isSelected 
                ? [BoxShadow(color: color.withOpacity(0.35), blurRadius: 8, offset: const Offset(0, 4))] 
                : [],
          ),
          child: FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(
              label,
              style: GoogleFonts.outfit(
                fontSize: 13,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                color: isSelected ? Colors.white : Colors.grey.shade500,
              ),
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final dateStr = DateFormat('EEE, MMM d, yyyy').format(_selectedDate);

    return Scaffold(
      backgroundColor: const Color(0xFFF4F7FE),
      appBar: AppBar(
        title: Text('Mark Staff Attendance', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 22, color: Colors.white)),
        iconTheme: const IconThemeData(color: Colors.white),
        backgroundColor: Colors.transparent,
        elevation: 0,
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF6366F1), Color(0xFF8B5CF6), Color(0xFFD946EF)],
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
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(color: const Color(0xFF6366F1).withOpacity(0.08), blurRadius: 15, offset: const Offset(0, 8))
              ],
              borderRadius: const BorderRadius.only(
                bottomLeft: Radius.circular(24),
                bottomRight: Radius.circular(24),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Selected Date', style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 12, fontWeight: FontWeight.w500)),
                    Text(dateStr, style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
                  ],
                ),
                ElevatedButton.icon(
                  onPressed: () => _selectDate(context),
                  icon: const Icon(Icons.calendar_month_rounded, size: 18),
                  label: Text('Change', style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFEEF2FF),
                    foregroundColor: const Color(0xFF6366F1),
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
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

                              return Container(
                                margin: const EdgeInsets.only(bottom: 16),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(20),
                                  boxShadow: [
                                    BoxShadow(color: const Color(0xFF6366F1).withOpacity(0.06), blurRadius: 12, offset: const Offset(0, 4))
                                  ],
                                ),
                                child: Padding(
                                  padding: const EdgeInsets.all(20),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          Container(
                                            width: 48,
                                            height: 48,
                                            decoration: BoxDecoration(
                                              gradient: const LinearGradient(
                                                colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
                                                begin: Alignment.topLeft,
                                                end: Alignment.bottomRight,
                                              ),
                                              borderRadius: BorderRadius.circular(14),
                                              boxShadow: [
                                                BoxShadow(color: const Color(0xFF6366F1).withOpacity(0.3), blurRadius: 8, offset: const Offset(0, 4))
                                              ],
                                            ),
                                            alignment: Alignment.center,
                                            child: Text(name[0].toUpperCase(), style: GoogleFonts.outfit(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                                          ),
                                          const SizedBox(width: 14),
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(name, style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 17, color: const Color(0xFF1E293B))),
                                                const SizedBox(height: 2),
                                                Text('ID: $empId', style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 12, fontWeight: FontWeight.w500)),
                                              ],
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 20),
                                      // Perfectly Aligned Buttons Row
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          _buildStatusToggle(tId, 'PRESENT', 'Present', const Color(0xFF10B981)),
                                          _buildStatusToggle(tId, 'ABSENT', 'Absent', const Color(0xFFF43F5E)),
                                          _buildStatusToggle(tId, 'LATE', 'Late', const Color(0xFFF59E0B)),
                                          _buildStatusToggle(tId, 'HALF_DAY', 'Half Day', const Color(0xFF3B82F6)),
                                        ],
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
              padding: EdgeInsets.fromLTRB(16, 16, 16, 16 + MediaQuery.of(context).padding.bottom),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -5))],
              ),
              child: Container(
                width: double.infinity,
                height: 56,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(color: const Color(0xFF6366F1).withOpacity(0.4), blurRadius: 12, offset: const Offset(0, 6))
                  ]
                ),
                child: ElevatedButton.icon(
                  onPressed: _isSaving ? null : _saveAttendance,
                  icon: _isSaving ? const SizedBox() : const Icon(Icons.check_circle_rounded, color: Colors.white, size: 22),
                  label: _isSaving 
                      ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : Text('Save Attendance', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.transparent,
                    shadowColor: Colors.transparent,
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
