import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';
import 'record_fee_payment_screen.dart';
import '../widgets/app_drawer.dart';

class AccountantDashboardScreen extends StatefulWidget {
  const AccountantDashboardScreen({super.key});

  @override
  State<AccountantDashboardScreen> createState() => _AccountantDashboardScreenState();
}

class _AccountantDashboardScreenState extends State<AccountantDashboardScreen> with SingleTickerProviderStateMixin {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  bool _isLoading = true;
  Map<String, dynamic> _data = {};
  
  late AnimationController _fadeCtrl;

  @override
  void initState() {
    super.initState();
    _fadeCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 600))..forward();
    _fetchDashboardData();
  }

  @override
  void dispose() {
    _fadeCtrl.dispose();
    super.dispose();
  }

  Future<void> _fetchDashboardData() async {
    setState(() => _isLoading = true);
    final res = await ApiService.get('/dashboard/accountant');
    if (res['success'] && mounted) {
      setState(() {
        _data = res['data'] ?? {};
        _isLoading = false;
      });
      _fadeCtrl.forward(from: 0);
    } else if (mounted) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to load dashboard data')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: const Color(0xFFF8FAFC),
      drawer: const AppDrawer(currentRoute: 'dashboard'),
      appBar: AppBar(
        elevation: 0,
        backgroundColor: const Color(0xFF0F172A),
        leading: IconButton(
          icon: const Icon(Icons.menu_rounded, color: Colors.white, size: 28),
          onPressed: () => _scaffoldKey.currentState?.openDrawer(),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Accountant Portal', style: GoogleFonts.outfit(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
            Text('Finance & Operations', style: GoogleFonts.poppins(color: const Color(0xFF94A3B8), fontSize: 11)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: Colors.white),
            onPressed: _fetchDashboardData,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF10B981)))
          : RefreshIndicator(
              onRefresh: _fetchDashboardData,
              color: const Color(0xFF10B981),
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.only(bottom: 30),
                child: FadeTransition(
                  opacity: _fadeCtrl,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildHeaderBanner(),
                      const SizedBox(height: 20),
                      _buildStatsGrid(),
                      const SizedBox(height: 20),
                      _buildQuickActions(),
                      const SizedBox(height: 24),
                      _buildRecentPayments(),
                    ],
                  ),
                ),
              ),
            ),
    );
  }

  Widget _buildHeaderBanner() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: const BoxDecoration(
        color: Color(0xFF0F172A),
        borderRadius: BorderRadius.only(bottomLeft: Radius.circular(30), bottomRight: Radius.circular(30)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: const Color(0xFF10B981).withOpacity(0.2), borderRadius: BorderRadius.circular(12)),
                child: const Icon(Icons.account_balance_wallet_rounded, color: Color(0xFF34D399), size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Total Collected (All Time)', style: GoogleFonts.poppins(color: const Color(0xFF94A3B8), fontSize: 12, fontWeight: FontWeight.w500)),
                    Text(
                      '₹${_formatCurrency(_data['totalCollected'] ?? 0)}',
                      style: GoogleFonts.outfit(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatsGrid() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          Expanded(
            child: _buildStatCard(
              title: 'Pending Dues',
              value: '₹${_formatCurrency(_data['pendingDues'] ?? 0)}',
              icon: Icons.pending_actions_rounded,
              color: const Color(0xFFF59E0B),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _buildStatCard(
              title: 'Overdue Invoices',
              value: '${_data['overdueInvoicesCount'] ?? 0} Active',
              icon: Icons.warning_amber_rounded,
              color: const Color(0xFFEF4444),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard({required String title, required String value, required IconData icon, required Color color}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(height: 12),
          Text(title, style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 11, fontWeight: FontWeight.w600)),
          const SizedBox(height: 4),
          FittedBox(child: Text(value, style: GoogleFonts.outfit(color: const Color(0xFF0F172A), fontSize: 18, fontWeight: FontWeight.bold))),
        ],
      ),
    );
  }

  Widget _buildQuickActions() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Quick Actions', style: GoogleFonts.poppins(color: const Color(0xFF0F172A), fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          InkWell(
            onTap: () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const RecordFeePaymentScreen())).then((_) => _fetchDashboardData());
            },
            borderRadius: BorderRadius.circular(16),
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFF10B981), Color(0xFF059669)]),
                borderRadius: BorderRadius.circular(16),
                boxShadow: [BoxShadow(color: const Color(0xFF10B981).withOpacity(0.3), blurRadius: 8, offset: const Offset(0, 4))],
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: const BoxDecoration(color: Colors.white24, shape: BoxShape.circle),
                    child: const Icon(Icons.add_card_rounded, color: Colors.white, size: 20),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Collect Fee', style: GoogleFonts.poppins(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold)),
                        Text('Record a new payment', style: GoogleFonts.poppins(color: Colors.white70, fontSize: 11)),
                      ],
                    ),
                  ),
                  const Icon(Icons.arrow_forward_ios_rounded, color: Colors.white, size: 16),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecentPayments() {
    final payments = _data['recentPayments'] as List<dynamic>? ?? [];
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Recent Collections', style: GoogleFonts.poppins(color: const Color(0xFF0F172A), fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          if (payments.isEmpty)
            Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text('No recent payments found.', style: GoogleFonts.poppins(color: const Color(0xFF94A3B8), fontSize: 13)),
              ),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: payments.length,
              separatorBuilder: (context, index) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final p = payments[index];
                return _buildPaymentTile(p);
              },
            ),
        ],
      ),
    );
  }

  Widget _buildPaymentTile(dynamic p) {
    final amount = double.tryParse(p['amountPaid']?.toString() ?? '0') ?? 0.0;
    final date = p['paymentDate'] != null ? DateFormat('MMM dd, yyyy').format(DateTime.parse(p['paymentDate'])) : 'Unknown Date';
    final studentName = p['student']?['user']?['name'] ?? 'Unknown Student';
    final receiptNo = p['receiptNo'] ?? '#';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: const Color(0xFFEFF6FF), borderRadius: BorderRadius.circular(12)),
            child: const Icon(Icons.receipt_long_rounded, color: Color(0xFF3B82F6), size: 24),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(studentName, style: GoogleFonts.poppins(color: const Color(0xFF1E293B), fontSize: 13, fontWeight: FontWeight.bold), maxLines: 1, overflow: TextOverflow.ellipsis),
                const SizedBox(height: 2),
                Text('$receiptNo • $date', style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 11)),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text('+ ₹${_formatCurrency(amount)}', style: GoogleFonts.outfit(color: const Color(0xFF10B981), fontSize: 15, fontWeight: FontWeight.bold)),
              Container(
                margin: const EdgeInsets.only(top: 4),
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(4)),
                child: Text(p['method'] ?? 'CASH', style: GoogleFonts.poppins(color: const Color(0xFF475569), fontSize: 9, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _formatCurrency(dynamic value) {
    final v = double.tryParse(value?.toString() ?? '0') ?? 0.0;
    return NumberFormat('#,##,###').format(v);
  }
}
