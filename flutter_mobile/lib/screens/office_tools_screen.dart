import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../widgets/app_drawer.dart';

class OfficeToolsScreen extends StatefulWidget {
  const OfficeToolsScreen({super.key});

  @override
  State<OfficeToolsScreen> createState() => _OfficeToolsScreenState();
}

class _OfficeToolsScreenState extends State<OfficeToolsScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F7FE),
      drawer: const AppDrawer(currentRoute: 'office_tools'),
      appBar: AppBar(
        title: Text(
          'Office Tools',
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white),
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
      body: const Center(
        child: Text('Office Tools module coming soon with real API data'),
      ),
    );
  }
}



