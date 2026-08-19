import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/api_service.dart';
import 'teacher_profile_screen.dart';

class TeachersScreen extends StatefulWidget {
  const TeachersScreen({super.key});

  @override
  State<TeachersScreen> createState() => _TeachersScreenState();
}

class _TeachersScreenState extends State<TeachersScreen> {
  List<dynamic> _teachers = [];
  List<dynamic> _filteredTeachers = [];
  bool _isLoading = true;
  String _errorMessage = '';

  @override
  void initState() {
    super.initState();
    _fetchTeachers();
  }

  Future<void> _fetchTeachers() async {
    final result = await ApiService.getTeachers();
    if (mounted) {
      if (result['success']) {
        setState(() {
          _teachers = result['data'] ?? [];
          _filteredTeachers = _teachers;
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = result['message'] ?? 'Failed to load teachers';
          _isLoading = false;
        });
      }
    }
  }

  void _runSearch(String query) {
    if (query.isEmpty) {
      setState(() => _filteredTeachers = _teachers);
      return;
    }
    
    final lowerQuery = query.toLowerCase();
    setState(() {
      _filteredTeachers = _teachers.where((t) {
        final name = (t['user']?['name'] ?? '').toString().toLowerCase();
        final id = (t['teacherId'] ?? '').toString().toLowerCase();
        return name.contains(lowerQuery) || id.contains(lowerQuery);
      }).toList();
    });
  }

  Future<void> _launchWhatsApp(String phone) async {
    if (phone.isEmpty) return;
    final cleanPhone = phone.replaceAll(RegExp(r'[^\d+]'), '');
    final url = Uri.parse('https://wa.me/$cleanPhone');
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not launch WhatsApp')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F7FE),
      appBar: AppBar(
        title: Text(
          'Teachers Directory',
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white),
        ),
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        iconTheme: const IconThemeData(color: Colors.white),
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF2E2A66), Color(0xFF222854)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
      ),
      body: Column(
        children: [
          _buildFilters(),
          Expanded(
            child: _isLoading 
              ? const Center(child: CircularProgressIndicator(color: Color(0xFF6366F1)))
              : _errorMessage.isNotEmpty 
                  ? Center(child: Text(_errorMessage, style: const TextStyle(color: Colors.red)))
                  : _filteredTeachers.isEmpty
                      ? const Center(child: Text("No teachers found"))
                      : SingleChildScrollView(
                          child: Container(
                            margin: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFF6366F1).withOpacity(0.06),
                                  blurRadius: 10,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  _buildTableHeader(),
                                  ...List.generate(_filteredTeachers.length, (index) {
                                    return _buildTableRow(_filteredTeachers[index], index);
                                  }),
                                ],
                              ),
                            ),
                          ),
                        ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilters() {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Container(
        height: 45,
        decoration: BoxDecoration(
          color: const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: TextField(
          style: const TextStyle(color: Color(0xFF1E293B)),
          decoration: InputDecoration(
            hintText: 'Search teacher by name or ID...',
            hintStyle: const TextStyle(color: Color(0xFF94A3B8)),
            prefixIcon: const Icon(Icons.search, color: Color(0xFF94A3B8)),
            border: InputBorder.none,
            contentPadding: const EdgeInsets.symmetric(vertical: 12),
          ),
          onChanged: _runSearch,
        ),
      ),
    );
  }

  Widget _buildTableHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: const BoxDecoration(
        color: Color(0xFFF8FAFC),
        border: Border(bottom: BorderSide(color: Color(0xFFF1F5F9))),
      ),
      child: Row(
        children: [
          Expanded(
            flex: 3,
            child: Text('Teacher Info', style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 12, fontWeight: FontWeight.w600)),
          ),
          Expanded(
            flex: 2,
            child: Text('Subject', style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 12, fontWeight: FontWeight.w600)),
          ),
          const SizedBox(width: 40), // For WhatsApp action button space
        ],
      ),
    );
  }

  Widget _buildTableRow(dynamic teacher, int index) {
    final user = teacher['user'] ?? {};
    final name = user['name'] ?? 'Unknown';
    final photoUrl = user['photoUrl'];
    final image = photoUrl?.isNotEmpty == true
        ? photoUrl
        : 'https://ui-avatars.com/api/?name=${Uri.encodeComponent(name)}&background=E2E8F0&color=1E293B';
        
    final id = teacher['teacherId'] ?? 'N/A';
    final subject = teacher['specialization'] ?? 'N/A';
    final phone = user['phone']?.toString() ?? '';
    final isEven = index % 2 == 0;

    return InkWell(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => TeacherProfileScreen(teacher: teacher),
          ),
        );
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: isEven ? Colors.white : const Color(0xFFF8FAFC).withOpacity(0.5),
          border: const Border(bottom: BorderSide(color: Color(0xFFF1F5F9))),
        ),
        child: Row(
          children: [
            // Teacher Info Column
            Expanded(
              flex: 3,
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 20,
                    backgroundImage: NetworkImage(image),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          name,
                          style: GoogleFonts.poppins(
                            color: const Color(0xFF1E293B),
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          id,
                          style: GoogleFonts.poppins(
                            color: const Color(0xFF475569),
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            // Subject Column
            Expanded(
              flex: 2,
              child: Align(
                alignment: Alignment.centerLeft,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFF10B981).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    subject,
                    style: GoogleFonts.poppins(
                      color: const Color(0xFF059669),
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ),
            ),
            // Action Button (WhatsApp)
            InkWell(
              onTap: () => _launchWhatsApp(phone),
              borderRadius: BorderRadius.circular(8),
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFF22C55E).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.chat_bubble_outline_rounded,
                  color: Color(0xFF16A34A),
                  size: 20,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
