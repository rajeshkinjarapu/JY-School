import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class StudentProfileScreen extends StatelessWidget {
  final dynamic student;

  const StudentProfileScreen({super.key, required this.student});

  @override
  Widget build(BuildContext context) {
    final user = student['user'] ?? {};
    final classInfo = student['class'] ?? {};
    final name = user['name'] ?? 'Unknown Student';
    final image = user['photoUrl'] ?? 'https://ui-avatars.com/api/?name=${Uri.encodeComponent(name)}&background=E2E8F0&color=1E293B';
    final rollNo = student['rollNo'] ?? 'N/A';
    final className = '${classInfo['name'] ?? ''} ${classInfo['section'] ?? ''}'.trim();
    final phone = user['phone'] ?? 'N/A';
    final email = user['email'] ?? 'No email';
    final dob = student['dob'] != null ? DateTime.parse(student['dob']).toLocal().toString().split(' ')[0] : 'N/A';
    final bloodGroup = student['bloodGroup'] ?? '-';
    
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: CustomScrollView(
        slivers: [
          _buildSliverAppBar(context, name, image, className, rollNo),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                children: [
                  _buildQuickStats(),
                  const SizedBox(height: 20),
                  _buildSectionHeader('Personal Information'),
                  _buildInfoCard([
                    _buildInfoRow(Icons.phone_outlined, 'Phone', phone),
                    _buildInfoRow(Icons.email_outlined, 'Email', email),
                    _buildInfoRow(Icons.cake_outlined, 'Date of Birth', dob),
                    _buildInfoRow(Icons.bloodtype_outlined, 'Blood Group', bloodGroup),
                  ]),
                  const SizedBox(height: 20),
                  _buildSectionHeader('Academic Details'),
                  _buildInfoCard([
                    _buildInfoRow(Icons.class_outlined, 'Class', className),
                    _buildInfoRow(Icons.badge_outlined, 'Roll No', rollNo),
                    _buildInfoRow(Icons.calendar_today_outlined, 'Admission Date', student['admissionDate'] != null ? DateTime.parse(student['admissionDate']).toLocal().toString().split(' ')[0] : 'N/A'),
                  ]),
                  const SizedBox(height: 100), // padding for bottom button
                ],
              ),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {},
        backgroundColor: const Color(0xFF6366F1),
        icon: const Icon(Icons.message_outlined, color: Colors.white),
        label: Text(
          'Message Parents',
          style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }

  Widget _buildSliverAppBar(BuildContext context, String name, String image, String className, String rollNo) {
    return SliverAppBar(
      expandedHeight: 280.0,
      floating: false,
      pinned: true,
      backgroundColor: const Color(0xFF6366F1),
      elevation: 0,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back_ios, color: Colors.white),
        onPressed: () => Navigator.pop(context),
      ),
      flexibleSpace: FlexibleSpaceBar(
        background: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF8B5CF6), Color(0xFF6366F1)],
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
            ),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const SizedBox(height: 40),
              Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  shape: BoxShape.circle,
                ),
                child: CircleAvatar(
                  radius: 50,
                  backgroundImage: NetworkImage(image),
                  backgroundColor: Colors.white,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                name,
                style: GoogleFonts.outfit(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  '$className | Roll: $rollNo',
                  style: GoogleFonts.poppins(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildQuickStats() {
    return Row(
      children: [
        Expanded(child: _buildStatCard('Attendance', '92%', Icons.check_circle_outline, const Color(0xFF10B981))),
        const SizedBox(width: 12),
        Expanded(child: _buildStatCard('Performance', 'A+', Icons.auto_graph, const Color(0xFFF59E0B))),
        const SizedBox(width: 12),
        Expanded(child: _buildStatCard('Due Fees', '₹0', Icons.account_balance_wallet_outlined, const Color(0xFF3B82F6))),
      ],
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 28),
          const SizedBox(height: 8),
          Text(
            value,
            style: GoogleFonts.outfit(
              color: const Color(0xFF1E293B),
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: GoogleFonts.poppins(
              color: const Color(0xFF64748B),
              fontSize: 11,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12, left: 4),
      child: Align(
        alignment: Alignment.centerLeft,
        child: Text(
          title,
          style: GoogleFonts.outfit(
            color: const Color(0xFF1E293B),
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }

  Widget _buildInfoCard(List<Widget> children) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: children,
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: const Color(0xFF6366F1), size: 20),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: GoogleFonts.poppins(
                    color: const Color(0xFF64748B),
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: GoogleFonts.outfit(
                    color: const Color(0xFF1E293B),
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
