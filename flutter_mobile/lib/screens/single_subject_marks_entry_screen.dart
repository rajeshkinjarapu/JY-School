import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class SingleSubjectMarksEntryScreen extends StatefulWidget {
  final String examId;
  final String classId;
  final String subjectId;
  final String subjectName;
  final double maxMarks;
  final List<dynamic> students;

  const SingleSubjectMarksEntryScreen({
    super.key,
    required this.examId,
    required this.classId,
    required this.subjectId,
    required this.subjectName,
    required this.maxMarks,
    required this.students,
  });

  @override
  State<SingleSubjectMarksEntryScreen> createState() => _SingleSubjectMarksEntryScreenState();
}

class _SingleSubjectMarksEntryScreenState extends State<SingleSubjectMarksEntryScreen> {
  bool _isLoading = true;
  bool _isSubmitting = false;
  
  String _searchQuery = '';
  
  // Key format: "studentId" -> Controller
  final Map<String, TextEditingController> _marksControllers = {};

  @override
  void initState() {
    super.initState();
    _initControllers();
    _fetchExistingMarks();
  }

  void _initControllers() {
    for (var student in widget.students) {
      final sid = student['id'].toString();
      _marksControllers[sid] = TextEditingController();
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
          
          if (subId == widget.subjectId && sid != null) {
            if (_marksControllers.containsKey(sid)) {
              _marksControllers[sid]?.text = mark['marksObtained']?.toString() ?? '';
            }
          }
        }
      }
    } catch (e) {
      // Ignore errors for fetching existing marks, proceed with empty
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

  Future<void> _submitMarks() async {
    setState(() => _isSubmitting = true);

    try {
      List<Map<String, dynamic>> finalMarks = [];
      _marksControllers.forEach((sid, controller) {
        final val = controller.text.trim();
        if (val.isNotEmpty) {
          finalMarks.add({
            'studentId': sid,
            'examId': widget.examId,
            'subjectId': widget.subjectId,
            'marksObtained': val.toUpperCase() == 'AB' ? 0.0 : (double.tryParse(val) ?? 0.0),
            'maxMarks': widget.maxMarks,
            'remarks': val.toUpperCase() == 'AB' ? 'Absent' : '',
          });
        }
      });

      if (finalMarks.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('No marks entered to save.'), backgroundColor: Colors.red));
        setState(() => _isSubmitting = false);
        return;
      }

      final res = await ApiService.uploadMarks({'marks': finalMarks});
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

  @override
  Widget build(BuildContext context) {
    // We store the original index for the S.No before filtering
    final List<Map<String, dynamic>> studentsWithIndex = [];
    for (int i = 0; i < widget.students.length; i++) {
      studentsWithIndex.add({
        'student': widget.students[i],
        'originalIndex': i + 1,
      });
    }

    final filteredStudents = studentsWithIndex.where((s) {
      final name = s['student']['user']?['name']?.toString().toLowerCase() ?? '';
      final roll = s['student']['rollNo']?.toString().toLowerCase() ?? '';
      final q = _searchQuery.toLowerCase();
      return name.contains(q) || roll.contains(q);
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9), // Slight gray background
      appBar: AppBar(
        title: Text('${widget.subjectName} Marks', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 20, color: Colors.white)),
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
                      onPressed: _isSubmitting ? null : _submitMarks,
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
                                const Icon(Icons.cloud_upload_rounded, color: Colors.white),
                                const SizedBox(width: 8),
                                Text('Submit Marks', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
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
          // Serial Number Badge
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              shape: BoxShape.circle,
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            alignment: Alignment.center,
            child: Text(
              '$sNo',
              style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontWeight: FontWeight.bold, fontSize: 11),
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
            width: 100,
            height: 44,
            child: TextField(
              controller: _marksControllers[sid],
              keyboardType: TextInputType.text,
              textAlign: TextAlign.center,
              style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16, color: _marksControllers[sid]?.text.toUpperCase() == 'AB' ? Colors.red : const Color(0xFF1E293B)),
              decoration: InputDecoration(
                hintText: 'Max: ${widget.maxMarks.toInt()}',
                hintStyle: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 12),
                filled: true,
                fillColor: const Color(0xFFF8FAFC),
                contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 4),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF6366F1), width: 1.5)),
                suffixIcon: InkWell(
                  onTap: () {
                    setState(() {
                      if (_marksControllers[sid]?.text == 'AB') {
                        _marksControllers[sid]?.text = '';
                      } else {
                        _marksControllers[sid]?.text = 'AB';
                      }
                    });
                  },
                  child: Container(
                    margin: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: _marksControllers[sid]?.text == 'AB' ? Colors.red.withOpacity(0.1) : const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(Icons.person_off_rounded, size: 16, color: _marksControllers[sid]?.text == 'AB' ? Colors.red : const Color(0xFF94A3B8)),
                  ),
                ),
              ),
              onChanged: (val) {
                setState(() {}); // trigger UI update for text color
              },
            ),
          ),
        ],
      ),
    );
  }
}
