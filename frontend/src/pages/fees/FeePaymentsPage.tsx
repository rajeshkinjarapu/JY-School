import React, { useEffect, useState, useMemo } from 'react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Badge } from '../../components/UI/Badge';
import { Plus, FileDown, Trash2, Search, X, ChevronDown, FileText, Upload, CheckCircle2, AlertCircle, MinusCircle, Calendar, SlidersHorizontal, Printer } from 'lucide-react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { FeeReceiptPrint, generateFeeStatementPDF } from '../../components/fees/FeeReceiptPrint';

export const FeePaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();

  const [printPayment, setPrintPayment] = useState<any>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  // Excel bulk import states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [dragOver, setDragOver] = useState(false);

  // Date range filter
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Filtered payments based on date range
  const filteredPayments = useMemo(() => {
    const list = payments.filter(p => {
      const pDate = p.paymentDate || p.createdAt;
      if (!pDate) return false;
      const d = new Date(pDate);
      if (dateFrom && d < new Date(dateFrom)) return false;
      if (dateTo && d > new Date(dateTo + 'T23:59:59')) return false;
      return true;
    });
    return list.sort((a, b) => {
      const dateA = new Date(a.paymentDate || a.createdAt);
      dateA.setHours(0, 0, 0, 0); // Normalize to just the date
      
      const dateB = new Date(b.paymentDate || b.createdAt);
      dateB.setHours(0, 0, 0, 0); // Normalize to just the date
      
      const timeDiff = dateB.getTime() - dateA.getTime();
      if (timeDiff !== 0) return timeDiff; // Primary sort: Date descending
      
      // Secondary sort: Creation time descending (most recently entered on top)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [payments, dateFrom, dateTo]);

  const toggleRow = (id: string) => setExpandedRow(prev => prev === id ? null : id);

  const fetchData = async () => {
    try {
      const isStudent = user?.role === 'STUDENT';
      const [payRes, studRes, structRes, classRes]: any = await Promise.all([
        api.get('/api/fees/payments?limit=500'),
        isStudent ? Promise.resolve({ data: [] }) : api.get('/api/students?limit=1000'),
        isStudent ? Promise.resolve({ data: [] }) : api.get('/api/fees/structures?limit=500'),
        isStudent ? Promise.resolve({ data: [] }) : api.get('/api/classes?limit=500'),
      ]);
      setPayments(payRes.data || payRes || []);
      setStudents(studRes.data.data || studRes.data || []);
      setStructures(structRes.data || structRes || []);
      setClasses(classRes.data?.data || classRes.data || classRes || []);
    } catch (e) {
      toast.error('Failed to load transaction records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);



  const handleDeletePayment = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this payment record? This action cannot be undone.')) return;
    const t = toast.loading('Deleting payment...');
    try {
      await api.delete(`/api/fees/payments/${id}`);
      setPayments(payments.filter(p => p.id !== id));
      toast.success('Payment deleted successfully', { id: t });
    } catch {
      toast.error('Failed to delete payment', { id: t });
    }
  };

  const handlePrintReceipt = (paymentId: string) => {
    const payment = payments.find(p => p.id === paymentId);
    if (payment) {
      setPrintPayment(payment);
      setTimeout(() => {
        window.print();
      }, 500);
    }
  };

  // ── Fee Statement PDF Generator ─────────────────────────────────────────
  const handleGenerateStatement = async (studentData: any) => {
    const statementToast = toast.loading('Generating fee statement...');
    try {
      // Find full student from state to get classId, since payment.student might lack it
      const fullStudent = students.find(s => s.id === studentData.id) || studentData;
      const classId = fullStudent?.classId || fullStudent?.class?.id || '';
      
      const queryParams = new URLSearchParams();
      if (classId) queryParams.append('classId', classId);
      queryParams.append('studentId', studentData.id);

      const [structRes, payRes]: any[] = await Promise.all([
        api.get(`/api/fees/structures?${queryParams.toString()}`),
        api.get(`/api/fees/payments?studentId=${studentData.id}&limit=500`),
      ]);

      const structs: any[] = structRes.data?.data || structRes.data || [];
      const studentPayments: any[] = (payRes.data?.data || payRes.data || []).filter(
        (p: any) => p.studentId === studentData.id || p.student?.id === studentData.id
      );

      // Build fee items
      const feeItems = structs.map((s: any) => {
        const paid = studentPayments
          .filter((p: any) => p.feeStructureId === s.id)
          .reduce((sum: number, p: any) => sum + (p.amountPaid || 0), 0);
        return {
          name: s.name,
          term: s.term,
          totalAmount: s.amount,
          paidAmount: paid,
          dueDate: s.dueDate,
        };
      });

      if (feeItems.length === 0) {
        toast.error('No fee structures found for this student.', { id: statementToast });
        return;
      }

      await generateFeeStatementPDF({
        studentName: fullStudent.user?.name || fullStudent.name || 'Student',
        studentId: fullStudent.rollNo || fullStudent.id?.slice(0, 8) || '—',
        className: fullStudent.class?.name || '—',
        section: fullStudent.class?.section || '—',
        fatherName: fullStudent.fatherName || fullStudent.parentName || '—',
        phone: fullStudent.user?.phone || '—',
        feeItems,
      });
      toast.success('Fee statement downloaded!', { id: statementToast });
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate statement.', { id: statementToast });
    }
  };

  // ── Download blank Excel template ────────────────────────────────────────
  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Student ID', 'Amount Paid', 'Payment Mode', 'Payment Date'],
      ['ST001', 5000, 'CASH', '2026-07-29'],
      ['ST002', 3000, 'UPI', '2026-07-29'],
    ]);
    ws['!cols'] = [{ wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 14 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Fee Payments');
    XLSX.writeFile(wb, 'Fee_Payment_Import_Template.xlsx');
  };

  // ── Handle bulk payment import ────────────────────────────────────────────
  const handleBulkImport = async () => {
    if (!importFile) { toast.error('Please select an Excel file first.'); return; }
    setImportLoading(true);
    const t = toast.loading('Importing payments...');
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      const res: any = await api.post('/api/fees/payments/bulk-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = res.data?.data || res.data;
      setImportResult(data);
      toast.success(`Import done! ✓ ${data.summary.success} success, ✗ ${data.summary.errors} errors`, { id: t, duration: 5000 });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Import failed', { id: t });
    } finally {
      setImportLoading(false);
    }
  };

  const exportPaymentsExcel = async () => {
    const importToast = toast.loading('Generating Excel sheet...');
    try {
      const q = new URLSearchParams();
      if (dateFrom) q.append('startDate', dateFrom);
      if (dateTo) q.append('endDate', dateTo);
      const urlPath = `/api/reports/fees${q.toString() ? '?' + q.toString() : ''}`;
      const response: any = await api.get(urlPath, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data || response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Fee_Report.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success('Excel report downloaded successfully!', { id: importToast });
    } catch (e: any) {
      toast.error('Failed to export fees ledger Excel.', { id: importToast });
    }
  };

  const exportPaymentsPdf = async () => {
    const importToast = toast.loading('Generating PDF report...');
    try {
      const q = new URLSearchParams();
      if (dateFrom) q.append('startDate', dateFrom);
      if (dateTo) q.append('endDate', dateTo);
      const urlPath = `/api/reports/fees/pdf${q.toString() ? '?' + q.toString() : ''}`;
      const response: any = await api.get(urlPath, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data || response], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Fee_Report.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success('PDF report downloaded successfully!', { id: importToast });
    } catch (e: any) {
      toast.error('Failed to export fees ledger PDF.', { id: importToast });
    }
  };

  return (
    <div className="space-y-4 animate-fade-in-up pb-24 overflow-x-hidden">
      
      <div className="print:hidden space-y-4">
      {user?.role !== 'TEACHER' && (
        <div className="hidden md:flex flex-col sm:flex-row sm:items-center justify-end gap-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-2 sm:p-3 rounded-none sm:rounded-3xl shadow-xl text-white transform transition-all sm:hover:scale-[1.01]">
          <div className="flex flex-wrap gap-2 w-full justify-end">
            {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'ACCOUNTANT') && (
              <>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white/90 border border-white/25 hover:bg-white/15 transition-all"
                >
                  <Printer className="w-4 h-4" /> Print
                </button>
                <button
                  onClick={exportPaymentsExcel}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white/90 border border-white/25 hover:bg-white/15 transition-all"
                >
                  <FileDown className="w-4 h-4" /> Export Excel
                </button>
                <button
                  onClick={exportPaymentsPdf}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white/90 border border-white/25 hover:bg-white/15 transition-all"
                >
                  <FileDown className="w-4 h-4" /> Export PDF
                </button>
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white/90 border border-white/25 hover:bg-white/15 transition-all"
                >
                  <FileText className="w-4 h-4" /> Sample Excel
                </button>
                {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
                  <Link to="/fees/structures" className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white/90 border border-white/25 hover:bg-white/15 transition-all">
                    <SlidersHorizontal className="w-4 h-4" /> Structure Settings
                  </Link>
                )}
                <button
                  onClick={() => { setShowImportModal(true); setImportResult(null); setImportFile(null); }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white/90 border border-white/25 hover:bg-white/15 transition-all"
                >
                  <Upload className="w-4 h-4" /> Import Excel
                </button>
                <Link
                  to="/collect-payment"
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-bold bg-white text-indigo-600 hover:bg-white/90 shadow-md transition-all"
                >
                  <Plus className="w-4 h-4" /> Collect Payment
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {user?.role !== 'TEACHER' && (
        <div className="px-0 sm:px-0">

        {/* ── Date Range Filter Bar ── */}
        <div className="hidden md:flex items-center gap-3 px-1 pb-2">
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
            <Calendar className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">From</span>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="text-xs font-semibold text-slate-700 outline-none bg-transparent"
            />
          </div>
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
            <Calendar className="w-4 h-4 text-pink-400 flex-shrink-0" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">To</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="text-xs font-semibold text-slate-700 outline-none bg-transparent"
            />
          </div>
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(''); setDateTo(''); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 border border-slate-200 bg-white/80 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors shadow-sm"
            >
              <X className="w-3.5 h-3.5" /> Clear Filter
            </button>
          )}
          <span className="ml-auto text-xs font-semibold text-slate-400">
            {filteredPayments.length} record{filteredPayments.length !== 1 ? 's' : ''}
            {(dateFrom || dateTo) ? ' (filtered)' : ''}
          </span>
        </div>

        {loading ? (
          <LoadingSpinner size="lg" className="py-12" />
        ) : (
          <div className="border border-slate-300 bg-white overflow-hidden shadow-sm">
            <div className="overflow-x-auto w-full max-w-full block"><table className="w-full text-sm text-left border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b-2 border-slate-300">
                <tr>
                  <th className="border border-slate-300 px-2 py-3 text-xs uppercase tracking-wider text-center w-12">S.No</th>
                  <th className="border border-slate-300 px-3 py-3 text-xs uppercase tracking-wider">Date</th>
                  <th className="border border-slate-300 px-3 py-3 text-xs uppercase tracking-wider">Student ID</th>
                  <th className="border border-slate-300 px-3 py-3 text-xs uppercase tracking-wider">Student Name</th>
                  <th className="border border-slate-300 px-3 py-3 text-xs uppercase tracking-wider">Fee Structure</th>
                  <th className="border border-slate-300 px-3 py-3 text-xs uppercase tracking-wider">Amount Paid</th>
                  <th className="border border-slate-300 px-3 py-3 text-xs uppercase tracking-wider hidden md:table-cell text-center">Method</th>
                  <th className="border border-slate-300 px-3 py-3 text-xs uppercase tracking-wider hidden md:table-cell">Receipt No</th>
                  <th className="border border-slate-300 px-3 py-3 text-xs uppercase tracking-wider text-center hidden md:table-cell">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((p, idx) => {
                  let d = new Date(p.paymentDate || p.createdAt);
                  if (d.getFullYear() < 2000) d = new Date(p.createdAt); // Fallback for bad excel dates

                  return (
                  <React.Fragment key={p.id}>
                  <tr onClick={() => toggleRow(p.id)} className="hover:bg-slate-50 transition-colors cursor-pointer md:cursor-default">
                    <td className="border border-slate-300 px-2 py-3 font-semibold text-slate-800 text-xs sm:text-sm text-center w-12">{idx + 1}</td>
                    <td className="border border-slate-300 px-3 py-3 text-slate-700 font-bold text-xs sm:text-sm whitespace-nowrap">
                      {d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="border border-slate-300 px-3 py-3 font-mono text-slate-600 text-xs sm:text-sm whitespace-nowrap">{p.student?.rollNo || '-'}</td>
                    <td className="border border-slate-300 px-3 py-3 font-semibold text-slate-800 text-xs sm:text-sm">{p.student?.user?.name || 'Unknown student'}</td>
                    <td className="border border-slate-300 px-3 py-3 text-slate-600 text-xs sm:text-sm">{p.feeStructure?.name || 'Deleted structure'}</td>
                    <td className="border border-slate-300 px-3 py-3 font-bold text-slate-800 text-xs sm:text-sm whitespace-nowrap">₹{p.amountPaid.toLocaleString()}</td>
                    <td className="border border-slate-300 px-3 py-3 hidden md:table-cell text-center">
                      <Badge variant={p.method === 'UPI' ? 'danger' : 'info'}>{p.method}</Badge>
                    </td>
                    <td className="border border-slate-300 px-3 py-3 font-mono text-xs text-slate-500 truncate max-w-[120px] hidden md:table-cell">{p.receiptNo}</td>
                    <td className="border border-slate-300 px-3 py-3 hidden md:table-cell text-center align-middle">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handlePrintReceipt(p.id); }}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                          title="Print Dual Receipt"
                        >
                          <FileDown className="w-4 h-4" />
                        </button>
                        
                        {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'ACCOUNTANT') ? (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleGenerateStatement(p.student); }}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-purple-600 hover:bg-purple-50 cursor-pointer"
                              title="Download Fee Statement PDF"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeletePayment(p.id); }}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                              title="Delete Payment"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                  {expandedRow === p.id && (
                    <tr className="md:hidden bg-indigo-50/20 border-b border-indigo-100/50 animate-scale-in origin-top">
                      <td colSpan={3} className="px-4 py-4 space-y-3">
                        <div className="flex justify-between text-xs items-center">
                          <span className="font-semibold text-slate-600">Date:</span>
                          <span className="text-slate-800">{new Date(p.paymentDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between text-xs items-center">
                          <span className="font-semibold text-slate-600">Method:</span>
                          <span><Badge variant={p.method === 'UPI' ? 'danger' : 'info'}>{p.method}</Badge></span>
                        </div>
                        <div className="flex justify-between text-xs items-center">
                          <span className="font-semibold text-slate-600">Receipt No:</span>
                          <span className="font-mono text-[10px] text-slate-500 truncate max-w-[150px]">{p.receiptNo || '-'}</span>
                        </div>
                        <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-indigo-100/60">
                          <button
                            onClick={(e) => { e.stopPropagation(); handlePrintReceipt(p.id); }}
                            className="flex-1 py-2 px-3 flex items-center justify-center gap-2 rounded-lg text-indigo-600 bg-indigo-100 hover:bg-indigo-200 font-bold text-xs active:scale-95 transition-transform"
                          >
                            <FileDown className="w-4 h-4" /> Receipt
                          </button>
                          
                          {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'ACCOUNTANT') ? (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleGenerateStatement(p.student); }}
                                className="flex-1 py-2 px-3 flex items-center justify-center gap-2 rounded-lg text-purple-600 bg-purple-100 hover:bg-purple-200 font-bold text-xs active:scale-95 transition-transform"
                              >
                                <FileText className="w-4 h-4" /> Statement
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeletePayment(p.id); }}
                                className="flex-1 py-2 px-3 flex items-center justify-center gap-2 rounded-lg text-red-600 bg-red-100 hover:bg-red-200 font-bold text-xs active:scale-95 transition-transform"
                              >
                                <Trash2 className="w-4 h-4" /> Delete
                              </button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                  );
                })}
              </tbody>
            </table></div>
          </div>
        )}
        </div>
      )}

      </div>

      {/* ── Excel Bulk Import Modal ── */}
      {showImportModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-4">
          <div className="fixed inset-0" onClick={() => { if (!importLoading) setShowImportModal(false); }} />
          <div className="relative w-full sm:max-w-2xl bg-white rounded-[2rem] shadow-[0_32px_80px_rgba(0,0,0,0.22)] overflow-hidden z-10 animate-scale-in flex flex-col max-h-[90vh]">

            {/* Modal header */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-7 py-6 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center shadow-lg">
                  <Upload className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-white">Import Fee Payments</h2>
                  <p className="text-emerald-200 text-xs mt-0.5">Upload Excel to bulk-record past payments</p>
                </div>
              </div>
              <button
                onClick={() => { if (!importLoading) setShowImportModal(false); }}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-5">
              {!importResult ? (
                <>
                  {/* Instructions */}
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800 space-y-1">
                    <p className="font-bold text-amber-900">📋 Required Excel Columns:</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-2">
                      <span>• <strong>Student ID</strong> — Roll No (e.g. ST001)</span>
                      <span>• <strong>Amount Paid</strong> — Number (e.g. 5000)</span>
                      <span>• <strong>Payment Mode</strong> — CASH / UPI / ONLINE / CHEQUE</span>
                      <span>• <strong>Payment Date</strong> — YYYY-MM-DD (e.g. 2026-07-29)</span>
                    </div>
                    <p className="text-amber-700 mt-2">Amount is automatically distributed across pending fee structures (oldest due date first). Receipt numbers are auto-generated.</p>
                  </div>

                  {/* Template download */}
                  <button
                    onClick={downloadTemplate}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50 text-emerald-700 font-bold text-sm hover:bg-emerald-100 transition-colors"
                  >
                    <FileDown className="w-4 h-4" />
                    Download Sample Template (.xlsx)
                  </button>

                  {/* Drag & Drop upload area */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv'))) {
                        setImportFile(file);
                      } else {
                        toast.error('Please drop a valid Excel file (.xlsx / .xls / .csv)');
                      }
                    }}
                    className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${dragOver ? 'border-emerald-500 bg-emerald-50 scale-[1.01]' : 'border-slate-200 bg-slate-50 hover:border-emerald-300 hover:bg-emerald-50/40'}`}
                    onClick={() => document.getElementById('fee-import-file-input')?.click()}
                  >
                    <input
                      id="fee-import-file-input"
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setImportFile(file);
                      }}
                    />
                    {importFile ? (
                      <div className="space-y-2">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto">
                          <FileText className="w-6 h-6 text-emerald-600" />
                        </div>
                        <p className="font-bold text-emerald-800 text-sm">{importFile.name}</p>
                        <p className="text-xs text-emerald-600">{(importFile.size / 1024).toFixed(1)} KB — Click to change</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="w-12 h-12 rounded-2xl bg-slate-200 flex items-center justify-center mx-auto">
                          <Upload className="w-6 h-6 text-slate-400" />
                        </div>
                        <p className="font-semibold text-slate-600 text-sm">Drag & drop your Excel file here</p>
                        <p className="text-xs text-slate-400">or click to browse — .xlsx, .xls, .csv supported</p>
                      </div>
                    )}
                  </div>

                  {/* Import button */}
                  <button
                    onClick={handleBulkImport}
                    disabled={!importFile || importLoading}
                    className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                  >
                    {importLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Importing payments...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Start Import
                      </>
                    )}
                  </button>
                </>
              ) : (
                /* ── Results View ── */
                <div className="space-y-4">
                  {/* Summary cards */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                      <p className="text-2xl font-black text-emerald-700">{importResult.summary.success}</p>
                      <p className="text-xs font-bold text-emerald-600 mt-0.5">Success</p>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
                      <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-1" />
                      <p className="text-2xl font-black text-red-700">{importResult.summary.errors}</p>
                      <p className="text-xs font-bold text-red-600 mt-0.5">Errors</p>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
                      <MinusCircle className="w-6 h-6 text-amber-500 mx-auto mb-1" />
                      <p className="text-2xl font-black text-amber-700">{importResult.summary.skipped}</p>
                      <p className="text-xs font-bold text-amber-600 mt-0.5">Skipped</p>
                    </div>
                  </div>

                  {/* Row-by-row result table */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Import Results — {importResult.summary.total} Rows Processed</p>
                    </div>
                    <div className="max-h-56 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50/80 sticky top-0">
                          <tr>
                            <th className="text-left px-4 py-2 text-slate-500 font-bold">Row</th>
                            <th className="text-left px-4 py-2 text-slate-500 font-bold">Student ID</th>
                            <th className="text-left px-4 py-2 text-slate-500 font-bold">Status</th>
                            <th className="text-left px-4 py-2 text-slate-500 font-bold">Receipt No / Note</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {importResult.results.map((r: any, i: number) => (
                            <tr key={i} className={r.status === 'SUCCESS' ? 'bg-emerald-50/40' : r.status === 'ERROR' ? 'bg-red-50/40' : 'bg-amber-50/30'}>
                              <td className="px-4 py-2 font-mono text-slate-500">{r.row}</td>
                              <td className="px-4 py-2 font-bold text-slate-800">{r.rollNo}</td>
                              <td className="px-4 py-2">
                                {r.status === 'SUCCESS' && <span className="inline-flex items-center gap-1 text-emerald-700 font-bold"><CheckCircle2 className="w-3 h-3" /> Success</span>}
                                {r.status === 'ERROR' && <span className="inline-flex items-center gap-1 text-red-600 font-bold"><AlertCircle className="w-3 h-3" /> Error</span>}
                                {r.status === 'SKIPPED' && <span className="inline-flex items-center gap-1 text-amber-600 font-bold"><MinusCircle className="w-3 h-3" /> Skipped</span>}
                              </td>
                              <td className="px-4 py-2 font-mono text-slate-500 text-[10px]">{r.receiptNo || r.error || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Action buttons after import */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setImportResult(null); setImportFile(null); }}
                      className="flex-1 py-3 rounded-xl font-bold text-sm border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      Import Another File
                    </button>
                    <button
                      onClick={() => setShowImportModal(false)}
                      className="flex-1 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md transition-all hover:-translate-y-0.5"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hidden Print Component */}
      <FeeReceiptPrint payment={printPayment} />
    </div>
  );
};
export default FeePaymentsPage;

