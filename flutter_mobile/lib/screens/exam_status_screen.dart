import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class ExamStatusScreen extends StatefulWidget {
  const ExamStatusScreen({super.key});

  @override
  State<ExamStatusScreen> createState() => _ExamStatusScreenState();
}

class _ExamStatusScreenState extends State<ExamStatusScreen> {
  bool _isLoading = true;
  String? _errorMessage;
  List<dynamic> _examData = [];
  String? _selectedExamId;

  @override
  void initState() {
    super.initState();
    _fetchStatus();
  }

  Future<void> _fetchStatus() async {
    try {
      final res = await ApiService.getExamStatus();
      if (mounted) {
        setState(() {
          _examData = res['success'] ? (res['data'] ?? []) : [];
          if (_examData.isNotEmpty && _selectedExamId == null) {
            _selectedExamId = _examData[0]['id'].toString();
          }
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Failed to load exam status: $e';
          _isLoading = false;
        });
      }
    }
  }

  Map<String, dynamic>? get _activeExam {
    if (_selectedExamId == null) return null;
    try {
      return _examData.firstWhere((e) => e['id'].toString() == _selectedExamId);
    } catch (e) {
      return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text('Status Overview', style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold)),
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
      ),
      body: _isLoading 
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF6366F1)))
          : _errorMessage != null
              ? Center(child: Text(_errorMessage!, style: GoogleFonts.poppins(color: Colors.red)))
              : Column(
                  children: [
                    _buildDropdownSection(),
                    Expanded(child: _buildStatusList()),
                  ],
                ),
    );
  }

  Widget _buildDropdownSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4))],
        borderRadius: const BorderRadius.only(bottomLeft: Radius.circular(20), bottomRight: Radius.circular(20)),
      ),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        decoration: BoxDecoration(
          color: const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: DropdownButtonHideUnderline(
          child: DropdownButton<String>(
            isExpanded: true,
            value: _selectedExamId,
            hint: Text('Select an Exam...', style: GoogleFonts.poppins(fontSize: 14, color: const Color(0xFF94A3B8))),
            icon: const Icon(Icons.keyboard_arrow_down_rounded, color: Color(0xFF64748B)),
            onChanged: (val) => setState(() => _selectedExamId = val),
            items: _examData.map((e) {
              final title = e['name'] + (e['term'] != null ? ' (${e['term']})' : '');
              return DropdownMenuItem<String>(
                value: e['id'].toString(),
                child: Text(title, style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w600, color: const Color(0xFF1E293B))),
              );
            }).toList(),
          ),
        ),
      ),
    );
  }

  Widget _buildStatusList() {
    final activeExam = _activeExam;
    if (activeExam == null) {
      return Center(child: Text('Please select an exam', style: GoogleFonts.poppins(color: const Color(0xFF64748B))));
    }

    final classes = activeExam['classes'] as List? ?? [];
    if (classes.isEmpty) {
      return Center(child: Text('No classes assigned to this exam yet.', style: GoogleFonts.poppins(color: const Color(0xFF64748B))));
    }

    List<dynamic> frozenClasses = [];
    if (activeExam['frozenClasses'] != null) {
      if (activeExam['frozenClasses'] is String) {
        try {
          frozenClasses = jsonDecode(activeExam['frozenClasses']);
        } catch (_) {}
      } else if (activeExam['frozenClasses'] is List) {
        frozenClasses = activeExam['frozenClasses'];
      }
    }

    final classesWithMarks = activeExam['classesWithMarks'] as List? ?? [];
    final isPublished = activeExam['admitCardSettings']?['progressCardPublished'] == true;

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: classes.length,
      itemBuilder: (context, index) {
        final cls = classes[index];
        final classId = cls['id'];
        final className = '${cls['name']} - ${cls['section']}';
        
        final hasMarks = classesWithMarks.contains(classId);
        final isExplicitlyFrozen = frozenClasses.contains(classId);

        Widget statusBadge;
        if (isPublished) {
          statusBadge = _buildStatusBadge('PUBLISHED', Icons.public_rounded, const Color(0xFF10B981), const Color(0xFF10B981).withOpacity(0.1));
        } else if (isExplicitlyFrozen) {
          statusBadge = _buildStatusBadge('LOCKED', Icons.lock_rounded, const Color(0xFF8B5CF6), const Color(0xFF8B5CF6).withOpacity(0.1));
        } else if (hasMarks) {
          statusBadge = _buildStatusBadge('DRAFT', Icons.edit_note_rounded, const Color(0xFF3B82F6), const Color(0xFF3B82F6).withOpacity(0.1));
        } else {
          statusBadge = _buildStatusBadge('MISSING', Icons.error_outline_rounded, const Color(0xFFEF4444), const Color(0xFFEF4444).withOpacity(0.1));
        }

        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFF1F5F9)),
            boxShadow: [BoxShadow(color: const Color(0xFF6366F1).withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 4))],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(10)),
                    child: const Icon(Icons.class_rounded, color: Color(0xFF6366F1), size: 20),
                  ),
                  const SizedBox(width: 16),
                  Text(className, style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
                ],
              ),
              statusBadge,
            ],
          ),
        );
      },
    );
  }

  Widget _buildStatusBadge(String text, IconData icon, Color color, Color bgColor) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(color: bgColor, borderRadius: BorderRadius.circular(8)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 4),
          Text(text, style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.bold, color: color)),
        ],
      ),
    );
  }
}
