import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:intl/intl.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../services/api_service.dart';
import '../widgets/app_drawer.dart';

class GatePassScreen extends StatefulWidget {
  const GatePassScreen({super.key});

  @override
  State<GatePassScreen> createState() => _GatePassScreenState();
}

class _GatePassScreenState extends State<GatePassScreen> {
  int _currentIndex = 0;
  String? _userRole;

  @override
  void initState() {
    super.initState();
    _loadRole();
  }

  Future<void> _loadRole() async {
    final prefs = await SharedPreferences.getInstance();
    final userString = prefs.getString('user');
    if (userString != null) {
      setState(() {
        _userRole = jsonDecode(userString)['role'];
      });
    }
  }

  Widget _buildBody() {
    switch (_currentIndex) {
      case 0: return const _DashboardTab();
      case 1: return const _LiveListTab();
      case 2: return const _ApprovalsTab();
      case 3: return const _HistorySearchTab();
      case 4: return const _QRScannerTab();
      default: return const _DashboardTab();
    }
  }

  @override
  Widget build(BuildContext context) {
    final hasFullAccess = _userRole == 'SUPER_ADMIN' || _userRole == 'ADMIN' || _userRole == 'SECURITY';

    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      drawer: const AppDrawer(currentRoute: 'gatepass'),
      appBar: AppBar(
        leading: const BackButton(),
        title: Text(
          'Security Gate Pass',
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 18),
        ),
        iconTheme: const IconThemeData(color: Colors.white),
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF0F172A), Color(0xFF1E3A5F)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
        elevation: 0,
      ),
      body: hasFullAccess
          ? _buildBody()
          : const Center(child: Text("You don't have access to the security dashboard.")),
      bottomNavigationBar: hasFullAccess
          ? Container(
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 20, offset: const Offset(0, -4))],
              ),
              child: BottomNavigationBar(
                currentIndex: _currentIndex,
                onTap: (idx) => setState(() => _currentIndex = idx),
                type: BottomNavigationBarType.fixed,
                backgroundColor: Colors.transparent,
                elevation: 0,
                selectedItemColor: const Color(0xFF10B981),
                unselectedItemColor: const Color(0xFF94A3B8),
                selectedLabelStyle: GoogleFonts.poppins(fontSize: 10, fontWeight: FontWeight.bold),
                unselectedLabelStyle: GoogleFonts.poppins(fontSize: 10),
                items: const [
                  BottomNavigationBarItem(icon: Icon(Icons.dashboard_rounded), label: 'Dashboard'),
                  BottomNavigationBarItem(icon: Icon(Icons.directions_run_rounded), label: 'Live'),
                  BottomNavigationBarItem(icon: Icon(Icons.fact_check_rounded), label: 'Approvals'),
                  BottomNavigationBarItem(icon: Icon(Icons.history_rounded), label: 'History'),
                  BottomNavigationBarItem(icon: Icon(Icons.qr_code_scanner_rounded), label: 'Scanner'),
                ],
              ),
            )
          : null,
    );
  }
}

// ---------------------------------------------------------
// Tab 1: Dashboard â€” PREMIUM REDESIGN + REAL API
// ---------------------------------------------------------
class _DashboardTab extends StatefulWidget {
  const _DashboardTab();
  @override
  State<_DashboardTab> createState() => _DashboardTabState();
}

class _DashboardTabState extends State<_DashboardTab> with TickerProviderStateMixin {
  bool _loading = true;
  Map<String, dynamic> _studentStats = {'inside': 0, 'out': 0, 'pending': 0, 'overdue': 0};
  Map<String, dynamic> _staffStats = {'inside': 0, 'out': 0, 'pending': 0, 'overdue': 0};
  late AnimationController _pulseController;
  late Animation<double> _pulseAnim;
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _pulseController = AnimationController(vsync: this, duration: const Duration(milliseconds: 900))
      ..repeat(reverse: true);
    _pulseAnim = Tween<double>(begin: 0.85, end: 1.15).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
    
    // Refresh UI when tab changes
    _tabController.addListener(() {
      if (!_tabController.indexIsChanging) setState(() {});
    });
    
    _fetchStats();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  Future<void> _fetchStats() async {
    setState(() => _loading = true);
    try {
      final res = await ApiService.getGatePassStats();
      if (mounted) {
        final data = res['data'] ?? {};
        setState(() {
          _studentStats = data['student'] ?? {
            'inside': data['inside'] ?? 0,
            'out': data['out'] ?? 0,
            'pending': data['pending'] ?? 0,
            'overdue': data['overdue'] ?? 0,
          };
          _staffStats = data['staff'] ?? {
            'inside': 0, 'out': 0, 'pending': 0, 'overdue': 0
          };
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(
        child: CircularProgressIndicator(color: Color(0xFF10B981)),
      );
    }

    final isStudentTab = _tabController.index == 0;
    final stats = isStudentTab ? _studentStats : _staffStats;
    
    final int _inside = stats['inside'] ?? 0;
    final int _out = stats['out'] ?? 0;
    final int _pending = stats['pending'] ?? 0;
    final int _overdue = stats['overdue'] ?? 0;

    return Column(
      children: [
        Container(
          color: Colors.white,
          child: TabBar(
            controller: _tabController,
            labelColor: const Color(0xFF10B981),
            unselectedLabelColor: const Color(0xFF94A3B8),
            indicatorColor: const Color(0xFF10B981),
            labelStyle: GoogleFonts.poppins(fontWeight: FontWeight.bold),
            tabs: const [
              Tab(text: 'Students'),
              Tab(text: 'Teachers'),
            ],
          ),
        ),
        Expanded(
          child: RefreshIndicator(
            onRefresh: _fetchStats,
            color: const Color(0xFF10B981),
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: Column(
                children: [
                  // â”€â”€ Hero Stats Header â”€â”€
                  Container(
                    width: double.infinity,
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Color(0xFF0F172A), Color(0xFF1E3A5F)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                    child: SafeArea(
                      top: false,
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(20, 24, 20, 32),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF10B981).withOpacity(0.2),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: const Icon(Icons.sensors, color: Color(0xFF10B981), size: 18),
                                ),
                                const SizedBox(width: 10),
                                Text(
                                  'LIVE CAMPUS STATUS',
                                  style: GoogleFonts.poppins(
                                    color: const Color(0xFF10B981),
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    letterSpacing: 1.5,
                                  ),
                                ),
                                const Spacer(),
                                Text(
                                  DateFormat('hh:mm a').format(DateTime.now()),
                                  style: GoogleFonts.outfit(color: Colors.white54, fontSize: 13),
                                ),
                              ],
                            ),
                            const SizedBox(height: 24),
                            // Big stat row
                            Row(
                              children: [
                                _buildHeroStat(
                                  value: _inside,
                                  label: 'INSIDE',
                                  icon: Icons.domain_rounded,
                                  color: const Color(0xFF10B981),
                                ),
                                const SizedBox(width: 1),
                                Container(width: 1, height: 60, color: Colors.white10),
                                const SizedBox(width: 1),
                                _buildHeroStat(
                                  value: _out,
                                  label: 'CURRENTLY OUT',
                                  icon: Icons.directions_run_rounded,
                                  color: const Color(0xFFF59E0B),
                                ),
                                const SizedBox(width: 1),
                                Container(width: 1, height: 60, color: Colors.white10),
                                const SizedBox(width: 1),
                                _buildHeroStat(
                                  value: _pending,
                                  label: 'PENDING',
                                  icon: Icons.pending_actions_rounded,
                                  color: const Color(0xFF6366F1),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),

            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // â”€â”€ Overdue Alert â”€â”€
                  if (_overdue > 0)
                    ScaleTransition(
                      scale: _pulseAnim,
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 20),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFFFF3D5E), Color(0xFFFF6B82)],
                          ),
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFFFF3D5E).withOpacity(0.4),
                              blurRadius: 20,
                              offset: const Offset(0, 8),
                            )
                          ],
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(Icons.warning_rounded, color: Colors.white, size: 28),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'âš ï¸   CRITICAL OVER-STAY',
                                    style: GoogleFonts.outfit(
                                      color: Colors.white,
                                      fontSize: 15,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    '$_overdue ${_overdue == 1 ? 'person has' : 'people have'} not returned by expected time!',
                                    style: GoogleFonts.poppins(
                                      color: Colors.white.withOpacity(0.9),
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                  // â”€â”€ Section Title â”€â”€
                  Text(
                    'Today\'s Overview',
                    style: GoogleFonts.outfit(
                      color: const Color(0xFF1E293B),
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 14),

                  // â”€â”€ 4 Metric Cards â”€â”€
                  GridView.count(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisCount: 2,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    childAspectRatio: 1.4,
                    children: [
                      _buildMetricCard(
                        title: 'Inside Campus',
                        value: '$_inside',
                        icon: Icons.domain_rounded,
                        gradientColors: [const Color(0xFF10B981), const Color(0xFF34D399)],
                        subtitle: isStudentTab ? 'Students' : 'Teachers',
                      ),
                      _buildMetricCard(
                        title: 'Currently Out',
                        value: '$_out',
                        icon: Icons.directions_run_rounded,
                        gradientColors: [const Color(0xFFF59E0B), const Color(0xFFFBBF24)],
                        subtitle: 'With active pass',
                      ),
                      _buildMetricCard(
                        title: 'Pending',
                        value: '$_pending',
                        icon: Icons.pending_actions_rounded,
                        gradientColors: [const Color(0xFF6366F1), const Color(0xFF818CF8)],
                        subtitle: 'Awaiting approval',
                        hasBadge: _pending > 0,
                      ),
                      _buildMetricCard(
                        title: 'Overdue',
                        value: '$_overdue',
                        icon: Icons.timer_off_rounded,
                        gradientColors: _overdue > 0
                            ? [const Color(0xFFEF4444), const Color(0xFFF87171)]
                            : [const Color(0xFF64748B), const Color(0xFF94A3B8)],
                        subtitle: _overdue > 0 ? 'URGENT!' : 'All on time',
                      ),
                    ],
                  ),

                  const SizedBox(height: 20),

                  // â”€â”€ Quick Actions â”€â”€
                  Text(
                    'Quick Actions',
                    style: GoogleFonts.outfit(
                      color: const Color(0xFF1E293B),
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _buildActionButton(
                          label: 'View Live List',
                          icon: Icons.directions_run_rounded,
                          color: const Color(0xFFF59E0B),
                          onTap: () {},
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildActionButton(
                          label: 'Scan QR Code',
                          icon: Icons.qr_code_scanner_rounded,
                          color: const Color(0xFF10B981),
                          onTap: () {},
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    ),
  ),
],
);
}

  Widget _buildHeroStat({required int value, required String label, required IconData icon, required Color color}) {
    return Expanded(
      child: Column(
        children: [
          Icon(icon, color: color, size: 22),
          const SizedBox(height: 6),
          Text(
            '$value',
            style: GoogleFonts.outfit(
              color: Colors.white,
              fontSize: 30,
              fontWeight: FontWeight.w900,
            ),
          ),
          Text(
            label,
            style: GoogleFonts.poppins(
              color: Colors.white54,
              fontSize: 8.5,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.8,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildMetricCard({
    required String title,
    required String value,
    required IconData icon,
    required List<Color> gradientColors,
    required String subtitle,
    bool hasBadge = false,
  }) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: gradientColors,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: gradientColors[0].withOpacity(0.35),
            blurRadius: 14,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Stack(
        clipBehavior: Clip.hardEdge,
        children: [
          Positioned(
            right: -10,
            bottom: -10,
            child: Icon(icon, size: 70, color: Colors.white.withOpacity(0.12)),
          ),
          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(7),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.25),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Icon(icon, color: Colors.white, size: 18),
                    ),
                    if (hasBadge)
                      Container(
                        width: 10,
                        height: 10,
                        decoration: const BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                        ),
                      ),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      value,
                      style: GoogleFonts.outfit(
                        color: Colors.white,
                        fontSize: 26,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    Text(
                      title,
                      style: GoogleFonts.poppins(
                        color: Colors.white.withOpacity(0.9),
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      subtitle,
                      style: GoogleFonts.poppins(
                        color: Colors.white.withOpacity(0.65),
                        fontSize: 9,
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

  Widget _buildActionButton({
    required String label,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: color.withOpacity(0.15),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withOpacity(0.12),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(height: 8),
            Text(
              label,
              style: GoogleFonts.poppins(
                color: const Color(0xFF1E293B),
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------
// Tab 2: Live List (Currently Out) â€” REAL API
// ---------------------------------------------------------
class _LiveListTab extends StatefulWidget {
  const _LiveListTab();
  @override
  State<_LiveListTab> createState() => _LiveListTabState();
}

class _LiveListTabState extends State<_LiveListTab> {
  bool _loading = true;
  List<dynamic> _activePasses = [];

  @override
  void initState() {
    super.initState();
    _fetchLiveList();
  }

  Future<void> _fetchLiveList() async {
    setState(() => _loading = true);
    try {
      final res = await ApiService.getGatePasses(status: 'ACTIVE');
      if (mounted) {
        setState(() {
          _activePasses = res['data'] ?? [];
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }



  Widget _buildList(List<dynamic> passes, bool isStudentTab) {
    final filtered = passes.where((p) => (p['requestType'] == 'STUDENT') == isStudentTab).toList();

    if (filtered.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(28),
              decoration: BoxDecoration(
                color: const Color(0xFF10B981).withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.verified_user_rounded, size: 64, color: Color(0xFF10B981)),
            ),
            const SizedBox(height: 16),
            Text("All Clear!", style: GoogleFonts.outfit(color: const Color(0xFF1E293B), fontSize: 22, fontWeight: FontWeight.w800)),
            const SizedBox(height: 6),
            Text(isStudentTab ? "No active student passes" : "No active staff passes", style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 14)),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: filtered.length,
      itemBuilder: (context, index) {
        final pass = filtered[index];
        final name = isStudentTab
            ? ((pass['student'] as Map?)?['user']?['name'] ?? 'Unknown')
            : ((pass['requester'] as Map?)?['name'] ?? 'Unknown');
        final dept = isStudentTab
            ? 'Class ${(pass['student'] as Map?)?['class']?['name'] ?? ''} ${(pass['student'] as Map?)?['class']?['section'] ?? ''}'
            : 'Staff';
        final photoUrl = isStudentTab 
            ? (pass['student'] as Map?)?['user']?['photoUrl'] 
            : (pass['requester'] as Map?)?['photoUrl'];
        final approvedBy = (pass['approvedBy'] as Map?)?['name'] ?? 'Pending';

        final exitTimeStr = pass['actualExitTime'] ?? pass['exitTime'];
        final exitTime = exitTimeStr != null
            ? DateFormat('hh:mm a').format(DateTime.parse(exitTimeStr).toLocal())
            : '--';

        final expectedStr = pass['expectedReturnTime'];
        final expectedTime = expectedStr != null
            ? DateFormat('hh:mm a').format(DateTime.parse(expectedStr).toLocal())
            : '--';

        final isOverdue = expectedStr != null &&
            DateTime.parse(expectedStr).isBefore(DateTime.now());

        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: isOverdue
                ? Border.all(color: const Color(0xFFEF4444), width: 1.5)
                : null,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 12,
                offset: const Offset(0, 4),
              )
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 24,
                  backgroundColor: isOverdue
                      ? const Color(0xFFEF4444).withOpacity(0.1)
                      : const Color(0xFFF59E0B).withOpacity(0.1),
                  backgroundImage: (photoUrl != null && photoUrl.isNotEmpty) ? NetworkImage(photoUrl) : null,
                  child: (photoUrl == null || photoUrl.isEmpty)
                      ? Icon(
                          isStudentTab ? Icons.person_rounded : Icons.badge_rounded,
                          color: isOverdue ? const Color(0xFFEF4444) : const Color(0xFFF59E0B),
                          size: 26,
                        )
                      : null,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(name, style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 15)),
                          ),
                          if (isOverdue)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: const Color(0xFFEF4444),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text('OVERDUE', style: GoogleFonts.poppins(color: Colors.white, fontSize: 8, fontWeight: FontWeight.w800)),
                            ),
                        ],
                      ),
                      Text(dept, style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 11)),
                      const SizedBox(height: 4),
                      Text('Approved By: $approvedBy', style: GoogleFonts.poppins(color: const Color(0xFF10B981), fontSize: 10, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          Icon(Icons.login_rounded, size: 13, color: const Color(0xFFF59E0B)),
                          const SizedBox(width: 4),
                          Text('Out: $exitTime', style: GoogleFonts.poppins(fontSize: 11, color: const Color(0xFFB45309), fontWeight: FontWeight.w600)),
                          const SizedBox(width: 12),
                          Icon(Icons.timer_rounded, size: 13, color: const Color(0xFF64748B)),
                          const SizedBox(width: 4),
                          Text('Return by: $expectedTime', style: GoogleFonts.poppins(fontSize: 11, color: const Color(0xFF64748B))),
                        ],
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () => printGatePass(context, pass),
                  icon: const Icon(Icons.print_rounded, color: Color(0xFF64748B)),
                  tooltip: 'Print Pass',
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator(color: Color(0xFF10B981)));

    return DefaultTabController(
      length: 2,
      child: Column(
        children: [
          Container(
            color: Colors.white,
            child: TabBar(
              labelColor: const Color(0xFF10B981),
              unselectedLabelColor: const Color(0xFF94A3B8),
              indicatorColor: const Color(0xFF10B981),
              labelStyle: GoogleFonts.poppins(fontWeight: FontWeight.bold),
              tabs: const [
                Tab(text: "Students"),
                Tab(text: "Staff"),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
            color: const Color(0xFFF59E0B).withOpacity(0.08),
            child: Row(
              children: [
                Container(
                  width: 8, height: 8,
                  decoration: const BoxDecoration(color: Color(0xFFF59E0B), shape: BoxShape.circle),
                ),
                const SizedBox(width: 8),
                Text(
                  '${_activePasses.length} people currently OUTSIDE campus',
                  style: GoogleFonts.poppins(
                    color: const Color(0xFFB45309),
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: _fetchLiveList,
              color: const Color(0xFF10B981),
              child: TabBarView(
                children: [
                  _buildList(_activePasses, true),
                  _buildList(_activePasses, false),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------
// Tab 3: Approvals â€” REAL API
// ---------------------------------------------------------
class _ApprovalsTab extends StatefulWidget {
  const _ApprovalsTab();
  @override
  State<_ApprovalsTab> createState() => _ApprovalsTabState();
}

class _ApprovalsTabState extends State<_ApprovalsTab> {
  bool _loading = true;
  List<dynamic> _pendingPasses = [];

  @override
  void initState() {
    super.initState();
    _fetchPending();
  }

  Future<void> _fetchPending() async {
    setState(() => _loading = true);
    try {
      final res = await ApiService.getGatePasses(status: 'PENDING');
      if (mounted) {
        setState(() {
          _pendingPasses = res['data'] ?? [];
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _updateStatus(String id, String status) async {
    try {
      await ApiService.updateGatePass(id, {'status': status});
      _fetchPending();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('Request ${status.toLowerCase()} successfully'),
          backgroundColor: status == 'APPROVED' ? Colors.green : Colors.red,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ));
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  Widget _buildList(List<dynamic> passes, bool isStudentTab) {
    final filtered = passes.where((p) => (p['requestType'] == 'STUDENT') == isStudentTab).toList();

    if (filtered.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(28),
              decoration: BoxDecoration(
                color: const Color(0xFF6366F1).withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.inbox_rounded, size: 64, color: Color(0xFF6366F1)),
            ),
            const SizedBox(height: 16),
            Text("All Cleared!", style: GoogleFonts.outfit(color: const Color(0xFF1E293B), fontSize: 22, fontWeight: FontWeight.w800)),
            const SizedBox(height: 6),
            Text("No pending gate pass requests", style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 14)),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: filtered.length,
      itemBuilder: (context, index) {
        final pass = filtered[index];
        final name = isStudentTab
            ? ((pass['student'] as Map?)?['user']?['name'] ?? 'Unknown')
            : ((pass['requester'] as Map?)?['name'] ?? 'Unknown');
        final dept = isStudentTab ? 'Class ${(pass['student'] as Map?)?['class']?['name'] ?? ''}' : 'Staff';
        final photoUrl = isStudentTab 
            ? (pass['student'] as Map?)?['user']?['photoUrl'] 
            : (pass['requester'] as Map?)?['photoUrl'];

        return Container(
          margin: const EdgeInsets.only(bottom: 14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 12, offset: const Offset(0, 4))],
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    CircleAvatar(
                      backgroundColor: const Color(0xFF6366F1).withOpacity(0.1),
                      radius: 22,
                      backgroundImage: (photoUrl != null && photoUrl.isNotEmpty) ? NetworkImage(photoUrl) : null,
                      child: (photoUrl == null || photoUrl.isEmpty)
                          ? Icon(isStudentTab ? Icons.person_rounded : Icons.badge_rounded, color: const Color(0xFF6366F1), size: 22)
                          : null,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(name, style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16)),
                          Text(dept, style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 12)),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFF6366F1).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text('PENDING', style: GoogleFonts.poppins(color: const Color(0xFF4338CA), fontSize: 9, fontWeight: FontWeight.w700)),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(children: [
                        const Icon(Icons.description_outlined, size: 14, color: Color(0xFF64748B)),
                        const SizedBox(width: 6),
                        Expanded(child: Text("${pass['reason'] ?? 'Not specified'}", style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF475569)))),
                      ]),
                      if (pass['destination'] != null) ...[
                        const SizedBox(height: 6),
                        Row(children: [
                          const Icon(Icons.location_on_outlined, size: 14, color: Color(0xFF64748B)),
                          const SizedBox(width: 6),
                          Text("${pass['destination']}", style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF475569))),
                        ]),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 14),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => _updateStatus(pass['id'], 'REJECTED'),
                        icon: const Icon(Icons.close_rounded, size: 16),
                        label: const Text('Reject'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: const Color(0xFFEF4444),
                          side: const BorderSide(color: Color(0xFFEF4444)),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () => _updateStatus(pass['id'], 'APPROVED'),
                        icon: const Icon(Icons.check_rounded, size: 16, color: Colors.white),
                        label: const Text('Approve', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF10B981),
                          elevation: 0,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator(color: Color(0xFF6366F1)));

    return DefaultTabController(
      length: 2,
      child: Column(
        children: [
          Container(
            color: Colors.white,
            child: TabBar(
              labelColor: const Color(0xFF6366F1),
              unselectedLabelColor: const Color(0xFF94A3B8),
              indicatorColor: const Color(0xFF6366F1),
              labelStyle: GoogleFonts.poppins(fontWeight: FontWeight.bold),
              tabs: const [
                Tab(text: "Students"),
                Tab(text: "Staff"),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
            color: const Color(0xFF6366F1).withOpacity(0.08),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${_pendingPasses.length} Requests Pending Approval',
                  style: GoogleFonts.poppins(color: const Color(0xFF4338CA), fontSize: 12, fontWeight: FontWeight.w700),
                ),
              ],
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: _fetchPending,
              color: const Color(0xFF6366F1),
              child: TabBarView(
                children: [
                  _buildList(_pendingPasses, true),
                  _buildList(_pendingPasses, false),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------
// Tab 4: History / Search â€” REAL API
// ---------------------------------------------------------
class _HistorySearchTab extends StatefulWidget {
  const _HistorySearchTab();
  @override
  State<_HistorySearchTab> createState() => _HistorySearchTabState();
}

class _HistorySearchTabState extends State<_HistorySearchTab> {
  final TextEditingController _searchCtrl = TextEditingController();
  bool _loading = false;
  List<dynamic> _history = [];
  List<dynamic> _filtered = [];

  Future<void> _fetchHistory() async {
    setState(() => _loading = true);
    try {
      final res = await ApiService.getGatePasses();
      if (mounted) {
        setState(() {
          _history = res['data'] ?? [];
          _filtered = _history;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _filterList(String query) {
    setState(() {
      _filtered = _history.where((pass) {
        final isStudent = pass['requestType'] == 'STUDENT';
        final name = (isStudent
                ? (pass['student']?['user']?['name'] ?? '')
                : (pass['requester']?['name'] ?? ''))
            .toLowerCase();
        return name.contains(query.toLowerCase());
      }).toList();
    });
  }

  @override
  void initState() {
    super.initState();
    _fetchHistory();
  }

  Widget _buildList(List<dynamic> items, bool isStudentTab, Map<String, Color> statusColor) {
    final filtered = items.where((p) => (p['requestType'] == 'STUDENT') == isStudentTab).toList();

    if (filtered.isEmpty) {
      return Center(
        child: Text("No records found",
            style: GoogleFonts.outfit(color: const Color(0xFF64748B), fontSize: 16)),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: filtered.length,
      itemBuilder: (context, index) {
        final pass = filtered[index];
        final name = isStudentTab
            ? ((pass['student'] as Map?)?['user']?['name'] ?? 'Unknown')
            : ((pass['requester'] as Map?)?['name'] ?? 'Unknown');
        final photoUrl = isStudentTab 
            ? (pass['student'] as Map?)?['user']?['photoUrl'] 
            : (pass['requester'] as Map?)?['photoUrl'];
        final status = pass['status'] ?? 'UNKNOWN';
        final color = statusColor[status] ?? Colors.grey;
        final date = pass['createdAt'] != null
            ? DateFormat('dd MMM, hh:mm a').format(DateTime.parse(pass['createdAt']).toLocal())
            : '--';

        final approvedBy = pass['approvedBy'] != null ? (pass['approvedBy']['name'] ?? 'Unknown') : null;
        
        return Container(
          margin: const EdgeInsets.only(bottom: 10),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 8, offset: const Offset(0, 3))],
          ),
          child: ListTile(
            onTap: () => _showGatePassSlipDialog(context, pass, isStudentTab, color),
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
            leading: CircleAvatar(
              backgroundColor: color.withOpacity(0.12),
              backgroundImage: (photoUrl != null && photoUrl.isNotEmpty) ? NetworkImage(photoUrl) : null,
              child: (photoUrl == null || photoUrl.isEmpty)
                  ? Icon(
                      isStudentTab ? Icons.person_rounded : Icons.badge_rounded,
                      color: color, size: 20,
                    )
                  : null,
            ),
            title: Text(name, style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 14)),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(date, style: GoogleFonts.poppins(fontSize: 11, color: const Color(0xFF94A3B8))),
                if (approvedBy != null && status != 'PENDING')
                  Text('Approved by: $approvedBy', style: GoogleFonts.poppins(fontSize: 10, color: const Color(0xFF10B981))),
              ],
            ),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (status == 'APPROVED' || status == 'ACTIVE' || status == 'COMPLETED')
                  IconButton(
                    icon: Icon(Icons.print_rounded, size: 20, color: color),
                    onPressed: () => printGatePass(context, pass),
                    tooltip: 'Print Pass',
                  ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    status,
                    style: GoogleFonts.poppins(
                      color: color,
                      fontSize: 9,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _showGatePassSlipDialog(BuildContext context, dynamic pass, bool isStudentTab, Color statusColor) {
    final name = isStudentTab
        ? ((pass['student'] as Map?)?['user']?['name'] ?? 'Unknown')
        : ((pass['requester'] as Map?)?['name'] ?? 'Unknown');
    final photoUrl = isStudentTab 
        ? (pass['student'] as Map?)?['user']?['photoUrl'] 
        : (pass['requester'] as Map?)?['photoUrl'];
    final destination = pass['destination'] ?? 'N/A';
    final reason = pass['reason'] ?? 'N/A';
    final slipNumber = pass['slipNumber'] ?? 'N/A';
    final status = pass['status'] ?? 'UNKNOWN';
    final rawPhone = isStudentTab
        ? ((pass['student'] as Map?)?['user']?['phoneNumber'] ?? '')
        : ((pass['requester'] as Map?)?['phoneNumber'] ?? '');
    
    // Mask phone number to show only last 4 digits
    final String maskedPhone = (rawPhone.length >= 4) 
        ? 'xxxx ${rawPhone.substring(rawPhone.length - 4)}' 
        : (rawPhone.isNotEmpty ? rawPhone : 'N/A');

    final approvedBy = pass['approvedBy'] != null ? (pass['approvedBy']['name'] ?? 'Unknown') : 'Pending';

    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        backgroundColor: Colors.transparent,
        child: Container(
          width: 340,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 30,
                offset: const Offset(0, 10),
              )
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Header
              Container(
                padding: const EdgeInsets.symmetric(vertical: 16),
                decoration: const BoxDecoration(
                  color: Color(0xFF0F172A),
                  borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.verified_user_rounded, color: Color(0xFF10B981), size: 24),
                    const SizedBox(width: 8),
                    Text(
                      'GATE PASS SLIP',
                      style: GoogleFonts.outfit(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.5,
                      ),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                    // Photo & Name
                    Row(
                      children: [
                        Container(
                          width: 70,
                          height: 70,
                          decoration: BoxDecoration(
                            color: const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(16),
                            image: (photoUrl != null && photoUrl.isNotEmpty)
                                ? DecorationImage(image: NetworkImage(photoUrl), fit: BoxFit.cover)
                                : null,
                          ),
                          child: (photoUrl == null || photoUrl.isEmpty)
                              ? Icon(isStudentTab ? Icons.person : Icons.badge, color: const Color(0xFF94A3B8), size: 30)
                              : null,
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                name,
                                style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 18, color: const Color(0xFF1E293B)),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                isStudentTab ? 'Student' : 'Staff',
                                style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 13),
                              ),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  const Icon(Icons.phone_rounded, size: 14, color: Color(0xFF94A3B8)),
                                  const SizedBox(width: 4),
                                  Text(maskedPhone, style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 13, fontWeight: FontWeight.w600)),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    
                    // Details Grid
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Column(
                        children: [
                          _buildDetailRow('Slip Number', slipNumber),
                          const Divider(height: 20, color: Color(0xFFE2E8F0)),
                          _buildDetailRow('Destination', destination),
                          const Divider(height: 20, color: Color(0xFFE2E8F0)),
                          _buildDetailRow('Reason', reason),
                          const Divider(height: 20, color: Color(0xFFE2E8F0)),
                          _buildDetailRow('Approved By', approvedBy),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // QR Code
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4))
                        ],
                      ),
                      child: QrImageView(
                        data: slipNumber,
                        version: QrVersions.auto,
                        size: 100.0,
                        eyeStyle: QrEyeStyle(eyeShape: QrEyeShape.square, color: Color(0xFF1E293B)),
                        dataModuleStyle: QrDataModuleStyle(dataModuleShape: QrDataModuleShape.square, color: Color(0xFF1E293B)),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                      decoration: BoxDecoration(
                        color: statusColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        status,
                        style: GoogleFonts.poppins(color: statusColor, fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                    ),
                  ],
                ),
              ),
              // Close / Print buttons
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                decoration: const BoxDecoration(
                  color: Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.vertical(bottom: Radius.circular(24)),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: TextButton(
                        onPressed: () => Navigator.pop(ctx),
                        style: TextButton.styleFrom(
                          foregroundColor: const Color(0xFF64748B),
                        ),
                        child: Text('Close', style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
                      ),
                    ),
                    if (status == 'APPROVED' || status == 'ACTIVE' || status == 'COMPLETED')
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () {
                            Navigator.pop(ctx);
                            printGatePass(context, pass);
                          },
                          icon: const Icon(Icons.print_rounded, size: 18, color: Colors.white),
                          label: Text('Print', style: GoogleFonts.poppins(fontWeight: FontWeight.w600, color: Colors.white)),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF10B981),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            elevation: 0,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 90,
          child: Text(
            label,
            style: GoogleFonts.poppins(color: const Color(0xFF94A3B8), fontSize: 12),
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: GoogleFonts.poppins(color: const Color(0xFF1E293B), fontSize: 12, fontWeight: FontWeight.w600),
            textAlign: TextAlign.right,
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final statusColor = {
      'APPROVED': Colors.green,
      'COMPLETED': const Color(0xFF3B82F6),
      'REJECTED': const Color(0xFFEF4444),
      'PENDING': const Color(0xFFF59E0B),
      'ACTIVE': const Color(0xFF10B981),
    };

    if (_loading) return const Center(child: CircularProgressIndicator(color: Color(0xFF6366F1)));

    return DefaultTabController(
      length: 2,
      child: Column(
        children: [
          Container(
            color: Colors.white,
            child: TabBar(
              labelColor: const Color(0xFF6366F1),
              unselectedLabelColor: const Color(0xFF94A3B8),
              indicatorColor: const Color(0xFF6366F1),
              labelStyle: GoogleFonts.poppins(fontWeight: FontWeight.bold),
              tabs: const [
                Tab(text: "Students"),
                Tab(text: "Staff"),
              ],
            ),
          ),
          Container(
            color: Colors.white,
            padding: const EdgeInsets.all(14),
            child: TextField(
              controller: _searchCtrl,
              onChanged: _filterList,
              decoration: InputDecoration(
                hintText: 'Search by name...',
                hintStyle: GoogleFonts.poppins(color: const Color(0xFF94A3B8), fontSize: 13),
                prefixIcon: const Icon(Icons.search_rounded, color: Color(0xFF94A3B8)),
                filled: true,
                fillColor: const Color(0xFFF1F5F9),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                contentPadding: const EdgeInsets.symmetric(vertical: 14),
              ),
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: _fetchHistory,
              color: const Color(0xFF6366F1),
              child: TabBarView(
                children: [
                  _buildList(_filtered, true, statusColor),
                  _buildList(_filtered, false, statusColor),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------
// Tab 5: QR Scanner
// ---------------------------------------------------------
class _QRScannerTab extends StatefulWidget {
  const _QRScannerTab();
  @override
  State<_QRScannerTab> createState() => _QRScannerTabState();
}

class _QRScannerTabState extends State<_QRScannerTab> {
  bool _isScanning = false;
  MobileScannerController cameraController = MobileScannerController();

  @override
  void dispose() {
    cameraController.dispose();
    super.dispose();
  }

  void _onDetect(BarcodeCapture capture) async {
    final List<Barcode> barcodes = capture.barcodes;
    if (barcodes.isNotEmpty) {
      final String? code = barcodes.first.rawValue;
      if (code != null) {
        cameraController.stop();
        setState(() {
          _isScanning = false;
        });
        
        // Assume code is the gate pass ID
        _handleScannedCode(code);
      }
    }
  }

  Future<void> _handleScannedCode(String id) async {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => const Center(child: CircularProgressIndicator(color: Color(0xFF10B981))),
    );

    try {
      // First get the pass details to see current status
      final res = await ApiService.getGatePasses();
      final passes = res['data'] as List<dynamic>? ?? [];
      final pass = passes.firstWhere((p) => p['id'] == id || p['slipNumber'] == id, orElse: () => null);

      if (mounted) Navigator.pop(context); // close loader

      if (pass == null) {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Gate Pass not found!')));
        return;
      }

      final status = pass['status'];
      String nextStatus = '';
      String actionText = '';

      if (status == 'APPROVED') {
        nextStatus = 'ACTIVE';
        actionText = 'Mark as EXITED';
      } else if (status == 'ACTIVE') {
        nextStatus = 'COMPLETED';
        actionText = 'Mark as RETURNED';
      } else {
        if (mounted) {
          showDialog(
            context: context,
            builder: (ctx) => AlertDialog(
              title: const Text('Invalid Status'),
              content: Text('This gate pass is currently $status and cannot be scanned for exit/return.'),
              actions: [TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('OK'))],
            ),
          );
        }
        return;
      }

      if (mounted) {
        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Gate Pass Scanned'),
            content: Text("Pass for ${pass['requestType'] == 'STUDENT' ? (pass['student'] as Map?)?['user']?['name'] : (pass['requester'] as Map?)?['name']}\nCurrent Status: $status\n\nDo you want to $actionText?"),
            actions: [
              TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
              ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981)),
                onPressed: () async {
                  Navigator.pop(ctx);
                  await ApiService.updateGatePass(pass['id'], {'status': nextStatus});
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Gate pass marked as $nextStatus')));
                  }
                },
                child: Text(actionText, style: const TextStyle(color: Colors.white)),
              ),
            ],
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isScanning) {
      return Stack(
        children: [
          MobileScanner(
            controller: cameraController,
            onDetect: _onDetect,
          ),
          Positioned(
            bottom: 40,
            left: 0,
            right: 0,
            child: Center(
              child: ElevatedButton.icon(
                onPressed: () {
                  cameraController.stop();
                  setState(() => _isScanning = false);
                },
                icon: const Icon(Icons.close, color: Colors.white),
                label: const Text('Cancel Scan', style: TextStyle(color: Colors.white)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.redAccent,
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                ),
              ),
            ),
          ),
        ],
      );
    }

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(36),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF10B981), Color(0xFF34D399)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(36),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF10B981).withOpacity(0.4),
                    blurRadius: 40,
                    offset: const Offset(0, 16),
                  ),
                ],
              ),
              child: const Icon(Icons.qr_code_scanner_rounded, size: 80, color: Colors.white),
            ),
            const SizedBox(height: 32),
            Text(
              "Security QR Scanner",
              style: GoogleFonts.outfit(color: const Color(0xFF1E293B), fontSize: 24, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 8),
            Text(
              "Scan student or staff ID card\nto log Gate IN / OUT instantly",
              style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 14, height: 1.6),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 40),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () {
                  setState(() {
                    _isScanning = true;
                  });
                  cameraController.start();
                },
                icon: const Icon(Icons.camera_alt_rounded, color: Colors.white),
                label: Text(
                  'TAP TO SCAN',
                  style: GoogleFonts.poppins(color: Colors.white, fontWeight: FontWeight.bold, letterSpacing: 1.2, fontSize: 15),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF10B981),
                  padding: const EdgeInsets.symmetric(vertical: 18),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                  elevation: 0,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

Future<void> printGatePass(BuildContext context, dynamic pass) async {
  try {
    final pdfBytes = await _buildPdfPass(pass);
    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => pdfBytes,
      name: 'GatePass_${pass['slipNumber'] ?? 'Unknown'}.pdf',
    );
  } catch (e) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Failed to print: $e')),
    );
  }
}

Future<Uint8List> _buildPdfPass(dynamic pass) async {
  final pdf = pw.Document();
  final isStudent = pass['requestType'] == 'STUDENT';
  final name = isStudent ? ((pass['student'] as Map?)?['user']?['name'] ?? 'Unknown') : ((pass['requester'] as Map?)?['name'] ?? 'Unknown');
  final slipNumber = pass['slipNumber'] ?? 'N/A';
  final destination = pass['destination'] ?? 'N/A';
  final reason = pass['reason'] ?? 'N/A';
  
  final rawPhone = isStudent
      ? ((pass['student'] as Map?)?['user']?['phoneNumber'] ?? '')
      : ((pass['requester'] as Map?)?['phoneNumber'] ?? '');
  final String maskedPhone = (rawPhone.length >= 4) ? 'xxxx ${rawPhone.substring(rawPhone.length - 4)}' : (rawPhone.isNotEmpty ? rawPhone : 'N/A');

  // Student specific
  final String classSec = isStudent && pass['student']?['class'] != null
      ? '${pass['student']['class']['className'] ?? pass['student']['class']['name'] ?? ''} - ${pass['student']['class']['section'] ?? ''}'.trim()
      : 'N/A';
  final String fatherName = isStudent ? (pass['student']?['fatherName'] ?? 'N/A') : 'N/A';

  // Staff specific
  final String designation = !isStudent ? (pass['requester']?['designation'] ?? 'Staff Member') : 'N/A';

  pw.ImageProvider? photoProvider;
  final photoUrl = isStudent ? ((pass['student'] as Map?)?['user']?['photoUrl']) : ((pass['requester'] as Map?)?['photoUrl']);
  if (photoUrl != null && photoUrl.isNotEmpty) {
    try {
      final fullUrl = ApiService.getImageUrl(photoUrl);
      photoProvider = await networkImage(fullUrl);
    } catch (e) {
      // Ignore image fetch error
    }
  }

  pdf.addPage(
    pw.Page(
      pageFormat: PdfPageFormat.a4.landscape,
      margin: const pw.EdgeInsets.all(24),
      build: (pw.Context context) {
        return pw.Row(
          mainAxisAlignment: pw.MainAxisAlignment.spaceEvenly,
          crossAxisAlignment: pw.CrossAxisAlignment.stretch,
          children: [
            _buildPassBox('STUDENT COPY', isStudent, name, maskedPhone, slipNumber, destination, reason, classSec, fatherName, designation, photoProvider),
            pw.SizedBox(width: 20),
            pw.Container(width: 1, decoration: const pw.BoxDecoration(border: pw.Border(left: pw.BorderSide(color: PdfColors.grey400, style: pw.BorderStyle.dashed)))),
            pw.SizedBox(width: 20),
            _buildPassBox('SECURITY COPY', isStudent, name, maskedPhone, slipNumber, destination, reason, classSec, fatherName, designation, photoProvider),
          ],
        );
      },
    ),
  );
  return pdf.save();
}

pw.Widget _buildPassBox(
    String copyType, bool isStudent, String name, String maskedPhone, String slipNumber, 
    String destination, String reason, String classSec, String fatherName, String designation, pw.ImageProvider? photoProvider) {
  return pw.Expanded(
    child: pw.Container(
      padding: const pw.EdgeInsets.all(24),
      decoration: pw.BoxDecoration(
        border: pw.Border.all(width: 2, color: PdfColors.blueGrey800),
        borderRadius: const pw.BorderRadius.all(pw.Radius.circular(16)),
      ),
      child: pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.stretch,
        children: [
          pw.Center(
            child: pw.Container(
              padding: const pw.EdgeInsets.symmetric(vertical: 8, horizontal: 24),
              decoration: pw.BoxDecoration(
                color: PdfColors.blueGrey800,
                borderRadius: pw.BorderRadius.circular(8),
              ),
              child: pw.Text(
                'JY SCHOOL - $copyType',
                style: pw.TextStyle(color: PdfColors.white, fontSize: 16, fontWeight: pw.FontWeight.bold, letterSpacing: 1.2),
                textAlign: pw.TextAlign.center,
              ),
            ),
          ),
          pw.SizedBox(height: 24),
          pw.Row(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
            children: [
              pw.Container(
                width: 90,
                height: 110,
                decoration: pw.BoxDecoration(
                  color: PdfColors.grey200,
                  borderRadius: pw.BorderRadius.circular(8),
                  border: pw.Border.all(color: PdfColors.grey400),
                ),
                child: photoProvider != null 
                    ? pw.ClipRRect(
                        horizontalRadius: 7,
                        verticalRadius: 7,
                        child: pw.Image(photoProvider, fit: pw.BoxFit.cover),
                      )
                    : pw.Center(child: pw.Text('PHOTO', style: const pw.TextStyle(color: PdfColors.grey600, fontSize: 10))),
              ),
              pw.SizedBox(width: 16),
              pw.Expanded(
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Text(name, style: pw.TextStyle(fontSize: 18, fontWeight: pw.FontWeight.bold)),
                    pw.SizedBox(height: 4),
                    pw.Text('${isStudent ? 'Student' : 'Staff'} | Phone: $maskedPhone', style: const pw.TextStyle(fontSize: 12, color: PdfColors.grey700)),
                    pw.SizedBox(height: 8),
                    pw.Container(
                      padding: const pw.EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: pw.BoxDecoration(
                        color: PdfColors.grey200,
                        borderRadius: pw.BorderRadius.circular(4),
                      ),
                      child: pw.Text('Slip No: $slipNumber', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 12)),
                    ),
                  ],
                ),
              ),
              pw.SizedBox(width: 16),
              pw.Container(
                padding: const pw.EdgeInsets.all(6),
                decoration: pw.BoxDecoration(
                  border: pw.Border.all(color: PdfColors.grey300),
                  borderRadius: pw.BorderRadius.circular(8),
                ),
                child: pw.BarcodeWidget(
                  data: slipNumber,
                  barcode: pw.Barcode.qrCode(),
                  width: 90,
                  height: 90,
                ),
              ),
            ],
          ),
          pw.SizedBox(height: 24),
          pw.Divider(color: PdfColors.grey300),
          pw.SizedBox(height: 16),
          
          if (isStudent) ...[
            _buildPdfDetailRow('Class/Sec', classSec),
            pw.SizedBox(height: 10),
            _buildPdfDetailRow('Father Name', fatherName),
          ] else ...[
            _buildPdfDetailRow('Designation', designation),
          ],
          
          pw.SizedBox(height: 10),
          _buildPdfDetailRow('Destination', destination),
          pw.SizedBox(height: 10),
          _buildPdfDetailRow('Reason', reason),
          
          pw.Spacer(),
          pw.Divider(color: PdfColors.grey300),
          pw.SizedBox(height: 24),
          pw.Row(
            mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
            children: [
              pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.center,
                children: [
                  pw.Container(width: 120, height: 1, color: PdfColors.black),
                  pw.SizedBox(height: 4),
                  pw.Text('Authorized Signature', style: const pw.TextStyle(fontSize: 10)),
                ],
              ),
              pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.center,
                children: [
                  pw.Container(width: 120, height: 1, color: PdfColors.black),
                  pw.SizedBox(height: 4),
                  pw.Text('Security Stamp', style: const pw.TextStyle(fontSize: 10)),
                ],
              ),
            ],
          ),
          pw.SizedBox(height: 16),
          pw.Center(
            child: pw.Text('Please present this slip at the main gate.', style: pw.TextStyle(fontSize: 10, color: PdfColors.grey600, fontStyle: pw.FontStyle.italic)),
          ),
        ],
      ),
    ),
  );
}

pw.Widget _buildPdfDetailRow(String label, String value) {
  return pw.Row(
    crossAxisAlignment: pw.CrossAxisAlignment.start,
    children: [
      pw.SizedBox(
        width: 100,
        child: pw.Text(label, style: const pw.TextStyle(color: PdfColors.grey700, fontSize: 13, letterSpacing: 0.5)),
      ),
      pw.Expanded(
        child: pw.Text(value, style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 13)),
      ),
    ],
  );
}

