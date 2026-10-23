import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:intl/intl.dart';
import '../services/api_service.dart';

class StudentAddressCollectionScreen extends StatefulWidget {
  const StudentAddressCollectionScreen({Key? key}) : super(key: key);

  @override
  _StudentAddressCollectionScreenState createState() =>
      _StudentAddressCollectionScreenState();
}

class _StudentAddressCollectionScreenState
    extends State<StudentAddressCollectionScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  final _formKey = GlobalKey<FormState>();
  final TextEditingController _studentNameController = TextEditingController();
  final TextEditingController _fatherNameController = TextEditingController();
  final TextEditingController _villageController = TextEditingController();
  final TextEditingController _mandalController = TextEditingController();
  final TextEditingController _mobileNoController = TextEditingController();
  final TextEditingController _altMobileNoController = TextEditingController();
  final TextEditingController _searchController = TextEditingController();

  bool _isLoading = false;
  bool _isFetchingList = false;
  List<Map<String, dynamic>> _collectedList = [];
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _fetchCollectedAddresses();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _studentNameController.dispose();
    _fatherNameController.dispose();
    _villageController.dispose();
    _mandalController.dispose();
    _mobileNoController.dispose();
    _altMobileNoController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _fetchCollectedAddresses() async {
    setState(() {
      _isFetchingList = true;
    });

    try {
      final token = await ApiService.getToken();
      final url = Uri.parse('${ApiService.baseUrl}/api/address-collection');

      final response = await http.get(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final decoded = json.decode(response.body);
        if (decoded['success'] == true && decoded['data'] is List) {
          setState(() {
            _collectedList = List<Map<String, dynamic>>.from(decoded['data']);
          });
        }
      }
    } catch (e) {
      debugPrint('Error fetching address collections: $e');
    } finally {
      if (mounted) {
        setState(() {
          _isFetchingList = false;
        });
      }
    }
  }

  Future<void> _submitData() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final token = await ApiService.getToken();
      final url = Uri.parse('${ApiService.baseUrl}/api/address-collection');

      final newStudentName = _studentNameController.text.trim().toUpperCase();
      final newFatherName = _fatherNameController.text.trim().toUpperCase();
      final newVillage = _villageController.text.trim().toUpperCase();
      final newMandal = _mandalController.text.trim().toUpperCase();
      final newMobile = _mobileNoController.text.trim();
      final newAltMobile = _altMobileNoController.text.trim();

      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({
          'studentName': newStudentName,
          'fatherName': newFatherName,
          'village': newVillage,
          'mandal': newMandal,
          'mobileNo': newMobile,
          'alternateMobileNo': newAltMobile,
        }),
      );

      if (response.statusCode == 201) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: const [
                Icon(Icons.check_circle, color: Colors.white),
                SizedBox(width: 8),
                Expanded(child: Text('చిరునామా వివరాలు సేవ్ అయ్యాయి! (Address Saved)')),
              ],
            ),
            backgroundColor: Colors.green.shade700,
            behavior: SnackBarBehavior.floating,
            duration: const Duration(seconds: 3),
          ),
        );

        _formKey.currentState!.reset();
        _studentNameController.clear();
        _fatherNameController.clear();
        _villageController.clear();
        _mandalController.clear();
        _mobileNoController.clear();
        _altMobileNoController.clear();

        // Refresh list immediately
        await _fetchCollectedAddresses();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Failed to save details. Try again.'),
            backgroundColor: Colors.red.shade700,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Network Error: $e'),
          backgroundColor: Colors.red.shade700,
          behavior: SnackBarBehavior.floating,
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _deleteAddress(String id, String studentName) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(
          'Delete Address Entry?',
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold),
        ),
        content: Text(
          'మీరు ఖచ్చితంగా "$studentName" చిరునామాను తొలగించాలనుకుంటున్నారా?',
          style: GoogleFonts.outfit(),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(
              'Cancel',
              style: GoogleFonts.outfit(color: Colors.grey.shade600, fontWeight: FontWeight.bold),
            ),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red.shade600,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: Text(
              'Delete',
              style: GoogleFonts.outfit(fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      final token = await ApiService.getToken();
      final url = Uri.parse('${ApiService.baseUrl}/api/address-collection/$id');

      final response = await http.delete(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        setState(() {
          _collectedList.removeWhere((item) => item['id'] == id);
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Record deleted successfully'),
            backgroundColor: Colors.black87,
            behavior: SnackBarBehavior.floating,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Failed to delete entry'),
            backgroundColor: Colors.red.shade700,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: $e'),
          backgroundColor: Colors.red.shade700,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  void _copyToClipboard(String text, String label) {
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$label copied: $text'),
        backgroundColor: const Color(0xFF4B497B),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return '-';
    try {
      final dt = DateTime.parse(dateStr).toLocal();
      return DateFormat('dd MMM yyyy, hh:mm a').format(dt);
    } catch (_) {
      return dateStr;
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
    TextCapitalization textCapitalization = TextCapitalization.characters,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: TextFormField(
        controller: controller,
        keyboardType: keyboardType,
        inputFormatters: inputFormatters,
        maxLength: maxLength,
        textCapitalization: textCapitalization,
        style: GoogleFonts.outfit(
          fontSize: 15,
          fontWeight: FontWeight.w600,
          color: Colors.black87,
        ),
        decoration: InputDecoration(
          counterText: "",
          labelText: label + (isRequired ? ' *' : ' (Optional)'),
          labelStyle: GoogleFonts.outfit(
            color: Colors.grey.shade600,
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
          prefixIcon: Icon(icon, color: const Color(0xFF4B497B), size: 22),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: BorderSide(color: Colors.grey.shade300),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: BorderSide(color: Colors.grey.shade300),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: Color(0xFF4B497B), width: 1.8),
          ),
          errorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: BorderSide(color: Colors.red.shade300, width: 1.5),
          ),
          filled: true,
          fillColor: Colors.grey.shade50,
          contentPadding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
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
      backgroundColor: const Color(0xFFF6F8FB),
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
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.amberAccent,
          indicatorWeight: 3.5,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          labelStyle: GoogleFonts.outfit(
            fontWeight: FontWeight.bold,
            fontSize: 13.5,
          ),
          unselectedLabelStyle: GoogleFonts.outfit(
            fontWeight: FontWeight.w600,
            fontSize: 13.5,
          ),
          tabs: [
            const Tab(
              icon: Icon(Icons.add_circle_outline, size: 20),
              text: 'New Entry',
            ),
            Tab(
              icon: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.list_alt, size: 20),
                  if (_collectedList.isNotEmpty) ...[
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                      decoration: BoxDecoration(
                        color: Colors.amberAccent,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        '${_collectedList.length}',
                        style: const TextStyle(
                          color: Colors.black87,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
              text: 'My Submissions',
            ),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // ── TAB 1: NEW ENTRY FORM ──
          _buildEntryTab(),

          // ── TAB 2: MY SUBMISSIONS LIST ──
          _buildSubmissionsTab(),
        ],
      ),
    );
  }

  // ══════════════════════════════════════════════════════
  // TAB 1: ENTRY FORM
  // ══════════════════════════════════════════════════════
  Widget _buildEntryTab() {
    return SafeArea(
      bottom: true,
      child: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              padding: const EdgeInsets.all(22),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.04),
                    blurRadius: 16,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: const Color(0xFF4B497B).withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(Icons.edit_note, color: Color(0xFF4B497B), size: 24),
                        ),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Student Address Form',
                              style: GoogleFonts.outfit(
                                fontSize: 17,
                                fontWeight: FontWeight.bold,
                                color: const Color(0xFF4B497B),
                              ),
                            ),
                            Text(
                              'సర్వే కోసం వివరాలను నమోదు చేయండి',
                              style: GoogleFonts.outfit(
                                fontSize: 12,
                                color: Colors.grey.shade600,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    _buildTextField(
                      controller: _studentNameController,
                      label: 'Student Name',
                      icon: Icons.person_outline,
                    ),
                    _buildTextField(
                      controller: _fatherNameController,
                      label: 'Father Name',
                      icon: Icons.family_restroom_outlined,
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
                      textCapitalization: TextCapitalization.none,
                    ),
                    _buildTextField(
                      controller: _altMobileNoController,
                      label: 'Alternate Mobile',
                      icon: Icons.phone_iphone,
                      isRequired: false,
                      keyboardType: TextInputType.phone,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      maxLength: 10,
                      textCapitalization: TextCapitalization.none,
                    ),

                    const SizedBox(height: 12),

                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _submitData,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF4B497B),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                          elevation: 2,
                        ),
                        child: _isLoading
                            ? const SizedBox(
                                height: 22,
                                width: 22,
                                child: CircularProgressIndicator(
                                  color: Colors.white,
                                  strokeWidth: 2.5,
                                ),
                              )
                            : Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Icon(Icons.check_circle_outline, size: 20),
                                  const SizedBox(width: 8),
                                  Text(
                                    'Save Details (సేవ్ చేయండి)',
                                    style: GoogleFonts.outfit(
                                      fontSize: 15,
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
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  // ══════════════════════════════════════════════════════
  // TAB 2: MY SUBMISSIONS LIST
  // ══════════════════════════════════════════════════════
  Widget _buildSubmissionsTab() {
    final filtered = _collectedList.where((item) {
      if (_searchQuery.isEmpty) return true;
      final q = _searchQuery.toLowerCase();
      final name = (item['studentName'] ?? '').toString().toLowerCase();
      final father = (item['fatherName'] ?? '').toString().toLowerCase();
      final village = (item['village'] ?? '').toString().toLowerCase();
      final mandal = (item['mandal'] ?? '').toString().toLowerCase();
      final mobile = (item['mobileNo'] ?? '').toString();
      final altMobile = (item['alternateMobileNo'] ?? '').toString();
      return name.contains(q) ||
          father.contains(q) ||
          village.contains(q) ||
          mandal.contains(q) ||
          mobile.contains(q) ||
          altMobile.contains(q);
    }).toList();

    return SafeArea(
      bottom: true,
      child: Column(
        children: [
          // Search Bar
          Container(
            margin: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.03),
                  blurRadius: 10,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: TextField(
              controller: _searchController,
              onChanged: (val) {
                setState(() {
                  _searchQuery = val.trim();
                });
              },
              style: GoogleFonts.outfit(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Colors.black87,
              ),
              decoration: InputDecoration(
                hintText: 'Search by student, village, or mobile...',
                hintStyle: GoogleFonts.outfit(
                  color: Colors.grey.shade400,
                  fontSize: 13,
                ),
                prefixIcon: const Icon(Icons.search, color: Color(0xFF4B497B), size: 20),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, size: 18),
                        onPressed: () {
                          _searchController.clear();
                          setState(() {
                            _searchQuery = '';
                          });
                        },
                      )
                    : null,
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(vertical: 14),
              ),
            ),
          ),

          // Total Stats Count Bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'My Submissions (${filtered.length})',
                  style: GoogleFonts.outfit(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF4B497B),
                  ),
                ),
                InkWell(
                  onTap: _fetchCollectedAddresses,
                  borderRadius: BorderRadius.circular(8),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                    child: Row(
                      children: [
                        Icon(Icons.refresh, size: 15, color: Colors.indigo.shade600),
                        const SizedBox(width: 4),
                        Text(
                          'Refresh',
                          style: GoogleFonts.outfit(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: Colors.indigo.shade600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Content
          Expanded(
            child: _isFetchingList
                ? const Center(
                    child: CircularProgressIndicator(
                      color: Color(0xFF4B497B),
                    ),
                  )
                : RefreshIndicator(
                    onRefresh: _fetchCollectedAddresses,
                    color: const Color(0xFF4B497B),
                    child: filtered.isEmpty
                        ? ListView(
                            physics: const AlwaysScrollableScrollPhysics(),
                            children: [
                              SizedBox(height: MediaQuery.of(context).size.height * 0.15),
                              Icon(
                                Icons.location_off_outlined,
                                size: 64,
                                color: Colors.grey.shade300,
                              ),
                              const SizedBox(height: 12),
                              Center(
                                child: Text(
                                  _searchQuery.isNotEmpty
                                      ? 'No matching addresses found'
                                      : 'No addresses collected yet',
                                  style: GoogleFonts.outfit(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.grey.shade700,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 6),
                              Center(
                                child: Text(
                                  _searchQuery.isNotEmpty
                                      ? 'Try searching with different keywords'
                                      : 'మీరు ఇంకా ఎలాంటి చిరునామాలు ఎంటర్ చేయలేదు.',
                                  style: GoogleFonts.outfit(
                                    fontSize: 12,
                                    color: Colors.grey.shade500,
                                  ),
                                ),
                              ),
                              if (_searchQuery.isEmpty) ...[
                                const SizedBox(height: 16),
                                Center(
                                  child: ElevatedButton.icon(
                                    onPressed: () {
                                      _tabController.animateTo(0);
                                    },
                                    icon: const Icon(Icons.add, size: 18),
                                    label: const Text('Add New Address'),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFF4B497B),
                                      foregroundColor: Colors.white,
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          )
                        : ListView.separated(
                            physics: const AlwaysScrollableScrollPhysics(
                              parent: BouncingScrollPhysics(),
                            ),
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            itemCount: filtered.length,
                            separatorBuilder: (context, index) => const SizedBox(height: 12),
                            itemBuilder: (context, index) {
                              final item = filtered[index];
                              final id = item['id'] ?? '';
                              final studentName = item['studentName'] ?? 'Unknown';
                              final fatherName = item['fatherName'] ?? '-';
                              final village = item['village'] ?? '-';
                              final mandal = item['mandal'] ?? '-';
                              final mobile = item['mobileNo'] ?? '';
                              final altMobile = item['alternateMobileNo'] ?? '';
                              final dateStr = item['createdAt'];

                              return Container(
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(
                                    color: const Color(0xFF4B497B).withOpacity(0.08),
                                  ),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withOpacity(0.03),
                                      blurRadius: 10,
                                      offset: const Offset(0, 2),
                                    ),
                                  ],
                                ),
                                child: Padding(
                                  padding: const EdgeInsets.all(16),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      // Header: Student Name + Index + Delete Button
                                      Row(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Container(
                                            width: 38,
                                            height: 38,
                                            decoration: BoxDecoration(
                                              color: const Color(0xFF4B497B).withOpacity(0.1),
                                              borderRadius: BorderRadius.circular(12),
                                            ),
                                            child: Center(
                                              child: Text(
                                                '${index + 1}',
                                                style: GoogleFonts.outfit(
                                                  fontWeight: FontWeight.bold,
                                                  color: const Color(0xFF4B497B),
                                                  fontSize: 14,
                                                ),
                                              ),
                                            ),
                                          ),
                                          const SizedBox(width: 12),
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  studentName,
                                                  style: GoogleFonts.outfit(
                                                    fontWeight: FontWeight.bold,
                                                    fontSize: 16,
                                                    color: Colors.black87,
                                                  ),
                                                ),
                                                const SizedBox(height: 2),
                                                Text(
                                                  'Father: $fatherName',
                                                  style: GoogleFonts.outfit(
                                                    fontSize: 13,
                                                    fontWeight: FontWeight.w500,
                                                    color: Colors.grey.shade600,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                          IconButton(
                                            icon: const Icon(Icons.delete_outline, color: Colors.redAccent, size: 20),
                                            onPressed: () => _deleteAddress(id, studentName),
                                            tooltip: 'Delete',
                                          ),
                                        ],
                                      ),

                                      const SizedBox(height: 12),
                                      const Divider(height: 1, color: Color(0xFFEEEEEE)),
                                      const SizedBox(height: 12),

                                      // Location Badge (Village & Mandal)
                                      Row(
                                        children: [
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                            decoration: BoxDecoration(
                                              color: Colors.indigo.shade50,
                                              borderRadius: BorderRadius.circular(8),
                                              border: Border.all(color: Colors.indigo.shade100),
                                            ),
                                            child: Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                Icon(Icons.location_on, size: 14, color: Colors.indigo.shade700),
                                                const SizedBox(width: 4),
                                                Text(
                                                  '$village, $mandal',
                                                  style: GoogleFonts.outfit(
                                                    fontSize: 12,
                                                    fontWeight: FontWeight.bold,
                                                    color: Colors.indigo.shade800,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                          const Spacer(),
                                          // Date
                                          Text(
                                            _formatDate(dateStr),
                                            style: GoogleFonts.outfit(
                                              fontSize: 11,
                                              color: Colors.grey.shade500,
                                              fontWeight: FontWeight.w500,
                                            ),
                                          ),
                                        ],
                                      ),

                                      const SizedBox(height: 10),

                                      // Mobile Numbers with Copy Button
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                        decoration: BoxDecoration(
                                          color: Colors.grey.shade50,
                                          borderRadius: BorderRadius.circular(10),
                                          border: Border.all(color: Colors.grey.shade200),
                                        ),
                                        child: Row(
                                          children: [
                                            const Icon(Icons.phone, size: 16, color: Color(0xFF4B497B)),
                                            const SizedBox(width: 8),
                                            Text(
                                              mobile,
                                              style: GoogleFonts.outfit(
                                                fontSize: 13,
                                                fontWeight: FontWeight.bold,
                                                color: const Color(0xFF4B497B),
                                              ),
                                            ),
                                            if (altMobile.isNotEmpty) ...[
                                              const SizedBox(width: 8),
                                              Text(
                                                '/ $altMobile',
                                                style: GoogleFonts.outfit(
                                                  fontSize: 12,
                                                  color: Colors.grey.shade600,
                                                ),
                                              ),
                                            ],
                                            const Spacer(),
                                            InkWell(
                                              onTap: () => _copyToClipboard(mobile, 'Mobile number'),
                                              borderRadius: BorderRadius.circular(6),
                                              child: Padding(
                                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                child: Row(
                                                  children: [
                                                    Icon(Icons.copy, size: 13, color: Colors.grey.shade600),
                                                    const SizedBox(width: 3),
                                                    Text(
                                                      'Copy',
                                                      style: GoogleFonts.outfit(
                                                        fontSize: 11,
                                                        color: Colors.grey.shade600,
                                                        fontWeight: FontWeight.w600,
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                  ),
          ),
        ],
      ),
    );
  }
}
