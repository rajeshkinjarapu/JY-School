import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../services/api_service.dart';
import '../services/admission_pdf_service.dart';
import 'admission_registration_screen.dart';

class AdmissionsListScreen extends StatefulWidget {
  const AdmissionsListScreen({super.key});

  @override
  State<AdmissionsListScreen> createState() => _AdmissionsListScreenState();
}

class _AdmissionsListScreenState extends State<AdmissionsListScreen> {
  List<dynamic> _admissions = [];
  bool _isLoading = true;
  String _searchQuery = '';
  String _selectedStatus = 'ALL';
  final _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchAdmissions();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _fetchAdmissions() async {
    setState(() => _isLoading = true);
    final res = await ApiService.getAdmissions();
    if (mounted) {
      setState(() {
        _isLoading = false;
        if (res['success'] == true && res['data'] != null) {
          _admissions = res['data'] is List ? res['data'] : [];
        } else {
          _admissions = [];
        }
      });
    }
  }

  Future<void> _updateStatus(String id, String newStatus) async {
    final res = await ApiService.updateAdmissionStatus(id, newStatus);
    if (res['success'] == true) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Status updated to $newStatus'), backgroundColor: const Color(0xFF10B981)),
      );
      _fetchAdmissions();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(res['message'] ?? 'Failed to update status'), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _deleteAdmission(String id, String studentName) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('Delete Admission?', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        content: Text('Are you sure you want to delete the admission application for "$studentName"?', style: GoogleFonts.outfit(fontSize: 14)),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      final res = await ApiService.deleteAdmission(id);
      if (res['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Application deleted'), backgroundColor: Color(0xFF10B981)),
        );
        _fetchAdmissions();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(res['message'] ?? 'Failed to delete'), backgroundColor: Colors.red),
        );
      }
    }
  }

  List<dynamic> get _filteredList {
    return _admissions.filter((item) {
      final query = _searchQuery.toLowerCase();
      final name = (item['studentName'] ?? '').toString().toLowerCase();
      final phone = (item['phone'] ?? '').toString();
      final aadhar = (item['aadharNo'] ?? '').toString();
      final father = (item['fatherName'] ?? '').toString().toLowerCase();

      final matchesSearch = query.isEmpty ||
          name.contains(query) ||
          phone.contains(query) ||
          aadhar.contains(query) ||
          father.contains(query);

      final matchesStatus = _selectedStatus == 'ALL' || item['status'] == _selectedStatus;

      return matchesSearch && matchesStatus;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final totalCount = _admissions.length;
    final pendingCount = _admissions.where((a) => a['status'] == 'PENDING').length;
    final enrolledCount = _admissions.where((a) => a['status'] == 'ENROLLED').length;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          'Admissions Management',
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.white),
        ),
        backgroundColor: const Color(0xFF4F46E5),
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _fetchAdmissions,
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: Column(
        children: [
          // Header Stats Bar
          Container(
            color: const Color(0xFF4F46E5),
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: Column(
              children: [
                // Quick KPI Row
                Row(
                  children: [
                    _buildKpiPill('Total', totalCount.toString(), Colors.white24, Colors.white),
                    const SizedBox(width: 8),
                    _buildKpiPill('Pending', pendingCount.toString(), const Color(0xFFFEF3C7).withOpacity(0.3), const Color(0xFFFDE68A)),
                    const SizedBox(width: 8),
                    _buildKpiPill('Enrolled', enrolledCount.toString(), const Color(0xFFD1FAE5).withOpacity(0.3), const Color(0xFFA7F3D0)),
                  ],
                ),
                const SizedBox(height: 12),

                // Search Bar
                TextField(
                  controller: _searchCtrl,
                  onChanged: (v) => setState(() => _searchQuery = v.trim()),
                  style: GoogleFonts.outfit(color: Colors.white, fontSize: 13),
                  decoration: InputDecoration(
                    hintText: 'Search student, parent, phone, Aadhar...',
                    hintStyle: GoogleFonts.outfit(color: Colors.white70, fontSize: 13),
                    prefixIcon: const Icon(Icons.search, color: Colors.white70, size: 20),
                    suffixIcon: _searchQuery.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear, color: Colors.white, size: 18),
                            onPressed: () {
                              _searchCtrl.clear();
                              setState(() => _searchQuery = '');
                            },
                          )
                        : null,
                    filled: true,
                    fillColor: Colors.white.withOpacity(0.18),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 0),
                  ),
                ),
              ],
            ),
          ),

          // Status Filter Tabs
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            color: Colors.white,
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildStatusChip('ALL', 'All'),
                  const SizedBox(width: 8),
                  _buildStatusChip('PENDING', 'Pending'),
                  const SizedBox(width: 8),
                  _buildStatusChip('ENROLLED', 'Enrolled'),
                  const SizedBox(width: 8),
                  _buildStatusChip('REJECTED', 'Rejected'),
                ],
              ),
            ),
          ),

          const Divider(height: 1, color: Color(0xFFE2E8F0)),

          // List Body
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF4F46E5)))
                : RefreshIndicator(
                    onRefresh: _fetchAdmissions,
                    color: const Color(0xFF4F46E5),
                    child: _filteredList.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.folder_open_rounded, size: 64, color: Color(0xFFCBD5E1)),
                                const SizedBox(height: 12),
                                Text(
                                  'No admission inquiries found',
                                  style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF64748B)),
                                ),
                              ],
                            ),
                          )
                        : ListView.separated(
                            padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
                            itemCount: _filteredList.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 12),
                            itemBuilder: (ctx, idx) {
                              final adm = _filteredList[idx] as Map<String, dynamic>;
                              return _buildAdmissionCard(adm);
                            },
                          ),
                  ),
          ),
        ],
      ),

      // FAB to register new student
      floatingActionButton: SafeArea(
        bottom: true,
        child: FloatingActionButton.extended(
          onPressed: () async {
            await Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const AdmissionRegistrationScreen()),
            );
            _fetchAdmissions();
          },
          backgroundColor: const Color(0xFF4F46E5),
          foregroundColor: Colors.white,
          icon: const Icon(Icons.person_add_rounded),
          label: Text('New Admission', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        ),
      ),
    );
  }

  Widget _buildKpiPill(String label, String value, Color bg, Color textColor) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 8),
        decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(10)),
        child: Column(
          children: [
            Text(label, style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w600, color: Colors.white70)),
            Text(value, style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.bold, color: textColor)),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusChip(String value, String label) {
    final isSelected = _selectedStatus == value;
    return ChoiceChip(
      label: Text(label, style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold)),
      selected: isSelected,
      onSelected: (s) => setState(() => _selectedStatus = value),
      selectedColor: const Color(0xFFEEF2FF),
      labelStyle: TextStyle(color: isSelected ? const Color(0xFF4F46E5) : const Color(0xFF64748B)),
    );
  }

  Widget _buildAdmissionCard(Map<String, dynamic> adm) {
    final studentName = adm['studentName']?.toString() ?? 'Student';
    final classApplied = adm['classApplied']?.toString() ?? 'N/A';
    final phone = adm['phone']?.toString() ?? '-';
    final fatherName = adm['fatherName']?.toString() ?? '';
    final status = adm['status']?.toString() ?? 'PENDING';
    final photoUrl = adm['studentImage']?.toString();
    final id = adm['id']?.toString() ?? '';

    String dateStr = '';
    if (adm['createdAt'] != null) {
      try {
        dateStr = DateFormat('dd MMM yyyy').format(DateTime.parse(adm['createdAt']));
      } catch (_) {}
    }

    Color statusBg = const Color(0xFFFEF3C7);
    Color statusTextColor = const Color(0xFF92400E);
    if (status == 'ENROLLED') {
      statusBg = const Color(0xFFD1FAE5);
      statusTextColor = const Color(0xFF065F46);
    } else if (status == 'REJECTED') {
      statusBg = const Color(0xFFFFE4E6);
      statusTextColor = const Color(0xFF9F1239);
    }

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: const BorderSide(color: Color(0xFFE2E8F0)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                // Student Photo Avatar
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    width: 50,
                    height: 58,
                    color: const Color(0xFFEEF2FF),
                    child: photoUrl != null && photoUrl.isNotEmpty
                        ? Image.network(
                            photoUrl,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => const Icon(Icons.person, color: Color(0xFF818CF8)),
                          )
                        : const Icon(Icons.person, color: Color(0xFF818CF8), size: 30),
                  ),
                ),
                const SizedBox(width: 12),

                // Name & Meta
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              studentName,
                              style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 15, color: const Color(0xFF0F172A)),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(color: statusBg, borderRadius: BorderRadius.circular(8)),
                            child: Text(
                              status,
                              style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 10, color: statusTextColor),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                            decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(6)),
                            child: Text(
                              classApplied,
                              style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 11, color: const Color(0xFF4F46E5)),
                            ),
                          ),
                          if (dateStr.isNotEmpty) ...[
                            const SizedBox(width: 8),
                            Text(dateStr, style: GoogleFonts.outfit(fontSize: 11, color: const Color(0xFF94A3B8))),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 10),
            const Divider(height: 1, color: Color(0xFFF1F5F9)),
            const SizedBox(height: 10),

            // Contact & Parents Info
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                if (fatherName.isNotEmpty)
                  Expanded(
                    child: Text(
                      'Father: $fatherName',
                      style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w500, color: const Color(0xFF475569)),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                Row(
                  children: [
                    const Icon(Icons.phone_outlined, size: 14, color: Color(0xFF4F46E5)),
                    const SizedBox(width: 4),
                    Text(
                      phone,
                      style: GoogleFonts.firaCode(fontSize: 12, fontWeight: FontWeight.bold, color: const Color(0xFF4F46E5)),
                    ),
                  ],
                ),
              ],
            ),

            const SizedBox(height: 12),

            // Action Buttons
            Row(
              children: [
                // Print PDF Button
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => AdmissionPdfService.printAdmissionForm(context, adm),
                    icon: const Icon(Icons.print_rounded, size: 16),
                    label: Text('Print Form (PDF)', style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold)),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFF4F46E5),
                      side: const BorderSide(color: Color(0xFFC7D2FE)),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      padding: const EdgeInsets.symmetric(vertical: 8),
                    ),
                  ),
                ),

                const SizedBox(width: 8),

                // Share Button
                IconButton(
                  onPressed: () => AdmissionPdfService.shareAdmissionPdf(adm),
                  icon: const Icon(Icons.share_outlined, size: 18, color: Color(0xFF64748B)),
                  tooltip: 'Share PDF',
                ),

                // Status Changer Menu
                PopupMenuButton<String>(
                  icon: const Icon(Icons.more_vert_rounded, size: 18, color: Color(0xFF64748B)),
                  onSelected: (val) {
                    if (val == 'DELETE') {
                      _deleteAdmission(id, studentName);
                    } else {
                      _updateStatus(id, val);
                    }
                  },
                  itemBuilder: (ctx) => [
                    const PopupMenuItem(value: 'PENDING', child: Text('Mark as Pending')),
                    const PopupMenuItem(value: 'ENROLLED', child: Text('Mark as Enrolled')),
                    const PopupMenuItem(value: 'REJECTED', child: Text('Mark as Rejected')),
                    const PopupMenuDivider(),
                    const PopupMenuItem(
                      value: 'DELETE',
                      child: Text('Delete Application', style: TextStyle(color: Colors.red)),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

extension IterableExt<T> on Iterable<T> {
  Iterable<T> filter(bool Function(T) test) sync* {
    for (var element in this) {
      if (test(element)) yield element;
    }
  }
}
