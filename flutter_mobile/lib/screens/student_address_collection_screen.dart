import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../services/api_service.dart';

class StudentAddressCollectionScreen extends StatefulWidget {
  @override
  _StudentAddressCollectionScreenState createState() =>
      _StudentAddressCollectionScreenState();
}

class _StudentAddressCollectionScreenState
    extends State<StudentAddressCollectionScreen> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _studentNameController = TextEditingController();
  final TextEditingController _fatherNameController = TextEditingController();
  final TextEditingController _villageController = TextEditingController();
  final TextEditingController _mandalController = TextEditingController();
  final TextEditingController _mobileNoController = TextEditingController();
  final TextEditingController _altMobileNoController = TextEditingController();

  bool _isLoading = false;
  final List<Map<String, String>> _recentlyAdded = [];

  Future<void> _submitData() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final token = await ApiService.getToken();
      final url = Uri.parse('${ApiService.baseUrl}/api/address-collection');

      final newStudentName = _studentNameController.text.trim();
      final newVillage = _villageController.text.trim();
      final newMobile = _mobileNoController.text.trim();

      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({
          'studentName': newStudentName,
          'fatherName': _fatherNameController.text.trim(),
          'village': newVillage,
          'mandal': _mandalController.text.trim(),
          'mobileNo': newMobile,
          'alternateMobileNo': _altMobileNoController.text.trim(),
        }),
      );

      if (response.statusCode == 201) {
        setState(() {
          _recentlyAdded.insert(0, {
            'name': newStudentName,
            'village': newVillage,
            'mobile': newMobile,
          });
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Address Details Saved Successfully!'),
            backgroundColor: Colors.green,
            behavior: SnackBarBehavior.floating,
          ),
        );
        _formKey.currentState!.reset();
        _studentNameController.clear();
        _fatherNameController.clear();
        _villageController.clear();
        _mandalController.clear();
        _mobileNoController.clear();
        _altMobileNoController.clear();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to save details. Try again.'),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Network Error: $e'),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
        ),
      );
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    bool isRequired = true,
    TextInputType keyboardType = TextInputType.text,
    List<TextInputFormatter>? inputFormatters,
    int? maxLength,
  }) {
    return Container(
      margin: EdgeInsets.only(bottom: 16),
      child: TextFormField(
        controller: controller,
        keyboardType: keyboardType,
        inputFormatters: inputFormatters,
        maxLength: maxLength,
        style: GoogleFonts.outfit(
          fontSize: 15,
          fontWeight: FontWeight.w500,
          color: Colors.black87,
        ),
        decoration: InputDecoration(
          counterText: "",
          labelText: label + (isRequired ? ' *' : ' (Optional)'),
          labelStyle: GoogleFonts.outfit(
            color: Colors.grey.shade600,
            fontSize: 14,
          ),
          prefixIcon: Icon(icon, color: const Color(0xFF4B497B), size: 22),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: Colors.grey.shade300),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: Colors.grey.shade300),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: Color(0xFF4B497B), width: 1.5),
          ),
          errorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: Colors.red.shade300, width: 1.5),
          ),
          filled: true,
          fillColor: Colors.grey.shade50,
          contentPadding: EdgeInsets.symmetric(vertical: 16, horizontal: 16),
        ),
        validator: isRequired
            ? (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Required';
                }
                if (keyboardType == TextInputType.phone && value.length < 10) {
                  return 'Enter valid 10-digit number';
                }
                return null;
              }
            : null,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA), // Premium light background
      appBar: AppBar(
        title: Text(
          'Address Collection',
          style: GoogleFonts.outfit(
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        backgroundColor: const Color(0xFF4B497B),
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
        centerTitle: true,
      ),
      body: SafeArea(
        bottom: true,
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Data Entry Card
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.04),
                      blurRadius: 20,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildTextField(
                        controller: _studentNameController,
                        label: 'Student Name',
                        icon: Icons.person_outline,
                      ),
                      _buildTextField(
                        controller: _fatherNameController,
                        label: 'Father Name',
                        icon: Icons.family_restroom,
                      ),
                      _buildTextField(
                        controller: _villageController,
                        label: 'Village',
                        icon: Icons.location_city,
                      ),
                      _buildTextField(
                        controller: _mandalController,
                        label: 'Mandal',
                        icon: Icons.map_outlined,
                      ),
                      _buildTextField(
                        controller: _mobileNoController,
                        label: 'Mobile Number',
                        icon: Icons.phone_android,
                        keyboardType: TextInputType.phone,
                        inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                        maxLength: 10,
                      ),
                      _buildTextField(
                        controller: _altMobileNoController,
                        label: 'Alternate Mobile',
                        icon: Icons.phone_iphone,
                        isRequired: false,
                        keyboardType: TextInputType.phone,
                        inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                        maxLength: 10,
                      ),
                      
                      const SizedBox(height: 16),
                      
                      SizedBox(
                        width: double.infinity,
                        height: 54,
                        child: ElevatedButton(
                          onPressed: _isLoading ? null : _submitData,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF4B497B),
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            elevation: 2,
                          ),
                          child: _isLoading
                              ? const SizedBox(
                                  height: 24,
                                  width: 24,
                                  child: CircularProgressIndicator(
                                    color: Colors.white,
                                    strokeWidth: 2.5,
                                  ),
                                )
                              : Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    const Icon(Icons.check_circle_outline, size: 22),
                                    const SizedBox(width: 8),
                                    Text(
                                      'Save Details',
                                      style: GoogleFonts.outfit(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              
              const SizedBox(height: 28),
              
              // Recently Added Section
              if (_recentlyAdded.isNotEmpty) ...[
                Text(
                  'Recently Added Students',
                  style: GoogleFonts.outfit(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF4B497B),
                  ),
                ),
                const SizedBox(height: 12),
                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _recentlyAdded.length,
                  separatorBuilder: (context, index) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final student = _recentlyAdded[index];
                    return Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.indigo.withOpacity(0.1)),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.02),
                            blurRadius: 10,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: ListTile(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                        leading: CircleAvatar(
                          backgroundColor: const Color(0xFF4B497B).withOpacity(0.1),
                          child: const Icon(Icons.person, color: Color(0xFF4B497B)),
                        ),
                        title: Text(
                          student['name']!,
                          style: GoogleFonts.outfit(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                            color: Colors.black87,
                          ),
                        ),
                        subtitle: Padding(
                          padding: const EdgeInsets.only(top: 4.0),
                          child: Row(
                            children: [
                              Icon(Icons.location_on, size: 14, color: Colors.grey.shade600),
                              const SizedBox(width: 4),
                              Text(
                                student['village']!,
                                style: GoogleFonts.outfit(
                                  color: Colors.grey.shade600,
                                  fontSize: 13,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Icon(Icons.phone, size: 14, color: Colors.grey.shade600),
                              const SizedBox(width: 4),
                              Text(
                                student['mobile']!,
                                style: GoogleFonts.outfit(
                                  color: Colors.grey.shade600,
                                  fontSize: 13,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
