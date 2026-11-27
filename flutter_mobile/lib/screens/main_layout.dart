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
import 'accountant_dashboard_screen.dart';

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
        try {
          final decoded = jsonDecode(userStr);
          if (decoded is Map<String, dynamic>) {
            _userData = decoded;
            _userRole = _userData['role'] ?? '';
          }
        } catch (e) {
          debugPrint('Error parsing user data in MainLayout: $e');
        }
      }
      _isLoading = false;
    });
  }

  List<Widget> get _screens {
    final isTeacher = _userRole == 'TEACHER';
    final isStudent = _userRole == 'STUDENT';
    final isAccountant = _userRole == 'ACCOUNTANT';
    return [
      isAccountant ? const AccountantDashboardScreen() : const DashboardScreen(),
      if (!isAccountant) isStudent ? StudentExamsDashboardScreen(user: _userData) : const ExaminationDashboardScreen(),
      if (!isTeacher) 
        isStudent ? StudentFinanceDashboardScreen(user: _userData) : const FinanceScreen(),
      if (!isTeacher && !isAccountant) const TransportScreen(),
      const ModulesScreen(),
    ];
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    
    final bool isTeacher = _userRole == 'TEACHER';
    final double s = (MediaQuery.of(context).size.width / 392.0).clamp(0.80, 1.04);
    
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.08),
              blurRadius: 20,
              offset: const Offset(0, -5),
            ),
          ],
        ),
        child: SafeArea(
          child: Padding(
            padding: EdgeInsets.symmetric(horizontal: 10 * s, vertical: 6 * s),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildNavItem(0, Icons.home_rounded, 'Home', const Color(0xFF6366F1), const Color(0xFF4F46E5), s),
              if (_userRole != 'ACCOUNTANT') _buildNavItem(1, Icons.assignment_rounded, 'Exam', const Color(0xFF10B981), const Color(0xFF059669), s),
              if (!isTeacher) _buildNavItem(_userRole == 'ACCOUNTANT' ? 1 : 2, Icons.account_balance_wallet_rounded, 'Finance', const Color(0xFFF59E0B), const Color(0xFFD97706), s),
              if (!isTeacher && _userRole != 'ACCOUNTANT') _buildNavItem(3, Icons.directions_bus_rounded, 'Transport', const Color(0xFFEC4899), const Color(0xFFDB2777), s),
              _buildNavItem(isTeacher ? 2 : (_userRole == 'ACCOUNTANT' ? 2 : 4), Icons.grid_view_rounded, 'More', const Color(0xFF64748B), const Color(0xFF475569), s),
            ],
          ),
        ),
      ),
      ),
    );
  }

  Widget _buildNavItem(int index, IconData icon, String label, Color color1, Color color2, double s) {
    final isSelected = _currentIndex == index;
    return GestureDetector(
      onTap: () {
        setState(() {
          _currentIndex = index;
        });
      },
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 350),
        curve: Curves.easeOutQuint,
        padding: EdgeInsets.symmetric(horizontal: 4.0 * s, vertical: 3.0 * s),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              padding: EdgeInsets.symmetric(horizontal: 13 * s, vertical: 5 * s),
              decoration: BoxDecoration(
                gradient: isSelected
                    ? LinearGradient(
                        colors: [color1, color2],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      )
                    : null,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(
                icon,
                color: isSelected ? Colors.white : const Color(0xFF94A3B8),
                size: (22 * s).clamp(18.0, 24.0),
              ),
            ),
            const SizedBox(height: 3),
            Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: GoogleFonts.outfit(
                color: isSelected ? color1 : const Color(0xFF94A3B8),
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }
}


