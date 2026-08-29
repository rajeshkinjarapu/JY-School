import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:file_picker/file_picker.dart';
import 'dart:typed_data';
import 'dart:convert';
import '../services/api_service.dart';

class UploadQuestionPaperScreen extends StatefulWidget {
  const UploadQuestionPaperScreen({super.key});

  @override
  State<UploadQuestionPaperScreen> createState() => _UploadQuestionPaperScreenState();
}

class _UploadQuestionPaperScreenState extends State<UploadQuestionPaperScreen> {
  final _formKey = GlobalKey<FormState>();
  
  String _title = '';
  String? _examId;
  List<String> _selectedClassIds = [];
  List<String> _selectedSubjectIds = [];
  String _fileUrl = '';
  String _answerKeyUrl = '';
  String _answerKeyText = '';

  List<dynamic> _exams = [];
  List<dynamic> _classes = [];
  List<dynamic> _allClasses = [];
  List<dynamic> _subjects = [];
  List<dynamic> _allSubjects = [];
  
  bool _isLoadingData = true;
  bool _isUploading = false;
  bool _isUploadingFile = false;
  String? _fileName;

  final _fileUrlController = TextEditingController();

  @override
  void dispose() {
    _fileUrlController.dispose();
    super.dispose();
  }

  Future<void> _pickAndUploadFile() async {
    try {
      FilePickerResult? result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'doc', 'docx'],
        withData: true,
      );

      if (result != null && result.files.single.bytes != null) {
        setState(() => _isUploadingFile = true);
        final bytes = result.files.single.bytes!;
        final name = result.files.single.name;
        
        final res = await ApiService.uploadDocument(bytes, name);
        setState(() {
          _isUploadingFile = false;
          if (res['success']) {
            _fileUrl = res['url'] ?? '';
            _fileUrlController.text = _fileUrl;
            _fileName = name;
            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('File uploaded successfully!')));
          } else {
            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(res['message'] ?? 'Upload failed')));
          }
        });
      }
    } catch (e) {
      setState(() => _isUploadingFile = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error picking/uploading file: $e')));
    }
  }

  @override
  void initState() {
    super.initState();
    _fetchFormData();
  }

  Future<void> _fetchFormData() async {
    try {
      final examsRes = await ApiService.getExams();
      final classesRes = await ApiService.getClasses();
      final subjectsRes = await ApiService.getSubjects();

      setState(() {
        if (examsRes['success']) _exams = examsRes['data'] ?? [];
        if (classesRes['success']) {
          _allClasses = classesRes['data'] ?? [];
          _classes = List<dynamic>.from(_allClasses);
        }
        if (subjectsRes['success']) {
          _allSubjects = subjectsRes['data'] ?? [];
          _subjects = List<dynamic>.from(_allSubjects);
        }
        _isLoadingData = false;
      });
    } catch (e) {
      setState(() => _isLoadingData = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error loading data: $e')));
      }
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    _formKey.currentState!.save();

    if (_selectedClassIds.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select at least one class')));
      return;
    }

    _fileUrl = _fileUrlController.text.trim();
    if (_fileUrl.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please upload a file or enter a document URL')));
      return;
    }

    setState(() => _isUploading = true);

    try {
      bool allSuccess = true;
      String? lastError;

      // If no subjects are selected, we upload once per class with null subject
      final List<String?> subjectsToUpload = _selectedSubjectIds.isEmpty
          ? [null]
          : _selectedSubjectIds.map((id) => id as String?).toList();

      for (final classId in _selectedClassIds) {
        for (final subjectId in subjectsToUpload) {
          String finalTitle = _title.trim();
          if (finalTitle.isEmpty) {
            String examPart = '';
            if (_examId != null && _examId!.isNotEmpty) {
              final examObj = _exams.firstWhere((e) => e['id'] == _examId, orElse: () => null);
              if (examObj != null) {
                examPart = examObj['name'] ?? '';
              }
            }
            String subjectPart = '';
            if (subjectId != null) {
              final subObj = _subjects.firstWhere((s) => s['id'] == subjectId, orElse: () => null);
              if (subObj != null) {
                subjectPart = subObj['name'] ?? '';
              }
            }
            if (examPart.isNotEmpty && subjectPart.isNotEmpty) {
              finalTitle = '$examPart - $subjectPart';
            } else if (examPart.isNotEmpty) {
              finalTitle = examPart;
            } else if (subjectPart.isNotEmpty) {
              finalTitle = subjectPart;
            } else {
              finalTitle = _fileName ?? 'Question Paper';
            }
          }

          final payload = {
            'title': finalTitle,
            'classId': classId,
            'subjectId': subjectId,
            'examId': _examId?.isEmpty ?? true ? null : _examId,
            'fileUrl': _fileUrl,
            'answerKeyUrl': _answerKeyUrl.isEmpty ? null : _answerKeyUrl,
            'answerKey': _answerKeyText.isEmpty ? null : _answerKeyText,
          };

          final res = await ApiService.createQuestionPaper(payload);
          if (!res['success']) {
            allSuccess = false;
            lastError = res['message'];
          }
        }
      }

      if (allSuccess) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Question paper(s) uploaded successfully!')));
          Navigator.pop(context, true); // Return true to trigger refresh
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(lastError ?? 'Failed to upload question paper(s)')));
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) {
        setState(() => _isUploading = false);
      }
    }
  }

  void _showMultiClassSelector() {
    showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return AlertDialog(
              title: const Text('Select Classes'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: _classes.map((c) {
                    final isChecked = _selectedClassIds.contains(c['id']);
                    return CheckboxListTile(
                      title: Text('${c['name']}-${c['section']}'),
                      value: isChecked,
                      onChanged: (val) {
                        setModalState(() {
                          if (val == true) {
                            _selectedClassIds.add(c['id']);
                          } else {
                            _selectedClassIds.remove(c['id']);
                          }
                        });
                        setState(() {}); // refresh main screen
                      },
                    );
                  }).toList(),
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Done'),
                )
              ],
            );
          }
        );
      }
    );
  }

  void _showMultiSubjectSelector() {
    showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return AlertDialog(
              title: const Text('Select Subjects'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: _subjects.map((s) {
                    final isChecked = _selectedSubjectIds.contains(s['id']);
                    return CheckboxListTile(
                      title: Text(s['name'] ?? ''),
                      value: isChecked,
                      onChanged: (val) {
                        setModalState(() {
                          if (val == true) {
                            _selectedSubjectIds.add(s['id']);
                          } else {
                            _selectedSubjectIds.remove(s['id']);
                          }
                        });
                        setState(() {}); // refresh main screen
                      },
                    );
                  }).toList(),
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Done'),
                )
              ],
            );
          }
        );
      }
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          'Upload Question Paper',
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
      body: _isLoadingData 
        ? const Center(child: CircularProgressIndicator(color: Color(0xFF6366F1)))
        : SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildSectionTitle('Paper Details'),
                  const SizedBox(height: 16),
                  _buildTextField(
                    label: 'Paper Title (Optional)',
                    hint: 'e.g. Mid Term Physics Paper',
                    icon: Icons.title,
                    onSaved: (v) => _title = v ?? '',
                  ),
                  const SizedBox(height: 16),
                  _buildDropdown(
                    label: 'Exam (Optional)',
                    value: _examId,
                    items: _exams,
                    onChanged: (v) {
                      setState(() {
                        _examId = v as String?;
                        if (_examId != null && _examId!.isNotEmpty) {
                          final selectedExam = _exams.firstWhere((e) => e['id'] == _examId, orElse: () => null);
                          if (selectedExam != null && selectedExam['classes'] != null) {
                            _classes = List<dynamic>.from(selectedExam['classes']);
                          } else {
                            _classes = [];
                          }
                          // Filter subjects based on selected exam
                          if (selectedExam != null && selectedExam['subjects'] != null) {
                            final examSubs = selectedExam['subjects'] is String 
                                ? jsonDecode(selectedExam['subjects']) 
                                : selectedExam['subjects'] as List<dynamic>;
                            _subjects = examSubs.map((es) {
                              final subId = es['id'] ?? es['subjectId'] ?? es['subject']?['id'];
                              final foundSub = _allSubjects.firstWhere((s) => s['id'] == subId, orElse: () => null);
                              return foundSub ?? { 'id': subId, 'name': es['name'] ?? es['subject']?['name'] };
                            }).toList();
                          } else {
                            _subjects = [];
                          }
                        } else {
                          _classes = List<dynamic>.from(_allClasses);
                          _subjects = List<dynamic>.from(_allSubjects);
                        }
                        // Reset selections if they are no longer in the filtered list
                        _selectedClassIds.clear();
                        _selectedSubjectIds.clear();
                      });
                    },
                    getLabel: (e) => e['name'],
                    getValue: (e) => e['id'],
                  ),
                  const SizedBox(height: 16),
                  InkWell(
                    onTap: _showMultiClassSelector,
                    child: InputDecorator(
                      decoration: InputDecoration(
                        labelText: 'Classes *',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        prefixIcon: const Icon(Icons.class_outlined, color: Color(0xFF6366F1)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      ),
                      child: Text(
                        _selectedClassIds.isEmpty
                            ? 'Select Classes'
                            : _selectedClassIds.map((id) {
                                final cls = _classes.firstWhere((c) => c['id'] == id, orElse: () => null);
                                return cls != null ? '${cls['name']}-${cls['section']}' : '';
                              }).join(', '),
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  InkWell(
                    onTap: _showMultiSubjectSelector,
                    child: InputDecorator(
                      decoration: InputDecoration(
                        labelText: 'Subjects (Optional)',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        prefixIcon: const Icon(Icons.book_outlined, color: Color(0xFF6366F1)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      ),
                      child: Text(
                        _selectedSubjectIds.isEmpty
                            ? 'All Subjects / Combined'
                            : _selectedSubjectIds.map((id) {
                                final sub = _subjects.firstWhere((s) => s['id'] == id, orElse: () => null);
                                return sub != null ? sub['name'] : '';
                              }).join(', '),
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ),
                  
                  const SizedBox(height: 32),
                  _buildSectionTitle('Document Upload'),
                  const SizedBox(height: 16),
                  
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                      boxShadow: [
                        BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 8, offset: const Offset(0, 2))
                      ]
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Document File (PDF/Word/Link) *', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 14)),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: TextFormField(
                                controller: _fileUrlController,
                                decoration: InputDecoration(
                                  hintText: 'https://link-to-file.pdf or Upload',
                                  hintStyle: GoogleFonts.poppins(color: Colors.grey.shade400, fontSize: 13),
                                  prefixIcon: const Icon(Icons.link, color: Color(0xFF6366F1)),
                                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
                                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
                                  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF6366F1))),
                                  filled: true,
                                  fillColor: const Color(0xFFF8FAFC),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            if (_isUploadingFile)
                              const CircularProgressIndicator(color: Color(0xFF6366F1))
                            else
                              IconButton.filled(
                                onPressed: _pickAndUploadFile,
                                icon: const Icon(Icons.upload_file),
                                style: IconButton.styleFrom(
                                  backgroundColor: const Color(0xFF6366F1),
                                  foregroundColor: Colors.white,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  padding: const EdgeInsets.all(14),
                                ),
                              ),
                          ],
                        ),
                        if (_fileName != null) ...[
                          const SizedBox(height: 8),
                          Text(
                            '✓ Selected: $_fileName',
                            style: GoogleFonts.poppins(color: Colors.green, fontSize: 11, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ],
                    ),
                  ),

                  const SizedBox(height: 32),
                  _buildSectionTitle('Answer Key (Optional)'),
                  const SizedBox(height: 16),
                  
                  _buildTextField(
                    label: 'Answer Key Document Link',
                    hint: 'https://link-to-answer-key.pdf',
                    icon: Icons.key_outlined,
                    onSaved: (v) => _answerKeyUrl = v ?? '',
                  ),
                  const SizedBox(height: 16),
                  _buildTextField(
                    label: 'Typed Answer Key',
                    hint: '1-A, 2-B, 3-C...',
                    icon: Icons.notes,
                    maxLines: 4,
                    onSaved: (v) => _answerKeyText = v ?? '',
                  ),
                  
                  const SizedBox(height: 40),
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      onPressed: _isUploading ? null : _submit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF6366F1),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        elevation: 4,
                        shadowColor: const Color(0xFF6366F1).withOpacity(0.5),
                      ),
                      child: _isUploading
                        ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5))
                        : Text('Upload Question Paper', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
                    ),
                  ),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Row(
      children: [
        Container(width: 4, height: 20, decoration: BoxDecoration(color: const Color(0xFF6366F1), borderRadius: BorderRadius.circular(2))),
        const SizedBox(width: 8),
        Text(title, style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
      ],
    );
  }

  Widget _buildTextField({
    required String label, 
    required String hint, 
    required IconData icon, 
    int maxLines = 1,
    String? Function(String?)? validator,
    void Function(String?)? onSaved,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 14)),
        const SizedBox(height: 8),
        TextFormField(
          maxLines: maxLines,
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: GoogleFonts.poppins(color: Colors.grey.shade400, fontSize: 13),
            prefixIcon: maxLines == 1 ? Icon(icon, color: Colors.grey.shade500) : null,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF6366F1))),
            filled: true,
            fillColor: Colors.white,
          ),
          validator: validator,
          onSaved: onSaved,
        ),
      ],
    );
  }

  Widget _buildDropdown({
    required String label,
    required String? value,
    required List<dynamic> items,
    required void Function(Object?) onChanged,
    required String Function(dynamic) getLabel,
    required String Function(dynamic) getValue,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 14)),
        const SizedBox(height: 8),
        DropdownButtonFormField(
          value: value,
          icon: const Icon(Icons.keyboard_arrow_down_rounded, color: Color(0xFF6366F1)),
          decoration: InputDecoration(
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF6366F1))),
            filled: true,
            fillColor: Colors.white,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          ),
          items: items.map((item) {
            return DropdownMenuItem(
              value: getValue(item),
              child: Text(getLabel(item), style: GoogleFonts.poppins(fontSize: 13)),
            );
          }).toList(),
          onChanged: onChanged,
        ),
      ],
    );
  }
}
