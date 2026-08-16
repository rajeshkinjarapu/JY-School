import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../widgets/app_drawer.dart';

class GatePassScreen extends StatefulWidget {
  const GatePassScreen({super.key});

  @override
  State<GatePassScreen> createState() => _GatePassScreenState();
}

class _GatePassScreenState extends State<GatePassScreen> {
  bool _isLoading = true;
  List<dynamic> _gatePasses = [];

  @override
  void initState() {
    super.initState();
    _fetchGatePasses();
  }

  Future<void> _fetchGatePasses() async {
    setState(() => _isLoading = true);
    final res = await ApiService.getGatePasses();
    if (mounted) {
      setState(() {
        _isLoading = false;
        if (res['success']) {
          _gatePasses = res['data'] ?? [];
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(res['message'] ?? 'Failed to load gate passes')),
          );
        }
      });
    }
  }

  void _showApplyGatePassSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => const _ApplyGatePassForm(),
    ).then((value) {
      if (value == true) {
        _fetchGatePasses();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F7FE),
      drawer: AppDrawer(currentRoute: 'gatepass'),
      appBar: AppBar(
        leading: const BackButton(),
        title: Text(
          'Gate Passes',
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold),
        ),
        backgroundColor: const Color(0xFFE2E8F0),
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _fetchGatePasses,
          )
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showApplyGatePassSheet,
        backgroundColor: const Color(0xFF10B981),
        icon: const Icon(Icons.add, color: const Color(0xFF1E293B)),
        label: Text(
          'Request Pass',
          style: GoogleFonts.poppins(color: const Color(0xFF1E293B), fontWeight: FontWeight.bold),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF10B981)))
          : _gatePasses.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.directions_run_rounded, size: 80, color: const Color(0xFFCBD5E1)),
                      const SizedBox(height: 16),
                      Text(
                        'No Gate Passes Requested',
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
                  itemCount: _gatePasses.length,
                  itemBuilder: (context, index) {
                    final gp = _gatePasses[index];
                    return _buildGatePassCard(gp);
                  },
                ),
    );
  }

  Widget _buildGatePassCard(Map<String, dynamic> pass) {
    final status = pass['status'] ?? 'PENDING';
    Color statusColor;
    Color statusBgColor;

    if (status == 'APPROVED') {
      statusColor = const Color(0xFF10B981);
      statusBgColor = const Color(0xFF10B981).withOpacity(0.15);
    } else if (status == 'REJECTED') {
      statusColor = const Color(0xFFEF4444);
      statusBgColor = const Color(0xFFEF4444).withOpacity(0.15);
    } else {
      statusColor = const Color(0xFFF59E0B);
      statusBgColor = const Color(0xFFF59E0B).withOpacity(0.15);
    }

    final outTimeStr = pass['outTime']?.toString().split('T').join(' ') ?? 'Unknown Time';

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
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
                  Icon(Icons.access_time_rounded, color: const Color(0xFF64748B), size: 20),
                  const SizedBox(width: 8),
                  Text(
                    outTimeStr.split('.')[0], // Trim ms
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
                child: Text(
                  status,
                  style: GoogleFonts.poppins(
                    color: statusColor,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              )
            ],
          ),
          const SizedBox(height: 16),
          Text(
            'Reason',
            style: GoogleFonts.poppins(
              color: const Color(0xFF94A3B8),
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            pass['reason'] ?? 'No reason provided',
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

class _ApplyGatePassForm extends StatefulWidget {
  const _ApplyGatePassForm();

  @override
  State<_ApplyGatePassForm> createState() => _ApplyGatePassFormState();
}

class _ApplyGatePassFormState extends State<_ApplyGatePassForm> {
  final _reasonController = TextEditingController();
  TimeOfDay? _outTime;
  bool _isSubmitting = false;

  Future<void> _selectTime() async {
    final t = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.now(),
      builder: (context, child) {
        return Theme(
          data: ThemeData.dark().copyWith(
            colorScheme: const ColorScheme.dark(
              primary: Color(0xFF10B981),
              onPrimary: Colors.white,
              surface: Color(0xFFE2E8F0),
              onSurface: Colors.white,
            ),
          ),
          child: child!,
        );
      },
    );
    if (t != null) {
      setState(() => _outTime = t);
    }
  }

  Future<void> _submit() async {
    if (_outTime == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select an exit time')),
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

    // Format outTime to ISO with today's date for backend
    final now = DateTime.now();
    final dt = DateTime(now.year, now.month, now.day, _outTime!.hour, _outTime!.minute);

    final res = await ApiService.applyGatePass(
      reason: _reasonController.text.trim(),
      outTime: dt.toIso8601String(),
    );

    setState(() => _isSubmitting = false);

    if (mounted) {
      if (res['success']) {
        Navigator.of(context).pop(true);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Gate pass requested successfully'), backgroundColor: Color(0xFF10B981)),
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
            'Request Gate Pass',
            style: GoogleFonts.outfit(
              color: const Color(0xFF1E293B),
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 24),
          
          GestureDetector(
            onTap: _selectTime,
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFE2E8F0),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.access_time_rounded, color: Color(0xFF10B981)),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Text(
                      _outTime == null
                          ? 'Select Exit Time'
                          : _outTime!.format(context),
                      style: GoogleFonts.poppins(
                        color: _outTime == null ? const Color(0xFF64748B) : Colors.white,
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
            maxLines: 3,
            style: GoogleFonts.poppins(color: const Color(0xFF1E293B)),
            decoration: InputDecoration(
              hintText: 'Reason for leaving early...',
              hintStyle: GoogleFonts.poppins(color: const Color(0xFF94A3B8)),
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
                borderSide: const BorderSide(color: Color(0xFF10B981)),
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
                backgroundColor: const Color(0xFF10B981),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              child: _isSubmitting
                  ? const CircularProgressIndicator(color: const Color(0xFF1E293B))
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
