import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:share_plus/share_plus.dart';
import '../services/api_service.dart';

class BirthdayPosterDialog extends StatefulWidget {
  final List<dynamic> posters;

  const BirthdayPosterDialog({
    super.key,
    required this.posters,
  });

  static Future<void> show(BuildContext context, List<dynamic> posters) async {
    if (posters.isEmpty) return;
    return showDialog(
      context: context,
      barrierDismissible: true,
      builder: (ctx) => BirthdayPosterDialog(posters: posters),
    );
  }

  @override
  State<BirthdayPosterDialog> createState() => _BirthdayPosterDialogState();
}

class _BirthdayPosterDialogState extends State<BirthdayPosterDialog> {
  late final PageController _pageController;
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  Future<void> _launchWhatsApp(Map<String, dynamic> poster) async {
    final studentName = poster['studentName']?.toString() ?? 'Student';
    final className = poster['className']?.toString() ?? '';
    final ageTurning = poster['ageTurning']?.toString() ?? '';

    final message = '🎉 *Happy Birthday, $studentName!* 🎂✨\n\n'
        '${className.isNotEmpty ? 'Class: $className\n' : ''}'
        '${ageTurning.isNotEmpty && ageTurning != '0' ? 'Turning $ageTurning Years\n\n' : '\n'}'
        'May God bless you with good health, immense happiness, and great success in all your studies.\n\n'
        'Warmest blessings & best wishes,\n'
        '*Management, Principal & Teachers*\n'
        '*Sri Venkateswara JY School* 🌟';

    final uri = Uri.parse('whatsapp://send?text=${Uri.encodeComponent(message)}');
    final webUri = Uri.parse('https://wa.me/?text=${Uri.encodeComponent(message)}');

    try {
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } else {
        await launchUrl(webUri, mode: LaunchMode.externalApplication);
      }
    } catch (_) {
      try {
        await launchUrl(webUri, mode: LaunchMode.externalApplication);
      } catch (err) {
        debugPrint('Could not launch WhatsApp: $err');
      }
    }
  }

  void _sharePoster(Map<String, dynamic> poster) {
    final studentName = poster['studentName']?.toString() ?? 'Student';
    final posterUrl = ApiService.getImageUrl(poster['posterUrl']?.toString());
    final text = '🎂 Happy Birthday $studentName! 🎉\nCelebrating at Sri Venkateswara JY School! ✨\n$posterUrl';
    Share.share(text, subject: 'Happy Birthday $studentName!');
  }

  void _openFullScreenImage(String imageUrl, String studentName) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (ctx) => Scaffold(
          backgroundColor: Colors.black,
          appBar: AppBar(
            backgroundColor: Colors.black,
            foregroundColor: Colors.white,
            title: Text(
              studentName,
              style: GoogleFonts.plusJakartaSans(
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
          ),
          body: Center(
            child: InteractiveViewer(
              panEnabled: true,
              minScale: 0.8,
              maxScale: 4.0,
              child: Image.network(
                imageUrl,
                fit: BoxFit.contain,
                loadingBuilder: (context, child, loadingProgress) {
                  if (loadingProgress == null) return child;
                  return const Center(
                    child: CircularProgressIndicator(color: Colors.pinkAccent),
                  );
                },
                errorBuilder: (context, error, stackTrace) => const Center(
                  child: Icon(Icons.broken_image, color: Colors.white54, size: 48),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final screenHeight = MediaQuery.of(context).size.height;
    final screenWidth = MediaQuery.of(context).size.width;

    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: Center(
        child: Container(
          width: screenWidth > 480 ? 440 : screenWidth * 0.92,
          constraints: BoxConstraints(maxHeight: screenHeight * 0.88),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(28),
            boxShadow: [
              BoxShadow(
                color: Colors.pink.withOpacity(0.25),
                blurRadius: 30,
                offset: const Offset(0, 10),
              ),
              BoxShadow(
                color: Colors.black.withOpacity(0.15),
                blurRadius: 20,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(28),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Top Celebratory Banner
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Color(0xFFE11D48), Color(0xFF9333EA), Color(0xFF4F46E5)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Text('🎂', style: TextStyle(fontSize: 20)),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              "Today's Birthday Celebration! 🎉",
                              style: GoogleFonts.plusJakartaSans(
                                color: Colors.white,
                                fontWeight: FontWeight.w900,
                                fontSize: 14,
                                letterSpacing: 0.2,
                              ),
                            ),
                            Text(
                              'Sri Venkateswara JY School',
                              style: GoogleFonts.plusJakartaSans(
                                color: Colors.white.withOpacity(0.85),
                                fontWeight: FontWeight.w600,
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, color: Colors.white, size: 22),
                        splashRadius: 20,
                        onPressed: () => Navigator.of(context).pop(),
                      ),
                    ],
                  ),
                ),

                // Poster PageView
                Flexible(
                  child: widget.posters.length == 1
                      ? _buildPosterCard(widget.posters.first)
                      : PageView.builder(
                          controller: _pageController,
                          itemCount: widget.posters.length,
                          onPageChanged: (idx) {
                            setState(() => _currentIndex = idx);
                          },
                          itemBuilder: (ctx, index) {
                            return _buildPosterCard(widget.posters[index]);
                          },
                        ),
                ),

                // Multi-poster dot indicators if > 1
                if (widget.posters.length > 1)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 6),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(
                        widget.posters.length,
                        (i) => AnimatedContainer(
                          duration: const Duration(milliseconds: 250),
                          margin: const EdgeInsets.symmetric(horizontal: 3),
                          width: _currentIndex == i ? 18 : 6,
                          height: 6,
                          decoration: BoxDecoration(
                            color: _currentIndex == i
                                ? const Color(0xFFE11D48)
                                : Colors.grey.shade300,
                            borderRadius: BorderRadius.circular(3),
                          ),
                        ),
                      ),
                    ),
                  ),

                // Bottom Action Buttons with Strict SafeArea
                SafeArea(
                  bottom: true,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 14),
                    child: Row(
                      children: [
                        // WhatsApp Wish Button
                        Expanded(
                          flex: 3,
                          child: ElevatedButton.icon(
                            onPressed: () {
                              final currentPoster = widget.posters[_currentIndex];
                              _launchWhatsApp(currentPoster);
                            },
                            icon: const Icon(Icons.cake, size: 18),
                            label: Text(
                              'Send Wish on WhatsApp',
                              style: GoogleFonts.plusJakartaSans(
                                fontWeight: FontWeight.w800,
                                fontSize: 12,
                              ),
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF25D366),
                              foregroundColor: Colors.white,
                              elevation: 2,
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),

                        // Share Button
                        Expanded(
                          flex: 1,
                          child: OutlinedButton(
                            onPressed: () {
                              final currentPoster = widget.posters[_currentIndex];
                              _sharePoster(currentPoster);
                            },
                            style: OutlinedButton.styleFrom(
                              foregroundColor: const Color(0xFF4F46E5),
                              side: const BorderSide(color: Color(0xFFC7D2FE), width: 1.5),
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                              ),
                            ),
                            child: const Icon(Icons.share, size: 18),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPosterCard(dynamic posterRaw) {
    final poster = (posterRaw is Map) ? posterRaw : <String, dynamic>{};
    final studentName = poster['studentName']?.toString() ?? 'Student';
    final className = poster['className']?.toString() ?? '';
    final ageTurning = poster['ageTurning']?.toString() ?? '';
    final posterUrl = ApiService.getImageUrl(poster['posterUrl']?.toString());

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(14, 12, 14, 4),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // Student details badge row
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Flexible(
                  child: Text(
                    studentName,
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 16,
                      fontWeight: FontWeight.w900,
                      color: const Color(0xFF1E293B),
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                if (ageTurning.isNotEmpty && ageTurning != '0') ...[
                  const SizedBox(width: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFCE7F3),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFFF472B6)),
                    ),
                    child: Text(
                      'Turning $ageTurning Yrs',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        color: const Color(0xFFBE185D),
                      ),
                    ),
                  ),
                ],
              ],
            ),
            if (className.isNotEmpty) ...[
              const SizedBox(height: 3),
              Text(
                'Class: $className',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFF64748B),
                ),
              ),
            ],
            const SizedBox(height: 10),

            // Poster Image
            GestureDetector(
              onTap: () => _openFullScreenImage(posterUrl, studentName),
              child: Container(
                constraints: const BoxConstraints(
                  maxHeight: 460,
                  minHeight: 280,
                ),
                decoration: BoxDecoration(
                  color: Colors.black,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: Colors.grey.shade200, width: 1.5),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.08),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(17),
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      Image.network(
                        posterUrl,
                        fit: BoxFit.contain,
                        loadingBuilder: (context, child, loadingProgress) {
                          if (loadingProgress == null) return child;
                          return Container(
                            height: 320,
                            color: Colors.grey.shade100,
                            child: Center(
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const CircularProgressIndicator(
                                    color: Color(0xFFE11D48),
                                    strokeWidth: 2.5,
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    'Loading Birthday Poster...',
                                    style: GoogleFonts.plusJakartaSans(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w600,
                                      color: Colors.grey.shade600,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                        errorBuilder: (context, error, stackTrace) {
                          return Container(
                            height: 280,
                            color: Colors.grey.shade100,
                            padding: const EdgeInsets.all(20),
                            child: Center(
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.broken_image, size: 40, color: Colors.grey),
                                  const SizedBox(height: 8),
                                  Text(
                                    'Poster image could not be loaded',
                                    style: GoogleFonts.plusJakartaSans(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                      color: Colors.grey.shade600,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                      // Zoom icon pill hint in corner
                      Positioned(
                        bottom: 8,
                        right: 8,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.black.withOpacity(0.6),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.zoom_in, color: Colors.white, size: 14),
                              const SizedBox(width: 4),
                              Text(
                                'Tap to zoom',
                                style: GoogleFonts.plusJakartaSans(
                                  color: Colors.white,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
