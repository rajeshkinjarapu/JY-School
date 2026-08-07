import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import { PageHeader } from '../../components/UI/PageHeader';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';

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
import { FeeSettingsTabs } from './FeeSettingsTabs';

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
  const [feeGroups, setFeeGroups] = useState<any[]>([]);
  const [feeHeads, setFeeHeads] = useState<any[]>([]);
  const [feeConcessions, setFeeConcessions] = useState<any[]>([]);
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

  // KPI Calculations
  const dashboardStats = React.useMemo(() => {
    const totalStructuresAmount = structures.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
    const totalCollected = payments.reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0);
    const today = new Date().toISOString().split('T')[0];
    const todayCollected = payments
      .filter(p => p.paymentDate?.startsWith(today) || p.createdAt?.startsWith(today))
      .reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0);
    const pendingDues = Math.max(0, totalStructuresAmount - totalCollected);

    // Monthly data for chart
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyMap: Record<string, number> = {};
    payments.forEach(p => {
      const d = new Date(p.paymentDate || p.createdAt);
      if (d.getFullYear() === new Date().getFullYear()) {
        const m = monthNames[d.getMonth()];
        monthlyMap[m] = (monthlyMap[m] || 0) + (Number(p.amountPaid) || 0);
      }
    });
    const monthlyData = Object.keys(monthlyMap).map(k => ({ name: k, amount: monthlyMap[k] }));

    const pieData = [
      { name: 'Collected', value: totalCollected, color: '#10b981' },
      { name: 'Pending', value: pendingDues, color: '#f43f5e' }
    ];

    return { totalCollected, todayCollected, pendingDues, totalStructuresAmount, monthlyData, pieData };
  }, [structures, payments]);

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
      const [structRes, classRes, groupsRes, headsRes, concessionsRes]: any = await Promise.allSettled([
        isStudent ? Promise.resolve({ data: [] }) : api.get('/api/fees/structures?limit=5000'),
        isStudent ? Promise.resolve({ data: [] }) : api.get('/api/classes?limit=5000'),
        isStudent ? Promise.resolve({ data: [] }) : api.get('/api/fees/groups'),
        isStudent ? Promise.resolve({ data: [] }) : api.get('/api/fees/heads'),
        isStudent ? Promise.resolve({ data: [] }) : api.get('/api/fees/concessions'),
      ]);

      const getVal = (res: any) => {
        if (res.status !== 'fulfilled') return [];
        const val = res.value?.data || res.value || [];
        if (Array.isArray(val)) return val;
        if (val && Array.isArray(val.data)) return val.data;
        return [];
      };

      const newStructures = getVal(structRes);
      const newClasses = getVal(classRes);
      setStructures(newStructures);
      setClasses(newClasses);
      setFeeGroups(getVal(groupsRes));
      setFeeHeads(getVal(headsRes));
      setFeeConcessions(getVal(concessionsRes));
      const cached = JSON.parse(localStorage.getItem('fin_dashboard_cache') || '{}');
      localStorage.setItem('fin_dashboard_cache', JSON.stringify({ ...cached, structures: newStructures, classes: newClasses }));
    } catch(e) {
      console.error("fetchBaseData error:", e);
    }
  };

  const fetchHeavyData = async () => {
    try {
      const isStudent = user?.role === 'STUDENT';
      const [payRes, studRes]: any = await Promise.allSettled([
        api.get('/api/fees/payments?limit=5000'),
        isStudent ? Promise.resolve({ data: [] }) : api.get('/api/students?limit=5000', { timeout: 60000 }),
      ]);

      let paymentArray = payments;
      let newStudents = students;

      if (payRes.status === 'rejected') {
        console.error("Failed to load payments:", payRes.reason);
        toast.error("Failed to load payments: " + (payRes.reason?.message || "Network error"));
      }

      if (studRes.status === 'rejected') {
        console.error("Failed to load students:", studRes.reason);
        toast.error("Failed to load students: " + (studRes.reason?.message || "Network error"));
      }

      if (payRes.status === 'fulfilled') {
        let payload = payRes.value?.data || payRes.value || [];
        if (payload && payload.success && Array.isArray(payload.data)) {
           payload = payload.data;
        } else if (payload && Array.isArray(payload.data)) {
           payload = payload.data;
        }
        paymentArray = Array.isArray(payload) ? payload : [];
        setPayments(paymentArray);
      }

      if (studRes.status === 'fulfilled') {
        let payload = studRes.value?.data || studRes.value || [];
        if (payload && payload.data && Array.isArray(payload.data)) {
           payload = payload.data;
        } else if (payload && payload.success && Array.isArray(payload.data)) {
           payload = payload.data;
        } else if (payload && Array.isArray(payload.data)) {
           payload = payload.data;
        }
        newStudents = Array.isArray(payload) ? payload : [];
        
        // Direct fallback if empty array returned from limit query
        if (newStudents.length === 0 && !isStudent) {
          try {
            const fallbackRes: any = await api.get('/api/students', { timeout: 60000 });
            const fbData = fallbackRes?.data?.data || fallbackRes?.data || fallbackRes || [];
            if (Array.isArray(fbData) && fbData.length > 0) {
              newStudents = fbData;
            }
          } catch(err) {}
        }
        
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
        if (parsed.students && parsed.students.length > 0) setStudents(parsed.students);
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
    if (needsHeavy && (!heavyDataLoaded || students.length === 0)) {
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
  }).sort((a, b) => new Date(b.paymentDate || b.createdAt || new Date()).getTime() - new Date(a.paymentDate || a.createdAt || new Date()).getTime());

  const uniqueClassNames = [...new Set(classes.map(c => c.name))].sort();
  const availableSections = filterClass === 'ALL' ? [] : [...new Set(classes.filter(c => c.name === filterClass).map(c => c.section))].sort();

  const getDisplayDate = (p: any) => {
    let d = new Date(p.paymentDate || p.createdAt || new Date());
    if (d.getFullYear() < 2000) d = new Date(p.createdAt || new Date());
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
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
      <PageHeader 
        title={activeTab === 'home' ? 'Finance' : FINANCE_MENU.find(m => m.key === activeTab)?.label || 'Finance'}
        icon={<CreditCard className="w-6 h-6" />}
      />

      <div className={`flex-1 overflow-auto ${activeTab === 'home' ? 'p-4 md:p-6' : 'p-0'}`}>
      {/* ══ HOME GRID VIEW ══ */}
      {activeTab === 'home' && (
        <div className="w-full animate-fade-in space-y-6">
          {/* KPI Dashboard Section — Hidden on Mobile */}
          <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Collected</p>
                <h3 className="text-xl font-bold text-gray-900">₹{dashboardStats.totalCollected.toLocaleString('en-IN')}</h3>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Pending Dues</p>
                <h3 className="text-xl font-bold text-gray-900">₹{dashboardStats.pendingDues.toLocaleString('en-IN')}</h3>
              </div>
            </div>
            <div className="hidden md:flex bg-white rounded-2xl p-5 border border-gray-100 shadow-sm items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Today's Collection</p>
                <h3 className="text-xl font-bold text-gray-900">₹{dashboardStats.todayCollected.toLocaleString('en-IN')}</h3>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                <Briefcase className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Expected</p>
                <h3 className="text-xl font-bold text-gray-900">₹{dashboardStats.totalStructuresAmount.toLocaleString('en-IN')}</h3>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5 mt-6">
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
      <div className="flex-1 bg-white dark:bg-gray-900 p-4 md:p-6 md:px-8">
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
              <FeeSettingsTabs type="fee-group" data={feeGroups} onRefresh={fetchBaseData} />
            )}

            {/* ── 3. FEE HEAD TAB ── */}
            {activeTab === 'fee-head' && (
              <FeeSettingsTabs type="fee-head" data={feeHeads} groups={feeGroups} onRefresh={fetchBaseData} />
            )}

            {/* ── 4. FEE CONCESSION TAB ── */}
            {activeTab === 'fee-concession' && (
              <FeeSettingsTabs type="fee-concession" data={feeConcessions} onRefresh={fetchBaseData} />
            )}

              {/* ── 5. FEE STRUCTURE TAB ── */}
            {activeTab === 'fee-structure' && <FeeStructurePage structures={structures} setStructures={setStructures} classes={classes} refresh={fetchData} />}
            {activeTab === 'class-wise-fee-report' && <ClassWiseFeeReportTab classes={classes} students={students} payments={payments} structures={structures} />}

            {/* ── 8. TRANSACTION TAB ── */}
            {activeTab === 'transaction' && (
              <div className="space-y-4 animate-fade-in -mx-4 -mt-4 sm:mx-0 sm:mt-0">
                
                {/* Compact Toolbar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-gray-800 p-2 sm:p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 w-full">
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto flex-1">
                    <div className="relative flex-1 min-w-[150px] max-w-xs">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 font-medium"
                        placeholder="Search student or fee..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                      />
                    </div>
                    {/* Compact Filters */}
                    <select className="bg-gray-50 border-none rounded-xl py-2 px-3 text-xs font-bold text-gray-600 cursor-pointer focus:ring-2 focus:ring-indigo-500" value={filterClass} onChange={e => { setFilterClass(e.target.value); setFilterSection('ALL'); }}>
                      <option value="ALL">Class</option>
                      {uniqueClassNames.map(cName => <option key={cName} value={cName}>{cName}</option>)}
                    </select>
                    {filterClass !== 'ALL' && (
                      <select className="bg-gray-50 border-none rounded-xl py-2 px-3 text-xs font-bold text-gray-600 cursor-pointer focus:ring-2 focus:ring-indigo-500" value={filterSection} onChange={e => setFilterSection(e.target.value)}>
                        <option value="ALL">Sec</option>
                        {availableSections.map(sec => <option key={sec} value={sec}>{sec}</option>)}
                      </select>
                    )}
                    <select className="bg-gray-50 border-none rounded-xl py-2 px-3 text-xs font-bold text-gray-600 cursor-pointer focus:ring-2 focus:ring-indigo-500" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                      <option value="ALL">Status</option>
                      <option value="PAID">Paid</option>
                      <option value="PENDING">Pending</option>
                    </select>
                  </div>
                  
                  {isAdmin && (
                    <div className="hidden md:flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end overflow-x-auto pb-1 sm:pb-0">
                      <input
                        type="file"
                        ref={paymentFileInputRef}
                        className="hidden"
                        accept=".xlsx, .xls"
                        onChange={handleBulkPaymentImport}
                      />
                      <button
                        onClick={async () => {
                          const XLSX = await import('xlsx');
                          const ws = XLSX.utils.json_to_sheet([{ "Student ID": "JY26-0001", "Amount Paid": 15000, "Payment Mode": "UPI", "Payment Date": new Date().toISOString().split('T')[0] }]);
                          const wb = XLSX.utils.book_new();
                          XLSX.utils.book_append_sheet(wb, ws, "Payments");
                          XLSX.writeFile(wb, "Fee_Payments_Import_Template.xlsx");
                        }}
                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-2 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors"
                      >
                        <FileDown className="w-4 h-4" /> Template
                      </button>
                      <button
                        onClick={() => paymentFileInputRef.current?.click()}
                        className="bg-amber-50 hover:bg-amber-100 text-amber-700 py-2 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors"
                      >
                        <Upload className="w-4 h-4" /> Import
                      </button>
                      <button
                        onClick={() => {
                          if (students.length === 0 || structures.length === 0) { toast.error('Ensure students and structures exist'); return; }
                          const firstStudentId = students[0]?.id || '';
                          const firstStructureId = structures[0]?.id || '';
                          setPayStudentId(firstStudentId);
                          setPayStructureId(firstStructureId);
                          const paidSoFar = payments.filter(p => p.studentId === firstStudentId && p.feeStructureId === firstStructureId).reduce((sum, p) => sum + p.amountPaid, 0);
                          const initialAmount = Math.max(0, (structures[0]?.amount || 0) - paidSoFar);
                          setPayAmount(initialAmount.toString());
                          setShowPaymentModal(true);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-md shadow-indigo-500/30 transition-all"
                      >
                        <Plus className="w-4 h-4" /> Record
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl shadow-indigo-100/20 border border-gray-100 dark:border-gray-800 overflow-hidden">
                  
                  {/* Mobile View */}
                  <div className="md:hidden flex flex-col p-2 bg-gray-50/50">
                    {filteredPayments.map((p, idx) => (
                      <div key={p.id} className="bg-white flex flex-col relative py-3.5 px-4 border border-gray-200 rounded-2xl mb-2.5 shadow-sm">
                        <div 
                          className="flex items-center justify-between gap-1 cursor-pointer"
                          onClick={() => toggleRow(p.id)}
                        >
                          <div className="flex-1 min-w-0 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">
                              {(p.student?.user?.name || 'S').charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-extrabold text-sm text-gray-900 dark:text-white truncate">{p.student?.user?.name || 'Student'}</h4>
                              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded-md border border-teal-100 mt-0.5 inline-block">
                                {getDisplayDate(p)}
                              </span>
                            </div>
                          </div>
                          <div className="shrink-0 flex items-center gap-2">
                            <span className="font-black text-indigo-600 dark:text-indigo-400 text-sm">₹{p.amountPaid.toLocaleString()}</span>
                            <div className={`transform transition-transform ${expandedRows[p.id] ? 'rotate-180' : ''}`}>
                              <ArrowRight className="w-4 h-4 text-gray-400" />
                            </div>
                          </div>
                        </div>

                        {expandedRows[p.id] && (
                          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/5 space-y-3 animate-fade-in text-xs">
                            <div className="grid grid-cols-2 gap-2 bg-gray-50 rounded-xl p-3 border border-gray-200">
                              <div>
                                <span className="block text-gray-400 font-bold mb-0.5 text-[10px] uppercase">Payment Method</span>
                                <span className="font-bold text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded-md text-[10px]">{p.method}</span>
                              </div>
                              <div>
                                <span className="block text-gray-400 font-bold mb-0.5 text-[10px] uppercase">Date</span>
                                <span className="font-semibold text-gray-700 dark:text-gray-300">{getDisplayDate(p)}</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <Badge variant={p.status === 'PAID' ? 'success' : 'warning'}>{p.status}</Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                {p.status === 'PENDING' && isAdmin && (
                                  <button onClick={() => handleApprovePayment(p.id)} className="px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-bold text-[11px] shadow-md transition-all">Approve</button>
                                )}
                                <button onClick={() => handlePrintReceipt(p.id)} className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold text-[11px] border border-indigo-200 transition-all">Receipt</button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {filteredPayments.length === 0 && (
                      <div className="py-12 text-center text-gray-400 font-semibold text-sm">No transactions recorded.</div>
                    )}
                  </div>

                  {/* Desktop View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse border border-gray-200">
                      <thead>
                        <tr className="bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-900 border-b border-gray-200 font-black text-xs uppercase tracking-wider">
                          <th className="px-5 py-4 w-12 text-center border border-gray-200">S.No</th>
                          <th className="px-5 py-4 border border-gray-200">Student ID</th>
                          <th className="px-5 py-4 border border-gray-200">Student Name</th>
                          <th className="px-5 py-4 border border-gray-200">Fee Category</th>
                          <th className="px-5 py-4 text-right border border-gray-200">Amount Paid</th>
                          <th className="px-5 py-4 text-center border border-gray-200">Status</th>
                          <th className="px-5 py-4 text-center border border-gray-200">Method</th>
                          <th className="px-5 py-4 text-center border border-gray-200">Date</th>
                          <th className="px-5 py-4 text-right border border-gray-200">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredPayments.map((p, idx) => (
                          <tr key={p.id} className="hover:bg-indigo-50/30 transition-all duration-300">
                            <td className="px-5 py-4 text-center font-bold text-gray-400 text-xs border border-gray-200">{idx + 1}</td>
                            <td className="px-5 py-4 font-mono text-xs font-semibold text-gray-500 border border-gray-200">{p.student?.rollNo || '-'}</td>
                            <td className="px-5 py-4 border border-gray-200">
                              <div className="font-extrabold text-[14px] text-gray-900 dark:text-white">{p.student?.user?.name || 'Student'}</div>
                              <div className="text-[11px] font-bold text-indigo-400 mt-0.5">{p.student?.class?.name}-{p.student?.class?.section}</div>
                            </td>
                            <td className="px-5 py-4 border border-gray-200">
                              <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100 shadow-sm">{p.feeStructure?.name || 'Fees'}</span>
                            </td>
                            <td className="px-5 py-4 font-black text-indigo-600 dark:text-indigo-400 text-right text-[15px] border border-gray-200">₹{p.amountPaid.toLocaleString()}</td>
                            <td className="px-5 py-4 text-center border border-gray-200">
                              <Badge variant={p.status === 'PAID' ? 'success' : 'warning'}>{p.status}</Badge>
                            </td>
                            <td className="px-5 py-4 text-center border border-gray-200">
                              <span className="text-[10px] font-black tracking-wider text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100">{p.method}</span>
                            </td>
                            <td className="px-5 py-4 text-center text-xs text-gray-600 font-bold border border-gray-200">
                              {getDisplayDate(p)}
                            </td>
                            <td className="px-5 py-4 text-right border border-gray-200">
                              <div className="flex items-center justify-end gap-2">
                                {p.status === 'PENDING' && isAdmin && (
                                  <button onClick={() => handleApprovePayment(p.id)} className="px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-bold text-[11px] shadow-md shadow-teal-500/20 transition-all cursor-pointer">
                                    Approve
                                  </button>
                                )}
                                <button
                                  onClick={() => handlePrintReceipt(p.id)}
                                  className="p-2 rounded-xl text-indigo-600 bg-indigo-50 hover:text-white hover:bg-indigo-600 shadow-sm hover:shadow-md transition-all border border-indigo-100 cursor-pointer"
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
                            <td colSpan={9} className="py-16 text-center">
                              <div className="inline-flex flex-col items-center justify-center p-6 bg-gray-50 rounded-3xl border border-gray-100">
                                <Receipt className="w-10 h-10 text-gray-300 mb-3" />
                                <span className="text-gray-500 font-bold">No transactions found</span>
                              </div>
                            </td>
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

