import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class ClassesScreen extends StatelessWidget {
  const ClassesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Classes', style: GoogleFonts.outfit()),
        backgroundColor: const Color(0xFF6366F1),
      ),
      body: const Center(
        child: Text('Classes module coming soon...'),
      ),
    );
  }
}
