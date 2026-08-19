import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/api_service.dart';
import '../widgets/app_drawer.dart';
import 'dart:convert';

class FinanceScreen extends StatefulWidget {
  const FinanceScreen({super.key});

  @override
  State<FinanceScreen> createState() => _FinanceScreenState();
}

class _FinanceScreenState extends State<FinanceScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isLoading = true;
  String? _errorMessage;

  List<dynamic> _payments = [];
  List<dynamic> _structures = [];
  List<dynamic> _classes = [];
  List<dynamic> _filteredPayments = [];

  // KPIs
  double _totalCollected = 0.0;
  double _todayCollected = 0.0;
  double _pendingDues = 0.0;

  // Filters
  String _searchTerm = '';
  String _selectedClass = 'ALL';
  String _selectedStatus = 'ALL';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _fetchData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
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
        ApiService.getClasses(),
      ]);

      final paymentsRes = results[0];
      final structuresRes = results[1];
      final classesRes = results[2];

      if (paymentsRes['success'] && structuresRes['success'] && classesRes['success']) {
        setState(() {
          _payments = paymentsRes['data'] ?? [];
          _structures = structuresRes['data'] ?? [];
          _classes = classesRes['data'] ?? [];
          _calculateKPIs();
          _applyFilters();
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = paymentsRes['message'] ?? structuresRes['message'] ?? classesRes['message'] ?? 'Failed to load finance data';
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

    double totalStructuresAmount = 0.0;
    for (var struct in _structures) {
      totalStructuresAmount += double.tryParse(struct['amount']?.toString() ?? '0.0') ?? 0.0;
    }

    _pendingDues = totalStructuresAmount - _totalCollected;
    if (_pendingDues < 0) _pendingDues = 0.0;
  }

  void _applyFilters() {
    setState(() {
      _filteredPayments = _payments.where((payment) {
        // Search filter
        final student = payment['student'] ?? {};
        final studentName = '${student['firstName'] ?? ''} ${student['lastName'] ?? ''}'.toLowerCase();
        final searchMatch = studentName.contains(_searchTerm.toLowerCase());

        // Class filter
        final classInfo = student['class'] ?? {};
        final classId = classInfo['id']?.toString() ?? '';
        final classMatch = _selectedClass == 'ALL' || classId == _selectedClass;

        // Status filter
        final status = payment['status']?.toString().toUpperCase() ?? 'PENDING';
        final statusMatch = _selectedStatus == 'ALL' || status == _selectedStatus;

        return searchMatch && classMatch && statusMatch;
      }).toList();
    });
  }

  Future<void> _approvePayment(String id) async {
    setState(() => _isLoading = true);
    final res = await ApiService.approvePayment(id);
    if (res['success']) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Payment approved successfully!'), backgroundColor: Colors.emerald),
      );
      _fetchData();
    } else {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed: ${res['message']}'), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _deletePayment(String id) async {
    setState(() => _isLoading = true);
    final res = await ApiService.deletePayment(id);
    if (res['success']) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Payment record deleted successfully!'), backgroundColor: Colors.orange),
      );
      _fetchData();
    } else {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed: ${res['message']}'), backgroundColor: Colors.red),
      );
    }
  }

  void _showRecordPaymentDialog() {
    showDialog(
      context: context,
      builder: (context) => RecordPaymentDialog(
        classes: _classes,
        structures: _structures,
        onSuccess: () {
          Navigator.pop(context);
          _fetchData();
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      drawer: const AppDrawer(currentRoute: 'fees'),
      appBar: AppBar(
        title: const Text(
          'Finance & Fees',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF1E293B),
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          labelColor: const Color(0xFF6366F1),
          unselectedLabelColor: const Color(0xFF64748B),
          indicatorColor: const Color(0xFF6366F1),
          indicatorWeight: 3,
          isScrollable: true,
          tabs: const [
            Tab(text: 'Overview'),
            Tab(text: 'Transactions'),
            Tab(text: 'Structures'),
            Tab(text: 'Reminders'),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _fetchData,
          )
        ],
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
                        Text(_errorMessage!, textAlign: TextAlign.center, style: const TextStyle(color: Colors.blueGrey)),
                        const SizedBox(height: 20),
                        ElevatedButton(onPressed: _fetchData, child: const Text('Retry')),
                      ],
                    ),
                  ),
                )
              : TabBarView(
                  controller: _tabController,
                  children: [
                    _buildOverviewTab(),
                    _buildTransactionsTab(),
                    _buildStructuresTab(),
                    _buildRemindersTab(),
                  ],
                ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showRecordPaymentDialog,
        backgroundColor: const Color(0xFF6366F1),
        icon: const Icon(Icons.add_card, color: Colors.white),
        label: const Text('Record Fee', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
    );
  }

  Widget _buildOverviewTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // KPI cards
          _buildKPICards(),
          const SizedBox(height: 24),

          // Overview Details header
          const Text(
            'Quick Actions & Status',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
          ),
          const SizedBox(height: 12),

          _buildQuickActionCard(
            title: 'Outstanding Collection',
            subtitle: 'Review overall student pending dues',
            icon: Icons.account_balance_wallet_outlined,
            color: const Color(0xFFFF56A5),
            onTap: () => _tabController.animateTo(1),
          ),
          const SizedBox(height: 12),
          _buildQuickActionCard(
            title: 'Class Fee Structure Configuration',
            subtitle: 'Manage and view active fee templates',
            icon: Icons.list_alt_rounded,
            color: const Color(0xFF2DBDFD),
            onTap: () => _tabController.animateTo(2),
          ),
        ],
      ),
    );
  }

  Widget _buildKPICards() {
    return Column(
      children: [
        _buildStatCard(
          title: 'Total Collected',
          value: '₹ ${_totalCollected.toStringAsFixed(2)}',
          icon: Icons.check_circle_rounded,
          gradientColors: [const Color(0xFF10B981), const Color(0xFF34D399)],
        ),
        const SizedBox(height: 16),
        _buildStatCard(
          title: 'Collected Today',
          value: '₹ ${_todayCollected.toStringAsFixed(2)}',
          icon: Icons.today_rounded,
          gradientColors: [const Color(0xFF6366F1), const Color(0xFF818CF8)],
        ),
        const SizedBox(height: 16),
        _buildStatCard(
          title: 'Total Pending Dues',
          value: '₹ ${_pendingDues.toStringAsFixed(2)}',
          icon: Icons.pending_actions_rounded,
          gradientColors: [const Color(0xFFEF4444), const Color(0xFFF87171)],
        ),
      ],
    );
  }

  Widget _buildStatCard({
    required String title,
    required String value,
    required IconData icon,
    required List<Color> gradientColors,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: gradientColors,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: gradientColors[0].withOpacity(0.3),
            blurRadius: 12,
            offset: const Offset(0, 6),
          )
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title.toUpperCase(),
                style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1),
              ),
              const SizedBox(height: 8),
              Text(
                value,
                style: const TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: Colors.white, size: 28),
          )
        ],
      ),
    );
  }

  Widget _buildQuickActionCard({
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.all(16),
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
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
                  const SizedBox(height: 4),
                  Text(subtitle, style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: Color(0xFF64748B)),
          ],
        ),
      ),
    );
  }

  Widget _buildTransactionsTab() {
    return Column(
      children: [
        // Filters Section
        _buildFiltersSection(),

        // Payments list
        Expanded(
          child: RefreshIndicator(
            onRefresh: _fetchData,
            child: _filteredPayments.isEmpty
                ? const Center(child: Text('No transaction records match filters.'))
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    itemCount: _filteredPayments.length,
                    itemBuilder: (context, index) {
                      final payment = _filteredPayments[index];
                      return _buildTransactionItemCard(payment);
                    },
                  ),
          ),
        ),
      ],
    );
  }

  Widget _buildFiltersSection() {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Column(
        children: [
          TextField(
            onChanged: (val) {
              setState(() {
                _searchTerm = val;
              });
              _applyFilters();
            },
            decoration: InputDecoration(
              hintText: 'Search by student name...',
              prefixIcon: const Icon(Icons.search),
              fillColor: const Color(0xFFF1F5F9),
              filled: true,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
              contentPadding: const EdgeInsets.symmetric(vertical: 0),
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: _selectedClass,
                      isExpanded: true,
                      style: const TextStyle(fontSize: 14, color: Color(0xFF1E293B)),
                      items: [
                        const DropdownMenuItem(value: 'ALL', child: Text('All Classes')),
                        ..._classes.map((c) => DropdownMenuItem(
                              value: c['id']?.toString() ?? '',
                              child: Text('${c['className'] ?? ''} - ${c['section'] ?? ''}'),
                            )),
                      ],
                      onChanged: (val) {
                        setState(() {
                          _selectedClass = val ?? 'ALL';
                        });
                        _applyFilters();
                      },
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: _selectedStatus,
                      isExpanded: true,
                      style: const TextStyle(fontSize: 14, color: Color(0xFF1E293B)),
                      items: const [
                        DropdownMenuItem(value: 'ALL', child: Text('All Status')),
                        DropdownMenuItem(value: 'PAID', child: Text('PAID')),
                        DropdownMenuItem(value: 'PENDING', child: Text('PENDING')),
                      ],
                      onChanged: (val) {
                        setState(() {
                          _selectedStatus = val ?? 'ALL';
                        });
                        _applyFilters();
                      },
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTransactionItemCard(dynamic payment) {
    final student = payment['student'] ?? {};
    final studentName = '${student['firstName'] ?? ''} ${student['lastName'] ?? ''}';
    final classInfo = student['class'] ?? {};
    final className = '${classInfo['className'] ?? ''} - ${classInfo['section'] ?? ''}';

    final structure = payment['feeStructure'] ?? {};
    final structureName = structure['name'] ?? 'Fee Payment';

    final amountPaid = double.tryParse(payment['amountPaid']?.toString() ?? '0') ?? 0.0;
    final method = payment['paymentMethod']?.toString() ?? 'CASH';
    final status = payment['status']?.toString().toUpperCase() ?? 'PENDING';

    final payDate = payment['paymentDate']?.toString() ?? payment['createdAt']?.toString() ?? '';
    final dateFormatted = payDate.split('T')[0];

    final isPaid = status == 'PAID';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 8, offset: const Offset(0, 2)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  studentName,
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: isPaid ? Colors.emerald.withOpacity(0.1) : Colors.amber.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  status,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: isPaid ? Colors.emerald : Colors.amber.shade800,
                  ),
                ),
              )
            ],
          ),
          const SizedBox(height: 4),
          Text(
            'Class: $className  |  $structureName',
            style: const TextStyle(fontSize: 13, color: Color(0xFF64748B)),
          ),
          const Divider(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Amount: ₹ ${amountPaid.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                  Text('Method: $method  |  Date: $dateFormatted', style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                ],
              ),
              Row(
                children: [
                  if (!isPaid)
                    IconButton(
                      icon: const Icon(Icons.check_circle_outline, color: Colors.emerald),
                      tooltip: 'Approve Payment',
                      onPressed: () => _approvePayment(payment['id']?.toString() ?? ''),
                    ),
                  IconButton(
                    icon: const Icon(Icons.delete_outline, color: Colors.redAccent),
                    tooltip: 'Delete Record',
                    onPressed: () {
                      showDialog(
                        context: context,
                        builder: (context) => AlertDialog(
                          title: const Text('Delete Payment'),
                          content: const Text('Are you sure you want to delete this payment record permanently?'),
                          actions: [
                            TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
                            TextButton(
                              onPressed: () {
                                Navigator.pop(context);
                                _deletePayment(payment['id']?.toString() ?? '');
                              },
                              child: const Text('Delete', style: TextStyle(color: Colors.red)),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ],
              )
            ],
          )
        ],
      ),
    );
  }

  Widget _buildStructuresTab() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _structures.length,
      itemBuilder: (context, index) {
        final struct = _structures[index];
        final classObj = struct['class'] ?? {};
        final className = '${classObj['className'] ?? ''} - ${classObj['section'] ?? ''}';
        final feeName = struct['name'] ?? 'Fee Name';
        final group = struct['group'] ?? 'Tuition fee';
        final amount = double.tryParse(struct['amount']?.toString() ?? '0') ?? 0.0;
        final status = struct['status'] ?? 'Active';

        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(color: Colors.black.withOpacity(0.01), blurRadius: 6, offset: const Offset(0, 2)),
            ],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(feeName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Color(0xFF1E293B))),
                    const SizedBox(height: 4),
                    Text('Class: $className  |  Group: $group', style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text('₹ ${amount.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Color(0xFF6366F1))),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: status.toUpperCase() == 'ACTIVE' ? Colors.emerald.withOpacity(0.1) : Colors.grey.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      status,
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: status.toUpperCase() == 'ACTIVE' ? Colors.emerald : Colors.grey,
                      ),
                    ),
                  )
                ],
              )
            ],
          ),
        );
      },
    );
  }

  // =====================================
  // REMINDERS TAB
  // =====================================
  List<dynamic> _pendingBalances = [];
  bool _isLoadingReminders = false;
  String _reminderSearch = '';
  String _reminderClass = 'ALL';

  Future<void> _fetchPendingBalances() async {
    setState(() => _isLoadingReminders = true);
    try {
      final res = await ApiService.getPendingBalances(classId: _reminderClass, search: _reminderSearch);
      if (mounted) {
        setState(() {
          _pendingBalances = res['success'] ? (res['data'] ?? []) : [];
          _isLoadingReminders = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoadingReminders = false);
      }
    }
  }

  Widget _buildRemindersTab() {
    // If we haven't loaded yet, trigger load
    if (_pendingBalances.isEmpty && !_isLoadingReminders && _reminderSearch.isEmpty && _reminderClass == 'ALL') {
      _fetchPendingBalances();
    }

    return Column(
      children: [
        // Filters
        Container(
          color: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              Expanded(
                flex: 2,
                child: TextField(
                  onChanged: (val) {
                    _reminderSearch = val;
                  },
                  onSubmitted: (_) => _fetchPendingBalances(),
                  decoration: InputDecoration(
                    hintText: 'Search student...',
                    prefixIcon: const Icon(Icons.search),
                    fillColor: const Color(0xFFF1F5F9),
                    filled: true,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                    contentPadding: const EdgeInsets.symmetric(vertical: 0),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                flex: 1,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: _reminderClass,
                      isExpanded: true,
                      style: const TextStyle(fontSize: 13, color: Color(0xFF1E293B)),
                      items: [
                        const DropdownMenuItem(value: 'ALL', child: Text('All')),
                        ..._classes.map((c) => DropdownMenuItem(
                              value: c['id']?.toString() ?? '',
                              child: Text('${c['className'] ?? ''}-${c['section'] ?? ''}'),
                            )),
                      ],
                      onChanged: (val) {
                        setState(() => _reminderClass = val ?? 'ALL');
                        _fetchPendingBalances();
                      },
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        
        // List
        Expanded(
          child: _isLoadingReminders
              ? const Center(child: CircularProgressIndicator())
              : _pendingBalances.isEmpty
                  ? const Center(child: Text('No students with pending balances.'))
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _pendingBalances.length,
                      itemBuilder: (context, index) {
                        final student = _pendingBalances[index];
                        final name = student['name'] ?? '';
                        final className = student['className'] ?? '';
                        final balance = double.tryParse(student['balance']?.toString() ?? '0') ?? 0;
                        final phone = student['phone']?.toString() ?? '';
                        final photo = student['photo'];
                        final image = photo != null && photo.isNotEmpty
                            ? NetworkImage(photo)
                            : NetworkImage('https://ui-avatars.com/api/?name=${Uri.encodeComponent(name)}');

                        return Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [
                              BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 4)),
                            ],
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                          ),
                          child: Row(
                            children: [
                              CircleAvatar(radius: 26, backgroundImage: image as ImageProvider),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF1E293B))),
                                    const SizedBox(height: 4),
                                    Text('Class: $className', style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                                    const SizedBox(height: 4),
                                    Text('Due: ₹ ${balance.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFFEF4444))),
                                  ],
                                ),
                              ),
                              IconButton(
                                onPressed: () async {
                                  if (phone.isEmpty) {
                                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('No phone number found.')));
                                    return;
                                  }
                                  final cleanPhone = phone.replaceAll(RegExp(r'\D'), '');
                                  final fullPhone = cleanPhone.length == 10 ? '91$cleanPhone' : cleanPhone;
                                  final msg = Uri.encodeComponent(
                                      "Dear Parent of *$name* ($className),\n\nThis is a gentle reminder from *JY SCHOOL*.\n\nYour child's outstanding fee balance is *₹${balance.toStringAsFixed(0)}*.\n\nKindly clear the dues at the earliest. For queries, contact the school office.");
                                  final url = 'https://wa.me/$fullPhone?text=$msg';
                                  
                                  // Requires url_launcher
                                  try {
                                    final Uri uri = Uri.parse(url);
                                    if (await canLaunchUrl(uri)) {
                                      await launchUrl(uri, mode: LaunchMode.externalApplication);
                                    } else {
                                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not launch WhatsApp.')));
                                    }
                                  } catch (e) {
                                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to open WhatsApp.')));
                                  }
                                },
                                icon: Container(
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF25D366).withOpacity(0.1),
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(Icons.message, color: Color(0xFF25D366), size: 20),
                                ),
                                tooltip: 'Send WhatsApp Reminder',
                              ),
                            ],
                          ),
                        );
                      },
                    ),
        )
      ],
    );
  }
}

// Dialog for recording payments
class RecordPaymentDialog extends StatefulWidget {
  final List<dynamic> classes;
  final List<dynamic> structures;
  final VoidCallback onSuccess;

  const RecordPaymentDialog({
    super.key,
    required this.classes,
    required this.structures,
    required this.onSuccess,
  });

  @override
  State<RecordPaymentDialog> createState() => _RecordPaymentDialogState();
}

class _RecordPaymentDialogState extends State<RecordPaymentDialog> {
  String? _selectedClassId;
  String? _selectedStudentId;
  String? _selectedStructureId;
  String _selectedMethod = 'CASH';
  final TextEditingController _amountController = TextEditingController();
  final TextEditingController _remarksController = TextEditingController();

  List<dynamic> _students = [];
  bool _loadingStudents = false;
  bool _isSubmitting = false;

  Future<void> _fetchClassStudents(String classId) async {
    setState(() {
      _loadingStudents = true;
      _selectedStudentId = null;
      _students = [];
    });

    final res = await ApiService.getClassStudents(classId);

    if (mounted) {
      setState(() {
        if (res['success']) {
          _students = res['data'] ?? [];
        }
        _loadingStudents = false;
      });
    }
  }

  Future<void> _submit() async {
    if (_selectedStudentId == null || _selectedStructureId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select Student and Fee Category'), backgroundColor: Colors.orange),
      );
      return;
    }

    final amountStr = _amountController.text.trim();
    if (amountStr.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter an amount'), backgroundColor: Colors.orange),
      );
      return;
    }

    final amount = double.tryParse(amountStr);
    if (amount == null || amount <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid positive amount'), backgroundColor: Colors.orange),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    final res = await ApiService.recordPayment(
      studentId: _selectedStudentId!,
      feeStructureId: _selectedStructureId!,
      amountPaid: amount,
      paymentMethod: _selectedMethod,
      remarks: _remarksController.text.trim(),
    );

    if (mounted) {
      setState(() => _isSubmitting = false);
      if (res['success']) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Payment recorded successfully!'), backgroundColor: Colors.emerald),
        );
        widget.onSuccess();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(res['message'] ?? 'Failed to record payment'), backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // Filter structures matching the selected class
    final availableStructures = _selectedClassId == null
        ? widget.structures
        : widget.structures.where((s) => s['class']?['id']?.toString() == _selectedClassId).toList();

    return AlertDialog(
      title: const Text('Record Fee Payment', style: TextStyle(fontWeight: FontWeight.bold)),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Select Class
            const Text('Select Class', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(12)),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  hint: const Text('Choose Class'),
                  value: _selectedClassId,
                  isExpanded: true,
                  items: widget.classes.map((c) => DropdownMenuItem(
                        value: c['id']?.toString() ?? '',
                        child: Text('${c['className'] ?? ''} - ${c['section'] ?? ''}'),
                      )).toList(),
                  onChanged: (val) {
                    setState(() {
                      _selectedClassId = val;
                    });
                    if (val != null) {
                      _fetchClassStudents(val);
                    }
                  },
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Select Student
            const Text('Select Student', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(12)),
              child: DropdownButtonHideUnderline(
                child: _loadingStudents
                    ? const Padding(
                        padding: EdgeInsets.symmetric(vertical: 12),
                        child: Center(child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))),
                      )
                    : DropdownButton<String>(
                        hint: const Text('Choose Student'),
                        value: _selectedStudentId,
                        isExpanded: true,
                        items: _students.map((s) {
                          final name = '${s['firstName'] ?? ''} ${s['lastName'] ?? ''}';
                          return DropdownMenuItem(
                            value: s['id']?.toString() ?? '',
                            child: Text(name),
                          );
                        }).toList(),
                        onChanged: (val) {
                          setState(() {
                            _selectedStudentId = val;
                          });
                        },
                      ),
              ),
            ),
            const SizedBox(height: 16),

            // Select Structure / Fee Type
            const Text('Select Fee Category', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(12)),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  hint: const Text('Choose Fee Category'),
                  value: _selectedStructureId,
                  isExpanded: true,
                  items: availableStructures.map((s) {
                    final name = s['name'] ?? 'Fee';
                    final amount = s['amount']?.toString() ?? '0';
                    return DropdownMenuItem(
                      value: s['id']?.toString() ?? '',
                      child: Text('$name (₹ $amount)'),
                    );
                  }).toList(),
                  onChanged: (val) {
                    setState(() {
                      _selectedStructureId = val;
                    });
                    // Autofill structure amount
                    if (val != null) {
                      final matched = widget.structures.firstWhere((s) => s['id']?.toString() == val, orElse: () => null);
                      if (matched != null) {
                        _amountController.text = matched['amount']?.toString() ?? '';
                      }
                    }
                  },
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Payment Method
            const Text('Payment Method', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(12)),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: _selectedMethod,
                  isExpanded: true,
                  items: const [
                    DropdownMenuItem(value: 'CASH', child: Text('Cash')),
                    DropdownMenuItem(value: 'UPI', child: Text('UPI / PhonePe / GPay')),
                    DropdownMenuItem(value: 'BANK_TRANSFER', child: Text('Bank Transfer / IMPS')),
                  ],
                  onChanged: (val) {
                    setState(() {
                      _selectedMethod = val ?? 'CASH';
                    });
                  },
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Amount
            const Text('Amount Paid (₹)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
            const SizedBox(height: 6),
            TextField(
              controller: _amountController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: InputDecoration(
                hintText: 'Enter amount',
                fillColor: const Color(0xFFF1F5F9),
                filled: true,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              ),
            ),
            const SizedBox(height: 16),

            // Remarks
            const Text('Remarks / Transaction Ref', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
            const SizedBox(height: 6),
            TextField(
              controller: _remarksController,
              decoration: InputDecoration(
                hintText: 'Enter remarks',
                fillColor: const Color(0xFFF1F5F9),
                filled: true,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              ),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel', style: TextStyle(color: Color(0xFF64748B))),
        ),
        ElevatedButton(
          onPressed: _isSubmitting ? null : _submit,
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF6366F1),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          child: _isSubmitting
              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : const Text('Submit Payment', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        ),
      ],
    );
  }
}
