import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../widgets/app_drawer.dart';

class TeacherHomeworkScreen extends StatefulWidget {
  const TeacherHomeworkScreen({super.key});

  @override
  State<TeacherHomeworkScreen> createState() => _TeacherHomeworkScreenState();
}

class _TeacherHomeworkScreenState extends State<TeacherHomeworkScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descController = TextEditingController();
  
  List<dynamic> _classes = [];
  List<dynamic> _subjects = [];
  
  String? _selectedClassId;
  String? _selectedSubjectId;
  DateTime _dueDate = DateTime.now().add(const Duration(days: 1)); // Default to tomorrow
  
  bool _loadingSelectors = true;
  bool _isSubmitting = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _fetchSelectors();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    super.dispose();
  }

  Future<void> _fetchSelectors() async {
    final results = await Future.wait([
      ApiService.getClasses(),
      ApiService.getSubjects(),
    ]);

    if (mounted) {
      if (results[0]['success'] && results[1]['success']) {
        final classList = results[0]['data'] ?? [];
        final subjectList = results[1]['data'] ?? [];
        setState(() {
          _classes = classList;
          _subjects = subjectList;
          _loadingSelectors = false;
          if (classList.isNotEmpty) _selectedClassId = classList[0]['id'];
          if (subjectList.isNotEmpty) _selectedSubjectId = subjectList[0]['id'];
        });
      } else {
        setState(() {
          _errorMessage = 'Failed to load options';
          _loadingSelectors = false;
        });
      }
    }
  }

  Future<void> _selectDueDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _dueDate,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 90)),
    );
    if (picked != null && picked != _dueDate) {
      setState(() {
        _dueDate = picked;
      });
    }
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate() || _selectedClassId == null || _selectedSubjectId == null) return;

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    final title = _titleController.text.trim();
    final description = _descController.text.trim();
    final dueDateStr = _dueDate.toIso8601String();

    final result = await ApiService.submitHomework(
      _selectedClassId!,
      _selectedSubjectId!,
      title,
      description,
      dueDateStr,
    );

    if (mounted) {
      setState(() {
        _isSubmitting = false;
      });

      if (result['success']) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Homework posted successfully!',
              style: GoogleFonts.poppins(fontWeight: FontWeight.w600, color: const Color(0xFF1E293B)),
            ),
            backgroundColor: const Color(0xFF10B981),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          ),
        );
        // Clear input fields
        _titleController.clear();
        _descController.clear();
      } else {
        setState(() {
          _errorMessage = result['message'];
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final dateStr = '${_dueDate.day}/${_dueDate.month}/${_dueDate.year}';

    return Scaffold(
      backgroundColor: const Color(0xFFF4F7FE), // Dark slate
      drawer: const AppDrawer(currentRoute: 'homework'),
      appBar: AppBar(
        leading: const BackButton(),
        title: Text(
          'Post Homework',
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold),
        ),
        backgroundColor: const Color(0xFFE2E8F0),
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: _loadingSelectors
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF6366F1)))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Glass Card Container for Form Fields
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: const Color(0xFF1E293B),
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (_errorMessage != null) ...[
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.red.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: Colors.red.withOpacity(0.3)),
                              ),
                              child: Text(
                                _errorMessage!,
                                style: GoogleFonts.poppins(color: Colors.redAccent, fontSize: 13),
                              ),
                            ),
                            const SizedBox(height: 20),
                          ],

                          // 1. Class Selector
                          Text(
                            'Select Class',
                            style: GoogleFonts.outfit(
                              color: const Color(0xFF1E293B),
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 8),
                          _buildDropdownWrapper(
                            child: DropdownButton<String>(
                              value: _selectedClassId,
                              dropdownColor: const Color(0xFFE2E8F0),
                              style: GoogleFonts.poppins(color: const Color(0xFF1E293B), fontWeight: FontWeight.w600),
                              icon: const Icon(Icons.arrow_drop_down, color: const Color(0xFF475569)),
                              isExpanded: true,
                              underline: const SizedBox.shrink(),
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
                              },
                            ),
                          ),
                          const SizedBox(height: 20),

                          // 2. Subject Selector
                          Text(
                            'Select Subject',
                            style: GoogleFonts.outfit(
                              color: const Color(0xFF1E293B),
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 8),
                          _buildDropdownWrapper(
                            child: DropdownButton<String>(
                              value: _selectedSubjectId,
                              dropdownColor: const Color(0xFFE2E8F0),
                              style: GoogleFonts.poppins(color: const Color(0xFF1E293B), fontWeight: FontWeight.w600),
                              icon: const Icon(Icons.arrow_drop_down, color: const Color(0xFF475569)),
                              isExpanded: true,
                              underline: const SizedBox.shrink(),
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
                          const SizedBox(height: 20),

                          // 3. Title Field
                          Text(
                            'Assignment Title',
                            style: GoogleFonts.outfit(
                              color: const Color(0xFF1E293B),
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 8),
                          TextFormField(
                            controller: _titleController,
                            style: GoogleFonts.poppins(color: const Color(0xFF1E293B)),
                            decoration: _buildInputDecoration(
                              hint: 'Enter title (e.g. Chapter 3 Exercise)',
                            ),
                            validator: (value) {
                              if (value == null || value.trim().isEmpty) {
                                return 'Please enter a title';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 20),

                          // 4. Instructions Field
                          Text(
                            'Instructions / Description',
                            style: GoogleFonts.outfit(
                              color: const Color(0xFF1E293B),
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 8),
                          TextFormField(
                            controller: _descController,
                            maxLines: 4,
                            style: GoogleFonts.poppins(color: const Color(0xFF1E293B)),
                            decoration: _buildInputDecoration(
                              hint: 'Describe the homework task details...',
                            ),
                            validator: (value) {
                              if (value == null || value.trim().isEmpty) {
                                return 'Please enter instructions';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 24),

                          // 5. Due Date Picker
                          Text(
                            'Due Date',
                            style: GoogleFonts.outfit(
                              color: const Color(0xFF1E293B),
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 8),
                          InkWell(
                            onTap: _selectDueDate,
                            borderRadius: BorderRadius.circular(16),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                              decoration: BoxDecoration(
                                color: const Color(0xFF1E293B),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: const Color(0xFFE2E8F0)),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Row(
                                    children: [
                                      const Icon(Icons.calendar_today_rounded, color: Color(0xFFC084FC), size: 18),
                                      const SizedBox(width: 12),
                                      Text(
                                        dateStr,
                                        style: GoogleFonts.poppins(
                                          color: const Color(0xFF1E293B),
                                          fontWeight: FontWeight.w600,
                                          fontSize: 14,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const Icon(Icons.edit_calendar_rounded, color: const Color(0xFF94A3B8), size: 18),
                                ],
                              ),
                            ),
                          )
                        ],
                      ),
                    ),
                    const SizedBox(height: 32),

                    // Submit button
                    Container(
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
                                    child: CircularProgressIndicator(color: const Color(0xFF1E293B), strokeWidth: 2.5),
                                  )
                                : Text(
                                    'Publish Homework',
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
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildDropdownWrapper({required Widget child}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: child,
    );
  }

  InputDecoration _buildInputDecoration({required String hint}) {
    return InputDecoration(
      hintText: hint,
      hintStyle: GoogleFonts.poppins(color: const Color(0xFFCBD5E1), fontSize: 13.5),
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: const Color(0xFFE2E8F0)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: const Color(0xFFE2E8F0)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: Color(0xFF818CF8), width: 1.5),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: Colors.red.withOpacity(0.4), width: 1.2),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: Colors.redAccent, width: 1.5),
      ),
      errorStyle: GoogleFonts.poppins(color: Colors.redAccent, fontSize: 11),
    );
  }
}
