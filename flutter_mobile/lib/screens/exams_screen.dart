import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';
import '../widgets/app_drawer.dart';
import 'create_exam_screen.dart';

class ExamsScreen extends StatefulWidget {
  const ExamsScreen({super.key});

  @override
  State<ExamsScreen> createState() => _ExamsScreenState();
}

class _ExamsScreenState extends State<ExamsScreen> {
  List<dynamic> _examResults = [];
  List<dynamic> _examsList = [];
  bool _isLoading = true;
  String? _errorMessage;
  String? _userRole;

  @override
  void initState() {
    super.initState();
    _fetchResults();
  }

  Future<void> _fetchResults() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      final prefs = await SharedPreferences.getInstance();
      final userString = prefs.getString('user');
      if (userString == null) {
        setState(() {
          _errorMessage = 'User session not found';
          _isLoading = false;
        });
        return;
      }

      final user = jsonDecode(userString);
      _userRole = user['role'];

      if (_userRole == 'STUDENT') {
        final studentId = user['student']?['id'];
        if (studentId == null) {
          setState(() {
            _errorMessage = 'Student profile information not found';
            _isLoading = false;
          });
          return;
        }

        final result = await ApiService.getMarks(studentId);

        if (mounted) {
          if (result['success']) {
            setState(() {
              _examResults = result['data'] ?? [];
              _isLoading = false;
            });
          } else {
            setState(() {
              _errorMessage = result['message'];
              _isLoading = false;
            });
          }
        }
      } else {
        // Teacher or Admin -> Fetch exams list
        final result = await ApiService.getExams();
        
        if (mounted) {
          if (result['success']) {
            setState(() {
              _examsList = result['data'] ?? [];
              _isLoading = false;
            });
          } else {
            setState(() {
              _errorMessage = result['message'];
              _isLoading = false;
            });
          }
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'An error occurred: $e';
          _isLoading = false;
        });
      }
    }
  }

  Color _getGradeColor(String grade) {
    switch (grade) {
      case 'A1':
      case 'A2':
      case 'A+':
      case 'A':
        return const Color(0xFF10B981); // Emerald
      case 'B1':
      case 'B2':
      case 'B+':
      case 'B':
        return const Color(0xFF3B82F6); // Blue
      case 'C1':
      case 'C2':
      case 'C+':
      case 'C':
        return const Color(0xFFF59E0B); // Amber
      case 'F':
      case 'FAIL':
        return const Color(0xFFEF4444); // Red
      default:
        return const Color(0xFF64748B); // Slate
    }
  }

  @override
  Widget build(BuildContext context) {
    final bool isStudent = _userRole == 'STUDENT';
    final title = isStudent ? 'My Results' : 'Examinations';

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      drawer: const AppDrawer(currentRoute: 'exams'),
      appBar: AppBar(
        title: Text(title, style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 18)),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF1E293B),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _fetchResults,
          )
        ],
      ),
      floatingActionButton: (!isStudent && (_userRole == 'SUPER_ADMIN' || _userRole == 'ADMIN' || _userRole == 'TEACHER')) 
          ? FloatingActionButton.extended(
              onPressed: () {
                Navigator.push(context, MaterialPageRoute(builder: (context) => const CreateExamScreen()))
                    .then((value) { if (value == true) _fetchResults(); });
              },
              backgroundColor: const Color(0xFF6366F1),
              icon: const Icon(Icons.add, color: Colors.white),
              label: const Text('New Exam', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            )
          : null,
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline_rounded, size: 60, color: Colors.redAccent),
                      const SizedBox(height: 16),
                      Text(_errorMessage!, textAlign: TextAlign.center, style: GoogleFonts.poppins()),
                      const SizedBox(height: 16),
                      ElevatedButton(onPressed: _fetchResults, child: const Text('Retry'))
                    ],
                  ),
                )
              : isStudent
                  ? _buildStudentResults()
                  : _buildExamsList(),
    );
  }

  Widget _buildExamsList() {
    if (_examsList.isEmpty) {
      return Center(
        child: Text("No exams found.", style: GoogleFonts.poppins(color: const Color(0xFF64748B))),
      );
    }
    return RefreshIndicator(
      onRefresh: _fetchResults,
      child: ListView.builder(
        padding: const EdgeInsets.all(20),
        itemCount: _examsList.length,
        itemBuilder: (context, index) {
          final exam = _examsList[index];
          final name = exam['name'] ?? 'Exam';
          final term = exam['term'] ?? '';
          final classes = exam['classes'] as List? ?? [];
          final classNames = classes.map((c) => c['className'] ?? '').join(', ');

          return Container(
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 12, offset: const Offset(0, 4))
              ],
            ),
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          name,
                          style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B)),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFF6366F1).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          term,
                          style: GoogleFonts.poppins(color: const Color(0xFF6366F1), fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      const Icon(Icons.class_rounded, size: 16, color: Color(0xFF94A3B8)),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Classes: $classNames',
                          style: GoogleFonts.poppins(fontSize: 13, color: const Color(0xFF64748B)),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildStudentResults() {
    if (_examResults.isEmpty) {
      return Center(
        child: Text("No results found.", style: GoogleFonts.poppins(color: const Color(0xFF64748B))),
      );
    }
    
    // Group marks by Exam
    final Map<String, List<dynamic>> groupedByExam = {};
    for (var mark in _examResults) {
      final exam = mark['exam'] ?? {};
      final examName = exam['name'] ?? 'Unknown Exam';
      if (!groupedByExam.containsKey(examName)) {
        groupedByExam[examName] = [];
      }
      groupedByExam[examName]!.add(mark);
    }

    return RefreshIndicator(
      onRefresh: _fetchResults,
      child: ListView.builder(
        padding: const EdgeInsets.all(20),
        itemCount: groupedByExam.length,
        itemBuilder: (context, index) {
          final examName = groupedByExam.keys.elementAt(index);
          final marks = groupedByExam[examName]!;
          
          double totalObtained = 0;
          double totalMax = 0;
          
          for (var m in marks) {
            totalObtained += double.tryParse(m['marksObtained']?.toString() ?? '0') ?? 0;
            totalMax += double.tryParse(m['maxMarks']?.toString() ?? '100') ?? 100;
          }
          if (totalMax == 0) totalMax = 1;
          double percentage = (totalObtained / totalMax);

          return Container(
            margin: const EdgeInsets.only(bottom: 24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 16, offset: const Offset(0, 4))
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Header & Circular Progress
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: const BorderRadius.only(topLeft: Radius.circular(24), topRight: Radius.circular(24)),
                    border: const Border(bottom: BorderSide(color: Color(0xFFF1F5F9))),
                  ),
                  child: Row(
                    children: [
                      SizedBox(
                        width: 70,
                        height: 70,
                        child: Stack(
                          fit: StackFit.expand,
                          children: [
                            CircularProgressIndicator(
                              value: percentage,
                              strokeWidth: 6,
                              backgroundColor: const Color(0xFFE2E8F0),
                              valueColor: AlwaysStoppedAnimation<Color>(percentage >= 0.35 ? const Color(0xFF10B981) : const Color(0xFFEF4444)),
                            ),
                            Center(
                              child: Text(
                                '{(percentage * 100).toStringAsFixed(0)}%',
                                style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B)),
                              ),
                            )
                          ],
                        ),
                      ),
                      const SizedBox(width: 20),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              examName,
                              style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B)),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Total Score: ${totalObtained.toStringAsFixed(0)} / ${totalMax.toStringAsFixed(0)}',
                              style: GoogleFonts.poppins(fontSize: 13, color: const Color(0xFF64748B)),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                
                // Subjects List
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: Table(
                    columnWidths: const {
                      0: FlexColumnWidth(2),
                      1: FlexColumnWidth(1),
                      2: FlexColumnWidth(1),
                      3: FlexColumnWidth(1),
                    },
                    children: [
                      TableRow(
                        children: [
                          _buildTableHeader('SUBJECT'),
                          _buildTableHeader('MARKS', align: Alignment.centerRight),
                          _buildTableHeader('MAX', align: Alignment.centerRight),
                          _buildTableHeader('GRADE', align: Alignment.center),
                        ],
                      ),
                      ...marks.map((m) {
                        final subjectName = m['subject']?['name'] ?? 'Unknown';
                        final obtained = m['marksObtained']?.toString() ?? '-';
                        final max = m['maxMarks']?.toString() ?? '-';
                        final grade = m['grade'] ?? '-';
                        return TableRow(
                          children: [
                            Padding(
                              padding: const EdgeInsets.symmetric(vertical: 12.0),
                              child: Text(
                                subjectName,
                                style: GoogleFonts.poppins(color: const Color(0xFF1E293B), fontSize: 13, fontWeight: FontWeight.w600),
                              ),
                            ),
                            Padding(
                              padding: const EdgeInsets.symmetric(vertical: 12.0),
                              child: Align(
                                alignment: Alignment.centerRight,
                                child: Text(obtained, style: GoogleFonts.poppins(color: const Color(0xFF0F172A), fontSize: 13, fontWeight: FontWeight.bold)),
                              ),
                            ),
                            Padding(
                              padding: const EdgeInsets.symmetric(vertical: 12.0),
                              child: Align(
                                alignment: Alignment.centerRight,
                                child: Text(max, style: GoogleFonts.poppins(color: const Color(0xFF94A3B8), fontSize: 13)),
                              ),
                            ),
                            Padding(
                              padding: const EdgeInsets.symmetric(vertical: 12.0),
                              child: Align(
                                alignment: Alignment.center,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: _getGradeColor(grade).withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    grade,
                                    style: GoogleFonts.poppins(color: _getGradeColor(grade), fontSize: 11, fontWeight: FontWeight.bold),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        );
                      }).toList()
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildTableHeader(String text, {Alignment align = Alignment.centerLeft}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: Align(
        alignment: align,
        child: Text(
          text,
          style: GoogleFonts.poppins(
            color: const Color(0xFF94A3B8),
            fontSize: 10,
            fontWeight: FontWeight.bold,
            letterSpacing: 1.0,
          ),
        ),
      ),
    );
  }
}
