import React, { useEffect, useState, useMemo } from 'react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Badge } from '../../components/UI/Badge';
import { Plus, FileDown, Trash2, Search, X, ChevronDown, FileText } from 'lucide-react';
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
  const [showModal, setShowModal] = useState(searchParams.get('action') === 'collect');
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
        api.get('/api/fees/payments'),
        isStudent ? Promise.resolve({ data: [] }) : api.get('/api/students?limit=1000'),
        isStudent ? Promise.resolve({ data: [] }) : api.get('/api/fees/structures'),
        isStudent ? Promise.resolve({ data: [] }) : api.get('/api/classes?page=1&limit=100'),
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

  const exportPaymentsExcel = async () => {
    const importToast = toast.loading('Generating Excel sheet...');
    try {
      const response: any = await api.get('/api/reports/fees', {
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
      const response: any = await api.get('/api/reports/fees/pdf', {
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
    <div className="space-y-4 sm:space-y-6 md:space-y-8 p-0 sm:p-4 md:p-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 min-h-screen animate-fade-in-up pb-24 overflow-x-hidden">
      
      {/* Mobile Header Title */}
      <div className="md:hidden bg-white px-4 py-3 border-b border-gray-100 shadow-sm sticky top-0 z-20 flex items-center justify-between">
        <h1 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Transaction History</h1>
        {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'ACCOUNTANT') && (
          <button
            onClick={exportPaymentsPdf}
            className="text-indigo-600 font-bold text-xs bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100"
          >
            Export PDF
          </button>
        )}
      </div>

      <div className="print:hidden space-y-4 sm:space-y-6 md:space-y-8">
      {user?.role !== 'TEACHER' && (
        <div className="hidden md:flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-5 sm:p-6 md:p-8 rounded-none sm:rounded-3xl shadow-xl text-white transform transition-all sm:hover:scale-[1.01]">
          <div>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">Fee Transaction Ledger</h3>
            <p className="text-indigo-100 mt-1 sm:mt-2 font-medium text-sm sm:text-lg opacity-90 leading-snug">Track paid, pending and overdue tuition invoices.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'ACCOUNTANT') && (
              <>
                <button
                  onClick={exportPaymentsExcel}
                  className="btn-secondary flex items-center gap-2 text-sm text-emerald-600 border border-emerald-100/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/10 cursor-pointer"
                >
                  <FileDown className="w-4.5 h-4.5" />
                  <span>Export Excel</span>
                </button>
                <button
                  onClick={exportPaymentsPdf}
                  className="btn-secondary flex items-center gap-2 text-sm text-indigo-600 border border-indigo-100/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/10 cursor-pointer"
                >
                  <FileDown className="w-4.5 h-4.5" />
                  <span>Export PDF</span>
                </button>
                {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
                  <Link to="/fees/structures" className="btn-secondary text-sm">
                    Structure Settings
                  </Link>
                )}
                <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
                  <Plus className="w-4.5 h-4.5" />
                  <span>Collect Payment</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {user?.role !== 'TEACHER' && (
        <div className="px-0 sm:px-0">
        {loading ? (
          <LoadingSpinner size="lg" className="py-12" />
        ) : (
          <div className="rounded-none sm:rounded-3xl border-y sm:border border-white/50 bg-white/80 backdrop-blur-lg overflow-hidden shadow-2xl">
            <div className="overflow-x-auto w-full max-w-full block"><table className="w-full text-sm text-left">
              <thead className="bg-indigo-50/50 text-indigo-900 font-bold border-b border-indigo-100">
                <tr>
                  <th className="px-2 sm:px-6 py-3 sm:py-4 text-[10px] sm:text-sm uppercase sm:normal-case">Student</th>
                  <th className="px-2 sm:px-6 py-3 sm:py-4 text-[10px] sm:text-sm uppercase sm:normal-case">Fee Structure</th>
                  <th className="px-2 sm:px-6 py-3 sm:py-4 text-[10px] sm:text-sm uppercase sm:normal-case">Amount Paid</th>
                  <th className="px-6 py-4 hidden md:table-cell">Date</th>
                  <th className="px-6 py-4 hidden md:table-cell">Method</th>
                  <th className="px-6 py-4 hidden md:table-cell">Receipt No</th>
                  <th className="px-6 py-4 text-right hidden md:table-cell">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payments.map((p) => (
                  <React.Fragment key={p.id}>
                  <tr onClick={() => toggleRow(p.id)} className="hover:bg-indigo-50/30 transition-colors cursor-pointer md:cursor-default">
                    <td className="px-2 sm:px-6 py-3 sm:py-4 font-bold text-slate-800 leading-tight text-xs sm:text-sm">{p.student?.user?.name || 'Unknown student'}</td>
                    <td className="px-2 sm:px-6 py-3 sm:py-4 text-slate-500 whitespace-normal break-words text-xs sm:text-sm">{p.feeStructure?.name || 'Deleted structure'}</td>
                    <td className="px-2 sm:px-6 py-3 sm:py-4 font-bold text-xs sm:text-sm whitespace-nowrap">₹{p.amountPaid.toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-500 hidden md:table-cell">
                      {new Date(p.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <Badge variant={p.method === 'UPI' ? 'danger' : 'info'}>{p.method}</Badge>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-400 opacity-70 truncate max-w-[120px] hidden md:table-cell">{p.receiptNo}</td>
                    <td className="px-6 py-4 text-right hidden md:flex items-center justify-end gap-2 h-full">
                      <button
                        onClick={(e) => { e.stopPropagation(); handlePrintReceipt(p.id); }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 cursor-pointer"
                        title="Print Dual Receipt"
                      >
                        <FileDown className="w-4 h-4" />
                      </button>
                      {/* Fee Statement Button */}
                      {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'ACCOUNTANT') && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleGenerateStatement(p.student); }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 cursor-pointer"
                          title="Download Fee Statement PDF"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      )}
                      {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'ACCOUNTANT') && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeletePayment(p.id); }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
                          title="Delete Payment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
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
                ))}
              </tbody>
            </table></div>
          </div>
        )}
        </div>
      )}

      {/* Record Payment Modal / Inline Form for Teachers */}
      {(showModal || user?.role === 'TEACHER') && (
        <div className={user?.role === 'TEACHER' ? "w-full max-w-4xl mx-auto mt-2" : "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-indigo-900/40 backdrop-blur-md p-4"}>
          {user?.role !== 'TEACHER' && <div className="fixed inset-0" onClick={() => setShowModal(false)} />}

          {/* ── Desktop-optimised modal shell ── */}
          <div className={`relative w-full ${
            user?.role === 'TEACHER'
              ? 'sm:rounded-[2rem] shadow-2xl'
              : 'sm:max-w-3xl sm:rounded-[2rem] shadow-[0_32px_80px_rgba(80,0,200,0.22)]'
          } bg-white overflow-hidden flex flex-col sm:flex-row z-10 animate-scale-in max-h-[92vh] sm:max-h-[85vh]`}>

            {/* LEFT sidebar – gradient brand panel (hidden on mobile) */}
            <div className="hidden sm:flex flex-col justify-between w-64 flex-shrink-0 bg-gradient-to-b from-purple-600 via-indigo-600 to-pink-600 p-7 text-white">
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
            <div className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50/60 to-white">
              {/* Mobile header */}
              <div className="sm:hidden flex items-center justify-between px-5 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                <h2 className="text-base font-extrabold">Collect Payment</h2>
                <button type="button" onClick={() => setShowModal(false)} className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                  <X className="w-4 h-4" />
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

              <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-5">

                {/* ── Smart Student Selector ── */}
                <div className="space-y-3">
                  <p className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">Select Student</p>

                  {/* Row 1: Class + Section */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-purple-500 uppercase tracking-wider mb-1 block">Class</label>
                      <select
                        value={filterClass}
                        onChange={(e) => { setFilterClass(e.target.value); setFilterSection(''); setSelectedStudent(null); setStudentId(''); setSelectedFees([]); }}
                        className="w-full px-3 py-2.5 text-xs border border-purple-100 rounded-xl bg-purple-50/50 outline-none focus:ring-2 focus:ring-purple-400 font-semibold text-purple-900"
                      >
                        <option value="">All Classes</option>
                        {uniqueClassNames.map((name) => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-purple-500 uppercase tracking-wider mb-1 block">Section</label>
                      <select
                        value={filterSection}
                        onChange={(e) => { setFilterSection(e.target.value); setSelectedStudent(null); setStudentId(''); setSelectedFees([]); }}
                        className="w-full px-3 py-2.5 text-xs border border-purple-100 rounded-xl bg-purple-50/50 outline-none focus:ring-2 focus:ring-purple-400 font-semibold text-purple-900"
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
                    <label className="text-[10px] font-bold text-pink-500 uppercase tracking-wider mb-1 block">Search by Name or Roll No</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-pink-400" />
                      <input
                        type="text"
                        placeholder="Type student name..."
                        value={searchName}
                        onFocus={() => setShowStudentDropdown(true)}
                        onChange={(e) => { setSearchName(e.target.value); setShowStudentDropdown(true); }}
                        className="w-full pl-8 pr-8 py-2.5 text-xs border border-pink-100 rounded-xl bg-pink-50/50 outline-none focus:ring-2 focus:ring-pink-400 font-medium text-pink-900"
                      />
                      {searchName && (
                        <button type="button" onClick={() => { setSearchName(''); setSelectedStudent(null); setStudentId(''); setSelectedFees([]); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-pink-400 hover:text-pink-600">
                          <X className="w-3.5 h-3.5" />
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
                    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl shadow-sm">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Payment Date</label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-400 font-semibold text-slate-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Payment Method</label>
                    <select
                      value={method}
                      onChange={(e) => setMethod(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-400 font-semibold text-slate-900"
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
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Remarks</label>
                  <input
                    type="text"
                    placeholder="e.g. Cleared full balance"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-400 font-medium text-slate-900"
                  />
                </div>

                {/* ── Action buttons ── */}
                <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 mt-2">
                  {user?.role !== 'TEACHER' && (
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="hidden sm:block px-6 py-3 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-initial sm:w-auto px-8 py-3 text-sm font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 text-white shadow-xl shadow-purple-500/25 transform transition-all hover:-translate-y-0.5 rounded-xl disabled:opacity-70"
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

      {/* Hidden Print Component */}
      <FeeReceiptPrint payment={printPayment} />
    </div>
  );
};
export default FeePaymentsPage;

