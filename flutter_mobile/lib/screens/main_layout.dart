import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'dashboard_screen.dart';
import 'examination_dashboard_screen.dart';
import 'finance_screen.dart';
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

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
  }

  final List<Widget> _screens = [
    const DashboardScreen(),
    const ExaminationDashboardScreen(),
    const FinanceScreen(),
    const TransportScreen(),
    const ModulesScreen(),
  ];

  @override
  Widget build(BuildContext context) {
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
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, -5),
            ),
          ],
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 8.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildNavItem(0, Icons.home_rounded, 'Home', const Color(0xFF6366F1)),
                _buildNavItem(1, Icons.assignment_rounded, 'Exam', const Color(0xFF10B981)),
                _buildNavItem(2, Icons.account_balance_wallet_rounded, 'Finance', const Color(0xFFF59E0B)),
                _buildNavItem(3, Icons.directions_bus_rounded, 'Transport', const Color(0xFFEC4899)),
                _buildNavItem(4, Icons.grid_view_rounded, 'More', const Color(0xFF475569)),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(int index, IconData icon, String label, Color activeColor) {
    final isSelected = _currentIndex == index;
    return GestureDetector(
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
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeInOut,
            padding: EdgeInsets.all(isSelected ? 10.0 : 8.0),
            decoration: BoxDecoration(
              color: isSelected ? activeColor.withOpacity(0.15) : Colors.transparent,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(
              icon,
              color: isSelected ? activeColor : const Color(0xFF94A3B8),
              size: isSelected ? 26 : 24,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: GoogleFonts.outfit(
              color: isSelected ? activeColor : const Color(0xFF94A3B8),
              fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
              fontSize: 11,
            ),
          ),
        ],
      ),
    );
  }
}


