import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
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
  String? _classId;
  String? _subjectId;
  String _fileUrl = '';
  String _answerKeyUrl = '';
  String _answerKeyText = '';

  List<dynamic> _exams = [];
  List<dynamic> _classes = [];
  List<dynamic> _subjects = [];
  
  bool _isLoadingData = true;
  bool _isUploading = false;

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
        if (classesRes['success']) _classes = classesRes['data'] ?? [];
        if (subjectsRes['success']) _subjects = subjectsRes['data'] ?? [];
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

    if (_classId == null || _classId!.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select a class')));
      return;
    }

    setState(() => _isUploading = true);

    try {
      final payload = {
        'title': _title,
        'classId': _classId,
        'subjectId': _subjectId?.isEmpty ?? true ? null : _subjectId,
        'examId': _examId?.isEmpty ?? true ? null : _examId,
        'fileUrl': _fileUrl,
        'answerKeyUrl': _answerKeyUrl.isEmpty ? null : _answerKeyUrl,
        'answerKey': _answerKeyText.isEmpty ? null : _answerKeyText,
      };

      final res = await ApiService.createQuestionPaper(payload);
      if (res['success']) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Question paper uploaded successfully!')));
          Navigator.pop(context, true); // Return true to trigger refresh
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(res['message'] ?? 'Failed to upload')));
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
                    label: 'Paper Title',
                    hint: 'e.g. Mid Term Physics Paper',
                    icon: Icons.title,
                    validator: (v) => v == null || v.isEmpty ? 'Title is required' : null,
                    onSaved: (v) => _title = v ?? '',
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: _buildDropdown(
                          label: 'Exam (Optional)',
                          value: _examId,
                          items: _exams,
                          onChanged: (v) => setState(() => _examId = v as String?),
                          getLabel: (e) => e['name'],
                          getValue: (e) => e['id'],
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: _buildDropdown(
                          label: 'Class *',
                          value: _classId,
                          items: _classes,
                          onChanged: (v) => setState(() => _classId = v as String?),
                          getLabel: (c) => '${c['name']}-${c['section']}',
                          getValue: (c) => c['id'],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _buildDropdown(
                    label: 'Subject (Optional)',
                    value: _subjectId,
                    items: _subjects,
                    onChanged: (v) => setState(() => _subjectId = v as String?),
                    getLabel: (s) => s['name'],
                    getValue: (s) => s['id'],
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
                        Text('File Link (PDF/Word) *', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 14)),
                        const SizedBox(height: 8),
                        TextFormField(
                          decoration: InputDecoration(
                            hintText: 'https://link-to-file.pdf',
                            hintStyle: GoogleFonts.poppins(color: Colors.grey.shade400, fontSize: 13),
                            prefixIcon: const Icon(Icons.link, color: Color(0xFF6366F1)),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
                            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
                            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF6366F1))),
                            filled: true,
                            fillColor: const Color(0xFFF8FAFC),
                          ),
                          keyboardType: TextInputType.url,
                          validator: (v) => v == null || v.isEmpty ? 'File URL is required' : null,
                          onSaved: (v) => _fileUrl = v ?? '',
                        ),
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
