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

  @override
  Widget build(BuildContext context) {
    // Filter students by search
    final filteredStudents = widget.students.where((s) {
      final name = s['user']?['name']?.toString().toLowerCase() ?? '';
      final roll = s['rollNo']?.toString().toLowerCase() ?? '';
      final q = _searchQuery.toLowerCase();
      return name.contains(q) || roll.contains(q);
    }).toList();

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
                            final student = filteredStudents[index];
                            return _buildStudentCard(student);
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

  Widget _buildStudentCard(Map<String, dynamic> student) {
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
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              border: Border(bottom: BorderSide(color: Color(0xFFF1F5F9), width: 1.5)),
            ),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(colors: [Color(0xFFE0E7FF), Color(0xFFC7D2FE)]),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    name.isNotEmpty ? name[0].toUpperCase() : 'S',
                    style: GoogleFonts.poppins(color: const Color(0xFF4F46E5), fontWeight: FontWeight.bold, fontSize: 20),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(name, style: GoogleFonts.poppins(color: const Color(0xFF1E293B), fontWeight: FontWeight.bold, fontSize: 16)),
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF1F5F9),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text('Roll: $rollNo', style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 11, fontWeight: FontWeight.w600)),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          // Subjects Grid
          Padding(
            padding: const EdgeInsets.all(16),
            child: Wrap(
              spacing: 12,
              runSpacing: 12,
              children: widget.subjects.map((subject) {
                final subId = subject['id'].toString();
                final subName = subject['name']?.toString() ?? 'Subject';
                final maxMarks = subject['maxMarks']?.toString() ?? '100';
                
                return Container(
                  width: (MediaQuery.of(context).size.width - 76) / 2, // 2 columns dynamically
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(subName, maxLines: 1, overflow: TextOverflow.ellipsis, style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF475569))),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          Expanded(
                            child: SizedBox(
                              height: 36,
                              child: TextField(
                                controller: _marksControllers['${sid}_$subId'],
                                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                textAlign: TextAlign.center,
                                style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 15, color: const Color(0xFF1E293B)),
                                decoration: InputDecoration(
                                  hintText: '-',
                                  hintStyle: const TextStyle(color: Color(0xFFCBD5E1)),
                                  filled: true,
                                  fillColor: Colors.white,
                                  contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 8),
                                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                                  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFF6366F1), width: 1.5)),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 6),
                          Text('/ $maxMarks', style: GoogleFonts.outfit(fontSize: 12, color: const Color(0xFF94A3B8), fontWeight: FontWeight.w500)),
                        ],
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }
}
