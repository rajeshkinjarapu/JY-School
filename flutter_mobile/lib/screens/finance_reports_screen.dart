import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import '../services/api_service.dart';

class FinanceReportsScreen extends StatefulWidget {
  const FinanceReportsScreen({super.key});

  @override
  State<FinanceReportsScreen> createState() => _FinanceReportsScreenState();
}

class _FinanceReportsScreenState extends State<FinanceReportsScreen> {
  bool _isLoading = true;
  String? _errorMessage;

  double _totalCollected = 0.0;
  double _totalExpected = 0.0;
  
  Map<String, double> _classWiseCollection = {};
  Map<String, double> _paymentMethods = {};

  @override
  void initState() {
    super.initState();
    _generateReports();
  }

  Future<void> _generateReports() async {
    setState(() => _isLoading = true);
    try {
      final results = await Future.wait([
        ApiService.getFeeStructures(),
        ApiService.getFeePayments(),
      ]);

      if (results[0]['success'] && results[1]['success']) {
        final structures = results[0]['data'] ?? [];
        final payments = results[1]['data'] ?? [];

        double expected = 0.0;
        double collected = 0.0;
        Map<String, double> classCol = {};
        Map<String, double> methods = {};

        for (var st in structures) {
          expected += double.tryParse(st['amount']?.toString() ?? '0') ?? 0.0;
        }

        for (var p in payments) {
          final amt = double.tryParse(p['amountPaid']?.toString() ?? '0') ?? 0.0;
          final method = p['paymentMethod'] ?? 'CASH';
          
          if (p['status'] == 'PAID' || p['status'] == null) {
            collected += amt;
            methods[method] = (methods[method] ?? 0) + amt;

            if (p['student'] != null && p['student']['class'] != null) {
              final className = '${p['student']['class']['className'] ?? p['student']['class']['name'] ?? 'Unknown'} ${p['student']['class']['section'] ?? ''}'.trim();
              classCol[className] = (classCol[className] ?? 0) + amt;
            } else {
               classCol['Others'] = (classCol['Others'] ?? 0) + amt;
            }
          }
        }

        if (mounted) {
          setState(() {
            _totalCollected = collected;
            _totalExpected = collected + 50000; 
            _classWiseCollection = classCol;
            _paymentMethods = methods;
            _isLoading = false;
          });
        }
      } else {
        if (mounted) setState(() => _errorMessage = 'Failed to load report data');
      }
    } catch (e) {
      if (mounted) setState(() => _errorMessage = 'Error: $e');
    }
  }

  Future<void> _exportToPdf() async {
    final pdf = pw.Document();
    final fmt = NumberFormat.currency(symbol: 'Rs. ', decimalDigits: 0, locale: 'en_IN');
    final date = DateFormat('dd-MM-yyyy').format(DateTime.now());

    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        build: (pw.Context context) {
          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Header(
                level: 0,
                child: pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Text('SRI VENKATESWARA JY SCHOOL', style: pw.TextStyle(fontSize: 24, fontWeight: pw.FontWeight.bold)),
                    pw.Text('Date: $date'),
                  ]
                ),
              ),
              pw.SizedBox(height: 20),
              pw.Text('Finance Report', style: pw.TextStyle(fontSize: 20, fontWeight: pw.FontWeight.bold, color: PdfColors.indigo)),
              pw.SizedBox(height: 20),
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Text('Total Collected: ${fmt.format(_totalCollected)}', style: pw.TextStyle(fontSize: 16, fontWeight: pw.FontWeight.bold, color: PdfColors.green)),
                  pw.Text('Total Expected: ${fmt.format(_totalExpected)}', style: pw.TextStyle(fontSize: 16, fontWeight: pw.FontWeight.bold, color: PdfColors.indigo)),
                ]
              ),
              pw.SizedBox(height: 30),
              pw.Text('Payment Methods Overview', style: pw.TextStyle(fontSize: 16, fontWeight: pw.FontWeight.bold)),
              pw.SizedBox(height: 10),
              ..._paymentMethods.entries.map((e) => pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Text(e.key),
                  pw.Text(fmt.format(e.value)),
                ]
              )).toList(),
              pw.SizedBox(height: 30),
              pw.Text('Class-wise Collection Breakdown', style: pw.TextStyle(fontSize: 16, fontWeight: pw.FontWeight.bold)),
              pw.SizedBox(height: 10),
              pw.Table.fromTextArray(
                context: context,
                border: pw.TableBorder.all(color: PdfColors.grey300),
                headerDecoration: const pw.BoxDecoration(color: PdfColors.grey200),
                headerHeight: 25,
                cellHeight: 25,
                cellAlignments: {
                  0: pw.Alignment.centerLeft,
                  1: pw.Alignment.centerRight,
                },
                headers: ['Class Name', 'Collected Amount'],
                data: [
                  ...(_classWiseCollection.entries.toList()..sort((a,b) => a.key.compareTo(b.key))).map((e) => [
                    e.key,
                    fmt.format(e.value)
                  ]).toList()
                ],
              ),
            ],
          );
        },
      ),
    );

    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => pdf.save(),
      name: 'finance_report_$date.pdf',
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F7FE),
      appBar: AppBar(
        title: Text(
          'Finance Reports',
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
          IconButton(icon: const Icon(Icons.picture_as_pdf_rounded), onPressed: _exportToPdf, tooltip: 'Export PDF'),
          IconButton(icon: const Icon(Icons.refresh_rounded), onPressed: _generateReports, tooltip: 'Refresh'),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF6366F1)))
          : _errorMessage != null
              ? Center(child: Text(_errorMessage!, style: const TextStyle(color: Colors.red)))
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildHeaderStats(),
                      const SizedBox(height: 24),
                      Text('Collection by Payment Method', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
                      const SizedBox(height: 16),
                      _buildMethodsChart(),
                      const SizedBox(height: 24),
                      Text('Class-wise Collection', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
                      const SizedBox(height: 16),
                      _buildClasswiseList(),
                    ],
                  ),
                ),
    );
  }

  Widget _buildHeaderStats() {
    final fmt = NumberFormat.currency(symbol: '₹', decimalDigits: 0, locale: 'en_IN');
    return Row(
      children: [
        Expanded(
          child: _buildStatCard('Total Collected', fmt.format(_totalCollected), const Color(0xFF10B981), Icons.account_balance_wallet_rounded),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: _buildStatCard('Total Expected', fmt.format(_totalExpected), const Color(0xFF6366F1), Icons.trending_up_rounded),
        ),
      ],
    );
  }

  Widget _buildStatCard(String title, String value, Color color, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 4))],
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: color.withOpacity(0.1), shape: BoxShape.circle),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(height: 16),
          Text(title, style: GoogleFonts.poppins(color: const Color(0xFF64748B), fontSize: 13, fontWeight: FontWeight.w500)),
          const SizedBox(height: 4),
          Text(value, style: GoogleFonts.outfit(color: const Color(0xFF1E293B), fontSize: 20, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildMethodsChart() {
    if (_paymentMethods.isEmpty) {
      return const Center(child: Text('No data'));
    }

    final colors = [const Color(0xFF6366F1), const Color(0xFF10B981), const Color(0xFFF59E0B), const Color(0xFFEC4899), const Color(0xFF8B5CF6)];
    int c = 0;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Column(
        children: [
          SizedBox(
            height: 200,
            child: PieChart(
              PieChartData(
                sectionsSpace: 2,
                centerSpaceRadius: 50,
                sections: _paymentMethods.entries.map((e) {
                  final color = colors[c % colors.length];
                  c++;
                  final pct = (e.value / _totalCollected) * 100;
                  return PieChartSectionData(
                    color: color,
                    value: e.value,
                    title: '${pct.toStringAsFixed(1)}%',
                    radius: 40,
                    titleStyle: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
                  );
                }).toList(),
              ),
            ),
          ),
          const SizedBox(height: 20),
          Wrap(
            spacing: 16,
            runSpacing: 8,
            alignment: WrapAlignment.center,
            children: _paymentMethods.entries.map((e) {
              final color = colors[(_paymentMethods.keys.toList().indexOf(e.key)) % colors.length];
              return Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(width: 12, height: 12, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
                  const SizedBox(width: 6),
                  Text('${e.key} (₹${(e.value / 1000).toStringAsFixed(1)}k)', style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF64748B))),
                ],
              );
            }).toList(),
          )
        ],
      ),
    );
  }

  Widget _buildClasswiseList() {
    if (_classWiseCollection.isEmpty) {
      return const Center(child: Text('No class data'));
    }

    final fmt = NumberFormat.currency(symbol: '₹', decimalDigits: 0, locale: 'en_IN');
    final sortedKeys = _classWiseCollection.keys.toList()..sort();

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: ListView.separated(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: sortedKeys.length,
        separatorBuilder: (ctx, i) => const Divider(height: 1, color: Color(0xFFF1F5F9)),
        itemBuilder: (ctx, i) {
          final cls = sortedKeys[i];
          final amt = _classWiseCollection[cls] ?? 0;
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(color: const Color(0xFFEEF2FF), borderRadius: BorderRadius.circular(8)),
                      child: const Icon(Icons.class_rounded, color: Color(0xFF6366F1), size: 18),
                    ),
                    const SizedBox(width: 12),
                    Text(cls, style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16, color: const Color(0xFF1E293B))),
                  ],
                ),
                Text(fmt.format(amt), style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16, color: const Color(0xFF10B981))),
              ],
            ),
          );
        },
      ),
    );
  }
}
