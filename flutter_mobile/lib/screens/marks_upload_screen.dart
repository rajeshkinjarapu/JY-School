import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../widgets/app_drawer.dart';

class MarksUploadScreen extends StatefulWidget {
  const MarksUploadScreen({super.key});

  @override
  State<MarksUploadScreen> createState() => _MarksUploadScreenState();
}

class _MarksUploadScreenState extends State<MarksUploadScreen> {
  List<dynamic> _exams = [];
  List<dynamic> _classes = [];
  List<dynamic> _students = [];
  List<dynamic> _subjects = [];

  String? _selectedExamId;
  String? _selectedClassId;
  String? _selectedSubjectId;
  
  bool _isLoadingDropdowns = true;
  bool _isLoadingStudents = false;
  bool _isSubmitting = false;
  String? _errorMessage;

  final Map<String, TextEditingController> _marksControllers = {};
  double _maxMarks = 100;

  @override
  void initState() {
    super.initState();
    _fetchDropdownData();
  }

  @override
  void dispose() {
    for (var controller in _marksControllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _fetchDropdownData() async {
    setState(() => _isLoadingDropdowns = true);
    try {
      final examsRes = await ApiService.getExams();
      final classesRes = await ApiService.getClasses();
      final subjectsRes = await ApiService.getSubjects();

      if (mounted) {
        setState(() {
          _exams = examsRes['success'] ? examsRes['data'] ?? [] : [];
          _classes = classesRes['success'] ? classesRes['data'] ?? [] : [];
          _subjects = subjectsRes['success'] ? subjectsRes['data'] ?? [] : [];
          _isLoadingDropdowns = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Failed to load filters: $e';
          _isLoadingDropdowns = false;
        });
      }
    }
  }

  Future<void> _fetchStudentsForClass() async {
    if (_selectedClassId == null) return;
    setState(() => _isLoadingStudents = true);

    try {
      final res = await ApiService.getStudents(classId: _selectedClassId);
      if (res['success']) {
        setState(() {
          _students = res['data'] ?? [];
          // Initialize controllers
          _marksControllers.clear();
          for (var s in _students) {
            _marksControllers[s['id'].toString()] = TextEditingController();
          }
          _isLoadingStudents = false;
        });
      } else {
        setState(() => _isLoadingStudents = false);
      }
    } catch (e) {
      setState(() => _isLoadingStudents = false);
    }
  }

  Future<void> _submitMarks() async {
    if (_selectedExamId == null || _selectedClassId == null || _selectedSubjectId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select Exam, Class and Subject'), backgroundColor: Colors.red));
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      // Gather marks
      List<Map<String, dynamic>> marksData = [];
      for (var s in _students) {
        final sid = s['id'].toString();
        final val = _marksControllers[sid]?.text ?? '';
        if (val.isNotEmpty) {
          marksData.add({
            'studentId': sid,
            'marksObtained': double.tryParse(val) ?? 0.0,
          });
        }
      }

      if (marksData.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter marks for at least one student'), backgroundColor: Colors.red));
        setState(() => _isSubmitting = false);
        return;
      }

      final payload = {
        'examId': _selectedExamId,
        'classId': _selectedClassId,
        'subjectId': _selectedSubjectId,
        'maxMarks': _maxMarks,
        'marks': marksData,
      };

      final res = await ApiService.uploadMarks(payload);
      if (mounted) {
        setState(() => _isSubmitting = false);
        if (res['success']) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Marks uploaded successfully!'), backgroundColor: Colors.green));
          _marksControllers.forEach((_, c) => c.clear());
        } else {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(res['message'] ?? 'Upload failed'), backgroundColor: Colors.red));
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSubmitting = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9), // Slight gray background
      drawer: const AppDrawer(currentRoute: 'marks'),
      appBar: AppBar(
        title: Text('Upload Marks', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 18)),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF1E293B),
        elevation: 0,
      ),
      body: _isLoadingDropdowns
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                _buildFiltersPanel(),
                Expanded(
                  child: _isLoadingStudents
                      ? const Center(child: CircularProgressIndicator())
                      : _students.isEmpty
                          ? Center(child: Text('Select filters to load students', style: GoogleFonts.poppins(color: const Color(0xFF94A3B8))))
                          : _buildStudentsList(),
                ),
                if (_students.isNotEmpty)
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -4))],
                    ),
                    child: SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        onPressed: _isSubmitting ? null : _submitMarks,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF6366F1),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: _isSubmitting
                            ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                            : Text('Submit Marks', style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                      ),
                    ),
                  )
              ],
            ),
    );
  }

  Widget _buildFiltersPanel() {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 16, offset: const Offset(0, 4))
        ],
      ),
      child: Column(
        children: [
          _buildDropdown(
            hint: 'Select Exam',
            value: _selectedExamId,
            items: _exams,
            icon: Icons.assignment_rounded,
            onChanged: (val) {
              setState(() { _selectedExamId = val; });
            },
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildDropdown(
                  hint: 'Class',
                  value: _selectedClassId,
                  items: _classes,
                  icon: Icons.class_rounded,
                  onChanged: (val) {
                    setState(() { _selectedClassId = val; });
                    _fetchStudentsForClass();
                  },
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildDropdown(
                  hint: 'Subject',
                  value: _selectedSubjectId,
                  items: _subjects,
                  icon: Icons.book_rounded,
                  onChanged: (val) {
                    setState(() { _selectedSubjectId = val; });
                  },
                ),
              ),
            ],
          )
        ],
      ),
    );
  }

  Widget _buildDropdown({
    required String hint,
    required String? value,
    required List<dynamic> items,
    required IconData icon,
    required Function(String?) onChanged,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          isExpanded: true,
          value: value,
          hint: Row(
            children: [
              Icon(icon, size: 18, color: const Color(0xFF94A3B8)),
              const SizedBox(width: 8),
              Text(hint, style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 14)),
            ],
          ),
          icon: const Icon(Icons.keyboard_arrow_down_rounded, color: Color(0xFF94A3B8)),
          items: items.map<DropdownMenuItem<String>>((item) {
            String label = item['name'] ?? item['className'] ?? 'Unknown';
            if (item['section'] != null) label += ' ';
            return DropdownMenuItem<String>(
              value: item['id']?.toString() ?? '',
              child: Text(label, style: GoogleFonts.poppins(color: const Color(0xFF1E293B), fontSize: 14)),
            );
          }).toList(),
          onChanged: onChanged,
        ),
      ),
    );
  }

  Widget _buildStudentsList() {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      itemCount: _students.length,
      itemBuilder: (context, index) {
        final student = _students[index];
        final name = student['user']?['name'] ?? 'Unknown';
        final rollNo = student['rollNo'] ?? 'N/A';
        final sid = student['id'].toString();

        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFF1F5F9)),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.01), blurRadius: 4, offset: const Offset(0, 2))],
          ),
          child: Row(
            children: [
              // Initials Avatar
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: const Color(0xFFE0E7FF),
                  borderRadius: BorderRadius.circular(12),
                ),
                alignment: Alignment.center,
                child: Text(
                  name.isNotEmpty ? name[0].toUpperCase() : 'S',
                  style: GoogleFonts.poppins(color: const Color(0xFF4F46E5), fontWeight: FontWeight.bold, fontSize: 16),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(name, style: GoogleFonts.poppins(color: const Color(0xFF1E293B), fontWeight: FontWeight.w600, fontSize: 14)),
                    Text('Roll: $rollNo', style: GoogleFonts.poppins(color: const Color(0xFF94A3B8), fontSize: 12)),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              // Marks Input
              SizedBox(
                width: 80,
                child: TextField(
                  controller: _marksControllers[sid],
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  textAlign: TextAlign.center,
                  style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16, color: const Color(0xFF1E293B)),
                  decoration: InputDecoration(
                    hintText: '-',
                    hintStyle: const TextStyle(color: Color(0xFFCBD5E1)),
                    filled: true,
                    fillColor: const Color(0xFFF8FAFC),
                    contentPadding: const EdgeInsets.symmetric(vertical: 10),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF6366F1), width: 2)),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
