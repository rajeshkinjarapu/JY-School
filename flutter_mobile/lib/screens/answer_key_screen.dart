import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../widgets/app_drawer.dart';

class AnswerKeyScreen extends StatelessWidget {
  const AnswerKeyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      drawer: const AppDrawer(currentRoute: 'answer_key'),
      appBar: AppBar(
        title: Text('Answer Keys', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 20, color: Colors.white)),
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
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(28),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF6366F1), Color(0xFF4F46E5)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                shape: BoxShape.circle,
                boxShadow: [BoxShadow(color: const Color(0xFF6366F1).withOpacity(0.35), blurRadius: 20, offset: const Offset(0, 8))],
              ),
              child: const Icon(Icons.key_rounded, color: Colors.white, size: 48),
            ),
            const SizedBox(height: 24),
            Text('Answer Keys', style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
            const SizedBox(height: 8),
            Text(
              'Answer key management will be available\nafter question papers are linked.',
              textAlign: TextAlign.center,
              style: GoogleFonts.poppins(fontSize: 13, color: const Color(0xFF94A3B8), fontWeight: FontWeight.w500),
            ),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0xFF6366F1).withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text('Coming Soon', style: GoogleFonts.poppins(color: const Color(0xFF6366F1), fontWeight: FontWeight.bold, letterSpacing: 0.5)),
            ),
          ],
        ),
      ),
    );
  }
}
