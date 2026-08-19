import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class SubjectsScreen extends StatefulWidget {
  const SubjectsScreen({super.key});

  @override
  State<SubjectsScreen> createState() => _SubjectsScreenState();
}

class _SubjectsScreenState extends State<SubjectsScreen> {
  List<dynamic> _subjects = [];
  bool _isLoading = true;
  String _errorMessage = '';

  final List<Color> _cardColors = [
    const Color(0xFF8B5CF6), // Purple
    const Color(0xFF10B981), // Emerald
    const Color(0xFFF59E0B), // Amber
    const Color(0xFFEF4444), // Red
    const Color(0xFF3B82F6), // Blue
    const Color(0xFFEC4899), // Pink
  ];

  @override
  void initState() {
    super.initState();
    _fetchSubjects();
  }

  Future<void> _fetchSubjects() async {
    final result = await ApiService.getSubjects();
    if (mounted) {
      if (result['success']) {
        setState(() {
          _subjects = result['data'] ?? [];
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = result['message'] ?? 'Failed to load subjects';
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F7FE),
      appBar: AppBar(
        title: Text(
          'Subjects',
          style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold),
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
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF6366F1)))
          : _errorMessage.isNotEmpty
              ? Center(child: Text(_errorMessage, style: const TextStyle(color: Colors.red)))
              : _subjects.isEmpty
                  ? const Center(child: Text("No subjects found"))
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _subjects.length,
                      itemBuilder: (context, index) {
                        return _buildSubjectCard(_subjects[index], index);
                      },
                    ),
    );
  }

  Widget _buildSubjectCard(dynamic subjectData, int index) {
    final name = subjectData['name'] ?? 'Unknown Subject';
    final code = subjectData['code'] ?? 'N/A';
    
    final classInfo = subjectData['class'] ?? {};
    final className = '${classInfo['name'] ?? ''} ${classInfo['section'] ?? ''}'.trim();
    
    final teachersList = subjectData['classSubjectTeachers'] as List? ?? [];
    String teacherName = 'Not Assigned';
    if (teachersList.isNotEmpty) {
      final teacher = teachersList[0]['teacher']?['user']?['name'];
      if (teacher != null) teacherName = teacher;
    }

    final color = _cardColors[index % _cardColors.length];

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          // Left Color Bar
          Container(
            width: 12,
            height: 100,
            decoration: BoxDecoration(
              color: color,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(16),
                bottomLeft: Radius.circular(16),
              ),
            ),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          name,
                          style: GoogleFonts.outfit(
                            color: const Color(0xFF1E293B),
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: color.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: color.withOpacity(0.2)),
                        ),
                        child: Text(
                          code,
                          style: GoogleFonts.poppins(
                            color: color,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Icon(Icons.class_outlined, size: 16, color: Colors.grey.shade600),
                      const SizedBox(width: 6),
                      Text(
                        className.isEmpty ? 'All Classes' : className,
                        style: GoogleFonts.poppins(
                          color: Colors.grey.shade700,
                          fontSize: 13,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Icon(Icons.person_outline, size: 16, color: Colors.grey.shade600),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          teacherName,
                          style: GoogleFonts.poppins(
                            color: Colors.grey.shade700,
                            fontSize: 13,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  )
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}


