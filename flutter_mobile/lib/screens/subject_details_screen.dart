import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'assign_subject_teacher_screen.dart';

class SubjectDetailsScreen extends StatefulWidget {
  final String subjectName;
  final List<dynamic> subjectInstances;
  final List<dynamic> allTeachers;

  const SubjectDetailsScreen({
    super.key,
    required this.subjectName,
    required this.subjectInstances,
    required this.allTeachers,
  });

  @override
  State<SubjectDetailsScreen> createState() => _SubjectDetailsScreenState();
}

class _SubjectDetailsScreenState extends State<SubjectDetailsScreen> {
  late List<dynamic> _instances;

  @override
  void initState() {
    super.initState();
    _instances = List.from(widget.subjectInstances);
  }

  void _onAssignTeacher(dynamic instance) async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => AssignSubjectTeacherScreen(
          subjectInstance: instance,
          teachers: widget.allTeachers,
        ),
      ),
    );

    if (result == true) {
      // Typically we'd fetch data again from API, but for simplicity here we can just pop back
      // or the user can refresh the main screen. 
      // A better way is to pop true to signal a refresh is needed.
      if (mounted) {
        Navigator.pop(context, true);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 200,
            pinned: true,
            iconTheme: const IconThemeData(color: Colors.white),
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFF6366F1), Color(0xFF4338CA)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: SafeArea(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(color: Colors.white.withOpacity(0.15), shape: BoxShape.circle),
                        child: const Icon(Icons.book_rounded, color: Colors.white, size: 40),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        widget.subjectName,
                        style: GoogleFonts.outfit(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold),
                      ),
                      Text(
                        '${_instances.length} Classes',
                        style: GoogleFonts.poppins(color: Colors.indigo.shade100, fontSize: 14),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.all(16),
            sliver: SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  final instance = _instances[index];
                  final classObj = instance['class'] ?? {};
                  final className = '${classObj['name'] ?? ''} ${classObj['section'] ?? ''}'.trim();
                  
                  final classSubjectTeachers = instance['classSubjectTeachers'] as List<dynamic>? ?? [];
                  final teacher = classSubjectTeachers.isNotEmpty ? classSubjectTeachers.first['teacher'] : null;
                  final teacherName = teacher != null ? (teacher['user']?['name'] ?? 'Unknown Teacher') : 'Unassigned';

                  return Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 8, offset: const Offset(0, 2))],
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(color: const Color(0xFFEEF2FF), borderRadius: BorderRadius.circular(12)),
                          child: const Center(child: Icon(Icons.class_rounded, color: Color(0xFF6366F1))),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(className.isEmpty ? 'Global Subject' : className, style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  Icon(Icons.person_rounded, size: 14, color: teacher != null ? const Color(0xFF10B981) : const Color(0xFFEF4444)),
                                  const SizedBox(width: 4),
                                  Text(
                                    teacherName,
                                    style: GoogleFonts.poppins(fontSize: 13, color: teacher != null ? const Color(0xFF10B981) : const Color(0xFFEF4444), fontWeight: FontWeight.w600),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        if (teacher == null)
                          ElevatedButton(
                            onPressed: () => _onAssignTeacher(instance),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF0F172A),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            ),
                            child: Text('Assign', style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white)),
                          )
                      ],
                    ),
                  );
                },
                childCount: _instances.length,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
