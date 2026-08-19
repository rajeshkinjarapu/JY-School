import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../widgets/app_drawer.dart';
import 'class_details_screen.dart';

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
    final result = await ApiService.getClasses();
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
      backgroundColor: const Color(0xFFF8FAFC),
      drawer: const AppDrawer(currentRoute: 'classes'),
      appBar: AppBar(
        title: const Text('Classes & Sections', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        backgroundColor: const Color(0xFF0F172A), // Slate 900
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: Column(
        children: [
          // Gradient Hero Header
          Container(
            width: double.infinity,
            padding: const EdgeInsets.only(left: 20, right: 20, top: 10, bottom: 30),
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(0xFF0F172A), Color(0xFF1E293B), Color(0xFF334155)], // Slate gradient
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 8, offset: Offset(0, 4))],
              borderRadius: BorderRadius.only(bottomLeft: Radius.circular(32), bottomRight: Radius.circular(32)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Total Active Classes', style: TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w600, letterSpacing: 1.2)),
                const SizedBox(height: 8),
                Text(
                  '${_classes.length}',
                  style: const TextStyle(color: Colors.white, fontSize: 36, fontWeight: FontWeight.w900),
                ),
              ],
            ),
          ),

          // Grid View
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _errorMessage.isNotEmpty
                    ? Center(child: Text(_errorMessage, style: GoogleFonts.poppins(color: Colors.red)))
                    : _classes.isEmpty
                        ? Center(child: Text('No classes found.', style: GoogleFonts.poppins(color: const Color(0xFF64748B))))
                        : RefreshIndicator(
                            onRefresh: _fetchClasses,
                            child: GridView.builder(
                              padding: const EdgeInsets.only(left: 20, right: 20, top: 20, bottom: 40),
                              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: 2,
                                childAspectRatio: 0.95,
                                crossAxisSpacing: 16,
                                mainAxisSpacing: 16,
                              ),
                              itemCount: _classes.length,
                              itemBuilder: (context, index) {
                                final cls = _classes[index];
                                final String name = cls['className'] ?? 'Unknown';
                                final String section = cls['section'] ?? '';
                                final String teacherName = cls['classTeacher']?['user']?['name'] ?? 'Not Assigned';
                                final Color cardColor = _cardColors[index % _cardColors.length];

                                return Container(
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(24),
                                    boxShadow: [
                                      BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 4)),
                                    ],
                                  ),
                                  child: Material(
                                    color: Colors.transparent,
                                    child: InkWell(
                                      borderRadius: BorderRadius.circular(24),
                                      onTap: () {
                                        Navigator.push(context, MaterialPageRoute(builder: (context) => ClassDetailsScreen(classData: cls)));
                                      },
                                      child: Padding(
                                        padding: const EdgeInsets.all(16.0),
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            // Icon Container
                                            Container(
                                              padding: const EdgeInsets.all(10),
                                              decoration: BoxDecoration(
                                                color: cardColor.withOpacity(0.15),
                                                borderRadius: BorderRadius.circular(16),
                                              ),
                                              child: Icon(Icons.class_rounded, color: cardColor, size: 24),
                                            ),
                                            const Spacer(),
                                            // Title
                                            Text(
                                              name,
                                              style: GoogleFonts.poppins(color: const Color(0xFF1E293B), fontSize: 18, fontWeight: FontWeight.bold),
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                            if (section.isNotEmpty)
                                              Text(
                                                'Sec: $section',
                                                style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 13, fontWeight: FontWeight.w600),
                                              ),
                                            const SizedBox(height: 8),
                                            // Teacher
                                            Row(
                                              children: [
                                                const Icon(Icons.person_rounded, size: 12, color: Color(0xFF94A3B8)),
                                                const SizedBox(width: 4),
                                                Expanded(
                                                  child: Text(
                                                    teacherName,
                                                    style: GoogleFonts.poppins(color: const Color(0xFF94A3B8), fontSize: 11),
                                                    maxLines: 1,
                                                    overflow: TextOverflow.ellipsis,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
          ),
        ],
      ),
    );
  }
}
