import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class ResultsScreen extends StatefulWidget {
  const ResultsScreen({super.key});

  @override
  State<ResultsScreen> createState() => _ResultsScreenState();
}

class _ResultsScreenState extends State<ResultsScreen> {
  bool _isLoadingDropdowns = true;
  bool _isLoading = false;
  String? _errorMessage;

  List<dynamic> _examsList = [];
  List<dynamic> _classesList = [];
  List<dynamic> _resultsData = [];

  String? _selectedExamId;
  String? _selectedClassId;
  Map<String, dynamic>? _selectedExamData;

  @override
  void initState() {
    super.initState();
    _fetchDropdownData();
  }

  Future<void> _fetchDropdownData() async {
    setState(() => _isLoadingDropdowns = true);
    try {
      final examsRes = await ApiService.getExams();
      final classesRes = await ApiService.getClasses();

      if (mounted) {
        setState(() {
          _examsList = examsRes['success'] ? examsRes['data'] ?? [] : [];
          _classesList = classesRes['success'] ? classesRes['data'] ?? [] : [];
          _isLoadingDropdowns = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Failed to load options: $e';
          _isLoadingDropdowns = false;
        });
      }
    }
  }
  
  void _onExamSelected(String? examId) {
    if (examId == null) return;
    
    // Check if exam exists in list
    if (!_examsList.any((e) => e['id']?.toString() == examId)) {
      _selectedExamId = null;
      _selectedExamData = null;
      return;
    }

    _selectedExamId = examId;
    _selectedExamData = _examsList.firstWhere((e) => e['id']?.toString() == examId);
    
    // Validate selected class against new exam
    if (_selectedClassId != null) {
      final examClasses = _selectedExamData!['classes'] as List?;
      if (examClasses == null || !examClasses.any((c) => c['id'].toString() == _selectedClassId)) {
        _selectedClassId = null;
        _resultsData = [];
      }
    }
  }

  Future<void> _fetchResults() async {
    if (_selectedExamId == null || _selectedClassId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select an Exam and Class'), backgroundColor: Colors.red));
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
        title: Text('Exam Results', style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 20)),
        iconTheme: const IconThemeData(color: Colors.white),
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF6366F1), Color(0xFF4F46E5), Color(0xFF4338CA)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
        elevation: 0,
      ),
      body: _isLoadingDropdowns 
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF6366F1))) 
          : Column(
              children: [
                _buildFiltersSection(),
                Expanded(
                  child: _isLoading 
                      ? const Center(child: CircularProgressIndicator(color: Color(0xFF6366F1)))
                      : _errorMessage != null
                          ? Center(child: Text(_errorMessage!, style: GoogleFonts.poppins(color: Colors.red)))
                          : _resultsData.isEmpty
                              ? Center(
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(Icons.query_stats_rounded, size: 64, color: const Color(0xFFCBD5E1).withOpacity(0.5)),
                                      const SizedBox(height: 16),
                                      Text('Select filters to fetch results.', style: GoogleFonts.poppins(color: const Color(0xFF94A3B8), fontSize: 15)),
                                    ],
                                  ),
                                )
                              : _buildResultsTable(),
                ),
              ],
            ),
    );
  }

  Widget _buildFiltersSection() {
    List<dynamic> filteredClasses = [];
    
    if (_selectedExamData != null) {
      if (_selectedExamData!['classes'] != null) {
        final examClassIds = (_selectedExamData!['classes'] as List).map((c) => c['id'].toString()).toSet();
        filteredClasses = _classesList.where((c) => examClassIds.contains(c['id'].toString())).toList();
      }
    }

    return Container(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: const BorderRadius.only(bottomLeft: Radius.circular(30), bottomRight: Radius.circular(30)),
        boxShadow: [
          BoxShadow(color: const Color(0xFF6366F1).withOpacity(0.08), blurRadius: 20, offset: const Offset(0, 8))
        ],
      ),
      child: Column(
        children: [
          Column(
            children: [
              _buildDropdown(
                label: 'Select Exam',
                value: _selectedExamId,
                items: _examsList,
                onChanged: (val) {
                  setState(() { _onExamSelected(val); });
                },
              ),
              const SizedBox(height: 12),
              _buildDropdown(
                label: _selectedExamId == null ? 'Exam First' : 'Select Class',
                value: _selectedClassId,
                items: filteredClasses,
                onChanged: _selectedExamId == null ? (val){} : (val) => setState(() => _selectedClassId = val as String?),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton.icon(
              onPressed: _isLoading ? null : _fetchResults,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF6366F1),
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              icon: const Icon(Icons.search_rounded, color: Colors.white, size: 20),
              label: Text('Fetch Results', style: GoogleFonts.outfit(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
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
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: value != null ? const Color(0xFF6366F1).withOpacity(0.5) : const Color(0xFFE2E8F0)),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              isExpanded: true,
              value: value,
              hint: Text('Select', style: GoogleFonts.poppins(fontSize: 13, color: const Color(0xFF94A3B8))),
              icon: const Icon(Icons.keyboard_arrow_down_rounded, color: Color(0xFF64748B)),
              onChanged: items.isEmpty ? null : onChanged,
              items: items.map((item) {
                String name = item['name'] ?? item['title'] ?? item['className'] ?? 'Unknown';
                if (item['section'] != null && item['section'].toString().trim().isNotEmpty) {
                  name += ' - ${item['section']}';
                }
                return DropdownMenuItem<String>(
                  value: item['id'].toString(),
                  child: Text(
                    name, 
                    style: GoogleFonts.poppins(
                      fontSize: 13, 
                      color: value == item['id']?.toString() ? const Color(0xFF6366F1) : const Color(0xFF1E293B),
                      fontWeight: value == item['id']?.toString() ? FontWeight.bold : FontWeight.normal,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                );
              }).toList(),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildResultsTable() {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      itemCount: _resultsData.length,
      itemBuilder: (context, index) {
        final res = _resultsData[index];
        final student = res['student'] ?? {};
        final user = student['user'] ?? {};
        final rollNo = student['rollNo'] ?? 'N/A';
        
        String name = (user['name'] ?? '').toString().trim();
        if (name.isEmpty) {
           name = '${student['firstName'] ?? ''} ${student['lastName'] ?? ''}'.trim();
        }
        if (name.isEmpty) {
           name = 'Unknown Student';
        }
        
        final photoUrl = user['photoUrl'];
        final initials = name != 'Unknown Student' ? name.substring(0, 1).toUpperCase() : '?';

        final total = res['totalMarksObtained']?.toString() ?? '0';
        final percentage = res['percentage'] != null ? (res['percentage'] as num).toStringAsFixed(1) : '0.0';
        final grade = res['grade'] ?? '-';
        
        final gradeColor = _getGradeColor(grade);

        // Avatar gradients
        final List<List<Color>> avatarGradients = [
          [const Color(0xFF2DD4BF), const Color(0xFF10B981)], // Teal
          [const Color(0xFFFB7185), const Color(0xFFE11D48)], // Rose
          [const Color(0xFFFBBF24), const Color(0xFFF97316)], // Amber
          [const Color(0xFF22D3EE), const Color(0xFF3B82F6)], // Sky
          [const Color(0xFFA78BFA), const Color(0xFF7C3AED)], // Purple
          [const Color(0xFFF472B6), const Color(0xFFDB2777)], // Pink
        ];
        final colorIdx = name.isNotEmpty ? name.codeUnitAt(0) % avatarGradients.length : 0;
        final gradientColors = avatarGradients[colorIdx];
        final baseColor = gradientColors[0];

        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(color: baseColor.withOpacity(0.08), blurRadius: 15, offset: const Offset(0, 5)),
            ],
            border: Border.all(color: baseColor.withOpacity(0.1), width: 1.5),
          ),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                // Avatar
                Container(
                  width: 46,
                  height: 46,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(colors: gradientColors, begin: Alignment.topLeft, end: Alignment.bottomRight),
                    shape: BoxShape.circle,
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(23),
                    child: (photoUrl != null && photoUrl.toString().isNotEmpty)
                        ? Image.network(
                            ApiService.getImageUrl(photoUrl.toString()),
                            fit: BoxFit.cover,
                            headers: const {'ngrok-skip-browser-warning': '69420'},
                            errorBuilder: (c, e, s) => Center(child: Text(initials, style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18))),
                          )
                        : Center(child: Text(initials, style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18))),
                  ),
                ),
                const SizedBox(width: 12),
                
                // Name & Roll No
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        name,
                        style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B)),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Roll No: $rollNo',
                        style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF64748B), fontWeight: FontWeight.w500),
                      ),
                    ],
                  ),
                ),
                
                // Marks and Grade
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      'Total: $total | $percentage%',
                      style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF475569)),
                    ),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: gradeColor.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        'Grade $grade',
                        style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 12, color: gradeColor),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
