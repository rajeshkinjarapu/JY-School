import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:intl/intl.dart';
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
          BottomNavigationBarItem(icon: Icon(Icons.directions_run_rounded), label: 'Live'),
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
    try {
      final res = await ApiService.getSettings(); // Replace with actual ApiService.getGatePassStats() when ready
      await Future.delayed(const Duration(milliseconds: 600));
      if (mounted) {
        setState(() {
          _loading = false;
          _inside = 1205; // Mock data until API is fully wired in app
          _out = 32;
          _pending = 5;
          _overdue = 2; // Red alert!
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
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

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator(color: Color(0xFF10B981)));

    if (_activePasses.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.check_circle_outline, size: 80, color: Colors.green.withOpacity(0.5)),
            const SizedBox(height: 16),
            Text("Everyone is inside", style: GoogleFonts.outfit(color: const Color(0xFF64748B), fontSize: 18, fontWeight: FontWeight.bold)),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _fetchLiveList,
      color: const Color(0xFF10B981),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _activePasses.length,
        itemBuilder: (context, index) {
          final pass = _activePasses[index];
          final isStudent = pass['requestType'] == 'STUDENT';
          final name = isStudent ? (pass['student']?['user']?['name'] ?? 'Unknown') : (pass['requester']?['name'] ?? 'Unknown');
          final dept = isStudent ? 'Class ${pass['student']?['class']?['name'] ?? ''} ${pass['student']?['class']?['section'] ?? ''}' : 'Staff';
          
          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10, offset: const Offset(0, 4))],
            ),
            child: ListTile(
              contentPadding: const EdgeInsets.all(16),
              leading: CircleAvatar(
                backgroundColor: const Color(0xFFE2E8F0),
                radius: 24,
                child: Icon(isStudent ? Icons.person : Icons.badge, color: const Color(0xFF64748B)),
              ),
              title: Text(name, style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16)),
              subtitle: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(dept, style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 12)),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.login, size: 14, color: Color(0xFFF59E0B)),
                      const SizedBox(width: 4),
                      Text("Out: ${pass['exitTime'] ?? '-'}", style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFFF59E0B), fontWeight: FontWeight.bold)),
                      const SizedBox(width: 16),
                      const Icon(Icons.timer, size: 14, color: Color(0xFF64748B)),
                      const SizedBox(width: 4),
                      Text("Return: ${pass['expectedReturnTime'] != null ? DateFormat('hh:mm a').format(DateTime.parse(pass['expectedReturnTime'])) : pass['returnTime'] ?? '-'}", style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF64748B))),
                    ],
                  )
                ],
              ),
              trailing: IconButton(
                icon: const Icon(Icons.qr_code_scanner, color: Color(0xFF10B981)),
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Use Scanner tab to mark as returned')));
                },
              ),
            ),
          );
        },
      ),
    );
  }
}

// ---------------------------------------------------------
// Tab 3: Approvals (Pending Requests)
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
          content: Text('Request $status successfully'),
          backgroundColor: status == 'APPROVED' ? Colors.green : Colors.red,
        ));
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator(color: Color(0xFF10B981)));

    if (_pendingPasses.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.inbox, size: 80, color: Colors.grey.withOpacity(0.5)),
            const SizedBox(height: 16),
            Text("No Pending Requests", style: GoogleFonts.outfit(color: const Color(0xFF64748B), fontSize: 18, fontWeight: FontWeight.bold)),
          ],
        ),
      );
    }

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16.0),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text("${_pendingPasses.length} Requests Pending", style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16)),
              TextButton.icon(
                onPressed: () {
                  // Approve All Logic
                },
                icon: const Icon(Icons.done_all, color: Color(0xFF10B981)),
                label: Text("Approve All", style: GoogleFonts.poppins(color: const Color(0xFF10B981), fontWeight: FontWeight.bold)),
              )
            ],
          ),
        ),
        Expanded(
          child: RefreshIndicator(
            onRefresh: _fetchPending,
            color: const Color(0xFF10B981),
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _pendingPasses.length,
              itemBuilder: (context, index) {
                final pass = _pendingPasses[index];
                final isStudent = pass['requestType'] == 'STUDENT';
                final name = isStudent ? (pass['student']?['user']?['name'] ?? 'Unknown') : (pass['requester']?['name'] ?? 'Unknown');
                final dept = isStudent ? 'Class ${pass['student']?['class']?['name'] ?? ''}' : 'Staff';
                
                return Card(
                  elevation: 0,
                  margin: const EdgeInsets.only(bottom: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: const BorderSide(color: Color(0xFFE2E8F0))),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            CircleAvatar(
                              backgroundColor: const Color(0xFFF1F5F9),
                              child: Icon(isStudent ? Icons.person : Icons.badge, color: const Color(0xFF3B82F6)),
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
                            Text(pass['exitTime'] ?? '', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
                          ],
                        ),
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 12),
                          child: Divider(height: 1, color: Color(0xFFE2E8F0)),
                        ),
                        Text("Reason: ${pass['reason']}", style: GoogleFonts.poppins(fontSize: 13, color: const Color(0xFF475569))),
                        const SizedBox(height: 4),
                        Text("Destination: ${pass['destination'] ?? 'Not specified'}", style: GoogleFonts.poppins(fontSize: 13, color: const Color(0xFF475569))),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton(
                                onPressed: () => _updateStatus(pass['id'], 'REJECTED'),
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: const Color(0xFFEF4444),
                                  side: const BorderSide(color: Color(0xFFEF4444)),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                ),
                                child: const Text('Reject'),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: ElevatedButton(
                                onPressed: () => _updateStatus(pass['id'], 'APPROVED'),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF10B981),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  elevation: 0,
                                ),
                                child: const Text('Approve', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                              ),
                            ),
                          ],
                        )
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ),
      ],
    );
  }
}

// ---------------------------------------------------------
// Tab 4: History / Search
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

  Future<void> _fetchHistory() async {
    setState(() => _loading = true);
    try {
      final res = await ApiService.getGatePasses(); 
      if (mounted) {
        setState(() {
          _history = res['data'] ?? [];
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void initState() {
    super.initState();
    _fetchHistory();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          color: Colors.white,
          padding: const EdgeInsets.all(16),
          child: TextField(
            controller: _searchCtrl,
            decoration: InputDecoration(
              hintText: 'Search Name or Roll No...',
              hintStyle: GoogleFonts.poppins(color: const Color(0xFF94A3B8)),
              prefixIcon: const Icon(Icons.search, color: Color(0xFF94A3B8)),
              filled: true,
              fillColor: const Color(0xFFF1F5F9),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), BorderSide.none),
              contentPadding: const EdgeInsets.symmetric(vertical: 14),
            ),
            onChanged: (val) {
              // Trigger local filter or API search
            },
          ),
        ),
        Expanded(
          child: _loading 
            ? const Center(child: CircularProgressIndicator(color: Color(0xFF10B981)))
            : RefreshIndicator(
                onRefresh: _fetchHistory,
                child: ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _history.length,
                  itemBuilder: (context, index) {
                    final pass = _history[index];
                    final isStudent = pass['requestType'] == 'STUDENT';
                    final name = isStudent ? (pass['student']?['user']?['name'] ?? 'Unknown') : (pass['requester']?['name'] ?? 'Unknown');
                    
                    return Card(
                      elevation: 0,
                      margin: const EdgeInsets.only(bottom: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: const BorderSide(color: Color(0xFFE2E8F0))),
                      child: ListTile(
                        leading: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: pass['status'] == 'APPROVED' ? Colors.green.withOpacity(0.1) : (pass['status'] == 'COMPLETED' ? Colors.blue.withOpacity(0.1) : Colors.grey.withOpacity(0.1)),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(pass['status'] == 'APPROVED' ? Icons.check : (pass['status'] == 'COMPLETED' ? Icons.history : Icons.close), size: 20, color: pass['status'] == 'APPROVED' ? Colors.green : (pass['status'] == 'COMPLETED' ? Colors.blue : Colors.grey)),
                        ),
                        title: Text(name, style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 15)),
                        subtitle: Text(DateFormat('dd MMM yyyy, hh:mm a').format(DateTime.parse(pass['createdAt'])), style: GoogleFonts.poppins(fontSize: 11)),
                        trailing: Text(pass['status'], style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 12, color: pass['status'] == 'APPROVED' ? Colors.green : Colors.grey)),
                      ),
                    );
                  },
                ),
              ),
        )
      ],
    );
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
          Container(
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(32),
              boxShadow: [BoxShadow(color: const Color(0xFF10B981).withOpacity(0.2), blurRadius: 40, spreadRadius: 10)],
            ),
            child: const Icon(Icons.qr_code_scanner_rounded, size: 100, color: Color(0xFF10B981)),
          ),
          const SizedBox(height: 32),
          Text("Security QR Scanner", style: GoogleFonts.outfit(color: const Color(0xFF1E293B), fontSize: 24, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text("Point Camera at Student ID Card to log IN/OUT", style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 14)),
          const SizedBox(height: 40),
          ElevatedButton.icon(
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Opening Camera...')));
            },
            icon: const Icon(Icons.camera_alt, color: Colors.white),
            label: Text('TAP TO SCAN', style: GoogleFonts.poppins(color: Colors.white, fontWeight: FontWeight.bold, letterSpacing: 1)),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF10B981),
              padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
              elevation: 0,
            ),
          )
        ],
      ),
    );
  }
}
