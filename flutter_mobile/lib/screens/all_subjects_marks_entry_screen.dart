import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class AllSubjectsMarksEntryScreen extends StatefulWidget {
  final String examId;
  final String classId;
  final List<dynamic> subjects;
  final List<dynamic> students;

  const AllSubjectsMarksEntryScreen({
    super.key,
    required this.examId,
    required this.classId,
    required this.subjects,
    required this.students,
  });

  @override
  State<AllSubjectsMarksEntryScreen> createState() => _AllSubjectsMarksEntryScreenState();
}

class _AllSubjectsMarksEntryScreenState extends State<AllSubjectsMarksEntryScreen> {
  bool _isLoading = true;
  bool _isSubmitting = false;
  
  String _searchQuery = '';
  
  // Key format: "studentId_subjectId" -> Controller
  final Map<String, TextEditingController> _marksControllers = {};

  @override
  void initState() {
    super.initState();
    sortedSubjects = List.from(widget.subjects);
    sortedSubjects.sort((a, b) {
      final nameA = a['name']?.toString() ?? '';
      final nameB = b['name']?.toString() ?? '';
      return _getSubjectPriority(nameA).compareTo(_getSubjectPriority(nameB));
    });
    _initControllers();
    _fetchExistingMarks();
  }

  void _initControllers() {
    for (var student in widget.students) {
      final sid = student['id'].toString();
      for (var subject in widget.subjects) {
        final subId = subject['id'].toString();
        _marksControllers['${sid}_$subId'] = TextEditingController();
      }
    }
  }

  Future<void> _fetchExistingMarks() async {
    try {
      final res = await ApiService.getMarksForExam(widget.examId);
      if (res['success'] && res['data'] != null) {
        final existingMarks = res['data'] as List;
        for (var mark in existingMarks) {
          final sid = mark['studentId']?.toString();
          final subId = mark['subjectId']?.toString();
          
          String? matchedSubId = subId;
          if (!_marksControllers.containsKey('${sid}_$matchedSubId')) {
             final realSubName = mark['subject']?['name']?.toString().toLowerCase();
             final matchedSub = widget.subjects.firstWhere(
                 (s) => s['name']?.toString().toLowerCase() == realSubName, 
                 orElse: () => null
             );
             if (matchedSub != null) {
               matchedSubId = matchedSub['id'].toString();
             }
          }
          
          final key = '${sid}_$matchedSubId';
          if (_marksControllers.containsKey(key)) {
            _marksControllers[key]?.text = mark['marksObtained']?.toString() ?? '';
          }
        }
      }
    } catch (e) {
      // Ignore errors for fetching existing marks, just proceed with empty
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  void dispose() {
    for (var controller in _marksControllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _submitAllMarks() async {
    setState(() => _isSubmitting = true);

    try {
      List<Map<String, dynamic>> finalMarks = [];
      _marksControllers.forEach((key, controller) {
        final val = controller.text.trim();
        if (val.isNotEmpty) {
          final parts = key.split('_');
          if (parts.length == 2) {
            final sid = parts[0];
            final subId = parts[1];
            final sub = widget.subjects.firstWhere((s) => s['id'].toString() == subId, orElse: () => null);
            final maxMarks = sub != null && sub['maxMarks'] != null ? double.tryParse(sub['maxMarks'].toString()) ?? 100.0 : 100.0;
            
            finalMarks.add({
              'studentId': sid,
              'examId': widget.examId,
              'subjectId': subId,
              'marksObtained': double.tryParse(val) ?? 0.0,
              'maxMarks': maxMarks,
              'remarks': '',
            });
          }
        }
      });

      if (finalMarks.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('No marks entered to save.'), backgroundColor: Colors.red));
        setState(() => _isSubmitting = false);
        return;
      }

      final res = await ApiService.bulkUploadMarks({'marks': finalMarks});
      if (mounted) {
        setState(() => _isSubmitting = false);
        if (res['success']) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Marks saved successfully!'), backgroundColor: Colors.green));
          Navigator.pop(context);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(res['message'] ?? 'Failed to save marks'), backgroundColor: Colors.red));
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSubmitting = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red));
      }
    }
  }

  late List<dynamic> sortedSubjects;

  int _getSubjectPriority(String name) {
    name = name.toLowerCase();
    if (name.contains('telugu')) return 1;
    if (name.contains('hindi')) return 2;
    if (name.contains('english')) return 3;
    if (name.contains('math')) return 4;
    if (name.contains('physical science') || name.contains('physics')) return 5;
    if (name.contains('biological science') || name.contains('biology') || name.contains('chemistry')) return 6;
    if (name.contains('social')) return 7;
    if (name.contains('evs')) return 8;
    return 99;
  }

  String _getShortSubjectName(String name) {
    String lower = name.toLowerCase();
    if (lower.contains('telugu')) return 'TEL';
    if (lower.contains('hindi')) return 'HIN';
    if (lower.contains('english')) return 'ENG';
    if (lower.contains('math')) return 'MAT';
    if (lower.contains('physical science')) return 'PHY SCI';
    if (lower.contains('physics')) return 'PHY';
    if (lower.contains('biological science')) return 'BIO SCI';
    if (lower.contains('biology')) return 'BIO';
    if (lower.contains('chemistry')) return 'CHE';
    if (lower.contains('social')) return 'SOC';
    if (lower.contains('evs')) return 'EVS';
    
    if (name.length > 8) return '${name.substring(0, 6).toUpperCase()}..';
    return name.toUpperCase();
  }

  String _calculateTotal(String sid) {
    double total = 0;
    for (var sub in sortedSubjects) {
      final subId = sub['id'].toString();
      final val = _marksControllers['${sid}_$subId']?.text ?? '';
      if (val.toUpperCase() != 'AB' && val.isNotEmpty) {
        total += double.tryParse(val) ?? 0;
      }
    }
    // format to remove .0 if it's an integer
    if (total == total.toInt()) {
      return total.toInt().toString();
    }
    return total.toStringAsFixed(1);
  }

  @override
  Widget build(BuildContext context) {
    // Filter students by search
    final filteredStudents = [];
    for (int i = 0; i < widget.students.length; i++) {
      final s = widget.students[i];
      final name = s['user']?['name']?.toString().toLowerCase() ?? '';
      final roll = s['rollNo']?.toString().toLowerCase() ?? '';
      final q = _searchQuery.toLowerCase();
      if (name.contains(q) || roll.contains(q)) {
        filteredStudents.add({
          'student': s,
          'originalIndex': i + 1,
        });
      }
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9), // Slight gray background
      appBar: AppBar(
        title: Text('All Subjects Marks', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 20, color: Colors.white)),
        iconTheme: const IconThemeData(color: Colors.white),
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF6366F1), Color(0xFF4F46E5), Color(0xFF4338CA)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF6366F1)))
          : Column(
              children: [
                // Search Bar
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    boxShadow: [BoxShadow(color: const Color(0xFF6366F1).withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4))],
                  ),
                  child: TextField(
                    onChanged: (val) => setState(() => _searchQuery = val),
                    decoration: InputDecoration(
                      hintText: 'Search student by name or roll no...',
                      hintStyle: GoogleFonts.poppins(color: const Color(0xFF94A3B8), fontSize: 14),
                      prefixIcon: const Icon(Icons.search_rounded, color: Color(0xFF64748B)),
                      filled: true,
                      fillColor: const Color(0xFFF8FAFC),
                      contentPadding: const EdgeInsets.symmetric(vertical: 0),
                      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: Color(0xFF6366F1), width: 2)),
                    ),
                  ),
                ),
                
                // List of Students
                Expanded(
                  child: filteredStudents.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.search_off_rounded, size: 64, color: const Color(0xFFCBD5E1).withOpacity(0.5)),
                              const SizedBox(height: 16),
                              Text('No students found', style: GoogleFonts.poppins(color: const Color(0xFF94A3B8), fontSize: 15)),
                            ],
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: filteredStudents.length,
                          itemBuilder: (context, index) {
                            final item = filteredStudents[index];
                            final student = item['student'];
                            final sNo = item['originalIndex'];
                            return _buildStudentCard(student, sNo);
                          },
                        ),
                ),
                
                // Bottom Submit Button
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    boxShadow: [BoxShadow(color: const Color(0xFF6366F1).withOpacity(0.1), blurRadius: 20, offset: const Offset(0, -5))],
                    borderRadius: const BorderRadius.only(topLeft: Radius.circular(24), topRight: Radius.circular(24)),
                  ),
                  child: SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      onPressed: _isSubmitting ? null : _submitAllMarks,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF6366F1),
                        elevation: 0,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: _isSubmitting
                          ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5))
                          : Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.save_rounded, color: Colors.white),
                                const SizedBox(width: 8),
                                Text('Save All Marks', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                              ],
                            ),
                    ),
                  ),
                )
              ],
            ),
    );
  }

  Widget _buildStudentCard(Map<String, dynamic> student, int sNo) {
    final name = student['user']?['name'] ?? 'Unknown';
    final rollNo = student['rollNo'] ?? 'N/A';
    final sid = student['id'].toString();

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFF1F5F9), width: 2),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Student Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: const BorderRadius.only(topLeft: Radius.circular(20), topRight: Radius.circular(20)),
              border: const Border(bottom: BorderSide(color: Color(0xFFE2E8F0), width: 1.5)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text('$sNo. $name', style: GoogleFonts.poppins(color: const Color(0xFF1E293B), fontWeight: FontWeight.bold, fontSize: 16)),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    border: Border.all(color: const Color(0xFFCBD5E1)),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text('Roll: $rollNo', style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 12, fontWeight: FontWeight.w600)),
                ),
              ],
            ),
          ),
          
          // Subjects Grid
          Padding(
            padding: const EdgeInsets.all(16),
            child: LayoutBuilder(
              builder: (context, constraints) {
                final int crossAxisCount = sortedSubjects.length >= 7 ? 4 : 3;
                final double spacing = 8.0;
                // Calculate strict width rounding down to prevent wrap overflow
                final double itemWidth = ((constraints.maxWidth - (spacing * (crossAxisCount - 1))) / crossAxisCount).floorToDouble() - 1.0;

                return Wrap(
                  spacing: spacing,
                  runSpacing: 12,
                  children: [
                    ...sortedSubjects.map((subject) {
                      final subId = subject['id'].toString();
                      final subName = _getShortSubjectName(subject['name']?.toString() ?? 'Subject');
                      final maxMarks = subject['maxMarks']?.toString() ?? '100';
                      
                      // Color mapping logic for grid items
                      final int subHash = subId.hashCode;
                      final List<Color> bgColors = [const Color(0xFFEEF2FF), const Color(0xFFF0FDF4), const Color(0xFFFFF7ED), const Color(0xFFFEF2F2), const Color(0xFFF5F3FF)];
                      final List<Color> borderColors = [const Color(0xFFC7D2FE), const Color(0xFFBBF7D0), const Color(0xFFFFEDD5), const Color(0xFFFECACA), const Color(0xFFDDD6FE)];
                      final colorIdx = subHash % bgColors.length;

                      return Container(
                        width: itemWidth,
                        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
                        decoration: BoxDecoration(
                          color: bgColors[colorIdx],
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: borderColors[colorIdx], width: 1.5),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.center,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(subName, maxLines: 1, overflow: TextOverflow.ellipsis, style: GoogleFonts.poppins(fontSize: sortedSubjects.length >= 7 ? 10 : 12, fontWeight: FontWeight.bold, color: const Color(0xFF334155))),
                            const SizedBox(height: 8),
                            SizedBox(
                              height: 38,
                              child: TextField(
                                controller: _marksControllers['${sid}_$subId'],
                                keyboardType: TextInputType.text,
                                textAlign: TextAlign.center,
                                style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: sortedSubjects.length >= 7 ? 12 : 14, color: _marksControllers['${sid}_$subId']?.text.toUpperCase() == 'AB' ? Colors.red : const Color(0xFF1E293B)),
                                decoration: InputDecoration(
                                  hintText: 'Max: $maxMarks',
                                  hintStyle: TextStyle(color: const Color(0xFF94A3B8), fontSize: sortedSubjects.length >= 7 ? 9 : 10),
                                  filled: true,
                                  fillColor: Colors.white,
                                  contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 4),
                                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
                                  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFF6366F1), width: 1.5)),
                                  suffixIcon: InkWell(
                                    onTap: () {
                                      setState(() {
                                        if (_marksControllers['${sid}_$subId']?.text == 'AB') {
                                          _marksControllers['${sid}_$subId']?.text = '';
                                        } else {
                                          _marksControllers['${sid}_$subId']?.text = 'AB';
                                        }
                                      });
                                    },
                                    child: Container(
                                      margin: const EdgeInsets.all(4),
                                      decoration: BoxDecoration(
                                        color: _marksControllers['${sid}_$subId']?.text == 'AB' ? Colors.red.withOpacity(0.1) : const Color(0xFFF1F5F9),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Icon(Icons.person_off_rounded, size: 14, color: _marksControllers['${sid}_$subId']?.text == 'AB' ? Colors.red : const Color(0xFF94A3B8)),
                                    ),
                                  ),
                                ),
                                onChanged: (val) {
                                  setState(() {});
                                },
                              ),
                            ),
                          ],
                        ),
                      );
                    }).toList(),
                    // Append Total option
                    if (sortedSubjects.length == 5 || sortedSubjects.length >= 7)
                      Container(
                        width: itemWidth,
                        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFE2E8F0), width: 1.5),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.center,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text('TOTAL', maxLines: 1, overflow: TextOverflow.ellipsis, style: GoogleFonts.poppins(fontSize: sortedSubjects.length >= 7 ? 10 : 12, fontWeight: FontWeight.bold, color: const Color(0xFF475569))),
                            const SizedBox(height: 8),
                            Container(
                              height: 38,
                              alignment: Alignment.center,
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: const Color(0xFFCBD5E1)),
                              ),
                              child: Text(_calculateTotal(sid), style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: sortedSubjects.length >= 7 ? 14 : 16, color: const Color(0xFF1E293B))),
                            ),
                          ],
                        ),
                      ),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
