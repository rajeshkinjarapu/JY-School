import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class ResultsScreen extends StatefulWidget {
  const ResultsScreen({super.key});

  @override
  State<ResultsScreen> createState() => _ResultsScreenState();
}

class _ResultsScreenState extends State<ResultsScreen> {
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
    if (_selectedExamId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select an Exam')));
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final result = await ApiService.getExamResults(_selectedExamId!, classId: _selectedClassId ?? '');
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
        return const Color(0xFF10B981);
      case 'B':
      case 'B+':
        return const Color(0xFF3B82F6);
      case 'C':
      case 'C+':
        return const Color(0xFFF59E0B);
      case 'D':
        return const Color(0xFFF97316);
      case 'F':
      case 'FAIL':
        return const Color(0xFFEF4444);
      default:
        return const Color(0xFF64748B);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text('Exam Results', style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold)),
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
                        ? Center(child: Text('No results found for this selection.', style: GoogleFonts.poppins(color: const Color(0xFF64748B))))
                        : _buildResultsTable(),
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
            child: ElevatedButton(
              onPressed: _isLoading ? null : _fetchResults,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF6366F1),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: Text('Fetch Results', style: GoogleFonts.outfit(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
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
            color: const Color(0xFFF1F5F9),
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

  Widget _buildResultsTable() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [BoxShadow(color: const Color(0xFF6366F1).withOpacity(0.08), blurRadius: 15, offset: const Offset(0, 5))],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: DataTable(
              headingRowColor: WidgetStateProperty.all(const Color(0xFFF8FAFC)),
              columns: [
                DataColumn(label: Text('Roll No', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, color: const Color(0xFF475569)))),
                DataColumn(label: Text('Student', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, color: const Color(0xFF475569)))),
                DataColumn(label: Text('Total', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, color: const Color(0xFF475569)))),
                DataColumn(label: Text('%', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, color: const Color(0xFF475569)))),
                DataColumn(label: Text('Grade', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, color: const Color(0xFF475569)))),
              ],
              rows: _resultsData.map((res) {
                final student = res['student'] ?? {};
                final user = student['user'] ?? {};
                final rollNo = student['rollNo'] ?? 'N/A';
                final name = user['name'] ?? 'Unknown';
                final total = res['totalMarksObtained']?.toString() ?? '0';
                final percentage = res['percentage']?.toStringAsFixed(1) ?? '0.0';
                final grade = res['grade'] ?? '-';
                
                return DataRow(cells: [
                  DataCell(Text(rollNo, style: GoogleFonts.poppins(fontWeight: FontWeight.w600, color: const Color(0xFF64748B)))),
                  DataCell(Text(name, style: GoogleFonts.poppins(color: const Color(0xFF1E293B)))),
                  DataCell(Text(total, style: GoogleFonts.poppins(fontWeight: FontWeight.w600, color: const Color(0xFF1E293B)))),
                  DataCell(Text('$percentage%', style: GoogleFonts.poppins(color: const Color(0xFF1E293B)))),
                  DataCell(
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: _getGradeColor(grade).withOpacity(0.15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(grade, style: GoogleFonts.poppins(fontWeight: FontWeight.bold, color: _getGradeColor(grade))),
                    ),
                  ),
                ]);
              }).toList(),
            ),
          ),
        ),
      ),
    );
  }
}
