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
      backgroundColor: const Color(0xFFF4F7FE),
      drawer: const AppDrawer(currentRoute: 'hr_dashboard'),
      appBar: AppBar(
        title: Text('Staff HR & Attendance', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 22)),
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.white,
        elevation: 0,
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF6366F1), Color(0xFF8B5CF6), Color(0xFFD946EF)], // Vibrant multi-stop gradient
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator(color: Color(0xFF6366F1)))
        : Stack(
            children: [
              // Background Header Extension
              Container(
                height: 120,
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFF6366F1), Color(0xFF8B5CF6), Color(0xFFD946EF)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.only(
                    bottomLeft: Radius.circular(32),
                    bottomRight: Radius.circular(32),
                  ),
                ),
              ),
              
              SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(16, 10, 16, 30),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Date display at top
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                      child: Text(
                        DateFormat('EEEE, MMMM d, yyyy').format(DateTime.now()),
                        style: GoogleFonts.poppins(color: Colors.white.withOpacity(0.9), fontSize: 14, fontWeight: FontWeight.w500),
                      ),
                    ),
                    const SizedBox(height: 20),
                    
                    // Floating Stats Grid
                    _buildStatsGrid(),
                    
                    const SizedBox(height: 32),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                      child: Text('Quick Actions', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
                    ),
                    const SizedBox(height: 16),
                    _buildActionCards(context),
                  ],
                ),
              ),
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
      childAspectRatio: 2.2, // This makes the boxes exactly half the height
      children: [
        _buildStatCard('Total Staff', _totalStaff.toString(), Icons.groups_rounded, const Color(0xFF3B82F6), const Color(0xFFEFF6FF)),
        _buildStatCard('Present', _presentToday.toString(), Icons.how_to_reg_rounded, const Color(0xFF10B981), const Color(0xFFF0FDF4)),
        _buildStatCard('Absent', _absentToday.toString(), Icons.person_off_rounded, const Color(0xFFF43F5E), const Color(0xFFFFF1F2)),
        _buildStatCard('Late/Half', '${_lateToday + _halfDayToday}', Icons.schedule_rounded, const Color(0xFFF59E0B), const Color(0xFFFFFBEB)),
      ],
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color primaryColor, Color bgColor) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: primaryColor.withOpacity(0.3), width: 1.5), // Subtle colored border
        boxShadow: [
          BoxShadow(color: primaryColor.withOpacity(0.12), blurRadius: 12, offset: const Offset(0, 6)), // Colored glow shadow
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: bgColor,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: primaryColor, size: 22),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(value, style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
                  const SizedBox(height: 2),
                  Text(title, style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.w600, color: const Color(0xFF64748B))),
                ],
              ),
            ),
          ],
        ),
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
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(20),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(20),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [color.withOpacity(0.8), color],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [BoxShadow(color: color.withOpacity(0.3), blurRadius: 8, offset: const Offset(0, 4))],
                  ),
                  child: Icon(icon, color: Colors.white, size: 28),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title, style: GoogleFonts.outfit(fontSize: 17, fontWeight: FontWeight.w700, color: const Color(0xFF1E293B))),
                      const SizedBox(height: 4),
                      Text(subtitle, style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF64748B))),
                    ],
                  ),
                ),
                Icon(Icons.arrow_forward_ios_rounded, color: Colors.grey.shade400, size: 16),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
