import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Badge } from '../../components/UI/Badge';
import {
  CreditCard, Plus, FileDown, ShieldCheck, Printer, ArrowRight, ArrowLeft,
  TrendingUp, Wallet, Award, Briefcase, DollarSign, Layers,
  Receipt, FileText, Search, Filter, Trash2, Edit3, Calendar,
  Clock, CheckCircle, AlertTriangle, Users
} from 'lucide-react';
import toast from 'react-hot-toast';
import { StudentFeeDetailsTab } from './StudentFeeDetailsTab';

export const FinancePage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'ACCOUNTANT';

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';

  const [loading, setLoading] = useState(true);

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
  // CRUD States for Payments (Admin only)
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payStudentId, setPayStudentId] = useState('');
  const [payStructureId, setPayStructureId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('CASH');
  const [payRemarks, setPayRemarks] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Local storage states for Finance configuration (Mock Persistence)
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [feeGroups, setFeeGroups] = useState<any[]>([]);
  const [feeHeads, setFeeHeads] = useState<any[]>([]);
  const [feeConcessions, setFeeConcessions] = useState<any[]>([]);
  const [ledgerTypes, setLedgerTypes] = useState<any[]>([]);
  const [ledgers, setLedgers] = useState<any[]>([]);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

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

  // Load backend and configurations
  const fetchData = async () => {
    setLoading(true);
    try {
      const isStudent = user?.role === 'STUDENT';
      const [payRes, studRes, structRes, classRes]: any = await Promise.all([
        api.get('/api/fees/payments?limit=5000'),
        isStudent ? Promise.resolve({ data: [] }) : api.get('/api/students?limit=5000'),
        isStudent ? Promise.resolve({ data: [] }) : api.get('/api/fees/structures?limit=5000'),
        isStudent ? Promise.resolve({ data: [] }) : api.get('/api/classes?limit=5000'),
      ]);

      const paymentData = Array.isArray(payRes?.data)
        ? payRes.data
        : Array.isArray(payRes)
          ? payRes
          : [];
      const uniquePayments = [...new Map(paymentData.map((p: any) => [p.id, p])).values()];
      setPayments(uniquePayments);
      setStudents(Array.isArray(studRes) ? studRes : studRes?.data?.data || studRes?.data || []);
      setStructures(Array.isArray(structRes) ? structRes : structRes?.data || []);
      setClasses(Array.isArray(classRes) ? classRes : classRes?.data || []);
    } catch (e) {
      toast.error('Failed to load financial records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Init Mock configurations in LocalStorage
    const initMock = (key: string, defaults: any[]) => {
      const stored = localStorage.getItem(key);
      if (!stored) {
        localStorage.setItem(key, JSON.stringify(defaults));
        return defaults;
      }
      return JSON.parse(stored);
    };

    setPaymentMethods(initMock('fin_payment_methods', [
      { id: '1', name: 'Cash', isActive: true, notes: 'Direct cash collection at counter' },
      { id: '2', name: 'UPI / PhonePe / GPay', isActive: true, notes: 'Instant UPI transfer' },
      { id: '3', name: 'Bank Transfer / IMPS', isActive: true, notes: 'Direct bank settlement' },
      { id: '4', name: 'Credit / Debit Card', isActive: false, notes: 'POS machine or payment gateway' },
    ]));

    setFeeGroups(initMock('fin_fee_groups', [
      { id: '1', name: 'Academic Fees', description: 'Standard tuition and examination fees' },
      { id: '2', name: 'Transport Fees', description: 'Bus commute and route subscription fees' },
      { id: '3', name: 'Hostel Fees', description: 'Room rent, mess, and utility expenses' },
      { id: '4', name: 'Extracurricular Fees', description: 'Sports, events, and lab equipment charges' },
    ]));

    setFeeHeads(initMock('fin_fee_heads', [
      { id: '1', name: 'Tuition fee', groupId: '1', description: 'Academic tuition' },
      { id: '2', name: 'Admission fee', groupId: '1', description: 'One-time admission charge' },
      { id: '3', name: 'Books Fee', groupId: '2', description: 'Cost of books and materials' },
      { id: '4', name: 'Other Fee', groupId: '3', description: 'Other miscellaneous fees' },
    ]));

    setFeeConcessions(initMock('fin_fee_concessions', [
      { id: '1', name: 'Sibling Waiver (10%)', type: 'PERCENT', value: 10 },
      { id: '2', name: 'Staff Child Discount (50%)', type: 'PERCENT', value: 50 },
      { id: '3', name: 'Sports Merit Scholarship', type: 'FIXED', value: 5000 },
    ]));

    setLedgerTypes(initMock('fin_ledger_types', [
      { id: '1', name: 'Revenue (Income)' },
      { id: '2', name: 'Expense' },
      { id: '3', name: 'Asset (Bank/Cash)' },
      { id: '4', name: 'Liability' },
    ]));

    setLedgers(initMock('fin_ledgers', [
      { id: '1', name: 'Tuition Fee Revenue A/C', typeId: '1' },
      { id: '2', name: 'Bus Fee Revenue A/C', typeId: '1' },
      { id: '3', name: 'JY SCHOOL Operations Bank A/C', typeId: '3' },
      { id: '4', name: 'Petty Cash Counter A/C', typeId: '3' },
    ]));
  }, [user]);

  // Save mocks back to local storage
  const saveMock = (key: string, data: any[]) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  /* ── Tab Change Helper ── */
  const setTab = (tab: string) => {
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
      const res: any = await api.post('/api/fees/structures/bulk-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = res.data || res;
      toast.success(`Import complete! Added ${data.success} fees.`, { id: importToast });
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
      const response: any = await api.get(`/api/reports/receipt/${paymentId}`, {
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
    return matchesSearch && matchesStatus;
  });

  const tabs = [
    { key: 'payment-method', label: 'Payment Method', icon: CreditCard, color: 'from-violet-500 to-purple-600', desc: 'Configure modes of payments available' },
    { key: 'fee-group', label: 'Fee Group', icon: Layers, color: 'from-blue-500 to-cyan-600', desc: 'Manage categories of fees like Tuition' },
    { key: 'fee-head', label: 'Fee Head', icon: DollarSign, color: 'from-emerald-500 to-teal-600', desc: 'Define specific fee components' },
    { key: 'fee-concession', label: 'Fee Concession', icon: Award, color: 'from-orange-500 to-amber-600', desc: 'Set up discounts and fee waivers' },
    { key: 'fee-structure', label: 'Fee Structure', icon: Briefcase, color: 'from-rose-500 to-pink-600', desc: 'Map fee components to specific classes' },
    { key: 'student-fee-details', label: 'Student Fee Details', icon: Users, color: 'from-indigo-500 to-blue-600', desc: 'View and manage fee particulars' },
    { key: 'transaction', label: 'Transaction', icon: Receipt, color: 'from-teal-500 to-green-600', desc: 'Record and track fee payments' },
    { key: 'receipt', label: 'Receipt', icon: FileText, color: 'from-fuchsia-500 to-purple-600', desc: 'Generate and print official receipts' },
    { key: 'report', label: 'Report', icon: TrendingUp, color: 'from-sky-500 to-indigo-600', desc: 'Analyze fee collections and dues' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* ══ RIGHT CONTENT PANEL ══ */}
      <div className="flex-1 p-0">
        {loading ? (
          <LoadingSpinner size="lg" className="py-24" />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setTab(tab.key)}
                        className="group relative overflow-hidden bg-white dark:bg-gray-900 rounded-3xl p-6 text-left shadow-sm border border-gray-150 dark:border-gray-800 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                      >
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${tab.color} opacity-10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:opacity-20 transition-opacity`} />
                        <div className={`w-12 h-12 rounded-2xl mb-4 flex items-center justify-center bg-gradient-to-br ${tab.color} text-white shadow-md group-hover:scale-110 transition-transform`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">{tab.label}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{tab.desc}</p>
                        <div className="mt-4 flex items-center text-xs font-bold text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">
                          Open Module <ArrowRight className="w-3 h-3 ml-1" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab !== 'dashboard' && (
              <div className="mb-4">
                <button
                  onClick={() => setTab('dashboard')}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-bold text-gray-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all cursor-pointer shadow-sm"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Finance Dashboard
                </button>
              </div>
            )}
            {/* ── 1. PAYMENT METHOD TAB ── */}
            {activeTab === 'student-fee-details' && (
              <StudentFeeDetailsTab 
                students={students} 
                structures={structures} 
                payments={payments} 
                classes={classes} 
              />
            )}

            {activeTab === 'payment-method' && (
              <div className="space-y-6 animate-fade-in">
                {/* Header Banner */}
                <div className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
                  <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '20px 20px'}} />
                  <div className="relative flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                      <CreditCard className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black">Payment Methods</h3>
                      <p className="text-sm text-purple-200 mt-0.5">Configure modes of payments available for school fees.</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paymentMethods.map((m, i) => {
                    const colors = [
                      { bg: 'from-violet-500 to-purple-600', light: 'bg-violet-50 dark:bg-violet-950/20', text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-100 dark:border-violet-800' },
                      { bg: 'from-emerald-500 to-teal-600', light: 'bg-emerald-50 dark:bg-emerald-950/20', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-100 dark:border-emerald-800' },
                      { bg: 'from-blue-500 to-cyan-600', light: 'bg-blue-50 dark:bg-blue-950/20', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-100 dark:border-blue-800' },
                      { bg: 'from-orange-500 to-amber-600', light: 'bg-orange-50 dark:bg-orange-950/20', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-100 dark:border-orange-800' },
                    ];
                    const c = colors[i % colors.length];
                    return (
                      <div key={m.id} className={`relative overflow-hidden p-5 bg-white dark:bg-gray-900 border ${c.border} rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition-all group`}>
                        <div className={`absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b ${c.bg} rounded-l-2xl`} />
                        <div className="pl-3 space-y-1">
                          <span className="font-black text-sm text-gray-900 dark:text-white">{m.name}</span>
                          <p className="text-xs text-gray-400">{m.notes}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${m.isActive ? `${c.light} ${c.text}` : 'bg-red-50 text-red-600 dark:bg-red-950/20'}`}>
                            {m.isActive ? '● Active' : '○ Disabled'}
                          </span>
                          {isAdmin && (
                            <button
                              onClick={() => {
                                const updated = paymentMethods.map(item => item.id === m.id ? { ...item, isActive: !item.isActive } : item);
                                setPaymentMethods(updated);
                                saveMock('fin_payment_methods', updated);
                                toast.success('Status updated!');
                              }}
                              className={`text-xs font-bold px-3 py-1 rounded-lg bg-gradient-to-r ${c.bg} text-white shadow-sm hover:opacity-90 transition-all cursor-pointer`}
                            >
                              Toggle
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── 2. FEE GROUP TAB ── */}
            {activeTab === 'fee-group' && (
              <div className="space-y-6 animate-fade-in">
                {/* Header Banner */}
                <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
                  <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '20px 20px'}} />
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                        <Layers className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black">Fee Groups</h3>
                        <p className="text-sm text-blue-200 mt-0.5">Manage categories of fees like Tuition, Hostel, and Transport.</p>
                      </div>
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
                        className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border border-white/30"
                      >
                        <Plus className="w-4 h-4" /> Add Group
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-b border-blue-100 dark:border-gray-800">
                        <th className="px-5 py-4 text-[10px] uppercase tracking-wider font-black text-blue-700 dark:text-blue-400">Group Name</th>
                        <th className="px-5 py-4 text-[10px] uppercase tracking-wider font-black text-blue-700 dark:text-blue-400">Description</th>
                        {isAdmin && <th className="px-5 py-4 text-right text-[10px] uppercase tracking-wider font-black text-blue-700 dark:text-blue-400">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {feeGroups.map((g, i) => {
                        const rowColors = ['bg-violet-50/40 dark:bg-violet-950/10', 'bg-blue-50/40 dark:bg-blue-950/10', 'bg-emerald-50/40 dark:bg-emerald-950/10', 'bg-orange-50/40 dark:bg-orange-950/10'];
                        return (
                          <tr key={g.id} className={`hover:bg-gray-50/80 dark:hover:bg-white/5 transition-colors ${rowColors[i % 4]}`}>
                            <td className="px-5 py-4 font-black text-gray-900 dark:text-white">{g.name}</td>
                            <td className="px-5 py-4 text-xs text-gray-500">{g.description || '-'}</td>
                            {isAdmin && (
                              <td className="px-5 py-4 text-right">
                                <button
                                  onClick={() => {
                                    const updated = feeGroups.filter(item => item.id !== g.id);
                                    setFeeGroups(updated);
                                    saveMock('fin_fee_groups', updated);
                                    toast.success('Deleted!');
                                  }}
                                  className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
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

            {/* ── 3. FEE HEAD TAB ── */}
            {activeTab === 'fee-head' && (
              <div className="space-y-6 animate-fade-in">
                {/* Header Banner */}
                <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 rounded-2xl p-6 text-white shadow-lg">
                  <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 50% 20%, white 1px, transparent 1px)', backgroundSize: '20px 20px'}} />
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                        <DollarSign className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black">Fee Heads</h3>
                        <p className="text-sm text-emerald-200 mt-0.5">Define particular components linked to fee groups.</p>
                      </div>
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
                        className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border border-white/30"
                      >
                        <Plus className="w-4 h-4" /> Add Fee Head
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-b border-emerald-100 dark:border-gray-800">
                        <th className="px-5 py-4 text-[10px] uppercase tracking-wider font-black text-emerald-700 dark:text-emerald-400">Fee Head</th>
                        <th className="px-5 py-4 text-[10px] uppercase tracking-wider font-black text-emerald-700 dark:text-emerald-400">Associated Group</th>
                        <th className="px-5 py-4 text-[10px] uppercase tracking-wider font-black text-emerald-700 dark:text-emerald-400">Description</th>
                        {isAdmin && <th className="px-5 py-4 text-right text-[10px] uppercase tracking-wider font-black text-emerald-700 dark:text-emerald-400">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {feeHeads.map(h => {
                        const group = feeGroups.find(g => g.id === h.groupId);
                        return (
                          <tr key={h.id} className="hover:bg-emerald-50/30 dark:hover:bg-emerald-950/10 transition-colors">
                            <td className="px-5 py-4 font-black text-gray-900 dark:text-white">{h.name}</td>
                            <td className="px-5 py-4">
                              <span className="text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-lg">{group?.name || 'Default'}</span>
                            </td>
                            <td className="px-5 py-4 text-xs text-gray-500">{h.description || '-'}</td>
                            {isAdmin && (
                              <td className="px-5 py-4 text-right">
                                <button
                                  onClick={() => {
                                    const updated = feeHeads.filter(item => item.id !== h.id);
                                    setFeeHeads(updated);
                                    saveMock('fin_fee_heads', updated);
                                    toast.success('Deleted!');
                                  }}
                                  className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
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
                {/* Header Banner */}
                <div className="relative overflow-hidden bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 rounded-2xl p-6 text-white shadow-lg">
                  <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 70% 70%, white 1px, transparent 1px)', backgroundSize: '20px 20px'}} />
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                        <Award className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black">Fee Concessions</h3>
                        <p className="text-sm text-orange-100 mt-0.5">Configure fee waivers or scholarship discount plans.</p>
                      </div>
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
                        className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border border-white/30"
                      >
                        <Plus className="w-4 h-4" /> Add Concession
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {feeConcessions.map((c, i) => {
                    const concessionColors = [
                      { gradient: 'from-orange-500 to-amber-500', bg: 'bg-orange-50 dark:bg-orange-950/20', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800' },
                      { gradient: 'from-purple-500 to-fuchsia-500', bg: 'bg-purple-50 dark:bg-purple-950/20', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' },
                      { gradient: 'from-teal-500 to-green-500', bg: 'bg-teal-50 dark:bg-teal-950/20', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-800' },
                    ];
                    const cc = concessionColors[i % 3];
                    return (
                      <div key={c.id} className={`relative overflow-hidden bg-white dark:bg-gray-900 border ${cc.border} rounded-2xl p-5 shadow-sm hover:shadow-md transition-all`}>
                        <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${cc.gradient} opacity-10 rounded-bl-full`} />
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <span className="font-black text-sm text-gray-900 dark:text-white">{c.name}</span>
                            <div className={`inline-flex items-center gap-1 text-xs font-black px-3 py-1 rounded-full bg-gradient-to-r ${cc.gradient} text-white shadow-sm`}>
                              <Award className="w-3 h-3" />
                              {c.type === 'PERCENT' ? `${c.value}% Off` : `₹${c.value.toLocaleString()} Off`}
                            </div>
                          </div>
                          {isAdmin && (
                            <button
                              onClick={() => {
                                const updated = feeConcessions.filter(item => item.id !== c.id);
                                setFeeConcessions(updated);
                                saveMock('fin_fee_concessions', updated);
                                toast.success('Deleted!');
                              }}
                              className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

              {/* ── 5. FEE STRUCTURE TAB (FEES MASTER) ── */}
            {activeTab === 'fee-structure' && (
              <div className="space-y-6 animate-fade-in">
                {/* Header Banner */}
                <div className="relative overflow-hidden bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-700 rounded-2xl p-6 text-white shadow-lg">
                  <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 30% 80%, white 1px, transparent 1px)', backgroundSize: '20px 20px'}} />
                  <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                        <Briefcase className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black">Fees Master</h3>
                        <p className="text-sm text-rose-200 mt-0.5">Home / Fees Master</p>
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex flex-wrap gap-2">
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept=".xlsx, .xls"
                          onChange={handleBulkImport}
                        />
                        <button
                          onClick={() => {
                            const csvContent = "data:text/csv;charset=utf-8,Student ID,Fee Name,Amount\nJY24-001,Tuition fee,500";
                            const encodedUri = encodeURI(csvContent);
                            const tempLink = document.createElement("a");
                            tempLink.setAttribute("href", encodedUri);
                            tempLink.setAttribute("download", "fees_import_template.csv");
                            document.body.appendChild(tempLink);
                            tempLink.click();
                            document.body.removeChild(tempLink);
                          }}
                          className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border border-white/30"
                        >
                          <FileDown className="w-4 h-4" /> Get Template
                        </button>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border border-white/30"
                        >
                          <ArrowRight className="w-4 h-4" /> Import Fees
                        </button>
                        <button
                          onClick={() => {
                            if (classes.length === 0) {
                              toast.error('Please configure classes first');
                              return;
                            }
                            setStructClassId(classes[0]?.id || '');
                            setShowStructureModal(true);
                          }}
                          className="bg-white text-rose-600 font-extrabold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:shadow-md"
                        >
                          <Plus className="w-4 h-4" /> Add Fee Component
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {classes.map(cls => {
                    const classFees = structures.filter(s => s.classId === cls.id);
                    if (classFees.length === 0) return null;
                    const totalFee = classFees.reduce((acc, curr) => acc + curr.amount, 0);

                    return (
                      <div key={cls.id} className="bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-gray-800 pb-4">
                          <div>
                            <h4 className="text-xl font-bold text-gray-900 dark:text-white">{cls.name}</h4>
                            <span className="text-xs text-gray-500 font-medium">Section: {cls.section}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Fees</span>
                            <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">₹{totalFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          {classFees.map(fee => {
                            const storedMeta = localStorage.getItem('fin_structure_metadata');
                            const meta = storedMeta ? JSON.parse(storedMeta) : {};
                            const sMeta = meta[fee.id] || { group: 'Annual Fees' };
                            
                            return (
                              <div key={fee.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                <div className="flex-1 min-w-0 pr-4">
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{fee.name}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] text-gray-500 font-medium">{sMeta.group}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                  <span className="text-sm font-bold text-gray-800 dark:text-gray-200">₹{fee.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                  {isAdmin && (
                                    <button
                                      onClick={async () => {
                                        if (confirm('Are you sure you want to delete this fee?')) {
                                          try {
                                            await api.delete(`/api/fees/structures/${fee.id}`);
                                            toast.success('Fee deleted!');
                                            fetchData();
                                          } catch (e: any) {
                                            toast.error(e.message || 'Failed to delete');
                                          }
                                        }
                                      }}
                                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {structures.length === 0 && (
                    <div className="col-span-full py-16 text-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-150 dark:border-gray-800 shadow-sm">
                      <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Briefcase className="w-8 h-8 text-gray-300" />
                      </div>
                      <h4 className="text-lg font-black text-gray-900 dark:text-white mb-1">No Fee Structures</h4>
                      <p className="text-sm text-gray-400 font-medium">Click on "Add Fee Component" to create structures for classes.</p>
                    </div>
                  )}
                </div>

                {/* Structure Creation Modal */}
                {showStructureModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/45 backdrop-blur-xs">
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-150 dark:border-gray-800 shadow-xl max-w-md w-full space-y-4 animate-scale-in">
                      <h4 className="text-base font-extrabold text-gray-900 dark:text-white border-b pb-2 mb-2">Create Fee Structure</h4>
                      <form onSubmit={handleAddStructure} className="space-y-4">
                        <div className="space-y-1">
                          <label className="label">Class</label>
                          <select className="input" value={structClassId} onChange={e => setStructClassId(e.target.value)} required>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}-{c.section}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="label">Fee Category</label>
                          <select className="input" value={structGroup} onChange={e => setStructGroup(e.target.value)} required>
                            <option value="Tuition fee">Tuition fee</option>
                            <option value="Admission fee">Admission fee</option>
                            <option value="Books Fee">Books Fee</option>
                            <option value="Other Fee">Other Fee...</option>
                          </select>
                        </div>
                        {structGroup === 'Other Fee' && (
                          <div className="space-y-1">
                            <label className="label">Custom Fee Name</label>
                            <input type="text" className="input" value={structName} onChange={e => setStructName(e.target.value)} placeholder="e.g. Sports Fee" required />
                          </div>
                        )}
                        <div className="space-y-1">
                          <label className="label">Amount (USD / INR)</label>
                          <input type="number" className="input" value={structAmount} onChange={e => setStructAmount(e.target.value)} placeholder="1000.00" required />
                        </div>
                        <div className="space-y-1">
                          <label className="label">Status</label>
                          <select className="input" value={structStatus} onChange={e => setStructStatus(e.target.value)} required>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                          </select>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                          <button type="button" onClick={() => setShowStructureModal(false)} className="btn-secondary">Cancel</button>
                          <button type="submit" className="btn-primary">Save Structure</button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}



            {/* ── 8. TRANSACTION TAB ── */}
            {activeTab === 'transaction' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
                  <div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white">Transaction Logs</h3>
                    <p className="text-xs text-gray-400">List of fee collections and transaction statements.</p>
                  </div>
                  {isAdmin && (
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
                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                    <Filter className="w-4 h-4 text-gray-400" />
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
                                <span className="font-semibold text-gray-700 dark:text-gray-300">{new Date(p.paymentDate).toLocaleDateString()}</span>
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
                          <th className="px-5 py-4 text-xs uppercase tracking-wider">Student</th>
                          <th className="px-5 py-4 text-xs uppercase tracking-wider">Fee Category</th>
                          <th className="px-5 py-4 text-xs uppercase tracking-wider text-right">Amount Paid</th>
                          <th className="px-5 py-4 text-xs uppercase tracking-wider text-center">Status / Method</th>
                          <th className="px-5 py-4 text-xs uppercase tracking-wider text-right">Date</th>
                          <th className="px-5 py-4 text-xs uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                        {filteredPayments.map(p => (
                          <tr key={p.id} className="hover:bg-white transition-all duration-300 border-b border-indigo-50/50 hover:shadow-glow-primary">
                            <td className="px-5 py-4">
                              <div className="font-extrabold text-[15px] text-indigo-950 dark:text-white">{p.student?.user?.name || 'Student'}</div>
                              <div className="text-[11px] text-gray-400 mt-0.5">{p.student?.rollNo || ''}</div>
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
                              {new Date(p.paymentDate).toLocaleDateString()}
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
                {/* Header Banner */}
                <div className="relative overflow-hidden bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
                  <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 60% 40%, white 1px, transparent 1px)', backgroundSize: '20px 20px'}} />
                  <div className="relative flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                      <TrendingUp className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black">Financial Statement Reports</h3>
                      <p className="text-sm text-sky-200 mt-0.5">Aggregated collection matrices and cash flow audits.</p>
                    </div>
                  </div>
                </div>

                {/* Dashboard stats cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="relative overflow-hidden p-6 bg-gradient-to-br from-violet-600 to-indigo-700 text-white rounded-2xl space-y-2 shadow-lg">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-6 translate-x-6" />
                    <div className="flex items-center gap-2">
                      <Wallet className="w-5 h-5 opacity-80" />
                      <span className="text-[10px] font-black uppercase tracking-wider opacity-85">Total Collection</span>
                    </div>
                    <h4 className="text-3xl font-black">₹{payments.reduce((acc, curr) => acc + curr.amountPaid, 0).toLocaleString()}</h4>
                    <p className="text-[10px] opacity-75">All successful recorded transactions</p>
                  </div>
                  <div className="relative overflow-hidden p-6 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl space-y-2 shadow-lg">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-6 translate-x-6" />
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-5 h-5 opacity-80" />
                      <span className="text-[10px] font-black uppercase tracking-wider opacity-85">Total Active Structures</span>
                    </div>
                    <h4 className="text-3xl font-black">{structures.length}</h4>
                    <p className="text-[10px] opacity-75">Currently configured schedules</p>
                  </div>
                  <div className="relative overflow-hidden p-6 bg-gradient-to-br from-orange-500 to-rose-600 text-white rounded-2xl space-y-2 shadow-lg">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-6 translate-x-6" />
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 opacity-80" />
                      <span className="text-[10px] font-black uppercase tracking-wider opacity-85">Cash-in-Hand</span>
                    </div>
                    <h4 className="text-3xl font-black">
                      ₹{payments.filter(p => p.method === 'CASH').reduce((acc, curr) => acc + curr.amountPaid, 0).toLocaleString()}
                    </h4>
                    <p className="text-[10px] opacity-75">Collected via counter cash payments</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
export default FinancePage;

