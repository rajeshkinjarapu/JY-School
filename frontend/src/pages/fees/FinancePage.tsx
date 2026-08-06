import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';

import { Badge } from '../../components/UI/Badge';
import {
  CreditCard, Plus, FileDown, ShieldCheck, Printer, ArrowRight,
  TrendingUp, Wallet, Award, Briefcase, DollarSign, Layers,
  Receipt, FileText, Search, Filter, Trash2, Edit3, Calendar,
  Clock, CheckCircle, AlertTriangle, Users, Upload
} from 'lucide-react';
import toast from 'react-hot-toast';
import { StudentFeeDetailsTab } from './StudentFeeDetailsTab';
import { ClassWiseFeeReportTab } from './ClassWiseFeeReportTab';
import { FeeStructurePage } from './FeeStructurePage';
import * as XLSX from 'xlsx';

export const FinancePage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'ACCOUNTANT';

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'home';

  const [baseLoading, setBaseLoading] = useState(false);
  const [heavyLoading, setHeavyLoading] = useState(false);
  const [baseDataLoaded, setBaseDataLoaded] = useState(false);
  const [heavyDataLoaded, setHeavyDataLoaded] = useState(false);

  // Initialize mock data synchronously from localStorage (instant)
  const initMockSync = (key: string, defaults: any[]) => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaults;
    } catch { return defaults; }
  };

  // Database-backed states
  const [payments, setPayments] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);

  // CRUD States for Structures (Admin only)
  const [showStructureModal, setShowStructureModal] = useState(false);
  const [structClassId, setStructClassId] = useState('');
  const [structGroup, setStructGroup] = useState('Tuition fee');
  const [structName, setStructName] = useState('');
  const [structAmount, setStructAmount] = useState('');
  const [structStatus, setStructStatus] = useState('Active');
  // CRUD States for Payments  // ── Modals & State ──
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionData, setTransactionData] = useState<any>(null);

  // Bulk Payment Import
  const paymentFileInputRef = useRef<HTMLInputElement>(null);

  const handleBulkPaymentImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const importToast = toast.loading('Uploading payments...');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res: any = await api.post('/api/fees/payments/bulk-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = res.data?.data || res.data || {};
      toast.success(`Import complete! ✅ Success: ${data.success || 0} | ❌ Failed: ${data.failed || 0}`, { id: importToast, duration: 5000 });
      fetchData(); // Refresh UI
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Bulk import failed. Please verify format rules.', { id: importToast });
    } finally {
      if (paymentFileInputRef.current) paymentFileInputRef.current.value = '';
    }
  };

  const [payStudentId, setPayStudentId] = useState('');
  const [payStructureId, setPayStructureId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('CASH');
  const [payRemarks, setPayRemarks] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Local storage states - initialized synchronously for INSTANT render
  const [paymentMethods, setPaymentMethods] = useState<any[]>(() => initMockSync('fin_payment_methods', [
    { id: '1', name: 'Cash', isActive: true, notes: 'Direct cash collection at counter' },
    { id: '2', name: 'UPI / PhonePe / GPay', isActive: true, notes: 'Instant UPI transfer' },
    { id: '3', name: 'Bank Transfer / IMPS', isActive: true, notes: 'Direct bank settlement' },
    { id: '4', name: 'Credit / Debit Card', isActive: false, notes: 'POS machine or payment gateway' },
  ]));
  const [feeGroups, setFeeGroups] = useState<any[]>(() => initMockSync('fin_fee_groups', [
    { id: '1', name: 'Academic Fees', description: 'Standard tuition and examination fees' },
    { id: '2', name: 'Transport Fees', description: 'Bus commute and route subscription fees' },
    { id: '3', name: 'Hostel Fees', description: 'Room rent, mess, and utility expenses' },
    { id: '4', name: 'Extracurricular Fees', description: 'Sports, events, and lab equipment charges' },
  ]));
  const [feeHeads, setFeeHeads] = useState<any[]>(() => initMockSync('fin_fee_heads', [
    { id: '1', name: 'Tuition fee', groupId: '1', description: 'Academic tuition' },
    { id: '2', name: 'Admission fee', groupId: '1', description: 'One-time admission charge' },
    { id: '3', name: 'Books Fee', groupId: '2', description: 'Cost of books and materials' },
    { id: '4', name: 'Other Fee', groupId: '3', description: 'Other miscellaneous fees' },
  ]));
  const [feeConcessions, setFeeConcessions] = useState<any[]>(() => initMockSync('fin_fee_concessions', [
    { id: '1', name: 'Sibling Waiver (10%)', type: 'PERCENT', value: 10 },
    { id: '2', name: 'Staff Child Discount (50%)', type: 'PERCENT', value: 50 },
    { id: '3', name: 'Sports Merit Scholarship', type: 'FIXED', value: 5000 },
  ]));
  const [ledgerTypes, setLedgerTypes] = useState<any[]>(() => initMockSync('fin_ledger_types', [
    { id: '1', name: 'Revenue (Income)' },
    { id: '2', name: 'Expense' },
    { id: '3', name: 'Asset (Bank/Cash)' },
    { id: '4', name: 'Liability' },
  ]));
  const [ledgers, setLedgers] = useState<any[]>(() => initMockSync('fin_ledgers', [
    { id: '1', name: 'Tuition Fee Revenue A/C', typeId: '1' },
    { id: '2', name: 'Bus Fee Revenue A/C', typeId: '1' },
    { id: '3', name: 'JY SCHOOL Operations Bank A/C', typeId: '3' },
    { id: '4', name: 'Petty Cash Counter A/C', typeId: '3' },
  ]));

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [filterClass, setFilterClass] = useState('ALL');
  const [filterSection, setFilterSection] = useState('ALL');

  // Receipt Modal State
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  
  // Expandable Row State for Mobile
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleApprovePayment = async (id: string) => {
    try {
      await api.put(`/api/fees/payments/${id}`, { status: 'PAID' });
      toast.success('Payment approved successfully');
      fetchData();
    } catch (e: any) {
      toast.error('Failed to approve payment');
    }
  };

  // Bulk Upload Ref
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const fetchBaseData = async () => {
    try {
      const isStudent = user?.role === 'STUDENT';
      const [structRes, classRes]: any = await Promise.all([
        isStudent ? Promise.resolve({ data: [] }) : api.get('/api/fees/structures?limit=5000'),
        isStudent ? Promise.resolve({ data: [] }) : api.get('/api/classes?limit=5000'),
      ]);
      const newStructures = structRes.data || structRes || [];
      const newClasses = classRes.data || classRes || [];
      setStructures(newStructures);
      setClasses(newClasses);
      const cached = JSON.parse(localStorage.getItem('fin_dashboard_cache') || '{}');
      localStorage.setItem('fin_dashboard_cache', JSON.stringify({ ...cached, structures: newStructures, classes: newClasses }));
    } catch(e) {}
  };

  const fetchHeavyData = async () => {
    try {
      const isStudent = user?.role === 'STUDENT';
      const [payRes, studRes]: any = await Promise.allSettled([
        api.get('/api/fees/payments?limit=5000'),
        isStudent ? Promise.resolve({ data: [] }) : api.get('/api/students?limit=5000'),
      ]);

      let paymentArray = payments;
      let newStudents = students;

      if (payRes.status === 'fulfilled') {
        const paymentData = payRes.value.data?.data || payRes.value.data || payRes.value || [];
        paymentArray = Array.isArray(paymentData) ? paymentData : [];
        setPayments(paymentArray);
      }

      if (studRes.status === 'fulfilled') {
        const studData = studRes.value.data?.data || studRes.value.data || studRes.value || [];
        newStudents = Array.isArray(studData) ? studData : (Array.isArray(studData.data) ? studData.data : []);
        setStudents(newStudents);
      }

      const cached = JSON.parse(localStorage.getItem('fin_dashboard_cache') || '{}');
      localStorage.setItem('fin_dashboard_cache', JSON.stringify({ ...cached, payments: paymentArray, students: newStudents }));
    } catch(e) {}
  };

  const fetchData = async () => {
    setBaseLoading(true);
    setHeavyLoading(true);
    await Promise.all([fetchBaseData(), fetchHeavyData()]);
    setBaseDataLoaded(true);
    setHeavyDataLoaded(true);
    setBaseLoading(false);
    setHeavyLoading(false);
  };

  // Load cache instantly on mount — no spinner, no wait
  useEffect(() => {
    try {
      const cached = localStorage.getItem('fin_dashboard_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.payments) setPayments(parsed.payments);
        if (parsed.students) setStudents(parsed.students);
        if (parsed.structures) setStructures(parsed.structures);
        if (parsed.classes) setClasses(parsed.classes);
      }
    } catch(e) {}
  }, []);

  // Fetch fresh data in background when tab changes — NO blocking spinner
  useEffect(() => {
    if (activeTab === 'home') return;

    const needsBase = ['fee-structure', 'transaction', 'student-fee-details', 'class-wise-fee-report'].includes(activeTab);
    const needsHeavy = ['transaction', 'student-fee-details', 'class-wise-fee-report'].includes(activeTab);

    if (needsBase && !baseDataLoaded) {
      setBaseLoading(true);
      fetchBaseData().then(() => {
        setBaseDataLoaded(true);
        setBaseLoading(false);
      });
    }
    if (needsHeavy && !heavyDataLoaded) {
      setHeavyLoading(true);
      fetchHeavyData().then(() => {
        setHeavyDataLoaded(true);
        setHeavyLoading(false);
      });
    }
  }, [user, activeTab]);

  // Save mocks back to local storage
  const saveMock = (key: string, data: any[]) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  /* ── Tab Change Helper ── */
  const setTab = (tab: string) => {
    if (tab === 'transaction') {
      window.location.href = '/fee-payment?action=collect';
      return;
    }
    setSearchParams({ tab });
  };

  /* ── CRUD Functions ── */
  const handleAddStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = structGroup === 'Other Fee' ? structName : structGroup;
    try {
      const res: any = await api.post('/api/fees/structures', {
        classId: structClassId,
        term: 'General',
        name: finalName,
        amount: Number(structAmount),
        dueDate: new Date(new Date().getFullYear() + 1, 11, 31).toISOString(),
      });
      
      const newStructure = res.data || res;
      if (newStructure && newStructure.id) {
        // Save metadata to localStorage
        const storedMeta = localStorage.getItem('fin_structure_metadata');
        const meta = storedMeta ? JSON.parse(storedMeta) : {};
        meta[newStructure.id] = {
          group: structGroup,
          status: structStatus
        };
        localStorage.setItem('fin_structure_metadata', JSON.stringify(meta));
      }

      toast.success('Fee structure added successfully!');
      setShowStructureModal(false);
      fetchData();
      setStructName('');
      setStructAmount('');
      setStructGroup('Tuition fee');
      setStructStatus('Active');
    } catch (err: any) {
      toast.error(err.message || 'Failed to add structure');
    }
  };

  const handleBulkImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const importToast = toast.loading('Uploading fees...');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res: any = await api.post('/api/fees/payments/bulk-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = res.data || res;
      if (data.failed && data.failed > 0) {
        toast.success(`Import complete! Added ${data.success} fees. Failed: ${data.failed} (check Student IDs)`, { id: importToast, duration: 5000 });
      } else {
        toast.success(`Import complete! Added ${data.success} fees.`, { id: importToast });
      }
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Bulk import failed. Please verify format rules.', { id: importToast });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingPayment) return;
    if (!payStudentId || !payStructureId || !payAmount || Number(payAmount) <= 0) {
      toast.error('Please select a student, fee component and enter a valid amount.');
      return;
    }
    setIsSubmittingPayment(true);
    try {
      await api.post('/api/fees/payments', {
        studentId: payStudentId,
        feeStructureId: payStructureId,
        amountPaid: Number(payAmount),
        method: payMethod,
        remarks: payRemarks,
      });
      toast.success('Payment transaction recorded!');
      setShowPaymentModal(false);
      fetchData();
      setPayStudentId('');
      setPayStructureId('');
      setPayAmount('');
      setPayRemarks('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to record payment');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handlePrintReceipt = async (paymentId: string) => {
    try {
      const response: any = await api.get(`/api/fees/payments/${paymentId}/invoice`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data || response], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Receipt_${paymentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (e) {
      toast.error('Failed to generate receipt');
    }
  };

  // Helper selectors
  const getClassName = (classId: string) => {
    const cls = classes.find(c => c.id === classId);
    return cls ? `${cls.name}-${cls.section}` : '';
  };

  // Filtered Payments for transaction tab
  const filteredPayments = payments.filter(p => {
    const studentName = p.student?.user?.name?.toLowerCase() || '';
    const feeName = p.feeStructure?.name?.toLowerCase() || '';
    const matchesSearch = studentName.includes(searchTerm.toLowerCase()) || feeName.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    const matchesClass = filterClass === 'ALL' || p.student?.class?.name === filterClass;
    const matchesSection = filterSection === 'ALL' || p.student?.class?.section === filterSection;
    return matchesSearch && matchesStatus && matchesClass && matchesSection;
  });

  const uniqueClassNames = [...new Set(classes.map(c => c.name))].sort();
  const availableSections = filterClass === 'ALL' ? [] : [...new Set(classes.filter(c => c.name === filterClass).map(c => c.section))].sort();

  const getDisplayDate = (p: any) => {
    let d = new Date(p.paymentDate || p.createdAt || new Date());
    if (d.getFullYear() < 2000) d = new Date(p.createdAt || new Date());
    return d.toLocaleDateString();
  };

  const FINANCE_MENU = [
    { key: 'payment-method', label: 'Payment Method', icon: CreditCard, gradient: 'from-indigo-500 to-blue-600', desc: 'Cash, UPI, Bank transfers' },
    { key: 'fee-group', label: 'Fee Group', icon: Layers, gradient: 'from-emerald-500 to-teal-600', desc: 'Academic, Transport, Hostel' },
    { key: 'fee-head', label: 'Fee Head', icon: DollarSign, gradient: 'from-amber-500 to-orange-500', desc: 'Tuition, Admission, Books' },
    { key: 'fee-concession', label: 'Fee Concession', icon: Award, gradient: 'from-rose-500 to-pink-600', desc: 'Sibling waiver, Merit scholarship' },
    { key: 'fee-structure', label: 'Fee Structure', icon: Briefcase, gradient: 'from-violet-500 to-purple-600', desc: 'Class-wise fee configuration' },
    { key: 'student-fee-details', label: 'Student Fee Details', icon: Users, gradient: 'from-cyan-500 to-sky-600', desc: 'Student balances & dues' },
    { key: 'class-wise-fee-report', label: 'Class Wise Fee Report', icon: FileText, gradient: 'from-orange-500 to-amber-600', desc: 'Class-wise fee collection status' },
    { key: 'transaction', label: 'Transaction', icon: Receipt, gradient: 'from-fuchsia-500 to-purple-600', desc: 'All payment transactions' },
    { key: 'receipt', label: 'Receipt', icon: FileText, gradient: 'from-lime-500 to-green-600', desc: 'Fee receipts & invoices' },
    { key: 'report', label: 'Report', icon: TrendingUp, gradient: 'from-blue-500 to-indigo-600', desc: 'Financial analytics & reports' },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50/50" style={{ minHeight: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <div className="px-6 py-6 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 w-full md:w-auto">
          <div className="p-2.5 sm:p-3 bg-white/20 rounded-xl sm:rounded-2xl shrink-0">
            <CreditCard className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
          </div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-black uppercase tracking-tight text-white drop-shadow-sm truncate">
            {activeTab === 'home' ? 'Finance' : FINANCE_MENU.find(m => m.key === activeTab)?.label || 'Finance'}
          </h1>
        </div>
        {activeTab !== 'home' && (
          <button
            onClick={() => setTab('home')}
            className="hidden md:flex items-center gap-1.5 px-4 py-2.5 text-sm font-extrabold text-teal-700 bg-white rounded-xl shadow hover:bg-teal-50 transition-colors cursor-pointer"
          >
            ← Back to Finance Home
          </button>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6">
      {/* ══ HOME GRID VIEW ══ */}
      {activeTab === 'home' && (
        <div className="w-full animate-fade-in">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5">
            {FINANCE_MENU.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => setTab(item.key)}
                  className="group relative overflow-hidden rounded-2xl p-5 text-left bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-sm`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 -rotate-45 group-hover:rotate-0 transition-all" />
                    </div>
                    <div className="mt-auto">
                      <h3 className="text-gray-900 font-black text-sm leading-tight mb-1">{item.label}</h3>
                      <p className="text-gray-400 text-xs font-medium leading-tight">{item.desc}</p>
                    </div>
                  </div>
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-300 pointer-events-none`} />
                </button>
              );
            })}
          </div>
        </div>
      )}


      {/* ══ SIDEBAR + CONTENT (when not on home) ══ */}
      {activeTab !== 'home' && (
        <>
      {/* LEFT SIDEBAR TABS */}
      <div className="hidden">
        <div className="px-3 py-2 text-xs font-black uppercase text-gray-400 tracking-wider flex items-center gap-1.5 border-b border-gray-100 dark:border-gray-800 mb-2">
          <Wallet className="w-4 h-4 text-indigo-500" />
          Finance Submenu
        </div>
        <button
          onClick={() => setTab('home')}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all text-left cursor-pointer text-gray-500 hover:bg-gray-50 hover:text-gray-900"
        >
          <ArrowRight className="w-4.5 h-4.5 rotate-180" />
          <span>← Back to Home</span>
        </button>
        {FINANCE_MENU.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setTab(tab.key)}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all text-left cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25 scale-[1.01]'
                  : 'text-gray-500 dark:text-gray-450 hover:bg-gray-50 dark:hover:bg-gray-800/40 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4.5 h-4.5" />
              <span>{tab.label}</span>
              <ArrowRight className={`w-3.5 h-3.5 ml-auto opacity-0 transition-opacity ${isActive ? 'opacity-100' : ''}`} />
            </button>
          );
        })}
      </div>

      {/* ══ RIGHT CONTENT PANEL ══ */}
      <div className="flex-1 bg-white dark:bg-gray-900 md:border border-gray-150 dark:border-gray-800 md:rounded-3xl p-0 md:p-8 md:shadow-sm">
        <>
          {/* ── 1. STUDENT FEE DETAILS TAB ── */}
            {activeTab === 'student-fee-details' && (
              heavyLoading && students.length === 0 ? (
                <div className="space-y-3 animate-pulse">
                  {[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl" />)}
                </div>
              ) : (
                <StudentFeeDetailsTab 
                  students={students} 
                  structures={structures} 
                  payments={payments} 
                  classes={classes} 
                />
              )
            )}

            {activeTab === 'payment-method' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
                  <div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white">Payment Methods</h3>
                    <p className="text-xs text-gray-400">Configure modes of payments available for school fees.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paymentMethods.map(m => (
                    <div key={m.id} className="p-5 bg-gray-50 dark:bg-gray-800/40 border border-gray-150 dark:border-gray-800 rounded-2xl flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="font-bold text-sm text-gray-900 dark:text-white">{m.name}</span>
                        <p className="text-xs text-gray-400">{m.notes}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.isActive ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/20' : 'bg-red-50 text-red-650'}`}>
                          {m.isActive ? 'Active' : 'Disabled'}
                        </span>
                        {isAdmin && (
                          <button
                            onClick={() => {
                              const updated = paymentMethods.map(item => item.id === m.id ? { ...item, isActive: !item.isActive } : item);
                              setPaymentMethods(updated);
                              saveMock('fin_payment_methods', updated);
                              toast.success('Status updated!');
                            }}
                            className="text-xs text-indigo-500 font-bold hover:underline cursor-pointer"
                          >
                            Toggle
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── 2. FEE GROUP TAB ── */}
            {activeTab === 'fee-group' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
                  <div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white">Fee Groups</h3>
                    <p className="text-xs text-gray-400">Manage categories of fees like Tuition, Hostel, and Transport.</p>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        const name = prompt('Enter Fee Group Name:');
                        const desc = prompt('Enter Description:');
                        if (name) {
                          const updated = [...feeGroups, { id: Date.now().toString(), name, description: desc }];
                          setFeeGroups(updated);
                          saveMock('fin_fee_groups', updated);
                          toast.success('Group added!');
                        }
                      }}
                      className="btn-primary py-1.5 px-3.5 text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Add Group
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="text-gray-450 border-b border-gray-150 dark:border-gray-800 font-bold">
                        <th className="pb-3 text-[10px] uppercase tracking-wider">Group Name</th>
                        <th className="pb-3 text-[10px] uppercase tracking-wider">Description</th>
                        {isAdmin && <th className="pb-3 text-right text-[10px] uppercase tracking-wider">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {feeGroups.map(g => (
                        <tr key={g.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-850/10">
                          <td className="py-4 font-bold text-gray-900 dark:text-white">{g.name}</td>
                          <td className="py-4 text-xs text-gray-400">{g.description || '-'}</td>
                          {isAdmin && (
                            <td className="py-4 text-right">
                              <button
                                onClick={() => {
                                  const updated = feeGroups.filter(item => item.id !== g.id);
                                  setFeeGroups(updated);
                                  saveMock('fin_fee_groups', updated);
                                  toast.success('Deleted!');
                                }}
                                className="text-red-500 hover:text-red-650 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── 3. FEE HEAD TAB ── */}
            {activeTab === 'fee-head' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
                  <div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white">Fee Heads</h3>
                    <p className="text-xs text-gray-400">Define particular components linked to fee groups.</p>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        const name = prompt('Enter Fee Head Name:');
                        const gId = prompt(`Select Group ID:\n${feeGroups.map(g => `${g.id}: ${g.name}`).join('\n')}`);
                        const desc = prompt('Enter Description:');
                        if (name && gId) {
                          const updated = [...feeHeads, { id: Date.now().toString(), name, groupId: gId, description: desc }];
                          setFeeHeads(updated);
                          saveMock('fin_fee_heads', updated);
                          toast.success('Fee Head added!');
                        }
                      }}
                      className="btn-primary py-1.5 px-3.5 text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Add Fee Head
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="text-gray-455 border-b border-gray-150 dark:border-gray-800 font-bold">
                        <th className="pb-3 text-[10px] uppercase tracking-wider">Fee Head</th>
                        <th className="pb-3 text-[10px] uppercase tracking-wider">Associated Group</th>
                        <th className="pb-3 text-[10px] uppercase tracking-wider">Description</th>
                        {isAdmin && <th className="pb-3 text-right text-[10px] uppercase tracking-wider">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {feeHeads.map(h => {
                        const group = feeGroups.find(g => g.id === h.groupId);
                        return (
                          <tr key={h.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-850/10">
                            <td className="py-4 font-bold text-gray-900 dark:text-white">{h.name}</td>
                            <td className="py-4">
                              <Badge variant="info">{group?.name || 'Default'}</Badge>
                            </td>
                            <td className="py-4 text-xs text-gray-400">{h.description || '-'}</td>
                            {isAdmin && (
                              <td className="py-4 text-right">
                                <button
                                  onClick={() => {
                                    const updated = feeHeads.filter(item => item.id !== h.id);
                                    setFeeHeads(updated);
                                    saveMock('fin_fee_heads', updated);
                                    toast.success('Deleted!');
                                  }}
                                  className="text-red-500 hover:text-red-650 cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── 4. FEE CONCESSION TAB ── */}
            {activeTab === 'fee-concession' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
                  <div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white">Fee Concessions</h3>
                    <p className="text-xs text-gray-400">Configure fee waivers or scholarship discount plans.</p>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        const name = prompt('Enter Concession Name:');
                        const type = prompt('Enter Type (PERCENT or FIXED):') || 'PERCENT';
                        const val = prompt('Enter Discount Value:');
                        if (name && val) {
                          const updated = [...feeConcessions, { id: Date.now().toString(), name, type, value: Number(val) }];
                          setFeeConcessions(updated);
                          saveMock('fin_fee_concessions', updated);
                          toast.success('Concession added!');
                        }
                      }}
                      className="btn-primary py-1.5 px-3.5 text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Add Concession
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {feeConcessions.map(c => (
                    <div key={c.id} className="p-5 bg-gray-50 dark:bg-gray-800/40 border border-gray-150 dark:border-gray-800 rounded-2xl flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="font-bold text-sm text-gray-900 dark:text-white">{c.name}</span>
                        <p className="text-xs text-indigo-500 font-extrabold">{c.type === 'PERCENT' ? `${c.value}% Off` : `₹${c.value.toLocaleString()} Off`}</p>
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => {
                            const updated = feeConcessions.filter(item => item.id !== c.id);
                            setFeeConcessions(updated);
                            saveMock('fin_fee_concessions', updated);
                            toast.success('Deleted!');
                          }}
                          className="text-red-500 hover:text-red-650 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  </div>
                </div>
              )}

              {/* ── 5. FEE STRUCTURE TAB ── */}
            {activeTab === 'fee-structure' && <FeeStructurePage structures={structures} setStructures={setStructures} classes={classes} refresh={fetchData} />}
            {activeTab === 'class-wise-fee-report' && <ClassWiseFeeReportTab classes={classes} students={students} payments={payments} structures={structures} />}

            {/* ── 8. TRANSACTION TAB ── */}
            {activeTab === 'transaction' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
                  <div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white">Transaction Logs</h3>
                    <p className="text-xs text-gray-400">List of fee collections and transaction statements.</p>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2 items-center flex-wrap">
                      <input
                        type="file"
                        ref={paymentFileInputRef}
                        className="hidden"
                        accept=".xlsx, .xls"
                        onChange={handleBulkPaymentImport}
                      />
                      <button
                        onClick={() => {
                          const ws = XLSX.utils.json_to_sheet([
                            { "Student ID": "JY26-0001", "Amount Paid": 15000, "Payment Mode": "UPI", "Payment Date": new Date().toISOString().split('T')[0] }
                          ]);
                          const wb = XLSX.utils.book_new();
                          XLSX.utils.book_append_sheet(wb, ws, "Payments");
                          XLSX.writeFile(wb, "Fee_Payments_Import_Template.xlsx");
                        }}
                        className="btn-secondary py-1.5 px-3.5 text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <FileDown className="w-4 h-4" /> Get Template
                      </button>
                      <button
                        onClick={() => paymentFileInputRef.current?.click()}
                        className="btn-secondary py-1.5 px-3.5 text-xs flex items-center gap-1 cursor-pointer bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 border-amber-200"
                      >
                        <Upload className="w-4 h-4" /> Import Payments
                      </button>
                      <button
                        onClick={() => {
                          if (students.length === 0 || structures.length === 0) {
                            toast.error('Ensure students and structures exist');
                            return;
                          }
                          const firstStudentId = students[0]?.id || '';
                          const firstStructureId = structures[0]?.id || '';
                          setPayStudentId(firstStudentId);
                          setPayStructureId(firstStructureId);
                          
                          const paidSoFar = payments.filter(p => p.studentId === firstStudentId && p.feeStructureId === firstStructureId).reduce((sum, p) => sum + p.amountPaid, 0);
                          const initialAmount = Math.max(0, (structures[0]?.amount || 0) - paidSoFar);
                          setPayAmount(initialAmount.toString());
                          setShowPaymentModal(true);
                        }}
                        className="btn-primary py-1.5 px-3.5 text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" /> Record Transaction
                      </button>
                    </div>
                  )}
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      className="input pl-10"
                      placeholder="Search student or fee title..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 flex-wrap">
                    <Filter className="w-4 h-4 text-gray-400 hidden sm:block" />
                    <select
                      className="input py-2 text-xs font-bold"
                      value={filterClass}
                      onChange={e => {
                        setFilterClass(e.target.value);
                        setFilterSection('ALL');
                      }}
                    >
                      <option value="ALL">All Classes</option>
                      {uniqueClassNames.map(cName => <option key={cName} value={cName}>Class {cName}</option>)}
                    </select>
                    {filterClass !== 'ALL' && (
                      <select
                        className="input py-2 text-xs font-bold"
                        value={filterSection}
                        onChange={e => setFilterSection(e.target.value)}
                      >
                        <option value="ALL">All Sec</option>
                        {availableSections.map(sec => <option key={sec} value={sec}>Sec {sec}</option>)}
                      </select>
                    )}
                    <select
                      className="input py-2 text-xs font-bold"
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                    >
                      <option value="ALL">All Status</option>
                      <option value="PAID">Paid</option>
                      <option value="PENDING">Pending</option>
                    </select>
                  </div>
                </div>

                <div className="md:bg-white/40 md:dark:bg-white/5 md:border md:border-white/60 md:dark:border-white/10 md:rounded-3xl md:shadow-sm overflow-hidden md:backdrop-blur-xl">
                  
                  {/* Mobile View */}
                  <div className="md:hidden flex flex-col px-4">
                    {filteredPayments.map((p, idx) => (
                      <div key={p.id} className="bg-transparent flex flex-col relative py-2">
                        <div 
                          className="flex items-center justify-between gap-1 cursor-pointer"
                          onClick={() => toggleRow(p.id)}
                        >
                          <div className="flex-1 min-w-0 flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-gray-400 w-4">{idx + 1}.</span>
                            <h4 className="font-extrabold text-[12px] text-gray-900 dark:text-white truncate max-w-[90px]">{p.student?.user?.name || 'Student'}</h4>
                            <span className="text-[9px] font-bold text-teal-700 bg-teal-50 px-1 py-0.5 rounded border border-teal-100 shrink-0 truncate max-w-[65px]">
                              {p.feeStructure?.name || 'Fee'}
                            </span>
                          </div>
                          <div className="shrink-0 flex items-center gap-1">
                            <span className="font-black text-indigo-600 dark:text-indigo-400 text-[13px]">₹{p.amountPaid.toLocaleString()}</span>
                            <div className={`transform transition-transform ${expandedRows[p.id] ? 'rotate-180' : ''}`}>
                              <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                            </div>
                          </div>
                        </div>

                        {expandedRows[p.id] && (
                          <div className="p-3 bg-gray-50/80 dark:bg-black/20 border-t border-gray-100 dark:border-white/5 space-y-3 animate-fade-in text-xs">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="block text-gray-400 font-bold mb-0.5 text-[10px] uppercase">Payment Method</span>
                                <span className="font-semibold text-gray-700 dark:text-gray-300">{p.method}</span>
                              </div>
                              <div>
                              <span className="block text-gray-400 font-bold mb-0.5 text-[10px] uppercase">Date</span>
                              <span className="font-semibold text-gray-700 dark:text-gray-300">{getDisplayDate(p)}</span>
                            </div>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <div>
                                <Badge variant={p.status === 'PAID' ? 'success' : 'warning'}>{p.status}</Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                {p.status === 'PENDING' && isAdmin && (
                                  <button onClick={() => handleApprovePayment(p.id)} className="px-3 py-1 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-bold text-[10px] shadow-md transition-all">Approve</button>
                                )}
                                <button onClick={() => handlePrintReceipt(p.id)} className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold text-[10px] border border-indigo-200 transition-all">Receipt</button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {filteredPayments.length === 0 && (
                      <div className="py-8 text-center text-gray-400 font-semibold text-sm">No transactions recorded.</div>
                    )}
                  </div>

                  {/* Desktop View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="bg-indigo-50/50 text-indigo-900 border-b border-indigo-100 font-bold">
                          <th className="px-5 py-4 text-xs uppercase tracking-wider w-12 text-center">S.No</th>
                          <th className="px-5 py-4 text-xs uppercase tracking-wider">Student ID</th>
                          <th className="px-5 py-4 text-xs uppercase tracking-wider">Student Name</th>
                          <th className="px-5 py-4 text-xs uppercase tracking-wider">Fee Category</th>
                          <th className="px-5 py-4 text-xs uppercase tracking-wider text-right">Amount Paid</th>
                          <th className="px-5 py-4 text-xs uppercase tracking-wider text-center">Status / Method</th>
                          <th className="px-5 py-4 text-xs uppercase tracking-wider text-right">Date</th>
                          <th className="px-5 py-4 text-xs uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                        {filteredPayments.map((p, idx) => (
                          <tr key={p.id} className="hover:bg-white transition-all duration-300 border-b border-indigo-50/50 hover:shadow-glow-primary">
                            <td className="px-5 py-4 text-center font-bold text-gray-400 text-xs">{idx + 1}</td>
                            <td className="px-5 py-4 font-mono text-xs font-semibold text-gray-500">{p.student?.rollNo || '-'}</td>
                            <td className="px-5 py-4">
                              <div className="font-extrabold text-[15px] text-indigo-950 dark:text-white">{p.student?.user?.name || 'Student'}</div>
                              <div className="text-[11px] text-gray-400 mt-0.5">{p.student?.class?.name}-{p.student?.class?.section}</div>
                            </td>
                            <td className="px-5 py-4">
                              <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-1 rounded-md border border-teal-100">{p.feeStructure?.name || 'Fees'}</span>
                            </td>
                            <td className="px-5 py-4 font-black text-indigo-600 dark:text-indigo-400 text-right text-lg">₹{p.amountPaid.toLocaleString()}</td>
                            <td className="px-5 py-4 text-center">
                              <div className="flex flex-col items-center gap-1.5">
                                <Badge variant={p.status === 'PAID' ? 'success' : 'warning'}>{p.status}</Badge>
                                <span className="text-[10px] font-bold text-gray-400">{p.method}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-right text-xs text-gray-500 font-semibold">
                              {getDisplayDate(p)}
                            </td>
                            <td className="px-5 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {p.status === 'PENDING' && isAdmin && (
                                  <button onClick={() => handleApprovePayment(p.id)} className="px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-bold text-xs shadow-md shadow-teal-500/20 transition-all cursor-pointer">
                                    Approve
                                  </button>
                                )}
                                <button
                                  onClick={() => handlePrintReceipt(p.id)}
                                  className="p-2 rounded-xl text-indigo-500 hover:text-white hover:bg-indigo-500 hover:shadow-md transition-all border border-indigo-100 cursor-pointer"
                                  title="Download Receipt"
                                >
                                  <FileDown className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredPayments.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-gray-400 font-semibold">No transactions recorded.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Transaction Entry Modal */}
                {showPaymentModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/45 backdrop-blur-xs">
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-150 dark:border-gray-800 shadow-xl max-w-md w-full space-y-4 animate-scale-in">
                      <h4 className="text-base font-extrabold text-gray-900 dark:text-white border-b pb-2 mb-2">Record Payment Transaction</h4>
                      <form onSubmit={handleAddPayment} className="space-y-4">
                        <div className="space-y-1">
                          <label className="label">Student</label>
                          <select className="input" value={payStudentId} onChange={e => {
                            setPayStudentId(e.target.value);
                            const selectedStructure = structures.find(s => s.id === payStructureId);
                            if (selectedStructure) {
                              const paidSoFar = payments.filter(p => p.studentId === e.target.value && p.feeStructureId === payStructureId).reduce((sum, p) => sum + p.amountPaid, 0);
                              setPayAmount(Math.max(0, selectedStructure.amount - paidSoFar).toString());
                            }
                          }} required>
                            {students.map(s => <option key={s.id} value={s.id}>{s.user?.name} ({s.rollNo})</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="label">Fee Structure Component</label>
                          <select
                            className="input"
                            value={payStructureId}
                            onChange={e => {
                              setPayStructureId(e.target.value);
                              const selected = structures.find(s => s.id === e.target.value);
                              if (selected) {
                                const paidSoFar = payments.filter(p => p.studentId === payStudentId && p.feeStructureId === e.target.value).reduce((sum, p) => sum + p.amountPaid, 0);
                                setPayAmount(Math.max(0, selected.amount - paidSoFar).toString());
                              }
                            }}
                            required
                          >
                            {structures.map(s => <option key={s.id} value={s.id}>{s.name} - ₹{s.amount}</option>)}
                          </select>
                          {payStructureId && payStudentId && (
                            <p className="text-xs text-red-500 font-bold mt-1">
                              Pending Amount: ₹{Math.max(0, (structures.find(s => s.id === payStructureId)?.amount || 0) - payments.filter(p => p.studentId === payStudentId && p.feeStructureId === payStructureId).reduce((sum, p) => sum + p.amountPaid, 0))}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <label className="label">Amount to Pay Now (₹)</label>
                          <input type="number" className="input" value={payAmount} onChange={e => setPayAmount(e.target.value)} required />
                        </div>
                        <div className="space-y-1">
                          <label className="label">Payment Method</label>
                          <select className="input" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                            <option value="CASH">Cash</option>
                            <option value="UPI">UPI</option>
                            <option value="BANK_TRANSFER">Bank Transfer</option>
                            <option value="CARD">Credit/Debit Card</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="label">Remarks</label>
                          <input type="text" className="input" value={payRemarks} onChange={e => setPayRemarks(e.target.value)} placeholder="Optional transaction notes" />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                          <button type="button" onClick={() => setShowPaymentModal(false)} className="btn-secondary">Cancel</button>
                          <button
                            type="submit"
                            disabled={isSubmittingPayment}
                            className={`btn-primary ${isSubmittingPayment ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {isSubmittingPayment ? 'Recording...' : 'Submit Transaction'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── 9. RECEIPT TAB ── */}
            {activeTab === 'receipt' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
                  <div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white">Payment Receipts</h3>
                    <p className="text-xs text-gray-400">Download and print official fee payment invoices.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {payments.map(p => (
                    <div key={p.id} className="p-5 bg-gray-50 dark:bg-gray-800/40 border border-gray-150 dark:border-gray-800 rounded-2xl space-y-3 shadow-xs">
                      <div className="flex items-start justify-between">
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-xs text-gray-400">Receipt Code: #{p.receiptNo.slice(0, 8)}</span>
                          <h4 className="font-black text-sm text-gray-900 dark:text-white">{p.student?.user?.name || 'Student'}</h4>
                        </div>
                        <Badge variant="success">Paid</Badge>
                      </div>

                      <div className="flex justify-between items-center text-xs border-t border-gray-100 dark:border-gray-800 pt-3">
                        <div className="space-y-0.5">
                          <p className="text-gray-450">{p.feeStructure?.name || 'Fees'}</p>
                          <p className="font-extrabold text-indigo-600">₹{p.amountPaid.toLocaleString()}</p>
                        </div>
                        <button
                          onClick={() => setSelectedReceipt(p)}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-650 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" /> View Receipt
                        </button>
                      </div>
                    </div>
                  ))}
                  {payments.length === 0 && (
                    <div className="col-span-2 py-8 text-center text-gray-400 text-sm">No payment records found to display receipts.</div>
                  )}
                </div>

                {/* Receipt Invoice Modal (Printable) */}
                {selectedReceipt && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 backdrop-blur-xs">
                    <div className="bg-white p-8 rounded-3xl max-w-xl w-full border border-gray-250 shadow-2xl relative space-y-6">
                      {/* Close button */}
                      <button
                        onClick={() => setSelectedReceipt(null)}
                        className="print:hidden absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full font-bold cursor-pointer"
                      >
                        ✕
                      </button>

                      {/* Receipt Layout */}
                      <div className="text-center space-y-1">
                        <h2 className="text-2xl font-black text-indigo-700 uppercase tracking-wide">JY SCHOOL</h2>
                        <p className="text-xs text-gray-500">123 Education Street, Knowledge City, State 400001</p>
                        <p className="text-xs text-gray-450 font-bold border-y py-1.5 mt-2 uppercase tracking-widest text-gray-700">Official Fee Receipt</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <p className="text-gray-400 font-semibold">Student Name:</p>
                          <p className="font-extrabold text-gray-800">{selectedReceipt.student?.user?.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-400 font-semibold">Receipt No:</p>
                          <p className="font-extrabold text-gray-800">#{selectedReceipt.receiptNo.slice(0, 16)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 font-semibold">Roll Number:</p>
                          <p className="font-bold text-gray-800">{selectedReceipt.student?.rollNo}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-400 font-semibold">Payment Date:</p>
                          <p className="font-bold text-gray-800">{new Date(selectedReceipt.paymentDate).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <table className="w-full text-xs text-left border-t border-b">
                        <thead>
                          <tr className="bg-gray-50 font-extrabold text-gray-700">
                            <th className="py-2.5 px-2">Description</th>
                            <th className="py-2.5 px-2 text-right">Amount Paid</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="py-3 px-2 font-medium text-gray-800">{selectedReceipt.feeStructure?.name}</td>
                            <td className="py-3 px-2 text-right font-extrabold text-gray-900">₹{selectedReceipt.amountPaid.toLocaleString()}</td>
                          </tr>
                          <tr className="bg-gray-50/50 font-black border-t text-sm">
                            <td className="py-2.5 px-2 text-gray-700">Total</td>
                            <td className="py-2.5 px-2 text-right text-indigo-700">₹{selectedReceipt.amountPaid.toLocaleString()}</td>
                          </tr>
                        </tbody>
                      </table>

                      <div className="flex justify-between items-center text-xs pt-4">
                        <div>
                          <span className="text-gray-450 block">Payment Mode</span>
                          <span className="font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md text-[10px] mt-0.5 inline-block">{selectedReceipt.method}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-gray-450 block">Receiver Signature</span>
                          <div className="w-32 h-0.5 bg-gray-300 mt-6 inline-block"></div>
                        </div>
                      </div>

                      <div className="print:hidden flex justify-end gap-2 pt-4 border-t">
                        <button onClick={() => setSelectedReceipt(null)} className="btn-secondary">Close</button>
                        <button onClick={() => window.print()} className="btn-primary flex items-center gap-1.5">
                          <Printer className="w-4 h-4" /> Print Receipt
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── 10. REPORT TAB ── */}
            {activeTab === 'report' && (
              <div className="space-y-6 animate-fade-in">
                <div className="pb-4 border-b border-gray-100 dark:border-gray-800">
                  <h3 className="text-lg font-black text-gray-900 dark:text-white">Financial Statement Reports</h3>
                  <p className="text-xs text-gray-400">Aggregated collection matrices and cash flow audits.</p>
                </div>

                {/* Dashboard stats cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="p-6 bg-gradient-to-br from-indigo-500 to-indigo-650 text-white rounded-3xl space-y-2 shadow-lg shadow-indigo-500/10">
                    <span className="text-[10px] font-black uppercase tracking-wider opacity-85">Total Collection</span>
                    <h4 className="text-3xl font-black">₹{payments.reduce((acc, curr) => acc + curr.amountPaid, 0).toLocaleString()}</h4>
                    <p className="text-[10px] opacity-75">All successful recorded transactions</p>
                  </div>
                  <div className="p-6 bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-800 rounded-3xl space-y-2 shadow-xs">
                    <span className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">Total Active Structures</span>
                    <h4 className="text-3xl font-black text-gray-900 dark:text-white">{structures.length}</h4>
                    <p className="text-[10px] text-gray-400">Currently configured schedules</p>
                  </div>
                  <div className="p-6 bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-800 rounded-3xl space-y-2 shadow-xs">
                    <span className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">Cash-in-Hand Settlement</span>
                    <h4 className="text-3xl font-black text-teal-650 dark:text-teal-400">
                      ₹{payments.filter(p => p.method === 'CASH').reduce((acc, curr) => acc + curr.amountPaid, 0).toLocaleString()}
                    </h4>
                    <p className="text-[10px] text-gray-400">Collected via counter cash payments</p>
                  </div>
                </div>
              </div>
            )}
        </>
      </div>
      </>
      )}
      </div>
    </div>
  );


};
export default FinancePage;

