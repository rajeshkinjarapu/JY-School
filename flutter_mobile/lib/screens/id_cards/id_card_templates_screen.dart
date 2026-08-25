import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'id_card_students_screen.dart';

class IdCardTemplatesScreen extends StatelessWidget {
  const IdCardTemplatesScreen({super.key});

  final List<Map<String, dynamic>> templates = const [
    {'id': '1', 'name': 'Standard Vertical', 'color': Color(0xFF2563EB)},
    {'id': '2', 'name': 'Horizontal Corporate', 'color': Color(0xFF4F46E5)},
    {'id': '3', 'name': 'Gradient Premium', 'color': Color(0xFF7C3AED)},
    {'id': '4', 'name': 'Minimalist Clean', 'color': Color(0xFF0F172A)},
    {'id': '5', 'name': 'QR Code Smart', 'color': Color(0xFF0D9488)},
    {'id': '6', 'name': 'Dual Tone Pattern', 'color': Color(0xFFDC2626)},
    {'id': '7', 'name': 'Wave Design', 'color': Color(0xFF0284C7)},
    {'id': '8', 'name': 'Dark Mode Elite', 'color': Color(0xFF1E293B)},
    {'id': '9', 'name': 'Lanyard Overlay', 'color': Color(0xFF16A34A)},
    {'id': '10', 'name': 'Geometric Shapes', 'color': Color(0xFFD946EF)},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text('Select ID Card Design', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white)),
        backgroundColor: const Color(0xFF2E2A66),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: templates.length,
        itemBuilder: (context, index) {
          final tpl = templates[index];
          return Container(
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [BoxShadow(color: tpl['color'].withOpacity(0.2), blurRadius: 10, offset: const Offset(0, 4))],
            ),
            child: Material(
              color: Colors.transparent,
              borderRadius: BorderRadius.circular(20),
              child: InkWell(
                borderRadius: BorderRadius.circular(20),
                onTap: () {
                  Navigator.push(context, MaterialPageRoute(
                    builder: (_) => IdCardStudentsScreen(templateId: tpl['id'], templateName: tpl['name'], themeColor: tpl['color'])
                  ));
                },
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Row(
                    children: [
                      Container(
                        width: 50,
                        height: 50,
                        decoration: BoxDecoration(color: tpl['color'].withOpacity(0.1), borderRadius: BorderRadius.circular(15)),
                        child: Icon(Icons.badge_rounded, color: tpl['color'], size: 28),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(tpl['name'], style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 4),
                            Text('Premium School ID Template', style: GoogleFonts.poppins(fontSize: 12, color: Colors.grey[600])),
                          ],
                        ),
                      ),
                      Icon(Icons.arrow_forward_ios_rounded, color: Colors.grey[400], size: 16),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
