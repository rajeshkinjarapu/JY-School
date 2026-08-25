import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class TransportStudentsScreen extends StatefulWidget {
  const TransportStudentsScreen({super.key});
  @override
  State<TransportStudentsScreen> createState() => _TransportStudentsScreenState();
}

class _TransportStudentsScreenState extends State<TransportStudentsScreen> {
  bool _isLoading = true;
  List<dynamic> _students = [];

  @override
  void initState() {
    super.initState();
    _fetchStudents();
  }

  Future<void> _fetchStudents() async {
    setState(() => _isLoading = true);
    try {
      final res = await ApiService.getTransportStudents();
      if (mounted) {
        if (res['success']) setState(() => _students = res['data']);
        setState(() => _isLoading = false);
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text('Student Allocations', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white)),
        backgroundColor: const Color(0xFFDB2777),
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFDB2777)))
          : _students.isEmpty
              ? const Center(child: Text('No students found'))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _students.length,
                  itemBuilder: (context, index) {
                    final student = _students[index];
                    return Card(
                      elevation: 2,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      margin: const EdgeInsets.only(bottom: 12),
                      child: ListTile(
                        leading: const CircleAvatar(backgroundColor: Color(0xFFFCE7F3), child: Icon(Icons.person, color: Color(0xFFDB2777))),
                        title: Text(student['student']?['user']?['name'] ?? '', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
                        subtitle: Text('Route: ${student['route']?['name']} - Stop: ${student['stop']?['stopName']}'),
                      ),
                    );
                  },
                ),
    );
  }
}
