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
  const [showModal, setShowModal] = useState(false);
  const [printPayment, setPrintPayment] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [studentId, setStudentId] = useState('');
  const [selectedFees, setSelectedFees] = useState<{ feeStructureId: string; amountPaid: number }[]>([]);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [method, setMethod] = useState('CASH');
  const [remarks, setRemarks] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
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
    return list.sort((a, b) => new Date(b.paymentDate || b.createdAt).getTime() - new Date(a.paymentDate || a.createdAt).getTime());
  }, [payments, dateFrom, dateTo]);

  const toggleRow = (id: string) => setExpandedRow(prev => prev === id ? null : id);

  // Smart student selector states
  const [filterClass, setFilterClass] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [searchName, setSearchName] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);

  // Derived unique classes and sections from loaded class configuration
  const uniqueClassNames = useMemo(() => {
    return Array.from(new Set(classes.map(c => c.name))).sort((a, b) => a.localeCompare(b));
  }, [classes]);

  const uniqueSections = useMemo(() => {
    const sections = new Set<string>();
    classes
      .filter(c => !filterClass || c.name === filterClass)
      .forEach(c => { if (c.section) sections.add(c.section); });
    return Array.from(sections).sort();
  }, [classes, filterClass]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchClass = !filterClass || s.class?.name === filterClass;
      const matchSection = !filterSection || s.class?.section === filterSection;
      const matchName = !searchName || 
        s.user?.name?.toLowerCase().includes(searchName.toLowerCase()) ||
        s.rollNo?.toLowerCase().includes(searchName.toLowerCase());
      return matchClass && matchSection && matchName;
    });
  }, [students, filterClass, filterSection, searchName]);

  const fetchData = async () => {
    try {
      const isStudent = user?.role === 'STUDENT';
      const [payRes, studRes, structRes, classRes]: any = await Promise.all([
        api.get('/api/fees/payments?limit=5000'),
        isStudent ? Promise.resolve({ data: [] }) : api.get('/api/students?limit=5000'),
        isStudent ? Promise.resolve({ data: [] }) : api.get('/api/fees/structures?limit=5000'),
        isStudent ? Promise.resolve({ data: [] }) : api.get('/api/classes?limit=5000'),
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const uploadToast = toast.loading('Uploading payment receipt...');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res: any = await api.post('/api/uploads/document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data.data?.url || res.data.url;
      setReceiptUrl(url);
      toast.success('Payment receipt uploaded successfully!', { id: uploadToast });
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload payment receipt.', { id: uploadToast });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (selectedFees.length === 0) {
      toast.error('Please select at least one fee component to pay.');
      return;
    }
    const isAdminOrSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
    if (method === 'UPI' && !utrNumber && !isAdminOrSuperAdmin) {
      toast.error('UTR Reference Number is required for UPI payments.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/api/fees/payments', {
        studentId,
        payments: selectedFees,
        method,
        remarks,
        utrNumber: method === 'UPI' ? utrNumber : null,
        receiptUrl: method === 'UPI' ? receiptUrl : null,
        paymentDate,
      });
      toast.success('Payment transaction recorded!');
      setShowModal(false);
      setStudentId('');
      setSelectedFees([]);
      setRemarks('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setUtrNumber('');
      setReceiptUrl('');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Error recording payment');
    } finally {
      setIsSubmitting(false);
    }
  };

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
                <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-bold bg-white text-indigo-600 hover:bg-white/90 shadow-md transition-all"
                >
                  <Plus className="w-4 h-4" /> Collect Payment
                </button>
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
                  <th className="border border-slate-300 px-3 py-3 text-xs uppercase tracking-wider text-center">S.No</th>
                  <th className="border border-slate-300 px-3 py-3 text-xs uppercase tracking-wider">Student</th>
                  <th className="border border-slate-300 px-3 py-3 text-xs uppercase tracking-wider">Fee Structure</th>
                  <th className="border border-slate-300 px-3 py-3 text-xs uppercase tracking-wider">Amount Paid</th>
                  <th className="border border-slate-300 px-3 py-3 text-xs uppercase tracking-wider hidden md:table-cell">Date</th>
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
                    <td className="border border-slate-300 px-3 py-3 font-semibold text-slate-800 text-xs sm:text-sm text-center">{idx + 1}</td>
                    <td className="border border-slate-300 px-3 py-3 font-semibold text-slate-800 text-xs sm:text-sm">{p.student?.user?.name || 'Unknown student'}</td>
                    <td className="border border-slate-300 px-3 py-3 text-slate-600 text-xs sm:text-sm">{p.feeStructure?.name || 'Deleted structure'}</td>
                    <td className="border border-slate-300 px-3 py-3 font-bold text-slate-800 text-xs sm:text-sm whitespace-nowrap">₹{p.amountPaid.toLocaleString()}</td>
                    <td className="border border-slate-300 px-3 py-3 hidden md:table-cell text-slate-600 font-medium">
                      {d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
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
                        {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'ACCOUNTANT') && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleGenerateStatement(p.student); }}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-purple-600 hover:bg-purple-50 cursor-pointer"
                            title="Download Fee Statement PDF"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        )}
                        {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'ACCOUNTANT') && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeletePayment(p.id); }}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                            title="Delete Payment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
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
                          {/* Fee Statement — Mobile */}
                          {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'ACCOUNTANT') && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleGenerateStatement(p.student); }}
                              className="flex-1 py-2 px-3 flex items-center justify-center gap-2 rounded-lg text-purple-600 bg-purple-100 hover:bg-purple-200 font-bold text-xs active:scale-95 transition-transform"
                            >
                              <FileText className="w-4 h-4" /> Statement
                            </button>
                          )}
                          {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'ACCOUNTANT') && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeletePayment(p.id); }}
                              className="flex-1 py-2 px-3 flex items-center justify-center gap-2 rounded-lg text-red-600 bg-red-100 hover:bg-red-200 font-bold text-xs active:scale-95 transition-transform"
                            >
                              <Trash2 className="w-4 h-4" /> Delete
                            </button>
                          )}
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

      {/* Record Payment Modal / Inline Form for Teachers */}
      {(showModal || user?.role === 'TEACHER') && (
        <div className={user?.role === 'TEACHER' ? "w-full max-w-4xl mx-auto mt-2" : "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-indigo-900/40 backdrop-blur-sm sm:backdrop-blur-md sm:p-4"}>
          {user?.role !== 'TEACHER' && <div className="fixed inset-0" onClick={() => setShowModal(false)} />}

          {/* ── Desktop-optimised modal shell ── */}
          <div className={`relative w-full h-full sm:h-auto ${
            user?.role === 'TEACHER'
              ? 'sm:rounded-[2rem] shadow-2xl'
              : 'sm:max-w-4xl sm:rounded-[24px] shadow-[0_20px_60px_rgba(30,30,80,0.15)]'
          } bg-white overflow-hidden flex flex-col sm:flex-row z-10 animate-scale-in max-h-[100dvh] sm:max-h-[90vh]`}>

            {/* LEFT sidebar – gradient brand panel (hidden on mobile) */}
            <div className="hidden sm:flex flex-col justify-between w-80 flex-shrink-0 bg-gradient-to-b from-indigo-600 via-purple-600 to-pink-500 p-8 text-white">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-5 shadow-lg">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-extrabold leading-tight">Collect Payment</h2>
                <p className="text-indigo-200 text-xs mt-2 leading-relaxed">Record a new fee payment transaction for the student.</p>
              </div>

              {/* Summary panel */}
              {selectedFees.length > 0 && (
                <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 space-y-2 border border-white/20">
                  <p className="text-xs font-bold text-indigo-200 uppercase tracking-wider">Total to Collect</p>
                  <p className="text-3xl font-black text-white">₹{selectedFees.reduce((sum, f) => sum + f.amountPaid, 0).toLocaleString()}</p>
                  {selectedStudent && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/20">
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-black">{selectedStudent.user.name?.[0]?.toUpperCase()}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">{selectedStudent.user.name}</p>
                        <p className="text-[10px] text-indigo-300">{selectedStudent.class ? `${selectedStudent.class.name}-${selectedStudent.class.section}` : ''}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!selectedFees.length && (
                <div className="text-[11px] text-indigo-300 text-center border border-white/20 rounded-xl py-4 px-3">
                  Select a student &amp; fee components to see the summary here.
                </div>
              )}
            </div>

            {/* RIGHT – scrollable form */}
            <div className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50/60 to-white pb-6 sm:pb-0">
              {/* Mobile header */}
              <div className="sm:hidden flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm sticky top-0 z-20">
                <h2 className="text-sm font-extrabold">Collect Payment</h2>
                <button type="button" onClick={() => setShowModal(false)} className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Desktop close btn */}
              {user?.role !== 'TEACHER' && (
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="hidden sm:flex absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 items-center justify-center text-gray-500 transition-colors z-20"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <form onSubmit={handleSubmit} className="p-4 sm:p-7 space-y-3 sm:space-y-5">

                {/* ── Smart Student Selector ── */}
                <div className="space-y-2 sm:space-y-3">
                  <p className="text-[10px] sm:text-xs font-extrabold text-slate-500 uppercase tracking-widest hidden sm:block">Select Student</p>

                  {/* Row 1: Class + Section */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div>
                      <label className="text-[9px] sm:text-[10px] font-bold text-purple-500 uppercase tracking-wider mb-0.5 sm:mb-1 block">Class</label>
                      <select
                        value={filterClass}
                        onChange={(e) => { setFilterClass(e.target.value); setFilterSection(''); setSelectedStudent(null); setStudentId(''); setSelectedFees([]); }}
                        className="w-full px-2 py-1.5 sm:px-3 sm:py-2.5 text-xs border border-purple-100 rounded-lg sm:rounded-xl bg-purple-50/50 outline-none focus:ring-2 focus:ring-purple-400 font-semibold text-purple-900"
                      >
                        <option value="">All Classes</option>
                        {uniqueClassNames.map((name) => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] sm:text-[10px] font-bold text-purple-500 uppercase tracking-wider mb-0.5 sm:mb-1 block">Section</label>
                      <select
                        value={filterSection}
                        onChange={(e) => { setFilterSection(e.target.value); setSelectedStudent(null); setStudentId(''); setSelectedFees([]); }}
                        className="w-full px-2 py-1.5 sm:px-3 sm:py-2.5 text-xs border border-purple-100 rounded-lg sm:rounded-xl bg-purple-50/50 outline-none focus:ring-2 focus:ring-purple-400 font-semibold text-purple-900"
                      >
                        <option value="">All Sections</option>
                        {uniqueSections.map(sec => (
                          <option key={sec} value={sec}>{sec}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Row 2: Search box with live dropdown */}
                  <div className="relative">
                    <label className="text-[9px] sm:text-[10px] font-bold text-pink-500 uppercase tracking-wider mb-0.5 sm:mb-1 block">Search by Name or Roll No</label>
                    <div className="relative">
                      <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-3.5 sm:h-3.5 text-pink-400" />
                      <input
                        type="text"
                        placeholder="Type student name..."
                        value={searchName}
                        onFocus={() => setShowStudentDropdown(true)}
                        onChange={(e) => { setSearchName(e.target.value); setShowStudentDropdown(true); }}
                        className="w-full pl-7 sm:pl-8 pr-7 sm:pr-8 py-1.5 sm:py-2.5 text-xs border border-pink-100 rounded-lg sm:rounded-xl bg-pink-50/50 outline-none focus:ring-2 focus:ring-pink-400 font-medium text-pink-900"
                      />
                      {searchName && (
                        <button type="button" onClick={() => { setSearchName(''); setSelectedStudent(null); setStudentId(''); setSelectedFees([]); }} className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-pink-400 hover:text-pink-600">
                          <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Dropdown results */}
                    {showStudentDropdown && (searchName || filterClass || filterSection) && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-pink-100 rounded-xl shadow-xl z-50 max-h-44 overflow-y-auto">
                        {filteredStudents.length === 0 ? (
                          <div className="px-4 py-3 text-xs text-pink-400 text-center">No students found</div>
                        ) : (
                          filteredStudents.slice(0, 20).map(s => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => {
                                setSelectedStudent(s);
                                setStudentId(s.id);
                                setSearchName(s.user.name);
                                setSelectedFees([]);
                                setShowStudentDropdown(false);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-pink-50 text-left transition-colors border-b border-pink-50 last:border-0"
                            >
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                                <span className="text-[10px] font-black text-white">{s.user.name?.[0]?.toUpperCase()}</span>
                              </div>
                              <div>
                                <p className="text-xs font-bold text-gray-900">{s.user.name}</p>
                                <p className="text-[10px] text-pink-500 font-medium">{s.rollNo} • {s.class ? `${s.class.name}-${s.class.section}` : 'No class'}</p>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* Selected student badge */}
                  {selectedStudent && (
                    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg sm:rounded-xl shadow-sm mt-2">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md">
                        <span className="text-sm font-black text-white">{selectedStudent.user.name?.[0]?.toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-indigo-900 truncate">{selectedStudent.user.name}</p>
                        <p className="text-[10px] font-semibold text-indigo-600">{selectedStudent.rollNo} • {selectedStudent.class ? `${selectedStudent.class.name}-${selectedStudent.class.section}` : 'No class'}</p>
                      </div>
                      <button type="button" onClick={() => { setSelectedStudent(null); setStudentId(''); setSearchName(''); setSelectedFees([]); }} className="text-indigo-400 hover:text-indigo-600 bg-white p-1 rounded-full shadow-sm">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* ── Fee Components ── */}
                {studentId && (
                  <div>
                    <p className="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-2">Fee Components &amp; Amount</p>
                    <div className="space-y-2 border border-indigo-100 rounded-xl p-3 bg-white/60 backdrop-blur-sm max-h-44 overflow-y-auto shadow-inner">
                      {(() => {
                        const availableStructures = structures.filter((s) => s.studentId === studentId || s.classId === students.find((st) => st.id === studentId)?.classId);
                        const allPaid = availableStructures.every(s => {
                          const paidSoFar = payments.filter(p => p.studentId === studentId && p.feeStructureId === s.id).reduce((sum, p) => sum + p.amountPaid, 0);
                          return Math.max(0, s.amount - paidSoFar) <= 0;
                        });

                        return (
                          <>
                            {availableStructures.map((s) => {
                              const paidSoFar = payments.filter(p => p.studentId === studentId && p.feeStructureId === s.id).reduce((sum, p) => sum + p.amountPaid, 0);
                              const pendingAmount = Math.max(0, s.amount - paidSoFar);
                              if (pendingAmount <= 0) return null;
                              const isSelected = selectedFees.find(f => f.feeStructureId === s.id);
                              return (
                                <div key={s.id} className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${isSelected ? 'bg-indigo-50 border-indigo-300 shadow-sm' : 'bg-white border-gray-100 hover:border-indigo-200'}`}>
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="checkbox"
                                      className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                      checked={!!isSelected}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedFees([...selectedFees, { feeStructureId: s.id, amountPaid: pendingAmount }]);
                                        } else {
                                          setSelectedFees(selectedFees.filter(f => f.feeStructureId !== s.id));
                                        }
                                      }}
                                    />
                                    <div>
                                      <p className="text-xs font-bold text-gray-900">{s.name}</p>
                                      <p className="text-[10px] text-pink-600 font-semibold">Pending: ₹{pendingAmount}</p>
                                    </div>
                                  </div>
                                  {isSelected && (
                                    <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-indigo-100 shadow-sm">
                                      <span className="text-xs text-indigo-500 font-bold px-1">₹</span>
                                      <input
                                        type="number"
                                        className="w-20 px-2 py-1 text-xs border-0 rounded focus:ring-0 outline-none text-indigo-900 font-bold bg-transparent"
                                        value={isSelected.amountPaid}
                                        onChange={(e) => {
                                          setSelectedFees(selectedFees.map(f => f.feeStructureId === s.id ? { ...f, amountPaid: Number(e.target.value) } : f));
                                        }}
                                        max={pendingAmount}
                                      />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            {allPaid && (
                              <p className="text-xs text-emerald-600 font-bold text-center py-4 bg-emerald-50 rounded-lg border border-emerald-100">✨ All fees cleared for this student!</p>
                            )}
                          </>
                        );
                      })()}
                    </div>

                    {/* Mobile total */}
                    {selectedFees.length > 0 && (
                      <div className="sm:hidden mt-3 flex justify-between items-center p-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl shadow-lg text-white">
                        <span className="text-sm font-bold text-white/90">Total Amount to Pay</span>
                        <span className="text-2xl font-black">₹{selectedFees.reduce((sum, f) => sum + f.amountPaid, 0).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Two-column row: Date + Method (desktop) ── */}
                <div className="grid grid-cols-2 gap-2 sm:gap-4 mt-2">
                  <div>
                    <label className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5 sm:mb-1 block">Payment Date</label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full px-2 py-1.5 sm:px-3 sm:py-2.5 text-xs border border-slate-200 rounded-lg sm:rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-400 font-semibold text-slate-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5 sm:mb-1 block">Payment Method</label>
                    <select
                      value={method}
                      onChange={(e) => setMethod(e.target.value)}
                      className="w-full px-2 py-1.5 sm:px-3 sm:py-2.5 text-xs border border-slate-200 rounded-lg sm:rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-400 font-semibold text-slate-900"
                    >
                      <option value="CASH">Cash</option>
                      <option value="ONLINE">Online Transfer</option>
                      <option value="BANK_TRANSFER">Bank Deposit</option>
                      <option value="CHEQUE">Cheque</option>
                      <option value="UPI">UPI / QR Code</option>
                    </select>
                  </div>
                </div>

                {/* ── UPI fields ── */}
                {method === 'UPI' && (
                  <div className="rounded-2xl border border-violet-200 bg-violet-50/50 p-4 space-y-4">
                    <p className="text-[10px] font-extrabold text-violet-500 uppercase tracking-widest">UPI / QR Payment Details</p>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">
                        UTR Reference Number
                        {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN')
                          ? <span className="ml-2 text-emerald-500 normal-case tracking-normal font-semibold">(Optional for Admin)</span>
                          : <span className="ml-1 text-red-500">*</span>
                        }
                      </label>
                      <input
                        type="text"
                        required={!(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN')}
                        placeholder="e.g. 12-digit transaction number"
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value)}
                        className="w-full px-3 py-2.5 text-xs border border-violet-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-violet-400 font-semibold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Upload Payment Receipt <span className="normal-case tracking-normal font-medium text-slate-400">(optional)</span></label>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                        className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-violet-100 file:text-violet-700 hover:file:bg-violet-200 cursor-pointer"
                      />
                      {isUploading && (
                        <span className="text-[10px] text-violet-500 block mt-1 animate-pulse">Uploading receipt...</span>
                      )}
                      {receiptUrl && (
                        <span className="text-[10px] text-emerald-600 font-bold block mt-1">✓ Receipt uploaded successfully</span>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Remarks ── */}
                <div>
                  <label className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5 sm:mb-1 block">Remarks</label>
                  <input
                    type="text"
                    placeholder="e.g. Cleared full balance"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full px-2 py-1.5 sm:px-3 sm:py-2.5 text-xs border border-slate-200 rounded-lg sm:rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-400 font-medium text-slate-900"
                  />
                </div>

                {/* ── Action buttons ── */}
                <div className="flex gap-2 sm:gap-3 justify-end pt-2 sm:pt-4 border-t border-slate-100 mt-2 pb-4 sm:pb-0">
                  {user?.role !== 'TEACHER' && (
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="hidden sm:block px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-initial sm:w-auto px-4 py-2.5 sm:px-8 sm:py-3 text-sm font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 text-white shadow-xl shadow-purple-500/25 transform transition-all hover:-translate-y-0.5 rounded-lg sm:rounded-xl disabled:opacity-70"
                  >
                    {isSubmitting ? 'Recording...' : 'Confirm & Record'}
                  </button>
                </div>
              </form>
            </div>
          </div>
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

