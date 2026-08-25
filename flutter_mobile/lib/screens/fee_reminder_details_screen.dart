import 'dart:io';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import '../services/api_service.dart';
import 'package:intl/intl.dart';

class FeeReminderDetailsScreen extends StatefulWidget {
  final Map<String, dynamic> student;

  const FeeReminderDetailsScreen({super.key, required this.student});

  @override
  State<FeeReminderDetailsScreen> createState() => _FeeReminderDetailsScreenState();
}

class _FeeReminderDetailsScreenState extends State<FeeReminderDetailsScreen> {
  final GlobalKey _cardKey = GlobalKey();
  bool _isLoading = true;
  String? _errorMessage;

  double _totalAmount = 0.0;
  double _totalPaid = 0.0;
  double _totalPending = 0.0;

  @override
  void initState() {
    super.initState();
    _fetchFeeData();
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

        final structures = allStructures.where((s) => s['studentId'] == studentId || s['classId'] == classId).toList();
        
        List<dynamic> payments = [];
        final studentRes = await ApiService.getStudentById(studentId);
        if (studentRes['success'] && studentRes['data'] != null) {
          payments = studentRes['data']['feePayments'] ?? [];
        } else {
          payments = widget.student['feePayments'] ?? [];
        }

        _totalAmount = 0.0;
        _totalPaid = 0.0;
        _totalPending = 0.0;

        for (var structure in structures) {
          _totalAmount += double.tryParse(structure['amount']?.toString() ?? '0') ?? 0;
        }
        for (var payment in payments) {
          if (payment['status'] == 'PAID' || payment['status'] == 'PARTIAL') {
            _totalPaid += double.tryParse(payment['amountPaid']?.toString() ?? '0') ?? 0;
          }
        }

        _totalPending = _totalAmount - _totalPaid;
        if (_totalPending < 0) _totalPending = 0;

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

  Future<void> _shareFeeCard() async {
    try {
      RenderRepaintBoundary boundary = _cardKey.currentContext!.findRenderObject() as RenderRepaintBoundary;
      ui.Image image = await boundary.toImage(pixelRatio: 3.0);
      ByteData? byteData = await image.toByteData(format: ui.ImageByteFormat.png);
      if (byteData != null) {
        final buffer = byteData.buffer;
        final directory = await getTemporaryDirectory();
        final filePath = '${directory.path}/fee_reminder_${widget.student['rollNo'] ?? 'student'}.png';
        final file = File(filePath);
        await file.writeAsBytes(buffer.asUint8List(byteData.offsetInBytes, byteData.lengthInBytes));
        
        await Share.shareXFiles(
          [XFile(filePath)],
          text: 'Fee Reminder for ${widget.student['user']?['name'] ?? 'Student'}',
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to share image: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        title: Text('Fee Reminder', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white)),
        backgroundColor: const Color(0xFF0F172A),
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage != null
              ? Center(child: Text(_errorMessage!, style: const TextStyle(color: Colors.red)))
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    children: [
                      RepaintBoundary(
                        key: _cardKey,
                        child: _buildFeeCard(),
                      ),
                      const SizedBox(height: 32),
                      ElevatedButton.icon(
                        onPressed: _shareFeeCard,
                        icon: const Icon(Icons.share_rounded, color: Colors.white),
                        label: Text('Share Fee Details', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 16)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF4F46E5),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          elevation: 4,
                          shadowColor: const Color(0xFF4F46E5).withOpacity(0.5),
                        ),
                      ),
                    ],
                  ),
                ),
    );
  }

  Widget _buildFeeCard() {
    final user = widget.student['user'] ?? {};
    final classInfo = widget.student['class'] ?? {};
    final name = user['name'] ?? 'Unknown Student';
    final rollNo = widget.student['rollNo'] ?? 'N/A';
    final className = '${classInfo['name'] ?? ''} ${classInfo['section'] ?? ''}'.trim();
    final photoUrl = user['photoUrl'];
    
    final formattedTotal = NumberFormat.currency(symbol: '₹', decimalDigits: 0).format(_totalAmount);
    final formattedPaid = NumberFormat.currency(symbol: '₹', decimalDigits: 0).format(_totalPaid);
    final formattedPending = NumberFormat.currency(symbol: '₹', decimalDigits: 0).format(_totalPending);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 20, offset: const Offset(0, 10)),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: Column(
          children: [
            // Header: School Info
            Container(
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: Row(
                children: [
                  Container(
                    width: 50,
                    height: 50,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Image.asset('assets/images/logo.png', fit: BoxFit.cover, errorBuilder: (c,e,s) => const Icon(Icons.school, color: Color(0xFF1E293B))),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('JY School', style: GoogleFonts.outfit(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
                        Text('Fee Reminder Slip', style: GoogleFonts.poppins(color: const Color(0xFF94A3B8), fontSize: 13, fontWeight: FontWeight.w500)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            
            // Body: Student Info
            Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  Row(
                    children: [
                      // Photo
                      Container(
                        width: 70,
                        height: 70,
                        decoration: BoxDecoration(
                          color: const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFFE2E8F0), width: 2),
                        ),
                        child: (photoUrl != null && photoUrl.isNotEmpty)
                            ? ClipRRect(
                                borderRadius: BorderRadius.circular(14),
                                child: Image.network(
                                  ApiService.getImageUrl(photoUrl),
                                  fit: BoxFit.cover,
                                  errorBuilder: (c,e,s) => const Icon(Icons.person, color: Color(0xFF94A3B8), size: 36),
                                ),
                              )
                            : const Icon(Icons.person, color: Color(0xFF94A3B8), size: 36),
                      ),
                      const SizedBox(width: 20),
                      // Details
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(name, style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
                            const SizedBox(height: 6),
                            Row(
                              children: [
                                const Icon(Icons.class_rounded, size: 14, color: Color(0xFF64748B)),
                                const SizedBox(width: 6),
                                Text('Class: $className', style: GoogleFonts.poppins(fontSize: 13, color: const Color(0xFF64748B), fontWeight: FontWeight.w500)),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                const Icon(Icons.badge_rounded, size: 14, color: Color(0xFF64748B)),
                                const SizedBox(width: 6),
                                Text('Roll No: $rollNo', style: GoogleFonts.poppins(fontSize: 13, color: const Color(0xFF64748B), fontWeight: FontWeight.w500)),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 24),
                    child: Divider(color: Color(0xFFE2E8F0), thickness: 1.5),
                  ),
                  
                  // Fee Details
                  Row(
                    children: [
                      Expanded(
                        child: _buildFeeAmountBlock(
                          title: 'Total Fee',
                          amount: formattedTotal,
                          color: const Color(0xFF4F46E5),
                          bgColor: const Color(0xFFEEF2FF),
                          icon: Icons.account_balance_wallet_rounded,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: _buildFeeAmountBlock(
                          title: 'Paid',
                          amount: formattedPaid,
                          color: const Color(0xFF10B981),
                          bgColor: const Color(0xFFD1FAE5),
                          icon: Icons.check_circle_rounded,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEF2F2),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFFECACA), width: 1.5),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(color: const Color(0xFFFEE2E2), borderRadius: BorderRadius.circular(12)),
                          child: const Icon(Icons.warning_rounded, color: Color(0xFFEF4444), size: 28),
                        ),
                        const SizedBox(width: 20),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Pending Balance', style: GoogleFonts.poppins(fontSize: 14, color: const Color(0xFFEF4444), fontWeight: FontWeight.w600)),
                              Text(formattedPending, style: GoogleFonts.outfit(fontSize: 26, fontWeight: FontWeight.bold, color: const Color(0xFFB91C1C))),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  const SizedBox(height: 24),
                  Text(
                    'Date: ${DateFormat('dd MMM yyyy').format(DateTime.now())}',
                    style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF94A3B8)),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFeeAmountBlock({required String title, required String amount, required Color color, required Color bgColor, required IconData icon}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: color),
              const SizedBox(width: 8),
              Text(title, style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600, color: color)),
            ],
          ),
          const SizedBox(height: 8),
          Text(amount, style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold, color: color)),
        ],
      ),
    );
  }
}
