import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../widgets/app_drawer.dart';

class AdmitCardScreen extends StatefulWidget {
  const AdmitCardScreen({super.key});

  @override
  State<AdmitCardScreen> createState() => _AdmitCardScreenState();
}

class _AdmitCardScreenState extends State<AdmitCardScreen> {
  Map<String, dynamic>? _studentData;
  List<dynamic> _exams = [];
  String? _selectedExamId;
  Map<String, dynamic>? _selectedExamData;

  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);

    try {
      final meRes = await ApiService.getMe();
      final examsRes = await ApiService.getExams();

      if (mounted) {
        if (meRes['success']) {
          final userRole = meRes['data']['role'];
          if (userRole == 'STUDENT') {
            _studentData = meRes['data']['student'];
          } else {
            _errorMessage = 'Admit Cards are only available for Students.';
          }
        } else {
          _errorMessage = meRes['message'];
        }

        if (examsRes['success']) {
          _exams = examsRes['data'] ?? [];
        }

        setState(() {
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'An error occurred: $e';
          _isLoading = false;
        });
      }
    }
  }

  void _onExamSelected(String? examId) {
    if (examId == null) return;
    setState(() {
      _selectedExamId = examId;
      _selectedExamData = _exams.firstWhere((e) => e['id'] == examId, orElse: () => null);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F7FE),
      drawer: const AppDrawer(currentRoute: 'exams'),
      appBar: AppBar(
        leading: const BackButton(),
        title: Text('Admit Card', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white)),
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
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF6366F1)))
          : _errorMessage != null
              ? Center(child: Text(_errorMessage!, style: const TextStyle(color: Colors.red)))
              : Column(
                  children: [
                    _buildExamSelector(),
                    Expanded(
                      child: _selectedExamData == null
                          ? Center(
                              child: Text(
                                'Please select an exam to view your Admit Card.',
                                style: GoogleFonts.poppins(color: const Color(0xFF475569)),
                              ),
                            )
                          : SingleChildScrollView(
                              padding: const EdgeInsets.all(20),
                              child: _buildAdmitCard(),
                            ),
                    )
                  ],
                ),
    );
  }

  Widget _buildExamSelector() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: const BoxDecoration(color: Color(0xFF1E293B)),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16),
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
                value: e['id'],
                child: Text('${e['name']} (${e['term']})'),
              );
            }).toList(),
            onChanged: _onExamSelected,
          ),
        ),
      ),
    );
  }

  Widget _buildAdmitCard() {
    final examName = _selectedExamData?['name'] ?? 'Exam';
    final term = _selectedExamData?['term'] ?? 'Term';
    final examDate = _selectedExamData?['examDate'] != null 
        ? _selectedExamData!['examDate'].toString().split('T')[0] 
        : 'Unknown Date';
    
    // Parse subjects JSON safely
    List<dynamic> subjects = [];
    if (_selectedExamData?['subjects'] != null) {
      if (_selectedExamData!['subjects'] is List) {
        subjects = _selectedExamData!['subjects'];
      }
    }

    final studentName = _studentData?['user']?['name'] ?? 'Student Name';
    final rollNo = _studentData?['rollNo'] ?? 'Roll No';
    final className = _studentData?['class'] != null 
        ? '${_studentData!['class']['name']}-${_studentData!['class']['section']}' 
        : 'Class';

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
        border: Border.all(color: const Color(0xFFE2E8F0), width: 2),
      ),
      child: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 20),
            decoration: const BoxDecoration(
              color: Color(0xFF2E2A66), // Deep JY School Purple
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(22),
                topRight: Radius.circular(22),
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.school, color: const Color(0xFF64748B), size: 36),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'JY SCHOOL',
                        style: GoogleFonts.outfit(
                          color: const Color(0xFF1E293B),
                          fontSize: 24,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1.5,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'HALL TICKET - $term',
                        style: GoogleFonts.poppins(
                          color: const Color(0xFF93C5FD),
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 2,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          // Student Info Section
          Padding(
            padding: const EdgeInsets.all(24.0),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Profile Picture Placeholder
                Container(
                  width: 90,
                  height: 110,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFCBD5E1), width: 2),
                  ),
                  child: const Center(
                    child: Icon(Icons.person, size: 50, color: Color(0xFF94A3B8)),
                  ),
                ),
                const SizedBox(width: 20),
                // Details
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        studentName,
                        style: GoogleFonts.outfit(
                          color: const Color(0xFF1E293B),
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 12),
                      _buildInfoRow('Roll No', rollNo),
                      const SizedBox(height: 8),
                      _buildInfoRow('Class', className),
                      const SizedBox(height: 8),
                      _buildInfoRow('Exam', examName),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const Divider(height: 1, color: Color(0xFFE2E8F0), thickness: 1),

          // Exam Schedule
          Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.event_note, color: Color(0xFF6366F1), size: 20),
                    const SizedBox(width: 8),
                    Text(
                      'Exam Schedule',
                      style: GoogleFonts.outfit(
                        color: const Color(0xFF1E293B),
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                if (subjects.isEmpty)
                  Text(
                    'No subjects scheduled yet.',
                    style: GoogleFonts.poppins(color: const Color(0xFF475569)),
                  )
                else
                  ...subjects.map((subj) {
                    final sName = subj['name'] ?? 'Subject';
                    // Example mapping; in reality dates come from the backend if available
                    // For now, using the main examDate as fallback
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12.0),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            sName,
                            style: GoogleFonts.poppins(
                              color: const Color(0xFF475569),
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          Text(
                            examDate, // Placeholder date
                            style: GoogleFonts.poppins(
                              color: const Color(0xFF64748B),
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
              ],
            ),
          ),

          // Footer / Signature Area
          Container(
            padding: const EdgeInsets.all(24),
            decoration: const BoxDecoration(
              color: Color(0xFFF8FAFC),
              borderRadius: BorderRadius.only(
                bottomLeft: Radius.circular(22),
                bottomRight: Radius.circular(22),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  children: [
                    Container(width: 80, height: 1, color: const Color(0xFFCBD5E1)),
                    const SizedBox(height: 8),
                    Text(
                      'Student Signature',
                      style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 12),
                    ),
                  ],
                ),
                Column(
                  children: [
                    Container(width: 80, height: 1, color: const Color(0xFFCBD5E1)),
                    const SizedBox(height: 8),
                    Text(
                      'Principal',
                      style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 12),
                    ),
                  ],
                ),
              ],
            ),
          )
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 70,
          child: Text(
            label,
            style: GoogleFonts.poppins(
              color: const Color(0xFF475569),
              fontSize: 13,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        const Text(
          ': ',
          style: TextStyle(color: Color(0xFF94A3B8)),
        ),
        Expanded(
          child: Text(
            value,
            style: GoogleFonts.poppins(
              color: const Color(0xFF334155),
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }
}


