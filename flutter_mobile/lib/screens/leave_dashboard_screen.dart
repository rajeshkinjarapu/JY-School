import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import 'dart:convert';
import 'package:intl/intl.dart'; // Add this to pubspec if not present, or use manual formatting

class LeaveDashboardScreen extends StatefulWidget {
  const LeaveDashboardScreen({super.key});

  @override
  State<LeaveDashboardScreen> createState() => _LeaveDashboardScreenState();
}

class _LeaveDashboardScreenState extends State<LeaveDashboardScreen> with SingleTickerProviderStateMixin {
  int _currentIndex = 0;
  bool _isLoading = true;
  List<dynamic> _myLeaves = [];
  Map<String, dynamic>? _leaveBalance;
  String? _errorMessage;

  // Form State
  String _selectedType = 'CASUAL';
  DateTime? _startDate;
  DateTime? _endDate;
  final _reasonController = TextEditingController();
  bool _isSubmitting = false;

  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() {
      setState(() {
        _currentIndex = _tabController.index;
      });
    });
    _fetchMyLeaves();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _reasonController.dispose();
    super.dispose();
  }

  Future<void> _fetchMyLeaves() async {
    setState(() { _isLoading = true; _errorMessage = null; });
    try {
      final res = await ApiService.performGet('/api/leave/my-leaves', 'Failed to fetch leaves');
      if (mounted) {
        if (res['success']) {
          setState(() {
            _myLeaves = res['data']['leaves'] ?? [];
            _leaveBalance = res['data']['balance'];
            _isLoading = false;
          });
        } else {
          setState(() {
            _errorMessage = res['message'] ?? 'Failed to load leaves';
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Connection error. Please check internet and retry.';
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _applyLeave() async {
    if (_startDate == null || _reasonController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a date and provide a reason.')),
      );
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      final body = {
        'type': _selectedType,
        'startDate': _startDate!.toIso8601String(),
        'endDate': _endDate?.toIso8601String(),
        'reason': _reasonController.text.trim(),
      };
      
      final res = await ApiService.performPost('/api/leave/apply', body, 'Failed to apply leave');
      if (res['success']) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Leave applied successfully!')),
        );
        _reasonController.clear();
        setState(() {
          _startDate = null;
          _endDate = null;
          _selectedType = 'CASUAL';
        });
        _tabController.animateTo(1); // Go to history
        _fetchMyLeaves();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(res['message'] ?? 'Failed to apply leave')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Error applying leave.')),
      );
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  Future<void> _selectDate(BuildContext context, bool isStart) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: isStart ? (_startDate ?? DateTime.now()) : (_endDate ?? (_startDate ?? DateTime.now())),
      firstDate: DateTime.now().subtract(const Duration(days: 30)),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: Color(0xFF6366F1),
              onPrimary: Colors.white,
              onSurface: Colors.black,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() {
        if (isStart) {
          _startDate = picked;
          if (_endDate != null && _endDate!.isBefore(_startDate!)) {
            _endDate = null; // Reset end date if it's before new start date
          }
        } else {
          _endDate = picked;
        }
      });
    }
  }

  String _formatDate(DateTime? date) {
    if (date == null) return 'Select Date';
    return '${date.day}/${date.month}/${date.year}';
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'APPROVED': return const Color(0xFF10B981);
      case 'REJECTED': return const Color(0xFFEF4444);
      default: return const Color(0xFFF59E0B);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text('Leave Management', style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
        backgroundColor: const Color(0xFF4F46E5),
        foregroundColor: Colors.white,
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          indicatorWeight: 3,
          labelStyle: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16),
          unselectedLabelStyle: GoogleFonts.outfit(fontWeight: FontWeight.w500, fontSize: 16),
          tabs: const [
            Tab(text: 'Apply Leave'),
            Tab(text: 'My History'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildApplyLeaveTab(),
          _buildHistoryTab(),
        ],
      ),
    );
  }

  Widget _buildApplyLeaveTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Balance Cards
          if (_leaveBalance != null) ...[
            Text('Leave Balance', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
            const SizedBox(height: 12),
            Row(
              children: [
                _buildBalanceCard('Casual', _leaveBalance!['casualUsed'], _leaveBalance!['casualTotal'], const Color(0xFF3B82F6)),
                const SizedBox(width: 12),
                _buildBalanceCard('Sick', _leaveBalance!['sickUsed'], _leaveBalance!['sickTotal'], const Color(0xFFEF4444)),
              ],
            ),
            const SizedBox(height: 24),
          ],

          // Form
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 20, offset: const Offset(0, 4))],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Leave Type', style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w600, color: const Color(0xFF64748B))),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: _selectedType,
                      isExpanded: true,
                      icon: const Icon(Icons.keyboard_arrow_down_rounded, color: Color(0xFF64748B)),
                      items: ['CASUAL', 'SICK', 'EMERGENCY', 'EARNED'].map((String value) {
                        return DropdownMenuItem<String>(
                          value: value,
                          child: Text(value, style: GoogleFonts.poppins(fontSize: 15, color: const Color(0xFF1E293B))),
                        );
                      }).toList(),
                      onChanged: (newValue) {
                        setState(() { _selectedType = newValue!; });
                      },
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('From Date', style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w600, color: const Color(0xFF64748B))),
                          const SizedBox(height: 8),
                          GestureDetector(
                            onTap: () => _selectDate(context, true),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF8FAFC),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: const Color(0xFFE2E8F0)),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.calendar_today_rounded, size: 18, color: Color(0xFF6366F1)),
                                  const SizedBox(width: 10),
                                  Text(_formatDate(_startDate), style: GoogleFonts.poppins(fontSize: 14, color: _startDate == null ? const Color(0xFF94A3B8) : const Color(0xFF1E293B))),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('To Date (Opt.)', style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w600, color: const Color(0xFF64748B))),
                          const SizedBox(height: 8),
                          GestureDetector(
                            onTap: () => _selectDate(context, false),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF8FAFC),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: const Color(0xFFE2E8F0)),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.calendar_today_rounded, size: 18, color: Color(0xFF6366F1)),
                                  const SizedBox(width: 10),
                                  Text(_formatDate(_endDate), style: GoogleFonts.poppins(fontSize: 14, color: _endDate == null ? const Color(0xFF94A3B8) : const Color(0xFF1E293B))),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                Text('Reason', style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w600, color: const Color(0xFF64748B))),
                const SizedBox(height: 8),
                Container(
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: TextField(
                    controller: _reasonController,
                    maxLines: 4,
                    decoration: InputDecoration(
                      hintText: 'Type your reason here...',
                      hintStyle: GoogleFonts.poppins(color: const Color(0xFF94A3B8), fontSize: 14),
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.all(16),
                    ),
                    style: GoogleFonts.poppins(fontSize: 15, color: const Color(0xFF1E293B)),
                  ),
                ),
                const SizedBox(height: 32),

                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    onPressed: _isSubmitting ? null : _applyLeave,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF4F46E5),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      elevation: 4,
                    ),
                    child: _isSubmitting
                        ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : Text('Submit Application', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBalanceCard(String title, int used, int total, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: color.withOpacity(0.2)),
          boxShadow: [BoxShadow(color: color.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4))],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.pie_chart_rounded, size: 16, color: color),
                const SizedBox(width: 6),
                Text(title, style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF64748B))),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text('${total - used}', style: GoogleFonts.outfit(fontSize: 28, fontWeight: FontWeight.w900, color: color)),
                const SizedBox(width: 4),
                Padding(
                  padding: const EdgeInsets.only(bottom: 5),
                  child: Text('/ $total left', style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w500, color: const Color(0xFF94A3B8))),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHistoryTab() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: Color(0xFF4F46E5)));
    }
    if (_errorMessage != null) {
      return Center(child: Text(_errorMessage!, style: GoogleFonts.poppins(color: Colors.red)));
    }
    if (_myLeaves.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.history_rounded, size: 64, color: Color(0xFFCBD5E1)),
            const SizedBox(height: 16),
            Text('No Leave History', style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold, color: const Color(0xFF64748B))),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _fetchMyLeaves,
      color: const Color(0xFF4F46E5),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _myLeaves.length,
        itemBuilder: (context, index) {
          final leave = _myLeaves[index];
          final status = leave['status'] ?? 'PENDING';
          final statusColor = _getStatusColor(status);
          
          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10, offset: const Offset(0, 2))],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(leave['type'] ?? 'LEAVE', style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold, color: const Color(0xFF475569))),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: statusColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(status, style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold, color: statusColor)),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    const Icon(Icons.date_range_rounded, size: 16, color: Color(0xFF94A3B8)),
                    const SizedBox(width: 8),
                    Text(
                      '${leave['startDate']?.substring(0,10)} ${leave['endDate'] != null ? 'to ${leave['endDate']?.substring(0,10)}' : ''}',
                      style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w600, color: const Color(0xFF1E293B)),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(leave['reason'] ?? '', style: GoogleFonts.poppins(fontSize: 13, color: const Color(0xFF64748B))),
                if (status == 'REJECTED' && leave['rejectionReason'] != null) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(color: const Color(0xFFFEF2F2), borderRadius: BorderRadius.circular(8)),
                    child: Row(
                      children: [
                        const Icon(Icons.info_outline_rounded, size: 14, color: Color(0xFFEF4444)),
                        const SizedBox(width: 6),
                        Expanded(child: Text('Reason: ${leave['rejectionReason']}', style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFFB91C1C)))),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          );
        },
      ),
    );
  }
}
