import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';
import '../widgets/app_drawer.dart';

class FeesScreen extends StatefulWidget {
  const FeesScreen({super.key});

  @override
  State<FeesScreen> createState() => _FeesScreenState();
}

class _FeesScreenState extends State<FeesScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<dynamic> _feeStatusList = [];
  bool _isLoading = true;
  String? _errorMessage;
  double _totalDues = 0.0;
  double _totalPaid = 0.0;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _fetchFees();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _fetchFees() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userString = prefs.getString('user');
      if (userString == null) {
        setState(() {
          _errorMessage = 'User session not found';
          _isLoading = false;
        });
        return;
      }

      final user = jsonDecode(userString);
      final studentId = user['student']?['id'];
      if (studentId == null) {
        setState(() {
          _errorMessage = 'Student profile information not found';
          _isLoading = false;
        });
        return;
      }

      final result = await ApiService.getFeeStatus(studentId);

      if (mounted) {
        if (result['success']) {
          final List<dynamic> feeList = result['data'] ?? [];
          setState(() {
            _feeStatusList = feeList;
            _calculateTotals(feeList);
            _isLoading = false;
          });
        } else {
          setState(() {
            _errorMessage = result['message'];
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'An error occurred: $e';
          _isLoading = false;
        });
      }
    }
  }

  void _calculateTotals(List<dynamic> list) {
    _totalDues = 0.0;
    _totalPaid = 0.0;

    for (var item in list) {
      final amountDue = double.tryParse(item['amountDue']?.toString() ?? '0.0') ?? 0.0;
      final amountPaid = double.tryParse(item['amountPaid']?.toString() ?? '0.0') ?? 0.0;
      _totalDues += amountDue;
      _totalPaid += amountPaid;
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toUpperCase()) {
      case 'PAID':
        return const Color(0xFF10B981); // Emerald Green
      case 'PARTIAL':
        return const Color(0xFFF59E0B); // Amber
      case 'OVERDUE':
        return const Color(0xFFEF4444); // Red
      case 'PENDING':
      default:
        return const Color(0xFF64748B); // Slate Grey
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      drawer: const AppDrawer(currentRoute: 'fees'),
      appBar: AppBar(
        title: const Text(
          'Fees Summary',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.white,
        foregroundColor: Colors.blueGrey.shade800,
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          labelColor: const Color(0xFF6366F1),
          unselectedLabelColor: Colors.blueGrey,
          indicatorColor: const Color(0xFF6366F1),
          tabs: const [
            Tab(text: 'Dues & Structure'),
            Tab(text: 'Receipts History'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.error_outline, size: 60, color: Colors.redAccent),
                        const SizedBox(height: 16),
                        Text(
                          _errorMessage!,
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontSize: 16, color: Colors.blueGrey),
                        ),
                        const SizedBox(height: 20),
                        ElevatedButton(
                          onPressed: () {
                            setState(() {
                              _isLoading = true;
                              _errorMessage = null;
                            });
                            _fetchFees();
                          },
                          child: const Text('Retry'),
                        )
                      ],
                    ),
                  ),
                )
              : TabBarView(
                  controller: _tabController,
                  children: [
                    _buildDuesTab(),
                    _buildReceiptsTab(),
                  ],
                ),
    );
  }

  Widget _buildDuesTab() {
    return RefreshIndicator(
      onRefresh: _fetchFees,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(20.0),
        child: Column(
          children: [
            // Outstanding Summary Banner
            _buildSummaryCard(),
            const SizedBox(height: 24),
            
            // Fee structures list
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _feeStatusList.length,
              itemBuilder: (context, index) {
                final item = _feeStatusList[index];
                final structure = item['feeStructure'] ?? {};
                final feeName = structure['name'] ?? 'Fee';
                final term = structure['term'] ?? 'Term';
                final originalAmount = double.tryParse(item['originalAmount']?.toString() ?? '0') ?? 0.0;
                final discount = double.tryParse(item['discount']?.toString() ?? '0') ?? 0.0;
                final amountPaid = double.tryParse(item['amountPaid']?.toString() ?? '0') ?? 0.0;
                final amountDue = double.tryParse(item['amountDue']?.toString() ?? '0') ?? 0.0;
                final status = item['status']?.toString() ?? 'PENDING';
                final dueDateStr = structure['dueDate']?.toString().split('T')[0] ?? 'N/A';

                return Card(
                  elevation: 0,
                  margin: const EdgeInsets.only(bottom: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20),
                    side: BorderSide(color: Colors.blueGrey.shade100),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Header: Name & Status
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                feeName,
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF1E293B),
                                ),
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                              decoration: BoxDecoration(
                                color: _getStatusColor(status).withOpacity(0.12),
                                borderRadius: BorderRadius.circular(30),
                              ),
                              child: Text(
                                status.toUpperCase(),
                                style: TextStyle(
                                  color: _getStatusColor(status),
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Term: $term  •  Due Date: $dueDateStr',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.blueGrey.shade500,
                          ),
                        ),
                        const Divider(height: 24),
                        
                        // Breakdown
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            _buildBreakdownColumn('Original', '?${originalAmount.toStringAsFixed(0)}'),
                            if (discount > 0)
                              _buildBreakdownColumn('Discount', '?${discount.toStringAsFixed(0)}', isDiscount: true),
                            _buildBreakdownColumn('Paid', '?${amountPaid.toStringAsFixed(0)}'),
                            _buildBreakdownColumn(
                              'Balance', 
                              '?${amountDue.toStringAsFixed(0)}', 
                              isBold: true,
                              textColor: amountDue > 0 ? const Color(0xFFEF4444) : const Color(0xFF1E293B)
                            ),
                          ],
                        )
                      ],
                    ),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBreakdownColumn(String label, String val, {bool isDiscount = false, bool isBold = false, Color? textColor}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            color: Color(0xFF94A3B8),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          val,
          style: TextStyle(
            fontSize: 14,
            fontWeight: isBold ? FontWeight.bold : FontWeight.w500,
            color: isDiscount 
                ? const Color(0xFF10B981) 
                : (textColor ?? const Color(0xFF334155)),
          ),
        ),
      ],
    );
  }

  Widget _buildSummaryCard() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.blueGrey.shade100),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Pending Balance',
                    style: TextStyle(
                      fontSize: 14,
                      color: Color(0xFF64748B),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '?${_totalDues.toStringAsFixed(2)}',
                    style: const TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFFEF4444),
                    ),
                  ),
                ],
              ),
              const Icon(
                Icons.account_balance_wallet_rounded,
                color: Color(0xFFEF4444),
                size: 40,
              )
            ],
          ),
          const Divider(height: 32),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.check_circle, color: Color(0xFF10B981), size: 18),
                  const SizedBox(width: 6),
                  const Text(
                    'Total Paid: ',
                    style: TextStyle(color: Color(0xFF64748B), fontSize: 13),
                  ),
                  Text(
                    '?${_totalPaid.toStringAsFixed(0)}',
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                  )
                ],
              )
            ],
          )
        ],
      ),
    );
  }

  Widget _buildReceiptsTab() {
    // Generate payments list from the parsed structure payments
    final List<dynamic> payments = [];
    for (var item in _feeStatusList) {
      // Each structure item might not explicitly send payments list, but we can display the aggregate details
      // Or in a real scenario we'd fetch from ApiService.getPayments()
      // Let's check payments from our current model structure
    }

    return RefreshIndicator(
      onRefresh: _fetchFees,
      child: ListView.builder(
        padding: const EdgeInsets.all(20),
        itemCount: _feeStatusList.length,
        itemBuilder: (context, index) {
          final item = _feeStatusList[index];
          final structure = item['feeStructure'] ?? {};
          final amountPaid = double.tryParse(item['amountPaid']?.toString() ?? '0') ?? 0.0;
          final paymentDateStr = item['paymentDate']?.toString().split('T')[0] ?? '';

          if (amountPaid == 0.0) return const SizedBox.shrink();

          return Card(
            elevation: 0,
            margin: const EdgeInsets.only(bottom: 12),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
              side: BorderSide(color: Colors.blueGrey.shade100),
            ),
            child: ListTile(
              leading: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.receipt_long_rounded, color: Color(0xFF10B981), size: 20),
              ),
              title: Text(
                structure['name'] ?? 'Fee Payment',
                style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
              ),
              subtitle: Text(
                'Paid on: ${paymentDateStr.isNotEmpty ? paymentDateStr : "N/A"}',
                style: const TextStyle(fontSize: 12),
              ),
              trailing: Text(
                '+ ?${amountPaid.toStringAsFixed(0)}',
                style: const TextStyle(
                  color: Color(0xFF10B981),
                  fontWeight: FontWeight.bold,
                  fontSize: 15,
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}


