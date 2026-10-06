import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';

import 'package:intl/intl.dart';
import '../services/api_service.dart';
import '../widgets/app_drawer.dart';
import '../widgets/custom_text_field.dart';

class AdmissionRegistrationScreen extends StatefulWidget {
  const AdmissionRegistrationScreen({super.key});

  @override
  State<AdmissionRegistrationScreen> createState() => _AdmissionRegistrationScreenState();
}

class _AdmissionRegistrationScreenState extends State<AdmissionRegistrationScreen> {
  final _formKey = GlobalKey<FormState>();
  int _currentStep = 0;
  bool _isLoading = false;

  // Form Controllers
  final TextEditingController _studentNameController = TextEditingController();
  final TextEditingController _dobController = TextEditingController();
  final TextEditingController _aadharController = TextEditingController();
  final TextEditingController _fatherNameController = TextEditingController();
  final TextEditingController _fatherOccupationController = TextEditingController();
  final TextEditingController _fatherAadharController = TextEditingController();
  final TextEditingController _fatherPhoneController = TextEditingController();
  final TextEditingController _motherNameController = TextEditingController();
  final TextEditingController _motherOccupationController = TextEditingController();
  final TextEditingController _motherAadharController = TextEditingController();
  final TextEditingController _motherPhoneController = TextEditingController();
  final TextEditingController _nationalityController = TextEditingController(text: 'Indian');
  final TextEditingController _previousSchoolController = TextEditingController();
  final TextEditingController _doorNoController = TextEditingController();
  final TextEditingController _customVillageController = TextEditingController();
  final TextEditingController _customSubCasteController = TextEditingController();
  final TextEditingController _feeController = TextEditingController();

  // Dropdowns State
  String _selectedClass = 'Class 1';
  String _academicYear = '2026-2027';
  String _gender = 'MALE';
  String _motherTongue = 'Telugu';
  String _religion = 'Hindu';
  String _caste = 'BC-A';
  String _subCaste = 'Other Sub-Caste';
  String _selectedState = 'Andhra Pradesh';
  String _selectedDistrict = 'Srikakulam';
  String _selectedMandal = 'Narasannapeta';
  String _selectedVillage = 'Narasannapeta Main (Ward 1)';
  String _paymentMethod = 'CASH';
  
  // Teachers for cash payment
  List<dynamic> _teachers = [];
  String? _selectedTeacherName;
  String? _selectedTeacherId;

  // File Uploads
  File? _studentImageFile;
  String? _studentImageUrl;
  File? _receiptFile;
  String? _receiptUrl;
  
  // Siblings
  bool _hasSiblings = false;
  List<Map<String, dynamic>> _siblings = [
    {'name': '', 'className': 'Class 1', 'schoolName': ''}
  ];

  bool _termsAccepted = false;
  Map<String, dynamic>? _submittedAdmission;

  final List<String> _classes = ['Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'];
  
  // Basic mock data for locations (In a real app, you might fetch this)
  final List<String> _districts = ['Srikakulam', 'Vizianagaram', 'Visakhapatnam', 'Other District'];
  final List<String> _mandals = ['Narasannapeta', 'Srikakulam', 'Amadalavalasa', 'Other Mandal'];
  final List<String> _villages = ['Narasannapeta Main (Ward 1)', 'Makhvalasa', 'Other Village/Sachivalayam'];
  final List<String> _categories = ['OC', 'BC-A', 'BC-B', 'BC-C', 'BC-D', 'SC', 'ST'];
  final List<String> _subCastesList = ['Kapu', 'Telaga', 'Other Sub-Caste'];

  @override
  void initState() {
    super.initState();
    _fetchTeachers();
  }

  Future<void> _fetchTeachers() async {
    try {
      final response = await ApiService.get('/api/teachers?limit=100');
      if (response != null && response['data'] != null) {
        setState(() {
          _teachers = response['data'];
        });
      }
    } catch (e) {
      debugPrint('Error fetching teachers: $e');
    }
  }

  Future<void> _pickImage(bool isStudentImage) async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery, imageQuality: 70);
    
    if (pickedFile != null) {
      setState(() => _isLoading = true);
      try {
        final File file = File(pickedFile.path);
        
        if (isStudentImage) {
          final res = await ApiService.uploadFile('/api/uploads/image', file);
          setState(() {
            _studentImageFile = file;
            _studentImageUrl = res['url'] ?? res['data']?['url'];
          });
        } else {
          final res = await ApiService.uploadFile('/api/uploads/share', file);
          setState(() {
            _receiptFile = file;
            _receiptUrl = res['url'] ?? res['data']?['url'];
          });
        }
        
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('File uploaded successfully!'), backgroundColor: Colors.green));
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Upload failed: $e'), backgroundColor: Colors.red));
      } finally {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _selectDate() async {
    DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime(2015),
      firstDate: DateTime(2000),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: Color(0xFF4F46E5), // header background color
              onPrimary: Colors.white, // header text color
              onSurface: Colors.black, // body text color
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() {
        _dobController.text = DateFormat('yyyy-MM-dd').format(picked);
      });
    }
  }

  Future<void> _submitRegistration() async {
    final contactMobile = _fatherPhoneController.text.trim().isNotEmpty ? _fatherPhoneController.text.trim() : _motherPhoneController.text.trim();
    if (contactMobile.length < 10) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter a valid 10-digit mobile number for Father or Mother.'), backgroundColor: Colors.red));
      return;
    }

    if (_paymentMethod == 'UPI' && _receiptUrl == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Payment receipt is mandatory for UPI payments.'), backgroundColor: Colors.red));
      return;
    }

    if (_paymentMethod == 'CASH' && _selectedTeacherName == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select the teacher who received the cash.'), backgroundColor: Colors.red));
      return;
    }

    if (!_termsAccepted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please accept the Terms and Conditions.'), backgroundColor: Colors.red));
      return;
    }

    setState(() => _isLoading = true);
    
    try {
      final finalVillage = _selectedVillage == 'Other Village/Sachivalayam' ? _customVillageController.text.trim() : _selectedVillage;
      final finalSubCaste = _subCaste == 'Other Sub-Caste' ? _customSubCasteController.text.trim() : _subCaste;
      
      final addressParts = [_doorNoController.text.trim(), finalVillage, _selectedMandal, _selectedDistrict, _selectedState];
      final fullAddress = addressParts.where((part) => part.isNotEmpty).join(', ');

      final validSiblings = _hasSiblings ? _siblings.where((s) => s['name'].toString().trim().isNotEmpty).toList() : [];

      final payload = {
        'studentName': _studentNameController.text.trim(),
        'classApplied': _selectedClass,
        'academicYear': _academicYear,
        'gender': _gender,
        'dob': _dobController.text.trim(),
        'aadharNo': _aadharController.text.trim(),
        'motherTongue': _motherTongue,
        'studentImage': _studentImageUrl,
        'fatherName': _fatherNameController.text.trim(),
        'fatherOccupation': _fatherOccupationController.text.trim(),
        'fatherAadhar': _fatherAadharController.text.trim(),
        'fatherPhone': _fatherPhoneController.text.trim(),
        'motherName': _motherNameController.text.trim(),
        'motherOccupation': _motherOccupationController.text.trim(),
        'motherAadhar': _motherAadharController.text.trim(),
        'motherPhone': _motherPhoneController.text.trim(),
        'phone': contactMobile,
        'nationality': _nationalityController.text.trim(),
        'religion': _religion,
        'caste': _caste,
        'subCaste': finalSubCaste,
        'previousSchool': _previousSchoolController.text.trim(),
        'state': _selectedState,
        'district': _selectedDistrict,
        'mandal': _selectedMandal,
        'village': finalVillage,
        'doorNo': _doorNoController.text.trim(),
        'address': fullAddress,
        'hasSiblings': _hasSiblings,
        'siblingsData': _hasSiblings ? jsonEncode(validSiblings) : 'NA',
        'admissionFee': _feeController.text.trim(),
        'paymentMethod': _paymentMethod,
        'paymentReceipt': _paymentMethod == 'UPI' ? _receiptUrl : null,
        'cashReceivedByName': _paymentMethod == 'CASH' ? _selectedTeacherName : null,
        'cashReceivedById': _paymentMethod == 'CASH' ? _selectedTeacherId : null,
        'paymentStatus': (_paymentMethod == 'CASH' || (_paymentMethod == 'UPI' && _receiptUrl != null)) && _feeController.text.trim().isNotEmpty ? 'COMPLETED' : 'PENDING',
        'termsAccepted': true,
      };

      final response = await ApiService.post('/api/admissions/apply', payload);
      
      if (response != null && (response['data'] != null || response['id'] != null)) {
        setState(() {
          _submittedAdmission = response['data'] ?? response;
        });
      } else {
        throw Exception('Registration failed to return data');
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString().replaceAll('Exception: ', '')), backgroundColor: Colors.red));
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _resetForm() {
    setState(() {
      _currentStep = 0;
      _submittedAdmission = null;
      _studentNameController.clear();
      _dobController.clear();
      _aadharController.clear();
      _fatherNameController.clear();
      _fatherOccupationController.clear();
      _fatherAadharController.clear();
      _fatherPhoneController.clear();
      _motherNameController.clear();
      _motherOccupationController.clear();
      _motherAadharController.clear();
      _motherPhoneController.clear();
      _previousSchoolController.clear();
      _doorNoController.clear();
      _customVillageController.clear();
      _customSubCasteController.clear();
      _feeController.clear();
      _studentImageFile = null;
      _studentImageUrl = null;
      _receiptFile = null;
      _receiptUrl = null;
      _hasSiblings = false;
      _siblings = [{'name': '', 'className': 'Class 1', 'schoolName': ''}];
      _termsAccepted = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_submittedAdmission != null) {
      return _buildSuccessView();
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text('Student Registration', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF1E293B),
        elevation: 0,
      ),
      drawer: const AppDrawer(currentRoute: 'admissions_register'),
      body: SafeArea(
        bottom: true,
        child: Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(primary: Color(0xFF4F46E5)),
          ),
          child: Stepper(
            type: StepperType.vertical,
            currentStep: _currentStep,
            physics: const BouncingScrollPhysics(),
            onStepTapped: (step) => setState(() => _currentStep = step),
            onStepContinue: () {
              if (_currentStep < 6) {
                setState(() => _currentStep += 1);
              } else {
                _submitRegistration();
              }
            },
            onStepCancel: () {
              if (_currentStep > 0) {
                setState(() => _currentStep -= 1);
              }
            },
            controlsBuilder: (context, details) {
              return Padding(
                padding: const EdgeInsets.only(top: 24.0),
                child: Row(
                  children: [
                    Expanded(
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : details.onStepContinue,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF4F46E5),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          elevation: 0,
                        ),
                        child: _isLoading && _currentStep == 6
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : Text(_currentStep == 6 ? 'Submit Registration' : 'Continue', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                      ),
                    ),
                    if (_currentStep > 0) ...[
                      const SizedBox(width: 12),
                      Expanded(
                        child: OutlinedButton(
                          onPressed: _isLoading ? null : details.onStepCancel,
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            side: const BorderSide(color: Color(0xFFCBD5E1)),
                          ),
                          child: Text('Back', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF64748B))),
                        ),
                      ),
                    ]
                  ],
                ),
              );
            },
            steps: [
              _buildStudentStep(),
              _buildParentStep(),
              _buildDemographicsStep(),
              _buildAddressStep(),
              _buildSiblingsStep(),
              _buildPaymentStep(),
              _buildTermsStep(),
            ],
          ),
        ),
      ),
    );
  }

  // Helper Widget for Section Cards
  Widget _buildCardContainer({required Color accentColor, required IconData icon, required String title, required Widget child}) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(color: accentColor.withOpacity(0.05), blurRadius: 20, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: accentColor.withOpacity(0.05),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
              border: Border(bottom: BorderSide(color: accentColor.withOpacity(0.1))),
            ),
            child: Row(
              children: [
                Icon(icon, color: accentColor, size: 20),
                const SizedBox(width: 12),
                Text(title, style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.black87)),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: child,
          ),
        ],
      ),
    );
  }

  // Helper for Section Labels
  Widget _label(String text, {bool required = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8, top: 16),
      child: Row(
        children: [
          Text(text.toUpperCase(), style: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey.shade600, letterSpacing: 0.5)),
          if (required) Text(' *', style: TextStyle(color: Colors.red.shade400, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Step _buildStudentStep() {
    return Step(
      title: Text('Student', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
      isActive: _currentStep >= 0,
      state: _currentStep > 0 ? StepState.complete : StepState.indexed,
      content: _buildCardContainer(
        accentColor: const Color(0xFF4F46E5),
        icon: Icons.person,
        title: 'Student Details',
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: GestureDetector(
                onTap: () => _pickImage(true),
                child: Container(
                  width: 120,
                  height: 140,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: _studentImageFile != null ? const Color(0xFF4F46E5) : const Color(0xFFCBD5E1), width: 2, style: BorderStyle.solid),
                    image: _studentImageFile != null
                        ? DecorationImage(image: FileImage(_studentImageFile!), fit: BoxFit.cover)
                        : null,
                  ),
                  child: _studentImageFile == null
                      ? Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.camera_alt, color: Color(0xFF94A3B8), size: 32),
                            const SizedBox(height: 8),
                            Text('Upload Photo', style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF64748B))),
                          ],
                        )
                      : null,
                ),
              ),
            ),
            const SizedBox(height: 16),
            _label('Student Full Name', required: true),
            CustomTextField(controller: _studentNameController, hintText: 'Enter Student Name', textCapitalization: TextCapitalization.characters),
            _label('Class Applied For', required: true),
            _buildDropdown(_classes, _selectedClass, (val) => setState(() => _selectedClass = val!)),
            _label('Academic Year', required: true),
            _buildDropdown(['2026-2027', '2027-2028'], _academicYear, (val) => setState(() => _academicYear = val!)),
            _label('Gender', required: true),
            Row(
              children: [
                Expanded(child: _buildGenderBtn('MALE')),
                const SizedBox(width: 12),
                Expanded(child: _buildGenderBtn('FEMALE')),
              ],
            ),
            _label('Date of Birth'),
            GestureDetector(
              onTap: _selectDate,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFFE2E8F0))),
                child: Text(_dobController.text.isEmpty ? 'Select Date' : _dobController.text, style: GoogleFonts.outfit(fontSize: 14, color: _dobController.text.isEmpty ? Colors.grey : Colors.black87, fontWeight: FontWeight.w600)),
              ),
            ),
            _label('Aadhaar Number'),
            CustomTextField(controller: _aadharController, hintText: '12-digit number', keyboardType: TextInputType.number, maxLength: 12),
            _label('Mother Tongue'),
            _buildDropdown(['Telugu', 'English', 'Hindi', 'Odia', 'Other'], _motherTongue, (val) => setState(() => _motherTongue = val!)),
          ],
        ),
      ),
    );
  }

  Widget _buildGenderBtn(String type) {
    bool isSel = _gender == type;
    return GestureDetector(
      onTap: () => setState(() => _gender = type),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isSel ? const Color(0xFF4F46E5) : const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(12),
        ),
        alignment: Alignment.center,
        child: Text(type, style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.bold, color: isSel ? Colors.white : const Color(0xFF64748B))),
      ),
    );
  }

  Step _buildParentStep() {
    return Step(
      title: Text('Parents', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
      isActive: _currentStep >= 1,
      state: _currentStep > 1 ? StepState.complete : StepState.indexed,
      content: _buildCardContainer(
        accentColor: const Color(0xFF10B981),
        icon: Icons.people,
        title: 'Parent Details',
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text("Father's Information", style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.bold, color: const Color(0xFF059669))),
            const SizedBox(height: 8),
            CustomTextField(controller: _fatherNameController, hintText: 'Father Name', textCapitalization: TextCapitalization.characters),
            const SizedBox(height: 12),
            CustomTextField(controller: _fatherOccupationController, hintText: 'Occupation', textCapitalization: TextCapitalization.characters),
            const SizedBox(height: 12),
            CustomTextField(controller: _fatherAadharController, hintText: 'Aadhaar No', keyboardType: TextInputType.number, maxLength: 12),
            const SizedBox(height: 12),
            CustomTextField(controller: _fatherPhoneController, hintText: 'Mobile No (10-digits)', keyboardType: TextInputType.phone, maxLength: 10, prefixIcon: const Icon(Icons.phone, size: 18, color: Colors.grey)),
            
            const Padding(padding: EdgeInsets.symmetric(vertical: 24), child: Divider()),
            
            Text("Mother's Information", style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.bold, color: const Color(0xFFE11D48))),
            const SizedBox(height: 8),
            CustomTextField(controller: _motherNameController, hintText: 'Mother Name', textCapitalization: TextCapitalization.characters),
            const SizedBox(height: 12),
            CustomTextField(controller: _motherOccupationController, hintText: 'Occupation', textCapitalization: TextCapitalization.characters),
            const SizedBox(height: 12),
            CustomTextField(controller: _motherAadharController, hintText: 'Aadhaar No', keyboardType: TextInputType.number, maxLength: 12),
            const SizedBox(height: 12),
            CustomTextField(controller: _motherPhoneController, hintText: 'Mobile No (10-digits)', keyboardType: TextInputType.phone, maxLength: 10, prefixIcon: const Icon(Icons.phone, size: 18, color: Colors.grey)),
          ],
        ),
      ),
    );
  }

  Step _buildDemographicsStep() {
    return Step(
      title: Text('Demographics', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
      isActive: _currentStep >= 2,
      state: _currentStep > 2 ? StepState.complete : StepState.indexed,
      content: _buildCardContainer(
        accentColor: const Color(0xFF0EA5E9),
        icon: Icons.menu_book,
        title: 'Demographics & History',
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _label('Nationality'),
            CustomTextField(controller: _nationalityController, textCapitalization: TextCapitalization.characters),
            _label('Religion'),
            _buildDropdown(['Hindu', 'Muslim', 'Christian', 'Jain', 'Sikh', 'Other'], _religion, (val) => setState(() => _religion = val!)),
            _label('Caste Category', required: true),
            _buildDropdown(_categories, _caste, (val) => setState(() => _caste = val!)),
            _label('Sub-Caste', required: true),
            _buildDropdown(_subCastesList, _subCaste, (val) => setState(() => _subCaste = val!)),
            if (_subCaste == 'Other Sub-Caste') ...[
              _label('Specify Sub-Caste', required: true),
              CustomTextField(controller: _customSubCasteController, hintText: 'Enter Sub-caste', textCapitalization: TextCapitalization.characters),
            ],
            _label('Previous School'),
            CustomTextField(controller: _previousSchoolController, hintText: 'Name & Location', textCapitalization: TextCapitalization.characters),
          ],
        ),
      ),
    );
  }

  Step _buildAddressStep() {
    return Step(
      title: Text('Address', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
      isActive: _currentStep >= 3,
      state: _currentStep > 3 ? StepState.complete : StepState.indexed,
      content: _buildCardContainer(
        accentColor: const Color(0xFF14B8A6),
        icon: Icons.home,
        title: 'Residential Address',
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _label('State', required: true),
            _buildDropdown(['Andhra Pradesh', 'Telangana'], _selectedState, (val) => setState(() => _selectedState = val!)),
            _label('District', required: true),
            _buildDropdown(_districts, _selectedDistrict, (val) => setState(() => _selectedDistrict = val!)),
            _label('Mandal', required: true),
            _buildDropdown(_mandals, _selectedMandal, (val) => setState(() => _selectedMandal = val!)),
            _label('Village / Sachivalayam', required: true),
            _buildDropdown(_villages, _selectedVillage, (val) => setState(() => _selectedVillage = val!)),
            if (_selectedVillage == 'Other Village/Sachivalayam') ...[
              _label('Specify Village', required: true),
              CustomTextField(controller: _customVillageController, hintText: 'Village Name', textCapitalization: TextCapitalization.characters),
            ],
            _label('Door No / Street / Landmark'),
            CustomTextField(controller: _doorNoController, hintText: 'e.g. 4-12, Main Road', textCapitalization: TextCapitalization.characters),
          ],
        ),
      ),
    );
  }

  Step _buildSiblingsStep() {
    return Step(
      title: Text('Siblings', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
      isActive: _currentStep >= 4,
      state: _currentStep > 4 ? StepState.complete : StepState.indexed,
      content: _buildCardContainer(
        accentColor: const Color(0xFFF59E0B),
        icon: Icons.people,
        title: 'Sibling Details',
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            CheckboxListTile(
              title: Text('Applicant has siblings?', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 14)),
              subtitle: Text('Check this if student has brother/sister.', style: GoogleFonts.outfit(fontSize: 12, color: Colors.grey)),
              value: _hasSiblings,
              onChanged: (val) => setState(() => _hasSiblings = val ?? false),
              activeColor: const Color(0xFFF59E0B),
              contentPadding: EdgeInsets.zero,
              controlAffinity: ListTileControlAffinity.leading,
            ),
            if (_hasSiblings) ...[
              const SizedBox(height: 16),
              ...List.generate(_siblings.length, (index) {
                return Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(color: const Color(0xFFFEF3C7), borderRadius: BorderRadius.circular(16)),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Sibling ${index + 1}', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: const Color(0xFFB45309))),
                          if (_siblings.length > 1)
                            GestureDetector(
                              onTap: () => setState(() => _siblings.removeAt(index)),
                              child: const Icon(Icons.delete, color: Colors.red, size: 18),
                            )
                        ],
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        decoration: InputDecoration(
                          hintText: 'Sibling Name',
                          filled: true,
                          fillColor: Colors.white,
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                        ),
                        onChanged: (val) => _siblings[index]['name'] = val,
                      ),
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8)),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            isExpanded: true,
                            value: _siblings[index]['className'],
                            items: [..._classes, 'College', 'Other'].map((String value) {
                              return DropdownMenuItem<String>(value: value, child: Text(value, style: GoogleFonts.outfit(fontSize: 14)));
                            }).toList(),
                            onChanged: (val) => setState(() => _siblings[index]['className'] = val!),
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        decoration: InputDecoration(
                          hintText: 'School Name',
                          filled: true,
                          fillColor: Colors.white,
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                        ),
                        onChanged: (val) => _siblings[index]['schoolName'] = val,
                      ),
                    ],
                  ),
                );
              }),
              OutlinedButton.icon(
                onPressed: () => setState(() => _siblings.add({'name': '', 'className': 'Class 1', 'schoolName': ''})),
                icon: const Icon(Icons.add, size: 18),
                label: const Text('Add Another Sibling'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFFD97706),
                  side: const BorderSide(color: Color(0xFFFDE68A)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
              )
            ],
          ],
        ),
      ),
    );
  }

  Step _buildPaymentStep() {
    return Step(
      title: Text('Payment', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
      isActive: _currentStep >= 5,
      state: _currentStep > 5 ? StepState.complete : StepState.indexed,
      content: _buildCardContainer(
        accentColor: const Color(0xFF8B5CF6),
        icon: Icons.credit_card,
        title: 'Fee & Payment Mode',
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _label('Application Fee (₹)'),
            CustomTextField(controller: _feeController, hintText: '0', keyboardType: TextInputType.number),
            _label('Payment Method', required: true),
            _buildDropdown(['CASH', 'UPI', 'LATER'], _paymentMethod, (val) {
              setState(() {
                _paymentMethod = val!;
                if (val != 'UPI') {
                  _receiptFile = null;
                  _receiptUrl = null;
                }
              });
            }),
            if (_paymentMethod == 'CASH') ...[
              _label('Cash Receiver', required: true),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(color: const Color(0xFFFEF3C7), borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFFFDE68A))),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    isExpanded: true,
                    hint: Text('Select Teacher', style: GoogleFonts.outfit(fontSize: 14)),
                    value: _selectedTeacherName,
                    items: _teachers.map<DropdownMenuItem<String>>((t) {
                      final tName = t['user']?['name'] ?? t['name'] ?? 'Teacher';
                      return DropdownMenuItem<String>(value: tName, child: Text(tName, style: GoogleFonts.outfit(fontSize: 14)));
                    }).toList(),
                    onChanged: (val) {
                      setState(() {
                        _selectedTeacherName = val;
                        final t = _teachers.firstWhere((element) => (element['user']?['name'] ?? element['name']) == val, orElse: () => {});
                        _selectedTeacherId = t['id'];
                      });
                    },
                  ),
                ),
              ),
            ],
            if (_paymentMethod == 'UPI') ...[
              _label('Upload Payment Screenshot', required: true),
              GestureDetector(
                onTap: () => _pickImage(false),
                child: Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF5F3FF),
                    border: Border.all(color: const Color(0xFFDDD6FE), style: BorderStyle.solid),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
                        child: Icon(_receiptFile != null ? Icons.check_circle : Icons.upload, color: _receiptFile != null ? Colors.green : const Color(0xFF8B5CF6)),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(_receiptFile != null ? 'Receipt Attached' : 'Upload Screenshot', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 14, color: const Color(0xFF4C1D95))),
                            Text('JPG, PNG up to 10MB', style: GoogleFonts.outfit(fontSize: 11, color: const Color(0xFF7C3AED))),
                          ],
                        ),
                      )
                    ],
                  ),
                ),
              )
            ]
          ],
        ),
      ),
    );
  }

  Step _buildTermsStep() {
    return Step(
      title: Text('Terms', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
      isActive: _currentStep >= 6,
      state: _currentStep > 6 ? StepState.complete : StepState.indexed,
      content: _buildCardContainer(
        accentColor: const Color(0xFFE11D48),
        icon: Icons.verified_user,
        title: 'Terms & Conditions',
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: const Color(0xFFFFF1F2), borderRadius: BorderRadius.circular(12)),
              child: Text(
                "1. Student should obey rules.\n2. Uniform is mandatory.\n3. Fee once paid will not be refunded.\n4. Management decision is final.",
                style: GoogleFonts.outfit(fontSize: 13, height: 1.6, color: const Color(0xFF9F1239)),
              ),
            ),
            const SizedBox(height: 16),
            CheckboxListTile(
              title: Text('I / We agree to abide by all the Terms and Conditions.', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 13)),
              value: _termsAccepted,
              onChanged: (val) => setState(() => _termsAccepted = val ?? false),
              activeColor: const Color(0xFFE11D48),
              contentPadding: EdgeInsets.zero,
              controlAffinity: ListTileControlAffinity.leading,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDropdown(List<String> items, String value, void Function(String?) onChanged) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFFE2E8F0))),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          isExpanded: true,
          value: value,
          items: items.map((String val) => DropdownMenuItem<String>(value: val, child: Text(val, style: GoogleFonts.outfit(fontSize: 14)))).toList(),
          onChanged: onChanged,
        ),
      ),
    );
  }

  Widget _buildSuccessView() {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(32.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(color: const Color(0xFFD1FAE5), shape: BoxShape.circle),
                  child: const Icon(Icons.check_circle, color: Color(0xFF059669), size: 64),
                ),
                const SizedBox(height: 24),
                Text('Registration Successful', style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.w900, color: const Color(0xFF0F172A))),
                const SizedBox(height: 12),
                Text(_submittedAdmission?['studentName'] ?? 'Student', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xFF4F46E5))),
                const SizedBox(height: 8),
                Text('Class: ${_submittedAdmission?['classApplied'] ?? ''}', style: GoogleFonts.outfit(fontSize: 14, color: Colors.grey.shade600)),
                const SizedBox(height: 48),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _resetForm,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF4F46E5),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    child: Text('Register Another', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
