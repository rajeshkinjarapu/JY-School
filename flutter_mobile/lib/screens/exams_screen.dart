import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';
import '../widgets/app_drawer.dart';

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
    switch (grade.toUpperCase()) {
      case 'A+':
      case 'A':
      case 'O':
        return const Color(0xFF10B981); // Emerald
      case 'B':
      case 'C':
        return const Color(0xFF3B82F6); // Blue
      case 'D':
      case 'E':
        return const Color(0xFFF59E0B); // Amber
      case 'F':
      default:
        return const Color(0xFFEF4444); // Red
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F7FE), // Match premium dark theme
      drawer: const AppDrawer(currentRoute: 'exams'),
      appBar: AppBar(
        title: Text(
          'Exams & Grades',
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
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF6366F1)))
          : _errorMessage != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.error_outline, size: 60, color: Colors.redAccent),
                        const SizedBox(height: 16),
                        Text(
                          _errorMessage!,
                          textAlign: TextAlign.center,
                          style: GoogleFonts.poppins(fontSize: 16, color: Colors.blueGrey.shade400),
                        ),
                        const SizedBox(height: 20),
                        ElevatedButton(
                          onPressed: () {
                            setState(() {
                              _isLoading = true;
                              _errorMessage = null;
                            });
                            _fetchResults();
                          },
                          child: const Text('Retry'),
                        )
                      ],
                    ),
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _fetchResults,
                  child: _userRole == 'STUDENT'
                    ? _buildStudentView()
                    : _buildAdminView(),
                ),
    );
  }

  Widget _buildAdminView() {
    if (_examsList.isEmpty) {
      return Center(
        child: Text(
          'No exams created yet.',
          style: GoogleFonts.poppins(color: const Color(0xFF475569), fontSize: 16),
        ),
      );
    }
    
    return ListView.builder(
      padding: const EdgeInsets.all(20.0),
      itemCount: _examsList.length,
      itemBuilder: (context, index) {
        final exam = _examsList[index];
        final name = exam['name'] ?? 'Exam Name';
        final term = exam['term'] ?? 'Term';
        final maxMarks = exam['maxMarks'] ?? '-';
        final passingMarks = exam['passingMarks'] ?? '-';
        final date = exam['examDate'] != null ? exam['examDate'].toString().split('T')[0] : '-';

        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 10,
                offset: const Offset(0, 4),
              )
            ],
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      name,
                      style: GoogleFonts.outfit(
                        color: const Color(0xFF1E293B),
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
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
                      style: GoogleFonts.poppins(
                        color: const Color(0xFF818CF8),
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  )
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  const Icon(Icons.calendar_today, size: 14, color: Color(0xFF94A3B8)),
                  const SizedBox(width: 6),
                  Text('Date: $date', style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 13)),
                  const Spacer(),
                  const Icon(Icons.score, size: 14, color: Color(0xFF94A3B8)),
                  const SizedBox(width: 6),
                  Text('Max: $maxMarks', style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 13)),
                  const Spacer(),
                  const Icon(Icons.check_circle_outline, size: 14, color: Color(0xFF94A3B8)),
                  const SizedBox(width: 6),
                  Text('Pass: $passingMarks', style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 13)),
                ],
              )
            ],
          ),
        );
      },
    );
  }

  Widget _buildStudentView() {
    return _examResults.isEmpty
        ? Center(
            child: Text(
              'No exam results declared yet.',
              style: GoogleFonts.poppins(color: const Color(0xFF475569), fontSize: 16),
            ),
          )
        : ListView.builder(
            padding: const EdgeInsets.all(20.0),
            itemCount: _examResults.length,
            itemBuilder: (context, index) {
              final examGroup = _examResults[index];
              final exam = examGroup['exam'] ?? {};
              final examName = exam['name'] ?? 'Exam';
              final term = exam['term'] ?? 'Semester';
              final List<dynamic> marksList = examGroup['marks'] ?? [];

              // Calculate totals
              double totalObtained = 0;
              double totalMax = 0;
              for (var m in marksList) {
                totalObtained += double.tryParse(m['marksObtained']?.toString() ?? '0') ?? 0;
                totalMax += double.tryParse(m['maxMarks']?.toString() ?? '0') ?? 0;
              }
              final percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0.0;

              return Container(
                margin: const EdgeInsets.only(bottom: 24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  children: [
                    // Header Card Area (Gradient overlay)
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: const BorderRadius.only(
                          topLeft: Radius.circular(24),
                          topRight: Radius.circular(24),
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  examName,
                                  style: GoogleFonts.outfit(
                                    color: const Color(0xFF1E293B),
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Term: $term',
                                  style: GoogleFonts.poppins(
                                    color: const Color(0xFF475569),
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          // Grade Score Bubble
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            decoration: BoxDecoration(
                              color: (percentage >= 40 ? const Color(0xFF10B981) : const Color(0xFFEF4444)).withOpacity(0.12),
                              borderRadius: BorderRadius.circular(30),
                              border: Border.all(
                                color: (percentage >= 40 ? const Color(0xFF10B981) : const Color(0xFFEF4444)).withOpacity(0.2),
                              ),
                            ),
                            child: Text(
                              '${percentage.toStringAsFixed(1)}%',
                              style: GoogleFonts.poppins(
                                color: percentage >= 40 ? const Color(0xFF34D399) : const Color(0xFFF87171),
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          )
                        ],
                      ),
                    ),
                    
                    const Divider(height: 1, color: const Color(0xFFE2E8F0)),

                    // Subject list
                    Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Table(
                        columnWidths: const {
                          0: FlexColumnWidth(2), // Subject
                          1: FlexColumnWidth(1), // Marks Obtained
                          2: FlexColumnWidth(1), // Total Marks
                          3: FlexColumnWidth(1), // Grade
                        },
                        children: [
                          // Header Row
                          TableRow(
                            children: [
                              _buildTableHeader('SUBJECT'),
                              _buildTableHeader('OBTAINED', align: Alignment.centerRight),
                              _buildTableHeader('MAX', align: Alignment.centerRight),
                              _buildTableHeader('GRADE', align: Alignment.center),
                            ],
                          ),
                          // Data Rows
                          ...marksList.map((m) {
                            final subjectName = m['subject']?['name'] ?? 'Subject';
                            final obtained = m['marksObtained']?.toString() ?? '0';
                            final max = m['maxMarks']?.toString() ?? '100';
                            final grade = m['grade']?.toString() ?? '-';

                            return TableRow(
                              children: [
                                Padding(
                                  padding: const EdgeInsets.symmetric(vertical: 12.0),
                                  child: Text(
                                    subjectName,
                                    style: GoogleFonts.poppins(
                                      color: const Color(0xFF475569),
                                      fontSize: 13.5,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                                Padding(
                                  padding: const EdgeInsets.symmetric(vertical: 12.0),
                                  child: Align(
                                    alignment: Alignment.centerRight,
                                    child: Text(
                                      obtained,
                                      style: GoogleFonts.poppins(
                                        color: const Color(0xFF1E293B),
                                        fontSize: 14,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                ),
                                Padding(
                                  padding: const EdgeInsets.symmetric(vertical: 12.0),
                                  child: Align(
                                    alignment: Alignment.centerRight,
                                    child: Text(
                                      max,
                                      style: GoogleFonts.poppins(
                                        color: const Color(0xFF475569),
                                        fontSize: 13,
                                      ),
                                    ),
                                  ),
                                ),
                                Padding(
                                  padding: const EdgeInsets.symmetric(vertical: 12.0),
                                  child: Align(
                                    alignment: Alignment.center,
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: _getGradeColor(grade).withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Text(
                                        grade,
                                        style: GoogleFonts.poppins(
                                          color: _getGradeColor(grade),
                                          fontSize: 12,
                                          fontWeight: FontWeight.bold,
                                        ),
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

                    // Total Summary row
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.01),
                        borderRadius: const BorderRadius.only(
                          bottomLeft: Radius.circular(24),
                          bottomRight: Radius.circular(24),
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'TOTAL SCORE',
                            style: GoogleFonts.poppins(
                              color: const Color(0xFF475569),
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 0.5,
                            ),
                          ),
                          Text(
                            '${totalObtained.toStringAsFixed(0)} / ${totalMax.toStringAsFixed(0)}',
                            style: GoogleFonts.outfit(
                              color: const Color(0xFF1E293B),
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    )
                  ],
                ),
              );
            },
          );
  }

  Widget _buildTableHeader(String text, {Alignment align = Alignment.centerLeft}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10.0),
      child: Align(
        alignment: align,
        child: Text(
          text,
          style: GoogleFonts.poppins(
            color: const Color(0xFF475569),
            fontSize: 11,
            fontWeight: FontWeight.bold,
            letterSpacing: 0.5,
          ),
        ),
      ),
    );
  }
}


