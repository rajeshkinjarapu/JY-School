import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class ClassesScreen extends StatefulWidget {
  const ClassesScreen({super.key});

  @override
  State<ClassesScreen> createState() => _ClassesScreenState();
}

class _ClassesScreenState extends State<ClassesScreen> {
  List<dynamic> _classes = [];
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
    _fetchClasses();
  }

  Future<void> _fetchClasses() async {
    final result = await ApiService.getClasses(limit: 100);
    if (mounted) {
      if (result['success']) {
        setState(() {
          _classes = result['data'] ?? [];
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = result['message'] ?? 'Failed to load classes';
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
          'Classes',
          style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        backgroundColor: const Color(0xFF6366F1),
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
              : _classes.isEmpty
                  ? const Center(child: Text("No classes found"))
                  : GridView.builder(
                      padding: const EdgeInsets.all(16),
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        crossAxisSpacing: 16,
                        mainAxisSpacing: 16,
                        childAspectRatio: 0.85,
                      ),
                      itemCount: _classes.length,
                      itemBuilder: (context, index) {
                        return _buildClassCard(_classes[index], index);
                      },
                    ),
    );
  }

  Widget _buildClassCard(dynamic classData, int index) {
    final name = classData['name'] ?? 'Class';
    final section = classData['section'] ?? '';
    final capacity = classData['capacity'] ?? 0;
    final counts = classData['_count'] ?? {};
    final studentsCount = counts['students'] ?? 0;
    
    final teacherData = classData['classTeacher'] ?? {};
    final user = teacherData['user'] ?? {};
    final teacherName = user['name'] ?? 'Not Assigned';
    
    final color = _cardColors[index % _cardColors.length];

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.15),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header Part with Color
          Container(
            padding: const EdgeInsets.symmetric(vertical: 16),
            decoration: BoxDecoration(
              color: color,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            ),
            child: Column(
              children: [
                Text(
                  name,
                  style: GoogleFonts.outfit(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                if (section.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      'Sec: $section',
                      style: GoogleFonts.poppins(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ]
              ],
            ),
          ),
          // Info Part
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _buildMiniStat(Icons.groups_outlined, '$studentsCount', 'Students', color),
                      _buildMiniStat(Icons.chair_alt_outlined, '$capacity', 'Capacity', Colors.grey.shade600),
                    ],
                  ),
                  const Divider(color: Color(0xFFE2E8F0)),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.person_outline, size: 16, color: Color(0xFF64748B)),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          teacherName,
                          style: GoogleFonts.poppins(
                            color: const Color(0xFF1E293B),
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
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

  Widget _buildMiniStat(IconData icon, String value, String label, Color color) {
    return Column(
      children: [
        Row(
          children: [
            Icon(icon, size: 14, color: color),
            const SizedBox(width: 4),
            Text(
              value,
              style: GoogleFonts.outfit(
                color: const Color(0xFF1E293B),
                fontSize: 14,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        Text(
          label,
          style: GoogleFonts.poppins(
            color: const Color(0xFF64748B),
            fontSize: 10,
          ),
        ),
      ],
    );
  }
}
