import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';

import '../services/api_service.dart';
import '../services/admission_pdf_service.dart';

class AdmissionRegistrationScreen extends StatefulWidget {
  const AdmissionRegistrationScreen({super.key});

  @override
  State<AdmissionRegistrationScreen> createState() => _AdmissionRegistrationScreenState();
}

class _AdmissionRegistrationScreenState extends State<AdmissionRegistrationScreen> {
  final _formKey = GlobalKey<FormState>();

  // Text Controllers
  final _nameCtrl = TextEditingController();
  final _fatherCtrl = TextEditingController();
  final _motherCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _aadharCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  final _feeCtrl = TextEditingController();

  String _gender = 'Male';
  String _classApplied = 'Class 1';
  String _academicYear = '${DateTime.now().year}-${DateTime.now().year + 1}';
  final List<String> _academicYears = ['2026-2027', '2025-2026', '2027-2028'];
  String _paymentMethod = 'CASH';
  DateTime? _dob;

  // Photo
  File? _localPhotoFile;
  String? _uploadedPhotoUrl;
  bool _isUploadingPhoto = false;

  bool _isSubmitting = false;

  final List<String> _classes = [
    'Nursery', 'LKG', 'UKG',
    'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
    'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'
  ];

  // Teachers for cash payment
  List<Map<String, dynamic>> _teachers = [];
  String? _cashTeacherName;
  String? _cashTeacherId;

  // Receipt for UPI payment
  File? _localReceiptFile;
  String? _uploadedReceiptUrl;
  bool _isUploadingReceipt = false;

  // UPI Info
  String _upiId = 'jyschool@upi';
  String? _schoolQrUrl;

  @override
  void initState() {
    super.initState();
    _loadTeachers();
    _loadConfig();
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _fatherCtrl.dispose();
    _motherCtrl.dispose();
    _phoneCtrl.dispose();
    _aadharCtrl.dispose();
    _addressCtrl.dispose();
    _feeCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadTeachers() async {
    try {
      final res = await ApiService.getTeachers(limit: 500);
      if (res['success'] == true && res['data'] != null && res['data'] is List) {
        setState(() {
          _teachers = List<Map<String, dynamic>>.from(res['data']);
        });
      }
    } catch (_) {}
  }

  Future<void> _loadConfig() async {
    try {
      final res = await ApiService.getAdmissionConfig();
      if (res['success'] == true) {
        setState(() {
          if (res['upiId'] != null && res['upiId'].toString().isNotEmpty) {
            _upiId = res['upiId'].toString();
          }
          if (res['qrCodeUrl'] != null && res['qrCodeUrl'].toString().isNotEmpty) {
            _schoolQrUrl = ApiService.getImageUrl(res['qrCodeUrl'].toString());
          }
        });
      }
    } catch (_) {}
  }

  Future<void> _pickImage(ImageSource source) async {
    Navigator.of(context).pop(); // close bottom sheet
    try {
      final picker = ImagePicker();
      final picked = await picker.pickImage(source: source, imageQuality: 80, maxWidth: 800);
      if (picked == null) return;

      setState(() {
        _localPhotoFile = File(picked.path);
        _isUploadingPhoto = true;
      });

      final uploadRes = await ApiService.uploadImage(picked.path);
      if (uploadRes['success'] == true && uploadRes['url'] != null) {
        setState(() {
          _uploadedPhotoUrl = uploadRes['url'];
          _isUploadingPhoto = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Photo uploaded successfully!'), backgroundColor: Color(0xFF10B981)),
        );
      } else {
        setState(() => _isUploadingPhoto = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(uploadRes['message'] ?? 'Failed to upload photo'), backgroundColor: Colors.red),
        );
      }
    } catch (e) {
      setState(() => _isUploadingPhoto = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error picking image: $e'), backgroundColor: Colors.red),
      );
    }
  }

  void _showPhotoOptions() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => SafeArea(
        bottom: true,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Select Student Photo', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16)),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  InkWell(
                    onTap: () => _pickImage(ImageSource.camera),
                    borderRadius: BorderRadius.circular(16),
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        children: [
                          const CircleAvatar(
                            radius: 28,
                            backgroundColor: Color(0xFFEEF2FF),
                            child: Icon(Icons.camera_alt_rounded, color: Color(0xFF4F46E5), size: 28),
                          ),
                          const SizedBox(height: 8),
                          Text('Camera', style: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 13)),
                        ],
                      ),
                    ),
                  ),
                  InkWell(
                    onTap: () => _pickImage(ImageSource.gallery),
                    borderRadius: BorderRadius.circular(16),
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        children: [
                          const CircleAvatar(
                            radius: 28,
                            backgroundColor: Color(0xFFECFDF5),
                            child: Icon(Icons.photo_library_rounded, color: Color(0xFF10B981), size: 28),
                          ),
                          const SizedBox(height: 8),
                          Text('Gallery', style: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 13)),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _selectDob() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _dob ?? DateTime(now.year - 6, now.month, now.day),
      firstDate: DateTime(now.year - 20),
      lastDate: now,
    );
    if (picked != null) {
      setState(() => _dob = picked);
    }
  }

  Future<void> _pickReceiptImage(ImageSource source) async {
    Navigator.of(context).pop(); // close bottom sheet
    try {
      final picker = ImagePicker();
      final picked = await picker.pickImage(source: source, imageQuality: 80, maxWidth: 1000);
      if (picked == null) return;

      setState(() {
        _localReceiptFile = File(picked.path);
        _isUploadingReceipt = true;
      });

      final uploadRes = await ApiService.uploadImage(picked.path);
      if (uploadRes['success'] == true && uploadRes['url'] != null) {
        setState(() {
          _uploadedReceiptUrl = uploadRes['url'];
          _isUploadingReceipt = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Payment receipt uploaded successfully!'), backgroundColor: Color(0xFF10B981)),
        );
      } else {
        setState(() => _isUploadingReceipt = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(uploadRes['message'] ?? 'Failed to upload receipt'), backgroundColor: Colors.red),
        );
      }
    } catch (e) {
      setState(() => _isUploadingReceipt = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error picking receipt: $e'), backgroundColor: Colors.red),
      );
    }
  }

  void _showReceiptOptions() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => SafeArea(
        bottom: true,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Select Payment Receipt Screenshot', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16)),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  InkWell(
                    onTap: () => _pickReceiptImage(ImageSource.camera),
                    borderRadius: BorderRadius.circular(16),
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        children: [
                          const CircleAvatar(
                            radius: 28,
                            backgroundColor: Color(0xFFEEF2FF),
                            child: Icon(Icons.camera_alt_rounded, color: Color(0xFF4F46E5), size: 28),
                          ),
                          const SizedBox(height: 8),
                          Text('Camera', style: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 13)),
                        ],
                      ),
                    ),
                  ),
                  InkWell(
                    onTap: () => _pickReceiptImage(ImageSource.gallery),
                    borderRadius: BorderRadius.circular(16),
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        children: [
                          const CircleAvatar(
                            radius: 28,
                            backgroundColor: Color(0xFFECFDF5),
                            child: Icon(Icons.photo_library_rounded, color: Color(0xFF10B981), size: 28),
                          ),
                          const SizedBox(height: 8),
                          Text('Gallery', style: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 13)),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) return;

    // Mandatory UPI Receipt Check
    if (_paymentMethod == 'UPI' && _uploadedReceiptUrl == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Payment receipt screenshot is mandatory for UPI payments'), backgroundColor: Colors.red),
      );
      return;
    }

    // Mandatory Cash Teacher Check
    if (_paymentMethod == 'CASH' && (_cashTeacherName == null || _cashTeacherName!.isEmpty)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select the teacher who received the cash payment'), backgroundColor: Colors.red),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    final payload = {
      'studentName': _nameCtrl.text.trim(),
      'fatherName': _fatherCtrl.text.trim().isEmpty ? null : _fatherCtrl.text.trim(),
      'motherName': _motherCtrl.text.trim().isEmpty ? null : _motherCtrl.text.trim(),
      'phone': _phoneCtrl.text.trim(),
      'aadharNo': _aadharCtrl.text.trim().isEmpty ? null : _aadharCtrl.text.trim(),
      'dob': _dob?.toIso8601String(),
      'gender': _gender,
      'classApplied': _classApplied,
      'academicYear': _academicYear,
      'address': _addressCtrl.text.trim().isEmpty ? null : _addressCtrl.text.trim(),
      'studentImage': _uploadedPhotoUrl,
      'admissionFee': _feeCtrl.text.trim().isEmpty ? null : _feeCtrl.text.trim(),
      'paymentMethod': _paymentMethod,
      'paymentReceipt': _paymentMethod == 'UPI' ? _uploadedReceiptUrl : null,
      'cashReceivedByName': _paymentMethod == 'CASH' ? _cashTeacherName : null,
      'cashReceivedById': _paymentMethod == 'CASH' ? _cashTeacherId : null,
      'paymentStatus': (_paymentMethod == 'CASH' || (_paymentMethod == 'UPI' && _uploadedReceiptUrl != null)) && _feeCtrl.text.trim().isNotEmpty ? 'COMPLETED' : 'PENDING',
    };

    final res = await ApiService.submitAdmission(payload);
    setState(() => _isSubmitting = false);

    if (res['success'] == true && res['data'] != null) {
      final newAdmission = res['data'] is Map<String, dynamic> ? res['data'] : payload;
      _showSuccessDialog(newAdmission);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(res['message'] ?? 'Failed to submit admission'), backgroundColor: Colors.red),
      );
    }
  }

  void _showSuccessDialog(Map<String, dynamic> admission) {
    final regNo = 'ADM-${DateTime.now().year}-${admission['id']?.toString().substring(0, 6).toUpperCase() ?? 'NEW'}';
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        contentPadding: const EdgeInsets.all(24),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircleAvatar(
              radius: 36,
              backgroundColor: Color(0xFFECFDF5),
              child: Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 48),
            ),
            const SizedBox(height: 16),
            Text(
              'Admission Registered!',
              style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 18, color: const Color(0xFF0F172A)),
            ),
            const SizedBox(height: 4),
            Text(
              admission['studentName']?.toString() ?? '',
              style: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 16, color: const Color(0xFF4F46E5)),
            ),
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                'Application No: $regNo',
                style: GoogleFonts.firaCode(fontSize: 12, fontWeight: FontWeight.bold, color: const Color(0xFF475569)),
              ),
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: () {
                Navigator.of(ctx).pop();
                AdmissionPdfService.printAdmissionForm(context, admission);
              },
              icon: const Icon(Icons.print_rounded, size: 18),
              label: const Text('Print Official Form (PDF)'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF4F46E5),
                foregroundColor: Colors.white,
                minimumSize: const Size(double.infinity, 44),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
            ),
            const SizedBox(height: 10),
            OutlinedButton(
              onPressed: () {
                Navigator.of(ctx).pop();
                _resetForm();
              },
              style: OutlinedButton.styleFrom(
                minimumSize: const Size(double.infinity, 44),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: const Text('Register Another Student'),
            ),
          ],
        ),
      ),
    );
  }

  void _resetForm() {
    _formKey.currentState?.reset();
    _nameCtrl.clear();
    _fatherCtrl.clear();
    _motherCtrl.clear();
    _phoneCtrl.clear();
    _aadharCtrl.clear();
    _addressCtrl.clear();
    _feeCtrl.clear();
    setState(() {
      _gender = 'Male';
      _classApplied = 'Class 1';
      _dob = null;
      _localPhotoFile = null;
      _uploadedPhotoUrl = null;
      _localReceiptFile = null;
      _uploadedReceiptUrl = null;
      _cashTeacherName = null;
      _cashTeacherId = null;
      _paymentMethod = 'CASH';
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          'Student Registration',
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.white),
        ),
        backgroundColor: const Color(0xFF4F46E5),
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            
            // 1. PHOTO PICKER CARD
            Card(
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
                side: const BorderSide(color: Color(0xFFE2E8F0)),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    GestureDetector(
                      onTap: _showPhotoOptions,
                      child: Stack(
                        children: [
                          Container(
                            width: 100,
                            height: 120,
                            decoration: BoxDecoration(
                              color: const Color(0xFFEEF2FF),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: const Color(0xFFC7D2FE), width: 1.5),
                            ),
                            child: _localPhotoFile != null
                                ? ClipRRect(
                                    borderRadius: BorderRadius.circular(16),
                                    child: Image.file(_localPhotoFile!, fit: BoxFit.cover),
                                  )
                                : const Center(
                                    child: Icon(Icons.person_outline_rounded, size: 48, color: Color(0xFF818CF8)),
                                  ),
                          ),
                          Positioned(
                            bottom: 4,
                            right: 4,
                            child: CircleAvatar(
                              radius: 14,
                              backgroundColor: const Color(0xFF4F46E5),
                              child: _isUploadingPhoto
                                  ? const SizedBox(
                                      width: 14,
                                      height: 14,
                                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                    )
                                  : const Icon(Icons.camera_alt, size: 14, color: Colors.white),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _uploadedPhotoUrl != null ? 'Photo Attached ✓' : 'Tap to Add Student Photo',
                      style: GoogleFonts.outfit(
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                        color: _uploadedPhotoUrl != null ? const Color(0xFF10B981) : const Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 16),

            // 2. STUDENT DETAILS CARD
            _buildSectionCard(
              title: 'Student Details',
              icon: Icons.person_rounded,
              children: [
                _buildTextField(
                  controller: _nameCtrl,
                  label: 'Student Full Name *',
                  hint: 'Enter student full name',
                  validator: (v) => v == null || v.trim().isEmpty ? 'Student Name is required' : null,
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: _buildDropdown(
                        label: 'Class Applied *',
                        value: _classApplied,
                        items: _classes,
                        onChanged: (v) => setState(() => _classApplied = v!),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildDropdown(
                        label: 'Academic Year *',
                        value: _academicYear,
                        items: _academicYears,
                        onChanged: (v) => setState(() => _academicYear = v!),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                _buildGenderSelector(),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: InkWell(
                        onTap: _selectDob,
                        borderRadius: BorderRadius.circular(12),
                        child: InputDecorator(
                          decoration: InputDecoration(
                            labelText: 'Date of Birth',
                            labelStyle: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                          ),
                          child: Text(
                            _dob != null ? DateFormat('dd/MM/yyyy').format(_dob!) : 'Select Date',
                            style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w600),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildTextField(
                        controller: _aadharCtrl,
                        label: 'Aadhaar Number',
                        hint: '12-digit number',
                        keyboardType: TextInputType.number,
                      ),
                    ),
                  ],
                ),
              ],
            ),

            const SizedBox(height: 16),

            // 3. PARENT DETAILS CARD
            _buildSectionCard(
              title: 'Parent / Guardian Details',
              icon: Icons.family_restroom_rounded,
              children: [
                _buildTextField(
                  controller: _fatherCtrl,
                  label: "Father's Name",
                  hint: 'Enter father full name',
                ),
                const SizedBox(height: 12),
                _buildTextField(
                  controller: _motherCtrl,
                  label: "Mother's Name",
                  hint: 'Enter mother full name',
                ),
                const SizedBox(height: 12),
                _buildTextField(
                  controller: _phoneCtrl,
                  label: 'Primary Phone Number *',
                  hint: '10-digit mobile number',
                  keyboardType: TextInputType.phone,
                  prefixText: '+91 ',
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) return 'Phone number is required';
                    if (v.replaceAll(RegExp(r'\D'), '').length < 10) return 'Enter a valid 10-digit number';
                    return null;
                  },
                ),
                const SizedBox(height: 12),
                _buildTextField(
                  controller: _addressCtrl,
                  label: 'Residential Address',
                  hint: 'Enter residential address',
                  maxLines: 2,
                ),
              ],
            ),

            const SizedBox(height: 16),

            // 4. APPLICATION FEE & PAYMENT CARD
            _buildSectionCard(
              title: 'Application Fee & Payment',
              icon: Icons.currency_rupee_rounded,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: _buildTextField(
                        controller: _feeCtrl,
                        label: 'Application Fee (₹)',
                        hint: 'Enter fee amount (₹)',
                        keyboardType: TextInputType.number,
                        onChanged: (_) => setState(() {}),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildDropdown(
                        label: 'Payment Method *',
                        value: _paymentMethod,
                        items: const ['CASH', 'UPI', 'LATER'],
                        onChanged: (v) => setState(() {
                          _paymentMethod = v!;
                          if (_paymentMethod != 'UPI') {
                            _uploadedReceiptUrl = null;
                            _localReceiptFile = null;
                          }
                        }),
                      ),
                    ),
                  ],
                ),

                // Conditional: CASH PAYMENT FLOW
                if (_paymentMethod == 'CASH') ...[
                  const SizedBox(height: 14),
                  DropdownButtonFormField<String>(
                    value: _cashTeacherName,
                    isExpanded: true,
                    decoration: InputDecoration(
                      labelText: 'Cash Received By Teacher *',
                      labelStyle: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold, color: const Color(0xFFD97706)),
                      hintText: '-- Select Teacher who received cash --',
                      hintStyle: GoogleFonts.outfit(fontSize: 12, color: const Color(0xFF94A3B8)),
                      filled: true,
                      fillColor: const Color(0xFFFFFBEB),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFFDE68A))),
                      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFFDE68A))),
                      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFD97706), width: 1.5)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    ),
                    items: _teachers.map((t) {
                      final tName = t['user']?['name']?.toString() ?? t['name']?.toString() ?? 'Teacher';
                      final tSub = t['subject'] != null && t['subject'].toString().isNotEmpty ? ' (${t['subject']})' : '';
                      return DropdownMenuItem<String>(
                        value: tName,
                        child: Text(
                          '$tName$tSub',
                          style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF1E293B)),
                          overflow: TextOverflow.ellipsis,
                        ),
                      );
                    }).toList(),
                    onChanged: (val) {
                      setState(() {
                        _cashTeacherName = val;
                        final found = _teachers.firstWhere(
                          (t) => (t['user']?['name']?.toString() ?? t['name']?.toString()) == val,
                          orElse: () => {},
                        );
                        _cashTeacherId = found['id']?.toString();
                      });
                    },
                    validator: (val) {
                      if (_paymentMethod == 'CASH' && (val == null || val.trim().isEmpty)) {
                        return 'Please select the teacher who received the cash';
                      }
                      return null;
                    },
                  ),
                  if (_cashTeacherName != null && _cashTeacherName!.isNotEmpty) ...[
                    const SizedBox(height: 10),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFEF3C7),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: const Color(0xFFFCD34D)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.check_circle_outline_rounded, size: 16, color: Color(0xFFD97706)),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Cash payment of ₹${_feeCtrl.text.trim().isEmpty ? '0' : _feeCtrl.text.trim()} will be recorded as received by $_cashTeacherName.',
                              style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF92400E)),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],

                // Conditional: UPI PAYMENT FLOW
                if (_paymentMethod == 'UPI') ...[
                  const SizedBox(height: 16),
                  
                  // School QR Code Display Box
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.qr_code_2_rounded, size: 20, color: Color(0xFF4F46E5)),
                            const SizedBox(width: 8),
                            Text(
                              'School UPI Payment QR Code',
                              style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B)),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFFE0E7FF)),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF4F46E5).withOpacity(0.08),
                                blurRadius: 12,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(10),
                            child: Image.network(
                              _schoolQrUrl != null && _schoolQrUrl!.isNotEmpty
                                  ? _schoolQrUrl!
                                  : 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${Uri.encodeComponent('upi://pay?pa=$_upiId&pn=JY%20School&cu=INR${_feeCtrl.text.trim().isNotEmpty ? '&am=' + _feeCtrl.text.trim() : ''}')}',
                              width: 140,
                              height: 140,
                              fit: BoxFit.contain,
                              errorBuilder: (context, error, stackTrace) {
                                return Image.network(
                                  'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${Uri.encodeComponent('upi://pay?pa=$_upiId&pn=JY%20School&cu=INR${_feeCtrl.text.trim().isNotEmpty ? '&am=' + _feeCtrl.text.trim() : ''}')}',
                                  width: 140,
                                  height: 140,
                                  fit: BoxFit.contain,
                                  errorBuilder: (context, error, stackTrace) {
                                    return Container(
                                      width: 140,
                                      height: 140,
                                      color: Colors.grey.shade100,
                                      alignment: Alignment.center,
                                      child: Text('QR Code Available', style: GoogleFonts.outfit(color: Colors.grey.shade500, fontSize: 11)),
                                    );
                                  },
                                );
                              },
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                        // UPI ID Pill
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: const Color(0xFFCBD5E1)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.account_balance_wallet_rounded, size: 14, color: Color(0xFF4F46E5)),
                              const SizedBox(width: 6),
                              Text(
                                _upiId,
                                style: GoogleFonts.firaCode(fontSize: 12, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A)),
                              ),
                              const SizedBox(width: 8),
                              InkWell(
                                onTap: () {
                                  Clipboard.setData(ClipboardData(text: _upiId));
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('UPI ID copied to clipboard!'), duration: Duration(seconds: 2)),
                                  );
                                },
                                child: const Padding(
                                  padding: EdgeInsets.all(2),
                                  child: Icon(Icons.copy_rounded, size: 14, color: Color(0xFF6366F1)),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'Scan and pay using PhonePe / Google Pay / Paytm',
                          style: GoogleFonts.outfit(fontSize: 11, color: const Color(0xFF64748B)),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 14),

                  // UPI Receipt Upload Box (Mandatory)
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEEF2FF),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFC7D2FE), width: 1.5),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                const Icon(Icons.receipt_long_rounded, size: 16, color: Color(0xFF4F46E5)),
                                const SizedBox(width: 6),
                                Text(
                                  'Payment Receipt Screenshot',
                                  style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.bold, color: const Color(0xFF1E1B4B)),
                                ),
                              ],
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: const Color(0xFFDC2626).withOpacity(0.1),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                'MANDATORY *',
                                style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.bold, color: const Color(0xFFDC2626)),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        if (_isUploadingReceipt) ...[
                          Container(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            alignment: Alignment.center,
                            child: Column(
                              children: [
                                const SizedBox(
                                  width: 24,
                                  height: 24,
                                  child: CircularProgressIndicator(color: Color(0xFF4F46E5), strokeWidth: 2.5),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'Uploading payment receipt...',
                                  style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold, color: const Color(0xFF4F46E5)),
                                ),
                              ],
                            ),
                          ),
                        ] else if (_localReceiptFile != null || _uploadedReceiptUrl != null) ...[
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: const Color(0xFFA7F3D0)),
                            ),
                            child: Row(
                              children: [
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(8),
                                  child: _localReceiptFile != null
                                      ? Image.file(_localReceiptFile!, width: 50, height: 50, fit: BoxFit.cover)
                                      : Image.network(_uploadedReceiptUrl!, width: 50, height: 50, fit: BoxFit.cover),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          const Icon(Icons.check_circle_rounded, size: 15, color: Color(0xFF10B981)),
                                          const SizedBox(width: 4),
                                          Text(
                                            'Receipt Attached',
                                            style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.bold, color: const Color(0xFF065F46)),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        'Ready to submit with application',
                                        style: GoogleFonts.outfit(fontSize: 11, color: const Color(0xFF6B7280)),
                                      ),
                                    ],
                                  ),
                                ),
                                TextButton.icon(
                                  onPressed: _showReceiptOptions,
                                  icon: const Icon(Icons.edit_rounded, size: 14),
                                  label: const Text('Change'),
                                  style: TextButton.styleFrom(
                                    foregroundColor: const Color(0xFF4F46E5),
                                    textStyle: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ] else ...[
                          InkWell(
                            onTap: _showReceiptOptions,
                            borderRadius: BorderRadius.circular(12),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: const Color(0xFF818CF8)),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Icon(Icons.upload_file_rounded, size: 20, color: Color(0xFF4F46E5)),
                                  const SizedBox(width: 8),
                                  Text(
                                    'Upload Receipt / Screenshot *',
                                    style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.bold, color: const Color(0xFF4F46E5)),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'Please take a screenshot of your successful UPI transaction and upload it.',
                            style: GoogleFonts.outfit(fontSize: 11, color: const Color(0xFF64748B)),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],

                // Conditional: LATER PAYMENT FLOW
                if (_paymentMethod == 'LATER') ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFCBD5E1)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.info_outline_rounded, size: 18, color: Color(0xFF475569)),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            'Application fee will be marked as PENDING. Student can pay fee at the school office during physical verification.',
                            style: GoogleFonts.outfit(fontSize: 12, color: const Color(0xFF334155), fontWeight: FontWeight.w500),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),

            const SizedBox(height: 24),

            // SUBMIT BUTTON (Strict Rule: SafeArea wrapped!)
            SafeArea(
              bottom: true,
              child: ElevatedButton.icon(
                onPressed: _isSubmitting ? null : _submitForm,
                icon: _isSubmitting
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                      )
                    : const Icon(Icons.check_circle_outline_rounded, size: 20),
                label: Text(
                  _isSubmitting ? 'Registering...' : 'Submit Student Admission',
                  style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF4F46E5),
                  foregroundColor: Colors.white,
                  minimumSize: const Size(double.infinity, 54),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  elevation: 2,
                ),
              ),
            ),

            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionCard({required String title, required IconData icon, required List<Widget> children}) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: const BorderSide(color: Color(0xFFE2E8F0)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, size: 18, color: const Color(0xFF4F46E5)),
                const SizedBox(width: 8),
                Text(
                  title,
                  style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 14, color: const Color(0xFF1E293B)),
                ),
              ],
            ),
            const Divider(height: 20, color: Color(0xFFF1F5F9)),
            ...children,
          ],
        ),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required String hint,
    TextInputType keyboardType = TextInputType.text,
    int maxLines = 1,
    String? prefixText,
    String? Function(String?)? validator,
    void Function(String)? onChanged,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      maxLines: maxLines,
      validator: validator,
      onChanged: onChanged,
      style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w600, color: const Color(0xFF0F172A)),
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        prefixText: prefixText,
        labelStyle: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold, color: const Color(0xFF64748B)),
        hintStyle: GoogleFonts.outfit(fontSize: 12, color: const Color(0xFF94A3B8)),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF4F46E5), width: 1.5)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      ),
    );
  }

  Widget _buildDropdown({
    required String label,
    required String value,
    required List<String> items,
    required void Function(String?) onChanged,
  }) {
    return DropdownButtonFormField<String>(
      value: items.contains(value) ? value : items.first,
      onChanged: onChanged,
      decoration: InputDecoration(
        labelText: label,
        labelStyle: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold, color: const Color(0xFF64748B)),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      ),
      items: items.map((e) => DropdownMenuItem(value: e, child: Text(e, style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w600)))).toList(),
    );
  }

  Widget _buildGenderSelector() {
    return InputDecorator(
      decoration: InputDecoration(
        labelText: 'Gender',
        labelStyle: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          ChoiceChip(
            label: Text('Boy', style: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.bold)),
            selected: _gender == 'Male',
            onSelected: (s) => setState(() => _gender = 'Male'),
            selectedColor: const Color(0xFFEEF2FF),
          ),
          ChoiceChip(
            label: Text('Girl', style: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.bold)),
            selected: _gender == 'Female',
            onSelected: (s) => setState(() => _gender = 'Female'),
            selectedColor: const Color(0xFFFDF2F8),
          ),
        ],
      ),
    );
  }
}
