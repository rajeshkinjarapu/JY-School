import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';

class RecordFeePaymentScreen extends StatefulWidget {
  final Map<String, dynamic> student;
  final double pendingAmount;
  final List<dynamic> structures;

  const RecordFeePaymentScreen({
    super.key,
    required this.student,
    required this.pendingAmount,
    required this.structures,
  });

  @override
  State<RecordFeePaymentScreen> createState() => _RecordFeePaymentScreenState();
}

class _RecordFeePaymentScreenState extends State<RecordFeePaymentScreen> {
  final Map<String, bool> _checked = {};
  final Map<String, TextEditingController> _amountControllers = {};
  String _method = 'CASH';
  final TextEditingController _remarksCtrl = TextEditingController();
  DateTime _paymentDate = DateTime.now();
  bool _isSubmitting = false;

  final List<Map<String, dynamic>> _methods = [
    {'id': 'CASH', 'label': 'Cash', 'icon': Icons.money_rounded, 'color': Color(0xFF10B981)},
    {'id': 'UPI', 'label': 'UPI / Scan', 'icon': Icons.qr_code_scanner_rounded, 'color': Color(0xFF8B5CF6)},
    {'id': 'BANK_TRANSFER', 'label': 'Bank Txn', 'icon': Icons.account_balance_rounded, 'color': Color(0xFF0EA5E9)},
  ];

  @override
  void initState() {
    super.initState();
    for (final st in widget.structures) {
      final id = st['id'] as String;
      _checked[id] = false;
      // We will default to full amount for simplicity, although we should calculate pending per structure.
      // Since we don't have payments passed here (only total pending), we let user enter amount.
      _amountControllers[id] = TextEditingController(text: (st['amount'] ?? 0).toString());
    }
  }

  @override
  void dispose() {
    _remarksCtrl.dispose();
    for (final c in _amountControllers.values) {
      c.dispose();
    }
    super.dispose();
  }

  double get _totalAmount {
    double total = 0;
    for (final st in widget.structures) {
      final id = st['id'] as String;
      if (_checked[id] == true) {
        total += double.tryParse(_amountControllers[id]?.text ?? '0') ?? 0;
      }
    }
    return total;
  }

  Future<void> _submit() async {
    final selected = widget.structures.where((st) => _checked[st['id']] == true).toList();
    if (selected.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Select at least one fee component'), backgroundColor: Color(0xFFF43F5E)));
      return;
    }
    if (_totalAmount <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Enter a valid amount'), backgroundColor: Color(0xFFF43F5E)));
      return;
    }

    setState(() => _isSubmitting = true);

    final studentId = widget.student['id'];
    final payments = selected.map((st) {
      final amt = double.tryParse(_amountControllers[st['id']]?.text ?? '0') ?? 0;
      return {
        'studentId': studentId,
        'feeStructureId': st['id'],
        'amountPaid': amt,
        'method': _method,
        'paymentDate': _paymentDate.toIso8601String().split('T')[0],
        'remarks': _remarksCtrl.text,
      };
    }).toList();

    final result = await ApiService.recordPayments(payments);
    if (mounted) {
      setState(() => _isSubmitting = false);
      if (result['success']) {
        _showSuccessReceipt();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(result['message'] ?? 'Payment failed'),
          backgroundColor: const Color(0xFFF43F5E),
        ));
      }
    }
  }

  void _showSuccessReceipt() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _buildReceiptBottomSheet(),
    ).then((_) => Navigator.pop(context, true));
  }

  Widget _buildReceiptBottomSheet() {
    final user = widget.student['user'] ?? {};
    final name = user['name'] ?? '${widget.student['firstName']} ${widget.student['lastName']}';

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(width: 40, height: 5, decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(10))),
          const SizedBox(height: 24),
          const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 80),
          const SizedBox(height: 16),
          Text('Payment Successful!', style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
          const SizedBox(height: 8),
          Text('₹${_totalAmount.toStringAsFixed(0)} has been recorded for $name.', textAlign: TextAlign.center, style: GoogleFonts.poppins(color: const Color(0xFF64748B))),
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(16), border: Border.all(color: const Color(0xFFE2E8F0))),
            child: Column(
              children: [
                _buildReceiptRow('Receipt Date', DateFormat('MMM dd, yyyy').format(DateTime.now())),
                _buildReceiptRow('Payment Method', _method),
                _buildReceiptRow('Transaction ID', 'TXN-${DateTime.now().millisecondsSinceEpoch.toString().substring(5)}'),
              ],
            ),
          ),
          const SizedBox(height: 32),
          SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton.icon(
              onPressed: () => Navigator.pop(context),
              icon: const Icon(Icons.print_rounded),
              label: Text('Print Receipt (PDF)', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16)),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF6366F1),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
            ),
          ),
          const SizedBox(height: 12),
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Done', style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontWeight: FontWeight.w600)),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _buildReceiptRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: GoogleFonts.poppins(color: const Color(0xFF64748B))),
          Text(value, style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text('Record Payment', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white)),
        backgroundColor: const Color(0xFF4F46E5),
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: _isSubmitting
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildPaymentMethods(),
                  const SizedBox(height: 32),
                  Text('Fee Components', style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
                  const SizedBox(height: 16),
                  _buildStructuresList(),
                  const SizedBox(height: 32),
                  _buildRemarksField(),
                  const SizedBox(height: 120), // Padding for sticky bottom
                ],
              ),
            ),
      bottomSheet: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -5))],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Total Paying', style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF64748B))),
                Text('₹${_totalAmount.toStringAsFixed(0)}', style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.bold, color: const Color(0xFF10B981))),
              ],
            ),
            ElevatedButton(
              onPressed: _submit,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF10B981),
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              child: Text('Confirm Pay', style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentMethods() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Payment Method', style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
        const SizedBox(height: 16),
        Row(
          children: _methods.map((m) {
            final isSelected = _method == m['id'];
            final color = m['color'] as Color;
            return Expanded(
              child: GestureDetector(
                onTap: () => setState(() => _method = m['id']),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  margin: const EdgeInsets.only(right: 8),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  decoration: BoxDecoration(
                    color: isSelected ? color : Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: isSelected ? color : const Color(0xFFE2E8F0), width: 1.5),
                    boxShadow: isSelected ? [BoxShadow(color: color.withOpacity(0.3), blurRadius: 10, offset: const Offset(0, 4))] : [],
                  ),
                  child: Column(
                    children: [
                      Icon(m['icon'], color: isSelected ? Colors.white : const Color(0xFF64748B)),
                      const SizedBox(height: 8),
                      Text(
                        m['label'],
                        style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.bold, color: isSelected ? Colors.white : const Color(0xFF64748B)),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildStructuresList() {
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: widget.structures.length,
      itemBuilder: (context, index) {
        final st = widget.structures[index];
        final id = st['id'] as String;
        final isChecked = _checked[id] ?? false;

        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: isChecked ? const Color(0xFF6366F1) : const Color(0xFFE2E8F0), width: 1.5),
          ),
          child: CheckboxListTile(
            value: isChecked,
            onChanged: (val) {
              setState(() => _checked[id] = val ?? false);
            },
            activeColor: const Color(0xFF6366F1),
            title: Text(st['name'] ?? 'Fee Component', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
            subtitle: isChecked
                ? Padding(
                    padding: const EdgeInsets.only(top: 8.0),
                    child: TextField(
                      controller: _amountControllers[id],
                      keyboardType: TextInputType.number,
                      onChanged: (v) => setState(() {}),
                      decoration: InputDecoration(
                        labelText: 'Amount Paying',
                        prefixText: '₹ ',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                        isDense: true,
                      ),
                    ),
                  )
                : Text('Total: ₹${st['amount']}', style: GoogleFonts.poppins(color: const Color(0xFF64748B))),
          ),
        );
      },
    );
  }

  Widget _buildRemarksField() {
    return TextField(
      controller: _remarksCtrl,
      maxLines: 3,
      decoration: InputDecoration(
        labelText: 'Remarks (Optional)',
        alignLabelWithHint: true,
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
      ),
    );
  }
}
