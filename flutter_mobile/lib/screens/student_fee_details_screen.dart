import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import 'record_fee_payment_screen.dart';
import 'package:intl/intl.dart';

class StudentFeeDetailsScreen extends StatefulWidget {
  final Map<String, dynamic> student;

  const StudentFeeDetailsScreen({super.key, required this.student});

  @override
  State<StudentFeeDetailsScreen> createState() => _StudentFeeDetailsScreenState();
}

class _StudentFeeDetailsScreenState extends State<StudentFeeDetailsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isLoading = true;
  String? _errorMessage;

  List<dynamic> _structures = [];
  List<dynamic> _payments = [];
  List<dynamic> _discounts = [];

  double _totalAmount = 0.0;
  double _totalDiscount = 0.0;
  double _totalPaid = 0.0;
  double _totalPending = 0.0;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _fetchFeeData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _fetchFeeData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      // Need structures to know total fee, payments, and discounts.
      final results = await Future.wait([
        ApiService.getFeeStructures(),
      ]);

      final structuresRes = results[0];

      if (structuresRes['success']) {
        final allStructures = structuresRes['data'] ?? [];
        
        final studentId = widget.student['id'];
        final classId = widget.student['classId'];

        _structures = allStructures.where((s) => s['studentId'] == studentId || s['classId'] == classId).toList();
        
        // Let's refetch student to get fresh payments and discounts
        final studentRes = await ApiService.getStudentById(studentId);
        if (studentRes['success'] && studentRes['data'] != null) {
          _payments = studentRes['data']['feePayments'] ?? [];
          _discounts = studentRes['data']['feeDiscounts'] ?? [];
        } else {
          _payments = widget.student['feePayments'] ?? [];
          _discounts = widget.student['feeDiscounts'] ?? [];
        }

        _calculateTotals();

        if (mounted) {
          setState(() {
            _isLoading = false;
          });
        }
      } else {
        if (mounted) {
          setState(() {
            _errorMessage = structuresRes['message'] ?? 'Failed to load fee details';
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

  void _calculateTotals() {
    _totalAmount = 0.0;
    _totalDiscount = 0.0;
    _totalPaid = 0.0;
    
    for (var st in _structures) {
      _totalAmount += double.tryParse(st['amount']?.toString() ?? '0') ?? 0.0;
    }

    for (var d in _discounts) {
      _totalDiscount += double.tryParse(d['amount']?.toString() ?? '0') ?? 0.0;
    }

    for (var p in _payments) {
      _totalPaid += double.tryParse(p['amountPaid']?.toString() ?? '0') ?? 0.0;
    }

    _totalPending = _totalAmount - _totalDiscount - _totalPaid;
    if (_totalPending < 0) _totalPending = 0.0;
  }

  void _navigateToRecordPayment() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => RecordFeePaymentScreen(
          student: widget.student,
          feeStructures: _structures,
        ),
      ),
    ).then((_) => _fetchFeeData()); // Refresh on return
  }

  @override
  Widget build(BuildContext context) {
    final name = '${widget.student['firstName'] ?? ''} ${widget.student['lastName'] ?? ''}'.trim();
    final admissionNo = widget.student['admissionNumber'] ?? 'N/A';
    final cls = widget.student['class'] != null ? '${widget.student['class']['name']} - ${widget.student['class']['section']}' : 'N/A';

    return Scaffold(
      backgroundColor: const Color(0xFFF4F7FE),
      appBar: AppBar(
        leading: const BackButton(),
        title: Text(
          'Fee Ledger',
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white),
        ),
        iconTheme: const IconThemeData(color: Colors.white),
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF2E2A66), Color(0xFF222854)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _fetchFeeData,
          )
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF6366F1)))
          : _errorMessage != null
              ? Center(child: Text(_errorMessage!, style: const TextStyle(color: Colors.red)))
              : Column(
                  children: [
                    // Student Header
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.vertical(bottom: Radius.circular(30)),
                        boxShadow: [
                          BoxShadow(color: Color(0x0A000000), blurRadius: 10, offset: Offset(0, 5))
                        ],
                      ),
                      child: Column(
                        children: [
                          Row(
                            children: [
                              CircleAvatar(
                                radius: 30,
                                backgroundColor: const Color(0xFFEEF2FF),
                                backgroundImage: widget.student['user'] != null && widget.student['user']['photoUrl'] != null
                                    ? NetworkImage(widget.student['user']['photoUrl'])
                                    : null,
                                child: (widget.student['user'] == null || widget.student['user']['photoUrl'] == null)
                                    ? Text(
                                        name.isNotEmpty ? name[0].toUpperCase() : '?',
                                        style: GoogleFonts.outfit(
                                          color: const Color(0xFF6366F1),
                                          fontSize: 24,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      )
                                    : null,
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      name,
                                      style: GoogleFonts.outfit(
                                        color: const Color(0xFF1E293B),
                                        fontSize: 20,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      'Class: $cls | Adm: $admissionNo',
                                      style: GoogleFonts.poppins(
                                        color: const Color(0xFF64748B),
                                        fontSize: 13,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 24),
                          Row(
                            children: [
                              Expanded(child: _buildSummaryCard('Pending', _totalPending, const Color(0xFFEF4444), const Color(0xFFFEF2F2))),
                              const SizedBox(width: 12),
                              Expanded(child: _buildSummaryCard('Paid', _totalPaid, const Color(0xFF10B981), const Color(0xFFECFDF5))),
                            ],
                          ),
                        ],
                      ),
                    ),
                    
                    const SizedBox(height: 16),
                    TabBar(
                      controller: _tabController,
                      labelColor: const Color(0xFF6366F1),
                      unselectedLabelColor: const Color(0xFF64748B),
                      indicatorColor: const Color(0xFF6366F1),
                      indicatorWeight: 3,
                      labelStyle: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16),
                      unselectedLabelStyle: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 16),
                      tabs: const [
                        Tab(text: 'Ledger'),
                        Tab(text: 'Transactions'),
                      ],
                    ),
                    Expanded(
                      child: TabBarView(
                        controller: _tabController,
                        children: [
                          _buildLedgerTab(),
                          _buildTransactionsTab(),
                        ],
                      ),
                    ),
                  ],
                ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _navigateToRecordPayment,
        backgroundColor: const Color(0xFF6366F1),
        icon: const Icon(Icons.add_card_rounded, color: Colors.white),
        label: Text(
          'Collect Fee',
          style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold, letterSpacing: 0.5),
        ),
      ),
    );
  }

  Widget _buildSummaryCard(String title, double amount, Color color, Color bgColor) {
    final currencyFormat = NumberFormat.currency(symbol: '₹', decimalDigits: 0, locale: 'en_IN');
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Column(
        children: [
          Text(
            title.toUpperCase(),
            style: GoogleFonts.poppins(
              color: color,
              fontSize: 10,
              fontWeight: FontWeight.bold,
              letterSpacing: 1,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            currencyFormat.format(amount),
            style: GoogleFonts.outfit(
              color: color,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLedgerTab() {
    final currencyFormat = NumberFormat.currency(symbol: '₹', decimalDigits: 0, locale: 'en_IN');
    
    if (_structures.isEmpty) {
      return Center(
        child: Text('No fee structures found.', style: GoogleFonts.poppins(color: const Color(0xFF64748B))),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: _structures.length,
      itemBuilder: (context, index) {
        final st = _structures[index];
        final id = st['id'];
        final amount = double.tryParse(st['amount']?.toString() ?? '0') ?? 0.0;
        final headName = st['head'] != null ? st['head']['name'] : 'Fee';
        
        // Calculate paid and discount for this specific structure
        double paid = 0;
        for (var p in _payments) {
          if (p['feeStructureId'] == id) {
            paid += double.tryParse(p['amountPaid']?.toString() ?? '0') ?? 0.0;
          }
        }
        
        double disc = 0;
        for (var d in _discounts) {
          if (d['feeStructureId'] == id) {
            disc += double.tryParse(d['amount']?.toString() ?? '0') ?? 0.0;
          }
        }
        
        final pending = amount - paid - disc;
        final isCleared = pending <= 0;

        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE2E8F0)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.02),
                blurRadius: 5,
                offset: const Offset(0, 2),
              )
            ],
          ),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    headName,
                    style: GoogleFonts.outfit(
                      color: const Color(0xFF1E293B),
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: isCleared ? const Color(0xFFDCFCE7) : const Color(0xFFFEF2F2),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      isCleared ? 'CLEARED' : 'PENDING',
                      style: GoogleFonts.poppins(
                        color: isCleared ? const Color(0xFF16A34A) : const Color(0xFFDC2626),
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildLedgerItem('Total', currencyFormat.format(amount), const Color(0xFF64748B)),
                  _buildLedgerItem('Disc', currencyFormat.format(disc), const Color(0xFFF59E0B)),
                  _buildLedgerItem('Paid', currencyFormat.format(paid), const Color(0xFF10B981)),
                  _buildLedgerItem('Due', currencyFormat.format(pending > 0 ? pending : 0), const Color(0xFFEF4444)),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildLedgerItem(String label, String value, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Text(
          label,
          style: GoogleFonts.poppins(
            color: const Color(0xFF94A3B8),
            fontSize: 11,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: GoogleFonts.outfit(
            color: color,
            fontSize: 14,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  Widget _buildTransactionsTab() {
    final currencyFormat = NumberFormat.currency(symbol: '₹', decimalDigits: 0, locale: 'en_IN');
    
    if (_payments.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.receipt_long_rounded, size: 64, color: Color(0xFFCBD5E1)),
            const SizedBox(height: 16),
            Text('No transactions found', style: GoogleFonts.poppins(color: const Color(0xFF64748B))),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: _payments.length,
      itemBuilder: (context, index) {
        final payment = _payments[index];
        final amount = double.tryParse(payment['amountPaid']?.toString() ?? '0') ?? 0.0;
        final method = payment['paymentMethod'] ?? 'CASH';
        final status = payment['status'] ?? 'PAID';
        final date = payment['paymentDate'] != null ? DateTime.tryParse(payment['paymentDate']) : null;
        
        final headName = payment['feeStructure'] != null && payment['feeStructure']['head'] != null 
            ? payment['feeStructure']['head']['name'] 
            : 'Fee Payment';

        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: const Color(0xFFEEF2FF),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.receipt_rounded, color: Color(0xFF6366F1)),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      headName,
                      style: GoogleFonts.outfit(
                        color: const Color(0xFF1E293B),
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Text(
                          date != null ? DateFormat('MMM dd, yyyy').format(date) : 'N/A',
                          style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 12),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            method,
                            style: GoogleFonts.poppins(color: const Color(0xFF475569), fontSize: 10, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    currencyFormat.format(amount),
                    style: GoogleFonts.outfit(
                      color: const Color(0xFF10B981),
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    status,
                    style: GoogleFonts.poppins(
                      color: status == 'PAID' ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }
}
