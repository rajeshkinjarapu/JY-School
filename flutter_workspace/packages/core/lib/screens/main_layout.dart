import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

import 'dashboard_screen.dart';
import 'examination_dashboard_screen.dart';
import 'student_exams_dashboard_screen.dart';
import 'finance_screen.dart';
import 'student_finance_dashboard_screen.dart';
import 'transport_screen.dart';
import 'modules_screen.dart';

class MainLayout extends StatefulWidget {
  final int initialIndex;
  const MainLayout({super.key, this.initialIndex = 0});

  @override
  State<MainLayout> createState() => _MainLayoutState();
}

class _MainLayoutState extends State<MainLayout> {
  late int _currentIndex;
  String _userRole = '';
  Map<String, dynamic> _userData = {};
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
    _initRole();
  }

  Future<void> _initRole() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      final userStr = prefs.getString('user');
      if (userStr != null) {
        _userData = jsonDecode(userStr);
        _userRole = _userData['role'] ?? '';
      }
      _isLoading = false;
    });
  }

  List<Widget> get _screens {
    final isTeacher = _userRole == 'TEACHER';
    final isStudent = _userRole == 'STUDENT';
    return [
      const DashboardScreen(),
      isStudent ? StudentExamsDashboardScreen(user: _userData) : const ExaminationDashboardScreen(),
      if (!isTeacher) 
        isStudent ? StudentFinanceDashboardScreen(user: _userData) : const FinanceScreen(),
      if (!isTeacher) const TransportScreen(),
      const ModulesScreen(),
    ];
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    
    final isTeacher = _userRole == 'TEACHER';
    
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      extendBody: true, // Allow body to scroll behind the floating nav bar
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: SafeArea(
        child: Container(
          margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(30), // Floating Pill Shape
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.08),
                blurRadius: 24,
                offset: const Offset(0, 8),
              ),
            ],
            border: Border.all(color: Colors.black.withOpacity(0.02), width: 1),
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildNavItem(0, Icons.home_rounded, 'Home', const Color(0xFF6366F1)),
                _buildNavItem(1, Icons.assignment_rounded, 'Exam', const Color(0xFF10B981)),
                if (!isTeacher) _buildNavItem(2, Icons.account_balance_wallet_rounded, 'Finance', const Color(0xFFF59E0B)),
                if (!isTeacher) _buildNavItem(3, Icons.directions_bus_rounded, 'Transport', const Color(0xFFEC4899)),
                _buildNavItem(isTeacher ? 2 : 4, Icons.grid_view_rounded, 'More', const Color(0xFF64748B)),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(int index, IconData icon, String label, Color activeColor) {
    final isSelected = _currentIndex == index;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() {
            _currentIndex = index;
          });
        },
        behavior: HitTestBehavior.opaque,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: isSelected ? activeColor.withOpacity(0.15) : Colors.transparent,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(
                icon,
                color: isSelected ? activeColor : const Color(0xFF94A3B8),
                size: 26,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: GoogleFonts.outfit(
                color: isSelected ? activeColor : const Color(0xFF94A3B8),
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                fontSize: 11,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}


