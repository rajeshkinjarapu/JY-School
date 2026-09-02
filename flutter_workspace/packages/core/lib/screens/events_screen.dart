import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../widgets/app_drawer.dart';

class EventsScreen extends StatefulWidget {
  const EventsScreen({super.key});

  @override
  State<EventsScreen> createState() => _EventsScreenState();
}

class _EventsScreenState extends State<EventsScreen> {
  bool _isLoading = true;
  List<dynamic> _events = [];

  @override
  void initState() {
    super.initState();
    _fetchEvents();
  }

  Future<void> _fetchEvents() async {
    setState(() => _isLoading = true);
    final res = await ApiService.getEvents();
    if (mounted) {
      setState(() {
        _isLoading = false;
        if (res['success']) {
          _events = res['data'];
          // Sort events by date ascending
          _events.sort((a, b) => (a['date'] ?? '').compareTo(b['date'] ?? ''));
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(res['message'] ?? 'Failed to load events')),
          );
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F7FE),
      drawer: AppDrawer(currentRoute: 'events'),
      appBar: AppBar(
        leading: const BackButton(),
        title: Text(
          'Calendar & Events',
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white),
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
        
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _fetchEvents,
          )
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF6366F1)))
          : _events.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.event_busy_rounded, size: 80, color: const Color(0xFFCBD5E1)),
                      const SizedBox(height: 16),
                      Text(
                        'No Upcoming Events',
                        style: GoogleFonts.outfit(
                          color: const Color(0xFF64748B),
                          fontSize: 20,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(20),
                  itemCount: _events.length,
                  itemBuilder: (context, index) {
                    final event = _events[index];
                    return _buildEventCard(event);
                  },
                ),
    );
  }

  Widget _buildEventCard(Map<String, dynamic> event) {
    final title = event['title'] ?? 'Event';
    final description = event['description'] ?? '';
    final dateStr = (event['date'] as String?)?.split('T')[0] ?? '';
    final type = event['type'] ?? 'EVENT';

    Color typeColor;
    IconData typeIcon;

    switch (type.toString().toUpperCase()) {
      case 'HOLIDAY':
        typeColor = const Color(0xFF10B981);
        typeIcon = Icons.celebration_rounded;
        break;
      case 'EXAM':
        typeColor = const Color(0xFFEF4444);
        typeIcon = Icons.menu_book_rounded;
        break;
      case 'MEETING':
        typeColor = const Color(0xFFF59E0B);
        typeIcon = Icons.groups_rounded;
        break;
      default:
        typeColor = const Color(0xFF6366F1);
        typeIcon = Icons.event_rounded;
        break;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: Row(
        children: [
          // Date Block
          Container(
            width: 80,
            padding: const EdgeInsets.symmetric(vertical: 24),
            decoration: BoxDecoration(
              color: typeColor.withOpacity(0.1),
              borderRadius: const BorderRadius.only(topLeft: Radius.circular(20), bottomLeft: Radius.circular(20)),
              border: Border(right: BorderSide(color: const Color(0xFFE2E8F0))),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(typeIcon, color: typeColor, size: 28),
                const SizedBox(height: 12),
                if (dateStr.isNotEmpty) ...[
                  Text(
                    dateStr.split('-').last, // Day
                    style: GoogleFonts.outfit(
                      color: const Color(0xFF1E293B),
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    _getMonth(dateStr.split('-')[1]), // Month
                    style: GoogleFonts.poppins(
                      color: typeColor,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ]
              ],
            ),
          ),
          
          // Details Block
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: typeColor.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      type.toString().toUpperCase(),
                      style: GoogleFonts.poppins(
                        color: typeColor,
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 1,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    title,
                    style: GoogleFonts.outfit(
                      color: const Color(0xFF1E293B),
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  if (description.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Text(
                      description,
                      style: GoogleFonts.poppins(
                        color: const Color(0xFF64748B),
                        fontSize: 13,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _getMonth(String monthString) {
    switch (monthString) {
      case '01': return 'JAN';
      case '02': return 'FEB';
      case '03': return 'MAR';
      case '04': return 'APR';
      case '05': return 'MAY';
      case '06': return 'JUN';
      case '07': return 'JUL';
      case '08': return 'AUG';
      case '09': return 'SEP';
      case '10': return 'OCT';
      case '11': return 'NOV';
      case '12': return 'DEC';
      default: return '';
    }
  }
}


