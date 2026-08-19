import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/api_service.dart';

class TeacherProfileScreen extends StatefulWidget {
  final dynamic teacher;

  const TeacherProfileScreen({super.key, required this.teacher});

  @override
  State<TeacherProfileScreen> createState() => _TeacherProfileScreenState();
}

class _TeacherProfileScreenState extends State<TeacherProfileScreen> {
  Map<String, dynamic>? _teacherDetails;
  List<dynamic> _assignedClasses = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchProfile();
  }

  Future<void> _fetchProfile() async {
    final id = widget.teacher['id'];
    if (id == null) {
      setState(() => _isLoading = false);
      return;
    }

    try {
      final results = await Future.wait([
        ApiService.getTeacherById(id),
        ApiService.getTeacherClasses(id),
      ]);

      if (mounted) {
        setState(() {
          _teacherDetails = results[0]['success'] ? results[0]['data'] : widget.teacher;
          _assignedClasses = results[1]['success'] ? results[1]['data'] : [];
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _teacherDetails = widget.teacher;
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _launchUrl(String scheme, String value) async {
    final cleanValue = value.replaceAll(RegExp(r'[^\d+]'), '');
    final url = Uri.parse(scheme == 'tel' ? 'tel:$cleanValue' : scheme == 'whatsapp' ? 'https://wa.me/$cleanValue' : 'mailto:$value');
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    final teacher = _teacherDetails ?? widget.teacher;
    final user = teacher['user'] ?? {};
    final name = user['name'] ?? 'Teacher';
    final photoUrl = user['photoUrl'];
    final image = photoUrl?.isNotEmpty == true
        ? photoUrl
        : 'https://ui-avatars.com/api/?name=${Uri.encodeComponent(name)}&background=E2E8F0&color=1E293B';
    final idStr = teacher['teacherId'] ?? teacher['employeeId'] ?? 'N/A';
    final subject = teacher['specialization'] ?? 'General';
    final phone = user['phone'] ?? '';
    final email = user['email'] ?? 'Not provided';
    final qualification = teacher['qualification'] ?? 'N/A';
    final experience = teacher['experience'] != null ? '${teacher['experience']} years' : 'N/A';
    final joiningDate = teacher['joiningDate'] != null ? teacher['joiningDate'].toString().split('T')[0] : 'N/A';

    return Scaffold(
      backgroundColor: const Color(0xFFF4F7FE),
      body: CustomScrollView(
        slivers: [
          _buildSliverAppBar(name, image, subject, idStr),
          SliverToBoxAdapter(
            child: _isLoading
                ? const Padding(
                    padding: EdgeInsets.all(40.0),
                    child: Center(child: CircularProgressIndicator(color: Color(0xFF6366F1))),
                  )
                : Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        _buildContactInfoCard(phone, email, qualification, experience, joiningDate),
                        const SizedBox(height: 24),
                        _buildAssignedClassesSection(),
                        const SizedBox(height: 40),
                      ],
                    ),
                  ),
          ),
        ],
      ),
      floatingActionButton: phone.isNotEmpty
          ? FloatingActionButton(
              onPressed: () => _launchUrl('whatsapp', phone),
              backgroundColor: const Color(0xFF22C55E),
              child: const Icon(Icons.chat_bubble_rounded, color: Colors.white),
            )
          : null,
    );
  }

  Widget _buildSliverAppBar(String name, String image, String subject, String id) {
    return SliverAppBar(
      expandedHeight: 280,
      pinned: true,
      iconTheme: const IconThemeData(color: Colors.white),
      flexibleSpace: FlexibleSpaceBar(
        background: Stack(
          fit: StackFit.expand,
          children: [
            Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF2E2A66), Color(0xFF222854)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
            ),
            // Decorative circles
            Positioned(
              right: -50,
              top: -50,
              child: CircleAvatar(radius: 100, backgroundColor: Colors.white.withOpacity(0.05)),
            ),
            Positioned(
              left: -30,
              bottom: -20,
              child: CircleAvatar(radius: 60, backgroundColor: Colors.white.withOpacity(0.05)),
            ),
            SafeArea(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const SizedBox(height: 20),
                  Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.2),
                          blurRadius: 15,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: CircleAvatar(
                      radius: 50,
                      backgroundColor: const Color(0xFFE2E8F0),
                      backgroundImage: NetworkImage(image),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    name,
                    style: GoogleFonts.outfit(
                      color: Colors.white,
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _buildHeaderBadge(subject, const Color(0xFF10B981)),
                      const SizedBox(width: 8),
                      _buildHeaderBadge('ID: $id', const Color(0xFF8B5CF6)),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeaderBadge(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.2),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.5)),
      ),
      child: Text(
        text,
        style: GoogleFonts.poppins(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
      ),
    );
  }

  Widget _buildContactInfoCard(String phone, String email, String qualification, String experience, String joiningDate) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(color: const Color(0xFF6366F1).withOpacity(0.08), blurRadius: 15, offset: const Offset(0, 5)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Teacher Information', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
          const SizedBox(height: 20),
          _buildInfoRow(Icons.phone_rounded, 'Phone', phone, onTap: phone.isNotEmpty ? () => _launchUrl('tel', phone) : null),
          _buildDivider(),
          _buildInfoRow(Icons.email_rounded, 'Email', email, onTap: email != 'Not provided' ? () => _launchUrl('mailto', email) : null),
          _buildDivider(),
          _buildInfoRow(Icons.school_rounded, 'Qualification', qualification),
          _buildDivider(),
          _buildInfoRow(Icons.work_history_rounded, 'Experience', experience),
          _buildDivider(),
          _buildInfoRow(Icons.event_available_rounded, 'Joined on', joiningDate),
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value, {VoidCallback? onTap}) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8.0),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, size: 20, color: const Color(0xFF6366F1)),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label, style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF64748B))),
                  const SizedBox(height: 2),
                  Text(value, style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w600, color: onTap != null ? const Color(0xFF6366F1) : const Color(0xFF1E293B))),
                ],
              ),
            ),
            if (onTap != null) const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: Color(0xFFCBD5E1)),
          ],
        ),
      ),
    );
  }

  Widget _buildDivider() {
    return const Divider(height: 24, thickness: 1, color: Color(0xFFF1F5F9));
  }

  Widget _buildAssignedClassesSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4.0),
          child: Text(
            'Assigned Classes',
            style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B)),
          ),
        ),
        const SizedBox(height: 16),
        if (_assignedClasses.isEmpty)
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: const Center(
              child: Text('No classes assigned yet.', style: TextStyle(color: Color(0xFF64748B))),
            ),
          )
        else
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _assignedClasses.length,
            itemBuilder: (context, index) {
              final ac = _assignedClasses[index];
              final classInfo = ac['class'] ?? {};
              final subjectInfo = ac['subject'] ?? {};
              final className = '${classInfo['name'] ?? ''} ${classInfo['section'] ?? ''}'.trim();
              final subjectName = subjectInfo['name'] ?? 'General';
              
              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(color: const Color(0xFF6366F1).withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 4)),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: const Color(0xFFF59E0B).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Center(child: Icon(Icons.class_outlined, color: Color(0xFFD97706))),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            className,
                            style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B)),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Subject: $subjectName',
                            style: GoogleFonts.poppins(fontSize: 13, color: const Color(0xFF64748B)),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
      ],
    );
  }
}
