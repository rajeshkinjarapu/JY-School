import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class ActiveTripScreen extends StatefulWidget {
  final Map<String, dynamic> routeData;

  const ActiveTripScreen({super.key, required this.routeData});

  @override
  State<ActiveTripScreen> createState() => _ActiveTripScreenState();
}

class _ActiveTripScreenState extends State<ActiveTripScreen> {
  bool _isTripActive = false;
  int _currentStopIndex = 0;
  List<dynamic> _stops = [];
  Map<String, bool> _studentAttendance = {};

  @override
  void initState() {
    super.initState();
    _stops = widget.routeData['stops'] ?? [];
    // Mock students for the first stop
    _studentAttendance = {
      'S1': false,
      'S2': false,
      'S3': false,
    };
  }

  void _toggleTrip() {
    setState(() {
      _isTripActive = !_isTripActive;
    });
  }

  void _nextStop() {
    if (_currentStopIndex < _stops.length - 1) {
      setState(() {
        _currentStopIndex++;
        // Reset attendance for next stop (in a real app, load students for this stop)
        _studentAttendance.updateAll((key, value) => false);
      });
    } else {
      _showEndTripDialog();
    }
  }

  void _showEndTripDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            const Icon(Icons.warning_rounded, color: Color(0xFFF59E0B)),
            const SizedBox(width: 10),
            Text('End Trip Check', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
          ],
        ),
        content: Text(
          'Please confirm that you have checked the bus and no students are left behind.',
          style: GoogleFonts.poppins(),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancel', style: GoogleFonts.poppins(color: Colors.grey)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF10B981),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            onPressed: () {
              Navigator.pop(context);
              Navigator.pop(context); // Go back to dashboard
            },
            child: Text('Confirm & End', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final String routeName = widget.routeData['name'] ?? 'Route';
    final currentStop = _stops.isNotEmpty ? _stops[_currentStopIndex] : null;

    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        title: Text('Active Trip: $routeName', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 18)),
        backgroundColor: _isTripActive ? const Color(0xFF10B981) : const Color(0xFF3B82F6),
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: Column(
        children: [
          // Top Status Card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: _isTripActive ? const Color(0xFF10B981) : const Color(0xFF3B82F6),
              borderRadius: const BorderRadius.only(bottomLeft: Radius.circular(30), bottomRight: Radius.circular(30)),
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(_isTripActive ? 'Trip is Live' : 'Trip Not Started', style: GoogleFonts.outfit(color: Colors.white, fontSize: 16)),
                    Switch(
                      value: _isTripActive,
                      onChanged: (val) => _toggleTrip(),
                      activeColor: Colors.white,
                      activeTrackColor: const Color(0xFF059669),
                    ),
                  ],
                ),
                if (_isTripActive && currentStop != null) ...[
                  const SizedBox(height: 20),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: const BoxDecoration(color: Color(0xFFFEF3C7), shape: BoxShape.circle),
                          child: const Icon(Icons.location_on_rounded, color: Color(0xFFD97706)),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Next Stop', style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF64748B))),
                              Text(currentStop['stopName'] ?? 'Unknown Stop', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
                            ],
                          ),
                        ),
                      ],
                    ),
                  )
                ]
              ],
            ),
          ),
          
          Expanded(
            child: !_isTripActive
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.directions_bus_rounded, size: 80, color: Color(0xFFCBD5E1)),
                        const SizedBox(height: 16),
                        Text('Start trip to view stops & attendance', style: GoogleFonts.poppins(color: const Color(0xFF64748B))),
                      ],
                    ),
                  )
                : _buildAttendanceList(),
          ),
        ],
      ),
      bottomNavigationBar: _isTripActive
          ? SafeArea(
              bottom: true,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF3B82F6),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  onPressed: _nextStop,
                  child: Text(_currentStopIndex < _stops.length - 1 ? 'Proceed to Next Stop' : 'End Trip', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                ),
              ),
            )
          : null,
    );
  }

  Widget _buildAttendanceList() {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Text('Boarding Students (Stop ${_currentStopIndex + 1})', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
        const SizedBox(height: 12),
        ..._studentAttendance.keys.map((studentId) {
          final isPresent = _studentAttendance[studentId]!;
          return Card(
            elevation: 0,
            color: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: const BorderSide(color: Color(0xFFF1F5F9))),
            margin: const EdgeInsets.only(bottom: 10),
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: const Color(0xFFEFF6FF),
                child: Text(studentId, style: GoogleFonts.outfit(color: const Color(0xFF3B82F6), fontWeight: FontWeight.bold, fontSize: 12)),
              ),
              title: Text('Student Name', style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
              subtitle: Text('ID: $studentId'),
              trailing: Checkbox(
                value: isPresent,
                activeColor: const Color(0xFF10B981),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                onChanged: (val) {
                  setState(() {
                    _studentAttendance[studentId] = val ?? false;
                  });
                },
              ),
            ),
          );
        }).toList(),
      ],
    );
  }
}
