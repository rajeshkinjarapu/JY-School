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
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final res = await ApiService.getFeeStatus();
      if (res['success']) {
        setState(() {
          _feeStatusList = res['data'] ?? [];
          _calculateTotals();
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = res['message'] ?? 'Failed to load fee details';
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

  void _calculateTotals() {
    _totalDues = 0.0;
    _totalPaid = 0.0;

    for (var item in _feeStatusList) {
      final amountDue = double.tryParse(item['amountDue']?.toString() ?? '0') ?? 0.0;
      final amountPaid = double.tryParse(item['amountPaid']?.toString() ?? '0') ?? 0.0;

      _totalDues += amountDue;
      _totalPaid += amountPaid;
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toUpperCase()) {
      case 'PAID':
        return const Color(0xFF10B981);
      case 'PARTIAL':
        return const Color(0xFFF59E0B);
      case 'OVERDUE':
        return const Color(0xFFEF4444);
      default:
        return const Color(0xFF6366F1);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      drawer: const AppDrawer(currentRoute: 'fees'),
      appBar: AppBar(
        title: const Text('My Fees & Dues', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF1E293B),
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          labelColor: const Color(0xFF6366F1),
          unselectedLabelColor: const Color(0xFF64748B),
          indicatorColor: const Color(0xFF6366F1),
          indicatorWeight: 3,
          tabs: const [
            Tab(text: 'Due Details'),
            Tab(text: 'Receipts'),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _fetchFees,
          )
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline, size: 60, color: Colors.redAccent),
                      const SizedBox(height: 16),
                      Text(_errorMessage!, textAlign: TextAlign.center),
                      const SizedBox(height: 16),
                      ElevatedButton(onPressed: _fetchFees, child: const Text('Retry'))
                    ],
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
        padding: const EdgeInsets.all(20),
        physics: const AlwaysScrollableScrollPhysics(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildSummaryCard(),
            const SizedBox(height: 24),
            const Text(
              'Installments & Breakdown',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1E293B),
              ),
            ),
            const SizedBox(height: 16),
            if (_feeStatusList.isEmpty)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(32.0),
                  child: Text('No fee records found.', style: TextStyle(color: Colors.grey)),
                ),
              )
            else
              ..._feeStatusList.map((item) {
                final structure = item['feeStructure'] ?? {};
                final name = structure['name'] ?? 'Fee';
                final term = structure['term'] ?? 'General';
                final dueDateStr = structure['dueDate']?.toString().split('T')[0] ?? 'N/A';

                final originalAmount = double.tryParse(item['originalAmount']?.toString() ?? '0') ?? 0.0;
                final discount = double.tryParse(item['discountAmount']?.toString() ?? '0') ?? 0.0;
                final amountPaid = double.tryParse(item['amountPaid']?.toString() ?? '0') ?? 0.0;
                final amountDue = double.tryParse(item['amountDue']?.toString() ?? '0') ?? 0.0;
                final status = item['status']?.toString() ?? 'UNPAID';

                return Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.03),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      )
                    ],
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                name,
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
                          'Term: $term     Due Date: $dueDateStr',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.blueGrey.shade500,
                          ),
                        ),
                        const Divider(height: 24),
                        
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            _buildBreakdownColumn('Original', 'Rs '),
                            if (discount > 0)
                              _buildBreakdownColumn('Discount', 'Rs ', isDiscount: true),
                            _buildBreakdownColumn('Paid', 'Rs '),
                            _buildBreakdownColumn(
                              'Balance', 
                              'Rs ', 
                              isBold: true,
                              textColor: amountDue > 0 ? const Color(0xFFEF4444) : const Color(0xFF1E293B)
                            ),
                          ],
                        )
                      ],
                    ),
                  ),
                );
              }).toList(),
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
    double total = _totalPaid + _totalDues;
    if (total == 0) total = 1;
    double progress = _totalPaid / total;

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 12, offset: const Offset(0, 4))
        ],
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              SizedBox(
                width: 120,
                height: 120,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    CircularProgressIndicator(
                      value: progress,
                      strokeWidth: 12,
                      backgroundColor: const Color(0xFFF1F5F9),
                      valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF10B981)),
                    ),
                    Center(
                      child: Text(
                        '${(progress * 100).toStringAsFixed(0)}%',
                        style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
                      ),
                    )
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Total Paid', style: TextStyle(color: Color(0xFF64748B), fontSize: 13, fontWeight: FontWeight.w600)),
                  Text('Rs ${_totalPaid.toStringAsFixed(0)}', style: const TextStyle(color: Color(0xFF10B981), fontSize: 22, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 16),
                  const Text('Pending Balance', style: TextStyle(color: Color(0xFF64748B), fontSize: 13, fontWeight: FontWeight.w600)),
                  Text('Rs ${_totalDues.toStringAsFixed(0)}', style: const TextStyle(color: Color(0xFFEF4444), fontSize: 22, fontWeight: FontWeight.bold)),
                ],
              )
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildReceiptsTab() {
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

          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.blueGrey.shade50),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.02),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                )
              ],
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
                '+ Rs ${amountPaid.toStringAsFixed(0)}',
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
