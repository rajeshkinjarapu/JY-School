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

  double _totalAmount = 0.0;
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
      final results = await Future.wait([
        ApiService.getFeeStructures(),
      ]);

      final structuresRes = results[0];

      if (structuresRes['success']) {
        final allStructures = structuresRes['data'] ?? [];
        
        final studentId = widget.student['id'];
        final classId = widget.student['classId'];

        _structures = allStructures.where((s) => s['studentId'] == studentId || s['classId'] == classId).toList();
        
        final studentRes = await ApiService.getStudentById(studentId);
        if (studentRes['success'] && studentRes['data'] != null) {
          _payments = studentRes['data']['feePayments'] ?? [];
        } else {
          _payments = widget.student['feePayments'] ?? [];
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
    _totalPaid = 0.0;
    _totalPending = 0.0;

    for (var structure in _structures) {
      _totalAmount += double.tryParse(structure['amount']?.toString() ?? '0') ?? 0;
    }
    for (var payment in _payments) {
      if (payment['status'] == 'PAID' || payment['status'] == 'PARTIAL') {
        _totalPaid += double.tryParse(payment['amountPaid']?.toString() ?? '0') ?? 0;
      }
    }

    _totalPending = _totalAmount - _totalPaid;
    if (_totalPending < 0) _totalPending = 0;
  }

  @override
  Widget build(BuildContext context) {
    final user = widget.student['user'] ?? {};
    final name = user['name'] ?? '${widget.student['firstName']} ${widget.student['lastName']}';
    final initials = name.isNotEmpty ? name.substring(0, 1).toUpperCase() : '?';
    final photoUrl = user['photoUrl'];

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : CustomScrollView(
              slivers: [
                _buildSliverAppBar(name, initials, photoUrl),
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.all(20.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildFeeSummaryCards(),
                        const SizedBox(height: 32),
                        
                        Text('Fee Structures & Due', style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
                        const SizedBox(height: 16),
                        _buildStructuresList(),
                        
                        const SizedBox(height: 32),
                        Text('Payment History', style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
                        const SizedBox(height: 16),
                        _buildPaymentsList(),
                        const SizedBox(height: 80),
                      ],
                    ),
                  ),
                ),
              ],
            ),
      floatingActionButton: Padding(
        padding: const EdgeInsets.only(bottom: 24.0, right: 8.0),
        child: FloatingActionButton.extended(
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => RecordFeePaymentScreen(
                  student: widget.student,
                  pendingAmount: _totalPending,
                  structures: _structures,
                ),
              ),
            ).then((_) => _fetchFeeData());
          },
          backgroundColor: const Color(0xFF10B981),
          icon: const Icon(Icons.payment_rounded, color: Colors.white),
          label: Text('Pay ₹${_totalPending.toStringAsFixed(0)}', style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
        ),
      ),
    );
  }

  Widget _buildSliverAppBar(String name, String initials, String? photoUrl) {
    return SliverAppBar(
      expandedHeight: 220.0,
      floating: false,
      pinned: true,
      elevation: 0,
      backgroundColor: const Color(0xFF4F46E5),
      iconTheme: const IconThemeData(color: Colors.white),
      flexibleSpace: FlexibleSpaceBar(
        background: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF4F46E5), Color(0xFF6366F1)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: SafeArea(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const SizedBox(height: 20),
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 3),
                    boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 10, offset: const Offset(0, 5))],
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(40),
                    child: (photoUrl != null && photoUrl.toString().isNotEmpty)
                        ? Image.network(
                            ApiService.getImageUrl(photoUrl),
                            fit: BoxFit.cover,
                            headers: const {'ngrok-skip-browser-warning': '69420'},
                            errorBuilder: (c, e, s) => Container(color: Colors.white24, child: Center(child: Text(initials, style: GoogleFonts.outfit(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold)))),
                          )
                        : Container(color: Colors.white24, child: Center(child: Text(initials, style: GoogleFonts.outfit(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold)))),
                  ),
                ),
                const SizedBox(height: 12),
                Text(name, style: GoogleFonts.outfit(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
                Text(widget.student['admissionNumber'] ?? 'Unknown ID', style: GoogleFonts.poppins(color: Colors.white70, fontSize: 14)),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildFeeSummaryCards() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 15, offset: const Offset(0, 5))],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildSummaryItem('Total Fee', '₹${_totalAmount.toStringAsFixed(0)}', const Color(0xFF6366F1)),
          Container(width: 1, height: 40, color: Colors.grey.withOpacity(0.2)),
          _buildSummaryItem('Paid', '₹${_totalPaid.toStringAsFixed(0)}', const Color(0xFF10B981)),
          Container(width: 1, height: 40, color: Colors.grey.withOpacity(0.2)),
          _buildSummaryItem('Pending', '₹${_totalPending.toStringAsFixed(0)}', const Color(0xFFF43F5E)),
        ],
      ),
    );
  }

  Widget _buildSummaryItem(String label, String value, Color color) {
    return Column(
      children: [
        Text(label, style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF64748B), fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        Text(value, style: GoogleFonts.outfit(fontSize: 20, color: color, fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _buildStructuresList() {
    if (_structures.isEmpty) return const Text('No fee structures found.');
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: _structures.length,
      itemBuilder: (context, index) {
        final structure = _structures[index];
        final amount = double.tryParse(structure['amount']?.toString() ?? '0') ?? 0;
        final dueDate = structure['dueDate'] != null ? DateFormat('MMM dd, yyyy').format(DateTime.parse(structure['dueDate'])) : 'No Due Date';
        
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
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: const Color(0xFFEEF2FF), borderRadius: BorderRadius.circular(12)),
                child: const Icon(Icons.account_tree_rounded, color: Color(0xFF6366F1)),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(structure['name'] ?? 'Fee Installment', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16, color: const Color(0xFF1E293B))),
                    Text('Due: $dueDate', style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF64748B))),
                  ],
                ),
              ),
              Text('₹${amount.toStringAsFixed(0)}', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 18, color: const Color(0xFF6366F1))),
            ],
          ),
        );
      },
    );
  }

  Widget _buildPaymentsList() {
    if (_payments.isEmpty) return const Text('No payments recorded yet.');
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: _payments.length,
      itemBuilder: (context, index) {
        final payment = _payments[index];
        final amount = double.tryParse(payment['amountPaid']?.toString() ?? '0') ?? 0;
        final payDate = payment['paymentDate'] != null ? DateFormat('MMM dd, yyyy').format(DateTime.parse(payment['paymentDate'])) : 'N/A';
        final status = payment['status'] ?? 'PENDING';
        
        Color statusColor = const Color(0xFFF59E0B);
        if (status == 'PAID') statusColor = const Color(0xFF10B981);
        if (status == 'REJECTED') statusColor = const Color(0xFFEF4444);

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
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: statusColor.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                child: Icon(Icons.receipt_long, color: statusColor),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('₹${amount.toStringAsFixed(0)}', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 18, color: const Color(0xFF1E293B))),
                    Text('Paid on $payDate', style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF64748B))),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(color: statusColor.withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
                child: Text(status.toString().toUpperCase(), style: GoogleFonts.poppins(color: statusColor, fontWeight: FontWeight.bold, fontSize: 11)),
              ),
            ],
          ),
        );
      },
    );
  }
}
