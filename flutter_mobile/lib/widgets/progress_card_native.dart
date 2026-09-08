import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class ProgressCardNative extends StatelessWidget {
  final Map<String, dynamic> data;
  final Map<String, dynamic> settings;

  const ProgressCardNative({
    Key? key,
    required this.data,
    required this.settings,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // Extracting Data with fallbacks
    final String studentName = data['studentName'] ?? "Student Name";
    final String rollNo = data['rollNo'] ?? "Roll No";
    final String className = data['className'] ?? "Class";
    final String section = data['section'] ?? "Section";
    final String mobile = data['mobile'] ?? "";
    final String rank = data['rank']?.toString() ?? "";
    final String academicYear = data['academicYear'] ?? "2026-2027";
    final String location = data['location'] ?? "School Location";
    final String photo = data['photo'] ?? "";
    
    final List<dynamic> marksList = data['marks'] ?? [];
    double totalObtained = 0;
    double totalMax = 0;
    
    for (var m in marksList) {
      totalObtained += double.tryParse(m['obtained']?.toString() ?? '0') ?? 0;
      totalMax += double.tryParse(m['maxMarks']?.toString() ?? '100') ?? 100;
    }
    
    if (totalMax == 0) totalMax = 100; // prevent div zero
    final double totalPct = (totalObtained / totalMax) * 100;

    return Container(
      color: Colors.white,
      padding: const EdgeInsets.all(12),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border.all(color: const Color(0xFF0B1A33), width: 2),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          children: [
            // Top thin bar
            Container(
              height: 6,
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF0B1A33), Color(0xFF1A4A7A), Color(0xFFF39C12)],
                ),
              ),
            ),
            
            // Header Section
            Container(
              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
              decoration: const BoxDecoration(
                border: Border(bottom: BorderSide(color: Color(0xFFF39C12), width: 3)),
              ),
              child: Column(
                children: [
                  Text(
                    settings['schoolName'] ?? 'JY SCHOOL',
                    style: const TextStyle(
                      fontFamily: 'Times New Roman',
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF0B1A33),
                      letterSpacing: 1.2,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    settings['address'] ?? 'Opp. Hero Showroom, Narasannapeta',
                    style: GoogleFonts.outfit(
                      fontSize: 10,
                      color: const Color(0xFF5A7A8A),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    data['examName'] ?? 'EXAMINATION RESULT CARD',
                    style: GoogleFonts.outfit(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFF0B1A33),
                      letterSpacing: 1.5,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.star, color: Color(0xFFD4A017), size: 12),
                      const SizedBox(width: 8),
                      Text(
                        'RESULT CARD',
                        style: GoogleFonts.outfit(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFFD4A017),
                          letterSpacing: 2,
                        ),
                      ),
                      const SizedBox(width: 8),
                      const Icon(Icons.star, color: Color(0xFFD4A017), size: 12),
                    ],
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 12),
            
            // Student Info Table
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Container(
                decoration: BoxDecoration(
                  border: Border.all(color: const Color(0xFFF39C12), width: 1.5),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        children: [
                          _buildInfoRow('STUDENT NAME', studentName, Icons.person, true),
                          _buildInfoRow('STUDENT ID', rollNo, Icons.badge, false),
                          _buildInfoRow('CLASS', className, Icons.school, true),
                          _buildInfoRow('SECTION', section, Icons.class_, false),
                          _buildInfoRow('MOBILE', mobile, Icons.phone, true),
                          _buildInfoRow('ACADEMIC YEAR', academicYear, Icons.calendar_today, false),
                          _buildInfoRow('CLASS RANK', rank.isNotEmpty ? '#$rank' : '-', Icons.emoji_events, true),
                        ],
                      ),
                    ),
                    // Photo Column
                    Container(
                      width: 100,
                      padding: const EdgeInsets.all(8),
                      decoration: const BoxDecoration(
                        border: Border(left: BorderSide(color: Color(0xFFF5EDE4), width: 1.5)),
                        color: Color(0xFFFCF7EF),
                      ),
                      child: Container(
                        height: 110,
                        decoration: BoxDecoration(
                          border: Border.all(color: const Color(0xFFF39C12), width: 2),
                          borderRadius: BorderRadius.circular(4),
                          color: Colors.white,
                        ),
                        child: (photo.isNotEmpty)
                          ? Image.network(photo, fit: BoxFit.cover, errorBuilder: (_,__,___) => const Icon(Icons.person, size: 50, color: Colors.grey))
                          : const Icon(Icons.camera_alt, size: 40, color: Colors.grey),
                      ),
                    )
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 16),
            
            // Performance Summary
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.bar_chart, color: Color(0xFF1A4A7A), size: 18),
                      const SizedBox(width: 8),
                      Text('Performance Summary', style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.bold, color: const Color(0xFF0B1A33))),
                    ],
                  ),
                  Text('Max Marks: ${totalMax.toInt()}', style: GoogleFonts.outfit(fontSize: 11, color: const Color(0xFF6A8AAA))),
                ],
              ),
            ),
            
            const SizedBox(height: 8),
            
            // Marks Table
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Container(
                decoration: BoxDecoration(
                  border: Border.all(color: const Color(0xFFE8E0D8), width: 1.5),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  children: [
                    // Table Header
                    Container(
                      decoration: const BoxDecoration(
                        color: Color(0xFF0B1A33),
                        borderRadius: BorderRadius.only(topLeft: Radius.circular(6), topRight: Radius.circular(6)),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
                      child: Row(
                        children: [
                          Expanded(flex: 3, child: Text('SUBJECT', style: GoogleFonts.outfit(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold))),
                          Expanded(flex: 2, child: Center(child: Text('MARKS', style: GoogleFonts.outfit(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)))),
                          Expanded(flex: 2, child: Center(child: Text('MAX MARKS', style: GoogleFonts.outfit(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)))),
                          Expanded(flex: 2, child: Center(child: Text('%', style: GoogleFonts.outfit(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)))),
                        ],
                      ),
                    ),
                    
                    // Table Rows
                    ...marksList.asMap().entries.map((entry) {
                      int idx = entry.key;
                      var m = entry.value;
                      bool isEven = idx % 2 == 0;
                      double obt = double.tryParse(m['obtained']?.toString() ?? '0') ?? 0;
                      double mx = double.tryParse(m['maxMarks']?.toString() ?? '100') ?? 100;
                      double pct = mx > 0 ? (obt/mx)*100 : 0;
                      
                      return Container(
                        color: isEven ? Colors.white : const Color(0xFFFDFCF9),
                        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
                        child: Row(
                          children: [
                            Expanded(flex: 3, child: Row(
                              children: [
                                Container(width: 6, height: 6, color: const Color(0xFF3498DB), margin: const EdgeInsets.only(right: 6)),
                                Expanded(child: Text(m['subject'] ?? 'Unknown', style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF1A3A5A)), overflow: TextOverflow.ellipsis)),
                              ],
                            )),
                            Expanded(flex: 2, child: Center(child: Text(obt.toStringAsFixed(0), style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.bold, color: const Color(0xFF0B1A33))))),
                            Expanded(flex: 2, child: Center(child: Text(mx.toStringAsFixed(0), style: GoogleFonts.outfit(fontSize: 12, color: const Color(0xFF6A8AAA))))),
                            Expanded(flex: 2, child: Center(child: Text('${pct.toStringAsFixed(1)}%', style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold, color: const Color(0xFF1A4A7A))))),
                          ],
                        ),
                      );
                    }).toList(),
                    
                    // Total Row
                    Container(
                      decoration: const BoxDecoration(
                        color: Color(0xFFFDF9F4),
                        border: Border(top: BorderSide(color: Color(0xFFF39C12), width: 2)),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
                      child: Row(
                        children: [
                          Expanded(flex: 3, child: Row(
                            children: [
                              const Icon(Icons.push_pin, color: Colors.red, size: 14),
                              const SizedBox(width: 4),
                              Text('TOTAL', style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w900, color: const Color(0xFF0B1A33))),
                            ],
                          )),
                          Expanded(flex: 2, child: Center(child: Text(totalObtained.toStringAsFixed(0), style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w900, color: Colors.red.shade700)))),
                          Expanded(flex: 2, child: Center(child: Text(totalMax.toStringAsFixed(0), style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF6A8AAA))))),
                          Expanded(flex: 2, child: Center(child: Text('${totalPct.toStringAsFixed(1)}%', style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.bold, color: const Color(0xFF1A4A7A))))),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 16),
            
            // Progress Bar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: LinearProgressIndicator(
                      value: totalPct / 100,
                      backgroundColor: const Color(0xFFEEF2F7),
                      valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF3498DB)),
                      minHeight: 12,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('0', style: GoogleFonts.outfit(fontSize: 10, color: Colors.grey)),
                      Text('Threshold: 35%', style: GoogleFonts.outfit(fontSize: 10, color: Colors.grey)),
                      Text(totalMax.toStringAsFixed(0), style: GoogleFonts.outfit(fontSize: 10, color: Colors.grey)),
                    ],
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Footer Signatures
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('TOTAL MARKS: ${totalObtained.toStringAsFixed(0)} / ${totalMax.toStringAsFixed(0)}', style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.bold, color: const Color(0xFF1A4A7A))),
                      Text('${totalPct.toStringAsFixed(1)}%', style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.w900, color: Colors.red.shade700)),
                    ],
                  ),
                  Row(
                    children: [
                      _buildSignatureLine('Teacher Signature'),
                      const SizedBox(width: 24),
                      _buildSignatureLine('Principal Signature'),
                    ],
                  )
                ],
              ),
            ),
            
            // Bottom Thin Bar
            Container(
              padding: const EdgeInsets.symmetric(vertical: 4),
              color: const Color(0xFF0B1A33),
              child: Center(
                child: Text(
                  '★ This is a system-generated result card ★',
                  style: GoogleFonts.outfit(fontSize: 8, color: Colors.white70, letterSpacing: 1.5),
                ),
              ),
            )
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value, IconData icon, bool isEven) {
    return Container(
      decoration: BoxDecoration(
        color: isEven ? const Color(0xFFFDF9F4) : const Color(0xFFFEFCF9),
        border: const Border(bottom: BorderSide(color: Color(0xFFF5EDE4))),
      ),
      child: Row(
        children: [
          Container(
            width: 130,
            padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 10),
            decoration: const BoxDecoration(
              border: Border(right: BorderSide(color: Color(0xFFF5EDE4))),
            ),
            child: Row(
              children: [
                Icon(icon, size: 12, color: const Color(0xFF6A3A1A)),
                const SizedBox(width: 6),
                Expanded(child: Text(label, style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w600, color: const Color(0xFF6A3A1A)))),
              ],
            ),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 10),
              child: Text(value, style: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFF0B1A33)), maxLines: 1, overflow: TextOverflow.ellipsis),
            ),
          )
        ],
      ),
    );
  }

  Widget _buildSignatureLine(String title) {
    return Column(
      children: [
        const SizedBox(height: 24),
        Container(
          width: 90,
          height: 1,
          color: Colors.grey.shade400,
        ),
        const SizedBox(height: 4),
        Row(
          children: [
            const Icon(Icons.edit, size: 10, color: Color(0xFFD4A017)),
            const SizedBox(width: 4),
            Text(title, style: GoogleFonts.outfit(fontSize: 9, fontWeight: FontWeight.w600, color: const Color(0xFF0B1A33))),
          ],
        )
      ],
    );
  }
}
