import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../widgets/app_drawer.dart';

class AdmitCardScreen extends StatefulWidget {
  const AdmitCardScreen({super.key});

  @override
  State<AdmitCardScreen> createState() => _AdmitCardScreenState();
}

class _AdmitCardScreenState extends State<AdmitCardScreen> {
  List<dynamic> _exams = [];
  List<dynamic> _classes = [];
  List<dynamic> _students = [];
  
  String? _selectedExamId;
  String? _selectedClassId;
  Map<String, dynamic>? _selectedExamData;
  Map<String, dynamic>? _selectedClassData;

  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _fetchDropdownData();
  }

  Future<void> _fetchDropdownData() async {
    setState(() => _isLoading = true);

    try {
      final examsRes = await ApiService.getExams();
      final classesRes = await ApiService.getClasses();

      if (mounted) {
        setState(() {
          _exams = examsRes['success'] ? examsRes['data'] ?? [] : [];
          _classes = classesRes['success'] ? classesRes['data'] ?? [] : [];
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Failed to load data: $e';
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _fetchStudents() async {
    if (_selectedExamId == null || _selectedClassId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select both Exam and Class')));
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final res = await ApiService.getStudents(classId: _selectedClassId!);
      if (mounted) {
        setState(() {
          _students = res['success'] ? res['data'] ?? [] : [];
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Failed to fetch students: $e';
          _isLoading = false;
        });
      }
    }
  }

  void _onExamSelected(dynamic examId) {
    if (examId == null) return;
    setState(() {
      _selectedExamId = examId;
      _selectedExamData = _exams.firstWhere((e) => e['id'] == examId, orElse: () => null);
      
      // Clear selected class if it's not valid for the new exam
      if (_selectedClassId != null && _selectedExamData != null) {
        final examClasses = _selectedExamData!['classes'] as List?;
        if (examClasses != null) {
          final isValid = examClasses.any((c) => c['id'].toString() == _selectedClassId);
          if (!isValid) {
            _selectedClassId = null;
            _selectedClassData = null;
          }
        } else {
          _selectedClassId = null;
          _selectedClassData = null;
        }
      }
    });
  }
  
  void _onClassSelected(dynamic classId) {
    if (classId == null) return;
    setState(() {
      _selectedClassId = classId;
      _selectedClassData = _classes.firstWhere((c) => c['id'] == classId, orElse: () => null);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      drawer: const AppDrawer(currentRoute: 'exams'),
      appBar: AppBar(
        leading: const BackButton(),
        title: Text('Admit Cards', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white)),
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
      ),
      body: Column(
        children: [
          _buildFiltersSection(),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF6366F1)))
                : _errorMessage != null
                    ? Center(child: Text(_errorMessage!, style: const TextStyle(color: Colors.red)))
                    : _students.isEmpty
                        ? Center(
                            child: Text(
                              _selectedExamId == null || _selectedClassId == null 
                                ? 'Please select an exam and class.' 
                                : 'No students found in this class.',
                              style: GoogleFonts.poppins(color: const Color(0xFF64748B)),
                            ),
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.all(12),
                            itemCount: _students.length,
                            itemBuilder: (context, index) {
                              return _buildStudentListItem(_students[index]);
                            },
                          ),
          )
        ],
      ),
    );
  }

  Widget _buildFiltersSection() {
    List<dynamic> filteredClasses = [];
    if (_selectedExamData != null && _selectedExamData!['classes'] != null) {
      final examClasses = _selectedExamData!['classes'] as List;
      final examClassIds = examClasses.map((c) => c['id'].toString()).toSet();
      filteredClasses = _classes.where((c) => examClassIds.contains(c['id'].toString())).toList();
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF6366F1).withOpacity(0.08),
            blurRadius: 10,
            offset: const Offset(0, 4),
          )
        ],
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(20),
          bottomRight: Radius.circular(20),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildCompactDropdown(
            label: 'Select Exam',
            value: _selectedExamId,
            items: _exams,
            onChanged: _onExamSelected,
            icon: Icons.assignment_rounded,
          ),
          const SizedBox(height: 12),
          _buildCompactDropdown(
            label: _selectedExamId == null ? 'Select Exam First' : 'Select Class',
            value: _selectedClassId,
            items: _selectedExamId == null ? [] : filteredClasses,
            onChanged: _onClassSelected,
            icon: Icons.class_rounded,
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            height: 44,
            child: ElevatedButton.icon(
              onPressed: _isLoading ? null : _fetchStudents,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF6366F1),
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              icon: const Icon(Icons.search_rounded, color: Colors.white, size: 18),
              label: Text(
                'Get Students',
                style: GoogleFonts.outfit(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCompactDropdown({required String label, required String? value, required List<dynamic> items, required Function(dynamic) onChanged, required IconData icon}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          isExpanded: true,
          value: value,
          hint: Text(label, style: GoogleFonts.poppins(fontSize: 13, color: const Color(0xFF94A3B8))),
          icon: const Icon(Icons.keyboard_arrow_down_rounded, color: Color(0xFF64748B), size: 18),
          onChanged: items.isEmpty ? null : onChanged,
          itemHeight: null, // Allows dynamic height for multi-line text
          items: items.map((item) {
            String name = item['name'] ?? item['title'] ?? item['className'] ?? 'Unknown';
            if (item['section'] != null && item['section'].toString().trim().isNotEmpty) {
              name = '$name - ${item['section']}';
            }
            return DropdownMenuItem<String>(
              value: item['id'].toString(),
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Text(
                  name, 
                  style: GoogleFonts.poppins(
                    fontSize: 13, 
                    fontWeight: value == item['id'].toString() ? FontWeight.bold : FontWeight.normal,
                    color: value == item['id'].toString() ? const Color(0xFF6366F1) : const Color(0xFF1E293B)
                  ),
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildStudentListItem(Map<String, dynamic> studentData) {
    final user = studentData['user'] ?? {};
    final studentName = user['name'] ?? 'Student Name';
    final rollNo = studentData['rollNo'] ?? 'Roll No';
    final photoUrl = user['photoUrl'];
    final image = photoUrl?.isNotEmpty == true
        ? photoUrl
        : 'https://ui-avatars.com/api/?name=${Uri.encodeComponent(studentName)}&background=E2E8F0&color=1E293B';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          )
        ]
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: CircleAvatar(
          radius: 24,
          backgroundImage: NetworkImage(image!),
          backgroundColor: const Color(0xFFF1F5F9),
        ),
        title: Text(
          studentName,
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: const Color(0xFF1E293B), fontSize: 16),
        ),
        subtitle: Text(
          'Roll No: $rollNo',
          style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 13),
        ),
        trailing: Container(
          decoration: BoxDecoration(
            color: const Color(0xFFEEF2FF),
            borderRadius: BorderRadius.circular(12),
          ),
          child: IconButton(
            icon: const Icon(Icons.picture_as_pdf_rounded, color: Color(0xFF6366F1)),
            tooltip: 'View Admit Card',
            onPressed: () => _showAdmitCardModal(studentData),
          ),
        ),
      ),
    );
  }

  void _showAdmitCardModal(Map<String, dynamic> studentData) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.all(16),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  IconButton(
                    icon: const Icon(Icons.close_rounded, color: Colors.white, size: 30),
                    onPressed: () => Navigator.pop(context),
                  )
                ],
              ),
              const SizedBox(height: 8),
              _buildAdmitCard(studentData),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAdmitCard(Map<String, dynamic> studentData) {
    final examName = _selectedExamData?['name'] ?? 'Exam';
    final term = _selectedExamData?['term'] ?? 'Term';
    
    // Parse admitCardSettings
    final settings = _selectedExamData?['admitCardSettings'] ?? {};
    final signatureUrl = settings['signatureUrl'] ?? '';
    final teacherSignatureUrl = settings['teacherSignatureUrl'] ?? '';
    final instructions = settings['instructions'] ?? 
        "Candidate must carry this Admit Card to the examination hall.\nElectronic devices including calculators and mobile phones are strictly prohibited.\nCandidate should report to the examination center 30 minutes before commencement.";
    
    // Parse Schedule
    List<dynamic> schedule = [];
    var examPlans = _selectedExamData?['examPlans'];
    if (examPlans is String) {
      try { examPlans = jsonDecode(examPlans); } catch(e) { examPlans = []; }
    }
    
    if (examPlans is List && examPlans.isNotEmpty) {
      schedule = examPlans;
    } else {
      var examSubjects = settings['subjects'] ?? _selectedExamData?['subjects'];
      if (examSubjects is String) {
        try { examSubjects = jsonDecode(examSubjects); } catch(e) { examSubjects = []; }
      }
      if (examSubjects is List) {
        final String defaultDate = _selectedExamData?['examDate'] != null 
            ? _selectedExamData!['examDate'].toString().split('T')[0] 
            : 'TBA';
        schedule = examSubjects.map((subj) {
          return {
            'subjectName': subj['name'] ?? 'Subject',
            'date': defaultDate,
            'time': 'TBA',
          };
        }).toList();
      }
    }
    
    final user = studentData['user'] ?? {};
    final studentName = user['name'] ?? 'Student Name';
    final rollNo = studentData['rollNo'] ?? 'Roll No';
    
    final className = _selectedClassData != null 
        ? '${_selectedClassData!['name']} - ${_selectedClassData!['section']}' 
        : 'Class';
        
    final photoUrl = user['photoUrl'];
    final image = photoUrl?.isNotEmpty == true
        ? photoUrl
        : 'https://ui-avatars.com/api/?name=${Uri.encodeComponent(studentName)}&background=E2E8F0&color=1E293B';

    return Container(
      width: double.infinity,
      height: MediaQuery.of(context).size.height * 0.75, // Take most of the screen
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
      ),
      child: InteractiveViewer(
        panEnabled: true,
        scaleEnabled: true,
        minScale: 0.5,
        maxScale: 4.0,
        child: FittedBox(
          fit: BoxFit.contain,
          child: Container(
            width: 794, // A4 width at 96 DPI
            height: 1123, // A4 height at 96 DPI
            color: Colors.white,
            padding: const EdgeInsets.all(24),
            child: Container(
              decoration: BoxDecoration(
                border: Border.all(color: const Color(0xFF0F172A), width: 4),
              ),
              padding: const EdgeInsets.all(4),
              child: Container(
                decoration: BoxDecoration(
                  border: Border.all(color: const Color(0xFF0F172A), width: 1),
                ),
                child: Column(
                  children: [
                    // Header
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: const BoxDecoration(
                        color: Color(0xFFF8FAFC),
                        border: Border(bottom: BorderSide(color: Color(0xFF0F172A), width: 2)),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          // Logo Placeholder
                          Container(
                            width: 96,
                            height: 96,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              border: Border.all(color: const Color(0xFFCBD5E1)),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            alignment: Alignment.center,
                            child: Text('LOGO', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: const Color(0xFF1E293B))),
                          ),
                          const SizedBox(width: 24),
                          // Title
                          Expanded(
                            child: Column(
                              children: [
                                Text(
                                  'SRI VENKATESWARA JY SCHOOL',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    fontFamily: 'Georgia',
                                    fontSize: 28,
                                    fontWeight: FontWeight.w900,
                                    color: const Color(0xFF0F172A),
                                    letterSpacing: 1.2,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '(IIT-JEE/NEET FOUNDATION – OLYMPIADS)',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: const Color(0xFF334155),
                                    letterSpacing: 2.0,
                                  ),
                                ),
                                const SizedBox(height: 12),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    border: Border.all(color: const Color(0xFFE2E8F0)),
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.location_on, size: 14, color: Color(0xFF1E293B)),
                                      const SizedBox(width: 8),
                                      Text(
                                        'Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta',
                                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: const Color(0xFF475569)),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 96), // Balance logo width
                        ],
                      ),
                    ),

                    // Badges
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 24),
                      decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Color(0xFFE2E8F0)))),
                      child: Column(
                        children: [
                          Transform(
                            transform: Matrix4.skewX(-0.2),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 8),
                              decoration: BoxDecoration(
                                color: const Color(0xFF0F172A),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Transform(
                                transform: Matrix4.skewX(0.2),
                                child: Text(
                                  'ADMIT CARD',
                                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 4.0),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            examName.toUpperCase(),
                            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B), letterSpacing: 2.0),
                          ),
                        ],
                      ),
                    ),

                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          children: [
                            // Candidate Details
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                Expanded(
                                  child: Container(
                                    decoration: BoxDecoration(
                                      border: Border.all(color: const Color(0xFFCBD5E1)),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Column(
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                                          decoration: const BoxDecoration(
                                            color: Color(0xFF1E293B),
                                            borderRadius: BorderRadius.only(topLeft: Radius.circular(7), topRight: Radius.circular(7)),
                                          ),
                                          child: Row(
                                            children: [
                                              const Icon(Icons.person, color: Colors.white, size: 16),
                                              const SizedBox(width: 8),
                                              Text('CANDIDATE DETAILS', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.5)),
                                            ],
                                          ),
                                        ),
                                        _buildA4TableRow('Candidate Name', studentName.toUpperCase(), isFirst: true),
                                        _buildA4TableRow('Father Name', (studentData['parent']?['fatherName'] ?? '-').toUpperCase()),
                                        _buildA4TableRow('Roll Number', rollNo),
                                        _buildA4TableRow('Class & Section', className),
                                        _buildA4TableRow('Gender / DOB', '${studentData['gender'] ?? 'Male'}  |  12/05/2010'),
                                        _buildA4TableRow('Exam Center', 'JY School Main Campus, Hall A', isLast: true),
                                      ],
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 24),
                                Container(
                                  width: 120,
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    border: Border.all(color: const Color(0xFFCBD5E1), width: 2),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  padding: const EdgeInsets.all(4),
                                  child: Container(
                                    decoration: BoxDecoration(
                                      image: DecorationImage(image: NetworkImage(image), fit: BoxFit.cover),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 32),

                            // Exam Schedule
                            Container(
                              decoration: BoxDecoration(
                                border: Border.all(color: const Color(0xFFCBD5E1)),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Column(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                                    decoration: const BoxDecoration(
                                      color: Color(0xFF1E293B),
                                      borderRadius: BorderRadius.only(topLeft: Radius.circular(7), topRight: Radius.circular(7)),
                                    ),
                                    child: Row(
                                      children: [
                                        const Icon(Icons.calendar_month, color: Colors.white, size: 16),
                                        const SizedBox(width: 8),
                                        Text('EXAMINATION SCHEDULE', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.5)),
                                      ],
                                    ),
                                  ),
                                  Table(
                                    columnWidths: const {
                                      0: FixedColumnWidth(60),
                                      1: FlexColumnWidth(1.2),
                                      2: FlexColumnWidth(2),
                                      3: FlexColumnWidth(1.5),
                                      4: FlexColumnWidth(1.5),
                                    },
                                    border: TableBorder.symmetric(inside: const BorderSide(color: Color(0xFFE2E8F0))),
                                    children: [
                                      TableRow(
                                        decoration: const BoxDecoration(color: Color(0xFFF1F5F9)),
                                        children: [
                                          _buildA4TableHeader('S.No'),
                                          _buildA4TableHeader('DATE'),
                                          _buildA4TableHeader('SUBJECT'),
                                          _buildA4TableHeader('TIME'),
                                          _buildA4TableHeader('INVIGILATOR SIGN', center: true),
                                        ],
                                      ),
                                      ...List.generate(schedule.length, (i) {
                                        final item = schedule[i];
                                        return TableRow(
                                          children: [
                                            _buildA4TableCell('${i + 1}', center: true),
                                            _buildA4TableCell(item['date'] ?? 'TBA'),
                                            _buildA4TableCell((item['subjectName'] ?? item['name'] ?? 'Subject').toUpperCase()),
                                            _buildA4TableCell(item['time'] ?? 'TBA'),
                                            _buildA4TableCell('..................', center: true, isLight: true),
                                          ],
                                        );
                                      }),
                                      if (schedule.isEmpty)
                                        TableRow(
                                          children: [
                                            Padding(
                                              padding: const EdgeInsets.all(24),
                                              child: Text('No schedule mapped for this class.', textAlign: TextAlign.center, style: TextStyle(color: const Color(0xFF94A3B8), fontSize: 12, fontStyle: FontStyle.italic)),
                                            ),
                                            const SizedBox(), const SizedBox(), const SizedBox(), const SizedBox()
                                          ],
                                        )
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            
                            const Spacer(),

                            // Footer
                            Container(
                              padding: const EdgeInsets.all(20),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF8FAFC),
                                border: Border.all(color: const Color(0xFFE2E8F0), width: 2),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            Container(width: 6, height: 6, decoration: const BoxDecoration(color: Color(0xFF0F172A), shape: BoxShape.circle)),
                                            const SizedBox(width: 8),
                                            Text('IMPORTANT INSTRUCTIONS', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: const Color(0xFF0F172A), letterSpacing: 1.0)),
                                          ],
                                        ),
                                        const SizedBox(height: 12),
                                        ...instructions.split('\n').map((line) => Padding(
                                          padding: const EdgeInsets.only(bottom: 8, left: 14),
                                          child: Row(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              const Text('• ', style: TextStyle(fontSize: 12, color: Color(0xFF475569))),
                                              Expanded(child: Text(line, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: const Color(0xFF334155), height: 1.5))),
                                            ],
                                          ),
                                        )),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(width: 32),
                                  Column(
                                    children: [
                                      if (signatureUrl.isNotEmpty)
                                        Image.network(signatureUrl, height: 60, width: 120, fit: BoxFit.contain)
                                      else
                                        const SizedBox(height: 60, width: 120),
                                      Container(width: 150, height: 1, color: const Color(0xFFCBD5E1)),
                                      const SizedBox(height: 8),
                                      Text('PRINCIPAL SIGNATURE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: const Color(0xFF1E293B), letterSpacing: 1.0)),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildA4TableRow(String label, String value, {bool isFirst = false, bool isLast = false}) {
    return Container(
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: isLast ? Colors.transparent : const Color(0xFFE2E8F0))),
      ),
      child: Row(
        children: [
          Container(
            width: 200,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: const BoxDecoration(
              color: Color(0xFFF8FAFC),
              border: Border(right: BorderSide(color: Color(0xFFE2E8F0))),
            ),
            child: Text(label.toUpperCase(), style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFF475569), letterSpacing: 1.0)),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Text(value, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: const Color(0xFF0F172A))),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildA4TableHeader(String label, {bool center = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Text(label, textAlign: center ? TextAlign.center : TextAlign.left, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: const Color(0xFF334155), letterSpacing: 1.5)),
    );
  }

  Widget _buildA4TableCell(String label, {bool center = false, bool isLight = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Text(label, textAlign: center ? TextAlign.center : TextAlign.left, style: TextStyle(fontSize: 12, fontWeight: isLight ? FontWeight.normal : FontWeight.bold, color: isLight ? const Color(0xFF94A3B8) : const Color(0xFF1E293B))),
    );
  }
  Widget _buildTableHeader(String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Text(
        text,
        style: GoogleFonts.poppins(
          color: const Color(0xFF64748B),
          fontSize: 11,
          fontWeight: FontWeight.bold,
          letterSpacing: 0.5,
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 70,
          child: Text(
            label,
            style: GoogleFonts.poppins(
              color: const Color(0xFF64748B),
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        const Text(': ', style: TextStyle(color: Color(0xFF94A3B8))),
        Expanded(
          child: Text(
            value,
            style: GoogleFonts.poppins(
              color: const Color(0xFF334155),
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }
}
