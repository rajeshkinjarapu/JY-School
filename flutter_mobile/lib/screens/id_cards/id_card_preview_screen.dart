import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class IdCardPreviewScreen extends StatelessWidget {
  final Map<String, dynamic> student;
  final String templateId;
  final String templateName;
  final Color themeColor;

  const IdCardPreviewScreen({
    super.key,
    required this.student,
    required this.templateId,
    required this.templateName,
    required this.themeColor,
  });

  @override
  Widget build(BuildContext context) {
    // School Details
    const String schoolName = "JY INTERNATIONAL SCHOOL";
    const String schoolLogo = "https://ui-avatars.com/api/?name=School+Logo&background=0D8ABC&color=fff";

    // Student Details
    final String sName = student['user']?['name']?.toString().toUpperCase() ?? 'UNKNOWN';
    final String sPhoto = student['user']?['photoUrl'] ?? 'https://ui-avatars.com/api/?name=$sName&background=f1f5f9';
    final String sRoll = student['rollNo'] ?? 'N/A';
    final String sClass = "${student['class']?['name'] ?? ''} - ${student['class']?['section'] ?? ''}";
    final String sBlood = student['bloodGroup'] ?? 'N/A';
    final String sPhone = student['user']?['phone'] ?? 'N/A';
    final String sDob = student['dob'] != null ? student['dob'].toString().split('T')[0] : 'N/A';

    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        title: Text(templateName, style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white)),
        backgroundColor: themeColor,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              // The ID Card Rendered in Flutter UI
              Container(
                width: 300,
                height: 480, // CR80 proportion ~ 1:1.6
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withOpacity(0.2), blurRadius: 20, offset: const Offset(0, 10))
                  ],
                  border: Border.all(color: Colors.grey.shade300),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: _buildTemplate(templateId, schoolName, schoolLogo, sName, sPhoto, sRoll, sClass, sBlood, sPhone, sDob),
                ),
              ),
              const SizedBox(height: 40),
              
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: themeColor,
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                      elevation: 2,
                    ),
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Downloading as PDF...')));
                    },
                    icon: const Icon(Icons.download_rounded),
                    label: const Text('Download PDF'),
                  ),
                  const SizedBox(width: 16),
                  ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: themeColor,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                      elevation: 4,
                    ),
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Sharing ID Card...')));
                    },
                    icon: const Icon(Icons.share_rounded),
                    label: const Text('Share'),
                  ),
                ],
              )
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTemplate(
    String id, String schoolName, String schoolLogo, 
    String sName, String sPhoto, String sRoll, 
    String sClass, String sBlood, String sPhone, String sDob) 
  {
    // Build different layouts based on ID. For simplicity in Flutter, we provide a unified premium look
    // that uses the themeColor, but in a real app each would be a separate Widget.
    
    return Column(
      children: [
        // Header
        Container(
          width: double.infinity,
          height: 100,
          decoration: BoxDecoration(
            color: themeColor,
            borderRadius: const BorderRadius.only(bottomLeft: Radius.circular(30), bottomRight: Radius.circular(30)),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircleAvatar(radius: 20, backgroundColor: Colors.white, backgroundImage: NetworkImage(schoolLogo)),
              const SizedBox(height: 8),
              Text(schoolName, style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
            ],
          ),
        ),
        
        // Photo
        Transform.translate(
          offset: const Offset(0, -30),
          child: Container(
            padding: const EdgeInsets.all(4),
            decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
            child: CircleAvatar(
              radius: 50,
              backgroundImage: NetworkImage(sPhoto),
            ),
          ),
        ),
        
        // Details
        Transform.translate(
          offset: const Offset(0, -20),
          child: Column(
            children: [
              Text(sName, style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.black87), textAlign: TextAlign.center),
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                decoration: BoxDecoration(color: themeColor.withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
                child: Text(sRoll, style: GoogleFonts.poppins(color: themeColor, fontWeight: FontWeight.bold)),
              ),
              
              const SizedBox(height: 24),
              
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Column(
                  children: [
                    _buildRow('Class', sClass),
                    _buildRow('D.O.B', sDob),
                    _buildRow('Blood Grp', sBlood, isHighlight: true),
                    _buildRow('Phone', sPhone),
                  ],
                ),
              ),
            ],
          ),
        ),
        
        const Spacer(),
        // Footer
        Container(
          width: double.infinity,
          height: 40,
          color: themeColor,
          alignment: Alignment.center,
          child: const Text('Authorized Signatory', style: TextStyle(color: Colors.white, fontSize: 10)),
        ),
      ],
    );
  }

  Widget _buildRow(String label, String value, {bool isHighlight = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: GoogleFonts.poppins(fontSize: 12, color: Colors.grey.shade600, fontWeight: FontWeight.w600)),
          Text(value, style: GoogleFonts.poppins(fontSize: 12, color: isHighlight ? Colors.red : Colors.black87, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}
