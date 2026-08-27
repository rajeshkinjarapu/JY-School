import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class SingleSubjectMarksEntryScreen extends StatefulWidget {
  final String examId;
  final String classId;
  final List<dynamic> subjects;
  final List<dynamic> students;
  final String? initialSubjectId;

  const SingleSubjectMarksEntryScreen({
    super.key,
    required this.examId,
    required this.classId,
    required this.subjects,
    required this.students,
    this.initialSubjectId,
  });

  @override
  State<SingleSubjectMarksEntryScreen> createState() => _SingleSubjectMarksEntryScreenState();
}

class _SingleSubjectMarksEntryScreenState extends State<SingleSubjectMarksEntryScreen> {
  bool _isLoading = true;
  bool _isSubmitting = false;
  
  String _searchQuery = '';
  
  // Key format: "studentId_subjectId" -> Controller
  final Map<String, TextEditingController> _marksControllers = {};

  List<dynamic> _localSubjects = [];
  String? _selectedSubjectId;
  String _subjectName = 'All Subjects';

  @override
  void initState() {
    super.initState();
    _localSubjects = List.from(widget.subjects);
    if (_localSubjects.isNotEmpty && !_localSubjects.any((s) => s['id'] == 'ALL')) {
      _localSubjects.insert(0, {'id': 'ALL', 'name': 'All Subjects', 'maxMarks': 100});
    }
    
    if (_localSubjects.isNotEmpty) {
       _selectedSubjectId = widget.initialSubjectId ?? 'ALL';
       final subject = _localSubjects.firstWhere((s) => s['id'].toString() == _selectedSubjectId, orElse: () => null);
       _subjectName = subject != null ? subject['name']?.toString() ?? 'All Subjects' : 'All Subjects';
    }
    
    _initControllers();
    _fetchExistingMarks();
  }

  void _onSubjectChanged(String? subId) {
    if (subId == null) return;
    final subject = _localSubjects.firstWhere((s) => s['id'].toString() == subId, orElse: () => null);
    if (subject != null) {
      setState(() {
        _selectedSubjectId = subId;
        _subjectName = subject['name']?.toString() ?? 'Subject';
        _isLoading = true; // Show loading while re-initializing
      });
      
      // Re-init controllers for new selection
      _initControllers();
      // Fetch marks for new selection
      _fetchExistingMarks();
    }
  }

  void _initControllers() {
    _marksControllers.clear();
    for (var student in widget.students) {
      final sid = student['id'].toString();
      if (_selectedSubjectId == 'ALL') {
        for (var sub in _localSubjects.where((s) => s['id'] != 'ALL')) {
          _marksControllers["${sid}_${sub['id']}"] = TextEditingController();
        }
      } else {
        _marksControllers["${sid}_$_selectedSubjectId"] = TextEditingController();
      }
    }
  }

  double _getMaxMarksForSubject(String subId) {
    final sub = _localSubjects.firstWhere((s) => s['id'].toString() == subId, orElse: () => null);
    if (sub != null) {
      return double.tryParse(sub['maxMarks']?.toString() ?? '100') ?? 100.0;
    }
    return 100.0;
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
          if (sid != null && subId != null && !_marksControllers.containsKey('${sid}_$matchedSubId')) {
             final realSubName = mark['subject']?['name']?.toString().toLowerCase().trim();
             if (realSubName != null) {
               final matchedSub = _localSubjects.firstWhere(
                   (s) => s['name']?.toString().toLowerCase().trim() == realSubName, 
                   orElse: () => null
               );
               if (matchedSub != null) {
                 matchedSubId = matchedSub['id'].toString();
               }
             }
          }
          
          if (sid != null && matchedSubId != null) {
            final key = "${sid}_${matchedSubId}";
            if (_marksControllers.containsKey(key)) {
              _marksControllers[key]?.text = mark['marksObtained']?.toString() ?? '';
            }
          }
        }
      }
    } catch (e) {
      // Ignore errors
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
      String? errorMessage;
      
      _marksControllers.forEach((key, controller) {
        if (errorMessage != null) return; // Skip rest if error found
        
        final parts = key.split('_');
        final sid = parts[0];
        final subId = parts[1];
        final val = controller.text.trim();
        
        final maxM = _getMaxMarksForSubject(subId);

        if (val.isNotEmpty) {
          if (val.toUpperCase() != 'AB') {
            final parsed = double.tryParse(val);
            if (parsed == null) {
              errorMessage = 'Invalid marks entered.';
              return;
            }
            if (parsed > maxM) {
              final student = widget.students.firstWhere((s) => s['id'].toString() == sid, orElse: () => null);
              final sName = student?['user']?['name'] ?? 'Unknown';
              final sub = _localSubjects.firstWhere((s) => s['id'].toString() == subId, orElse: () => null);
              final subName = sub?['name'] ?? 'Subject';
              
              errorMessage = 'Marks for $sName in $subName cannot exceed $maxM.';
              return;
            }
          }

          finalMarks.add({
            'studentId': sid,
            'examId': widget.examId,
            'subjectId': subId,
            'marksObtained': val.toUpperCase() == 'AB' ? 0.0 : (double.tryParse(val) ?? 0.0),
            'maxMarks': maxM,
            'remarks': val.toUpperCase() == 'AB' ? 'Absent' : '',
          });
        }
      });

      if (errorMessage != null) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(errorMessage!), backgroundColor: Colors.red));
        setState(() => _isSubmitting = false);
        return;
      }

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
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        title: Text('$_subjectName Marks', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 20, color: Colors.white)),
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
                if (_localSubjects.isNotEmpty)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      border: Border(bottom: BorderSide(color: Color(0xFFE2E8F0))),
                    ),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFF6366F1).withOpacity(0.5), width: 1.5),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          isExpanded: true,
                          value: _selectedSubjectId,
                          icon: const Icon(Icons.keyboard_arrow_down_rounded, color: Color(0xFF6366F1)),
                          items: _localSubjects.map<DropdownMenuItem<String>>((item) {
                            return DropdownMenuItem<String>(
                              value: item['id']?.toString() ?? '',
                              child: Row(
                                children: [
                                  Icon(item['id'] == 'ALL' ? Icons.library_books_rounded : Icons.book_rounded, size: 20, color: const Color(0xFF6366F1)),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Text(
                                      item['name']?.toString() ?? 'Unknown',
                                      style: GoogleFonts.poppins(
                                        color: _selectedSubjectId == item['id']?.toString() ? const Color(0xFF6366F1) : const Color(0xFF1E293B),
                                        fontSize: 15,
                                        fontWeight: _selectedSubjectId == item['id']?.toString() ? FontWeight.bold : FontWeight.w500,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                            );
                          }).toList(),
                          onChanged: _onSubjectChanged,
                        ),
                      ),
                    ),
                  ),
                
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
                
                SafeArea(
                  bottom: true,
                  child: Container(
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
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
              if (_selectedSubjectId != 'ALL') ...[
                const SizedBox(width: 12),
                _buildMarksInput(sid, _selectedSubjectId!),
              ],
            ],
          ),
          
          if (_selectedSubjectId == 'ALL') ...[
            const SizedBox(height: 16),
            const Divider(height: 1, color: Color(0xFFF1F5F9)),
            const SizedBox(height: 16),
            Wrap(
              spacing: 12,
              runSpacing: 16,
              children: _localSubjects.where((s) => s['id'] != 'ALL').map((sub) {
                final subId = sub['id'].toString();
                final subName = sub['name']?.toString() ?? 'Unknown';
                // Calculate width for 2 items per line (accounting for padding and spacing)
                return SizedBox(
                  width: (MediaQuery.of(context).size.width - 32 - 32 - 12) / 2, // screen width - list padding - card padding - spacing
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        subName,
                        style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 12, fontWeight: FontWeight.w500),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 6),
                      _buildMarksInput(sid, subId),
                    ],
                  ),
                );
              }).toList(),
            ),
          ]
        ],
      ),
    );
  }
  
  Widget _buildMarksInput(String sid, String subId) {
    final key = "${sid}_${subId}";
    final maxM = _getMaxMarksForSubject(subId);
    
    return SizedBox(
      width: _selectedSubjectId == 'ALL' ? double.infinity : 130, // Increased width
      height: 48,
      child: TextField(
        controller: _marksControllers[key],
        keyboardType: TextInputType.text,
        textAlign: TextAlign.center,
        style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16, color: _marksControllers[key]?.text.toUpperCase() == 'AB' ? Colors.red : const Color(0xFF1E293B)),
        decoration: InputDecoration(
          hintText: 'Max: ${maxM.toInt()}',
          hintStyle: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 12),
          filled: true,
          fillColor: const Color(0xFFF8FAFC),
          contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 4),
          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF6366F1), width: 1.5)),
          suffixIcon: InkWell(
            onTap: () {
              setState(() {
                if (_marksControllers[key]?.text == 'AB') {
                  _marksControllers[key]?.text = '';
                } else {
                  _marksControllers[key]?.text = 'AB';
                }
              });
            },
            child: Container(
              margin: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: _marksControllers[key]?.text == 'AB' ? Colors.red.withOpacity(0.1) : const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(Icons.person_off_rounded, size: 16, color: _marksControllers[key]?.text == 'AB' ? Colors.red : const Color(0xFF94A3B8)),
            ),
          ),
        ),
        onChanged: (val) {
          setState(() {}); // trigger UI update for text color
        },
      ),
    );
  }
}
