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

  // Controllers to hold marks input
  final Map<String, TextEditingController> _marksControllers = {};
  
  // To get maxMarks from the selected exam's selected subject
  double _maxMarks = 100;

  @override
  void initState() {
    super.initState();
    _fetchDropdownData();
  }

  @override
  void dispose() {
    _marksControllers.forEach((_, controller) => controller.dispose());
    super.dispose();
  }

  Future<void> _fetchDropdownData() async {
    setState(() => _isLoadingDropdowns = true);

    try {
      final examsRes = await ApiService.getExams();
      final classesRes = await ApiService.getClasses();

      if (mounted) {
        setState(() {
          _exams = examsRes['success'] ? (examsRes['data'] ?? []) : [];
          _classes = classesRes['success'] ? (classesRes['data'] ?? []) : [];
          _isLoadingDropdowns = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Failed to load initial data.';
          _isLoadingDropdowns = false;
        });
      }
    }
  }

  void _onExamSelected(String? examId) {
    if (examId == null) return;
    setState(() {
      _selectedExamId = examId;
      _selectedSubjectId = null;
      _students.clear();
      _marksControllers.clear();
      
      // Update subjects based on the selected exam
      final exam = _exams.firstWhere((e) => e['id'] == examId, orElse: () => null);
      if (exam != null) {
        // Exams contain JSON array of subjects in the backend structure
        final rawSubjects = exam['subjects'] ?? [];
        if (rawSubjects is String) {
          // If stored as stringified JSON (fallback, backend normally parses it)
        } else if (rawSubjects is List) {
          _subjects = rawSubjects;
        }
      }
    });
  }

  Future<void> _fetchStudents() async {
    if (_selectedClassId == null) return;
    
    setState(() {
      _isLoadingStudents = true;
      _errorMessage = null;
      _students.clear();
      _marksControllers.forEach((_, c) => c.dispose());
      _marksControllers.clear();
    });

    final res = await ApiService.getStudents(classId: _selectedClassId);

    if (mounted) {
      if (res['success']) {
        final List<dynamic> list = res['data'] ?? [];
        setState(() {
          _students = list;
          for (var s in list) {
            final id = s['id'];
            _marksControllers[id] = TextEditingController();
          }
          _isLoadingStudents = false;
        });
      } else {
        setState(() {
          _errorMessage = res['message'];
          _isLoadingStudents = false;
        });
      }
    }
  }

  Future<void> _handleSubmit() async {
    if (_selectedExamId == null || _selectedSubjectId == null || _students.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select Exam, Class, and Subject.')));
      return;
    }

    setState(() => _isSubmitting = true);

    List<Map<String, dynamic>> marksToSubmit = [];
    
    for (var s in _students) {
      final studentId = s['id'];
      final text = _marksControllers[studentId]?.text.trim();
      
      if (text != null && text.isNotEmpty) {
        final marksObtained = double.tryParse(text);
        if (marksObtained != null) {
          marksToSubmit.add({
            'studentId': studentId,
            'examId': _selectedExamId,
            'subjectId': _selectedSubjectId,
            'marksObtained': marksObtained,
            'maxMarks': _maxMarks,
            'remarks': '',
          });
        }
      }
    }

    if (marksToSubmit.isEmpty) {
      setState(() => _isSubmitting = false);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('No marks entered.')));
      return;
    }

    final res = await ApiService.submitBulkMarks(marksToSubmit);

    if (mounted) {
      setState(() => _isSubmitting = false);
      if (res['success']) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Marks submitted successfully!', style: GoogleFonts.poppins()),
            backgroundColor: const Color(0xFF10B981),
            behavior: SnackBarBehavior.floating,
          )
        );
        // Clear inputs after success
        for (var c in _marksControllers.values) {
          c.clear();
        }
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(res['message'] ?? 'Submission failed', style: GoogleFonts.poppins()),
            backgroundColor: Colors.redAccent,
            behavior: SnackBarBehavior.floating,
          )
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F7FE),
      drawer: const AppDrawer(currentRoute: 'exams'),
      appBar: AppBar(
        leading: const BackButton(),
        title: Text('Upload Marks', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white)),
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
      body: _isLoadingDropdowns
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF6366F1)))
          : Column(
              children: [
                _buildFiltersCard(),
                Expanded(
                  child: _isLoadingStudents
                      ? const Center(child: CircularProgressIndicator(color: Color(0xFF6366F1)))
                      : _errorMessage != null
                          ? Center(child: Text(_errorMessage!, style: const TextStyle(color: Colors.red)))
                          : _students.isEmpty
                              ? Center(
                                  child: Text(
                                    'Please select Class and Subject to view students',
                                    style: GoogleFonts.poppins(color: const Color(0xFF475569)),
                                  ),
                                )
                              : _buildStudentsList(),
                ),
                if (_students.isNotEmpty && !_isLoadingStudents)
                  _buildSubmitButton(),
              ],
            ),
    );
  }

  Widget _buildFiltersCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: const BoxDecoration(
        color: Color(0xFF1E293B),
      ),
      child: Column(
        children: [
          // Exam Selection
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFF334155)),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                isExpanded: true,
                dropdownColor: Colors.white,
                hint: Text('Select Exam', style: GoogleFonts.poppins(color: const Color(0xFF475569))),
                value: _selectedExamId,
                style: GoogleFonts.poppins(color: const Color(0xFF1E293B), fontWeight: FontWeight.w600),
                items: _exams.map((e) {
                  return DropdownMenuItem<String>(
                    value: e['id'],
                    child: Text('${e['name']} (${e['term']})'),
                  );
                }).toList(),
                onChanged: _onExamSelected,
              ),
            ),
          ),
          const SizedBox(height: 12),
          // Class and Subject Row
          Row(
            children: [
              // Class Selection
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFF334155)),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      isExpanded: true,
                      dropdownColor: Colors.white,
                      hint: Text('Class', style: GoogleFonts.poppins(color: const Color(0xFF475569))),
                      value: _selectedClassId,
                      style: GoogleFonts.poppins(color: const Color(0xFF1E293B), fontWeight: FontWeight.w600),
                      items: _classes.map((c) {
                        return DropdownMenuItem<String>(
                          value: c['id'],
                          child: Text('${c['name']}-${c['section']}'),
                        );
                      }).toList(),
                      onChanged: (val) {
                        setState(() => _selectedClassId = val);
                        if (_selectedSubjectId != null) {
                          _fetchStudents();
                        }
                      },
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              // Subject Selection
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFF334155)),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      isExpanded: true,
                      dropdownColor: Colors.white,
                      hint: Text('Subject', style: GoogleFonts.poppins(color: const Color(0xFF475569))),
                      value: _selectedSubjectId,
                      style: GoogleFonts.poppins(color: const Color(0xFF1E293B), fontWeight: FontWeight.w600),
                      items: _subjects.map((s) {
                        return DropdownMenuItem<String>(
                          value: s['id'],
                          child: Text(s['name'] ?? 'Subject'),
                        );
                      }).toList(),
                      onChanged: (val) {
                        setState(() {
                          _selectedSubjectId = val;
                          final subj = _subjects.firstWhere((s) => s['id'] == val, orElse: () => null);
                          if (subj != null) {
                            _maxMarks = double.tryParse(subj['maxMarks']?.toString() ?? '100') ?? 100;
                          }
                        });
                        if (_selectedClassId != null) {
                          _fetchStudents();
                        }
                      },
                    ),
                  ),
                ),
              ),
            ],
          )
        ],
      ),
    );
  }

  Widget _buildStudentsList() {
    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: _students.length,
      itemBuilder: (context, index) {
        final s = _students[index];
        final id = s['id'];
        final user = s['user'] ?? {};
        final name = user['name'] ?? 'Student';
        final rollNo = s['rollNo'] ?? '-';
        
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.03),
                blurRadius: 10,
                offset: const Offset(0, 4),
              )
            ],
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Row(
            children: [
              CircleAvatar(
                backgroundColor: const Color(0xFF6366F1).withOpacity(0.1),
                child: Text(
                  name[0].toUpperCase(),
                  style: GoogleFonts.outfit(color: const Color(0xFF6366F1), fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: GoogleFonts.outfit(
                        color: const Color(0xFF1E293B),
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      'Roll No: $rollNo',
                      style: GoogleFonts.poppins(
                        color: const Color(0xFF475569),
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 14),
              SizedBox(
                width: 80,
                child: TextField(
                  controller: _marksControllers[id],
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  textAlign: TextAlign.center,
                  style: GoogleFonts.poppins(fontWeight: FontWeight.bold),
                  decoration: InputDecoration(
                    hintText: ' / ${_maxMarks.toInt()}',
                    hintStyle: GoogleFonts.poppins(color: const Color(0xFF475569), fontSize: 13),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
                    filled: true,
                    fillColor: const Color(0xFFF8FAFC),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: const BorderSide(color: Color(0xFF6366F1)),
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildSubmitButton() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
      ),
      child: SizedBox(
        width: double.infinity,
        height: 54,
        child: ElevatedButton(
          onPressed: _isSubmitting ? null : _handleSubmit,
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF6366F1),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            elevation: 4,
          ),
          child: _isSubmitting
              ? const SizedBox(
                  width: 24, height: 24,
                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                )
              : Text(
                  'Upload Marks',
                  style: GoogleFonts.outfit(
                    color: const Color(0xFF1E293B),
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
        ),
      ),
    );
  }
}


