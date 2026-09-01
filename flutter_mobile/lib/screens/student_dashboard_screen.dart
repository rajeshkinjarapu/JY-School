import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class StudentDashboardScreen extends StatefulWidget {
  const StudentDashboardScreen({super.key});

  @override
  State<StudentDashboardScreen> createState() => _StudentDashboardScreenState();
}

class _StudentDashboardScreenState extends State<StudentDashboardScreen> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          // Main Scrollable Content
          SingleChildScrollView(
            padding: const EdgeInsets.only(bottom: 100), // Space for bottom nav
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeader(),
                const SizedBox(height: 20),
                _buildAnnouncementBox(),
                const SizedBox(height: 20),
                _buildGridSection(),
                const SizedBox(height: 30),
                _buildScheduleSection(),
              ],
            ),
          ),
          
          // Floating Bottom Navigation Bar
          _buildBottomNavigationBar(),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.only(top: 60, left: 24, right: 24, bottom: 40),
      decoration: const BoxDecoration(
        color: Color(0xFF4B497B),
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(40),
          bottomRight: Radius.circular(40),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.school_rounded, color: Colors.white70, size: 20),
              const SizedBox(width: 8),
              Text(
                'JY SCHOOL',
                style: GoogleFonts.outfit(
                  color: Colors.white70,
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 2,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              // Avatar
          Container(
            padding: const EdgeInsets.all(2),
            decoration: const BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
            ),
            child: const CircleAvatar(
              radius: 28,
              backgroundImage: AssetImage('assets/images/student_avatar.png'), // Placeholder
              backgroundColor: Color(0xFFCBD5E1),
              child: Icon(Icons.person, color: Colors.white, size: 30), // Fallback
            ),
          ),
          const SizedBox(width: 16),
          // Name and Details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Jimmy',
                  style: GoogleFonts.poppins(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  'E85, 2024-25',
                  style: GoogleFonts.poppins(
                    color: Colors.white70,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
          // Action Buttons
          _buildHeaderIconButton(Icons.search),
          const SizedBox(width: 12),
          _buildHeaderIconButton(Icons.notifications_outlined),
        ],
      ),
    ],
  ),
    );
  }

  Widget _buildHeaderIconButton(IconData icon) {
    return Container(
      width: 44,
      height: 44,
      decoration: const BoxDecoration(
        color: Colors.white,
        shape: BoxShape.circle,
      ),
      child: Icon(icon, color: const Color(0xFF4B497B)),
    );
  }

  Widget _buildAnnouncementBox() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFFFEF3C7),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFFDE68A)),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: const BoxDecoration(
                color: Color(0xFFF59E0B),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.campaign_rounded, color: Colors.white),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Important Announcement',
                    style: GoogleFonts.poppins(
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFF92400E),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Tomorrow is a holiday due to local festival.',
                    style: GoogleFonts.poppins(
                      fontSize: 12,
                      color: const Color(0xFFB45309),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGridSection() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Tools',
            style: GoogleFonts.poppins(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: const Color(0xFF1E293B),
            ),
          ),
          Text(
            'Quick Access',
            style: GoogleFonts.poppins(
              fontSize: 14,
              color: Colors.grey,
            ),
          ),
          const SizedBox(height: 20),
          GridView.count(
            crossAxisCount: 4,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 16,
            crossAxisSpacing: 12,
            childAspectRatio: 0.75,
            children: [
              _buildGridItem('Fees', Icons.account_balance_wallet_rounded, const Color(0xFFDCFCE7), const Color(0xFF16A34A), onTap: () {
                Navigator.pushNamed(context, '/student/fees');
              }),
              _buildGridItem('Homework', Icons.assignment_rounded, const Color(0xFFFFF7ED), const Color(0xFFEA580C), onTap: () {
                Navigator.pushNamed(context, '/student/homework');
              }),
              _buildGridItem('Notice\nBoard', Icons.campaign_rounded, const Color(0xFFEDE9FE), const Color(0xFF6D28D9)),
              _buildGridItem('Events', Icons.event_note_rounded, const Color(0xFFFCE7F3), const Color(0xFFDB2777)),
              _buildGridItem('Gallery', Icons.collections_rounded, const Color(0xFFFEF3C7), const Color(0xFFD97706)),
              _buildGridItem('Library', Icons.local_library_rounded, const Color(0xFFE0F2FE), const Color(0xFF0284C7)),
              _buildGridItem('Transport', Icons.directions_bus_rounded, const Color(0xFFFEF9C3), const Color(0xFFCA8A04)),
              _buildGridItem('ID Card', Icons.badge_rounded, const Color(0xFFCFFAFE), const Color(0xFF0891B2)),
              _buildGridItem('Classes', Icons.laptop_chromebook_rounded, const Color(0xFFF3E8FF), const Color(0xFF9333EA)),
              _buildGridItem('Syllabus', Icons.menu_book_rounded, const Color(0xFFD1FAE5), const Color(0xFF059669)),
              _buildGridItem('Leave', Icons.fact_check_rounded, const Color(0xFFFFE4E6), const Color(0xFFE11D48)),
              _buildGridItem('Help Desk', Icons.headset_mic_rounded, const Color(0xFFF1F5F9), const Color(0xFF475569)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildGridItem(String title, IconData icon, Color bgColor, Color iconColor, {VoidCallback? onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.start,
        children: [
          Container(
          width: 60,
          height: 60,
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(18),
          ),
          child: Icon(
            icon,
            color: iconColor,
            size: 28,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          title,
          textAlign: TextAlign.center,
          maxLines: 2,
          style: GoogleFonts.poppins(
            fontSize: 10,
            height: 1.2,
            fontWeight: FontWeight.w600,
            color: const Color(0xFF334155),
          ),
        ),
      ],
    );
  }

  Widget _buildScheduleSection() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Schedule',
                style: GoogleFonts.poppins(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF1E293B),
                ),
              ),
              Text(
                'View All',
                style: GoogleFonts.poppins(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFF4B497B),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          _buildScheduleItem('25', 'Jan', 'Economy Class', '09:00 - 11:00 AM', 'Room E2, 2nd Floor', const Color(0xFF4B497B)),
          _buildScheduleItem('26', 'Jan', 'Geography Class', '09:00 - 11:00 AM', 'Room E2, 2nd Floor', const Color(0xFFF59E0B)),
          _buildScheduleItem('27', 'Jan', 'Accounting Class', '09:00 - 11:00 AM', 'Room E2, 2nd Floor', const Color(0xFF06B6D4)),
          _buildScheduleItem('28', 'Jan', 'Mathematics Class', '09:00 - 11:00 AM', 'Room E2, 2nd Floor', const Color(0xFF10B981)),
        ],
      ),
    );
  }

  Widget _buildScheduleItem(String day, String month, String title, String time, String location, Color color) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey.withOpacity(0.2)),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: Row(
        children: [
          // Date Box
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              children: [
                Text(
                  day,
                  style: GoogleFonts.poppins(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  month,
                  style: GoogleFonts.poppins(
                    color: Colors.white,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 20),
          // Details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.poppins(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF1E293B),
                  ),
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    const Icon(Icons.access_time_rounded, size: 14, color: Colors.grey),
                    const SizedBox(width: 4),
                    Text(
                      time,
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        color: Colors.grey,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(Icons.location_on_outlined, size: 14, color: Colors.grey),
                    const SizedBox(width: 4),
                    Text(
                      location,
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        color: Colors.grey,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomNavigationBar() {
    return Align(
      alignment: Alignment.bottomCenter,
      child: SafeArea(
        child: Container(
          margin: const EdgeInsets.only(left: 24, right: 24, bottom: 20),
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
          decoration: BoxDecoration(
            color: const Color(0xFF4B497B),
            borderRadius: BorderRadius.circular(40),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF4B497B).withOpacity(0.3),
                blurRadius: 20,
                offset: const Offset(0, 10),
              )
            ],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildNavItem(0, 'Home', Icons.home_rounded),
              _buildNavItem(1, 'Calendar', Icons.calendar_month_outlined),
              _buildNavItem(2, 'Bookmarks', Icons.bookmark_border_rounded),
              _buildNavItem(3, 'Profile', Icons.person_outline_rounded),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(int index, String label, IconData icon) {
    bool isSelected = _currentIndex == index;
    return GestureDetector(
      onTap: () {
        setState(() {
          _currentIndex = index;
        });
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
        padding: isSelected
            ? const EdgeInsets.symmetric(horizontal: 20, vertical: 12)
            : const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isSelected ? Colors.white : Colors.transparent,
          borderRadius: BorderRadius.circular(30),
        ),
        child: Row(
          children: [
            Icon(
              icon,
              color: isSelected ? const Color(0xFF4B497B) : Colors.white70,
              size: 24,
            ),
            if (isSelected) ...[
              const SizedBox(width: 8),
              Text(
                label,
                style: GoogleFonts.poppins(
                  color: const Color(0xFF4B497B),
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
            ]
          ],
        ),
      ),
    );
  }
}
