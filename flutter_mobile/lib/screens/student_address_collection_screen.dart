import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:share_plus/share_plus.dart';
import 'dart:convert';
import '../services/api_service.dart';

class StudentAddressCollectionScreen extends StatefulWidget {
  const StudentAddressCollectionScreen({super.key});

  @override
  State<StudentAddressCollectionScreen> createState() =>
      _StudentAddressCollectionScreenState();
}

class _StudentAddressCollectionScreenState
    extends State<StudentAddressCollectionScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  // Role info
  String _userRole = '';
  bool _isAdmin = false;

  // Form Controllers
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _studentNameController = TextEditingController();
  final TextEditingController _fatherNameController = TextEditingController();
  final TextEditingController _villageController = TextEditingController();
  final TextEditingController _mandalController = TextEditingController();
  final TextEditingController _mobileNoController = TextEditingController();
  final TextEditingController _altMobileNoController = TextEditingController();
  String? _selectedTeacherId;

  // Data lists & loading states
  bool _submitLoading = false;
  bool _dataLoading = true;
  List<dynamic> _addressList = [];
  List<dynamic> _teachersList = [];

  // Filter & Search
  String _searchQuery = '';
  String _selectedTeacherFilter = 'ALL';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _initRoleAndData();
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
    super.dispose();
  }

  Future<void> _initRoleAndData() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userStr = prefs.getString('user');
      if (userStr != null) {
        final userMap = jsonDecode(userStr);
        _userRole = userMap['role'] ?? '';
        _isAdmin = _userRole == 'SUPER_ADMIN' ||
            _userRole == 'ADMIN' ||
            _userRole == 'PRINCIPAL';
      }
      await Future.wait([
        _fetchAddressData(),
        _fetchTeachers(),
      ]);
    } catch (e) {
      debugPrint('Error init role: $e');
    }
  }

  Future<void> _fetchAddressData() async {
    setState(() => _dataLoading = true);
    try {
      final token = await ApiService.getToken();
      final url = Uri.parse('${ApiService.baseUrl}/api/address-collection');
      final res = await http.get(url, headers: {
        'Authorization': 'Bearer $token',
      });
      if (res.statusCode == 200) {
        final body = json.decode(res.body);
        if (body['success'] == true && body['data'] is List) {
          setState(() {
            _addressList = body['data'];
            _dataLoading = false;
          });
          return;
        }
      }
    } catch (e) {
      debugPrint('Error fetching address data: $e');
    }
    setState(() => _dataLoading = false);
  }

  Future<void> _fetchTeachers() async {
    try {
      final token = await ApiService.getToken();
      final url = Uri.parse('${ApiService.baseUrl}/api/teachers');
      final res = await http.get(url, headers: {
        'Authorization': 'Bearer $token',
      });
      if (res.statusCode == 200) {
        final body = json.decode(res.body);
        if (body['success'] == true && body['data'] is List) {
          setState(() {
            _teachersList = body['data'];
          });
        }
      }
    } catch (e) {
      debugPrint('Error fetching teachers: $e');
    }
  }

  Future<void> _submitData() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _submitLoading = true);

    try {
      final token = await ApiService.getToken();
      final url = Uri.parse('${ApiService.baseUrl}/api/address-collection');

      final payload = {
        'studentName': _studentNameController.text.trim().toUpperCase(),
        'fatherName': _fatherNameController.text.trim().toUpperCase(),
        'village': _villageController.text.trim().toUpperCase(),
        'mandal': _mandalController.text.trim().toUpperCase(),
        'mobileNo': _mobileNoController.text.trim(),
        'alternateMobileNo': _altMobileNoController.text.trim(),
      };

      if (_selectedTeacherId != null && _selectedTeacherId!.isNotEmpty) {
        payload['referenceTeacherId'] = _selectedTeacherId!;
      }

      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode(payload),
      );

      final resBody = json.decode(response.body);

      if (response.statusCode == 200 || response.statusCode == 201 || resBody['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Address Details Saved Successfully!'),
            backgroundColor: Color(0xFF10B981),
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
        setState(() {
          _selectedTeacherId = null;
        });
        _fetchAddressData();
        _tabController.animateTo(0); // Switch to data list tab
      } else {
        final errMsg = resBody['error'] ?? resBody['message'] ?? 'Failed to save details';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(errMsg),
            backgroundColor: const Color(0xFFEF4444),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: $e'),
          backgroundColor: const Color(0xFFEF4444),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } finally {
      setState(() => _submitLoading = false);
    }
  }

  Future<void> _deleteRecord(String id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('Delete Record', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        content: Text('Are you sure you want to delete this address record?',
            style: GoogleFonts.poppins(fontSize: 13, color: const Color(0xFF64748B))),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text('Cancel', style: GoogleFonts.poppins(color: const Color(0xFF64748B))),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFEF4444),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    try {
      final token = await ApiService.getToken();
      final url = Uri.parse('${ApiService.baseUrl}/api/address-collection/$id');
      final res = await http.delete(url, headers: {
        'Authorization': 'Bearer $token',
      });
      if (res.statusCode == 200) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Record deleted successfully'),
            backgroundColor: Color(0xFF10B981),
            behavior: SnackBarBehavior.floating,
          ),
        );
        _fetchAddressData();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to delete record'), backgroundColor: Colors.red),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _exportData() async {
    final filtered = _getFilteredList();
    if (filtered.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No records to export')),
      );
      return;
    }

    final StringBuffer csv = StringBuffer();
    csv.writeln('S.No,Student Name,Father Name,Village,Mandal,Mobile No,Alternate Mobile,Reference Teacher');
    for (int i = 0; i < filtered.length; i++) {
      final item = filtered[i];
      csv.writeln(
          '${i + 1},"${item['studentName'] ?? '-'}","${item['fatherName'] ?? '-'}","${item['village'] ?? '-'}","${item['mandal'] ?? '-'}","${item['mobileNo'] ?? '-'}","${item['alternateMobileNo'] ?? '-'}","${item['referenceTeacherName'] ?? '-'}"');
    }

    await Share.share(
      csv.toString(),
      subject: 'Student Address Collection Report',
    );
  }

  Future<void> _makeCall(String phone) async {
    final clean = phone.replaceAll(RegExp(r'\D'), '');
    if (clean.isEmpty) return;
    final uri = Uri.parse('tel:$clean');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  Future<void> _openWhatsApp(String phone) async {
    final clean = phone.replaceAll(RegExp(r'\D'), '');
    if (clean.isEmpty) return;
    final uri = Uri.parse('https://wa.me/91$clean');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  List<dynamic> _getFilteredList() {
    return _addressList.where((item) {
      final q = _searchQuery.toLowerCase();
      final name = (item['studentName'] ?? '').toString().toLowerCase();
      final father = (item['fatherName'] ?? '').toString().toLowerCase();
      final village = (item['village'] ?? '').toString().toLowerCase();
      final mandal = (item['mandal'] ?? '').toString().toLowerCase();
      final mobile = (item['mobileNo'] ?? '').toString();

      final matchesSearch = q.isEmpty ||
          name.contains(q) ||
          father.contains(q) ||
          village.contains(q) ||
          mandal.contains(q) ||
          mobile.contains(q);

      final teacherName = (item['referenceTeacherName'] ?? '').toString();
      final matchesTeacher =
          _selectedTeacherFilter == 'ALL' || teacherName == _selectedTeacherFilter;

      return matchesSearch && matchesTeacher;
    }).toList();
  }

  List<String> _getUniqueTeachers() {
    final Set<String> teachers = {};
    for (var item in _addressList) {
      final t = item['referenceTeacherName']?.toString();
      if (t != null && t.trim().isNotEmpty) {
        teachers.add(t);
      }
    }
    final list = teachers.toList();
    list.sort();
    return list;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9), // Modern ERP light background
      appBar: AppBar(
        title: Text(
          'Address Collection',
          style: GoogleFonts.outfit(
            fontWeight: FontWeight.bold,
            color: Colors.white,
            fontSize: 18,
          ),
        ),
        backgroundColor: Colors.transparent,
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF2E2A66), Color(0xFF4F46E5)], // Signature JY Purple
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
        elevation: 0,
        centerTitle: true,
        iconTheme: const IconThemeData(color: Colors.white),
        actions: [
          IconButton(
            icon: const Icon(Icons.share_rounded, color: Colors.white),
            tooltip: 'Export / Share CSV',
            onPressed: _exportData,
          ),
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: Colors.white),
            tooltip: 'Refresh Data',
            onPressed: () {
              _fetchAddressData();
              _fetchTeachers();
            },
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.amberAccent,
          indicatorWeight: 3,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          labelStyle: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 13),
          tabs: const [
            Tab(icon: Icon(Icons.list_alt_rounded, size: 20), text: 'Collected Data'),
            Tab(icon: Icon(Icons.add_circle_outline_rounded, size: 20), text: 'Add Entry'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildDataListTab(),
          _buildFormTab(),
        ],
      ),
    );
  }

  Widget _buildDataListTab() {
    final filtered = _getFilteredList();
    final uniqueTeachers = _getUniqueTeachers();

    return Column(
      children: [
        // Top Filter Bar
        Container(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 12),
          decoration: BoxDecoration(
            color: Colors.white,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 8,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Column(
            children: [
              // Search input
              Container(
                height: 44,
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: TextField(
                  style: GoogleFonts.poppins(fontSize: 13, color: const Color(0xFF1E293B)),
                  decoration: InputDecoration(
                    hintText: 'Search by student, village, mandal, or mobile...',
                    hintStyle: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF94A3B8)),
                    prefixIcon: const Icon(Icons.search_rounded, size: 18, color: Color(0xFF94A3B8)),
                    suffixIcon: _searchQuery.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear, size: 16),
                            onPressed: () => setState(() => _searchQuery = ''),
                          )
                        : null,
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  onChanged: (val) => setState(() => _searchQuery = val),
                ),
              ),
              const SizedBox(height: 10),
              // Filter by Teacher & Count
              Row(
                children: [
                  Expanded(
                    child: Container(
                      height: 38,
                      padding: const EdgeInsets.symmetric(horizontal: 10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: _selectedTeacherFilter,
                          isExpanded: true,
                          icon: const Icon(Icons.arrow_drop_down, color: Color(0xFF64748B)),
                          style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF1E293B)),
                          items: [
                            const DropdownMenuItem(value: 'ALL', child: Text('All Teachers')),
                            ...uniqueTeachers.map((t) => DropdownMenuItem(value: t, child: Text(t))),
                          ],
                          onChanged: (val) {
                            if (val != null) {
                              setState(() => _selectedTeacherFilter = val);
                            }
                          },
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  // Count badge
                  Container(
                    height: 38,
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    decoration: BoxDecoration(
                      color: const Color(0xFF4F46E5).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFF4F46E5).withOpacity(0.2)),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      '${filtered.length} Records',
                      style: GoogleFonts.outfit(
                        color: const Color(0xFF4F46E5),
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),

        // List
        Expanded(
          child: _dataLoading
              ? const Center(child: CircularProgressIndicator(color: Color(0xFF4F46E5)))
              : filtered.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.contact_phone_outlined, size: 64, color: Colors.grey.shade400),
                          const SizedBox(height: 12),
                          Text(
                            _searchQuery.isNotEmpty ? 'No matching records found' : 'No addresses collected yet',
                            style: GoogleFonts.poppins(color: Colors.grey.shade600, fontSize: 14),
                          ),
                          const SizedBox(height: 12),
                          ElevatedButton.icon(
                            onPressed: () => _tabController.animateTo(1),
                            icon: const Icon(Icons.add_rounded),
                            label: const Text('Add First Entry'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF4F46E5),
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                          ),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _fetchAddressData,
                      color: const Color(0xFF4F46E5),
                      child: ListView.separated(
                        physics: const AlwaysScrollableScrollPhysics(),
                        padding: const EdgeInsets.fromLTRB(16, 14, 16, 24),
                        itemCount: filtered.length,
                        separatorBuilder: (ctx, i) => const SizedBox(height: 12),
                        itemBuilder: (ctx, i) => _buildAddressCard(filtered[i], i + 1),
                      ),
                    ),
        ),
      ],
    );
  }

  Widget _buildAddressCard(dynamic item, int index) {
    final String id = item['id']?.toString() ?? '';
    final String studentName = item['studentName']?.toString().trim() ?? '';
    final String fatherName = item['fatherName']?.toString().trim() ?? '';
    final String village = item['village']?.toString().trim() ?? '';
    final String mandal = item['mandal']?.toString().trim() ?? '';
    final String mobile = item['mobileNo']?.toString().trim() ?? '';
    final String altMobile = item['alternateMobileNo']?.toString().trim() ?? '';
    final String teacherName = item['referenceTeacherName']?.toString().trim() ?? '';

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top row: S.No + Name + Delete (if Admin)
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // S.No Badge
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: const Color(0xFF4F46E5).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    '$index',
                    style: GoogleFonts.outfit(
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                      color: const Color(0xFF4F46E5),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                // Name & Father
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        studentName.isNotEmpty ? studentName : 'Unnamed Student',
                        style: GoogleFonts.outfit(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF1E293B),
                        ),
                      ),
                      if (fatherName.isNotEmpty) ...[
                        const SizedBox(height: 2),
                        Row(
                          children: [
                            const Icon(Icons.family_restroom, size: 14, color: Color(0xFF64748B)),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                'S/O: $fatherName',
                                style: GoogleFonts.poppins(
                                  fontSize: 12,
                                  color: const Color(0xFF64748B),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
                // Delete button (Admin only)
                if (_isAdmin && id.isNotEmpty)
                  IconButton(
                    icon: const Icon(Icons.delete_outline_rounded, color: Color(0xFFEF4444), size: 20),
                    onPressed: () => _deleteRecord(id),
                    tooltip: 'Delete',
                    visualDensity: VisualDensity.compact,
                  ),
              ],
            ),

            const SizedBox(height: 12),
            const Divider(height: 1, color: Color(0xFFF1F5F9)),
            const SizedBox(height: 12),

            // Tags row: Village, Mandal, Reference Teacher
            Wrap(
              spacing: 8,
              runSpacing: 6,
              children: [
                if (village.isNotEmpty)
                  _buildTag(Icons.location_on_rounded, village, const Color(0xFF10B981)),
                if (mandal.isNotEmpty)
                  _buildTag(Icons.navigation_rounded, mandal, const Color(0xFF0EA5E9)),
                if (teacherName.isNotEmpty)
                  _buildTag(Icons.person_pin_rounded, 'Ref: $teacherName', const Color(0xFF8B5CF6)),
              ],
            ),

            const SizedBox(height: 12),

            // Phone action row
            Row(
              children: [
                // Primary mobile
                Expanded(
                  child: InkWell(
                    onTap: () => _makeCall(mobile),
                    borderRadius: BorderRadius.circular(10),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.phone_rounded, size: 15, color: Color(0xFF4F46E5)),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              mobile,
                              style: GoogleFonts.outfit(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                color: const Color(0xFF1E293B),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                // WhatsApp Button
                InkWell(
                  onTap: () => _openWhatsApp(mobile),
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: const Color(0xFF25D366).withOpacity(0.12),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFF25D366).withOpacity(0.3)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.chat_bubble_rounded, size: 14, color: Color(0xFF25D366)),
                        const SizedBox(width: 4),
                        Text(
                          'WhatsApp',
                          style: GoogleFonts.poppins(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF15803D),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),

            // Alternate mobile if present
            if (altMobile.isNotEmpty) ...[
              const SizedBox(height: 8),
              InkWell(
                onTap: () => _makeCall(altMobile),
                child: Row(
                  children: [
                    const Icon(Icons.phone_iphone_rounded, size: 13, color: Color(0xFF94A3B8)),
                    const SizedBox(width: 4),
                    Text(
                      'Alt: $altMobile',
                      style: GoogleFonts.poppins(fontSize: 11, color: const Color(0xFF64748B)),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildTag(IconData icon, String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color),
          const SizedBox(width: 4),
          Text(
            text,
            style: GoogleFonts.poppins(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFormTab() {
    return SafeArea(
      bottom: true,
      child: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
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
                            color: const Color(0xFF4F46E5).withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(Icons.person_add_rounded, color: Color(0xFF4F46E5), size: 22),
                        ),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Student Address Entry',
                              style: GoogleFonts.outfit(
                                fontSize: 17,
                                fontWeight: FontWeight.bold,
                                color: const Color(0xFF1E293B),
                              ),
                            ),
                            Text(
                              'Only Mobile Number is required (*)',
                              style: GoogleFonts.poppins(fontSize: 11, color: const Color(0xFF64748B)),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // Student Name (Optional)
                    _buildField(
                      controller: _studentNameController,
                      label: 'Student Name',
                      icon: Icons.person_outline_rounded,
                      isRequired: false,
                    ),

                    // Father Name (Optional)
                    _buildField(
                      controller: _fatherNameController,
                      label: 'Father Name',
                      icon: Icons.family_restroom_rounded,
                      isRequired: false,
                    ),

                    // Village (Optional)
                    _buildField(
                      controller: _villageController,
                      label: 'Village',
                      icon: Icons.location_city_rounded,
                      isRequired: false,
                    ),

                    // Mandal (Optional)
                    _buildField(
                      controller: _mandalController,
                      label: 'Mandal',
                      icon: Icons.navigation_outlined,
                      isRequired: false,
                    ),

                    // Mobile Number * (MANDATORY)
                    _buildField(
                      controller: _mobileNoController,
                      label: 'Mobile Number',
                      icon: Icons.phone_android_rounded,
                      isRequired: true,
                      keyboardType: TextInputType.phone,
                      maxLength: 10,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    ),

                    // Alternate Mobile (Optional)
                    _buildField(
                      controller: _altMobileNoController,
                      label: 'Alternate Mobile',
                      icon: Icons.phone_iphone_rounded,
                      isRequired: false,
                      keyboardType: TextInputType.phone,
                      maxLength: 10,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    ),

                    // Reference Teacher Selector (for Admin)
                    if (_isAdmin && _teachersList.isNotEmpty) ...[
                      Text(
                        'Reference Teacher (Optional)',
                        style: GoogleFonts.poppins(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF475569),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: _selectedTeacherId,
                            hint: Text('Select Reference Teacher',
                                style: GoogleFonts.poppins(fontSize: 13, color: const Color(0xFF94A3B8))),
                            isExpanded: true,
                            items: [
                              const DropdownMenuItem(value: '', child: Text('-- None / Self --')),
                              ..._teachersList.map((t) {
                                final name = t['user']?['name'] ?? 'Unknown';
                                final id = t['id']?.toString() ?? '';
                                return DropdownMenuItem(value: id, child: Text(name));
                              }),
                            ],
                            onChanged: (val) {
                              setState(() => _selectedTeacherId = (val == null || val.isEmpty) ? null : val);
                            },
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),
                    ],

                    const SizedBox(height: 10),

                    // Submit Button with Safe Area
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton(
                        onPressed: _submitLoading ? null : _submitData,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF4F46E5),
                          foregroundColor: Colors.white,
                          elevation: 2,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                        child: _submitLoading
                            ? const SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                              )
                            : Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Icon(Icons.check_circle_rounded, size: 20),
                                  const SizedBox(width: 8),
                                  Text(
                                    'Save Address Details',
                                    style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.bold),
                                  ),
                                ],
                              ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    bool isRequired = false,
    TextInputType keyboardType = TextInputType.text,
    List<TextInputFormatter>? inputFormatters,
    int? maxLength,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                label,
                style: GoogleFonts.poppins(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFF475569),
                ),
              ),
              const SizedBox(width: 4),
              Text(
                isRequired ? '*' : '(Optional)',
                style: GoogleFonts.poppins(
                  fontSize: 11,
                  fontWeight: isRequired ? FontWeight.bold : FontWeight.normal,
                  color: isRequired ? const Color(0xFFEF4444) : const Color(0xFF94A3B8),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          TextFormField(
            controller: controller,
            keyboardType: keyboardType,
            inputFormatters: inputFormatters,
            maxLength: maxLength,
            textCapitalization: keyboardType == TextInputType.phone
                ? TextCapitalization.none
                : TextCapitalization.characters,
            style: GoogleFonts.outfit(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF1E293B),
            ),
            decoration: InputDecoration(
              counterText: '',
              hintText: 'Enter $label',
              hintStyle: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF94A3B8)),
              prefixIcon: Icon(icon, color: const Color(0xFF4F46E5), size: 20),
              filled: true,
              fillColor: const Color(0xFFF8FAFC),
              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: Color(0xFF4F46E5), width: 1.5),
              ),
              errorBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: Color(0xFFEF4444), width: 1.5),
              ),
            ),
            validator: isRequired
                ? (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Mobile Number is required';
                    }
                    if (value.trim().length < 10) {
                      return 'Enter valid 10-digit mobile number';
                    }
                    return null;
                  }
                : null,
          ),
        ],
      ),
    );
  }
}
