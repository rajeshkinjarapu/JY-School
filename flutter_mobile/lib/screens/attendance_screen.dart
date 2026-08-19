import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';
import '../widgets/app_drawer.dart';

class AttendanceScreen extends StatefulWidget {
  const AttendanceScreen({super.key});

  @override
  State<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends State<AttendanceScreen> {
  List<dynamic> _attendanceRecords = [];
  bool _isLoading = true;
  String? _errorMessage;
  
  int _totalDays = 0;
  int _presentDays = 0;
  int _absentDays = 0;
  int _lateDays = 0;
  int _excusedDays = 0;
  double _percentage = 0.0;

  @override
  void initState() {
    super.initState();
    _fetchAttendance();
  }

  Future<void> _fetchAttendance() async {
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
      final studentId = user['student']?['id'];
      if (studentId == null) {
        setState(() {
          _errorMessage = 'Student profile information not found';
          _isLoading = false;
        });
        return;
      }

      final result = await ApiService.getAttendance(studentId);

      if (mounted) {
        if (result['success']) {
          final List<dynamic> records = result['data'] ?? [];
          setState(() {
            _attendanceRecords = records;
            _calculateSummary(records);
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

  void _calculateSummary(List<dynamic> records) {
    _totalDays = records.length;
    _presentDays = 0;
    _absentDays = 0;
    _lateDays = 0;
    _excusedDays = 0;

    for (var r in records) {
      final status = r['status']?.toString().toUpperCase();
      if (status == 'PRESENT') {
        _presentDays++;
      } else if (status == 'ABSENT') {
        _absentDays++;
      } else if (status == 'LATE') {
        _lateDays++;
      } else if (status == 'EXCUSED') {
        _excusedDays++;
      }
    }

    // Present + Late + Excused usually counts as non-absent
    // Here we count Present and Late (maybe part-present) for calculation
    final effectivePresent = _presentDays + _lateDays;
    _percentage = _totalDays > 0 ? (effectivePresent / _totalDays) * 100 : 0.0;
  }

  Color _getStatusColor(String status) {
    switch (status.toUpperCase()) {
      case 'PRESENT':
        return const Color(0xFF10B981); // Emerald Green
      case 'ABSENT':
        return const Color(0xFFEF4444); // Red
      case 'LATE':
        return const Color(0xFFF59E0B); // Amber/Orange
      case 'EXCUSED':
        return const Color(0xFF3B82F6); // Blue
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      drawer: const AppDrawer(currentRoute: 'attendance'),
      appBar: AppBar(
        leading: const BackButton(),
        title: const Text(
          'My Attendance',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.white,
        foregroundColor: Colors.blueGrey.shade800,
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
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
                          style: const TextStyle(fontSize: 16, color: Colors.blueGrey),
                        ),
                        const SizedBox(height: 20),
                        ElevatedButton(
                          onPressed: () {
                            setState(() {
                              _isLoading = true;
                              _errorMessage = null;
                            });
                            _fetchAttendance();
                          },
                          child: const Text('Retry'),
                        )
                      ],
                    ),
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _fetchAttendance,
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(20.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Radial Progress & Percent Card
                        _buildPercentageCard(),
                        const SizedBox(height: 24),
                        
                        // Summary Stats Grid
                        const Text(
                          'Summary',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF1E293B),
                          ),
                        ),
                        const SizedBox(height: 12),
                        _buildSummaryStatsGrid(),
                        const SizedBox(height: 28),

                        // History Header
                        const Text(
                          'Attendance History',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF1E293B),
                          ),
                        ),
                        const SizedBox(height: 12),

                        // List of Records
                        _attendanceRecords.isEmpty
                            ? const Center(
                                child: Padding(
                                  padding: EdgeInsets.symmetric(vertical: 40.0),
                                  child: Text(
                                    'No attendance records found.',
                                    style: TextStyle(color: Colors.grey),
                                  ),
                                ),
                              )
                            : ListView.builder(
                                shrinkWrap: true,
                                physics: const NeverScrollableScrollPhysics(),
                                itemCount: _attendanceRecords.length,
                                itemBuilder: (context, index) {
                                  final record = _attendanceRecords[index];
                                  final dateStr = record['date']?.toString().split('T')[0] ?? 'N/A';
                                  final status = record['status']?.toString() ?? 'N/A';
                                  final note = record['note']?.toString();

                                  return Card(
                                    elevation: 0,
                                    margin: const EdgeInsets.only(bottom: 12),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(16),
                                      side: BorderSide(color: Colors.blueGrey.shade100),
                                    ),
                                    child: ListTile(
                                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                      title: Text(
                                        dateStr,
                                        style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                          color: Color(0xFF1E293B),
                                        ),
                                      ),
                                      subtitle: note != null && note.isNotEmpty
                                          ? Text(
                                              note,
                                              style: TextStyle(color: Colors.blueGrey.shade500, fontSize: 13),
                                            )
                                          : null,
                                      trailing: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                                        decoration: BoxDecoration(
                                          color: _getStatusColor(status).withOpacity(0.12),
                                          borderRadius: BorderRadius.circular(30),
                                        ),
                                        child: Text(
                                          status.toUpperCase(),
                                          style: TextStyle(
                                            color: _getStatusColor(status),
                                            fontSize: 12,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                    ),
                                  );
                                },
                              ),
                      ],
                    ),
                  ),
                ),
    );
  }

  Widget _buildPercentageCard() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.blueGrey.shade100),
      ),
      child: Row(
        children: [
          // Circular Progress Indicator
          Stack(
            alignment: Alignment.center,
            children: [
              SizedBox(
                width: 85,
                height: 85,
                child: CircularProgressIndicator(
                  value: _percentage / 100,
                  backgroundColor: Colors.blueGrey.shade100,
                  color: _percentage >= 75 ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                  strokeWidth: 9,
                  strokeCap: StrokeCap.round,
                ),
              ),
              Text(
                '${_percentage.toStringAsFixed(0)}%',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ],
          ),
          const SizedBox(width: 24),
          // Info Column
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Attendance Rate',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  _percentage >= 75
                      ? 'Your attendance is good! Keep it up.'
                      : 'Maintain at least 75% attendance to avoid penalties.',
                  style: TextStyle(
                    fontSize: 13,
                    color: _percentage >= 75 ? const Color(0xFF047857) : const Color(0xFFB45309),
                  ),
                ),
              ],
            ),
          )
        ],
      ),
    );
  }

  Widget _buildSummaryStatsGrid() {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      crossAxisSpacing: 14,
      mainAxisSpacing: 14,
      childAspectRatio: 2.2,
      children: [
        _buildStatTile('Total Classes', '$_totalDays', Colors.indigo, Icons.calendar_month_rounded),
        _buildStatTile('Present', '$_presentDays', const Color(0xFF10B981), Icons.check_circle_outline_rounded),
        _buildStatTile('Absent', '$_absentDays', const Color(0xFFEF4444), Icons.cancel_outlined),
        _buildStatTile('Late', '$_lateDays', const Color(0xFFF59E0B), Icons.watch_later_outlined),
      ],
    );
  }

  Widget _buildStatTile(String title, String val, Color color, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.blueGrey.shade100),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  val,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 11,
                    color: Color(0xFF94A3B8),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          )
        ],
      ),
    );
  }
}


