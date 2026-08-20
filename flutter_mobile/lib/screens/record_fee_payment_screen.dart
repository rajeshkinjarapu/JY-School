import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class RecordFeePaymentScreen extends StatefulWidget {
  final Map<String, dynamic> student;
  final List<dynamic> feeStructures;

  const RecordFeePaymentScreen({
    super.key,
    required this.student,
    required this.feeStructures,
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

  late List<dynamic> _availableStructures;

  final List<String> _methods = ['CASH', 'UPI', 'CHEQUE', 'NEFT', 'RTGS', 'CARD'];
  final Map<String, Color> _methodColors = {
    'CASH': const Color(0xFF10B981),
    'UPI': const Color(0xFF8B5CF6),
    'CHEQUE': const Color(0xFF0EA5E9),
    'NEFT': const Color(0xFFF59E0B),
    'RTGS': const Color(0xFF6366F1),
    'CARD': const Color(0xFFEC4899),
  };

  @override
  void initState() {
    super.initState();
    _calculateAvailable();
    for (final st in _availableStructures) {
      final id = st['id'] as String;
      _checked[id] = false;
      final pending = _getPending(st);
      _amountControllers[id] = TextEditingController(text: pending > 0 ? pending.toStringAsFixed(0) : '0');
    }
  }

  @override
  void dispose() {
    _remarksCtrl.dispose();
    for (final c in _amountControllers.values) { c.dispose(); }
    super.dispose();
  }

  void _calculateAvailable() {
    final studentId = widget.student['id'];
    final classId = widget.student['classId'];
    _availableStructures = widget.feeStructures.where((s) => s['studentId'] == studentId || s['classId'] == classId).toList();
  }

  double _getPending(dynamic structure) {
    final payments = (widget.student['feePayments'] as List?) ?? [];
    double paid = 0.0;
    for (final p in payments) {
      if (p['feeStructureId'] == structure['id']) paid += (p['amountPaid'] ?? 0.0).toDouble();
    }
    final discounts = (widget.student['feeDiscounts'] as List?) ?? [];
    double disc = 0.0;
    for (final d in discounts) {
      if (d['feeStructureId'] == structure['id']) disc = (d['amount'] ?? 0.0).toDouble();
    }
    return ((structure['amount'] ?? 0.0).toDouble() - disc - paid).clamp(0, double.infinity);
  }

  double get _totalAmount {
    double total = 0;
    for (final st in _availableStructures) {
      final id = st['id'] as String;
      if (_checked[id] == true) {
        total += double.tryParse(_amountControllers[id]?.text ?? '0') ?? 0;
      }
    }
    return total;
  }

  Future<void> _submit() async {
    final selected = _availableStructures.where((st) => _checked[st['id']] == true).toList();
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
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('Payment of ₹${_totalAmount.toStringAsFixed(0)} recorded!'),
          backgroundColor: const Color(0xFF10B981),
        ));
        Navigator.pop(context, true);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(result['message'] ?? 'Payment failed'),
          backgroundColor: const Color(0xFFF43F5E),
        ));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = widget.student['user'] ?? {};
    final name = user['name'] ?? 'Student';
    final photoUrl = user['photoUrl'];
    final className = '${widget.student['class']?['name'] ?? ''} ${widget.student['class']?['section'] ?? ''}'.trim();

    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9), // Standard gray background
      appBar: AppBar(
        iconTheme: const IconThemeData(color: Colors.white),
        title: Text('Record Payment', style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 20)),
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF6366F1), Color(0xFF4F46E5), Color(0xFF4338CA)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
        elevation: 0,
      ),
      body: Column(
        children: [
          // Student info banner
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(0xFF6366F1), Color(0xFF4F46E5), Color(0xFF4338CA)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.only(bottomLeft: Radius.circular(32), bottomRight: Radius.circular(32)),
              boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 4))],
            ),
            padding: const EdgeInsets.fromLTRB(20, 10, 20, 24),
            child: Row(children: [
              Container(
                width: 52, height: 52,
                decoration: BoxDecoration(borderRadius: BorderRadius.circular(14), border: Border.all(color: Colors.white, width: 2)),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(13),
                  child: (photoUrl != null && (photoUrl as String).isNotEmpty)
                      ? Image.network((photoUrl as String).startsWith('http') 
                          ? photoUrl 
                          : ((photoUrl as String).startsWith('/') ? '${ApiService.baseUrl}$photoUrl' : '${ApiService.baseUrl}/$photoUrl'), fit: BoxFit.cover, errorBuilder: (c, e, s) => _photoFallback(name))
                      : _photoFallback(name),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(name, style: GoogleFonts.outfit(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Row(children: [
                  if (className.isNotEmpty) _pill(className, const Color(0xFF10B981)),
                  const SizedBox(width: 6),
                  _pill('Roll: ${widget.student['rollNo'] ?? 'N/A'}', const Color(0xFF3B82F6)),
                ]),
              ])),
            ]),
          ),

          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(16, 20, 16, 140),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                // Fee components
                _sectionLabel('Select Fee Components'),
                const SizedBox(height: 10),
                if (_availableStructures.isEmpty)
                  _emptyCard('No fee components available for this student.')
                else
                  ..._availableStructures.map((st) => _buildFeeItem(st)),

                const SizedBox(height: 24),

                // Payment date
                _sectionLabel('Payment Date'),
                const SizedBox(height: 10),
                GestureDetector(
                  onTap: () async {
                    final picked = await showDatePicker(
                      context: context,
                      initialDate: _paymentDate,
                      firstDate: DateTime(2020),
                      lastDate: DateTime.now(),
                      builder: (ctx, child) => Theme(
                        data: Theme.of(ctx).copyWith(colorScheme: const ColorScheme.light(primary: Color(0xFF6366F1))),
                        child: child!,
                      ),
                    );
                    if (picked != null) setState(() => _paymentDate = picked);
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8, offset: const Offset(0, 2))]),
                    child: Row(children: [
                      Container(padding: const EdgeInsets.all(8), decoration: BoxDecoration(color: const Color(0xFF6366F1).withOpacity(0.1), borderRadius: BorderRadius.circular(10)), child: const Icon(Icons.calendar_month_rounded, color: Color(0xFF6366F1), size: 18)),
                      const SizedBox(width: 14),
                      Text('${_paymentDate.day.toString().padLeft(2, '0')}/${_paymentDate.month.toString().padLeft(2, '0')}/${_paymentDate.year}', style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w600, color: const Color(0xFF1E293B))),
                      const Spacer(),
                      const Icon(Icons.edit_calendar_rounded, color: Color(0xFF94A3B8), size: 18),
                    ]),
                  ),
                ),

                const SizedBox(height: 20),

                // Payment method
                _sectionLabel('Payment Method'),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 8, runSpacing: 8,
                  children: _methods.map((m) {
                    final isSelected = _method == m;
                    final color = _methodColors[m] ?? const Color(0xFF6366F1);
                    return GestureDetector(
                      onTap: () => setState(() => _method = m),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 180),
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                        decoration: BoxDecoration(
                          color: isSelected ? color : Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: isSelected ? color : const Color(0xFFE2E8F0)),
                          boxShadow: isSelected ? [BoxShadow(color: color.withOpacity(0.3), blurRadius: 8, offset: const Offset(0, 3))] : [],
                        ),
                        child: Text(m, style: GoogleFonts.poppins(fontSize: 12.5, fontWeight: FontWeight.w700, color: isSelected ? Colors.white : const Color(0xFF64748B))),
                      ),
                    );
                  }).toList(),
                ),

                const SizedBox(height: 20),

                // Remarks
                _sectionLabel('Remarks (Optional)'),
                const SizedBox(height: 10),
                TextField(
                  controller: _remarksCtrl,
                  maxLines: 2,
                  style: GoogleFonts.poppins(fontSize: 13.5, color: const Color(0xFF1E293B)),
                  decoration: InputDecoration(
                    hintText: 'Cheque No, UTR, Transaction ID...',
                    hintStyle: GoogleFonts.poppins(fontSize: 13, color: const Color(0xFFCBD5E1)),
                    prefixIcon: const Padding(padding: EdgeInsets.only(left: 14, right: 10, top: 14), child: Icon(Icons.notes_rounded, color: Color(0xFF94A3B8), size: 20)),
                    filled: true, fillColor: Colors.white,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFF6366F1), width: 1.5)),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                  ),
                ),
              ]),
            ),
          ),
        ],
      ),

      // Bottom confirm bar
      bottomNavigationBar: _buildBottomBar(),
    );
  }

  Widget _buildFeeItem(dynamic st) {
    final id = st['id'] as String;
    final isChecked = _checked[id] == true;
    final pending = _getPending(st);
    final total = (st['amount'] ?? 0.0).toDouble();
    final paidSoFar = total - pending;
    final progress = total > 0 ? (paidSoFar / total).clamp(0.0, 1.0) : 1.0;
    final statusColor = progress >= 1.0 ? const Color(0xFF10B981) : pending == 0 ? const Color(0xFF10B981) : const Color(0xFF6366F1);

    return GestureDetector(
      onTap: () => setState(() => _checked[id] = !isChecked),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.only(bottom: 10),
        decoration: BoxDecoration(
          color: isChecked ? const Color(0xFFEEF2FF) : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: isChecked ? const Color(0xFF6366F1) : const Color(0xFFE2E8F0), width: isChecked ? 1.5 : 1),
          boxShadow: [BoxShadow(color: isChecked ? const Color(0xFF6366F1).withOpacity(0.1) : Colors.black.withOpacity(0.03), blurRadius: 8, offset: const Offset(0, 3))],
        ),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                width: 24, height: 24,
                decoration: BoxDecoration(
                  color: isChecked ? const Color(0xFF6366F1) : Colors.transparent,
                  borderRadius: BorderRadius.circular(7),
                  border: Border.all(color: isChecked ? const Color(0xFF6366F1) : const Color(0xFFCBD5E1), width: 2),
                ),
                child: isChecked ? const Icon(Icons.check_rounded, color: Colors.white, size: 16) : null,
              ),
              const SizedBox(width: 12),
              Expanded(child: Text(st['name'] ?? 'Fee', style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B)))),
              if (pending > 0)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(color: const Color(0xFFFEF2F2), borderRadius: BorderRadius.circular(8)),
                  child: Text('₹${pending.toStringAsFixed(0)} due', style: GoogleFonts.poppins(fontSize: 10.5, color: const Color(0xFFF43F5E), fontWeight: FontWeight.w700)),
                )
              else
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(color: const Color(0xFFF0FDF4), borderRadius: BorderRadius.circular(8)),
                  child: Text('Paid', style: GoogleFonts.poppins(fontSize: 10.5, color: const Color(0xFF10B981), fontWeight: FontWeight.w700)),
                ),
            ]),
            const SizedBox(height: 8),
            ClipRRect(borderRadius: BorderRadius.circular(4), child: LinearProgressIndicator(value: progress, minHeight: 4, backgroundColor: const Color(0xFFE2E8F0), valueColor: AlwaysStoppedAnimation<Color>(statusColor))),
            const SizedBox(height: 4),
            Text('Total ₹${total.toStringAsFixed(0)} • Paid ₹${paidSoFar.toStringAsFixed(0)}', style: GoogleFonts.poppins(fontSize: 10.5, color: const Color(0xFF94A3B8))),

            // Amount input (only when selected)
            if (isChecked) ...[
              const SizedBox(height: 12),
              Row(children: [
                const Icon(Icons.currency_rupee_rounded, size: 18, color: Color(0xFF6366F1)),
                const SizedBox(width: 8),
                Expanded(
                  child: TextField(
                    controller: _amountControllers[id],
                    keyboardType: TextInputType.number,
                    style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xFF6366F1)),
                    onChanged: (_) => setState(() {}),
                    decoration: InputDecoration(
                      hintText: 'Amount to pay',
                      hintStyle: GoogleFonts.outfit(fontSize: 16, color: const Color(0xFFCBD5E1)),
                      filled: true, fillColor: Colors.white,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF6366F1))),
                      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF6366F1))),
                      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF6366F1), width: 2)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      suffixText: '₹',
                      suffixStyle: GoogleFonts.outfit(fontSize: 14, color: const Color(0xFF94A3B8)),
                    ),
                  ),
                ),
                if (pending > 0) ...[
                  const SizedBox(width: 8),
                  GestureDetector(
                    onTap: () => setState(() => _amountControllers[id]?.text = pending.toStringAsFixed(0)),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                      decoration: BoxDecoration(color: const Color(0xFF6366F1).withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
                      child: Text('Full', style: GoogleFonts.poppins(fontSize: 11.5, color: const Color(0xFF6366F1), fontWeight: FontWeight.w700)),
                    ),
                  ),
                ],
              ]),
            ],
          ]),
        ),
      ),
    );
  }

  Widget _buildBottomBar() {
    final total = _totalAmount;
    final hasSelected = _checked.values.any((v) => v);
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 20, offset: const Offset(0, -5))],
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.fromLTRB(20, 16, 20, MediaQuery.of(context).padding.bottom + 20),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        // Total row
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            gradient: LinearGradient(colors: [const Color(0xFF2E2A66).withOpacity(0.05), const Color(0xFF4F46E5).withOpacity(0.08)]),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFF6366F1).withOpacity(0.15)),
          ),
          child: Row(children: [
            Text('Total Amount', style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w600, color: const Color(0xFF64748B))),
            const Spacer(),
            Text('₹${total.toStringAsFixed(0)}', style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.bold, color: const Color(0xFF4F46E5))),
          ]),
        ),
        const SizedBox(height: 12),
        // Confirm button
        GestureDetector(
          onTap: (_isSubmitting || !hasSelected || total <= 0) ? null : _submit,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            width: double.infinity, height: 54,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: (hasSelected && total > 0) ? [const Color(0xFF4F46E5), const Color(0xFF6366F1)] : [const Color(0xFFCBD5E1), const Color(0xFFCBD5E1)],
              ),
              borderRadius: BorderRadius.circular(16),
              boxShadow: (hasSelected && total > 0) ? [BoxShadow(color: const Color(0xFF6366F1).withOpacity(0.35), blurRadius: 12, offset: const Offset(0, 5))] : [],
            ),
            child: Center(child: _isSubmitting
                ? const CircularProgressIndicator(color: Colors.white, strokeWidth: 2)
                : Row(mainAxisSize: MainAxisSize.min, children: [
                    const Icon(Icons.check_circle_rounded, color: Colors.white, size: 20),
                    const SizedBox(width: 8),
                    Text('Confirm Payment', style: GoogleFonts.poppins(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold, letterSpacing: 0.3)),
                  ])),
          ),
        ),
      ]),
    );
  }

  Widget _sectionLabel(String text) {
    return Text(text, style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B)));
  }

  Widget _photoFallback(String name) {
    return Container(
      color: const Color(0xFF6366F1),
      child: Center(child: Text(name.isNotEmpty ? name[0].toUpperCase() : 'S', style: GoogleFonts.outfit(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold))),
    );
  }

  Widget _pill(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: color.withOpacity(0.2), borderRadius: BorderRadius.circular(8), border: Border.all(color: color.withOpacity(0.4))),
      child: Text(text, style: GoogleFonts.poppins(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w700)),
    );
  }

  Widget _emptyCard(String msg) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: const Color(0xFFF1F5F9))),
      child: Center(child: Text(msg, style: GoogleFonts.poppins(color: const Color(0xFF94A3B8)))),
    );
  }
}
