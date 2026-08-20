import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../widgets/app_drawer.dart';
import 'mark_staff_attendance_screen.dart';
import 'staff_attendance_report_screen.dart';
import 'package:intl/intl.dart';

class StaffAttendanceDashboardScreen extends StatefulWidget {
  const StaffAttendanceDashboardScreen({super.key});

  @override
  State<StaffAttendanceDashboardScreen> createState() => _StaffAttendanceDashboardScreenState();
}

class _StaffAttendanceDashboardScreenState extends State<StaffAttendanceDashboardScreen> {
  // Simulated stats for premium UI feel. In a real app, this would come from ApiService.getStaffAttendanceStats()
  bool _isLoading = false;
  
  final int _totalStaff = 45;
  final int _presentToday = 40;
  final int _absentToday = 2;
  final int _lateToday = 2;
  final int _halfDayToday = 1;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      drawer: const AppDrawer(currentRoute: 'hr_dashboard'),
      appBar: AppBar(
        title: Text('Staff HR & Attendance', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white)),
        iconTheme: const IconThemeData(color: Colors.white),
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF3B82F6), Color(0xFF2563EB)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildGreeting(),
                const SizedBox(height: 24),
                Text('Today\'s Overview', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
                const SizedBox(height: 12),
                _buildStatsGrid(),
                const SizedBox(height: 24),
                Text('Quick Actions', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
                const SizedBox(height: 12),
                _buildActionCards(context),
              ],
            ),
          ),
    );
  }

  Widget _buildGreeting() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF4C4296), Color(0xFF2E2A66)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: const Color(0xFF2E2A66).withOpacity(0.3), blurRadius: 10, offset: const Offset(0, 5))],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Staff Attendance', style: GoogleFonts.outfit(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Text(DateFormat('EEEE, MMMM d, yyyy').format(DateTime.now()), style: GoogleFonts.poppins(color: Colors.white70, fontSize: 14)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(16)),
            child: const Icon(Icons.people_alt_rounded, color: Colors.white, size: 40),
          )
        ],
      ),
    );
  }

  Widget _buildStatsGrid() {
    return GridView.count(
      crossAxisCount: 2,
      crossAxisSpacing: 16,
      mainAxisSpacing: 16,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      childAspectRatio: 1.2,
      children: [
        _buildStatCard('Total Staff', _totalStaff.toString(), Icons.groups_rounded, const Color(0xFF3B82F6)),
        _buildStatCard('Present', _presentToday.toString(), Icons.how_to_reg_rounded, const Color(0xFF10B981)),
        _buildStatCard('Absent', _absentToday.toString(), Icons.person_off_rounded, const Color(0xFFEF4444)),
        _buildStatCard('Late/Half-day', '${_lateToday + _halfDayToday}', Icons.schedule_rounded, const Color(0xFFF59E0B)),
      ],
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 8, offset: const Offset(0, 4))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                child: Icon(icon, color: color, size: 20),
              ),
              Text(value, style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.bold, color: color)),
            ],
          ),
          const Spacer(),
          Text(title, style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w500, color: const Color(0xFF64748B))),
        ],
      ),
    );
  }

  Widget _buildActionCards(BuildContext context) {
    return Column(
      children: [
        _buildActionTile(
          context,
          title: 'Mark Today\'s Attendance',
          subtitle: 'Record present, absent, or late for all staff members.',
          icon: Icons.fact_check_rounded,
          color: const Color(0xFF6366F1),
          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const MarkStaffAttendanceScreen())),
        ),
        const SizedBox(height: 16),
        _buildActionTile(
          context,
          title: 'View Attendance Reports',
          subtitle: 'Detailed monthly/yearly reports for payroll processing.',
          icon: Icons.bar_chart_rounded,
          color: const Color(0xFF14B8A6),
          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const StaffAttendanceReportScreen())),
        ),
      ],
    );
  }

  Widget _buildActionTile(BuildContext context, {required String title, required String subtitle, required IconData icon, required Color color, required VoidCallback onTap}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Ink(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey.shade200),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
              child: Icon(icon, color: color, size: 28),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
                  const SizedBox(height: 4),
                  Text(subtitle, style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF64748B))),
                ],
              ),
            ),
            Icon(Icons.chevron_right_rounded, color: Colors.grey.shade400),
          ],
        ),
      ),
    );
  }
}
