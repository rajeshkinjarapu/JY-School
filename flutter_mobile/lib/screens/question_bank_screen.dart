import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../widgets/app_drawer.dart';
import 'question_papers_screen.dart';

class QuestionBankScreen extends StatelessWidget {
  const QuestionBankScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final modules = [
      _QBModule(
        title: 'Question Papers',
        subtitle: 'Browse & generate exam question papers',
        icon: Icons.article_rounded,
        colors: [const Color(0xFF6366F1), const Color(0xFF4F46E5)],
        badge: 'Active',
        badgeColor: const Color(0xFF10B981),
        onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const QuestionPapersScreen())),
      ),
      _QBModule(
        title: 'MCQ Paper Generator',
        subtitle: 'Create multiple choice question papers',
        icon: Icons.quiz_rounded,
        colors: [const Color(0xFF8B5CF6), const Color(0xFFEC4899)],
        badge: 'Soon',
        badgeColor: const Color(0xFF8B5CF6),
        onTap: () => _showComingSoon(context),
      ),
      _QBModule(
        title: 'Navodaya Paper Generator',
        subtitle: 'Specialised Navodaya exam papers',
        icon: Icons.auto_stories_rounded,
        colors: [const Color(0xFF0EA5E9), const Color(0xFF06B6D4)],
        badge: 'Soon',
        badgeColor: const Color(0xFF0EA5E9),
        onTap: () => _showComingSoon(context),
      ),
      _QBModule(
        title: 'Saved Papers',
        subtitle: 'View and manage your saved papers',
        icon: Icons.bookmark_rounded,
        colors: [const Color(0xFFF59E0B), const Color(0xFFEF4444)],
        badge: 'Soon',
        badgeColor: const Color(0xFFF59E0B),
        onTap: () => _showComingSoon(context),
      ),
      _QBModule(
        title: 'Answer Keys',
        subtitle: 'View answer keys for exam papers',
        icon: Icons.key_rounded,
        colors: [const Color(0xFF10B981), const Color(0xFF059669)],
        badge: 'Soon',
        badgeColor: const Color(0xFF10B981),
        onTap: () => _showComingSoon(context),
      ),
    ];

    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      drawer: const AppDrawer(currentRoute: 'question_bank'),
      appBar: AppBar(
        title: Text('Question Bank', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 20, color: Colors.white)),
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
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Header banner
          Container(
            margin: const EdgeInsets.only(bottom: 20),
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF4338CA), Color(0xFF6366F1), Color(0xFF8B5CF6)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(24),
              boxShadow: [BoxShadow(color: const Color(0xFF6366F1).withOpacity(0.35), blurRadius: 20, offset: const Offset(0, 8))],
            ),
            child: Row(children: [
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(16)),
                child: const Icon(Icons.library_books_rounded, color: Colors.white, size: 30),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('Question Bank', style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 20)),
                  Text('Create, manage & generate exam papers', style: GoogleFonts.poppins(color: Colors.white.withOpacity(0.8), fontSize: 12)),
                ]),
              ),
            ]),
          ),

          // Modules list
          ...modules.map((m) => _buildModuleCard(context, m)),
        ],
      ),
    );
  }

  Widget _buildModuleCard(BuildContext context, _QBModule module) {
    return GestureDetector(
      onTap: module.onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 12, offset: const Offset(0, 4))],
        ),
        child: Row(children: [
          // Left gradient accent
          Container(
            width: 6,
            height: 80,
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: module.colors, begin: Alignment.topCenter, end: Alignment.bottomCenter),
              borderRadius: const BorderRadius.only(topLeft: Radius.circular(20), bottomLeft: Radius.circular(20)),
            ),
          ),
          const SizedBox(width: 16),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: module.colors),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(module.icon, color: Colors.white, size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(module.title, style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 15, color: const Color(0xFF1E293B))),
              Text(module.subtitle, style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF94A3B8), fontWeight: FontWeight.w500)),
            ]),
          ),
          const SizedBox(width: 8),
          Container(
            margin: const EdgeInsets.only(right: 16),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(color: module.badgeColor.withOpacity(0.12), borderRadius: BorderRadius.circular(8)),
            child: Text(module.badge, style: GoogleFonts.poppins(color: module.badgeColor, fontSize: 10, fontWeight: FontWeight.bold)),
          ),
        ]),
      ),
    );
  }

  static void _showComingSoon(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Row(children: [
        const Icon(Icons.construction_rounded, color: Colors.white, size: 18),
        const SizedBox(width: 10),
        Text('Coming soon!', style: GoogleFonts.poppins(color: Colors.white, fontWeight: FontWeight.w600)),
      ]),
      backgroundColor: const Color(0xFF6366F1),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    ));
  }
}

class _QBModule {
  final String title, subtitle, badge;
  final IconData icon;
  final List<Color> colors;
  final Color badgeColor;
  final VoidCallback onTap;
  const _QBModule({required this.title, required this.subtitle, required this.icon, required this.colors, required this.badge, required this.badgeColor, required this.onTap});
}
