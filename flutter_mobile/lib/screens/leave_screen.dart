import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../widgets/app_drawer.dart';

class LeaveScreen extends StatefulWidget {
  const LeaveScreen({super.key});

  @override
  State<LeaveScreen> createState() => _LeaveScreenState();
}

class _LeaveScreenState extends State<LeaveScreen> {
  bool _isLoading = true;
  List<dynamic> _leaves = [];

  @override
  void initState() {
    super.initState();
    _fetchLeaves();
  }

  Future<void> _fetchLeaves() async {
    setState(() => _isLoading = true);
    final res = await ApiService.getMyLeaves();
    if (mounted) {
      setState(() {
        _isLoading = false;
        if (res['success']) {
          _leaves = res['data'];
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(res['message'] ?? 'Failed to load leaves')),
          );
        }
      });
    }
  }

  void _showApplyLeaveBottomSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => const _ApplyLeaveForm(),
    ).then((value) {
      if (value == true) {
        _fetchLeaves();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F7FE),
      drawer: AppDrawer(currentRoute: 'leave'),
      appBar: AppBar(
        leading: const BackButton(),
        title: Text(
          'Leave Requests',
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
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _fetchLeaves,
          )
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showApplyLeaveBottomSheet,
        backgroundColor: const Color(0xFF10B981),
        icon: const Icon(Icons.add, color: const Color(0xFF64748B)),
        label: Text(
          'Apply Leave',
          style: GoogleFonts.poppins(color: const Color(0xFF1E293B), fontWeight: FontWeight.bold),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF6366F1)))
          : _leaves.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.beach_access_rounded, size: 80, color: const Color(0xFFCBD5E1)),
                      const SizedBox(height: 16),
                      Text(
                        'No Leave Requests',
                        style: GoogleFonts.outfit(
                          color: const Color(0xFF64748B),
                          fontSize: 20,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(20),
                  itemCount: _leaves.length,
                  itemBuilder: (context, index) {
                    final leave = _leaves[index];
                    return _buildLeaveCard(leave);
                  },
                ),
    );
  }

  Widget _buildLeaveCard(Map<String, dynamic> leave) {
    final status = leave['status'] ?? 'PENDING';
    Color statusColor;
    Color statusBgColor;
    IconData statusIcon;

    if (status == 'APPROVED') {
      statusColor = const Color(0xFF10B981);
      statusBgColor = const Color(0xFF10B981).withOpacity(0.15);
      statusIcon = Icons.check_circle_rounded;
    } else if (status == 'REJECTED') {
      statusColor = const Color(0xFFEF4444);
      statusBgColor = const Color(0xFFEF4444).withOpacity(0.15);
      statusIcon = Icons.cancel_rounded;
    } else {
      statusColor = const Color(0xFFF59E0B);
      statusBgColor = const Color(0xFFF59E0B).withOpacity(0.15);
      statusIcon = Icons.pending_actions_rounded;
    }

    final startDate = (leave['startDate'] as String).split('T')[0];
    final endDate = (leave['endDate'] as String).split('T')[0];

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(Icons.date_range_rounded, color: const Color(0xFF64748B), size: 20),
                  const SizedBox(width: 8),
                  Text(
                    startDate == endDate ? startDate : '$startDate to $endDate',
                    style: GoogleFonts.outfit(
                      color: const Color(0xFF1E293B),
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: statusBgColor,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: statusColor.withOpacity(0.3)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(statusIcon, color: statusColor, size: 14),
                    const SizedBox(width: 4),
                    Text(
                      status,
                      style: GoogleFonts.poppins(
                        color: statusColor,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              )
            ],
          ),
          const SizedBox(height: 16),
          Text(
            'Reason',
            style: GoogleFonts.poppins(
              color: const Color(0xFF475569),
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            leave['reason'] ?? 'No reason provided',
            style: GoogleFonts.poppins(
              color: const Color(0xFF475569),
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }
}

class _ApplyLeaveForm extends StatefulWidget {
  const _ApplyLeaveForm();

  @override
  State<_ApplyLeaveForm> createState() => _ApplyLeaveFormState();
}

class _ApplyLeaveFormState extends State<_ApplyLeaveForm> {
  final _reasonController = TextEditingController();
  DateTime? _startDate;
  DateTime? _endDate;
  bool _isSubmitting = false;

  Future<void> _selectDateRange() async {
    final range = await showDateRangePicker(
      context: context,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      builder: (context, child) {
        return Theme(
          data: ThemeData.dark().copyWith(
            colorScheme: const ColorScheme.dark(
              primary: Color(0xFF6366F1),
              onPrimary: Colors.white,
              surface: Color(0xFFE2E8F0),
              onSurface: Colors.white,
            ),
          ),
          child: child!,
        );
      },
    );

    if (range != null) {
      setState(() {
        _startDate = range.start;
        _endDate = range.end;
      });
    }
  }

  Future<void> _submit() async {
    if (_startDate == null || _endDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a date range')),
      );
      return;
    }
    if (_reasonController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a reason')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    final res = await ApiService.applyLeave(
      startDate: _startDate!.toIso8601String(),
      endDate: _endDate!.toIso8601String(),
      reason: _reasonController.text.trim(),
    );

    setState(() => _isSubmitting = false);

    if (mounted) {
      if (res['success']) {
        Navigator.of(context).pop(true);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Leave request submitted successfully'), backgroundColor: Color(0xFF10B981)),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(res['message'] ?? 'Failed to submit request')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
        left: 20,
        right: 20,
        top: 20,
      ),
      decoration: const BoxDecoration(
        color: Color(0xFF1E293B),
        borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 50,
              height: 5,
              decoration: BoxDecoration(
                color: const Color(0xFFCBD5E1),
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'Apply Leave',
            style: GoogleFonts.outfit(
              color: const Color(0xFF1E293B),
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 24),
          
          GestureDetector(
            onTap: _selectDateRange,
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFE2E8F0),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.calendar_month_rounded, color: Color(0xFF818CF8)),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Text(
                      _startDate == null
                          ? 'Select Date Range'
                          : '${_startDate!.toIso8601String().split('T')[0]} to ${_endDate!.toIso8601String().split('T')[0]}',
                      style: GoogleFonts.poppins(
                        color: _startDate == null ? const Color(0xFF64748B) : const Color(0xFF1E293B),
                        fontSize: 16,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          
          TextField(
            controller: _reasonController,
            maxLines: 4,
            style: GoogleFonts.poppins(color: const Color(0xFF1E293B)),
            decoration: InputDecoration(
              hintText: 'Reason for leave...',
              hintStyle: GoogleFonts.poppins(color: const Color(0xFF475569)),
              filled: true,
              fillColor: const Color(0xFFE2E8F0),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide(color: const Color(0xFFE2E8F0)),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide(color: const Color(0xFFE2E8F0)),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: const BorderSide(color: Color(0xFF6366F1)),
              ),
            ),
          ),
          const SizedBox(height: 24),
          
          SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton(
              onPressed: _isSubmitting ? null : _submit,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF6366F1),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              child: _isSubmitting
                  ? const CircularProgressIndicator(color: Colors.white)
                  : Text(
                      'Submit Request',
                      style: GoogleFonts.poppins(
                        color: const Color(0xFF1E293B),
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}


