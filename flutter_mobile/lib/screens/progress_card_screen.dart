import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class ProgressCardScreen extends StatefulWidget {
  const ProgressCardScreen({super.key});

  @override
  State<ProgressCardScreen> createState() => _ProgressCardScreenState();
}

class _ProgressCardScreenState extends State<ProgressCardScreen> {
  bool _isLoading = true;
  String? _errorMessage;

  List<dynamic> _examsList = [];
  List<dynamic> _classesList = [];
  List<dynamic> _resultsData = [];

  String? _selectedExamId;
  String? _selectedClassId;

  @override
  void initState() {
    super.initState();
    _fetchDropdownData();
  }

  Future<void> _fetchDropdownData() async {
    try {
      final examsRes = await ApiService.getExams();
      final classesRes = await ApiService.getClasses();

      if (mounted) {
        setState(() {
          _examsList = examsRes['success'] ? examsRes['data'] : [];
          _classesList = classesRes['success'] ? classesRes['data'] : [];
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Failed to load options: $e';
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _fetchResults() async {
    if (_selectedExamId == null || _selectedClassId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select Exam and Class')));
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final result = await ApiService.getExamResults(_selectedExamId!, classId: _selectedClassId!);
      if (mounted) {
        setState(() {
          _resultsData = result['success'] ? result['data'] : [];
          _isLoading = false;
          if (!result['success']) {
            _errorMessage = result['message'];
          }
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Failed to fetch results: $e';
          _isLoading = false;
        });
      }
    }
  }

  Color _getGradeColor(String grade) {
    switch (grade.toUpperCase()) {
      case 'A+':
      case 'A':
      case 'O':
        return const Color(0xFF10B981); // Green
      case 'B':
      case 'B+':
        return const Color(0xFF3B82F6); // Blue
      case 'C':
      case 'C+':
        return const Color(0xFFF59E0B); // Orange
      case 'D':
        return const Color(0xFFF97316);
      case 'F':
      case 'FAIL':
        return const Color(0xFFEF4444); // Red
      default:
        return const Color(0xFF64748B);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9), // Softer background
      appBar: AppBar(
        title: Text('Progress Cards', style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold)),
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
      body: Column(
        children: [
          _buildFiltersSection(),
          Expanded(
            child: _isLoading 
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF6366F1)))
                : _errorMessage != null
                    ? Center(child: Text(_errorMessage!, style: GoogleFonts.poppins(color: Colors.red)))
                    : _resultsData.isEmpty
                        ? Center(child: Text('No progress cards found for this selection.', style: GoogleFonts.poppins(color: const Color(0xFF64748B))))
                        : _buildCardsList(),
          ),
        ],
      ),
    );
  }

  Widget _buildFiltersSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4))],
        borderRadius: const BorderRadius.only(bottomLeft: Radius.circular(20), bottomRight: Radius.circular(20)),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: _buildDropdown(
                  label: 'Select Exam',
                  value: _selectedExamId,
                  items: _examsList,
                  onChanged: (val) => setState(() => _selectedExamId = val as String?),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildDropdown(
                  label: 'Select Class',
                  value: _selectedClassId,
                  items: _classesList,
                  onChanged: (val) => setState(() => _selectedClassId = val as String?),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _isLoading ? null : _fetchResults,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF6366F1),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              icon: const Icon(Icons.picture_as_pdf, color: Colors.white, size: 20),
              label: Text('Generate Progress Cards', style: GoogleFonts.outfit(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDropdown({required String label, required String? value, required List<dynamic> items, required Function(dynamic) onChanged}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF64748B))),
        const SizedBox(height: 6),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              isExpanded: true,
              value: value,
              hint: Text('Select', style: GoogleFonts.poppins(fontSize: 13, color: const Color(0xFF94A3B8))),
              icon: const Icon(Icons.keyboard_arrow_down_rounded, color: Color(0xFF64748B)),
              onChanged: onChanged,
              items: items.map((item) {
                return DropdownMenuItem<String>(
                  value: item['id'].toString(),
                  child: Text(item['name'] ?? item['title'] ?? 'Unknown', style: GoogleFonts.poppins(fontSize: 14, color: const Color(0xFF1E293B))),
                );
              }).toList(),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildCardsList() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _resultsData.length,
      itemBuilder: (context, index) {
        final res = _resultsData[index];
        final student = res['student'] ?? {};
        final user = student['user'] ?? {};
        
        final name = user['name'] ?? 'Unknown';
        final rollNo = student['rollNo'] ?? 'N/A';
        final photoUrl = user['photoUrl'];
        final image = photoUrl?.isNotEmpty == true
            ? photoUrl
            : 'https://ui-avatars.com/api/?name=${Uri.encodeComponent(name)}&background=E2E8F0&color=1E293B';
            
        final total = res['totalMarksObtained']?.toString() ?? '0';
        final maxMarks = res['totalMaxMarks']?.toString() ?? '0';
        final percentage = res['percentage']?.toStringAsFixed(1) ?? '0.0';
        final grade = res['grade'] ?? '-';
        final rank = res['rank']?.toString() ?? '-';
        final gradeColor = _getGradeColor(grade);
        final marksArray = res['marks'] ?? [];

        return Container(
          margin: const EdgeInsets.only(bottom: 24),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [BoxShadow(color: Colors.indigo.withOpacity(0.05), blurRadius: 20, offset: const Offset(0, 10))],
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Column(
            children: [
              // Beautiful Header Section
              Container(
                padding: const EdgeInsets.all(20),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFF1E293B), Color(0xFF334155)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.only(topLeft: Radius.circular(20), topRight: Radius.circular(20)),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(3),
                      decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
                      child: CircleAvatar(
                        radius: 35,
                        backgroundColor: const Color(0xFFE2E8F0),
                        backgroundImage: NetworkImage(image),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(name, style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white)),
                          const SizedBox(height: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(8)),
                            child: Text('Roll No: $rollNo', style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.white)),
                          ),
                        ],
                      ),
                    ),
                    // Rank Badge
                    if (rank != '-')
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF59E0B).withOpacity(0.15),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFF59E0B)),
                        ),
                        child: Column(
                          children: [
                            Text('RANK', style: GoogleFonts.poppins(fontSize: 9, fontWeight: FontWeight.bold, color: const Color(0xFFFCD34D), letterSpacing: 1)),
                            Text('#$rank', style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.bold, color: const Color(0xFFFBBF24))),
                          ],
                        ),
                      ),
                  ],
                ),
              ),

              // Subject-wise Detailed Marks Table
              if (marksArray.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.analytics_outlined, color: Color(0xFF6366F1), size: 18),
                          const SizedBox(width: 8),
                          Text('SUBJECT-WISE BREAKDOWN', style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.bold, color: const Color(0xFF6366F1), letterSpacing: 1)),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Container(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: Table(
                            columnWidths: const {
                              0: FlexColumnWidth(2.5),
                              1: FlexColumnWidth(1),
                              2: FlexColumnWidth(1),
                              3: FlexColumnWidth(1),
                            },
                            children: [
                              TableRow(
                                decoration: const BoxDecoration(color: Color(0xFFF8FAFC)),
                                children: [
                                  _buildTableHeader('SUBJECT'),
                                  _buildTableHeader('MAX', align: Alignment.center),
                                  _buildTableHeader('OBT', align: Alignment.center),
                                  _buildTableHeader('GRADE', align: Alignment.center),
                                ],
                              ),
                              ...marksArray.map<TableRow>((m) {
                                final subj = m['subject']?['name'] ?? m['subject'] ?? 'Unknown';
                                final max = m['maxMarks']?.toString() ?? '100';
                                final obt = m['marksObtained']?.toString() ?? m['obtained']?.toString() ?? '0';
                                final g = m['grade'] ?? '-';
                                final gColor = _getGradeColor(g);

                                return TableRow(
                                  decoration: const BoxDecoration(
                                    border: Border(top: BorderSide(color: Color(0xFFF1F5F9))),
                                  ),
                                  children: [
                                    Padding(
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                                      child: Text(subj, style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF334155))),
                                    ),
                                    Padding(
                                      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 12),
                                      child: Text(max, textAlign: TextAlign.center, style: GoogleFonts.poppins(fontSize: 13, color: const Color(0xFF64748B))),
                                    ),
                                    Padding(
                                      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 12),
                                      child: Text(obt, textAlign: TextAlign.center, style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
                                    ),
                                    Padding(
                                      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 10),
                                      child: Center(
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                          decoration: BoxDecoration(color: gColor.withOpacity(0.1), borderRadius: BorderRadius.circular(6)),
                                          child: Text(g, style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.bold, color: gColor)),
                                        ),
                                      ),
                                    ),
                                  ],
                                );
                              }).toList(),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

              const Divider(height: 1, thickness: 1, color: Color(0xFFF1F5F9)),
              
              // Overall Stats section
              Padding(
                padding: const EdgeInsets.all(20),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _buildStatItem('Total Score', '$total / $maxMarks', Icons.military_tech_rounded, const Color(0xFF8B5CF6)),
                    Container(height: 40, width: 1, color: const Color(0xFFE2E8F0)),
                    _buildStatItem('Percentage', '$percentage%', Icons.pie_chart_rounded, const Color(0xFF10B981)),
                    Container(height: 40, width: 1, color: const Color(0xFFE2E8F0)),
                    Column(
                      children: [
                        Text('Overall Grade', style: GoogleFonts.poppins(fontSize: 11, color: const Color(0xFF64748B))),
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                          decoration: BoxDecoration(color: gradeColor.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                          child: Text(grade, style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: gradeColor)),
                        ),
                      ],
                    )
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildTableHeader(String text, {Alignment align = Alignment.centerLeft}) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      child: Align(
        alignment: align,
        child: Text(
          text,
          style: GoogleFonts.poppins(
            color: const Color(0xFF64748B),
            fontSize: 11,
            fontWeight: FontWeight.bold,
            letterSpacing: 0.5,
          ),
        ),
      ),
    );
  }

  Widget _buildStatItem(String label, String value, IconData icon, Color color) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
          child: Icon(icon, color: color, size: 22),
        ),
        const SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: GoogleFonts.poppins(fontSize: 11, color: const Color(0xFF64748B))),
            Text(value, style: GoogleFonts.outfit(fontSize: 17, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
          ],
        ),
      ],
    );
  }
}
