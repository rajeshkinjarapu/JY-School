import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';
import '../widgets/app_drawer.dart';

class HrSalaryScreen extends StatefulWidget {
  const HrSalaryScreen({super.key});

  @override
  State<HrSalaryScreen> createState() => _HrSalaryScreenState();
}

class _HrSalaryScreenState extends State<HrSalaryScreen> {
  bool _isLoading = true;
  List<dynamic> _salaries = [];
  List<dynamic> _teachers = [];
  String? _userRole;

  // Filters
  int _filterYear = DateTime.now().year;
  int? _filterMonth;

  final List<String> _months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  final currencyFormat = NumberFormat.currency(symbol: '₹', decimalDigits: 0, locale: 'en_IN');

  // Add form
  bool _showForm = false;
  bool _saving = false;
  String? _editId;
  String? _formTeacherId;
  int _formMonth = DateTime.now().month;
  int _formYear = DateTime.now().year;
  final _basicSalaryCtrl = TextEditingController();
  final _allowancesCtrl = TextEditingController(text: '0');
  final _deductionsCtrl = TextEditingController(text: '0');
  final _remarksCtrl = TextEditingController();
  String _formError = '';

  @override
  void initState() {
    super.initState();
    _loadAll();
  }

  @override
  void dispose() {
    _basicSalaryCtrl.dispose();
    _allowancesCtrl.dispose();
    _deductionsCtrl.dispose();
    _remarksCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadAll() async {
    setState(() => _isLoading = true);
    try {
      final prefs = await ApiService.getUserInfo();
      _userRole = prefs?['role'];
      await _fetchSalaries();
      if (_isAdmin) await _fetchTeachers();
    } catch (_) {}
    if (mounted) setState(() => _isLoading = false);
  }

  bool get _isAdmin => _userRole == 'SUPER_ADMIN' || _userRole == 'ADMIN';

  Future<void> _fetchSalaries() async {
    final result = await ApiService.getSalaries(year: _filterYear, month: _filterMonth);
    if (mounted) {
      setState(() {
        _salaries = result['success'] ? (result['data'] ?? []) : [];
      });
    }
  }

  Future<void> _fetchTeachers() async {
    final result = await ApiService.getTeachers();
    if (mounted) setState(() => _teachers = result['success'] ? (result['data'] ?? []) : []);
  }

  Future<void> _saveSalary() async {
    if (_formTeacherId == null || _basicSalaryCtrl.text.isEmpty) {
      setState(() => _formError = 'Teacher and Basic Salary are required');
      return;
    }
    setState(() { _saving = true; _formError = ''; });
    final body = {
      'teacherId': _formTeacherId,
      'month': _formMonth,
      'year': _formYear,
      'basicSalary': double.tryParse(_basicSalaryCtrl.text) ?? 0,
      'allowances': double.tryParse(_allowancesCtrl.text) ?? 0,
      'deductions': double.tryParse(_deductionsCtrl.text) ?? 0,
      'remarks': _remarksCtrl.text,
    };
    final result = _editId != null
        ? await ApiService.updateSalary(_editId!, body)
        : await ApiService.createSalary(body);
    if (mounted) {
      setState(() => _saving = false);
      if (result['success'] == true) {
        setState(() => _showForm = false);
        await _fetchSalaries();
      } else {
        setState(() => _formError = result['message'] ?? 'Failed to save');
      }
    }
  }

  Future<void> _markPaid(String id) async {
    final confirm = await _confirm('Mark this salary as PAID?');
    if (!confirm) return;
    final result = await ApiService.markSalaryPaid(id);
    if (mounted && result['success'] == true) await _fetchSalaries();
  }

  Future<void> _deleteSalary(String id) async {
    final confirm = await _confirm('Delete this salary record?');
    if (!confirm) return;
    await ApiService.deleteSalary(id);
    if (mounted) setState(() => _salaries.removeWhere((s) => s['id'] == id));
  }

  Future<bool> _confirm(String msg) async {
    return await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('Confirm', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        content: Text(msg, style: GoogleFonts.poppins(fontSize: 14)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text('Cancel', style: GoogleFonts.poppins(color: const Color(0xFF64748B)))),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: Text('Yes', style: GoogleFonts.poppins(color: const Color(0xFF6366F1), fontWeight: FontWeight.bold))),
        ],
      ),
    ) ?? false;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      drawer: const AppDrawer(currentRoute: 'hr_salary'),
      appBar: AppBar(
        title: Text('Salary Records', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 20, color: Colors.white)),
        iconTheme: const IconThemeData(color: Colors.white),
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF6366F1), Color(0xFF4F46E5), Color(0xFF4338CA)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
        elevation: 0,
        actions: [
          if (_isAdmin)
            IconButton(
              icon: const Icon(Icons.add_circle_outline_rounded, size: 28),
              onPressed: () {
                setState(() {
                  _showForm = true;
                  _editId = null;
                  _formTeacherId = null;
                  _formMonth = DateTime.now().month;
                  _formYear = DateTime.now().year;
                  _basicSalaryCtrl.clear();
                  _allowancesCtrl.text = '0';
                  _deductionsCtrl.text = '0';
                  _remarksCtrl.clear();
                  _formError = '';
                });
              },
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF6366F1)))
          : Stack(
              children: [
                Column(
                  children: [
                    // Filters bar
                    Container(
                      color: Colors.white,
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
                      child: Row(
                        children: [
                          // Year
                          Expanded(
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF8FAFC),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: const Color(0xFFE2E8F0)),
                              ),
                              child: DropdownButtonHideUnderline(
                                child: DropdownButton<int>(
                                  value: _filterYear,
                                  items: List.generate(5, (i) => DateTime.now().year - i)
                                      .map((y) => DropdownMenuItem(value: y, child: Text('$y', style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600))))
                                      .toList(),
                                  onChanged: (v) { if (v != null) setState(() { _filterYear = v; _fetchSalaries(); }); },
                                  style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF1E293B)),
                                  isDense: true,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          // Month
                          Expanded(
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF8FAFC),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: const Color(0xFFE2E8F0)),
                              ),
                              child: DropdownButtonHideUnderline(
                                child: DropdownButton<int?>(
                                  value: _filterMonth,
                                  hint: Text('All Months', style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF64748B))),
                                  items: [
                                    DropdownMenuItem<int?>(value: null, child: Text('All Months', style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600))),
                                    ..._months.asMap().entries.map((e) => DropdownMenuItem<int?>(
                                      value: e.key + 1,
                                      child: Text(e.value, style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600)),
                                    )),
                                  ],
                                  onChanged: (v) { setState(() { _filterMonth = v; _fetchSalaries(); }); },
                                  style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF1E293B)),
                                  isDense: true,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    // List
                    Expanded(
                      child: _salaries.isEmpty
                          ? Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(24),
                                    decoration: BoxDecoration(color: Colors.white, shape: BoxShape.circle, boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 20)]),
                                    child: const Icon(Icons.payments_outlined, size: 60, color: Color(0xFFCBD5E1)),
                                  ),
                                  const SizedBox(height: 20),
                                  Text('No Salary Records', style: GoogleFonts.outfit(color: const Color(0xFF94A3B8), fontSize: 18, fontWeight: FontWeight.w600)),
                                  Text('No records for selected period', style: GoogleFonts.poppins(color: const Color(0xFFCBD5E1), fontSize: 13)),
                                ],
                              ),
                            )
                          : ListView.builder(
                              padding: const EdgeInsets.all(16),
                              itemCount: _salaries.length,
                              itemBuilder: (context, index) => _buildSalaryCard(_salaries[index]),
                            ),
                    ),
                  ],
                ),
                // Add form overlay
                if (_showForm) _buildFormOverlay(),
              ],
            ),
    );
  }

  Widget _buildSalaryCard(dynamic sal) {
    final isPaid = (sal['status'] ?? '') == 'PAID';
    final monthIdx = (sal['month'] ?? 1) - 1;
    final monthName = monthIdx >= 0 && monthIdx < 12 ? _months[monthIdx] : '---';
    final year = sal['year'] ?? '';
    final basic = (sal['basicSalary'] ?? 0).toDouble();
    final allowances = (sal['allowances'] ?? 0).toDouble();
    final deductions = (sal['deductions'] ?? 0).toDouble();
    final net = (sal['netSalary'] ?? 0).toDouble();
    final teacherName = sal['teacher']?['user']?['name'] ?? 'Staff';
    final photoUrl = sal['teacher']?['user']?['photoUrl'];
    final id = sal['id'] as String?;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 12, offset: const Offset(0, 4))],
      ),
      child: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF6366F1).withOpacity(0.05),
              borderRadius: const BorderRadius.only(topLeft: Radius.circular(20), topRight: Radius.circular(20)),
              border: const Border(bottom: BorderSide(color: Color(0xFFF1F5F9))),
            ),
            child: Row(
              children: [
                Container(
                  width: 48, height: 48,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(colors: [Color(0xFF6366F1), Color(0xFF4F46E5)]),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Center(child: Text(monthName, style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14))),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('$monthName $year', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16, color: const Color(0xFF1E293B))),
                      Text('Payslip', style: GoogleFonts.poppins(color: const Color(0xFF94A3B8), fontSize: 11)),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: isPaid ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(isPaid ? 'PAID' : 'PENDING', style: GoogleFonts.poppins(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
                ),
              ],
            ),
          ),
          // Body
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                if (_isAdmin)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Row(
                      children: [
                        _buildAvatar(photoUrl, teacherName),
                        const SizedBox(width: 10),
                        Text(teacherName, style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w700, color: const Color(0xFF1E293B))),
                      ],
                    ),
                  ),
                // Breakdown rows
                _salaryRow('Basic Salary', basic, const Color(0xFF64748B)),
                if (allowances > 0) _salaryRow('+ Allowances', allowances, const Color(0xFF10B981)),
                if (deductions > 0) _salaryRow('- Deductions', deductions, const Color(0xFFEF4444)),
                const Divider(height: 16, color: Color(0xFFF1F5F9)),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Net Salary', style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
                    Text(currencyFormat.format(net), style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.bold, color: const Color(0xFF6366F1))),
                  ],
                ),
                const SizedBox(height: 12),
                // Actions
                Row(
                  children: [
                    if (_isAdmin && !isPaid && id != null)
                      Expanded(
                        child: GestureDetector(
                          onTap: () => _markPaid(id),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            decoration: BoxDecoration(color: const Color(0xFFF0FDF4), borderRadius: BorderRadius.circular(12)),
                            child: Center(child: Text('✓ Mark Paid', style: GoogleFonts.poppins(color: const Color(0xFF10B981), fontSize: 12, fontWeight: FontWeight.bold))),
                          ),
                        ),
                      ),
                    if (_isAdmin && !isPaid && id != null) const SizedBox(width: 8),
                    if (_isAdmin && id != null)
                      GestureDetector(
                        onTap: () => _deleteSalary(id),
                        child: Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(color: const Color(0xFFFFF1F2), borderRadius: BorderRadius.circular(12)),
                          child: const Icon(Icons.delete_outline_rounded, color: Color(0xFFEF4444), size: 18),
                        ),
                      ),
                    if (!_isAdmin)
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(colors: [Color(0xFF6366F1), Color(0xFF4F46E5)]),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Center(child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.download_rounded, color: Colors.white, size: 15),
                              const SizedBox(width: 6),
                              Text('Download Slip', style: GoogleFonts.poppins(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                            ],
                          )),
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _salaryRow(String label, double amount, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: GoogleFonts.poppins(fontSize: 12, color: const Color(0xFF64748B), fontWeight: FontWeight.w500)),
          Text(currencyFormat.format(amount), style: GoogleFonts.poppins(fontSize: 13, color: color, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }

  Widget _buildAvatar(dynamic photoUrl, String name) {
    final url = photoUrl as String?;
    if (url != null && url.isNotEmpty) {
      return CircleAvatar(radius: 14, backgroundImage: NetworkImage(url.startsWith('http') ? url : '${ApiService.baseUrl}/$url'));
    }
    return CircleAvatar(
      radius: 14,
      backgroundColor: const Color(0xFF6366F1).withOpacity(0.15),
      child: Text(name.isNotEmpty ? name[0].toUpperCase() : 'T', style: GoogleFonts.outfit(color: const Color(0xFF6366F1), fontSize: 12, fontWeight: FontWeight.bold)),
    );
  }

  Widget _buildFormOverlay() {
    return GestureDetector(
      onTap: () => setState(() => _showForm = false),
      child: Container(
        color: Colors.black.withOpacity(0.5),
        child: Center(
          child: GestureDetector(
            onTap: () {},
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 20),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24)),
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Add Salary Record', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 18, color: const Color(0xFF1E293B))),
                        GestureDetector(
                          onTap: () => setState(() => _showForm = false),
                          child: Container(padding: const EdgeInsets.all(6), decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(8)), child: const Icon(Icons.close_rounded, size: 18, color: Color(0xFF64748B))),
                        ),
                      ],
                    ),
                    if (_formError.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(color: const Color(0xFFFFF1F2), borderRadius: BorderRadius.circular(12)),
                        child: Row(children: [
                          const Icon(Icons.error_outline_rounded, color: Color(0xFFEF4444), size: 16),
                          const SizedBox(width: 8),
                          Expanded(child: Text(_formError, style: GoogleFonts.poppins(color: const Color(0xFFEF4444), fontSize: 12, fontWeight: FontWeight.w600))),
                        ]),
                      ),
                    ],
                    const SizedBox(height: 16),
                    _formLabel('Teacher *'),
                    _formDropdown<String?>(
                      value: _formTeacherId,
                      hint: 'Select Teacher',
                      items: [
                        DropdownMenuItem<String?>(value: null, child: Text('Select Teacher', style: GoogleFonts.poppins(fontSize: 13))),
                        ..._teachers.map((t) => DropdownMenuItem<String?>(
                          value: t['id'] as String,
                          child: Text(t['user']?['name'] ?? 'Teacher', style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600)),
                        )),
                      ],
                      onChanged: (v) => setState(() => _formTeacherId = v),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          _formLabel('Month *'),
                          _formDropdown<int>(
                            value: _formMonth,
                            items: _months.asMap().entries.map((e) => DropdownMenuItem(value: e.key + 1, child: Text(e.value, style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600)))).toList(),
                            onChanged: (v) => setState(() => _formMonth = v ?? _formMonth),
                          ),
                        ])),
                        const SizedBox(width: 12),
                        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          _formLabel('Year *'),
                          _formDropdown<int>(
                            value: _formYear,
                            items: List.generate(5, (i) => DateTime.now().year - i)
                                .map((y) => DropdownMenuItem(value: y, child: Text('$y', style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600))))
                                .toList(),
                            onChanged: (v) => setState(() => _formYear = v ?? _formYear),
                          ),
                        ])),
                      ],
                    ),
                    const SizedBox(height: 12),
                    _formLabel('Basic Salary (₹) *'),
                    _formTextField(_basicSalaryCtrl, 'e.g. 25000', TextInputType.number),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          _formLabel('Allowances (₹)'),
                          _formTextField(_allowancesCtrl, '0', TextInputType.number),
                        ])),
                        const SizedBox(width: 12),
                        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          _formLabel('Deductions (₹)'),
                          _formTextField(_deductionsCtrl, '0', TextInputType.number),
                        ])),
                      ],
                    ),
                    const SizedBox(height: 20),
                    Row(
                      children: [
                        Expanded(
                          child: GestureDetector(
                            onTap: () => setState(() => _showForm = false),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              decoration: BoxDecoration(border: Border.all(color: const Color(0xFFE2E8F0)), borderRadius: BorderRadius.circular(14)),
                              child: Center(child: Text('Cancel', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, color: const Color(0xFF64748B)))),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: GestureDetector(
                            onTap: _saving ? null : _saveSalary,
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              decoration: BoxDecoration(
                                gradient: const LinearGradient(colors: [Color(0xFF6366F1), Color(0xFF4F46E5)]),
                                borderRadius: BorderRadius.circular(14),
                              ),
                              child: Center(child: _saving
                                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                  : Text('Save Record', style: GoogleFonts.poppins(color: Colors.white, fontWeight: FontWeight.bold))),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _formLabel(String text) => Padding(
    padding: const EdgeInsets.only(bottom: 6),
    child: Text(text, style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFF64748B), letterSpacing: 0.3)),
  );

  Widget _formTextField(TextEditingController ctrl, String hint, TextInputType type) => TextField(
    controller: ctrl,
    keyboardType: type,
    style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600),
    decoration: InputDecoration(
      hintText: hint,
      hintStyle: GoogleFonts.poppins(fontSize: 13, color: const Color(0xFFCBD5E1)),
      filled: true, fillColor: const Color(0xFFF8FAFC),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF6366F1), width: 1.5)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
    ),
  );

  Widget _formDropdown<T>({required T value, String? hint, required List<DropdownMenuItem<T>> items, required ValueChanged<T?> onChanged}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFFE2E8F0))),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<T>(
          value: value,
          hint: hint != null ? Text(hint, style: GoogleFonts.poppins(fontSize: 13, color: const Color(0xFFCBD5E1))) : null,
          items: items,
          onChanged: onChanged,
          isExpanded: true,
          style: GoogleFonts.poppins(fontSize: 13, color: const Color(0xFF1E293B), fontWeight: FontWeight.w600),
          isDense: true,
          dropdownColor: Colors.white,
        ),
      ),
    );
  }
}
