const fs = require('fs');
const path = "flutter_mobile/lib/screens/dashboard_screen.dart";

let content = fs.readFileSync(path, 'utf8');

const injectionCode = `
  // =========================================================================
  // STUDENT PREMIUM UI DESIGN
  // =========================================================================
  
  Widget _buildStudentDashboard(String userName, String metaLabel, String metaValue) {
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildStudentHero(userName, metaLabel, metaValue),
          const SizedBox(height: 16),
          _buildStudentAnnouncement(),
          const SizedBox(height: 16),
          _buildStudentMetricsGrid(),
          const SizedBox(height: 24),
          _buildStudentQuickLinks(),
          const SizedBox(height: 24),
          _buildStudentBottomBanner(),
          const SizedBox(height: 30),
        ],
      ),
    );
  }

  Widget _buildStudentHero(String userName, String metaLabel, String metaValue) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        gradient: const LinearGradient(
          colors: [Color(0xFF6B4CF0), Color(0xFF4C30C7)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF6B4CF0).withOpacity(0.4),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ]
      ),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 8,
                    height: 8,
                    decoration: const BoxDecoration(color: Color(0xFFD8B4FE), shape: BoxShape.circle),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '${_getGreeting()} ??',
                    style: GoogleFonts.poppins(color: const Color(0xFFD8B4FE), fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                userName,
                style: GoogleFonts.outfit(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 4),
              Text(
                'STUDENT • JY School',
                style: GoogleFonts.poppins(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.w500),
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  const Text('""', style: TextStyle(color: Color(0xFFFFD12A), fontSize: 24, fontWeight: FontWeight.bold, height: 0.8)),
                  const SizedBox(width: 8),
                  Text(
                    'Have a great day ahead!',
                    style: GoogleFonts.poppins(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w500),
                  ),
                ],
              ),
            ],
          ),
          Positioned(
            right: 0,
            top: 0,
            child: Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.2),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.white.withOpacity(0.3), width: 2),
                image: const DecorationImage(
                  image: AssetImage('assets/images/default_avatar.png'),
                  fit: BoxFit.cover,
                ),
              ),
              child: const Icon(Icons.person, color: Colors.white, size: 40),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStudentAnnouncement() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFFEF3C7),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.campaign_rounded, color: Color(0xFFD97706), size: 28),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(color: Colors.red, borderRadius: BorderRadius.circular(4)),
                      child: Text('NEW', style: GoogleFonts.poppins(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold)),
                    ),
                    const SizedBox(width: 8),
                    Text('Latest Announcement', style: GoogleFonts.poppins(color: const Color(0xFF1E293B), fontSize: 13, fontWeight: FontWeight.bold)),
                  ],
                ),
                const SizedBox(height: 4),
                Text('Sports Day will be held on 25th May 2025.', style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 11)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(color: const Color(0xFFFFB800), borderRadius: BorderRadius.circular(12)),
            child: Text('View All', style: GoogleFonts.poppins(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _buildStudentMetricsGrid() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: GridView.count(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        crossAxisCount: 2,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
        childAspectRatio: 0.9,
        children: [
          _buildPremiumCard(
            title: 'Attendance',
            subtitle: 'This Month',
            mainValue: '\\${_attendanceRate.toStringAsFixed(0)}%',
            mainValueLabel: 'Present',
            icon: Icons.calendar_month_rounded,
            color: const Color(0xFF3B82F6),
            bgColor: const Color(0xFFEFF6FF),
            bottomWidget: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildMiniStat('22', 'Present', const Color(0xFF10B981)),
                _buildMiniStat('2', 'Absent', const Color(0xFFEF4444)),
                _buildMiniStat('1', 'Leave', const Color(0xFFF59E0B)),
              ],
            ),
            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const AttendanceScreen())),
          ),
          _buildPremiumCard(
            title: 'Fees',
            subtitle: 'Due Amount',
            mainValue: '?\\${_feeDues.toInt()}',
            mainValueLabel: 'Due',
            icon: Icons.account_balance_wallet_rounded,
            color: const Color(0xFF10B981),
            bgColor: const Color(0xFFECFDF5),
            bottomWidget: Container(
              padding: const EdgeInsets.symmetric(vertical: 8),
              decoration: BoxDecoration(color: const Color(0xFF10B981).withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
              child: Center(child: Text('View Details ?', style: GoogleFonts.poppins(color: const Color(0xFF059669), fontSize: 12, fontWeight: FontWeight.bold))),
            ),
            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const FeesScreen())),
          ),
          _buildPremiumCard(
            title: 'Homework',
            subtitle: '2 Pending',
            mainValue: '2',
            mainValueLabel: 'Assignments',
            icon: Icons.assignment_rounded,
            color: const Color(0xFF8B5CF6),
            bgColor: const Color(0xFFF5F3FF),
            bottomWidget: Container(
              padding: const EdgeInsets.symmetric(vertical: 8),
              decoration: BoxDecoration(color: const Color(0xFF8B5CF6).withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
              child: Center(child: Text('View Homework ?', style: GoogleFonts.poppins(color: const Color(0xFF6D28D9), fontSize: 12, fontWeight: FontWeight.bold))),
            ),
            onTap: () {},
          ),
          _buildPremiumCard(
            title: 'Exams',
            subtitle: 'Next Exam',
            mainValue: '5',
            mainValueLabel: 'Days Maths',
            icon: Icons.school_rounded,
            color: const Color(0xFFF59E0B),
            bgColor: const Color(0xFFFFFBEB),
            bottomWidget: Container(
              padding: const EdgeInsets.symmetric(vertical: 8),
              decoration: BoxDecoration(color: const Color(0xFFF59E0B).withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
              child: Center(child: Text('View Timetable ?', style: GoogleFonts.poppins(color: const Color(0xFFD97706), fontSize: 12, fontWeight: FontWeight.bold))),
            ),
            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const ExamsScreen())),
          ),
          _buildPremiumCard(
            title: 'Time Table',
            subtitle: 'Today',
            mainValue: '4',
            mainValueLabel: 'Classes Left',
            icon: Icons.access_time_filled_rounded,
            color: const Color(0xFF06B6D4),
            bgColor: const Color(0xFFECFEFF),
            bottomWidget: Container(
              padding: const EdgeInsets.symmetric(vertical: 8),
              decoration: BoxDecoration(color: const Color(0xFF06B6D4).withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
              child: Center(child: Text('View Today\\'s Schedule ?', style: GoogleFonts.poppins(color: const Color(0xFF0891B2), fontSize: 12, fontWeight: FontWeight.bold))),
            ),
            onTap: () {},
          ),
          _buildPremiumCard(
            title: 'Results',
            subtitle: 'Latest',
            mainValue: '85%',
            mainValueLabel: 'Unit Test 1',
            icon: Icons.emoji_events_rounded,
            color: const Color(0xFFF43F5E),
            bgColor: const Color(0xFFFFF1F2),
            bottomWidget: Container(
              padding: const EdgeInsets.symmetric(vertical: 8),
              decoration: BoxDecoration(color: const Color(0xFFF43F5E).withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
              child: Center(child: Text('View Results ?', style: GoogleFonts.poppins(color: const Color(0xFFE11D48), fontSize: 12, fontWeight: FontWeight.bold))),
            ),
            onTap: () {},
          ),
        ],
      ),
    );
  }

  Widget _buildMiniStat(String value, String label, Color color) {
    return Column(
      children: [
        Text(value, style: GoogleFonts.outfit(color: color, fontSize: 14, fontWeight: FontWeight.bold)),
        Text(label, style: GoogleFonts.poppins(color: color, fontSize: 10, fontWeight: FontWeight.w500)),
      ],
    );
  }

  Widget _buildPremiumCard({
    required String title, required String subtitle, required String mainValue, required String mainValueLabel,
    required IconData icon, required Color color, required Color bgColor, required Widget bottomWidget, required VoidCallback onTap
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [BoxShadow(color: color.withOpacity(0.08), blurRadius: 15, offset: const Offset(0, 5))],
          border: Border.all(color: bgColor, width: 2),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(icon, color: color, size: 28),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(title, style: GoogleFonts.poppins(color: const Color(0xFF1E293B), fontSize: 13, fontWeight: FontWeight.bold)),
                    Text(subtitle, style: GoogleFonts.poppins(color: color, fontSize: 10, fontWeight: FontWeight.w600)),
                  ],
                ),
              ],
            ),
            Column(
              children: [
                Text(mainValue, style: GoogleFonts.outfit(color: color, fontSize: 32, fontWeight: FontWeight.w900, height: 1)),
                Text(mainValueLabel, style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 11, fontWeight: FontWeight.w500)),
              ],
            ),
            bottomWidget,
          ],
        ),
      ),
    );
  }

  Widget _buildStudentQuickLinks() {
    final links = [
      {'icon': Icons.campaign, 'color': const Color(0xFF6366F1), 'label': 'Notice Board'},
      {'icon': Icons.event, 'color': const Color(0xFFEC4899), 'label': 'Events'},
      {'icon': Icons.collections, 'color': const Color(0xFFF59E0B), 'label': 'Gallery'},
      {'icon': Icons.local_library, 'color': const Color(0xFF3B82F6), 'label': 'Library'},
      {'icon': Icons.directions_bus, 'color': const Color(0xFFEAB308), 'label': 'Transport'},
      {'icon': Icons.badge, 'color': const Color(0xFF06B6D4), 'label': 'ID Card'},
      {'icon': Icons.computer, 'color': const Color(0xFF8B5CF6), 'label': 'Classes'},
      {'icon': Icons.menu_book, 'color': const Color(0xFF10B981), 'label': 'Syllabus'},
      {'icon': Icons.assignment_turned_in, 'color': const Color(0xFFF43F5E), 'label': 'Leave'},
      {'icon': Icons.headset_mic, 'color': const Color(0xFF64748B), 'label': 'Help Desk'},
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Wrap(
        spacing: 16,
        runSpacing: 20,
        alignment: WrapAlignment.center,
        children: links.map((link) {
          final c = link['color'] as Color;
          return SizedBox(
            width: 60,
            child: Column(
              children: [
                Container(
                  width: 50,
                  height: 50,
                  decoration: BoxDecoration(
                    color: c.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Icon(link['icon'] as IconData, color: c, size: 26),
                ),
                const SizedBox(height: 6),
                Text(
                  link['label'] as String,
                  textAlign: TextAlign.center,
                  style: GoogleFonts.poppins(color: const Color(0xFF334155), fontSize: 10, fontWeight: FontWeight.w600),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildStudentBottomBanner() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        gradient: const LinearGradient(
          colors: [Color(0xFF5B21B6), Color(0xFF3B82F6)],
          begin: Alignment.bottomLeft,
          end: Alignment.topRight,
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Learning Today\\nLeading Tomorrow', style: GoogleFonts.outfit(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold, height: 1.2)),
                const SizedBox(height: 8),
                Text('Let\\'s build a better future together!', style: GoogleFonts.poppins(color: Colors.white70, fontSize: 11)),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text('Explore More', style: GoogleFonts.poppins(color: const Color(0xFF3B82F6), fontSize: 12, fontWeight: FontWeight.bold)),
                      const SizedBox(width: 4),
                      const Icon(Icons.arrow_forward_rounded, color: Color(0xFF3B82F6), size: 14),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const Icon(Icons.school, color: Colors.white24, size: 80),
        ],
      ),
    );
  }

`;

if (!content.includes("Widget _buildStudentDashboard")) {
    const index = content.indexOf("String _getFormattedDate()");
    if (index !== -1) {
        content = content.substring(0, index) + injectionCode + content.substring(index);
        fs.writeFileSync(path, content, 'utf8');
        console.log("Successfully injected _buildStudentDashboard and widgets.");
    } else {
        console.log("Could not find _getFormattedDate().");
    }
} else {
    console.log("_buildStudentDashboard already exists.");
}
