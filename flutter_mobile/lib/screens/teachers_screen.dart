import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/api_service.dart';
import '../widgets/app_drawer.dart';
import 'teacher_profile_screen.dart';
import 'add_teacher_screen.dart';

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
  String _searchQuery = '';

  final List<List<Color>> avatarGradients = [
    [const Color(0xFF2DD4BF), const Color(0xFF10B981)], // Teal to Emerald
    [const Color(0xFFFB7185), const Color(0xFFE11D48)], // Rose to Pink
    [const Color(0xFFFBBF24), const Color(0xFFF97316)], // Amber to Orange
    [const Color(0xFF22D3EE), const Color(0xFF3B82F6)], // Cyan to Blue
    [const Color(0xFFA78BFA), const Color(0xFF7C3AED)], // Violet to Purple
  ];

  @override
  void initState() {
    super.initState();
    _fetchTeachers();
  }

  Future<void> _fetchTeachers() async {
    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });
    try {
      final res = await ApiService.getTeachers();
      if (res['success']) {
        setState(() {
          _teachers = res['data'] ?? [];
          _filteredTeachers = List.from(_teachers);
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = res['message'] ?? 'Failed to fetch teachers';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'An error occurred: $e';
        _isLoading = false;
      });
    }
  }

  void _runSearch(String query) {
    setState(() {
      _searchQuery = query;
      if (query.isEmpty) {
        _filteredTeachers = List.from(_teachers);
      } else {
        final lower = query.toLowerCase();
        _filteredTeachers = _teachers.where((t) {
          final name = (t['user']?['name'] ?? '').toString().toLowerCase();
          final tid = (t['teacherId'] ?? '').toString().toLowerCase();
          return name.contains(lower) || tid.contains(lower);
        }).toList();
      }
    });
  }

  Future<void> _launchWhatsApp(String phone) async {
    if (phone.isEmpty) return;
    String cleanPhone = phone.replaceAll(RegExp(r'\D'), '');
    if (!cleanPhone.startsWith('91') && cleanPhone.length == 10) {
      cleanPhone = '91$cleanPhone';
    }
    final url = Uri.parse('https://wa.me/$cleanPhone');
    try {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not open WhatsApp')));
      }
    }
  }

  String _getInitials(String name) {
    if (name.isEmpty) return 'TR';
    final parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, name.length >= 2 ? 2 : 1).toUpperCase();
  }

  Widget _buildAvatar(String name, String? photoUrl) {
    final safeName = name.isEmpty ? 'Teacher' : name;
    final colorIndex = safeName.codeUnitAt(0) % avatarGradients.length;
    final gradientColors = avatarGradients[colorIndex];

    if (photoUrl != null && photoUrl.isNotEmpty && !photoUrl.startsWith('data:')) {
      final url = ApiService.getImageUrl(photoUrl);
      return Container(
        width: 48,
        height: 60,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Colors.grey.shade300, width: 1),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4, offset: const Offset(0, 2)),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(9),
          child: Image.network(
            url,
            fit: BoxFit.cover,
            headers: const {'ngrok-skip-browser-warning': '69420'},
            errorBuilder: (context, error, stackTrace) => Container(
              color: Colors.grey.shade200,
              child: const Icon(Icons.person, color: Colors.grey),
            ),
          ),
        ),
      );
    } else {
      return Container(
        width: 48,
        height: 60,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(10),
          gradient: LinearGradient(colors: gradientColors, begin: Alignment.topLeft, end: Alignment.bottomRight),
          border: Border.all(color: Colors.white, width: 2),
          boxShadow: [
            BoxShadow(color: gradientColors[1].withOpacity(0.3), blurRadius: 6, offset: const Offset(0, 2)),
          ],
        ),
        alignment: Alignment.center,
        child: Text(
          _getInitials(safeName),
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9), // Slight gray background
      drawer: const AppDrawer(currentRoute: 'teachers'),
      appBar: AppBar(
        title: const Text('Teachers Directory', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        backgroundColor: const Color(0xFF0F172A), // Slate 900
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.person_add_rounded), 
            onPressed: () async {
              final result = await Navigator.push(context, MaterialPageRoute(builder: (context) => const AddTeacherScreen()));
              if (result == true) {
                _fetchTeachers();
              }
            }
          ),
        ],
      ),
      body: Column(
        children: [
          // Filters
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4))
                ],
              ),
              child: Container(
                height: 45,
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: TextField(
                  style: const TextStyle(color: Color(0xFF1E293B)),
                  decoration: const InputDecoration(
                    hintText: 'Search by name or ID...',
                    hintStyle: TextStyle(color: Color(0xFF94A3B8)),
                    prefixIcon: Icon(Icons.search, color: Color(0xFF94A3B8)),
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.symmetric(vertical: 12),
                  ),
                  onChanged: _runSearch,
                ),
              ),
            ),
          ),

          // List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _filteredTeachers.isEmpty
                    ? _buildEmptyState()
                    : RefreshIndicator(
                        onRefresh: _fetchTeachers,
                        child: ListView.builder(
                          padding: const EdgeInsets.only(left: 16, right: 16, bottom: 24, top: 12),
                          itemCount: _filteredTeachers.length,
                          itemBuilder: (context, index) {
                            return _buildTeacherCard(_filteredTeachers[index], index);
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildTeacherCard(dynamic teacher, int index) {
    final user = teacher['user'] ?? {};
    final name = user['name'] ?? 'Unknown';
    final photoUrl = user['photoUrl'];
    final id = teacher['employeeId'] ?? 'N/A';
    final subject = teacher['specialization'] ?? 'N/A';
    final phone = user['phone']?.toString() ?? '';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 8, offset: const Offset(0, 2))
        ],
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () {
          Navigator.push(context, MaterialPageRoute(builder: (context) => TeacherProfileScreen(teacher: teacher)));
        },
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          child: Row(
            children: [
              SizedBox(
                width: 28,
                child: Text(
                  '${index + 1}.',
                  style: GoogleFonts.poppins(color: const Color(0xFFCBD5E1), fontSize: 13, fontWeight: FontWeight.w700),
                ),
              ),
              _buildAvatar(name, photoUrl),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: GoogleFonts.poppins(color: const Color(0xFF1E293B), fontSize: 15, fontWeight: FontWeight.w700),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 3),
                    Text(
                      'ID: $id',
                      style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 12),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF3B82F6).withOpacity(0.15),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  subject,
                  style: GoogleFonts.poppins(color: const Color(0xFF2563EB), fontSize: 11, fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(width: 12),
              if (phone.isNotEmpty)
                InkWell(
                  onTap: () => _launchWhatsApp(phone),
                  borderRadius: BorderRadius.circular(24),
                  child: Image.network(
                    'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/150px-WhatsApp.svg.png',
                    width: 38,
                    height: 38,
                    errorBuilder: (ctx, err, trace) => Container(
                      width: 38,
                      height: 38,
                      decoration: const BoxDecoration(
                        color: Color(0xFF25D366),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.chat_bubble_rounded, color: Colors.white, size: 20),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.search_off_rounded, size: 60, color: const Color(0xFF94A3B8).withOpacity(0.5)),
          const SizedBox(height: 16),
          Text(
            _searchQuery.isNotEmpty ? 'No teachers found matching ""' : 'No teachers found.',
            style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 14),
          ),
        ],
      ),
    );
  }
}
