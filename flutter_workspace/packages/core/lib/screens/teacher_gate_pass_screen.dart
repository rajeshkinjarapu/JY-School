import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';
import 'gate_pass_view_screen.dart';

class TeacherGatePassScreen extends StatefulWidget {
  const TeacherGatePassScreen({super.key});

  @override
  State<TeacherGatePassScreen> createState() => _TeacherGatePassScreenState();
}

class _TeacherGatePassScreenState extends State<TeacherGatePassScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String? _userRole;
  Map<String, dynamic>? _userData;
  
  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _initUser();
  }

  Future<void> _initUser() async {
    final prefs = await SharedPreferences.getInstance();
    final userStr = prefs.getString('user');
    if (userStr != null) {
      setState(() {
        _userData = jsonDecode(userStr);
        _userRole = _userData!['role'];
      });
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        leading: const BackButton(),
        title: Text(
          'Gate Pass',
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 18),
        ),
        iconTheme: const IconThemeData(color: Colors.white),
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF0F172A), Color(0xFF1E3A5F)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: const Color(0xFF10B981),
          indicatorWeight: 4,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          labelStyle: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 13),
          tabs: const [
            Tab(text: 'Issue for Student', icon: Icon(Icons.person_add_alt_1_rounded, size: 20)),
            Tab(text: 'My Request', icon: Icon(Icons.assignment_ind_rounded, size: 20)),
            Tab(text: 'History', icon: Icon(Icons.history_rounded, size: 20)),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _IssueStudentPassTab(userRole: _userRole),
          _TeacherRequestPassTab(userData: _userData),
          _HistoryTab(userData: _userData),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------
// TAB 1: Issue Gate Pass For Student
// ---------------------------------------------------------
class _IssueStudentPassTab extends StatefulWidget {
  final String? userRole;
  const _IssueStudentPassTab({this.userRole});

  @override
  State<_IssueStudentPassTab> createState() => _IssueStudentPassTabState();
}

class _IssueStudentPassTabState extends State<_IssueStudentPassTab> {
  bool _isLoading = false;
  bool _isFetchingStudents = true;
  List<Map<String, dynamic>> _students = [];
  
  String? _selectedFilterClass;
  String? _selectedFilterSection;
  String? _selectedStudentId;
  String _searchQuery = '';

  final _reasonController = TextEditingController();
  final _destController = TextEditingController();
  TimeOfDay? _exitTime = TimeOfDay.now();
  TimeOfDay? _returnTime;

  @override
  void initState() {
    super.initState();
    _fetchStudents();
  }

  Future<void> _fetchStudents() async {
    try {
      final res = await ApiService.getStudents(limit: 1000);
      if (res['success'] && mounted) {
        setState(() {
          _students = List<Map<String, dynamic>>.from(res['data'] ?? []);
          _isFetchingStudents = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isFetchingStudents = false);
    }
  }

  Future<void> _selectTime(BuildContext context, bool isExit) async {
    final TimeOfDay? picked = await showTimePicker(
      context: context,
      initialTime: isExit ? (_exitTime ?? TimeOfDay.now()) : (_returnTime ?? TimeOfDay.now()),
    );
    if (picked != null) {
      setState(() {
        if (isExit) _exitTime = picked;
        else _returnTime = picked;
      });
    }
  }

  Future<void> _submitPass() async {
    if (_selectedStudentId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select a student')));
      return;
    }
    if (_reasonController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter a reason')));
      return;
    }
    
    setState(() => _isLoading = true);
    try {
      final outTimeStr = '${_exitTime!.hour.toString().padLeft(2, '0')}:${_exitTime!.minute.toString().padLeft(2, '0')}';
      String? returnTimeStr;
      if (_returnTime != null) {
        returnTimeStr = '${_returnTime!.hour.toString().padLeft(2, '0')}:${_returnTime!.minute.toString().padLeft(2, '0')}';
      }

      final res = await ApiService.applyGatePass(
        studentId: _selectedStudentId,
        staffId: null,
        reason: _reasonController.text.trim(),
        destination: _destController.text.trim(),
        outTime: outTimeStr,
        expectedReturnTime: returnTimeStr,
        isReturnable: _returnTime != null,
        requestType: 'STUDENT',
      );

      if (mounted) {
        if (res['success']) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Gate Pass Issued Successfully!', style: TextStyle(color: Colors.white)), backgroundColor: Color(0xFF10B981)));
          setState(() {
            _selectedStudentId = null;
            _reasonController.clear();
            _destController.clear();
            _returnTime = null;
          });
        } else {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(res['message'] ?? 'Failed to issue pass')));
        }
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Error issuing gate pass')));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isFetchingStudents) {
      return const Center(child: CircularProgressIndicator(color: Color(0xFF10B981)));
    }

    final uniqueClasses = _students.map((s) => s['class']?['name']?.toString() ?? '').where((c) => c.isNotEmpty).toSet().toList()..sort();
    final uniqueSections = _students.map((s) => s['class']?['section']?.toString() ?? '').where((s) => s.isNotEmpty).toSet().toList()..sort();

    final filteredStudents = _students.where((s) {
      final name = (s['user']?['name'] ?? '').toLowerCase();
      final roll = (s['rollNo'] ?? '').toLowerCase();
      final className = (s['class']?['name'] ?? '').toLowerCase();
      final section = (s['class']?['section'] ?? '').toLowerCase();
      final q = _searchQuery.toLowerCase();
      
      final matchQuery = name.contains(q) || roll.contains(q) || className.contains(q) || section.contains(q);
      final matchClass = _selectedFilterClass == null || (s['class']?['name']?.toString() == _selectedFilterClass);
      final matchSection = _selectedFilterSection == null || (s['class']?['section']?.toString() == _selectedFilterSection);
      
      return matchQuery && matchClass && matchSection;
    }).toList();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 20, offset: const Offset(0, 10))],
            ),
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Select Student', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w600, color: const Color(0xFF0F172A))),
                const SizedBox(height: 12),
                TextField(
                  onChanged: (v) => setState(() => _searchQuery = v),
                  decoration: InputDecoration(
                    hintText: 'Search by name, roll no...',
                    hintStyle: GoogleFonts.poppins(color: const Color(0xFF94A3B8), fontSize: 13),
                    prefixIcon: const Icon(Icons.search, color: Color(0xFF94A3B8)),
                    filled: true,
                    fillColor: const Color(0xFFF8FAFC),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        value: _selectedFilterClass,
                        hint: Text('All Classes', style: GoogleFonts.poppins(fontSize: 13)),
                        decoration: _dropdownDeco(),
                        items: [
                          const DropdownMenuItem<String>(value: null, child: Text('All Classes')),
                          ...uniqueClasses.map((c) => DropdownMenuItem(value: c, child: Text(c))),
                        ],
                        onChanged: (v) => setState(() => _selectedFilterClass = v),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        value: _selectedFilterSection,
                        hint: Text('All Sections', style: GoogleFonts.poppins(fontSize: 13)),
                        decoration: _dropdownDeco(),
                        items: [
                          const DropdownMenuItem<String>(value: null, child: Text('All Sections')),
                          ...uniqueSections.map((s) => DropdownMenuItem(value: s, child: Text(s))),
                        ],
                        onChanged: (v) => setState(() => _selectedFilterSection = v),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  value: _selectedStudentId,
                  hint: Text('Select Student *', style: GoogleFonts.poppins(fontSize: 13)),
                  decoration: _dropdownDeco(),
                  isExpanded: true,
                  items: filteredStudents.map((s) {
                    final name = s['user']?['name'] ?? 'Unknown';
                    final cls = s['class']?['name'] ?? '-';
                    final sec = s['class']?['section'] ?? '-';
                    return DropdownMenuItem<String>(
                      value: s['id'],
                      child: Text('$name ($cls-$sec)', style: GoogleFonts.poppins(fontSize: 14)),
                    );
                  }).toList(),
                  onChanged: (v) => setState(() => _selectedStudentId = v),
                ),
                
                const SizedBox(height: 24),
                Text('Pass Details', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w600, color: const Color(0xFF0F172A))),
                const SizedBox(height: 12),
                TextField(
                  controller: _reasonController,
                  decoration: _inputDeco('Reason *'),
                  maxLines: 2,
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _destController,
                  decoration: _inputDeco('Destination (Optional)'),
                ),
                
                const SizedBox(height: 24),
                Text('Timings', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w600, color: const Color(0xFF0F172A))),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: _buildTimePicker(
                        label: 'Exit Time *',
                        time: _exitTime,
                        onTap: () => _selectTime(context, true),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildTimePicker(
                        label: 'Return Time (Optional)',
                        time: _returnTime,
                        onTap: () => _selectTime(context, false),
                      ),
                    ),
                  ],
                ),
                
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _submitPass,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF10B981),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      elevation: 0,
                    ),
                    child: _isLoading 
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : Text('ISSUE GATE PASS', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, color: Colors.white)),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  InputDecoration _dropdownDeco() {
    return InputDecoration(
      filled: true,
      fillColor: const Color(0xFFF8FAFC),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    );
  }

  InputDecoration _inputDeco(String hint) {
    return InputDecoration(
      hintText: hint,
      hintStyle: GoogleFonts.poppins(color: const Color(0xFF94A3B8), fontSize: 13),
      filled: true,
      fillColor: const Color(0xFFF8FAFC),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
    );
  }

  Widget _buildTimePicker({required String label, required TimeOfDay? time, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: GoogleFonts.poppins(fontSize: 10, color: const Color(0xFF94A3B8))),
                const SizedBox(height: 4),
                Text(time != null ? time.format(context) : '--:--', style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w600, color: const Color(0xFF0F172A))),
              ],
            ),
            const Icon(Icons.access_time_rounded, color: Color(0xFF94A3B8), size: 20),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------
// TAB 2: Request Gate Pass For Teacher (Themselves)
// ---------------------------------------------------------
class _TeacherRequestPassTab extends StatefulWidget {
  final Map<String, dynamic>? userData;
  const _TeacherRequestPassTab({this.userData});

  @override
  State<_TeacherRequestPassTab> createState() => _TeacherRequestPassTabState();
}

class _TeacherRequestPassTabState extends State<_TeacherRequestPassTab> {
  bool _isLoading = false;
  final _reasonController = TextEditingController();
  final _destController = TextEditingController();
  TimeOfDay? _exitTime = TimeOfDay.now();
  TimeOfDay? _returnTime;

  Future<void> _selectTime(BuildContext context, bool isExit) async {
    final TimeOfDay? picked = await showTimePicker(
      context: context,
      initialTime: isExit ? (_exitTime ?? TimeOfDay.now()) : (_returnTime ?? TimeOfDay.now()),
    );
    if (picked != null) {
      setState(() {
        if (isExit) _exitTime = picked;
        else _returnTime = picked;
      });
    }
  }

  Future<void> _submitRequest() async {
    if (_reasonController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter a reason')));
      return;
    }
    
    setState(() => _isLoading = true);
    try {
      final outTimeStr = '${_exitTime!.hour.toString().padLeft(2, '0')}:${_exitTime!.minute.toString().padLeft(2, '0')}';
      String? returnTimeStr;
      if (_returnTime != null) {
        returnTimeStr = '${_returnTime!.hour.toString().padLeft(2, '0')}:${_returnTime!.minute.toString().padLeft(2, '0')}';
      }

      final res = await ApiService.applyGatePass(
        studentId: null,
        staffId: null, 
        reason: _reasonController.text.trim(),
        destination: _destController.text.trim(),
        outTime: outTimeStr,
        expectedReturnTime: returnTimeStr,
        isReturnable: _returnTime != null,
        requestType: 'TEACHER',
      );

      if (mounted) {
        if (res['success']) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Gate Pass Request Submitted!', style: TextStyle(color: Colors.white)), backgroundColor: Color(0xFF10B981)));
          setState(() {
            _reasonController.clear();
            _destController.clear();
            _returnTime = null;
          });
        } else {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(res['message'] ?? 'Failed to submit request')));
        }
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Error submitting request')));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [Color(0xFF6366F1), Color(0xFF4F46E5)]),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              children: [
                const Icon(Icons.info_outline, color: Colors.white),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Request a gate pass for yourself. It will be sent to the admin for approval.',
                    style: GoogleFonts.poppins(color: Colors.white, fontSize: 13),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 20, offset: const Offset(0, 10))],
            ),
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Request Details', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w600, color: const Color(0xFF0F172A))),
                const SizedBox(height: 16),
                TextField(
                  controller: _reasonController,
                  decoration: _inputDeco('Reason for leaving *'),
                  maxLines: 3,
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _destController,
                  decoration: _inputDeco('Destination (Optional)'),
                ),
                
                const SizedBox(height: 24),
                Text('Timings', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w600, color: const Color(0xFF0F172A))),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: _buildTimePicker(
                        label: 'Exit Time *',
                        time: _exitTime,
                        onTap: () => _selectTime(context, true),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildTimePicker(
                        label: 'Return Time (Optional)',
                        time: _returnTime,
                        onTap: () => _selectTime(context, false),
                      ),
                    ),
                  ],
                ),
                
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _submitRequest,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF4F46E5),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      elevation: 0,
                    ),
                    child: _isLoading 
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : Text('SUBMIT REQUEST', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, color: Colors.white)),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  InputDecoration _inputDeco(String hint) {
    return InputDecoration(
      hintText: hint,
      hintStyle: GoogleFonts.poppins(color: const Color(0xFF94A3B8), fontSize: 13),
      filled: true,
      fillColor: const Color(0xFFF8FAFC),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
    );
  }

  Widget _buildTimePicker({required String label, required TimeOfDay? time, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: GoogleFonts.poppins(fontSize: 10, color: const Color(0xFF94A3B8))),
                const SizedBox(height: 4),
                Text(time != null ? time.format(context) : '--:--', style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w600, color: const Color(0xFF0F172A))),
              ],
            ),
            const Icon(Icons.access_time_rounded, color: Color(0xFF94A3B8), size: 20),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------
// TAB 3: History
// ---------------------------------------------------------
class _HistoryTab extends StatefulWidget {
  final Map<String, dynamic>? userData;
  const _HistoryTab({this.userData});

  @override
  State<_HistoryTab> createState() => _HistoryTabState();
}

class _HistoryTabState extends State<_HistoryTab> {
  bool _isLoading = true;
  List<dynamic> _history = [];

  @override
  void initState() {
    super.initState();
    _fetchHistory();
  }

  Future<void> _fetchHistory() async {
    try {
      final res = await ApiService.getGatePasses(status: '');
      if (res['success'] && mounted) {
        final allPasses = res['data'] ?? [];
        final userId = widget.userData?['id'];
        
        final teacherPasses = allPasses.where((p) => p['requesterId'] == userId).toList();
        
        setState(() {
          _history = teacherPasses;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: Color(0xFF10B981)));
    }

    if (_history.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.history_rounded, size: 64, color: Colors.grey[300]),
            const SizedBox(height: 16),
            Text('No history found', style: GoogleFonts.poppins(color: Colors.grey[600], fontSize: 16)),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _fetchHistory,
      color: const Color(0xFF10B981),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _history.length,
        itemBuilder: (context, index) {
          final pass = _history[index];
          final isStudentPass = pass['student'] != null;
          final personName = isStudentPass 
              ? (pass['student']?['user']?['name'] ?? 'Student') 
              : 'My Request';
          final slipNum = pass['slipNumber'] ?? '-';
          final status = pass['status'] ?? 'PENDING';
          final date = pass['requestedDate'] != null 
              ? DateFormat('MMM dd, yyyy').format(DateTime.parse(pass['requestedDate']))
              : '';

          Color statusColor;
          switch (status) {
            case 'APPROVED': statusColor = const Color(0xFF10B981); break;
            case 'REJECTED': statusColor = const Color(0xFFEF4444); break;
            case 'ACTIVE': statusColor = const Color(0xFF3B82F6); break;
            case 'COMPLETED': statusColor = const Color(0xFF64748B); break;
            default: statusColor = const Color(0xFFF59E0B);
          }

          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4))],
            ),
            child: Material(
              color: Colors.transparent,
              borderRadius: BorderRadius.circular(16),
              child: InkWell(
                borderRadius: BorderRadius.circular(16),
                onTap: () {
                  Navigator.push(context, MaterialPageRoute(
                    builder: (_) => GatePassViewScreen(
                      pass: pass,
                      isStudentTab: isStudentPass,
                      statusColor: statusColor,
                    )
                  )).then((_) => _fetchHistory());
                },
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: isStudentPass ? const Color(0xFFECFDF5) : const Color(0xFFEEF2FF),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          isStudentPass ? Icons.school_rounded : Icons.person_rounded,
                          color: isStudentPass ? const Color(0xFF10B981) : const Color(0xFF4F46E5),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              personName,
                              style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16, color: const Color(0xFF0F172A)),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Pass: $slipNum • $date',
                              style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: statusColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          status,
                          style: GoogleFonts.poppins(color: statusColor, fontSize: 10, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
