import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/api_service.dart';

class StudentProfileScreen extends StatefulWidget {
  final dynamic student;

  const StudentProfileScreen({super.key, required this.student});

  @override
  State<StudentProfileScreen> createState() => _StudentProfileScreenState();
}

class _StudentProfileScreenState extends State<StudentProfileScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  Map<String, dynamic>? _studentDetails;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _fetchProfile();
  }

  Future<void> _fetchProfile() async {
    final id = widget.student['id'];
    if (id == null) {
      setState(() => _isLoading = false);
      return;
    }

    try {
      final result = await ApiService.getStudentById(id);
      if (mounted) {
        setState(() {
          _studentDetails = result['success'] ? result['data'] : widget.student;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _studentDetails = widget.student;
          _isLoading = false;
        });
      }
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _launchUrl(String scheme, String value) async {
    if (value.isEmpty || value == 'N/A') return;
    final cleanValue = value.replaceAll(RegExp(r'[^\d+]'), '');
    final url = Uri.parse(scheme == 'tel' ? 'tel:$cleanValue' : scheme == 'whatsapp' ? 'https://wa.me/$cleanValue' : 'mailto:$value');
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    } else {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not open App')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = _studentDetails ?? widget.student;
    final user = s['user'] ?? {};
    final classInfo = s['class'] ?? {};
    final name = user['name'] ?? 'Unknown Student';
    final photoUrl = user['photoUrl'];
    final image = photoUrl?.isNotEmpty == true
        ? photoUrl
        : 'https://ui-avatars.com/api/?name=${Uri.encodeComponent(name)}&background=E2E8F0&color=1E293B';
    final rollNo = s['rollNo'] ?? 'N/A';
    final admissionNo = s['admissionNo'] ?? 'N/A';
    final className = '${classInfo['name'] ?? ''} ${classInfo['section'] ?? ''}'.trim();
    
    // Guardian Contacts
    final fatherPhone = s['fatherPhone'] ?? '';
    final motherPhone = s['motherPhone'] ?? '';
    final guardianPhone = s['guardianPhone'] ?? '';
    final primaryPhone = user['phone'] ?? fatherPhone.isNotEmpty ? fatherPhone : motherPhone.isNotEmpty ? motherPhone : guardianPhone;

    return Scaffold(
      backgroundColor: const Color(0xFFF4F7FE),
      body: NestedScrollView(
        headerSliverBuilder: (context, innerBoxIsScrolled) {
          return [
            _buildSliverAppBar(name, image, className, rollNo, admissionNo),
            SliverPersistentHeader(
              pinned: true,
              delegate: _SliverAppBarDelegate(
                TabBar(
                  controller: _tabController,
                  labelColor: const Color(0xFF6366F1),
                  unselectedLabelColor: const Color(0xFF64748B),
                  indicatorColor: const Color(0xFF6366F1),
                  indicatorWeight: 3,
                  labelStyle: GoogleFonts.outfit(fontWeight: FontWeight.bold),
                  tabs: const [
                    Tab(text: 'Profile'),
                    Tab(text: 'Family'),
                    Tab(text: 'Fees'),
                  ],
                ),
              ),
            ),
          ];
        },
        body: _isLoading 
            ? const Center(child: CircularProgressIndicator(color: Color(0xFF6366F1)))
            : TabBarView(
                controller: _tabController,
                children: [
                  _buildProfileTab(s, user),
                  _buildFamilyTab(s),
                  _buildFeesTab(s),
                ],
              ),
      ),
      floatingActionButton: primaryPhone.isNotEmpty && primaryPhone != 'N/A'
          ? FloatingActionButton(
              onPressed: () => _launchUrl('whatsapp', primaryPhone),
              backgroundColor: const Color(0xFF22C55E),
              child: const Icon(Icons.chat_bubble_rounded, color: Colors.white),
            )
          : null,
    );
  }

  Widget _buildSliverAppBar(String name, String image, String className, String rollNo, String admissionNo) {
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
            Positioned(right: -50, top: -50, child: CircleAvatar(radius: 100, backgroundColor: Colors.white.withOpacity(0.05))),
            Positioned(left: -30, bottom: -20, child: CircleAvatar(radius: 60, backgroundColor: Colors.white.withOpacity(0.05))),
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
                      boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.2), blurRadius: 15, offset: const Offset(0, 8))],
                    ),
                    child: CircleAvatar(radius: 50, backgroundColor: const Color(0xFFE2E8F0), backgroundImage: NetworkImage(image)),
                  ),
                  const SizedBox(height: 16),
                  Text(name, style: GoogleFonts.outfit(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _buildHeaderBadge(className, const Color(0xFF10B981)),
                      const SizedBox(width: 8),
                      _buildHeaderBadge('Roll: $rollNo', const Color(0xFF3B82F6)),
                      const SizedBox(width: 8),
                      _buildHeaderBadge('Adm: $admissionNo', const Color(0xFF8B5CF6)),
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
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.2),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.5)),
      ),
      child: Text(text, style: GoogleFonts.poppins(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600)),
    );
  }

  Widget _buildProfileTab(Map<String, dynamic> s, Map<String, dynamic> user) {
    final dob = s['dob'] != null ? DateTime.parse(s['dob']).toLocal().toString().split(' ')[0] : 'N/A';
    final gender = s['gender'] ?? 'N/A';
    final bloodGroup = s['bloodGroup'] ?? 'N/A';
    final religion = s['religion'] ?? 'N/A';
    final casteCategory = s['casteCategory'] ?? 'N/A';
    final email = user['email'] ?? 'Not provided';
    final address = s['address'] ?? 'Not provided';
    final admissionDate = s['admissionDate'] != null ? DateTime.parse(s['admissionDate']).toLocal().toString().split(' ')[0] : 'N/A';

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          _buildInfoCard('Personal Details', [
            _buildInfoRow(Icons.cake_rounded, 'Date of Birth', dob),
            _buildDivider(),
            _buildInfoRow(Icons.person_rounded, 'Gender', gender),
            _buildDivider(),
            _buildInfoRow(Icons.bloodtype_rounded, 'Blood Group', bloodGroup),
            _buildDivider(),
            _buildInfoRow(Icons.account_balance_rounded, 'Religion', religion),
            _buildDivider(),
            _buildInfoRow(Icons.category_rounded, 'Category', casteCategory),
          ]),
          const SizedBox(height: 16),
          _buildInfoCard('Contact & Academic', [
            _buildInfoRow(Icons.email_rounded, 'Email', email),
            _buildDivider(),
            _buildInfoRow(Icons.home_rounded, 'Address', address),
            _buildDivider(),
            _buildInfoRow(Icons.event_available_rounded, 'Admission Date', admissionDate),
            _buildDivider(),
            _buildInfoRow(Icons.receipt_long_rounded, 'RTE/Free Student', (s['isRTE'] == true) ? 'Yes' : 'No'),
          ]),
          const SizedBox(height: 80), // for FAB
        ],
      ),
    );
  }

  Widget _buildFamilyTab(Map<String, dynamic> s) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          _buildInfoCard('Father\'s Details', [
            _buildInfoRow(Icons.person_rounded, 'Name', s['fatherName'] ?? 'N/A'),
            _buildDivider(),
            _buildInfoRow(Icons.phone_rounded, 'Phone', s['fatherPhone'] ?? 'N/A', onTap: (s['fatherPhone'] != null) ? () => _launchUrl('tel', s['fatherPhone']) : null),
            _buildDivider(),
            _buildInfoRow(Icons.work_rounded, 'Occupation', s['fatherOccupation'] ?? 'N/A'),
          ]),
          const SizedBox(height: 16),
          _buildInfoCard('Mother\'s Details', [
            _buildInfoRow(Icons.person_rounded, 'Name', s['motherName'] ?? 'N/A'),
            _buildDivider(),
            _buildInfoRow(Icons.phone_rounded, 'Phone', s['motherPhone'] ?? 'N/A', onTap: (s['motherPhone'] != null) ? () => _launchUrl('tel', s['motherPhone']) : null),
            _buildDivider(),
            _buildInfoRow(Icons.work_rounded, 'Occupation', s['motherOccupation'] ?? 'N/A'),
          ]),
          const SizedBox(height: 16),
          _buildInfoCard('Guardian\'s Details', [
            _buildInfoRow(Icons.person_rounded, 'Name', s['guardianName'] ?? 'N/A'),
            _buildDivider(),
            _buildInfoRow(Icons.phone_rounded, 'Phone', s['guardianPhone'] ?? 'N/A', onTap: (s['guardianPhone'] != null) ? () => _launchUrl('tel', s['guardianPhone']) : null),
          ]),
          const SizedBox(height: 80),
        ],
      ),
    );
  }

  Widget _buildFeesTab(Map<String, dynamic> s) {
    final transactions = (s['feeTransactions'] as List?) ?? [];
    if (transactions.isEmpty) {
      return const Center(child: Text("No fee transactions available", style: TextStyle(color: Color(0xFF64748B))));
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16).copyWith(bottom: 80),
      itemCount: transactions.length,
      itemBuilder: (context, index) {
        final t = transactions[index];
        final amount = t['amount']?.toString() ?? '0';
        final method = t['paymentMethod'] ?? 'CASH';
        final date = t['date'] != null ? DateTime.parse(t['date']).toLocal().toString().split(' ')[0] : 'N/A';
        final receipt = t['receiptNo'] ?? 'N/A';

        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [BoxShadow(color: const Color(0xFF6366F1).withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 4))],
          ),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Center(child: Icon(Icons.currency_rupee_rounded, color: Color(0xFF059669))),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Amount Paid: ₹$amount', style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
                    const SizedBox(height: 4),
                    Text('$date  •  $method', style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF64748B))),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(color: const Color(0xFF3B82F6).withOpacity(0.1), borderRadius: BorderRadius.circular(6)),
                    child: Text(receipt, style: GoogleFonts.poppins(fontSize: 10, fontWeight: FontWeight.bold, color: const Color(0xFF2563EB))),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildInfoCard(String title, List<Widget> children) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: const Color(0xFF6366F1).withOpacity(0.08), blurRadius: 15, offset: const Offset(0, 5))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
          const SizedBox(height: 20),
          ...children,
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value, {VoidCallback? onTap}) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 4.0),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(10)),
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
}

class _SliverAppBarDelegate extends SliverPersistentHeaderDelegate {
  _SliverAppBarDelegate(this._tabBar);

  final TabBar _tabBar;

  @override
  double get minExtent => _tabBar.preferredSize.height;
  @override
  double get maxExtent => _tabBar.preferredSize.height;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, 2))],
      ),
      child: _tabBar,
    );
  }

  @override
  bool shouldRebuild(_SliverAppBarDelegate oldDelegate) {
    return false;
  }
}
