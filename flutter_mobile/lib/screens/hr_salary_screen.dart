import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../widgets/app_drawer.dart';

class HrSalaryScreen extends StatefulWidget {
  const HrSalaryScreen({super.key});

  @override
  State<HrSalaryScreen> createState() => _HrSalaryScreenState();
}

class _HrSalaryScreenState extends State<HrSalaryScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F7FE),
      drawer: const AppDrawer(currentRoute: 'hr_salary'),
      appBar: AppBar(
        title: Text(
          'HR Salary',
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
        child: Text('HR Salary module coming soon with real API data'),
      ),
    );
  }
}



