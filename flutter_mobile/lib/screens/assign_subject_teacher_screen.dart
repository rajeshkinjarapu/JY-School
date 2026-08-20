import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class AssignSubjectTeacherScreen extends StatefulWidget {
  final dynamic subjectInstance;
  final List<dynamic> teachers;

  const AssignSubjectTeacherScreen({
    super.key,
    required this.subjectInstance,
    required this.teachers,
  });

  @override
  State<AssignSubjectTeacherScreen> createState() => _AssignSubjectTeacherScreenState();
}

class _AssignSubjectTeacherScreenState extends State<AssignSubjectTeacherScreen> {
  String? _selectedTeacherId;
  bool _isSubmitting = false;

  Future<void> _submitAssignment() async {
    if (_selectedTeacherId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select a teacher')));
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      final classId = widget.subjectInstance['classId'];
      final subjectId = widget.subjectInstance['id'];
      
      final res = await ApiService.assignTeacherToSubject(classId, subjectId, _selectedTeacherId!);
      if (res['success']) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Teacher assigned successfully!', style: TextStyle(color: Colors.white)), backgroundColor: Colors.green));
          Navigator.pop(context, true);
        }
      } else {
        throw Exception(res['message']);
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e', style: const TextStyle(color: Colors.white)), backgroundColor: Colors.red));
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final classObj = widget.subjectInstance['class'] ?? {};
    final className = '${classObj['name'] ?? ''} ${classObj['section'] ?? ''}'.trim();
    final subjectName = widget.subjectInstance['name'] ?? '';

    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        title: Text('Assign Teacher', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.white)),
        backgroundColor: const Color(0xFF0F172A),
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 15, offset: const Offset(0, 5))],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFFE2E8F0))),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Subject', style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF64748B))),
                    Text(subjectName, style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
                    const SizedBox(height: 12),
                    Text('Class Room', style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF64748B))),
                    Text(className.isEmpty ? 'Global' : className, style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
                  ],
                ),
              ),
              const SizedBox(height: 32),
              
              Text('Select Teacher', style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF64748B))),
              const SizedBox(height: 6),
              DropdownButtonFormField<String>(
                value: _selectedTeacherId,
                decoration: InputDecoration(
                  filled: true,
                  fillColor: const Color(0xFFF8FAFC),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                ),
                items: widget.teachers.map((t) {
                  final user = t['user'] ?? {};
                  return DropdownMenuItem(
                    value: t['id'].toString(),
                    child: Text('${user['name'] ?? ''} (${t['employeeId'] ?? ''})'),
                  );
                }).toList(),
                onChanged: (v) => setState(() => _selectedTeacherId = v),
              ),
              const SizedBox(height: 32),
              
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: _isSubmitting ? null : _submitAssignment,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0F172A),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    elevation: 0,
                  ),
                  child: _isSubmitting
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : Text('Assign Teacher', style: GoogleFonts.poppins(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w600)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
