import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
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
      backgroundColor: const Color(0xFFF4F7FE),
      drawer: const AppDrawer(currentRoute: 'gatepass'),
      appBar: AppBar(
        leading: const BackButton(),
        title: Text(
          'Live Security Tracking',
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 18),
        ),
        iconTheme: const IconThemeData(color: Colors.white),
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
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
      bottomNavigationBar: hasFullAccess ? BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (idx) => setState(() => _currentIndex = idx),
        type: BottomNavigationBarType.fixed,
        backgroundColor: Colors.white,
        selectedItemColor: const Color(0xFF10B981),
        unselectedItemColor: const Color(0xFF94A3B8),
        selectedLabelStyle: GoogleFonts.poppins(fontSize: 10, fontWeight: FontWeight.bold),
        unselectedLabelStyle: GoogleFonts.poppins(fontSize: 10, fontWeight: FontWeight.w500),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.dashboard_rounded), label: 'Dashboard'),
          BottomNavigationBarItem(icon: Icon(Icons.directions_run_rounded), label: 'Live List'),
          BottomNavigationBarItem(icon: Icon(Icons.fact_check_rounded), label: 'Approvals'),
          BottomNavigationBarItem(icon: Icon(Icons.history_rounded), label: 'History'),
          BottomNavigationBarItem(icon: Icon(Icons.qr_code_scanner_rounded), label: 'Scanner'),
        ],
      ) : null,
    );
  }
}

// ---------------------------------------------------------
// Tab 1: Dashboard
// ---------------------------------------------------------
class _DashboardTab extends StatefulWidget {
  const _DashboardTab();
  @override
  State<_DashboardTab> createState() => _DashboardTabState();
}
class _DashboardTabState extends State<_DashboardTab> {
  bool _loading = true;
  int _inside = 0;
  int _out = 0;
  int _pending = 0;
  int _overdue = 0;

  @override
  void initState() {
    super.initState();
    _fetchStats();
  }

  Future<void> _fetchStats() async {
    setState(() => _loading = true);
    // Ideally ApiService.getGatePassStats()
    await Future.delayed(const Duration(milliseconds: 600));
    if (mounted) {
      setState(() {
        _loading = false;
        _inside = 1205;
        _out = 32;
        _pending = 5;
        _overdue = 2; // Red alert!
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator(color: Color(0xFF10B981)));

    return RefreshIndicator(
      onRefresh: _fetchStats,
      color: const Color(0xFF10B981),
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          if (_overdue > 0)
            Container(
              margin: const EdgeInsets.only(bottom: 20),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF2F2),
                border: Border.all(color: const Color(0xFFEF4444)),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                children: [
                  const Icon(Icons.warning_amber_rounded, color: Color(0xFFEF4444), size: 32),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('CRITICAL OVER-STAY', style: GoogleFonts.outfit(color: const Color(0xFFEF4444), fontSize: 16, fontWeight: FontWeight.bold)),
                        Text('$_overdue students have not returned by their expected time!', style: GoogleFonts.poppins(color: const Color(0xFF991B1B), fontSize: 12)),
                      ],
                    ),
                  )
                ],
              ),
            ),

          Row(
            children: [
              Expanded(child: _buildStatCard('INSIDE', _inside.toString(), const Color(0xFF10B981), Icons.domain)),
              const SizedBox(width: 16),
              Expanded(child: _buildStatCard('OUT', _out.toString(), const Color(0xFFF59E0B), Icons.directions_run)),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildStatCard(
                  'PENDING APPROVALS',
                  _pending.toString(),
                  const Color(0xFF3B82F6),
                  Icons.pending_actions,
                  showBadge: _pending > 0
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String title, String value, Color color, IconData icon, {bool showBadge = false}) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [BoxShadow(color: const Color(0xFF1E293B).withOpacity(0.04), blurRadius: 20, offset: const Offset(0, 4))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(color: color.withOpacity(0.1), shape: BoxShape.circle),
                child: Icon(icon, color: color, size: 24),
              ),
              if (showBadge)
                Container(
                  width: 12, height: 12,
                  decoration: const BoxDecoration(color: Color(0xFFEF4444), shape: BoxShape.circle),
                )
            ],
          ),
          const SizedBox(height: 16),
          Text(value, style: GoogleFonts.outfit(color: const Color(0xFF1E293B), fontSize: 32, fontWeight: FontWeight.w900)),
          const SizedBox(height: 4),
          Text(title, style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1)),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------
// Tab 2: Live List (Currently Out)
// ---------------------------------------------------------
class _LiveListTab extends StatelessWidget {
  const _LiveListTab();
  @override
  Widget build(BuildContext context) {
    return Center(child: Text("Live List: Shows Active gate passes", style: GoogleFonts.poppins(color: Colors.grey)));
  }
}

// ---------------------------------------------------------
// Tab 3: Approvals
// ---------------------------------------------------------
class _ApprovalsTab extends StatelessWidget {
  const _ApprovalsTab();
  @override
  Widget build(BuildContext context) {
    return Center(child: Text("Approvals: Lists pending requests", style: GoogleFonts.poppins(color: Colors.grey)));
  }
}

// ---------------------------------------------------------
// Tab 4: History / Search
// ---------------------------------------------------------
class _HistorySearchTab extends StatelessWidget {
  const _HistorySearchTab();
  @override
  Widget build(BuildContext context) {
    return Center(child: Text("History: Search by Name/RollNo", style: GoogleFonts.poppins(color: Colors.grey)));
  }
}

// ---------------------------------------------------------
// Tab 5: QR Scanner
// ---------------------------------------------------------
class _QRScannerTab extends StatelessWidget {
  const _QRScannerTab();
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.qr_code_scanner_rounded, size: 80, color: Color(0xFFCBD5E1)),
          const SizedBox(height: 16),
          Text("Point Camera at Student ID QR", style: GoogleFonts.outfit(color: const Color(0xFF64748B), fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () {},
            icon: const Icon(Icons.camera_alt, color: Colors.white),
            label: Text('Open Scanner', style: GoogleFonts.poppins(color: Colors.white)),
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981)),
          )
        ],
      ),
    );
  }
}
