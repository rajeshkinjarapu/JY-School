import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../widgets/app_drawer.dart';

class TeacherMarksScreen extends StatefulWidget {
  const TeacherMarksScreen({super.key});

  @override
  State<TeacherMarksScreen> createState() => _TeacherMarksScreenState();
}

class _TeacherMarksScreenState extends State<TeacherMarksScreen> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  
  List<dynamic> _exams = [];
  List<dynamic> _classes = [];
  List<dynamic> _subjects = [];
  List<dynamic> _students = [];

  String? _selectedExamId;
  String? _selectedClassId;
  String? _selectedSubjectId;

  bool _loadingSelectors = true;
  bool _loadingStudents = false;
  bool _isSubmitting = false;
  String? _errorMessage;

  // Local marks storage map: studentId -> marksObtained
  final Map<String, TextEditingController> _marksControllers = {};
  double _maxMarks = 100;

  @override
  void initState() {
    super.initState();
    _fetchSelectors();
  }

  @override
  void dispose() {
    _marksControllers.forEach((_, controller) => controller.dispose());
    super.dispose();
  }

  Future<void> _fetchSelectors() async {
    final results = await Future.wait([
      ApiService.getExams(),
      ApiService.getClasses(),
      ApiService.getSubjects(),
    ]);

    if (mounted) {
      if (results[0]['success'] && results[1]['success'] && results[2]['success']) {
        final examList = results[0]['data'] ?? [];
        final classList = results[1]['data'] ?? [];
        final subjectList = results[2]['data'] ?? [];

        setState(() {
          _exams = examList;
          _classes = classList;
          _subjects = subjectList;
          _loadingSelectors = false;

          if (examList.isNotEmpty) {
            _selectedExamId = examList[0]['id'];
            _maxMarks = double.tryParse(examList[0]['maxMarks']?.toString() ?? '100') ?? 100;
          }
          if (classList.isNotEmpty) _selectedClassId = classList[0]['id'];
          if (subjectList.isNotEmpty) _selectedSubjectId = subjectList[0]['id'];

          _fetchStudents();
        });
      } else {
        setState(() {
          _errorMessage = 'Failed to load options';
          _loadingSelectors = false;
        });
      }
    }
  }

  Future<void> _fetchStudents() async {
    if (_selectedClassId == null) return;
    setState(() {
      _loadingStudents = true;
      _errorMessage = null;
      _students = [];
      _marksControllers.forEach((_, controller) => controller.dispose());
      _marksControllers.clear();
    });

    final result = await ApiService.getClassStudents(_selectedClassId!);

    if (mounted) {
      if (result['success']) {
        final List<dynamic> studentList = result['data'] ?? [];
        setState(() {
          _students = studentList;
          _loadingStudents = false;
          
          for (var s in studentList) {
            final studentId = s['id'];
            _marksControllers[studentId] = TextEditingController();
          }
        });
      } else {
        setState(() {
          _errorMessage = result['message'];
          _loadingStudents = false;
        });
      }
    }
  }

  Future<void> _handleSubmit() async {
    if (_selectedExamId == null || _selectedClassId == null || _selectedSubjectId == null || _students.isEmpty) return;

    // Validate marks before submitting
    for (var s in _students) {
      final studentId = s['id'];
      final marksText = _marksControllers[studentId]?.text.trim() ?? '';
      if (marksText.isEmpty) {
        setState(() {
          _errorMessage = 'Please enter marks for all students';
        });
        return;
      }
      final marks = double.tryParse(marksText);
      if (marks == null || marks < 0 || marks > _maxMarks) {
        setState(() {
          _errorMessage = 'Marks must be between 0 and $_maxMarks';
        });
        return;
      }
    }

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    final List<Map<String, dynamic>> marksData = _students.map((s) {
      final studentId = s['id'];
      final marksObtained = double.parse(_marksControllers[studentId]!.text.trim());
      return {
        'studentId': studentId,
        'examId': _selectedExamId,
        'subjectId': _selectedSubjectId,
        'marksObtained': marksObtained,
        'maxMarks': _maxMarks,
        'remarks': 'Entered via Mobile App',
      };
    }).toList();

    final result = await ApiService.submitBulkMarks(marksData);

    if (mounted) {
      setState(() {
        _isSubmitting = false;
      });

      if (result['success']) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Marks saved successfully!',
              style: GoogleFonts.poppins(fontWeight: FontWeight.w600, color: const Color(0xFF1E293B)),
            ),
            backgroundColor: const Color(0xFF10B981),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          ),
        );
      } else {
        setState(() {
          _errorMessage = result['message'];
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: const Color(0xFFF4F7FE), // Match theme
      drawer: const AppDrawer(currentRoute: 'exams'),
      appBar: AppBar(
        leading: const BackButton(),
        title: Text(
          'Marks Entry',
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
      ),
      body: _loadingSelectors
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF6366F1)))
          : Column(
              children: [
                // Dropdown selectors wrapper
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    border: Border(bottom: BorderSide(color: const Color(0xFFE2E8F0))),
                  ),
                  child: Column(
                    children: [
                      // 1. Exam selector
                      _buildDropdownRow(
                        label: 'Exam:  ',
                        child: DropdownButton<String>(
                          value: _selectedExamId,
                          dropdownColor: const Color(0xFFE2E8F0),
                          style: GoogleFonts.poppins(color: const Color(0xFF1E293B), fontWeight: FontWeight.w600),
                          items: _exams.map<DropdownMenuItem<String>>((e) {
                            return DropdownMenuItem<String>(
                              value: e['id'],
                              child: Text(e['name'] ?? 'Exam'),
                            );
                          }).toList(),
                          onChanged: (value) {
                            final selectedExam = _exams.firstWhere((e) => e['id'] == value);
                            setState(() {
                              _selectedExamId = value;
                              _maxMarks = double.tryParse(selectedExam['maxMarks']?.toString() ?? '100') ?? 100;
                            });
                          },
                        ),
                      ),
                      const SizedBox(height: 12),
                      
                      // 2. Class and Subject selectors row
                      Column(
                        children: [
                          _buildDropdownRow(
                            label: 'Class: ',
                            child: DropdownButton<String>(
                              value: _selectedClassId,
                              dropdownColor: const Color(0xFFE2E8F0),
                              style: GoogleFonts.poppins(color: const Color(0xFF1E293B), fontWeight: FontWeight.w600),
                              items: _classes.map<DropdownMenuItem<String>>((c) {
                                return DropdownMenuItem<String>(
                                  value: c['id'],
                                  child: Text('${c['name']}-${c['section']}'),
                                );
                              }).toList(),
                              onChanged: (value) {
                                setState(() {
                                  _selectedClassId = value;
                                });
                                _fetchStudents();
                              },
                            ),
                          ),
                          const SizedBox(height: 12),
                          _buildDropdownRow(
                            label: 'Subj: ',
                            child: DropdownButton<String>(
                              value: _selectedSubjectId,
                              dropdownColor: const Color(0xFFE2E8F0),
                              style: GoogleFonts.poppins(color: const Color(0xFF1E293B), fontWeight: FontWeight.w600),
                              items: _subjects.map<DropdownMenuItem<String>>((s) {
                                return DropdownMenuItem<String>(
                                  value: s['id'],
                                  child: Text(s['name']),
                                );
                              }).toList(),
                              onChanged: (value) {
                                setState(() {
                                  _selectedSubjectId = value;
                                });
                              },
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                
                // Student Roster
                Expanded(
                  child: _loadingStudents
                      ? const Center(child: CircularProgressIndicator(color: Color(0xFF6366F1)))
                      : _errorMessage != null
                          ? Center(
                              child: Padding(
                                padding: const EdgeInsets.all(20.0),
                                child: Text(
                                  _errorMessage!,
                                  style: GoogleFonts.poppins(color: Colors.redAccent, fontSize: 14),
                                  textAlign: TextAlign.center,
                                ),
                              ),
                            )
                          : _students.isEmpty
                              ? Center(
                                  child: Text(
                                    'No students found in this class.',
                                    style: GoogleFonts.poppins(color: const Color(0xFF475569)),
                                  ),
                                )
                              : ListView.builder(
                                  padding: const EdgeInsets.all(20),
                                  itemCount: _students.length,
                                  itemBuilder: (context, index) {
                                    final s = _students[index];
                                    final studentId = s['id'];
                                    final name = s['user']?['name'] ?? 'Student';
                                    final rollNo = s['rollNo'] ?? '-';
                                    final controller = _marksControllers[studentId];

                                    return Container(
                                      margin: const EdgeInsets.only(bottom: 16),
                                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                      decoration: BoxDecoration(
                                        color: Colors.white,
                                        borderRadius: BorderRadius.circular(20),
                                        border: Border.all(color: const Color(0xFFE2E8F0)),
                                      ),
                                      child: Row(
                                        children: [
                                          CircleAvatar(
                                            backgroundColor: const Color(0xFFC084FC).withOpacity(0.15),
                                            child: Text(
                                              name.isNotEmpty ? name[0].toUpperCase() : 'S',
                                              style: GoogleFonts.outfit(
                                                color: const Color(0xFFC084FC),
                                                fontWeight: FontWeight.bold,
                                              ),
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
                                                    fontSize: 15,
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
                                          const SizedBox(width: 10),
                                          
                                          // Score Entry Text Box
                                          SizedBox(
                                            width: 80,
                                            child: TextFormField(
                                              controller: controller,
                                              keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                              textAlign: TextAlign.center,
                                              style: GoogleFonts.poppins(color: const Color(0xFF1E293B), fontWeight: FontWeight.bold),
                                              decoration: InputDecoration(
                                                hintText: '/$_maxMarks',
                                                hintStyle: GoogleFonts.poppins(color: const Color(0xFFCBD5E1), fontSize: 12),
                                                contentPadding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
                                                filled: true,
                                                fillColor: Colors.white,
                                                border: OutlineInputBorder(
                                                  borderRadius: BorderRadius.circular(12),
                                                  borderSide: BorderSide(color: const Color(0xFFE2E8F0)),
                                                ),
                                                enabledBorder: OutlineInputBorder(
                                                  borderRadius: BorderRadius.circular(12),
                                                  borderSide: BorderSide(color: const Color(0xFFE2E8F0)),
                                                ),
                                                focusedBorder: OutlineInputBorder(
                                                  borderRadius: BorderRadius.circular(12),
                                                  borderSide: const BorderSide(color: Color(0xFF818CF8), width: 1.5),
                                                ),
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    );
                                  },
                                ),
                ),

                // Submit Button
                if (_students.isNotEmpty && !_loadingStudents)
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: const Color(0xFFE2E8F0),
                      border: Border(top: BorderSide(color: const Color(0xFFE2E8F0))),
                    ),
                    child: Container(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF6366F1).withOpacity(0.3),
                            blurRadius: 15,
                            offset: const Offset(0, 4),
                          )
                        ],
                      ),
                      child: ElevatedButton(
                        onPressed: _isSubmitting ? null : _handleSubmit,
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          backgroundColor: Colors.transparent,
                          shadowColor: Colors.transparent,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                        child: Ink(
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFF6366F1), Color(0xFFD946EF)],
                            ),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Container(
                            alignment: Alignment.center,
                            height: 54,
                            child: _isSubmitting
                                ? const SizedBox(
                                    height: 24,
                                    width: 24,
                                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                                  )
                                : Text(
                                    'Submit Marks Roster',
                                    style: GoogleFonts.poppins(
                                      color: const Color(0xFF1E293B),
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                          ),
                        ),
                      ),
                    ),
                  )
              ],
            ),
    );
  }

  Widget _buildDropdownRow({required String label, required Widget child}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(label, style: GoogleFonts.poppins(color: const Color(0xFF475569), fontSize: 13, fontWeight: FontWeight.bold)),
          DropdownButtonHideUnderline(child: child),
        ],
      ),
    );
  }
}


