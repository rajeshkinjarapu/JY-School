import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';

import '../services/api_service.dart';
import '../services/admission_pdf_service.dart';
import '../utils/ap_locations.dart';

class AdmissionRegistrationScreen extends StatefulWidget {
  const AdmissionRegistrationScreen({super.key});

  @override
  State<AdmissionRegistrationScreen> createState() => _AdmissionRegistrationScreenState();
}

class _AdmissionRegistrationScreenState extends State<AdmissionRegistrationScreen> {
  final _formKey = GlobalKey<FormState>();

  // 1. Student Controllers
  final _nameCtrl = TextEditingController();
  final _aadharCtrl = TextEditingController();
  String _gender = 'MALE';
  String _classApplied = 'Class 1';
  String _academicYear = '2026-2027';
  final List<String> _academicYears = ['2026-2027', '2027-2028'];
  String _motherTongue = 'Telugu';
  DateTime? _dob;

  // 2. Parent Particulars Controllers
  final _fatherCtrl = TextEditingController();
  final _fatherOccupationCtrl = TextEditingController();
  final _fatherAadharCtrl = TextEditingController();
  final _fatherPhoneCtrl = TextEditingController();

  final _motherCtrl = TextEditingController();
  final _motherOccupationCtrl = TextEditingController();
  final _motherAadharCtrl = TextEditingController();
  final _motherPhoneCtrl = TextEditingController();

  final _phoneCtrl = TextEditingController(); // Primary phone
  final _altPhoneCtrl = TextEditingController(); // Alternate phone

  // 3. Demographics Controllers
  String _nationality = 'Indian';
  String _religion = 'Hindu';
  String _caste = 'BC-A';
  final _subCasteCtrl = TextEditingController();
  final _previousSchoolCtrl = TextEditingController();

  // 4. Residence Cascading State
  String _selectedState = 'Andhra Pradesh';
  String _selectedDistrict = 'Srikakulam';
  String _selectedMandal = 'Narasannapeta';
  String _selectedVillage = 'Narasannapeta Main (Ward 1)';
  final _customVillageCtrl = TextEditingController();
  final _doorNoCtrl = TextEditingController();

  // 5. Siblings State
  bool _hasSiblings = false;
  final List<Map<String, String>> _siblings = [];

  // 6. Application Fee & Payment
  final _feeCtrl = TextEditingController();
  String _paymentMethod = 'CASH';

  // 7. Terms Acceptance
  bool _termsAccepted = false;

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
    _aadharCtrl.dispose();
    _fatherCtrl.dispose();
    _fatherOccupationCtrl.dispose();
    _fatherAadharCtrl.dispose();
    _fatherPhoneCtrl.dispose();
    _motherCtrl.dispose();
    _motherOccupationCtrl.dispose();
    _motherAadharCtrl.dispose();
    _motherPhoneCtrl.dispose();
    _phoneCtrl.dispose();
    _altPhoneCtrl.dispose();
    _subCasteCtrl.dispose();
    _previousSchoolCtrl.dispose();
    _customVillageCtrl.dispose();
    _doorNoCtrl.dispose();
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
    Navigator.of(context).pop();
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
    Navigator.of(context).pop();
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

  // Sibling Helpers
  void _addSibling() {
    setState(() {
      _siblings.add({'name': '', 'className': 'Class 1', 'schoolName': ''});
    });
  }

  void _removeSibling(int index) {
    setState(() {
      _siblings.removeAt(index);
    });
  }

  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) return;

    final primaryContact = _phoneCtrl.text.trim().isNotEmpty
        ? _phoneCtrl.text.trim()
        : _fatherPhoneCtrl.text.trim().isNotEmpty
            ? _fatherPhoneCtrl.text.trim()
            : _motherPhoneCtrl.text.trim();

    if (primaryContact.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('At least one contact phone number is required'), backgroundColor: Colors.red),
      );
      return;
    }

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

    // Mandatory Terms Check
    if (!_termsAccepted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please accept the Terms and Conditions to submit application'), backgroundColor: Colors.red),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    final finalVillage = _selectedVillage == 'Other Village/Sachivalayam'
        ? _customVillageCtrl.text.trim()
        : _selectedVillage;

    final fullAddress = [
      _doorNoCtrl.text.trim(),
      finalVillage,
      _selectedMandal,
      _selectedDistrict,
      _selectedState
    ].where((e) => e.isNotEmpty).join(', ');

    final validSiblings = _hasSiblings
        ? _siblings.where((s) => (s['name'] ?? '').trim().isNotEmpty).toList()
        : [];

    final payload = {
      'studentName': _nameCtrl.text.trim(),
      'classApplied': _classApplied,
      'academicYear': _academicYear,
      'gender': _gender,
      'dob': _dob?.toIso8601String(),
      'aadharNo': _aadharCtrl.text.trim().isEmpty ? null : _aadharCtrl.text.trim(),
      'motherTongue': _motherTongue,
      'studentImage': _uploadedPhotoUrl,

      // Parents
      'fatherName': _fatherCtrl.text.trim().isEmpty ? null : _fatherCtrl.text.trim(),
      'fatherOccupation': _fatherOccupationCtrl.text.trim().isEmpty ? null : _fatherOccupationCtrl.text.trim(),
      'fatherAadhar': _fatherAadharCtrl.text.trim().isEmpty ? null : _fatherAadharCtrl.text.trim(),
      'fatherPhone': _fatherPhoneCtrl.text.trim().isEmpty ? null : _fatherPhoneCtrl.text.trim(),

      'motherName': _motherCtrl.text.trim().isEmpty ? null : _motherCtrl.text.trim(),
      'motherOccupation': _motherOccupationCtrl.text.trim().isEmpty ? null : _motherOccupationCtrl.text.trim(),
      'motherAadhar': _motherAadharCtrl.text.trim().isEmpty ? null : _motherAadharCtrl.text.trim(),
      'motherPhone': _motherPhoneCtrl.text.trim().isEmpty ? null : _motherPhoneCtrl.text.trim(),

      'phone': primaryContact,
      'alternatePhone': _altPhoneCtrl.text.trim().isEmpty ? null : _altPhoneCtrl.text.trim(),

      // Demographics
      'nationality': _nationality,
      'religion': _religion,
      'caste': _caste,
      'subCaste': _subCasteCtrl.text.trim().isEmpty ? null : _subCasteCtrl.text.trim(),
      'previousSchool': _previousSchoolCtrl.text.trim().isEmpty ? null : _previousSchoolCtrl.text.trim(),

      // Residence
      'state': _selectedState,
      'district': _selectedDistrict,
      'mandal': _selectedMandal,
      'village': finalVillage.isEmpty ? null : finalVillage,
      'doorNo': _doorNoCtrl.text.trim().isEmpty ? null : _doorNoCtrl.text.trim(),
      'address': fullAddress,

      // Siblings
      'hasSiblings': _hasSiblings,
      'siblingsData': _hasSiblings ? jsonEncode(validSiblings) : 'NA',

      // Payment
      'admissionFee': _feeCtrl.text.trim().isEmpty ? null : _feeCtrl.text.trim(),
      'paymentMethod': _paymentMethod,
      'paymentReceipt': _paymentMethod == 'UPI' ? _uploadedReceiptUrl : null,
      'cashReceivedByName': _paymentMethod == 'CASH' ? _cashTeacherName : null,
      'cashReceivedById': _paymentMethod == 'CASH' ? _cashTeacherId : null,
      'paymentStatus': (_paymentMethod == 'CASH' || (_paymentMethod == 'UPI' && _uploadedReceiptUrl != null)) && _feeCtrl.text.trim().isNotEmpty ? 'COMPLETED' : 'PENDING',
      'termsAccepted': true,
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
    _aadharCtrl.clear();
    _fatherCtrl.clear();
    _fatherOccupationCtrl.clear();
    _fatherAadharCtrl.clear();
    _fatherPhoneCtrl.clear();
    _motherCtrl.clear();
    _motherOccupationCtrl.clear();
    _motherAadharCtrl.clear();
    _motherPhoneCtrl.clear();
    _phoneCtrl.clear();
    _altPhoneCtrl.clear();
    _subCasteCtrl.clear();
    _previousSchoolCtrl.clear();
    _customVillageCtrl.clear();
    _doorNoCtrl.clear();
    _feeCtrl.clear();
    setState(() {
      _gender = 'MALE';
      _classApplied = 'Class 1';
      _academicYear = '2026-2027';
      _motherTongue = 'Telugu';
      _dob = null;
      _localPhotoFile = null;
      _uploadedPhotoUrl = null;
      _localReceiptFile = null;
      _uploadedReceiptUrl = null;
      _cashTeacherName = null;
      _cashTeacherId = null;
      _paymentMethod = 'CASH';
      _hasSiblings = false;
      _siblings.clear();
      _termsAccepted = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          'Student Admission Registration',
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 17, color: Colors.white),
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
            // PHOTO UPLOAD CARD
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
                    InkWell(
                      onTap: _showPhotoOptions,
                      borderRadius: BorderRadius.circular(16),
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

            // 1. STUDENT DETAILS CARD
            _buildSectionCard(
              title: '1. Student Details',
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
                const SizedBox(height: 12),
                _buildDropdown(
                  label: 'Mother Tongue (మాతృభాష)',
                  value: _motherTongue,
                  items: const ['Telugu', 'English', 'Hindi', 'Odia', 'Other'],
                  onChanged: (v) => setState(() => _motherTongue = v!),
                ),
              ],
            ),

            const SizedBox(height: 16),

            // 2. PARENT & GUARDIAN DETAILS
            _buildSectionCard(
              title: '2. Parent & Guardian Details',
              icon: Icons.family_restroom_rounded,
              children: [
                // Father Block
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text("Father's Details", style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 13, color: const Color(0xFF0F172A))),
                      const SizedBox(height: 8),
                      _buildTextField(controller: _fatherCtrl, label: "Father's Name", hint: 'Enter father full name'),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(child: _buildTextField(controller: _fatherOccupationCtrl, label: 'Occupation', hint: 'e.g. Business/Agri')),
                          const SizedBox(width: 8),
                          Expanded(child: _buildTextField(controller: _fatherAadharCtrl, label: 'Aadhar No', hint: '12-digit number', keyboardType: TextInputType.number)),
                        ],
                      ),
                      const SizedBox(height: 8),
                      _buildTextField(controller: _fatherPhoneCtrl, label: "Father Mobile No", hint: '10-digit mobile number', keyboardType: TextInputType.phone, prefixText: '+91 '),
                    ],
                  ),
                ),

                const SizedBox(height: 12),

                // Mother Block
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text("Mother's Details", style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 13, color: const Color(0xFF0F172A))),
                      const SizedBox(height: 8),
                      _buildTextField(controller: _motherCtrl, label: "Mother's Name", hint: 'Enter mother full name'),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(child: _buildTextField(controller: _motherOccupationCtrl, label: 'Occupation', hint: 'e.g. Homemaker/Employee')),
                          const SizedBox(width: 8),
                          Expanded(child: _buildTextField(controller: _motherAadharCtrl, label: 'Aadhar No', hint: '12-digit number', keyboardType: TextInputType.number)),
                        ],
                      ),
                      const SizedBox(height: 8),
                      _buildTextField(controller: _motherPhoneCtrl, label: "Mother Mobile No", hint: '10-digit mobile number', keyboardType: TextInputType.phone, prefixText: '+91 '),
                    ],
                  ),
                ),

                const SizedBox(height: 12),

                _buildTextField(
                  controller: _phoneCtrl,
                  label: 'Primary Contact Mobile *',
                  hint: '10-digit mobile number',
                  keyboardType: TextInputType.phone,
                  prefixText: '+91 ',
                ),
                const SizedBox(height: 8),
                _buildTextField(
                  controller: _altPhoneCtrl,
                  label: 'Alternate Mobile Number',
                  hint: 'Emergency backup mobile',
                  keyboardType: TextInputType.phone,
                  prefixText: '+91 ',
                ),
              ],
            ),

            const SizedBox(height: 16),

            // 3. DEMOGRAPHICS & PREVIOUS SCHOOL
            _buildSectionCard(
              title: '3. Demographics & Previous School',
              icon: Icons.school_rounded,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: _buildDropdown(
                        label: 'Religion',
                        value: _religion,
                        items: const ['Hindu', 'Muslim', 'Christian', 'Jain', 'Sikh', 'Other'],
                        onChanged: (v) => setState(() => _religion = v!),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _buildDropdown(
                        label: 'Caste Category',
                        value: _caste,
                        items: const ['OC', 'BC-A', 'BC-B', 'BC-C', 'BC-D', 'BC-E', 'SC', 'ST', 'Other'],
                        onChanged: (v) => setState(() => _caste = v!),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                _buildTextField(controller: _subCasteCtrl, label: 'Sub-Caste', hint: 'Enter sub-caste (optional)'),
                const SizedBox(height: 10),
                _buildTextField(controller: _previousSchoolCtrl, label: 'Name of the School Previously Studied', hint: 'Enter previous school name & place (or NA)'),
              ],
            ),

            const SizedBox(height: 16),

            // 4. RESIDENTIAL ADDRESS CASCADING
            _buildSectionCard(
              title: '4. Residential Address',
              icon: Icons.location_on_rounded,
              children: [
                _buildDropdown(
                  label: 'State *',
                  value: _selectedState,
                  items: ApLocations.states,
                  onChanged: (v) {
                    setState(() {
                      _selectedState = v!;
                      final dists = ApLocations.districts[_selectedState] ?? ['Other District'];
                      _selectedDistrict = dists.first;
                      final mnds = ApLocations.mandals[_selectedDistrict] ?? ['Other Mandal'];
                      _selectedMandal = mnds.first;
                      final vils = ApLocations.villages[_selectedMandal] ?? ['Other Village/Sachivalayam'];
                      _selectedVillage = vils.first;
                    });
                  },
                ),
                const SizedBox(height: 10),
                _buildDropdown(
                  label: 'District *',
                  value: _selectedDistrict,
                  items: ApLocations.districts[_selectedState] ?? ['Other District'],
                  onChanged: (v) {
                    setState(() {
                      _selectedDistrict = v!;
                      final mnds = ApLocations.mandals[_selectedDistrict] ?? ['Other Mandal'];
                      _selectedMandal = mnds.first;
                      final vils = ApLocations.villages[_selectedMandal] ?? ['Other Village/Sachivalayam'];
                      _selectedVillage = vils.first;
                    });
                  },
                ),
                const SizedBox(height: 10),
                _buildDropdown(
                  label: 'Mandal *',
                  value: _selectedMandal,
                  items: ApLocations.mandals[_selectedDistrict] ?? ['Other Mandal'],
                  onChanged: (v) {
                    setState(() {
                      _selectedMandal = v!;
                      final vils = ApLocations.villages[_selectedMandal] ?? ['Other Village/Sachivalayam'];
                      _selectedVillage = vils.first;
                    });
                  },
                ),
                const SizedBox(height: 10),
                _buildDropdown(
                  label: 'Village / Sachivalayam *',
                  value: _selectedVillage,
                  items: ApLocations.villages[_selectedMandal] ?? ['Other Village/Sachivalayam'],
                  onChanged: (v) => setState(() => _selectedVillage = v!),
                ),
                if (_selectedVillage == 'Other Village/Sachivalayam') ...[
                  const SizedBox(height: 10),
                  _buildTextField(controller: _customVillageCtrl, label: 'Enter Village / Ward Name *', hint: 'Type village name'),
                ],
                const SizedBox(height: 10),
                _buildTextField(controller: _doorNoCtrl, label: 'Door No, Street Name & Landmark', hint: 'e.g. D.No 4-12, Main Bazar, Narasannapeta'),
              ],
            ),

            const SizedBox(height: 16),

            // 5. SIBLING DETAILS
            _buildSectionCard(
              title: '5. Sibling Details',
              icon: Icons.group_rounded,
              children: [
                CheckboxListTile(
                  value: _hasSiblings,
                  onChanged: (v) {
                    setState(() {
                      _hasSiblings = v ?? false;
                      if (_hasSiblings && _siblings.isEmpty) {
                        _siblings.add({'name': '', 'className': 'Class 1', 'schoolName': ''});
                      }
                    });
                  },
                  title: Text('Does student have siblings? (తోబుట్టువులు ఉన్నారా?)', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 13)),
                  subtitle: Text('Check if applicant has brothers or sisters', style: GoogleFonts.outfit(fontSize: 11, color: Colors.grey)),
                  controlAffinity: ListTileControlAffinity.leading,
                  contentPadding: EdgeInsets.zero,
                  activeColor: const Color(0xFF4F46E5),
                ),
                if (_hasSiblings) ...[
                  const Divider(height: 10),
                  ..._siblings.asMap().entries.map((entry) {
                    final idx = entry.key;
                    final sib = entry.value;
                    return Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFFBEB),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFFDE68A)),
                      ),
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Sibling #${idx + 1}', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 12, color: const Color(0xFF92400E))),
                              IconButton(
                                icon: const Icon(Icons.delete_outline, size: 18, color: Colors.red),
                                onPressed: () => _removeSibling(idx),
                                constraints: const BoxConstraints(),
                                padding: EdgeInsets.zero,
                              ),
                            ],
                          ),
                          TextFormField(
                            initialValue: sib['name'],
                            onChanged: (v) => sib['name'] = v,
                            decoration: const InputDecoration(labelText: 'Sibling Name', contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8)),
                            style: GoogleFonts.outfit(fontSize: 12),
                          ),
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              Expanded(
                                child: DropdownButtonFormField<String>(
                                  value: sib['className'] ?? 'Class 1',
                                  items: _classes.map((c) => DropdownMenuItem(value: c, child: Text(c, style: GoogleFonts.outfit(fontSize: 12)))).toList(),
                                  onChanged: (v) => sib['className'] = v ?? 'Class 1',
                                  decoration: const InputDecoration(labelText: 'Class', contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8)),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: TextFormField(
                                  initialValue: sib['schoolName'],
                                  onChanged: (v) => sib['schoolName'] = v,
                                  decoration: const InputDecoration(labelText: 'Where Studying', hintText: 'School Name', contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8)),
                                  style: GoogleFonts.outfit(fontSize: 12),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    );
                  }),
                  Align(
                    alignment: Alignment.centerRight,
                    child: TextButton.icon(
                      onPressed: _addSibling,
                      icon: const Icon(Icons.add, size: 16),
                      label: const Text('Add Another Sibling'),
                      style: TextButton.styleFrom(foregroundColor: const Color(0xFFD97706)),
                    ),
                  ),
                ],
              ],
            ),

            const SizedBox(height: 16),

            // 6. APPLICATION FEE & PAYMENT CARD
            _buildSectionCard(
              title: '6. Application Fee & Payment',
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

                // Cash Payment
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
                  ),
                ],

                // UPI Payment
                if (_paymentMethod == 'UPI') ...[
                  const SizedBox(height: 14),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Column(
                      children: [
                        Text('School UPI Payment QR Code', style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 10),
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFFE2E8F0))),
                          child: Image.network(
                            _schoolQrUrl != null && _schoolQrUrl!.isNotEmpty
                                ? _schoolQrUrl!
                                : 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${Uri.encodeComponent('upi://pay?pa=$_upiId&pn=JY%20School&cu=INR')}',
                            width: 130,
                            height: 130,
                            fit: BoxFit.contain,
                            errorBuilder: (_, __, ___) => const Icon(Icons.qr_code_2, size: 80, color: Colors.grey),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text('UPI ID: $_upiId', style: GoogleFonts.firaCode(fontSize: 12, fontWeight: FontWeight.bold, color: const Color(0xFF4F46E5))),
                      ],
                    ),
                  ),

                  const SizedBox(height: 12),

                  // UPI Receipt Upload Box
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEEF2FF),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFFC7D2FE)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('Payment Receipt Screenshot', style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold)),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(color: Colors.red.shade100, borderRadius: BorderRadius.circular(4)),
                              child: Text('MANDATORY *', style: GoogleFonts.outfit(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.red.shade800)),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        if (_isUploadingReceipt)
                          const Center(child: Padding(padding: EdgeInsets.all(12), child: CircularProgressIndicator(strokeWidth: 2)))
                        else if (_uploadedReceiptUrl != null || _localReceiptFile != null)
                          Row(
                            children: [
                              const Icon(Icons.check_circle, color: Color(0xFF10B981), size: 20),
                              const SizedBox(width: 8),
                              const Expanded(child: Text('Receipt Attached Successfully!')),
                              TextButton(onPressed: _showReceiptOptions, child: const Text('Change')),
                            ],
                          )
                        else
                          ElevatedButton.icon(
                            onPressed: _showReceiptOptions,
                            icon: const Icon(Icons.upload_file, size: 16),
                            label: const Text('Choose Receipt / Screenshot *'),
                            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF4F46E5), foregroundColor: Colors.white),
                          ),
                      ],
                    ),
                  ),
                ],
              ],
            ),

            const SizedBox(height: 16),

            // 7. TERMS & CONDITIONS CARD
            _buildSectionCard(
              title: '7. Terms and Conditions (Strictly Followed)',
              icon: Icons.gavel_rounded,
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF1F2),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFFECDD3)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Following terms and conditions should strictly be followed:', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 12, color: const Color(0xFF9F1239))),
                      const SizedBox(height: 6),
                      _buildTermItem('1. Student should obey rules and regulations set by management.'),
                      _buildTermItem('2. Student would not be allowed to move around premises without uniform.'),
                      _buildTermItem('3. During school time no visitor is allowed.'),
                      _buildTermItem('4. Parents should not approach teachers without management permission.'),
                      _buildTermItem('5. Management has right to reject or strike out student for breach of rules.'),
                      _buildTermItem('6. Parent pays for any damage done to school property equal to its value.'),
                      _buildTermItem('7. Decision of management is final and binding on all parties.'),
                      _buildTermItem('8. Absent for 10 days without prior notice leads to name being struck out.'),
                      _buildTermItem('9. Student has to pay all dues again to be readmitted.'),
                      _buildTermItem('10. Fee collected in 3 terms; otherwise fee concession is not allowed.'),
                      _buildTermItem('11. The fee once paid will strictly not be refunded.'),
                    ],
                  ),
                ),
                const SizedBox(height: 10),
                CheckboxListTile(
                  value: _termsAccepted,
                  onChanged: (v) => setState(() => _termsAccepted = v ?? false),
                  title: Text(
                    'I have read and agree to all the Terms and Conditions of the School *',
                    style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 12, color: const Color(0xFF0F172A)),
                  ),
                  controlAffinity: ListTileControlAffinity.leading,
                  contentPadding: EdgeInsets.zero,
                  activeColor: const Color(0xFF10B981),
                ),
              ],
            ),

            const SizedBox(height: 24),

            // SUBMIT BUTTON
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

  Widget _buildTermItem(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 3),
      child: Text(text, style: GoogleFonts.outfit(fontSize: 10.5, color: const Color(0xFF475569))),
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
    final validValue = items.contains(value) ? value : (items.isNotEmpty ? items.first : null);
    return DropdownButtonFormField<String>(
      value: validValue,
      onChanged: onChanged,
      isExpanded: true,
      decoration: InputDecoration(
        labelText: label,
        labelStyle: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold, color: const Color(0xFF64748B)),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      ),
      items: items.map((e) => DropdownMenuItem(value: e, child: Text(e, style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w600), overflow: TextOverflow.ellipsis))).toList(),
    );
  }

  Widget _buildGenderSelector() {
    return InputDecorator(
      decoration: InputDecoration(
        labelText: 'Gender *',
        labelStyle: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          ChoiceChip(
            label: Text('MALE', style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold)),
            selected: _gender == 'MALE',
            onSelected: (s) => setState(() => _gender = 'MALE'),
            selectedColor: const Color(0xFFEEF2FF),
          ),
          ChoiceChip(
            label: Text('FEMALE', style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold)),
            selected: _gender == 'FEMALE',
            onSelected: (s) => setState(() => _gender = 'FEMALE'),
            selectedColor: const Color(0xFFFDF2F8),
          ),
        ],
      ),
    );
  }
}
