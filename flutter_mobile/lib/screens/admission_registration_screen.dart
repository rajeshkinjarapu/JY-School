import 'dart:io';
import 'package:flutter/material.dart';
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

  final List<String> _defaultClasses = [
    'Nursery', 'LKG', 'UKG',
    'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
    'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'
  ];
  List<String> _classes = [];

  @override
  void initState() {
    super.initState();
    _classes = List.from(_defaultClasses);
    _loadClasses();
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

  Future<void> _loadClasses() async {
    try {
      final res = await ApiService.getClasses();
      if (res['success'] == true && res['data'] != null && res['data'] is List) {
        final list = (res['data'] as List).map((c) => c['name']?.toString()).whereType<String>().toList();
        if (list.isNotEmpty) {
          setState(() {
            _classes = {..._defaultClasses, ...list}.toList();
          });
        }
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

  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) return;

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
      'paymentStatus': _paymentMethod == 'CASH' && _feeCtrl.text.trim().isNotEmpty ? 'COMPLETED' : 'PENDING',
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

            // 4. FEE & PAYMENT CARD
            _buildSectionCard(
              title: 'Admission Fee (Optional)',
              icon: Icons.currency_rupee_rounded,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: _buildTextField(
                        controller: _feeCtrl,
                        label: 'Fee Amount (₹)',
                        hint: 'Enter fee amount',
                        keyboardType: TextInputType.number,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildDropdown(
                        label: 'Payment Method',
                        value: _paymentMethod,
                        items: const ['CASH', 'UPI', 'LATER'],
                        onChanged: (v) => setState(() => _paymentMethod = v!),
                      ),
                    ),
                  ],
                ),
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
          crossAxisAlignment: CrossAlignment.start,
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
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      maxLines: maxLines,
      validator: validator,
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
