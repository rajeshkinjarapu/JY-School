import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'student_admit_card_screen.dart';
import 'student_question_papers_screen.dart';
import 'student_results_screen.dart';
import 'student_progress_card_screen.dart';

class StudentExamsDashboardScreen extends StatelessWidget {
  final Map<String, dynamic> user;

  const StudentExamsDashboardScreen({super.key, required this.user});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Exams & Results', style: GoogleFonts.outfit(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
            Text('Academic Performance', style: GoogleFonts.poppins(color: Colors.white70, fontSize: 12)),
          ],
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
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('My Examination Hub', style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
            const SizedBox(height: 8),
            Text('Access your admit cards, question papers, and performance reports.', style: GoogleFonts.poppins(fontSize: 14, color: const Color(0xFF64748B))),
            const SizedBox(height: 24),
            
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
              childAspectRatio: 0.9,
              children: [
                _buildModuleCard(
                  context: context,
                  title: 'Admit Card',
                  subtitle: 'Hall Tickets',
                  icon: Icons.confirmation_number_rounded,
                  colors: [const Color(0xFF4F46E5), const Color(0xFF6366F1)],
                  onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => StudentAdmitCardScreen(user: user))),
                ),
                _buildModuleCard(
                  context: context,
                  title: 'Question Papers',
                  subtitle: 'Study Material',
                  icon: Icons.assignment_rounded,
                  colors: [const Color(0xFF059669), const Color(0xFF10B981)],
                  onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => StudentQuestionPapersScreen(user: user))),
                ),
                _buildModuleCard(
                  context: context,
                  title: 'Results',
                  subtitle: 'Notice Board',
                  icon: Icons.emoji_events_rounded,
                  colors: [const Color(0xFFD97706), const Color(0xFFF59E0B)],
                  onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => StudentResultsScreen(user: user))),
                ),
                _buildModuleCard(
                  context: context,
                  title: 'Progress Card',
                  subtitle: 'Report Cards',
                  icon: Icons.insert_chart_rounded,
                  colors: [const Color(0xFFDB2777), const Color(0xFFEC4899)],
                  onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => StudentProgressCardScreen(user: user))),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildModuleCard({
    required BuildContext context,
    required String title,
    required String subtitle,
    required IconData icon,
    required List<Color> colors,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          gradient: LinearGradient(colors: colors, begin: Alignment.topLeft, end: Alignment.bottomRight),
          boxShadow: [
            BoxShadow(color: colors.first.withOpacity(0.4), blurRadius: 15, offset: const Offset(0, 8)),
          ],
        ),
        child: Stack(
          children: [
            Positioned(
              right: -10,
              top: -10,
              child: Icon(icon, size: 100, color: Colors.white.withOpacity(0.15)),
            ),
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(14)),
                    child: Icon(icon, color: Colors.white, size: 28),
                  ),
                  const Spacer(),
                  Text(title, style: GoogleFonts.outfit(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text(subtitle, style: GoogleFonts.poppins(color: Colors.white.withOpacity(0.8), fontSize: 12)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
