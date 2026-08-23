import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';

class StaffAttendanceReportScreen extends StatefulWidget {
  const StaffAttendanceReportScreen({super.key});

  @override
  State<StaffAttendanceReportScreen> createState() => _StaffAttendanceReportScreenState();
}

class _StaffAttendanceReportScreenState extends State<StaffAttendanceReportScreen> {
  int _selectedMonth = DateTime.now().month;
  int _selectedYear = DateTime.now().year;
  
  bool _isLoading = true;
  String? _errorMessage;
  
  // Group records by Teacher ID -> Map of Date -> Status
  Map<String, Map<String, dynamic>> _teacherRecords = {};
  List<dynamic> _teachers = [];

  final List<String> _months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  @override
  void initState() {
    super.initState();
    _fetchReport();
  }

  Future<void> _fetchReport() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final results = await Future.wait([
        ApiService.getTeachers(),
        ApiService.getTeacherAttendance(month: _selectedMonth, year: _selectedYear),
      ]);

      final teachersRes = results[0];
      final attRes = results[1];

      if (teachersRes['success'] && attRes['success']) {
        _teachers = teachersRes['data'] ?? [];
        final List<dynamic> records = attRes['data'] ?? [];

        // Build a matrix mapping teacher ID -> { date: status }
        _teacherRecords = {};
        for (var t in _teachers) {
          _teacherRecords[t['id'].toString()] = {};
        }

        for (var r in records) {
          final tId = r['teacherId']?.toString();
          final dateStr = r['date']?.toString().split('T')[0]; // yyyy-MM-dd
          if (tId != null && dateStr != null) {
            if (!_teacherRecords.containsKey(tId)) {
              _teacherRecords[tId] = {};
            }
            _teacherRecords[tId]![dateStr] = r;
          }
        }

        setState(() {
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = 'Failed to load report data';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Error loading report: $e';
        _isLoading = false;
      });
    }
  }

  void _previousMonth() {
    setState(() {
      if (_selectedMonth == 1) {
        _selectedMonth = 12;
        _selectedYear--;
      } else {
        _selectedMonth--;
      }
    });
    _fetchReport();
  }

  void _nextMonth() {
    setState(() {
      if (_selectedMonth == 12) {
        _selectedMonth = 1;
        _selectedYear++;
      } else {
        _selectedMonth++;
      }
    });
    _fetchReport();
  }

  Map<String, int> _calculateStats(String teacherId) {
    int present = 0;
    int absent = 0;
    int late = 0;
    int half = 0;

    final records = _teacherRecords[teacherId] ?? {};
    for (var r in records.values) {
      final status = r['status']?.toString().toUpperCase();
      if (status == 'PRESENT') present++;
      if (status == 'ABSENT') absent++;
      if (status == 'LATE') late++;
      if (status == 'HALF_DAY') half++;
    }

    return {'present': present, 'absent': absent, 'late': late, 'half': half};
  }

  void _showTeacherDetails(Map<String, dynamic> teacher, Map<String, int> stats) {
    final tId = teacher['id'].toString();
    final name = teacher['user']?['name'] ?? 'Unknown';
    final records = _teacherRecords[tId] ?? {};
    
    // Sort records by date descending
    final sortedDates = records.keys.toList()..sort((a, b) => b.compareTo(a));

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.85,
        decoration: const BoxDecoration(
          color: Color(0xFFF8FAFC),
          borderRadius: BorderRadius.only(topLeft: Radius.circular(24), topRight: Radius.circular(24)),
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: const BorderRadius.only(topLeft: Radius.circular(24), topRight: Radius.circular(24)),
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 5))],
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 24,
                    backgroundColor: const Color(0xFFEEF2FF),
                    child: Text(name[0].toUpperCase(), style: GoogleFonts.outfit(color: const Color(0xFF4F46E5), fontSize: 20, fontWeight: FontWeight.bold)),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(name, style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold)),
                        Text('${_months[_selectedMonth-1]} $_selectedYear Summary', style: GoogleFonts.poppins(color: Colors.grey, fontSize: 13)),
                      ],
                    ),
                  ),
                  IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
                ],
              ),
            ),
            
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  _buildMiniStat('Present', stats['present']!, const Color(0xFF10B981)),
                  const SizedBox(width: 8),
                  _buildMiniStat('Absent', stats['absent']!, const Color(0xFFEF4444)),
                  const SizedBox(width: 8),
                  _buildMiniStat('Late', stats['late']!, const Color(0xFFF59E0B)),
                ],
              ),
            ),

            Expanded(
              child: records.isEmpty 
                  ? Center(child: Text('No attendance recorded for this month.', style: GoogleFonts.poppins(color: Colors.grey)))
                  : ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: sortedDates.length,
                      itemBuilder: (context, i) {
                        final dateStr = sortedDates[i];
                        final r = records[dateStr];
                        final status = r['status']?.toString().toUpperCase() ?? 'PRESENT';
                        final note = r['note'];
                        
                        Color sColor = const Color(0xFF10B981);
                        if(status == 'ABSENT') sColor = const Color(0xFFEF4444);
                        if(status == 'LATE') sColor = const Color(0xFFF59E0B);
                        if(status == 'HALF_DAY') sColor = const Color(0xFF3B82F6);

                        return Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
                          child: Row(
                            children: [
                              Container(
                                width: 48, height: 48,
                                decoration: BoxDecoration(color: sColor.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
                                child: Center(child: Text(dateStr.split('-').last, style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16, color: sColor))),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(DateFormat('EEEE').format(DateTime.parse(dateStr)), style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 14)),
                                    if(note != null && note.isNotEmpty) Text(note, style: GoogleFonts.poppins(fontSize: 12, color: Colors.grey)),
                                  ],
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(color: sColor, borderRadius: BorderRadius.circular(20)),
                                child: Text(status, style: GoogleFonts.poppins(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                              )
                            ],
                          ),
                        );
                      }
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMiniStat(String label, int value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
        child: Column(
          children: [
            Text(value.toString(), style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold, color: color)),
            Text(label, style: GoogleFonts.poppins(fontSize: 12, color: color, fontWeight: FontWeight.w500)),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F7FE),
      appBar: AppBar(
        title: Text('Monthly HR Report', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 22, color: Colors.white)),
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
          // Month Selector
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
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
                Container(
                  decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(12)),
                  child: IconButton(
                    icon: const Icon(Icons.arrow_back_ios_rounded, size: 18, color: Color(0xFF64748B)),
                    onPressed: _previousMonth,
                  ),
                ),
                Text('${_months[_selectedMonth - 1]} $_selectedYear', style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
                Container(
                  decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(12)),
                  child: IconButton(
                    icon: const Icon(Icons.arrow_forward_ios_rounded, size: 18, color: Color(0xFF64748B)),
                    onPressed: _nextMonth,
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
                        ? const Center(child: Text('No staff found'))
                        : ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: _teachers.length,
                            itemBuilder: (context, index) {
                              final t = _teachers[index];
                              final tId = t['id'].toString();
                              final name = t['user']?['name'] ?? 'Unknown';
                              final stats = _calculateStats(tId);
                              
                              final totalDays = stats['present']! + stats['absent']! + stats['late']! + stats['half']!;
                              final attRate = totalDays > 0 ? ((stats['present']! + stats['half']! * 0.5) / totalDays * 100) : 0.0;

                              return Container(
                                margin: const EdgeInsets.only(bottom: 16),
                                child: InkWell(
                                  onTap: () => _showTeacherDetails(t, stats),
                                  borderRadius: BorderRadius.circular(20),
                                  child: Ink(
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(20),
                                      boxShadow: [
                                        BoxShadow(color: const Color(0xFF6366F1).withOpacity(0.06), blurRadius: 12, offset: const Offset(0, 4))
                                      ],
                                    ),
                                    padding: const EdgeInsets.all(20),
                                    child: Column(
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
                                            const SizedBox(width: 16),
                                            Expanded(
                                              child: Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  Text(name, style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 17, color: const Color(0xFF1E293B))),
                                                  const SizedBox(height: 2),
                                                  Text('ID: ${t['employeeId'] ?? 'N/A'}', style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 12, fontWeight: FontWeight.w500)),
                                                ],
                                              ),
                                            ),
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                              decoration: BoxDecoration(
                                                color: attRate >= 80 ? const Color(0xFF10B981).withOpacity(0.1) : const Color(0xFFF59E0B).withOpacity(0.1),
                                                borderRadius: BorderRadius.circular(20),
                                                border: Border.all(color: attRate >= 80 ? const Color(0xFF10B981).withOpacity(0.2) : const Color(0xFFF59E0B).withOpacity(0.2)),
                                              ),
                                              child: Text('${attRate.toStringAsFixed(0)}%', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, color: attRate >= 80 ? const Color(0xFF10B981) : const Color(0xFFF59E0B), fontSize: 12)),
                                            )
                                          ],
                                        ),
                                        const SizedBox(height: 20),
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            _buildMiniStatItem('Present', stats['present'].toString(), const Color(0xFF10B981), const Color(0xFFF0FDF4)),
                                            _buildMiniStatItem('Absent', stats['absent'].toString(), const Color(0xFFF43F5E), const Color(0xFFFFF1F2)),
                                            _buildMiniStatItem('Late', stats['late'].toString(), const Color(0xFFF59E0B), const Color(0xFFFFFBEB)),
                                            _buildMiniStatItem('Half', stats['half'].toString(), const Color(0xFF3B82F6), const Color(0xFFEFF6FF)),
                                          ],
                                        )
                                      ],
                                    ),
                                  ),
                                ),
                              );
                            },
                          ),
          ),
        ],
      ),
    );
  }

  Widget _buildMiniStatItem(String label, String val, Color color, Color bgColor) {
    return Expanded(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 4),
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withOpacity(0.2)),
        ),
        child: Column(
          children: [
            Text(val, style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: color)),
            const SizedBox(height: 2),
            Text(label, style: GoogleFonts.poppins(fontSize: 11, color: color.withOpacity(0.8), fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }
}
