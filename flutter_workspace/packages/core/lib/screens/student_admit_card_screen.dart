import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../widgets/custom_network_image.dart';

class StudentAdmitCardScreen extends StatefulWidget {
  final Map<String, dynamic> user;

  const StudentAdmitCardScreen({super.key, required this.user});

  @override
  State<StudentAdmitCardScreen> createState() => _StudentAdmitCardScreenState();
}

class _StudentAdmitCardScreenState extends State<StudentAdmitCardScreen> {
  bool _isLoading = true;
  String? _errorMessage;
  List<dynamic> _exams = [];
  Map<String, dynamic>? _selectedExamData;

  @override
  void initState() {
    super.initState();
    _fetchExams();
  }

  Future<void> _fetchExams() async {
    setState(() { _isLoading = true; _errorMessage = null; });
    try {
      final classId = widget.user['student']?['classId'];
      if (classId == null) throw 'Class information not found.';
      
      // Fetch exams for this class
      final res = await ApiService.getExams(classId: classId.toString());
      if (res['success']) {
        setState(() {
          _exams = res['data'] ?? [];
          if (_exams.isNotEmpty) {
            _selectedExamData = _exams.first; // Default to first/latest exam
          }
        });
      } else {
        throw res['message'] ?? 'Failed to load exams';
      }
    } catch (e) {
      setState(() => _errorMessage = e.toString());
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Widget _buildAdmitCardWidget() {
    if (_selectedExamData == null) return const SizedBox();
    
    final studentData = widget.user;
    final examName = _selectedExamData?['name'] ?? 'Exam';
    final term = _selectedExamData?['term'] ?? 'Term';
    
    final settings = _selectedExamData?['admitCardSettings'] ?? {};
    final instructions = settings['instructions'] ?? 
        "Candidate must carry this Admit Card to the examination hall.\nElectronic devices including calculators and mobile phones are strictly prohibited.\nCandidate should report to the examination center 30 minutes before commencement.";
    final signatureUrl = settings['signatureUrl'] ?? '';
    final teacherSignatureUrl = settings['teacherSignatureUrl'] ?? '';

    // Schedule
    List<dynamic> schedule = [];
    var examPlans = _selectedExamData?['examPlans'];
    if (examPlans is String) {
      try { examPlans = jsonDecode(examPlans); } catch(e) { examPlans = []; }
    }
    if (examPlans is List) {
      schedule = List.from(examPlans);
      schedule.sort((a, b) => (a['date'] ?? '').compareTo(b['date'] ?? ''));
    }

    final sProfile = studentData['student'] ?? {};
    final name = studentData['name'] ?? 'Student';
    final rollNo = sProfile['rollNumber'] ?? 'N/A';
    final cls = sProfile['class']?['name'] ?? 'N/A';
    final photo = studentData['avatar'] ?? studentData['photo'] ?? studentData['photoUrl'];

    return Container(
      margin: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF6366F1), width: 2),
        boxShadow: [
          BoxShadow(color: const Color(0xFF6366F1).withOpacity(0.2), blurRadius: 20, offset: const Offset(0, 10)),
        ],
      ),
      child: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              color: Color(0xFF6366F1),
              borderRadius: BorderRadius.vertical(top: Radius.circular(14)),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
                  child: const Icon(Icons.school, color: Color(0xFF6366F1), size: 24),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('JY SCHOOL', style: GoogleFonts.outfit(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: 1)),
                      Text('ADMIT CARD - $term', style: GoogleFonts.poppins(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.w600)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          // Student Info
          Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(examName, style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
                      const SizedBox(height: 12),
                      _buildInfoRow('Name', name),
                      _buildInfoRow('Class', cls),
                      _buildInfoRow('Roll No', rollNo.toString()),
                    ],
                  ),
                ),
                if (photo != null && photo.toString().isNotEmpty)
                  Container(
                    width: 80, height: 100,
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey[300]!),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: CustomNetworkImage(ApiService.getImageUrl(photo), fit: BoxFit.cover),
                    ),
                  )
                else
                  Container(
                    width: 80, height: 100,
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey[300]!),
                      borderRadius: BorderRadius.circular(8),
                      color: Colors.grey[100],
                    ),
                    child: const Icon(Icons.person, size: 40, color: Colors.grey),
                  ),
              ],
            ),
          ),
          
          // Schedule Table
          if (schedule.isNotEmpty) ...[
            const Divider(height: 1),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Examination Schedule', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 14)),
                  const SizedBox(height: 8),
                  Container(
                    decoration: BoxDecoration(border: Border.all(color: Colors.grey[300]!), borderRadius: BorderRadius.circular(8)),
                    child: Table(
                      border: TableBorder.symmetric(inside: BorderSide(color: Colors.grey[300]!)),
                      children: [
                        TableRow(
                          decoration: BoxDecoration(color: Colors.grey[50], borderRadius: const BorderRadius.vertical(top: Radius.circular(8))),
                          children: [
                            _buildTableCell('Date', isHeader: true),
                            _buildTableCell('Subject', isHeader: true),
                            _buildTableCell('Time', isHeader: true),
                          ],
                        ),
                        ...schedule.map((plan) {
                          final dateStr = plan['date'] != null ? plan['date'].toString().split('T')[0] : '';
                          final subj = plan['subject'] != null && plan['subject'] is Map ? plan['subject']['name'] : plan['subject']?.toString() ?? 'N/A';
                          final time = plan['startTime'] ?? 'TBA';
                          return TableRow(
                            children: [
                              _buildTableCell(dateStr),
                              _buildTableCell(subj.toString()),
                              _buildTableCell(time.toString()),
                            ],
                          );
                        }),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
          
          // Instructions
          if (instructions.toString().isNotEmpty) ...[
            const Divider(height: 1),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Instructions:', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.red)),
                  const SizedBox(height: 4),
                  Text(instructions.toString(), style: GoogleFonts.poppins(fontSize: 10, color: Colors.grey[800])),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 70, child: Text(label, style: GoogleFonts.poppins(fontSize: 12, color: Colors.grey[600]))),
          const Text(': ', style: TextStyle(fontWeight: FontWeight.bold)),
          Expanded(child: Text(value, style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF1E293B)))),
        ],
      ),
    );
  }

  Widget _buildTableCell(String text, {bool isHeader = false}) {
    return Padding(
      padding: const EdgeInsets.all(8.0),
      child: Text(
        text,
        style: GoogleFonts.poppins(
          fontSize: isHeader ? 12 : 11,
          fontWeight: isHeader ? FontWeight.bold : FontWeight.w500,
          color: isHeader ? const Color(0xFF1E293B) : const Color(0xFF475569),
        ),
        textAlign: TextAlign.center,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        leading: const BackButton(color: Colors.white),
        title: Text('My Admit Card', style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold)),
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
              ? Center(child: Text(_errorMessage!, style: const TextStyle(color: Colors.red)))
              : _exams.isEmpty
                  ? Center(child: Text('No active exams found for your class.', style: GoogleFonts.poppins(color: Colors.grey[600])))
                  : Column(
                      children: [
                        if (_exams.length > 1)
                          Container(
                            margin: const EdgeInsets.all(16),
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.grey[300]!)),
                            child: DropdownButtonHideUnderline(
                              child: DropdownButton<String>(
                                isExpanded: true,
                                value: _selectedExamData?['id']?.toString(),
                                items: _exams.map((e) => DropdownMenuItem<String>(
                                  value: e['id']?.toString(),
                                  child: Text(e['name']?.toString() ?? 'Exam', style: GoogleFonts.poppins()),
                                )).toList(),
                                onChanged: (val) {
                                  setState(() {
                                    _selectedExamData = _exams.firstWhere((e) => e['id']?.toString() == val, orElse: () => _exams.first);
                                  });
                                },
                              ),
                            ),
                          ),
                        Expanded(
                          child: SingleChildScrollView(
                            physics: const BouncingScrollPhysics(),
                            child: _buildAdmitCardWidget(),
                          ),
                        ),
                      ],
                    ),
    );
  }
}
