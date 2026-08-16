import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class SubjectsScreen extends StatelessWidget {
  const SubjectsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Subjects', style: GoogleFonts.outfit()),
        backgroundColor: const Color(0xFF6366F1),
      ),
      body: const Center(
        child: Text('Subjects module coming soon...'),
      ),
    );
  }
}
