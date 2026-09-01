import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class StudentPayFeeScreen extends StatefulWidget {
  const StudentPayFeeScreen({super.key});

  @override
  State<StudentPayFeeScreen> createState() => _StudentPayFeeScreenState();
}

class _StudentPayFeeScreenState extends State<StudentPayFeeScreen> {
  bool _isLoading = true;
  double _dueAmount = 0;
  Map<String, dynamic> _settings = {};

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final args = ModalRoute.of(context)?.settings.arguments;
    if (args != null && args is double) {
      _dueAmount = args;
    }
    _fetchSettings();
  }

  Future<void> _fetchSettings() async {
    try {
      final response = await ApiService.getSettings();
      if (response != null) {
        setState(() {
          _settings = response;
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to load bank details')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: Text('Pay Fee', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white)),
        backgroundColor: const Color(0xFF4B497B),
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SafeArea(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildAmountHeader(),
                    const SizedBox(height: 24),
                    Text('Choose Payment Method', style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 16),
                    _buildUpiCard(),
                    const SizedBox(height: 16),
                    _buildBankTransferCard(),
                  ],
                ),
              ),
            ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: ElevatedButton(
            onPressed: () {
              Navigator.pushNamed(context, '/student/fees/submit', arguments: _dueAmount);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF4B497B),
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              elevation: 4,
            ),
            child: Text(
              'I have paid the amount',
              style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildAmountHeader() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xFF4B497B),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(color: const Color(0xFF4B497B).withOpacity(0.3), blurRadius: 10, offset: const Offset(0, 5))
        ],
      ),
      child: Column(
        children: [
          Text('Total Due Amount', style: GoogleFonts.poppins(color: Colors.white70, fontSize: 14)),
          const SizedBox(height: 8),
          Text('₹${_dueAmount.toStringAsFixed(0)}', style: GoogleFonts.poppins(color: Colors.white, fontSize: 36, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildUpiCard() {
    String? upiId = _settings['upiId'];
    String? qrCodeUrl = _settings['qrCodeUrl'];

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: Colors.blue[50], borderRadius: BorderRadius.circular(10)),
                child: const Icon(Icons.qr_code_scanner, color: Colors.blue),
              ),
              const SizedBox(width: 16),
              Text('Pay via PhonePe / GPay', style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 20),
          if (qrCodeUrl != null && qrCodeUrl.isNotEmpty)
            Image.network(
              ApiService.getImageUrl(qrCodeUrl),
              height: 200,
              errorBuilder: (context, error, stackTrace) => const Icon(Icons.broken_image, size: 100, color: Colors.grey),
            )
          else
            Container(
              height: 150,
              alignment: Alignment.center,
              child: Text('QR Code not configured by admin.', style: GoogleFonts.poppins(color: Colors.grey)),
            ),
          if (upiId != null && upiId.isNotEmpty) ...[
            const SizedBox(height: 16),
            Text('UPI ID: $upiId', style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.grey[800])),
          ]
        ],
      ),
    );
  }

  Widget _buildBankTransferCard() {
    String? bankName = _settings['bankName'];
    String? accountNo = _settings['bankAccountNumber'];
    String? ifsc = _settings['bankIfsc'];

    if (bankName == null || bankName.isEmpty) return const SizedBox();

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: Colors.orange[50], borderRadius: BorderRadius.circular(10)),
                child: const Icon(Icons.account_balance, color: Colors.orange),
              ),
              const SizedBox(width: 16),
              Text('Direct Bank Transfer', style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 20),
          _buildBankDetailRow('Bank Name', bankName),
          const SizedBox(height: 12),
          _buildBankDetailRow('Account Number', accountNo ?? 'N/A'),
          const SizedBox(height: 12),
          _buildBankDetailRow('IFSC Code', ifsc ?? 'N/A'),
        ],
      ),
    );
  }

  Widget _buildBankDetailRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: GoogleFonts.poppins(color: Colors.grey[600], fontSize: 14)),
        Text(value, style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 14)),
      ],
    );
  }
}
