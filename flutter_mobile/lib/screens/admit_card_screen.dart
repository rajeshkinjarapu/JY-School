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
          Row(
            children: [
              Expanded(
                child: _buildCompactDropdown(
                  label: 'Exam',
                  value: _selectedExamId,
                  items: _exams,
                  onChanged: _onExamSelected,
                  icon: Icons.assignment_rounded,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildCompactDropdown(
                  label: 'Class',
                  value: _selectedClassId,
                  items: _classes,
                  onChanged: _onClassSelected,
                  icon: Icons.class_rounded,
                ),
              ),
            ],
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
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          isExpanded: true,
          value: value,
          hint: Text(label, style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF94A3B8))),
          icon: const Icon(Icons.keyboard_arrow_down_rounded, color: Color(0xFF64748B), size: 18),
          onChanged: onChanged,
          items: items.map((item) {
            String name = item['name'] ?? item['title'] ?? item['className'] ?? 'Unknown';
            if (item['section'] != null && item['section'].toString().trim().isNotEmpty) {
              name = '$name - ${item['section']}';
            }
            return DropdownMenuItem<String>(
              value: item['id'].toString(),
              child: Text(
                name, 
                style: GoogleFonts.poppins(
                  fontSize: 13, 
                  fontWeight: value == item['id'].toString() ? FontWeight.bold : FontWeight.normal,
                  color: value == item['id'].toString() ? const Color(0xFF6366F1) : const Color(0xFF1E293B)
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
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
    List<dynamic> schedule = settings['schedule'] ?? [];
    
    // If schedule is empty in settings, fallback to subjects array with default date
    if (schedule.isEmpty) {
      final String defaultDate = _selectedExamData?['examDate'] != null 
          ? _selectedExamData!['examDate'].toString().split('T')[0] 
          : 'TBA';
      
      List<dynamic> subjects = [];
      if (_selectedExamData?['subjects'] is List) {
        subjects = _selectedExamData!['subjects'];
      }
      
      schedule = subjects.map((subj) {
        return {
          'subjectId': subj['id'],
          'subjectName': subj['name'],
          'date': defaultDate,
          'time': 'TBA',
        };
      }).toList();
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
      margin: const EdgeInsets.only(bottom: 24),
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
          // Premium Header
          Container(
            padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 20),
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
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.school_rounded, color: Colors.white, size: 28),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'JY SCHOOL',
                        style: GoogleFonts.outfit(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 2,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'HALL TICKET - ${term.toUpperCase()}',
                        style: GoogleFonts.poppins(
                          color: const Color(0xFF93C5FD),
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.5,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          // Student Info Section
          Padding(
            padding: const EdgeInsets.all(20.0),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Profile Picture
                Container(
                  width: 90,
                  height: 110,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFCBD5E1), width: 2),
                    image: DecorationImage(
                      image: NetworkImage(image),
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
                const SizedBox(width: 20),
                // Details
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        studentName,
                        style: GoogleFonts.outfit(
                          color: const Color(0xFF1E293B),
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 12),
                      _buildInfoRow('Roll No', rollNo),
                      const SizedBox(height: 6),
                      _buildInfoRow('Class', className),
                      const SizedBox(height: 6),
                      _buildInfoRow('Exam', examName),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const Divider(height: 1, color: Color(0xFFE2E8F0), thickness: 1),

          // Exam Schedule
          Padding(
            padding: const EdgeInsets.all(20.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.event_note_rounded, color: Color(0xFF6366F1), size: 18),
                    const SizedBox(width: 8),
                    Text(
                      'EXAM SCHEDULE',
                      style: GoogleFonts.outfit(
                        color: const Color(0xFF6366F1),
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                if (schedule.isEmpty)
                  Text(
                    'No schedule available yet.',
                    style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 13),
                  )
                else
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Table(
                        columnWidths: const {
                          0: FlexColumnWidth(2),
                          1: FlexColumnWidth(1.2),
                          2: FlexColumnWidth(1.5),
                        },
                        children: [
                          TableRow(
                            decoration: const BoxDecoration(color: Color(0xFFF1F5F9)),
                            children: [
                              _buildTableHeader('SUBJECT'),
                              _buildTableHeader('DATE'),
                              _buildTableHeader('TIME'),
                            ],
                          ),
                          ...schedule.map((item) {
                            final sName = item['subjectName'] ?? item['name'] ?? 'Subject';
                            final sDate = item['date'] ?? 'TBA';
                            final sTime = item['time'] ?? 'TBA';
                            return TableRow(
                              decoration: const BoxDecoration(
                                border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
                              ),
                              children: [
                                Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                  child: Text(sName, style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.bold, color: const Color(0xFF334155))),
                                ),
                                Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                  child: Text(sDate, style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF475569))),
                                ),
                                Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                  child: Text(sTime, style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF475569))),
                                ),
                              ],
                            );
                          }).toList(),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          ),

          const Divider(height: 1, color: Color(0xFFE2E8F0), thickness: 1),

          // Instructions Section
          Padding(
            padding: const EdgeInsets.all(20.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.info_outline_rounded, color: Color(0xFFEF4444), size: 18),
                    const SizedBox(width: 8),
                    Text(
                      'IMPORTANT INSTRUCTIONS',
                      style: GoogleFonts.outfit(
                        color: const Color(0xFFEF4444),
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  instructions,
                  style: GoogleFonts.poppins(
                    color: const Color(0xFF475569),
                    fontSize: 11,
                    height: 1.6,
                  ),
                ),
              ],
            ),
          ),

          // Footer / Signature Area
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            decoration: const BoxDecoration(
              color: Color(0xFFF8FAFC),
              borderRadius: BorderRadius.only(
                bottomLeft: Radius.circular(18),
                bottomRight: Radius.circular(18),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Column(
                  children: [
                    if (teacherSignatureUrl.isNotEmpty)
                      Image.network(teacherSignatureUrl, height: 40, width: 80, fit: BoxFit.contain)
                    else
                      const SizedBox(height: 40),
                    Container(width: 80, height: 1, color: const Color(0xFFCBD5E1)),
                    const SizedBox(height: 8),
                    Text(
                      'Teacher',
                      style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 11, fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
                Column(
                  children: [
                    if (signatureUrl.isNotEmpty)
                      Image.network(signatureUrl, height: 40, width: 80, fit: BoxFit.contain)
                    else
                      const SizedBox(height: 40),
                    Container(width: 80, height: 1, color: const Color(0xFFCBD5E1)),
                    const SizedBox(height: 8),
                    Text(
                      'Principal',
                      style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 11, fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Share/Download Button
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Downloading/Sharing Admit Card... (PDF generation)')));
                },
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFF6366F1),
                  side: const BorderSide(color: Color(0xFF6366F1), width: 1.5),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                icon: const Icon(Icons.ios_share_rounded, size: 18),
                label: Text('Share Admit Card', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 14)),
              ),
            ),
          ),
        ],
      ),
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
