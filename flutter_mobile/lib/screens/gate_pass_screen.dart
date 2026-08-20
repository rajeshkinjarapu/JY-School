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
            onPressed: _fetchGatePasses,
          )
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showApplyGatePassSheet,
        backgroundColor: const Color(0xFF10B981),
        icon: const Icon(Icons.add, color: const Color(0xFF64748B)),
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
    final isTeacher = pass['requestType'] == 'TEACHER';
    
    final requester = pass['requester'] ?? {};
    final student = pass['student'] ?? {};
    final studentUser = student['user'] ?? {};
    
    final personName = isTeacher ? (requester['name'] ?? 'Staff') : (studentUser['name'] ?? 'Student');
    final personRole = isTeacher ? 'STAFF' : 'STUDENT';
    final personId = isTeacher ? (requester['id']?.toString().substring(0, 8) ?? 'N/A') : (student['rollNo'] ?? 'N/A');
    
    final cls = student['class'] ?? {};
    final className = isTeacher ? 'N/A' : '${cls['name'] ?? ''} - ${cls['section'] ?? ''}';
    
    final photoUrl = isTeacher ? requester['photoUrl'] : studentUser['photoUrl'];
    final image = photoUrl?.isNotEmpty == true
        ? photoUrl
        : 'https://ui-avatars.com/api/?name=${Uri.encodeComponent(personName)}&background=E2E8F0&color=1E293B';

    final destination = pass['destination'] ?? 'N/A';
    final reason = pass['reason'] ?? 'N/A';
    
    // Parse times
    String formatTime(String? t) {
      if (t == null || t.isEmpty) return '--:--';
      // usually HH:mm, or datetime string
      if (t.contains('T')) {
        final parts = t.split('T');
        if (parts.length > 1) {
          final timeParts = parts[1].split(':');
          if (timeParts.length >= 2) return '${timeParts[0]}:${timeParts[1]}';
        }
      } else {
        final timeParts = t.split(':');
        if (timeParts.length >= 2) return '${timeParts[0]}:${timeParts[1]}';
      }
      return t;
    }
    
    final timeOut = formatTime(pass['exitTime'] ?? pass['outTime']);
    final timeIn = formatTime(pass['returnTime']);

    Color statusColor;
    Color statusBgColor;

    if (status == 'APPROVED') {
      statusColor = const Color(0xFF10B981);
      statusBgColor = const Color(0xFF10B981).withOpacity(0.1);
    } else if (status == 'REJECTED') {
      statusColor = const Color(0xFFEF4444);
      statusBgColor = const Color(0xFFEF4444).withOpacity(0.1);
    } else {
      statusColor = const Color(0xFFF59E0B);
      statusBgColor = const Color(0xFFF59E0B).withOpacity(0.1);
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.indigo.withOpacity(0.08),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
        border: Border.all(color: const Color(0xFFE2E8F0), width: 1.5),
      ),
      child: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(0xFF2E2A66), Color(0xFF332F73)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(18),
                topRight: Radius.circular(18),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.directions_walk_rounded, color: Colors.white, size: 20),
                    ),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'JY SCHOOL',
                          style: GoogleFonts.outfit(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w900, letterSpacing: 1.5),
                        ),
                        Text(
                          'GATE PASS SLIP',
                          style: GoogleFonts.poppins(color: const Color(0xFF93C5FD), fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 1),
                        ),
                      ],
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusBgColor,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: statusColor.withOpacity(0.3)),
                  ),
                  child: Text(
                    status,
                    style: GoogleFonts.poppins(color: statusColor, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                  ),
                )
              ],
            ),
          ),
          
          // Body
          Stack(
            children: [
              Padding(
                padding: const EdgeInsets.all(20.0),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Photo & Role
                    Column(
                      children: [
                        Container(
                          width: 75,
                          height: 90,
                          decoration: BoxDecoration(
                            color: const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: const Color(0xFFCBD5E1), width: 1.5),
                            image: DecorationImage(
                              image: NetworkImage(image),
                              fit: BoxFit.cover,
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            personRole,
                            style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 1),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(width: 20),
                    // Details
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            personName,
                            style: GoogleFonts.outfit(color: const Color(0xFF1E293B), fontSize: 18, fontWeight: FontWeight.bold),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Expanded(child: _buildInfoItem('ID No', personId)),
                              if (!isTeacher) Expanded(child: _buildInfoItem('Class', className)),
                            ],
                          ),
                          const SizedBox(height: 12),
                          _buildInfoItem('Destination', destination),
                          const SizedBox(height: 12),
                          _buildInfoItem('Reason', reason),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              
              // Watermark / Stamp if approved
              if (status == 'APPROVED')
                Positioned(
                  right: 20,
                  bottom: 20,
                  child: Transform.rotate(
                    angle: -0.2,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      decoration: BoxDecoration(
                        border: Border.all(color: const Color(0xFF10B981).withOpacity(0.3), width: 2),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        'APPROVED',
                        style: GoogleFonts.outfit(
                          color: const Color(0xFF10B981).withOpacity(0.3),
                          fontSize: 24,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 2,
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),

          // Dashed Divider
          LayoutBuilder(
            builder: (context, constraints) {
              final boxWidth = constraints.constrainWidth();
              final dashWidth = 8.0;
              final dashCount = (boxWidth / (2 * dashWidth)).floor();
              return Flex(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                direction: Axis.horizontal,
                children: List.generate(dashCount, (_) {
                  return SizedBox(
                    width: dashWidth,
                    height: 1.5,
                    child: const DecoratedBox(decoration: BoxDecoration(color: Color(0xFFE2E8F0))),
                  );
                }),
              );
            },
          ),
          
          // Footer (Times)
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                Column(
                  children: [
                    Text('TIME OUT', style: GoogleFonts.poppins(color: const Color(0xFF94A3B8), fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1)),
                    const SizedBox(height: 4),
                    Text(timeOut, style: GoogleFonts.outfit(color: const Color(0xFF334155), fontSize: 16, fontWeight: FontWeight.w900)),
                  ],
                ),
                Container(width: 1.5, height: 30, color: const Color(0xFFE2E8F0)),
                Column(
                  children: [
                    Text('TIME IN', style: GoogleFonts.poppins(color: const Color(0xFF94A3B8), fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1)),
                    const SizedBox(height: 4),
                    Text(timeIn, style: GoogleFonts.outfit(color: const Color(0xFF334155), fontSize: 16, fontWeight: FontWeight.w900)),
                  ],
                ),
              ],
            ),
          )
        ],
      ),
    );
  }

  Widget _buildInfoItem(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label.toUpperCase(),
          style: GoogleFonts.poppins(color: const Color(0xFF94A3B8), fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 1),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: GoogleFonts.poppins(color: const Color(0xFF334155), fontSize: 12, fontWeight: FontWeight.w600),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
      ],
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
                        color: _outTime == null ? const Color(0xFF64748B) : const Color(0xFF1E293B),
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


