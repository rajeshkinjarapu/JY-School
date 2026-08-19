import 'dart:convert';
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
  bool _isClassFrozen = false;

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
          try { _subjects = jsonDecode(rawSubjects); } catch (_) {}
        } else if (rawSubjects is List) {
          _subjects = rawSubjects;
        }
      }
    });
  }

  Future<void> _fetchStudentsAndMarks() async {
    if (_selectedClassId == null || _selectedExamId == null) return;
    
    setState(() {
      _isLoadingStudents = true;
      _errorMessage = null;
      _students.clear();
      _marksControllers.forEach((_, c) => c.dispose());
      _marksControllers.clear();
      _isClassFrozen = false;
    });

    try {
      // Check if frozen
      final exam = _exams.firstWhere((e) => e['id'] == _selectedExamId, orElse: () => null);
      if (exam != null) {
        final frozen = exam['frozenClasses'];
        if (frozen != null) {
          List<dynamic> frozenArr = [];
          if (frozen is String) {
            try { frozenArr = jsonDecode(frozen); } catch (_) {}
          } else if (frozen is List) {
            frozenArr = frozen;
          }
          _isClassFrozen = frozenArr.contains(_selectedClassId);
        }
      }

      final res = await ApiService.getStudents(_selectedClassId!);
      final marksRes = await ApiService.getMarksForExam(_selectedExamId!);

      if (mounted) {
        if (res['success']) {
          final List<dynamic> list = res['data'] ?? [];
          final List<dynamic> allMarks = marksRes['success'] ? (marksRes['data'] ?? []) : [];

          setState(() {
            _students = list;
            for (var s in list) {
              final id = s['id'].toString();
              _marksControllers[id] = TextEditingController();
            }

            // Populate existing marks
            for (var m in allMarks) {
              final student = m['student'];
              if (student != null && student['classId'] == _selectedClassId) {
                // Match the fake subject ID from exam subjects
                final fakeSub = _subjects.firstWhere((s) => s['name']?.toLowerCase() == m['subject']?['name']?.toLowerCase(), orElse: () => null);
                final subjectId = fakeSub != null ? fakeSub['id'] : m['subjectId'];

                if (_selectedSubjectId == 'ALL' || _selectedSubjectId == subjectId) {
                   final stuId = m['studentId'].toString();
                   if (_marksControllers.containsKey(stuId)) {
                     _marksControllers[stuId]!.text = m['marksObtained'].toString();
                   }
                }
              }
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
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Error loading data: $e';
          _isLoadingStudents = false;
        });
      }
    }
  }

  Future<void> _handleSubmit({bool isFreeze = false}) async {
    if (_isClassFrozen) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Marks are frozen and cannot be updated.')));
      return;
    }

    if (_selectedExamId == null || _selectedSubjectId == null || _students.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select Exam, Class, and Subject.')));
      return;
    }

    if (isFreeze) {
      final confirm = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: Text('Freeze Marks?', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
          content: const Text('Are you sure you want to freeze the marks for this class? Once frozen, progress cards will be generated and marks cannot be edited.'),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Freeze', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      );
      if (confirm != true) return;
    }

    setState(() => _isSubmitting = true);

    List<Map<String, dynamic>> marksToSubmit = [];
    
    for (var s in _students) {
      final studentId = s['id'].toString();
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

    if (marksToSubmit.isEmpty && !isFreeze) {
      setState(() => _isSubmitting = false);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('No marks entered to save.')));
      return;
    }

    try {
      if (marksToSubmit.isNotEmpty) {
        final res = await ApiService.bulkUploadMarks({'marks': marksToSubmit});
        if (!res['success']) {
          throw Exception(res['message'] ?? 'Failed to save marks');
        }
      }

      if (isFreeze) {
        final freezeRes = await ApiService.freezeExamClass(_selectedExamId!, _selectedClassId!, true);
        if (!freezeRes['success']) {
          throw Exception(freezeRes['message'] ?? 'Failed to freeze marks');
        }
        
        // Update local state
        setState(() {
          _isClassFrozen = true;
          final idx = _exams.indexWhere((e) => e['id'] == _selectedExamId);
          if (idx != -1) {
            final exam = _exams[idx];
            final frozen = exam['frozenClasses'];
            if (frozen == null) {
              exam['frozenClasses'] = [_selectedClassId];
            } else if (frozen is List) {
              if (!frozen.contains(_selectedClassId)) frozen.add(_selectedClassId);
            }
          }
        });
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Marks frozen successfully!'), backgroundColor: Colors.green));
      } else {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Marks saved as draft successfully!'), backgroundColor: Colors.green));
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: Colors.red));
    } finally {
      setState(() => _isSubmitting = false);
    }
  }

  Future<void> _sendSMS() async {
    if (_selectedExamId == null || _selectedClassId == null) return;
    
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Send SMS?', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        content: const Text('Are you sure you want to send the results via SMS to all parents in this class?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF6366F1)),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Send SMS', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
    
    if (confirm != true) return;
    
    setState(() => _isSubmitting = true);
    
    try {
      final res = await ApiService.sendMarksSMS(_selectedExamId!, _selectedClassId!);
      if (res['success']) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('SMS sent successfully!'), backgroundColor: Colors.green));
      } else {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(res['message'] ?? 'Failed to send SMS'), backgroundColor: Colors.red));
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red));
    } finally {
      setState(() => _isSubmitting = false);
    }
  }


  Future<void> _handleClearMarks() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Clear Marks?', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.red)),
        content: const Text('Are you sure you want to clear marks for this subject?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Clear', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    setState(() => _isSubmitting = true);
    final res = await ApiService.clearMarks(_selectedExamId!, _selectedClassId!, subjectId: _selectedSubjectId);
    setState(() => _isSubmitting = false);

    if (mounted) {
      if (res['success']) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Marks cleared!'), backgroundColor: Colors.green));
        _fetchStudentsAndMarks(); // reload
      } else {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(res['message'] ?? 'Failed to clear marks'), backgroundColor: Colors.red));
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
        title: Text('Marks Entry', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white)),
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
        actions: [
          if (_students.isNotEmpty && !_isLoadingStudents && !_isClassFrozen)
            IconButton(
              icon: const Icon(Icons.delete_sweep, color: Colors.white),
              onPressed: _handleClearMarks,
              tooltip: 'Clear Marks',
            )
        ],
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
                  _buildSubmitButtons(),
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
                    value: e['id'].toString(),
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
                          value: c['id'].toString(),
                          child: Text('${c['name']}-${c['section']}'),
                        );
                      }).toList(),
                      onChanged: (val) {
                        setState(() => _selectedClassId = val);
                        if (_selectedSubjectId != null) {
                          _fetchStudentsAndMarks();
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
                          value: s['id'].toString(),
                          child: Text(s['name'] ?? 'Subject'),
                        );
                      }).toList(),
                      onChanged: (val) {
                        setState(() {
                          _selectedSubjectId = val;
                          final subj = _subjects.firstWhere((s) => s['id'].toString() == val, orElse: () => null);
                          if (subj != null) {
                            _maxMarks = double.tryParse(subj['maxMarks']?.toString() ?? '100') ?? 100;
                          }
                        });
                        if (_selectedClassId != null) {
                          _fetchStudentsAndMarks();
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
        final id = s['id'].toString();
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
                  name.isNotEmpty ? name[0].toUpperCase() : 'S',
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
                  readOnly: _isClassFrozen,
                  style: GoogleFonts.poppins(fontWeight: FontWeight.bold, color: _isClassFrozen ? Colors.grey : Colors.black),
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

  Widget _buildSubmitButtons() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
      ),
      child: _isClassFrozen
          ? Column(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  decoration: BoxDecoration(
                    color: Colors.green.shade50,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.green.shade200),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.lock, color: Colors.green, size: 20),
                      const SizedBox(width: 8),
                      Text('Class Marks Frozen', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.green.shade700, fontSize: 16)),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  height: 54,
                  child: ElevatedButton.icon(
                    onPressed: _isSubmitting ? null : _sendSMS,
                    icon: _isSubmitting
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : const Icon(Icons.message_rounded, color: Colors.white),
                    label: Text('Send Marks via SMS', style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF6366F1),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      elevation: 2,
                    ),
                  ),
                ),
              ],
            )
          : Row(
              children: [
                Expanded(
                  child: SizedBox(
                    height: 54,
                    child: OutlinedButton.icon(
                      onPressed: _isSubmitting ? null : () => _handleSubmit(isFreeze: false),
                      icon: const Icon(Icons.save, color: Color(0xFF1E293B)),
                      label: Text('Save Draft', style: GoogleFonts.outfit(color: const Color(0xFF1E293B), fontWeight: FontWeight.bold)),
                      style: OutlinedButton.styleFrom(
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        side: const BorderSide(color: Color(0xFFE2E8F0), width: 2),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: SizedBox(
                    height: 54,
                    child: ElevatedButton.icon(
                      onPressed: _isSubmitting ? null : () => _handleSubmit(isFreeze: true),
                      icon: _isSubmitting
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : const Icon(Icons.lock_outline, color: Colors.white),
                      label: Text('Freeze', style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFEF4444), // Red for dangerous freeze action
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        elevation: 4,
                      ),
                    ),
                  ),
                ),
              ],
            ),
    );
  }
}
