import 'dart:ui' as ui;
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:share_plus/share_plus.dart';
import '../services/api_service.dart';

class SingleProgressCardScreen extends StatefulWidget {
  final String examId;
  final String classId;
  final String studentId;
  final Map<String, dynamic>? studentData;
  final String examName;
  final String className;

  const SingleProgressCardScreen({
    super.key,
    required this.examId,
    required this.classId,
    required this.studentId,
    this.studentData,
    required this.examName,
    required this.className,
  });

  @override
  State<SingleProgressCardScreen> createState() => _SingleProgressCardScreenState();
}

class _SingleProgressCardScreenState extends State<SingleProgressCardScreen> {
  bool _isLoading = true;
  String? _errorMessage;
  Map<String, dynamic>? _resultData;
  Map<String, dynamic>? _settingsData;
  final GlobalKey _repaintKey = GlobalKey();
  bool _isExporting = false;

  @override
  void initState() {
    super.initState();
    _fetchResult();
  }

  Future<void> _fetchResult() async {
    try {
      final res = await ApiService.getExamResults(widget.examId, classId: widget.classId);
      final setRes = await ApiService.getSettings();
      if (res['success']) {
        final List<dynamic> allResults = res['data'] ?? [];
        final studentResult = allResults.firstWhere((r) => r['studentId']?.toString() == widget.studentId, orElse: () => null);
        if (mounted) {
          setState(() {
            _resultData = studentResult;
            if (setRes['success']) _settingsData = setRes['data'];
            _isLoading = false;
          });
        }
      } else {
        if (mounted) {
          setState(() {
            _errorMessage = res['message'];
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Failed to load result: $e';
          _isLoading = false;
        });
      }
    }
  }

  Future<Uint8List?> _generatePdfBytes() async {
    RenderRepaintBoundary boundary = _repaintKey.currentContext!.findRenderObject() as RenderRepaintBoundary;
    ui.Image image = await boundary.toImage(pixelRatio: 3.0);
    ByteData? byteData = await image.toByteData(format: ui.ImageByteFormat.png);
    if (byteData == null) return null;
    
    Uint8List pngBytes = byteData.buffer.asUint8List();
    
    final pdf = pw.Document();
    final imageProvider = pw.MemoryImage(pngBytes);
    
    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        margin: pw.EdgeInsets.zero,
        build: (pw.Context context) {
          return pw.FullPage(
            ignoreMargins: true,
            child: pw.Image(imageProvider, fit: pw.BoxFit.fill),
          );
        },
      ),
    );
    
    return await pdf.save();
  }

  Future<void> _sharePdf() async {
    if (_isExporting) return;
    setState(() => _isExporting = true);
    try {
      final bytes = await _generatePdfBytes();
      if (bytes != null) {
        // Use share_plus to trigger the native share sheet where user can select WhatsApp
        // ignore: undefined_identifier, avoid_dynamic_calls
        await Share.shareXFiles([XFile.fromData(bytes, mimeType: 'application/pdf', name: '${widget.studentId}_progress_card.pdf')], text: 'Student Progress Card');
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to share: $e')));
    } finally {
      if (mounted) setState(() => _isExporting = false);
    }
  }

  Future<void> _downloadPdf() async {
    if (_isExporting) return;
    setState(() => _isExporting = true);
    try {
      final bytes = await _generatePdfBytes();
      if (bytes != null) {
        // Printing.sharePdf on Flutter Web triggers a direct file download.
        // On mobile, it acts as a layout/share, so we can also use Printing.layoutPdf.
        await Printing.sharePdf(bytes: bytes, filename: '${widget.studentId}_progress_card.pdf');
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to download: $e')));
    } finally {
      if (mounted) setState(() => _isExporting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        title: Text('Progress Card', style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
        iconTheme: const IconThemeData(color: Colors.white),
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(colors: [Color(0xFF2E2A66), Color(0xFF222854)], begin: Alignment.topLeft, end: Alignment.bottomRight),
          ),
        ),
        elevation: 0,
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator(color: Color(0xFF6366F1)))
        : _errorMessage != null
          ? Center(child: Text(_errorMessage!, style: GoogleFonts.poppins(color: Colors.red)))
          : _resultData == null
            ? Center(child: Text('No results found for this student.', style: GoogleFonts.poppins(color: const Color(0xFF94A3B8), fontSize: 15)))
            : _buildCardContent(),
      bottomNavigationBar: _isLoading || _resultData == null ? null : _buildBottomActions(),
    );
  }

  Widget _buildBottomActions() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -4))],
      ),
      child: SafeArea(
        child: Row(
          children: [
            Expanded(
              child: ElevatedButton.icon(
                onPressed: _isExporting ? null : _downloadPdf,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1A4A7A), 
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 2,
                ),
                icon: _isExporting 
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Icon(Icons.download_rounded, color: Colors.white),
                label: Text('Download PDF', style: GoogleFonts.outfit(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton.icon(
                onPressed: _isExporting ? null : _sharePdf,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF25D366), // WhatsApp Green
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 2,
                ),
                icon: _isExporting 
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Icon(Icons.share_rounded, color: Colors.white),
                label: Text('Share PDF', style: GoogleFonts.outfit(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCardContent() {
    String name = _resultData!['name']?.toString() ?? 'VENKATA SAI KUMAR';
    final rollNo = _resultData!['rollNo'] ?? 'SVJY-2026-045';
    final String fullClassName = _resultData!['className']?.toString() ?? widget.className;
    String clsName = fullClassName;
    String secName = _resultData!['section'] ?? widget.studentData?['section'] ?? 'Olympiad Batch';
    
    if (fullClassName.contains(' - ')) {
      final parts = fullClassName.split(' - ');
      clsName = parts[0];
      if (parts.length > 1) secName = parts[1];
    }

    final className = clsName.isNotEmpty ? clsName : 'Class X';
    final section = secName;
    final rank = _resultData!['rank']?.toString();
    final photoUrl = _resultData!['photo'];
    final initials = name.isNotEmpty ? name.substring(0, 1).toUpperCase() : '?';

    final totalMarksObtained = _resultData!['total'] ?? 0;
    int totalMaxMarks = 0;
    int getSubjectPriority(String subjectName) {
      String name = subjectName.toUpperCase();
      if (name.contains('TELUGU')) return 1;
      if (name.contains('HINDI')) return 2;
      if (name.contains('ENGLISH')) return 3;
      if (name.contains('MATH')) return 4;
      if (name.contains('PHYSICS')) return 5;
      if (name.contains('SCIENCE')) return 6;
      if (name.contains('CHEMISTRY')) return 7;
      if (name.contains('BOTANY')) return 8;
      if (name.contains('ZOOLOGY')) return 9;
      if (name.contains('SOCIAL')) return 10;
      return 99;
    }

    final marksList = List<dynamic>.from(_resultData!['marks'] as List? ?? []);
    marksList.sort((a, b) {
      final priorityA = getSubjectPriority(a['subject']?.toString() ?? '');
      final priorityB = getSubjectPriority(b['subject']?.toString() ?? '');
      return priorityA.compareTo(priorityB);
    });
    for(var m in marksList) { totalMaxMarks += (m['max'] as num?)?.toInt() ?? 100; }
    
    final percentage = _resultData!['percentage'] != null ? (_resultData!['percentage'] as num).toDouble() : 0.0;
    
    // Evaluate performance rating
    String ratingLabel = 'NEEDS IMPROVEMENT';
    String ratingComment = 'Needs immediate improvement and extra guidance.';
    Color ratingColor = const Color(0xFFE11D48);
    Color ratingBg = const Color(0xFFFFF1F2);
    Color ratingBorder = const Color(0xFFFECDD3);

    if (percentage >= 90) {
      ratingLabel = 'OUTSTANDING';
      ratingComment = 'Excellent performance! Keep up the brilliant work.';
      ratingColor = const Color(0xFF059669);
      ratingBg = const Color(0xFFECFDF5);
      ratingBorder = const Color(0xFFA7F3D0);
    } else if (percentage >= 80) {
      ratingLabel = 'EXCELLENT';
      ratingComment = 'Excellent effort. Very good academic results.';
      ratingColor = const Color(0xFF0D9488);
      ratingBg = const Color(0xFFF0FDFA);
      ratingBorder = const Color(0xFF99F6E4);
    } else if (percentage >= 70) {
      ratingLabel = 'VERY GOOD';
      ratingComment = 'Very good progress. With a bit more effort, you can reach outstanding.';
      ratingColor = const Color(0xFF4F46E5);
      ratingBg = const Color(0xFFEEF2FF);
      ratingBorder = const Color(0xFFC7D2FE);
    } else if (percentage >= 60) {
      ratingLabel = 'GOOD';
      ratingComment = 'Good work. Steady preparation will help secure higher grades.';
      ratingColor = const Color(0xFF2563EB);
      ratingBg = const Color(0xFFEFF6FF);
      ratingBorder = const Color(0xFFBFDBFE);
    } else if (percentage >= 50) {
      ratingLabel = 'SATISFACTORY';
      ratingComment = 'Satisfactory performance. Focus on regular practice.';
      ratingColor = const Color(0xFFD97706);
      ratingBg = const Color(0xFFFFFBEB);
      ratingBorder = const Color(0xFFFDE68A);
    } else if (percentage >= 35) {
      ratingLabel = 'AVERAGE';
      ratingComment = 'Average performance. Needs to study harder to improve grades.';
      ratingColor = const Color(0xFFEA580C);
      ratingBg = const Color(0xFFFFF7ED);
      ratingBorder = const Color(0xFFFED7AA);
    }

    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = screenWidth < 600;
    final hPadding = isMobile ? 12.0 : 24.0;
    final titleFontSize = isMobile ? 16.0 : 22.0;

    return SingleChildScrollView(
      padding: EdgeInsets.symmetric(horizontal: isMobile ? 8 : 16, vertical: 16),
      child: RepaintBoundary(
        key: _repaintKey,
        child: Center(
          child: Container(
          constraints: const BoxConstraints(maxWidth: 800),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 20, offset: const Offset(0, 10)),
            ],
            border: Border.all(color: const Color(0xFFF0E6D2), width: 1.5),
            gradient: const LinearGradient(
              colors: [Color(0xFFFFFFFF), Color(0xFFFDFCF9)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Top Bar Gradient
              Container(
                height: 8,
                decoration: const BoxDecoration(
                  borderRadius: BorderRadius.only(topLeft: Radius.circular(10), topRight: Radius.circular(10)),
                  gradient: LinearGradient(
                    colors: [Color(0xFF0B1A33), Color(0xFF1A4A7A), Color(0xFFF39C12), Color(0xFFD4A017)],
                    stops: [0.0, 0.3, 0.6, 1.0],
                  ),
                ),
              ),

              // Header Section
              Container(
                padding: EdgeInsets.fromLTRB(hPadding, 16, hPadding, 12),
                decoration: const BoxDecoration(
                  border: Border(bottom: BorderSide(color: Color(0xFFF39C12), width: 3)),
                ),
                child: Row(
                  children: [
                    // Logo
                    Container(
                      width: isMobile ? 50 : 60, height: isMobile ? 50 : 60,
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        shape: BoxShape.circle,
                        border: Border.all(color: const Color(0xFF1A4A7A), width: 2),
                      ),
                      child: (_settingsData != null && _settingsData!['logoUrl'] != null && _settingsData!['logoUrl'].toString().isNotEmpty)
                          ? ClipOval(child: Image.network(ApiService.getImageUrl(_settingsData!['logoUrl']), fit: BoxFit.cover, headers: const {'ngrok-skip-browser-warning': '69420'}, errorBuilder: (_,__,___) => Icon(Icons.workspace_premium, size: isMobile ? 26 : 30, color: const Color(0xFF1A4A7A))))
                          : Icon(Icons.workspace_premium, size: isMobile ? 26 : 30, color: const Color(0xFF1A4A7A)),
                    ),
                    const SizedBox(width: 8),
                    // Title
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Text(
                            (_settingsData != null && _settingsData!['schoolName'] != null) 
                                ? _settingsData!['schoolName'].toString().toUpperCase()
                                : 'SRI VENKATESWARA JY SCHOOL',
                            textAlign: TextAlign.center,
                            style: GoogleFonts.lora(fontSize: isMobile ? 15 : 22, fontWeight: FontWeight.w900, color: const Color(0xFF0B1A33), letterSpacing: 1.0),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '(IIT-JEE / NEET Foundation · Olympiads)',
                            textAlign: TextAlign.center,
                            style: GoogleFonts.poppins(fontSize: isMobile ? 10 : 11, fontWeight: FontWeight.w500, color: const Color(0xFF1A4A7A), letterSpacing: 0.5),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            (_settingsData != null && _settingsData!['address'] != null && _settingsData!['address'].toString().isNotEmpty)
                                ? _settingsData!['address'].toString()
                                : 'SVL Paradise Campus, Narasannapeta',
                            textAlign: TextAlign.center,
                            style: GoogleFonts.poppins(fontSize: isMobile ? 9 : 10, color: const Color(0xFF5A7A8A)),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            widget.examName.toUpperCase(),
                            textAlign: TextAlign.center,
                            style: GoogleFonts.outfit(fontSize: isMobile ? 12 : 14, fontWeight: FontWeight.bold, color: const Color(0xFF0B1A33), letterSpacing: 1.2),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '✦ RESULT CARD ✦',
                            textAlign: TextAlign.center,
                            style: GoogleFonts.outfit(fontSize: isMobile ? 10 : 12, fontWeight: FontWeight.bold, color: const Color(0xFFD4A017), letterSpacing: 2),
                          ),
                        ],
                      ),
                    ),
                    SizedBox(width: (isMobile ? 50 : 60) + 8), // Spacer to balance logo
                  ],
                ),
              ),

              // Decorative Line
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text('✦', style: TextStyle(color: Color(0xFFD4A017), fontSize: 12)),
                    const SizedBox(width: 8),
                    Container(width: 40, height: 1.5, color: const Color(0xFFF39C12)),
                    const SizedBox(width: 8),
                    const Text('★', style: TextStyle(color: Color(0xFFD4A017), fontSize: 14)),
                    const SizedBox(width: 8),
                    Container(width: 40, height: 1.5, color: const Color(0xFFF39C12)),
                    const SizedBox(width: 8),
                    const Text('✦', style: TextStyle(color: Color(0xFFD4A017), fontSize: 12)),
                  ],
                ),
              ),

              // Student Info
              Container(
                margin: EdgeInsets.symmetric(horizontal: hPadding, vertical: 8),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF8F0),
                  border: Border.all(color: const Color(0xFFF39C12), width: 2),
                  borderRadius: BorderRadius.circular(10),
                  boxShadow: [BoxShadow(color: const Color(0xFFF39C12).withOpacity(0.1), blurRadius: 10, offset: const Offset(0, 4))],
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Expanded(
                      child: Column(
                        children: [
                          _buildPremiumInfoRow('👤 Name', name.toUpperCase(), isEven: false, isMobile: isMobile),
                          _buildPremiumInfoRow('🆔 ID', rollNo.toString(), isEven: true, isMobile: isMobile),
                          _buildPremiumInfoRow('📚 Class', className, isEven: false, isMobile: isMobile),
                          _buildPremiumInfoRow('📖 Section', section, isEven: true, isMobile: isMobile),
                          _buildPremiumInfoRow('📅 Year', '2026-2027', isEven: false, isLast: rank == null, isMobile: isMobile),
                          if (rank != null)
                            _buildPremiumInfoRow('🏅 Rank', '#' + rank, isEven: true, isLast: true, isMobile: isMobile),
                        ],
                      ),
                    ),
                    Container(
                      width: isMobile ? 80 : 110,
                      padding: EdgeInsets.all(isMobile ? 8 : 12),
                      decoration: const BoxDecoration(
                        border: Border(left: BorderSide(color: Color(0xFFF5EDE4), width: 2)),
                      ),
                      child: Center(
                        child: Container(
                          width: isMobile ? 65 : 85, 
                          height: isMobile ? 80 : 105,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            border: Border.all(color: const Color(0xFFF39C12), width: 3),
                            borderRadius: BorderRadius.circular(6),
                            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 8)],
                          ),
                          child: (photoUrl != null && photoUrl.toString().isNotEmpty)
                            ? ClipRRect(borderRadius: BorderRadius.circular(2), child: Image.network(ApiService.getImageUrl(photoUrl.toString()), fit: BoxFit.cover, errorBuilder: (c, e, s) => _buildPhotoPlaceholder(initials, isMobile)))
                            : _buildPhotoPlaceholder('📷', isMobile),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // Performance Table
              Padding(
                padding: EdgeInsets.fromLTRB(hPadding, 12, hPadding, 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Row(
                            children: [
                              const Text('📊', style: TextStyle(fontSize: 16)),
                              const SizedBox(width: 8),
                              Expanded(child: Text('Performance Summary', style: GoogleFonts.poppins(fontSize: isMobile ? 13 : 15, fontWeight: FontWeight.bold, color: const Color(0xFF0B1A33)), overflow: TextOverflow.ellipsis)),
                            ],
                          ),
                        ),
                        Text('Max: ' + totalMaxMarks.toString(), style: GoogleFonts.poppins(fontSize: 11, color: const Color(0xFF6A8AAA))),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Container(
                      decoration: BoxDecoration(
                        border: Border.all(color: const Color(0xFFE8E0D8), width: 2),
                        borderRadius: BorderRadius.circular(10),
                        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 8)],
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Column(
                          children: [
                            // Table Header
                            Container(
                              decoration: const BoxDecoration(
                                gradient: LinearGradient(colors: [Color(0xFF0B1A33), Color(0xFF1A4A7A)]),
                              ),
                              padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 8),
                              child: Row(
                                children: [
                                  Expanded(flex: 3, child: Text('SUBJECT', style: GoogleFonts.poppins(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white, letterSpacing: 0.5))),
                                  Expanded(flex: 1, child: Text('MRK', textAlign: TextAlign.center, style: GoogleFonts.poppins(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white, letterSpacing: 0.5))),
                                  Expanded(flex: 1, child: Text('MAX', textAlign: TextAlign.center, style: GoogleFonts.poppins(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white, letterSpacing: 0.5))),
                                  Expanded(flex: 1, child: Text('%', textAlign: TextAlign.center, style: GoogleFonts.poppins(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white, letterSpacing: 0.5))),
                                ],
                              ),
                            ),
                            // Table Rows
                            ...marksList.asMap().entries.map((entry) {
                              final int idx = entry.key;
                              final sm = entry.value;
                              final subName = sm['subject']?.toString() ?? 'UNKNOWN';
                              final obt = (sm['obtained'] as num?)?.toDouble() ?? 0.0;
                              final max = (sm['max'] as num?)?.toDouble() ?? 100.0;
                              final subPct = max > 0 ? (obt / max * 100).toStringAsFixed(1) : '0.0';
                              final isEven = idx % 2 != 0;

                              return Container(
                                decoration: BoxDecoration(
                                  color: isEven ? const Color(0xFFFDFCF9) : Colors.white,
                                  border: const Border(bottom: BorderSide(color: Color(0xFFE8E0D8))),
                                ),
                                padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 8),
                                child: Row(
                                  children: [
                                    Expanded(flex: 3, child: Row(
                                      children: [
                                        const Text('📘', style: TextStyle(fontSize: 10)),
                                        const SizedBox(width: 6),
                                        Expanded(child: Text(subName, style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.w600, color: const Color(0xFF1A3A5A)), overflow: TextOverflow.ellipsis)),
                                      ],
                                    )),
                                    Expanded(flex: 1, child: Text(obt.toStringAsFixed(obt.truncateToDouble() == obt ? 0 : 1), textAlign: TextAlign.center, style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold, color: const Color(0xFF0B1A33)))),
                                    Expanded(flex: 1, child: Text(max.toStringAsFixed(0), textAlign: TextAlign.center, style: GoogleFonts.poppins(fontSize: 11, color: const Color(0xFF6A8AAA)))),
                                    Expanded(flex: 1, child: Text(subPct + '%', textAlign: TextAlign.center, style: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFF1A4A7A)))),
                                  ],
                                ),
                              );
                            }),
                            // Total Row
                            Container(
                              decoration: const BoxDecoration(
                                gradient: LinearGradient(colors: [Color(0xFFFDF9F4), Color(0xFFFFF3E0)]),
                                border: Border(top: BorderSide(color: Color(0xFFF39C12), width: 2)),
                              ),
                              padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 8),
                              child: Row(
                                children: [
                                  Expanded(flex: 3, child: Text('📌 TOTAL', style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.w900, color: const Color(0xFF0B1A33), letterSpacing: 0.5))),
                                  Expanded(flex: 1, child: Text(totalMarksObtained.toString(), textAlign: TextAlign.center, style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w900, color: const Color(0xFFC0392B)))),
                                  Expanded(flex: 1, child: Text(totalMaxMarks.toString(), textAlign: TextAlign.center, style: GoogleFonts.poppins(fontSize: 11, color: const Color(0xFF6A8AAA)))),
                                  Expanded(flex: 1, child: Text(percentage.toStringAsFixed(1) + '%', textAlign: TextAlign.center, style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold, color: const Color(0xFF1A4A7A)))),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // Rating Box
              Container(
                margin: EdgeInsets.symmetric(horizontal: hPadding, vertical: 8),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                decoration: BoxDecoration(
                  color: ratingBg,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: ratingBorder),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('ACADEMIC RATING', style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.bold, color: ratingColor.withOpacity(0.8), letterSpacing: 0.5)),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: ratingBorder),
                          ),
                          child: Text(ratingLabel, style: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.w900, color: ratingColor)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      '"' + ratingComment + '"',
                      style: GoogleFonts.lora(fontSize: 11, fontStyle: FontStyle.italic, fontWeight: FontWeight.w600, color: const Color(0xFF475569)),
                    ),
                  ],
                ),
              ),

              // Footer
              Container(
                margin: EdgeInsets.fromLTRB(hPadding, 8, hPadding, 16),
                padding: const EdgeInsets.only(top: 12),
                decoration: const BoxDecoration(
                  border: Border(top: BorderSide(color: Color(0xFFDCE4ED), width: 2, style: BorderStyle.solid)),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Total Info
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('📋 TOTAL MARKS: ' + totalMarksObtained.toString() + ' / ' + totalMaxMarks.toString(), style: GoogleFonts.poppins(fontSize: isMobile ? 12 : 14, fontWeight: FontWeight.w800, color: const Color(0xFF1A4A7A))),
                          Text(percentage.toStringAsFixed(1) + '%', style: GoogleFonts.outfit(fontSize: isMobile ? 32 : 40, fontWeight: FontWeight.w900, color: const Color(0xFFC0392B), height: 1.1)),
                        ],
                      ),
                    ),
                    // Signatures
                    Row(
                      children: [
                        Column(
                          children: [
                            Container(width: isMobile ? 70 : 90, height: 1.5, color: const Color(0xFFC8D6E4), margin: const EdgeInsets.only(bottom: 6, top: 20)),
                            Text('✍ Teacher Signature', style: GoogleFonts.poppins(fontSize: isMobile ? 9 : 10, fontWeight: FontWeight.w600, color: const Color(0xFF1A3A5A))),
                          ],
                        ),
                        SizedBox(width: isMobile ? 12 : 24),
                        Column(
                          children: [
                            Container(width: isMobile ? 70 : 90, height: 1.5, color: const Color(0xFFC8D6E4), margin: const EdgeInsets.only(bottom: 6, top: 20)),
                            Text('✍ Principal Signature', style: GoogleFonts.poppins(fontSize: isMobile ? 9 : 10, fontWeight: FontWeight.w600, color: const Color(0xFF1A3A5A))),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // Bottom Note
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 8),
                decoration: const BoxDecoration(
                  color: Color(0xFF0B1A33),
                  borderRadius: BorderRadius.only(bottomLeft: Radius.circular(10), bottomRight: Radius.circular(10)),
                ),
                child: Text(
                  '★ System generated result card for ' + widget.examName + ' ★',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.poppins(fontSize: 9, fontWeight: FontWeight.w500, color: const Color(0xFFAABACA), letterSpacing: 0.5),
                ),
              ),
            ],
          ),
        ),
      ),
      ),
    );
  }

  Widget _buildPremiumInfoRow(String label, String value, {required bool isEven, bool isLast = false, required bool isMobile}) {
    return Container(
      decoration: BoxDecoration(
        color: isEven ? const Color(0xFFFEFCF9) : Colors.transparent,
        border: isLast ? null : const Border(bottom: BorderSide(color: Color(0xFFF5EDE4))),
      ),
      child: Row(
        children: [
          Container(
            width: isMobile ? 80 : 120,
            padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 8),
            decoration: const BoxDecoration(
              color: Color(0xFFFDF9F4),
              border: Border(right: BorderSide(color: Color(0xFFF5EDE4))),
            ),
            child: Text(label, style: GoogleFonts.poppins(fontSize: isMobile ? 9 : 11, fontWeight: FontWeight.w700, color: const Color(0xFF6A3A1A))),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 8),
              child: Text(value, style: GoogleFonts.outfit(fontSize: isMobile ? 11 : 13, fontWeight: FontWeight.w800, color: const Color(0xFF0B1A33)), maxLines: 1, overflow: TextOverflow.ellipsis),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPhotoPlaceholder(String text, bool isMobile) {
    return Center(
      child: Text(text, style: GoogleFonts.outfit(fontSize: isMobile ? 24 : 32, fontWeight: FontWeight.bold, color: const Color(0xFF8A7A6A))),
    );
  }
}




