import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import 'student_fee_details_screen.dart';
import '../widgets/app_drawer.dart';

class StudentFeeSearchScreen extends StatefulWidget {
  const StudentFeeSearchScreen({super.key});

  @override
  State<StudentFeeSearchScreen> createState() => _StudentFeeSearchScreenState();
}

class _StudentFeeSearchScreenState extends State<StudentFeeSearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  bool _isLoading = false;
  List<dynamic> _students = [];
  List<dynamic> _classes = [];
  String _selectedClass = 'ALL';

  @override
  void initState() {
    super.initState();
    _fetchClasses();
    _fetchStudents();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _fetchClasses() async {
    final res = await ApiService.getClasses();
    if (mounted && res['success']) {
      setState(() {
        _classes = res['data'] ?? [];
      });
    }
  }

  Future<void> _fetchStudents() async {
    setState(() => _isLoading = true);
    final res = await ApiService.getStudents(
      classId: _selectedClass == 'ALL' ? null : _selectedClass,
      search: _searchController.text.trim().isNotEmpty ? _searchController.text.trim() : null,
      limit: 100,
    );
    
    if (mounted) {
      setState(() {
        _isLoading = false;
        if (res['success']) {
          _students = res['data'] ?? [];
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(res['message'] ?? 'Failed to load students')),
          );
        }
      });
    }
  }

  void _navigateToStudentFeeDetails(Map<String, dynamic> student) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => StudentFeeDetailsScreen(student: student),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9), // Slight gray background
      drawer: const AppDrawer(currentRoute: 'finance'),
      appBar: AppBar(
        leading: const BackButton(color: Colors.white),
        title: Text(
          'Search Student',
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 20, color: Colors.white),
        ),
        iconTheme: const IconThemeData(color: Colors.white),
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF6366F1), Color(0xFF4F46E5), Color(0xFF4338CA)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
        elevation: 0,
      ),
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(bottom: Radius.circular(32)),
              boxShadow: [
                BoxShadow(color: Color(0x0A000000), blurRadius: 20, offset: Offset(0, 10))
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Find Student for Fee Collection',
                  style: GoogleFonts.outfit(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF64748B),
                  ),
                ),
                const SizedBox(height: 16),
                // Class Dropdown
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                    boxShadow: [
                      BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 8, offset: const Offset(0, 2))
                    ],
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      isExpanded: true,
                      value: _selectedClass,
                      icon: const Icon(Icons.keyboard_arrow_down_rounded, color: Color(0xFF6366F1)),
                      onChanged: (val) {
                        if (val != null) {
                          setState(() => _selectedClass = val);
                          _fetchStudents();
                        }
                      },
                      items: [
                        DropdownMenuItem(
                          value: 'ALL',
                          child: Text('All Classes', style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w500, color: const Color(0xFF1E293B))),
                        ),
                        ..._classes.map((cls) {
                          return DropdownMenuItem(
                            value: cls['id'].toString(),
                            child: Text(
                              '${cls['name']} - ${cls['section']}',
                              style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w500, color: const Color(0xFF1E293B)),
                            ),
                          );
                        }),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                
                // Search Field
                TextField(
                  controller: _searchController,
                  onSubmitted: (_) => _fetchStudents(),
                  style: GoogleFonts.poppins(color: const Color(0xFF1E293B), fontWeight: FontWeight.w500),
                  decoration: InputDecoration(
                    hintText: 'Search by Name or Adm No...',
                    hintStyle: GoogleFonts.poppins(color: const Color(0xFF94A3B8), fontSize: 14),
                    prefixIcon: const Icon(Icons.search_rounded, color: Color(0xFF6366F1)),
                    suffixIcon: Container(
                      margin: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: const Color(0xFF6366F1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: IconButton(
                        icon: const Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 20),
                        onPressed: _fetchStudents,
                      ),
                    ),
                    filled: true,
                    fillColor: const Color(0xFFF8FAFC),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
              ],
            ),
          ),
          
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF6366F1)))
                : _students.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(24),
                              decoration: BoxDecoration(color: Colors.white, shape: BoxShape.circle, boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 20)]),
                              child: const Icon(Icons.person_search_rounded, size: 64, color: Color(0xFFCBD5E1)),
                            ),
                            const SizedBox(height: 20),
                            Text(
                              'No students found',
                              style: GoogleFonts.outfit(
                                color: const Color(0xFF94A3B8),
                                fontSize: 18,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _students.length,
                        itemBuilder: (context, index) {
                          final student = _students[index];
                          final name = '${student['firstName'] ?? ''} ${student['lastName'] ?? ''}'.trim();
                          final admissionNo = student['admissionNumber'] ?? 'N/A';
                          final cls = student['class'] != null ? '${student['class']['name']} - ${student['class']['section']}' : 'N/A';
                          
                          return Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: const Color(0xFFE2E8F0).withOpacity(0.5)),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.02),
                                  blurRadius: 15,
                                  offset: const Offset(0, 5),
                                )
                              ],
                            ),
                            child: Material(
                              color: Colors.transparent,
                              borderRadius: BorderRadius.circular(20),
                              child: InkWell(
                                borderRadius: BorderRadius.circular(20),
                                onTap: () => _navigateToStudentFeeDetails(student),
                                child: Padding(
                                  padding: const EdgeInsets.all(16),
                                  child: Row(
                                    children: [
                                      Container(
                                        width: 50,
                                        height: 50,
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF6366F1).withOpacity(0.1),
                                          shape: BoxShape.circle,
                                          image: student['user'] != null && student['user']['photoUrl'] != null
                                              ? DecorationImage(image: NetworkImage(student['user']['photoUrl']), fit: BoxFit.cover)
                                              : null,
                                        ),
                                        child: (student['user'] == null || student['user']['photoUrl'] == null)
                                            ? Center(
                                                child: Text(
                                                  name.isNotEmpty ? name[0].toUpperCase() : '?',
                                                  style: GoogleFonts.outfit(
                                                    color: const Color(0xFF6366F1),
                                                    fontWeight: FontWeight.bold,
                                                    fontSize: 20,
                                                  ),
                                                ),
                                              )
                                            : null,
                                      ),
                                      const SizedBox(width: 16),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              name,
                                              style: GoogleFonts.outfit(
                                                color: const Color(0xFF1E293B),
                                                fontSize: 16,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                            const SizedBox(height: 6),
                                            Row(
                                              children: [
                                                Container(
                                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                                  decoration: BoxDecoration(
                                                    color: const Color(0xFFF1F5F9),
                                                    borderRadius: BorderRadius.circular(6),
                                                  ),
                                                  child: Text(
                                                    'Adm: $admissionNo',
                                                    style: GoogleFonts.poppins(
                                                      color: const Color(0xFF64748B),
                                                      fontSize: 10,
                                                      fontWeight: FontWeight.w600,
                                                    ),
                                                  ),
                                                ),
                                                const SizedBox(width: 8),
                                                Container(
                                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                                  decoration: BoxDecoration(
                                                    color: const Color(0xFFEEF2FF),
                                                    borderRadius: BorderRadius.circular(6),
                                                  ),
                                                  child: Text(
                                                    'Class: $cls',
                                                    style: GoogleFonts.poppins(
                                                      color: const Color(0xFF6366F1),
                                                      fontSize: 10,
                                                      fontWeight: FontWeight.w600,
                                                    ),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ],
                                        ),
                                      ),
                                      Container(
                                        padding: const EdgeInsets.all(8),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF6366F1).withOpacity(0.1),
                                          shape: BoxShape.circle,
                                        ),
                                        child: const Icon(Icons.arrow_forward_ios_rounded, color: Color(0xFF6366F1), size: 14),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}
