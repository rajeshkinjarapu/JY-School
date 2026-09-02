import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../services/api_service.dart';

class StudentPaymentSubmissionScreen extends StatefulWidget {
  const StudentPaymentSubmissionScreen({super.key});

  @override
  State<StudentPaymentSubmissionScreen> createState() => _StudentPaymentSubmissionScreenState();
}

class _StudentPaymentSubmissionScreenState extends State<StudentPaymentSubmissionScreen> {
  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();
  final _utrController = TextEditingController();
  final _notesController = TextEditingController();
  
  File? _imageFile;
  bool _isSubmitting = false;
  double _dueAmount = 0;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final args = ModalRoute.of(context)?.settings.arguments;
    if (args != null && args is double) {
      _dueAmount = args;
      if (_amountController.text.isEmpty) {
        _amountController.text = _dueAmount.toStringAsFixed(0);
      }
    }
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery, imageQuality: 70);
    if (pickedFile != null) {
      setState(() {
        _imageFile = File(pickedFile.path);
      });
    }
  }

  Future<void> _submitPayment() async {
    if (!_formKey.currentState!.validate()) return;
    if (_imageFile == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please upload the payment screenshot')));
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final bytes = await _imageFile!.readAsBytes();
      final filename = _imageFile!.path.split('/').last;

      final res = await ApiService.studentPayFeeWithScreenshot(
        amount: double.parse(_amountController.text),
        paymentMethod: 'UPI/BANK',
        referenceNumber: _utrController.text,
        notes: _notesController.text,
        imageBytes: bytes,
        imageFilename: filename,
      );

      if (res['success']) {
        if (mounted) {
          Navigator.pushReplacementNamed(context, '/student/fees/success');
        }
      } else {
        _showError(res['message'] ?? 'Submission failed');
      }
    } catch (e) {
      _showError('Error: $e');
    }
  }

  void _showError(String message) {
    setState(() => _isSubmitting = false);
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message), backgroundColor: Colors.red));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text('Upload Proof', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white)),
        backgroundColor: const Color(0xFF4B497B),
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Payment Details', style: GoogleFonts.poppins(fontSize: 20, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Text('Enter the transaction details exactly as in your payment app.', style: GoogleFonts.poppins(color: Colors.grey)),
                const SizedBox(height: 24),
                
                // Amount Field
                TextFormField(
                  controller: _amountController,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                    labelText: 'Paid Amount (₹)',
                    labelStyle: GoogleFonts.poppins(),
                    prefixIcon: const Icon(Icons.currency_rupee),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  validator: (val) => val == null || val.isEmpty ? 'Amount is required' : null,
                ),
                const SizedBox(height: 16),
                
                // UTR / Reference Number Field
                TextFormField(
                  controller: _utrController,
                  decoration: InputDecoration(
                    labelText: 'UTR / Reference Number',
                    labelStyle: GoogleFonts.poppins(),
                    prefixIcon: const Icon(Icons.receipt_long),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  validator: (val) => val == null || val.isEmpty ? 'Reference number is required' : null,
                ),
                const SizedBox(height: 16),
                
                // Notes Field
                TextFormField(
                  controller: _notesController,
                  decoration: InputDecoration(
                    labelText: 'Remarks (Optional)',
                    labelStyle: GoogleFonts.poppins(),
                    prefixIcon: const Icon(Icons.note),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                ),
                const SizedBox(height: 32),

                // Screenshot Upload
                Text('Payment Screenshot', style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                GestureDetector(
                  onTap: _pickImage,
                  child: Container(
                    height: 200,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: Colors.grey[50],
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.grey[300]!, width: 2, style: BorderStyle.solid),
                    ),
                    child: _imageFile != null
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(14),
                            child: Image.file(_imageFile!, fit: BoxFit.cover),
                          )
                        : Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.cloud_upload_outlined, size: 48, color: Colors.grey[400]),
                              const SizedBox(height: 8),
                              Text('Tap to upload screenshot', style: GoogleFonts.poppins(color: Colors.grey[500])),
                            ],
                          ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: ElevatedButton(
            onPressed: _isSubmitting ? null : _submitPayment,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF4B497B),
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              elevation: 4,
            ),
            child: _isSubmitting
                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : Text(
                    'Submit Verification',
                    style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
          ),
        ),
      ),
    );
  }
}
