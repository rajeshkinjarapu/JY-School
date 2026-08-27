import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:qr_flutter/qr_flutter.dart';

class GatePassViewScreen extends StatelessWidget {
  final dynamic pass;
  final bool isStudentTab;
  final Color statusColor;

  const GatePassViewScreen({
    super.key,
    required this.pass,
    required this.isStudentTab,
    required this.statusColor,
  });

  @override
  Widget build(BuildContext context) {
    final name = isStudentTab
        ? ((pass['student'] as Map?)?['user']?['name'] ?? 'Unknown')
        : ((pass['requester'] as Map?)?['name'] ?? 'Unknown');
    final photoUrl = isStudentTab
        ? (pass['student'] as Map?)?['user']?['photoUrl']
        : (pass['requester'] as Map?)?['photoUrl'];
    final destination = pass['destination'] ?? 'N/A';
    final reason = pass['reason'] ?? 'N/A';
    final slipNumber = pass['slipNumber'] ?? 'N/A';
    final status = pass['status'] ?? 'UNKNOWN';
    final rawPhone = isStudentTab
        ? ((pass['student'] as Map?)?['user']?['phoneNumber'] ?? '')
        : ((pass['requester'] as Map?)?['phoneNumber'] ?? '');
    
    final String maskedPhone = (rawPhone.length >= 4)
        ? 'xxxx ${rawPhone.substring(rawPhone.length - 4)}'
        : (rawPhone.isNotEmpty ? rawPhone : 'N/A');

    final approvedBy = pass['approvedBy'] != null ? (pass['approvedBy']['name'] ?? 'Unknown') : 'Pending';

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text('Gate Pass Details', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white)),
        backgroundColor: const Color(0xFF0F172A),
        iconTheme: const IconThemeData(color: Colors.white),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.06),
                    blurRadius: 20,
                    offset: const Offset(0, 10),
                  )
                ],
              ),
              child: Column(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(vertical: 20),
                    decoration: const BoxDecoration(
                      color: Color(0xFF0F172A),
                      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.verified_user_rounded, color: Color(0xFF10B981), size: 26),
                        const SizedBox(width: 8),
                        Text(
                          'GATE PASS SLIP',
                          style: GoogleFonts.outfit(
                            color: Colors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 80,
                              height: 80,
                              decoration: BoxDecoration(
                                color: const Color(0xFFF1F5F9),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(color: const Color(0xFFE2E8F0), width: 2),
                                image: (photoUrl != null && photoUrl.isNotEmpty)
                                    ? DecorationImage(image: NetworkImage(photoUrl), fit: BoxFit.cover)
                                    : null,
                              ),
                              child: (photoUrl == null || photoUrl.isEmpty)
                                  ? Icon(isStudentTab ? Icons.person : Icons.badge, color: const Color(0xFF94A3B8), size: 36)
                                  : null,
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    name,
                                    style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 20, color: const Color(0xFF1E293B)),
                                  ),
                                  const SizedBox(height: 4),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFEEF2FF),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      isStudentTab ? 'Student' : 'Staff',
                                      style: GoogleFonts.poppins(color: const Color(0xFF6366F1), fontSize: 12, fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  Row(
                                    children: [
                                      const Icon(Icons.phone_rounded, size: 14, color: Color(0xFF94A3B8)),
                                      const SizedBox(width: 4),
                                      Text(maskedPhone, style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 13, fontWeight: FontWeight.w600)),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 32),
                        Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                          ),
                          child: Column(
                            children: [
                              _buildDetailRow('Slip Number', slipNumber),
                              const Divider(height: 24, color: Color(0xFFE2E8F0)),
                              _buildDetailRow('Destination', destination),
                              const Divider(height: 24, color: Color(0xFFE2E8F0)),
                              _buildDetailRow('Reason', reason),
                              const Divider(height: 24, color: Color(0xFFE2E8F0)),
                              _buildDetailRow('Approved By', approvedBy),
                            ],
                          ),
                        ),
                        const SizedBox(height: 32),
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: const Color(0xFFE2E8F0), width: 1.5),
                            boxShadow: [
                              BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 4))
                            ],
                          ),
                          child: QrImageView(
                            data: slipNumber,
                            version: QrVersions.auto,
                            size: 140.0,
                            eyeStyle: const QrEyeStyle(eyeShape: QrEyeShape.square, color: Color(0xFF0F172A)),
                            dataModuleStyle: const QrDataModuleStyle(dataModuleShape: QrDataModuleShape.square, color: Color(0xFF0F172A)),
                          ),
                        ),
                        const SizedBox(height: 20),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                          decoration: BoxDecoration(
                            color: statusColor.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(30),
                            border: Border.all(color: statusColor.withOpacity(0.3)),
                          ),
                          child: Text(
                            status,
                            style: GoogleFonts.outfit(color: statusColor, fontWeight: FontWeight.bold, fontSize: 15, letterSpacing: 1),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          flex: 2,
          child: Text(label, style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 13, fontWeight: FontWeight.w500)),
        ),
        Expanded(
          flex: 3,
          child: Text(value, style: GoogleFonts.poppins(color: const Color(0xFF1E293B), fontSize: 14, fontWeight: FontWeight.w600), textAlign: TextAlign.right),
        ),
      ],
    );
  }
}
