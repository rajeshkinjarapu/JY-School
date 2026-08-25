import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class CreateGatePassScreen extends StatefulWidget {
  final String? userRole;
  
  const CreateGatePassScreen({super.key, this.userRole});

  @override
  State<CreateGatePassScreen> createState() => _CreateGatePassScreenState();
}

class _CreateGatePassScreenState extends State<CreateGatePassScreen> {
  bool _isLoading = false;
  List<dynamic> _students = [];
  List<dynamic> _teachers = [];
  String? _selectedStudentId;
  String? _selectedStaffId;
  final _reasonController = TextEditingController();
  final _destController = TextEditingController();
  TimeOfDay? _exitTime = TimeOfDay.now();
  TimeOfDay? _returnTime;
  bool _isReturnable = false;
  String _searchQuery = '';
  bool _isFetchingData = true;
  String _requestType = 'STUDENT'; // 'STUDENT' or 'TEACHER'
  
  String? _selectedFilterClass;
  String? _selectedFilterSection;

  @override
  void initState() {
    super.initState();
    if (widget.userRole == 'STUDENT') {
      _requestType = 'STUDENT';
      _isFetchingData = false; 
    } else {
      _requestType = 'STUDENT';
      _fetchData();
    }
  }

  Future<void> _fetchData() async {
    setState(() => _isFetchingData = true);
    try {
      final resStudents = await ApiService.getStudents();
      final resTeachers = await ApiService.getTeachers();
      if (mounted) {
        setState(() {
          if (resStudents['success']) {
             final data = resStudents['data'];
             if (data is List) {
               _students = data;
             } else if (data is Map && data['students'] != null) {
               _students = data['students'];
             } else {
               _students = [];
             }
          }
          if (resTeachers['success']) {
             final data = resTeachers['data'];
             if (data is List) {
               _teachers = data;
             } else if (data is Map && data['teachers'] != null) {
               _teachers = data['teachers'];
             } else {
               _teachers = [];
             }
          }
          _isFetchingData = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isFetchingData = false);
    }
  }

  Future<void> _submit() async {
    final canIssueForOthers = widget.userRole == 'ADMIN' || widget.userRole == 'SUPER_ADMIN' || widget.userRole == 'SECURITY' || widget.userRole == 'TEACHER';
    if (canIssueForOthers) {
      if (_requestType == 'STUDENT' && _selectedStudentId == null) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select a student')));
        return;
      }
      if (_requestType == 'TEACHER' && _selectedStaffId == null) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select a staff member')));
        return;
      }
    }
    
    if (_reasonController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter a reason')));
      return;
    }
    
    setState(() => _isLoading = true);
    try {
      final outTimeStr = '${_exitTime!.hour.toString().padLeft(2, '0')}:${_exitTime!.minute.toString().padLeft(2, '0')}';
      String? returnTimeStr;
      if (_isReturnable && _returnTime != null) {
        returnTimeStr = '${_returnTime!.hour.toString().padLeft(2, '0')}:${_returnTime!.minute.toString().padLeft(2, '0')}';
      }

      final res = await ApiService.applyGatePass(
        studentId: _requestType == 'STUDENT' ? _selectedStudentId : null,
        staffId: _requestType == 'TEACHER' ? _selectedStaffId : null,
        reason: _reasonController.text.trim(),
        destination: _destController.text.trim(),
        outTime: outTimeStr,
        expectedReturnTime: returnTimeStr,
        isReturnable: _isReturnable,
        requestType: _requestType,
      );

      if (mounted) {
        if (res['success']) {
          Navigator.pop(context, true); // return true to refresh list
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Gate Pass Issued Successfully!', style: TextStyle(color: Colors.white)), backgroundColor: Color(0xFF10B981)));
        } else {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(res['message'] ?? 'Failed to issue gate pass')));
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
    final canIssueForOthers = widget.userRole == 'ADMIN' || widget.userRole == 'SUPER_ADMIN' || widget.userRole == 'SECURITY' || widget.userRole == 'TEACHER';
    final isStrictAdmin = widget.userRole == 'ADMIN' || widget.userRole == 'SUPER_ADMIN' || widget.userRole == 'SECURITY';
    
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
    
    final uniqueClasses = _students
        .map((s) => s['class']?['name']?.toString() ?? '')
        .where((c) => c.isNotEmpty)
        .toSet()
        .toList()..sort();
        
    final uniqueSections = _students
        .map((s) => s['class']?['section']?.toString() ?? '')
        .where((s) => s.isNotEmpty)
        .toSet()
        .toList()..sort();
        
    final filteredTeachers = _teachers.where((t) {
      final name = (t['user']?['name'] ?? '').toLowerCase();
      return name.contains(_searchQuery.toLowerCase());
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F172A),
        title: Text(
          'Issue Gate Pass',
          style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (isStrictAdmin) ...[
                Row(
                  children: [
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _requestType = 'STUDENT'),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          decoration: BoxDecoration(
                            color: _requestType == 'STUDENT' ? const Color(0xFF10B981) : Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: _requestType == 'STUDENT' 
                                ? [BoxShadow(color: const Color(0xFF10B981).withOpacity(0.3), blurRadius: 10, offset: const Offset(0, 4))] 
                                : [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 4, offset: const Offset(0, 2))],
                          ),
                          alignment: Alignment.center,
                          child: Text('STUDENT', style: GoogleFonts.poppins(color: _requestType == 'STUDENT' ? Colors.white : const Color(0xFF64748B), fontWeight: FontWeight.bold)),
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _requestType = 'TEACHER'),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          decoration: BoxDecoration(
                            color: _requestType == 'TEACHER' ? const Color(0xFF10B981) : Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: _requestType == 'TEACHER' 
                                ? [BoxShadow(color: const Color(0xFF10B981).withOpacity(0.3), blurRadius: 10, offset: const Offset(0, 4))] 
                                : [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 4, offset: const Offset(0, 2))],
                          ),
                          alignment: Alignment.center,
                          child: Text('STAFF', style: GoogleFonts.poppins(color: _requestType == 'TEACHER' ? Colors.white : const Color(0xFF64748B), fontWeight: FontWeight.bold)),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
              ],
              
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
                    if (canIssueForOthers) ...[
                      if (_isFetchingData)
                        const Center(child: Padding(
                          padding: EdgeInsets.all(20.0),
                          child: CircularProgressIndicator(color: Color(0xFF10B981)),
                        ))
                      else
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(_requestType == 'STUDENT' ? 'Select Student' : 'Select Staff', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w600, color: const Color(0xFF0F172A))),
                            const SizedBox(height: 12),
                            TextField(
                              onChanged: (v) => setState(() => _searchQuery = v),
                              decoration: InputDecoration(
                                hintText: _requestType == 'STUDENT' ? 'Search by name, roll no, class or section...' : 'Search staff by name...',
                                prefixIcon: const Icon(Icons.search_rounded, color: Color(0xFF94A3B8)),
                                filled: true,
                                fillColor: const Color(0xFFF8FAFC),
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                              ),
                            ),
                            if (_requestType == 'STUDENT') ...[
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  Expanded(
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 12),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFF8FAFC),
                                        borderRadius: BorderRadius.circular(16),
                                        border: Border.all(color: const Color(0xFFE2E8F0)),
                                      ),
                                      child: DropdownButtonHideUnderline(
                                        child: DropdownButton<String>(
                                          isExpanded: true,
                                          hint: const Text('All Classes'),
                                          value: _selectedFilterClass,
                                          items: [
                                            const DropdownMenuItem<String>(value: null, child: Text('All Classes')),
                                            ...uniqueClasses.map((c) => DropdownMenuItem(value: c, child: Text(c))),
                                          ],
                                          onChanged: (v) => setState(() {
                                            _selectedFilterClass = v;
                                            _selectedStudentId = null; // Reset selection on filter change
                                          }),
                                        ),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 12),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFF8FAFC),
                                        borderRadius: BorderRadius.circular(16),
                                        border: Border.all(color: const Color(0xFFE2E8F0)),
                                      ),
                                      child: DropdownButtonHideUnderline(
                                        child: DropdownButton<String>(
                                          isExpanded: true,
                                          hint: const Text('All Sections'),
                                          value: _selectedFilterSection,
                                          items: [
                                            const DropdownMenuItem<String>(value: null, child: Text('All Sections')),
                                            ...uniqueSections.map((s) => DropdownMenuItem(value: s, child: Text(s))),
                                          ],
                                          onChanged: (v) => setState(() {
                                            _selectedFilterSection = v;
                                            _selectedStudentId = null; // Reset selection on filter change
                                          }),
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                            const SizedBox(height: 16),
                            if (_requestType == 'STUDENT')
                              filteredStudents.isEmpty
                                  ? const Padding(
                                      padding: EdgeInsets.all(8.0),
                                      child: Text('No students found.', style: TextStyle(color: Colors.redAccent)),
                                    )
                                  : Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 16),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFF8FAFC),
                                        borderRadius: BorderRadius.circular(16),
                                        border: Border.all(color: const Color(0xFFE2E8F0)),
                                      ),
                                      child: DropdownButtonHideUnderline(
                                        child: DropdownButton<String>(
                                          isExpanded: true,
                                          hint: const Text('Select Student'),
                                          value: _selectedStudentId,
                                          items: filteredStudents.map((s) {
                                            final name = s['user']?['name'] ?? 'Unknown';
                                            final className = s['class']?['name'] ?? '';
                                            final section = s['class']?['section'] ?? '';
                                            return DropdownMenuItem<String>(
                                              value: s['id'],
                                              child: Text('$name - $className $section'),
                                            );
                                          }).toList(),
                                          onChanged: (v) => setState(() => _selectedStudentId = v),
                                        ),
                                      ),
                                    )
                            else
                              filteredTeachers.isEmpty
                                  ? const Padding(
                                      padding: EdgeInsets.all(8.0),
                                      child: Text('No staff found.', style: TextStyle(color: Colors.redAccent)),
                                    )
                                  : Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 16),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFF8FAFC),
                                        borderRadius: BorderRadius.circular(16),
                                        border: Border.all(color: const Color(0xFFE2E8F0)),
                                      ),
                                      child: DropdownButtonHideUnderline(
                                        child: DropdownButton<String>(
                                          isExpanded: true,
                                          hint: const Text('Select Staff'),
                                          value: _selectedStaffId,
                                          items: filteredTeachers.map((t) {
                                            final name = t['user']?['name'] ?? 'Unknown';
                                            return DropdownMenuItem<String>(
                                              value: t['id'],
                                              child: Text(name),
                                            );
                                          }).toList(),
                                          onChanged: (v) => setState(() => _selectedStaffId = v),
                                        ),
                                      ),
                                    ),
                          ],
                        ),
                      const SizedBox(height: 24),
                    ] else ...[
                       // For Teachers, show a self-request indicator
                       Container(
                         padding: const EdgeInsets.all(16),
                         decoration: BoxDecoration(
                           color: const Color(0xFFEFF6FF),
                           borderRadius: BorderRadius.circular(16),
                           border: Border.all(color: const Color(0xFFBFDBFE)),
                         ),
                         child: Row(
                           children: [
                             Container(
                               padding: const EdgeInsets.all(8),
                               decoration: const BoxDecoration(
                                 color: Colors.white,
                                 shape: BoxShape.circle,
                               ),
                               child: const Icon(Icons.person_outline, color: Color(0xFF3B82F6)),
                             ),
                             const SizedBox(width: 16),
                             Expanded(
                               child: Text(
                                 'You are requesting a gate pass for yourself.',
                                 style: GoogleFonts.poppins(color: const Color(0xFF1E3A8A), fontSize: 13, fontWeight: FontWeight.w500),
                               ),
                             ),
                           ],
                         ),
                       ),
                       const SizedBox(height: 24),
                    ],
                    
                    Text('Pass Details', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w600, color: const Color(0xFF0F172A))),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _reasonController,
                      decoration: InputDecoration(
                        labelText: 'Reason *',
                        filled: true,
                        fillColor: const Color(0xFFF8FAFC),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _destController,
                      decoration: InputDecoration(
                        labelText: 'Destination (Optional)',
                        filled: true,
                        fillColor: const Color(0xFFF8FAFC),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                      ),
                    ),
                    const SizedBox(height: 24),
                    
                    Text('Timings', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w600, color: const Color(0xFF0F172A))),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: InkWell(
                            onTap: () async {
                              final time = await showTimePicker(context: context, initialTime: _exitTime ?? TimeOfDay.now());
                              if (time != null) setState(() => _exitTime = time);
                            },
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
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
                                      Text('Exit Time', style: GoogleFonts.poppins(fontSize: 10, color: const Color(0xFF64748B))),
                                      const SizedBox(height: 4),
                                      Text(_exitTime?.format(context) ?? '--', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                                    ],
                                  ),
                                  const Icon(Icons.access_time_rounded, size: 20, color: Color(0xFF10B981)),
                                ],
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: InkWell(
                            onTap: () async {
                              final time = await showTimePicker(context: context, initialTime: _returnTime ?? TimeOfDay.now());
                              if (time != null) {
                                setState(() {
                                  _returnTime = time;
                                  _isReturnable = true;
                                });
                              }
                            },
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
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
                                      Text('Return Time', style: GoogleFonts.poppins(fontSize: 10, color: const Color(0xFF64748B))),
                                      const SizedBox(height: 4),
                                      Text(_returnTime?.format(context) ?? '--', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                                    ],
                                  ),
                                  const Icon(Icons.access_time_rounded, size: 20, color: Color(0xFF64748B)),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                height: 58,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF10B981),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    elevation: 4,
                    shadowColor: const Color(0xFF10B981).withOpacity(0.5),
                  ),
                  child: _isLoading 
                      ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : Text('SUBMIT GATE PASS', style: GoogleFonts.outfit(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 1.5)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
