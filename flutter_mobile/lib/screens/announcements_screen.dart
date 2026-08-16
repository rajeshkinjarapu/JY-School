import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../widgets/app_drawer.dart';

class AnnouncementsScreen extends StatefulWidget {
  const AnnouncementsScreen({super.key});

  @override
  State<AnnouncementsScreen> createState() => _AnnouncementsScreenState();
}

class _AnnouncementsScreenState extends State<AnnouncementsScreen> {
  List<dynamic> _announcements = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _fetchAnnouncements();
  }

  Future<void> _fetchAnnouncements() async {
    final result = await ApiService.getAnnouncements();

    if (mounted) {
      if (result['success']) {
        setState(() {
          _announcements = result['data'] ?? [];
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = result['message'];
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F7FE), // Dark theme
      drawer: const AppDrawer(currentRoute: 'announcements'),
      appBar: AppBar(
        leading: const BackButton(),
        title: Text(
          'Announcements',
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold),
        ),
        backgroundColor: const Color(0xFFE2E8F0),
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF6366F1)))
          : _errorMessage != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.error_outline, size: 60, color: Colors.redAccent),
                        const SizedBox(height: 16),
                        Text(
                          _errorMessage!,
                          textAlign: TextAlign.center,
                          style: GoogleFonts.poppins(fontSize: 16, color: Colors.blueGrey.shade400),
                        ),
                        const SizedBox(height: 20),
                        ElevatedButton(
                          onPressed: () {
                            setState(() {
                              _isLoading = true;
                              _errorMessage = null;
                            });
                            _fetchAnnouncements();
                          },
                          child: const Text('Retry'),
                        )
                      ],
                    ),
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _fetchAnnouncements,
                  child: _announcements.isEmpty
                      ? Center(
                          child: Text(
                            'No announcements yet.',
                            style: GoogleFonts.poppins(color: const Color(0xFF94A3B8), fontSize: 16),
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.all(20.0),
                          itemCount: _announcements.length,
                          itemBuilder: (context, index) {
                            final ann = _announcements[index];
                            final title = ann['title'] ?? 'Notice';
                            final message = ann['message'] ?? '';
                            final rawDate = ann['createdAt'] ?? ann['date'] ?? '';
                            final dateStr = rawDate.toString().split('T')[0];
                            final author = ann['author']?['name'] ?? ann['createdBy'] ?? 'Administrator';
                            final type = ann['type']?.toString().toUpperCase() ?? 'GENERAL';

                            return Container(
                              margin: const EdgeInsets.only(bottom: 16),
                              decoration: BoxDecoration(
                                color: const Color(0xFF1E293B),
                                borderRadius: BorderRadius.circular(24),
                                border: Border.all(color: const Color(0xFFE2E8F0)),
                              ),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(24),
                                child: Theme(
                                  data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
                                  child: ExpansionTile(
                                    tilePadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                                    leading: Container(
                                      padding: const EdgeInsets.all(10),
                                      decoration: BoxDecoration(
                                        color: _getTypeColor(type).withOpacity(0.12),
                                        shape: BoxShape.circle,
                                      ),
                                      child: Icon(
                                        _getTypeIcon(type),
                                        color: _getTypeColor(type),
                                        size: 22,
                                      ),
                                    ),
                                    title: Text(
                                      title,
                                      style: GoogleFonts.outfit(
                                        color: const Color(0xFF1E293B),
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    subtitle: Padding(
                                      padding: const EdgeInsets.only(top: 4.0),
                                      child: Text(
                                        'By $author  •  $dateStr',
                                        style: GoogleFonts.poppins(
                                          color: const Color(0xFF94A3B8),
                                          fontSize: 11,
                                        ),
                                      ),
                                    ),
                                    children: [
                                      Padding(
                                        padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                                        child: Text(
                                          message,
                                          style: GoogleFonts.poppins(
                                            color: const Color(0xFF475569),
                                            fontSize: 14,
                                            height: 1.5,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                ),
    );
  }

  Color _getTypeColor(String type) {
    switch (type) {
      case 'URGENT':
      case 'ALERT':
        return const Color(0xFFEF4444); // Red
      case 'ACADEMIC':
      case 'EXAM':
        return const Color(0xFF818CF8); // Indigo
      case 'EVENT':
      case 'HOLIDAY':
        return const Color(0xFFF59E0B); // Amber
      case 'GENERAL':
      default:
        return const Color(0xFF10B981); // Emerald
    }
  }

  IconData _getTypeIcon(String type) {
    switch (type) {
      case 'URGENT':
      case 'ALERT':
        return Icons.warning_amber_rounded;
      case 'ACADEMIC':
      case 'EXAM':
        return Icons.school_rounded;
      case 'EVENT':
      case 'HOLIDAY':
        return Icons.celebration_rounded;
      case 'GENERAL':
      default:
        return Icons.campaign_rounded;
    }
  }
}
