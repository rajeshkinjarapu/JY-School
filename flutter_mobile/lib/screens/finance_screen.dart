import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../widgets/app_drawer.dart';
import 'package:fl_chart/fl_chart.dart';
import 'student_fee_search_screen.dart';
import 'fee_structure_management_screen.dart';
import 'finance_reports_screen.dart';
import 'fee_settings_screen.dart';
import 'fee_installment_report_screen.dart';
import 'fee_reminder_search_screen.dart';

class FinanceScreen extends StatefulWidget {
  const FinanceScreen({super.key});

  @override
  State<FinanceScreen> createState() => _FinanceScreenState();
}

class _FinanceScreenState extends State<FinanceScreen> {
  bool _isLoading = true;
  String? _errorMessage;

  List<dynamic> _payments = [];
  List<dynamic> _structures = [];

  double _totalCollected = 0.0;
  double _todayCollected = 0.0;
  double _pendingDues = 0.0;
  double _totalExpected = 0.0;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final results = await Future.wait([
        ApiService.getFeePayments(),
        ApiService.getFeeStructures(),
      ]);

      final paymentsRes = results[0];
      final structuresRes = results[1];

      if (paymentsRes['success'] && structuresRes['success']) {
        setState(() {
          _payments = paymentsRes['data'] ?? [];
          _structures = structuresRes['data'] ?? [];
          _calculateKPIs();
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = paymentsRes['message'] ?? structuresRes['message'] ?? 'Failed to load finance data';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'An unexpected error occurred: $e';
        _isLoading = false;
      });
    }
  }

  void _calculateKPIs() {
    _totalCollected = 0.0;
    _todayCollected = 0.0;
    _pendingDues = 0.0;
    _totalExpected = 0.0;

    final todayStr = DateTime.now().toIso8601String().split('T')[0];

    for (var payment in _payments) {
      final amount = double.tryParse(payment['amountPaid']?.toString() ?? '0.0') ?? 0.0;
      final status = payment['status']?.toString().toUpperCase() ?? 'PENDING';
      
      if (status == 'PAID') {
        _totalCollected += amount;

        final payDate = payment['paymentDate']?.toString() ?? payment['createdAt']?.toString() ?? '';
        if (payDate.startsWith(todayStr)) {
          _todayCollected += amount;
        }
      }
    }

    for (var struct in _structures) {
      _totalExpected += double.tryParse(struct['amount']?.toString() ?? '0.0') ?? 0.0;
    }

    _pendingDues = _totalExpected - _totalCollected;
    if (_pendingDues < 0) _pendingDues = 0.0;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      drawer: const AppDrawer(currentRoute: 'fees'),
      appBar: AppBar(
        title: Text('Finance & Fees', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        backgroundColor: const Color(0xFF4F46E5),
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _fetchData,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF4F46E5)))
          : _errorMessage != null
              ? _buildErrorView()
              : SingleChildScrollView(
                  child: _buildDashboardContent(),
                ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (ctx) => const StudentFeeSearchScreen())),
        backgroundColor: const Color(0xFF6366F1),
        icon: const Icon(Icons.person_search_rounded, color: Colors.white),
        label: Text('Collect Fee', style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
        elevation: 4,
      ),
    );
  }

  Widget _buildErrorView() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 80, color: Colors.redAccent),
            const SizedBox(height: 16),
            Text(_errorMessage!, textAlign: TextAlign.center, style: GoogleFonts.poppins(color: Colors.blueGrey, fontSize: 15)),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _fetchData,
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF6366F1), foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDashboardContent() {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildKPIGrid(),
          const SizedBox(height: 24),
          Text('Finance Modules', style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
          const SizedBox(height: 16),
          _buildModulesGrid(),
          const SizedBox(height: 80),
        ],
      ),
    );
  }

  Widget _buildKPIGrid() {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _buildStatCard(
                title: 'Total Collected',
                value: '₹${_totalCollected.toStringAsFixed(0)}',
                icon: Icons.check_circle_rounded,
                colors: [const Color(0xFF10B981), const Color(0xFF34D399)],
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(
                title: 'Pending Dues',
                value: '₹${_pendingDues.toStringAsFixed(0)}',
                icon: Icons.warning_amber_rounded,
                colors: [const Color(0xFFF43F5E), const Color(0xFFFB7185)],
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildStatCard(
                title: 'Today Collection',
                value: '₹${_todayCollected.toStringAsFixed(0)}',
                icon: Icons.today_rounded,
                colors: [const Color(0xFF3B82F6), const Color(0xFF60A5FA)],
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(
                title: 'Total Expected',
                value: '₹${_totalExpected.toStringAsFixed(0)}',
                icon: Icons.account_balance,
                colors: [const Color(0xFF8B5CF6), const Color(0xFFA78BFA)],
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStatCard({required String title, required String value, required IconData icon, required List<Color> colors}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: colors, begin: Alignment.topLeft, end: Alignment.bottomRight),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(color: colors[0].withOpacity(0.3), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), shape: BoxShape.circle),
                child: Icon(icon, color: Colors.white, size: 20),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(title, style: GoogleFonts.poppins(color: Colors.white.withOpacity(0.9), fontSize: 12, fontWeight: FontWeight.w600)),
          const SizedBox(height: 4),
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(value, style: GoogleFonts.outfit(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _buildModulesGrid() {
    final modules = [
      {'title': 'Student Fees', 'desc': 'Search & Collect', 'icon': Icons.person_search, 'color': const Color(0xFF10B981), 'screen': const StudentFeeSearchScreen()},
      {'title': 'Installments', 'desc': 'Detailed Timeline', 'icon': Icons.receipt_long, 'color': const Color(0xFF0EA5E9), 'screen': const FeeInstallmentReportScreen()},
      {'title': 'Class Reports', 'desc': 'Revenue Analytics', 'icon': Icons.analytics, 'color': const Color(0xFF6366F1), 'screen': const FinanceReportsScreen()},
      {'title': 'Fee Structure', 'desc': 'Setup Templates', 'icon': Icons.account_tree, 'color': const Color(0xFFF59E0B), 'screen': const FeeStructureManagementScreen()},
      {'title': 'Fee Settings', 'desc': 'Concessions & Heads', 'icon': Icons.settings, 'color': const Color(0xFF8B5CF6), 'screen': const FeeSettingsScreen()},
      {'title': 'Fee Reminder', 'desc': 'Send Slips', 'icon': Icons.notifications_active_rounded, 'color': const Color(0xFFEAB308), 'screen': const FeeReminderSearchScreen()},
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: modules.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 1.1,
      ),
      itemBuilder: (context, index) {
        final mod = modules[index];
        return _buildGridModule(
          title: mod['title'] as String,
          desc: mod['desc'] as String,
          icon: mod['icon'] as IconData,
          color: mod['color'] as Color,
          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (ctx) => mod['screen'] as Widget)),
        );
      },
    );
  }

  Widget _buildGridModule({required String title, required String desc, required IconData icon, required Color color, required VoidCallback onTap}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: color.withOpacity(0.1), width: 1.5),
          boxShadow: [
            BoxShadow(color: color.withOpacity(0.05), blurRadius: 15, offset: const Offset(0, 5)),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(16)),
              child: Icon(icon, color: color, size: 26),
            ),
            const Spacer(),
            Text(title, style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16, color: const Color(0xFF1E293B))),
            const SizedBox(height: 4),
            Text(desc, style: GoogleFonts.poppins(fontSize: 11, color: const Color(0xFF64748B))),
          ],
        ),
      ),
    );
  }
}
