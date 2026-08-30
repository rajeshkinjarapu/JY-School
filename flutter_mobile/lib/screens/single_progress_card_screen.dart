import 'dart:ui' as ui;
import 'dart:convert';
import '../widgets/custom_network_image.dart';
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
  final bool autoShare;

  const SingleProgressCardScreen({
    super.key,
    required this.examId,
    required this.classId,
    required this.studentId,
    this.studentData,
    required this.examName,
    required this.className,
    this.autoShare = false,
  });

  @override
  State<SingleProgressCardScreen> createState() => _SingleProgressCardScreenState();
}

class _SingleProgressCardScreenState extends State<SingleProgressCardScreen> {
  bool _isLoading = true;
  String? _errorMessage;
  Map<String, dynamic>? _resultData;
  Map<String, dynamic>? _settingsData;
  Map<String, dynamic>? _examData;
  final GlobalKey _repaintKey = GlobalKey();
  bool _isExporting = false;

  @override
  void initState() {
    super.initState();
    _fetchResult();
  }

  Future<void> _fetchResult() async {
    try {
      final res = await ApiService.getExamResults(widget.examId, classId: widget.classId, includePhoto: true);
      final setRes = await ApiService.getSettings();
      final examRes = await ApiService.getExamById(widget.examId);
      if (res['success']) {
        final List<dynamic> allResults = res['data'] ?? [];
        final studentResult = allResults.firstWhere((r) => r['studentId']?.toString() == widget.studentId, orElse: () => null);
        if (mounted) {
          setState(() {
            _resultData = studentResult;
            if (setRes['success']) _settingsData = setRes['data'];
            if (examRes['success']) _examData = examRes['data'];
            _isLoading = false;
          });
          
          if (widget.autoShare && studentResult != null) {
            // Give UI a moment to render the repaint boundary
            Future.delayed(const Duration(milliseconds: 800), () {
              if (mounted) _sharePdf();
            });
          }
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

    // Parse admit card settings safely
    Map<String, dynamic> admitCardSettings = {};
    if (_examData != null && _examData!['admitCardSettings'] != null) {
       final acs = _examData!['admitCardSettings'];
       if (acs is String) {
          try { admitCardSettings = jsonDecode(acs); } catch (_) {}
       } else if (acs is Map) {
          admitCardSettings = Map<String, dynamic>.from(acs);
       }
    }

    // Extract subjects from the exam or settings
    List<dynamic> examSubjects = [];
    if (_examData != null && _examData!['subjects'] != null) {
      final sub = _examData!['subjects'];
      if (sub is String) {
        try { examSubjects = jsonDecode(sub); } catch (_) {}
      } else if (sub is List) {
        examSubjects = sub;
      }
    } else if (_settingsData != null && _settingsData!['subjects'] != null) {
      final sub = _settingsData!['subjects'];
      if (sub is String) {
        try { examSubjects = jsonDecode(sub); } catch (_) {}
      } else if (sub is List) {
        examSubjects = sub;
      }
    }

    final rawMarksList = List<dynamic>.from(_resultData!['marks'] as List? ?? []);
    List<Map<String, dynamic>> finalMarks = [];

    if (examSubjects.isNotEmpty) {
      for (var sub in examSubjects) {
        final subName = sub['name']?.toString() ?? '';
        final maxM = (sub['maxMarks'] as num?)?.toDouble() ?? 100.0;
        
        var studentMark;
        for (var m in rawMarksList) {
          final mName = m['subject']?.toString() ?? '';
          if (mName.isEmpty) continue;
          if (mName.toLowerCase() == subName.toLowerCase() ||
              subName.toLowerCase().contains(mName.toLowerCase()) ||
              mName.toLowerCase().contains(subName.toLowerCase())) {
            studentMark = m;
            break;
          }
        }
        
        final obtained = studentMark != null ? studentMark['obtained'] : '-';
        finalMarks.add({
          'subject': subName,
          'maxMarks': maxM,
          'obtained': obtained,
        });
      }
    } else {
      for (var m in rawMarksList) {
        finalMarks.add({
          'subject': m['subject'],
          'maxMarks': (m['max'] as num?)?.toDouble() ?? (m['maxMarks'] as num?)?.toDouble() ?? 100.0,
          'obtained': m['obtained'],
        });
      }
    }

    double totalMaxMarks = 0;
    double calculatedTotalObtained = 0;
    for (var m in finalMarks) {
      totalMaxMarks += (m['maxMarks'] as num?)?.toDouble() ?? 100.0;
      final obtStr = m['obtained'].toString();
      final obtNum = double.tryParse(obtStr);
      if (obtNum != null) {
        calculatedTotalObtained += obtNum;
      }
    }
    
    final percentage = totalMaxMarks > 0 ? (calculatedTotalObtained / totalMaxMarks * 100) : 0.0;
    final totalMarksObtainedStr = calculatedTotalObtained.toStringAsFixed(calculatedTotalObtained.truncateToDouble() == calculatedTotalObtained ? 0 : 1);

    
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

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 16),
      child: Center(
        child: FittedBox(
          fit: BoxFit.contain,
          child: RepaintBoundary(
            key: _repaintKey,
            child: Container(
              width: 794,
              height: 1123,
              decoration: BoxDecoration(
                color: Colors.white,
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
                    height: 10,
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Color(0xFF0B1A33), Color(0xFF1A4A7A), Color(0xFFF39C12), Color(0xFFD4A017)],
                        stops: [0.0, 0.3, 0.6, 1.0],
                      ),
                    ),
                  ),

                  // Header Section
                  Container(
                    padding: const EdgeInsets.fromLTRB(32, 12, 32, 10),
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      border: Border(bottom: BorderSide(color: Color(0xFFF39C12), width: 3)),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        // Logo - check admitCardSettings first (exam-specific), then global school settings
                        Builder(builder: (ctx) {
                          final logoFromExam = admitCardSettings['logoUrl'] != null && admitCardSettings['logoUrl'].toString().isNotEmpty
                              ? admitCardSettings['logoUrl'].toString()
                              : null;
                          final logoFromSettings = _settingsData != null && _settingsData!['logoUrl'] != null && _settingsData!['logoUrl'].toString().isNotEmpty
                              ? _settingsData!['logoUrl'].toString()
                              : null;
                          final logoUrl = logoFromExam ?? logoFromSettings;
                          return Container(
                            width: 100,
                            height: 90,
                            alignment: Alignment.center,
                            child: logoUrl != null
                                ? CustomNetworkImage(
                                    ApiService.getImageUrl(logoUrl),
                                    fit: BoxFit.contain,
                                    headers: const {'ngrok-skip-browser-warning': '69420'},
                                    errorBuilder: (_, __, ___) => const Icon(Icons.workspace_premium, size: 48, color: Color(0xFF1A4A7A)),
                                  )
                                : const Icon(Icons.workspace_premium, size: 48, color: Color(0xFF1A4A7A)),
                          );
                        }),
                        // Title
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [
                              Text(
                                'SRI VENKATESWARA JY SCHOOL',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontFamily: 'Times New Roman',
                                  fontSize: 28,
                                  fontWeight: FontWeight.w900,
                                  color: const Color(0xFF0B1A33),
                                  letterSpacing: 1.5,
                                  height: 1.2,
                                  shadows: [Shadow(color: Colors.black.withOpacity(0.05), offset: const Offset(1, 1))],
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                '(IIT-JEE / NEET Foundation · Olympiads)',
                                textAlign: TextAlign.center,
                                style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w400, color: const Color(0xFF1A4A7A), letterSpacing: 0.8),
                              ),
                                Text(
                                  'Narasannapeta',
                                  textAlign: TextAlign.center,
                                  style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w400, color: const Color(0xFF5A7A8A), letterSpacing: 0.3),
                                ),
                                const SizedBox(height: 6),
                              Text(
                                widget.examName.toUpperCase(),
                                textAlign: TextAlign.center,
                                style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.w400, color: const Color(0xFF0B1A33), letterSpacing: 2),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                '✦ RESULT CARD ✦',
                                textAlign: TextAlign.center,
                                style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w400, color: const Color(0xFFD4A017), letterSpacing: 4),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 100), // Spacer to balance logo
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
                margin: const EdgeInsets.symmetric(horizontal: 28, vertical: 10),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF8F0),
                  border: Border.all(color: const Color(0xFFF39C12), width: 2),
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [BoxShadow(color: const Color(0xFFF39C12).withOpacity(0.12), blurRadius: 20, offset: const Offset(0, 6))],
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        children: [
                          _buildPremiumInfoRow('👤 Student Name', name.toUpperCase(), isEven: false),
                          _buildPremiumInfoRow('🆔 Student ID', rollNo.toString(), isEven: true),
                          _buildPremiumInfoRow('📚 Class', className, isEven: false),
                          _buildPremiumInfoRow('📖 Section', section, isEven: true),
                          _buildPremiumInfoRow('📞 Mobile', _resultData!['mobile']?.toString() ?? widget.studentData?['mobile']?.toString() ?? 'N/A', isEven: false),
                          _buildPremiumInfoRow('📅 Academic Year', '2026-2027', isEven: true),
                          _buildPremiumInfoRow('📍 Location', 'Narasannapeta', isEven: false, isLast: rank == null),
                          if (rank != null)
                            _buildPremiumInfoRow('🏅 Class Rank', '#' + rank, isEven: true, isLast: true),
                        ],
                      ),
                    ),
                    Container(
                      width: 120,
                      padding: const EdgeInsets.fromLTRB(10, 10, 16, 10),
                      decoration: const BoxDecoration(
                        border: Border(left: BorderSide(color: Color(0xFFF5EDE4), width: 2)),
                        gradient: LinearGradient(colors: [Color(0xFFFEFCF9), Color(0xFFFCF7EF)], begin: Alignment.topCenter, end: Alignment.bottomCenter),
                      ),
                      child: Align(
                        alignment: Alignment.topCenter,
                        child: Container(
                          width: 90, 
                          height: 110,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            border: Border.all(color: const Color(0xFFF39C12), width: 3),
                            borderRadius: BorderRadius.circular(8),
                            boxShadow: [BoxShadow(color: const Color(0xFFF39C12).withOpacity(0.2), blurRadius: 12, offset: const Offset(0, 6))],
                          ),
                          child: (photoUrl != null && photoUrl.toString().isNotEmpty)
                            ? ClipRRect(borderRadius: BorderRadius.circular(5), child: CustomNetworkImage(ApiService.getImageUrl(photoUrl.toString()), fit: BoxFit.cover, errorBuilder: (c, e, s) => _buildPhotoPlaceholder('📷', false)))
                            : _buildPhotoPlaceholder('📷', false),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // Performance Table
              Padding(
                padding: const EdgeInsets.fromLTRB(28, 2, 28, 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            const Text('📊', style: TextStyle(fontSize: 22)),
                            const SizedBox(width: 12),
                            Text('Performance Summary', style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w700, color: const Color(0xFF0B1A33))),
                          ],
                        ),
                        Text('Max Marks: ' + totalMaxMarks.toString(), style: GoogleFonts.poppins(fontSize: 13, color: const Color(0xFF6A8AAA))),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Container(
                      decoration: BoxDecoration(
                        border: Border.all(color: const Color(0xFFE8E0D8), width: 2),
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 12, offset: const Offset(0, 4))],
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(10),
                        child: Column(
                          children: [
                            // Table Header
                            Container(
                              decoration: const BoxDecoration(
                                gradient: LinearGradient(colors: [Color(0xFF0B1A33), Color(0xFF1A4A7A), Color(0xFF0B1A33)]),
                              ),
                              padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
                              child: Row(
                                children: [
                                  Expanded(flex: 3, child: Text('SUBJECT', style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w700, color: Colors.white, letterSpacing: 0.5))),
                                  Expanded(flex: 1, child: Text('MARKS', textAlign: TextAlign.center, style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w700, color: Colors.white, letterSpacing: 0.5))),
                                  Expanded(flex: 1, child: Text('MAX MARKS', textAlign: TextAlign.center, style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w700, color: Colors.white, letterSpacing: 0.5))),
                                  Expanded(flex: 1, child: Text('%', textAlign: TextAlign.center, style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w700, color: Colors.white, letterSpacing: 0.5))),
                                ],
                              ),
                            ),
                            // Table Rows
                            ...finalMarks.asMap().entries.map((entry) {
                              final int idx = entry.key;
                              final sm = entry.value;
                              final subName = sm['subject']?.toString() ?? 'UNKNOWN';
                              
                              final obtStr = sm['obtained']?.toString() ?? '-';
                              final obtNum = double.tryParse(obtStr);
                              final max = (sm['maxMarks'] as num?)?.toDouble() ?? 100.0;
                              final subPct = (obtNum != null && max > 0) ? (obtNum / max * 100).toStringAsFixed(1) : '0.0';
                              final isEven = idx % 2 != 0;

                              return Container(
                                decoration: BoxDecoration(
                                  color: isEven ? const Color(0xFFFDFCF9) : Colors.white,
                                  border: const Border(bottom: BorderSide(color: Color(0xFFE8E0D8))),
                                ),
                                padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 16),
                                child: Row(
                                  children: [
                                    Expanded(flex: 3, child: Row(
                                      children: [
                                        const Text('📘', style: TextStyle(fontSize: 14)),
                                        const SizedBox(width: 8),
                                        Expanded(child: Text(subName, style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w600, color: const Color(0xFF1A3A5A)), overflow: TextOverflow.ellipsis)),
                                      ],
                                    )),
                                    Expanded(flex: 1, child: Text(obtNum != null ? obtNum.toStringAsFixed(obtNum.truncateToDouble() == obtNum ? 0 : 1) : obtStr, textAlign: TextAlign.center, style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700, color: const Color(0xFF0B1A33)))),
                                    Expanded(flex: 1, child: Text(max.toStringAsFixed(0), textAlign: TextAlign.center, style: GoogleFonts.poppins(fontSize: 14, color: const Color(0xFF6A8AAA)))),
                                    Expanded(flex: 1, child: Text(subPct + '%', textAlign: TextAlign.center, style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w700, color: const Color(0xFF1A4A7A)))),
                                  ],
                                ),
                              );
                            }),
                            // Total Row
                            Container(
                              decoration: const BoxDecoration(
                                gradient: LinearGradient(colors: [Color(0xFFFDF9F4), Color(0xFFFFF3E0)]),
                                border: Border(top: BorderSide(color: Color(0xFFF39C12), width: 2.5), bottom: BorderSide(color: Color(0xFFF39C12), width: 2.5)),
                              ),
                              padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 16),
                              child: Row(
                                children: [
                                  Expanded(flex: 3, child: Text('📌 TOTAL', style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w900, color: const Color(0xFF0B1A33), letterSpacing: 1.0))),
                                  Expanded(flex: 1, child: Text(totalMarksObtainedStr, textAlign: TextAlign.center, style: GoogleFonts.outfit(fontSize: 19, fontWeight: FontWeight.w900, color: const Color(0xFFC0392B)))),
                                  Expanded(flex: 1, child: Text(totalMaxMarks.toStringAsFixed(0), textAlign: TextAlign.center, style: GoogleFonts.poppins(fontSize: 15, color: const Color(0xFF6A8AAA)))),
                                  Expanded(flex: 1, child: Text(percentage.toStringAsFixed(1) + '%', textAlign: TextAlign.center, style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF1A4A7A)))),
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

              // Academic Performance Rating
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 28, vertical: 10),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC), // slate-50
                  border: Border.all(color: const Color(0xFFE2E8F0)), // slate-200
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('ACADEMIC PERFORMANCE RATING', style: GoogleFonts.poppins(fontSize: 10, fontWeight: FontWeight.bold, color: const Color(0xFF94A3B8), letterSpacing: 0.5)),
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                          decoration: BoxDecoration(
                            color: ratingBg,
                            border: Border.all(color: ratingBorder),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(ratingLabel, style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w900, color: ratingColor)),
                        ),
                      ],
                    ),
                    Expanded(
                      child: Text('"$ratingComment"', textAlign: TextAlign.right, style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.bold, fontStyle: FontStyle.italic, color: const Color(0xFF475569))),
                    ),
                  ],
                ),
              ),

              // Footer
              Container(
                margin: const EdgeInsets.fromLTRB(28, 0, 28, 12),
                padding: const EdgeInsets.only(top: 12),
                decoration: const BoxDecoration(
                  border: Border(top: BorderSide(color: Color(0xFFDCE4ED), width: 2, style: BorderStyle.solid)),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                      // Total Info
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          Text('📋 Total Marks: $totalMarksObtainedStr / ${totalMaxMarks.toStringAsFixed(0)}', style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w800, color: const Color(0xFF1A4A7A), letterSpacing: 0.5)),
                          Text(percentage.toStringAsFixed(1) + '%', style: GoogleFonts.outfit(fontSize: 46, fontWeight: FontWeight.w900, color: const Color(0xFFC0392B), height: 1.0, shadows: [Shadow(color: const Color(0xFFC0392B).withOpacity(0.1), offset: const Offset(1,1))])),
                        ],
                      ),
                      // Signatures
                      Row(
                        children: [
                          Column(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              Builder(builder: (ctx) {
                                final urlRaw = (admitCardSettings['teacherSignatureUrl'] != null && admitCardSettings['teacherSignatureUrl'].toString().isNotEmpty)
                                    ? admitCardSettings['teacherSignatureUrl'].toString()
                                    : (_settingsData?['teacherSignatureUrl']?.toString() ?? '');
                                if (urlRaw.isNotEmpty) {
                                  return Container(
                                    width: 140,
                                    height: 45,
                                    margin: const EdgeInsets.only(bottom: 4),
                                    child: CustomNetworkImage(
                                      ApiService.getImageUrl(urlRaw),
                                      fit: BoxFit.contain,
                                      headers: const {'ngrok-skip-browser-warning': '69420'},
                                      errorBuilder: (_, __, ___) => Container(width: 140, height: 1.5, color: const Color(0xFFC8D6E4), margin: const EdgeInsets.only(bottom: 4, top: 40)),
                                    ),
                                  );
                                } else {
                                  return Container(width: 140, height: 1.5, color: const Color(0xFFC8D6E4), margin: const EdgeInsets.only(bottom: 4, top: 40));
                                }
                              }),
                              Text('✍ Teacher Signature', style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF1A3A5A))),
                            ],
                          ),
                          const SizedBox(width: 40),
                          Column(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              Builder(builder: (ctx) {
                                final urlRaw = (admitCardSettings['signatureUrl'] != null && admitCardSettings['signatureUrl'].toString().isNotEmpty)
                                    ? admitCardSettings['signatureUrl'].toString()
                                    : (_settingsData?['signatureUrl']?.toString() ?? '');
                                if (urlRaw.isNotEmpty) {
                                  return Container(
                                    width: 140,
                                    height: 45,
                                    margin: const EdgeInsets.only(bottom: 4),
                                    child: CustomNetworkImage(
                                      ApiService.getImageUrl(urlRaw),
                                      fit: BoxFit.contain,
                                      headers: const {'ngrok-skip-browser-warning': '69420'},
                                      errorBuilder: (_, __, ___) => Container(width: 140, height: 1.5, color: const Color(0xFFC8D6E4), margin: const EdgeInsets.only(bottom: 4, top: 40)),
                                    ),
                                  );
                                } else {
                                  return Container(width: 140, height: 1.5, color: const Color(0xFFC8D6E4), margin: const EdgeInsets.only(bottom: 4, top: 40));
                                }
                              }),
                              Text('✍ Principal Signature', style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF1A3A5A))),
                            ],
                          ),
                        ],
                      ),
                      ),
                    ],
                  ),
                ),

               const Spacer(),

               // Bottom Note
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 8),
                decoration: const BoxDecoration(
                  color: Color(0xFF0B1A33),
                  borderRadius: BorderRadius.only(bottomLeft: Radius.circular(10), bottomRight: Radius.circular(10)),
                ),
                child: Text(
                  '★ This is a system-generated result card for ${widget.examName} ★',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.w500, color: const Color(0xFFAABACA), letterSpacing: 0.5),
                ),
              ),
            ],
          ),
        ),
      ),
        ),
      ),
    );
  }

  Widget _buildPremiumInfoRow(String label, String value, {required bool isEven, bool isLast = false, bool isMobile = false}) {
    // isMobile is ignored since we scale a fixed A4 layout
    return Container(
      decoration: BoxDecoration(
        color: isEven ? const Color(0xFFFEFCF9) : Colors.transparent,
        border: isLast ? null : const Border(bottom: BorderSide(color: Color(0xFFF5EDE4))),
      ),
      child: Row(
        children: [
          Container(
            width: 190,
            padding: const EdgeInsets.symmetric(vertical: 5, horizontal: 16),
            decoration: const BoxDecoration(
              color: Color(0xFFFDF9F4),
              border: Border(right: BorderSide(color: Color(0xFFF5EDE4))),
            ),
            child: Text(label, style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w700, color: const Color(0xFF6A3A1A))),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 5, horizontal: 16),
              child: Text(value, style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.w800, color: const Color(0xFF0B1A33)), maxLines: 1, overflow: TextOverflow.ellipsis),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPhotoPlaceholder(String text, bool isMobile) {
    return Center(
      child: Text(text, style: GoogleFonts.outfit(fontSize: 44, fontWeight: FontWeight.bold, color: const Color(0xFF8A7A6A))),
    );
  }
}





