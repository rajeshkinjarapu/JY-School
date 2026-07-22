import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Badge } from '../../components/UI/Badge';
import { Wallet, Clock, TrendingUp, AlertTriangle, FileDown, Plus, CreditCard, User, Upload, Sparkles, Receipt, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export const AccountantDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Quick Payment Modal states
  const [showModal, setShowModal] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedStructure, setSelectedStructure] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [method, setMethod] = useState('CASH');
  const [remarks, setRemarks] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchDashboardData = async () => {
    try {
      const res: any = await api.get('/api/dashboard/accountant');
      setData(res.data);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load financial overview metrics');
    } finally {
      setLoading(false);
    }
  };

  const fetchFormDetails = async () => {
    try {
      const [studRes, structRes]: any = await Promise.all([
        api.get('/api/students'),
        api.get('/api/fees/structures'),
      ]);
      setStudents(studRes.data.data || studRes.data || []);
      setStructures(structRes.data || structRes || []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load student or structure details');
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (showModal) {
      fetchFormDetails();
    }
  }, [showModal]);

  const handleDownloadInvoice = async (paymentId: string) => {
    const importToast = toast.loading('Generating PDF invoice...');
    try {
      const response: any = await api.get(`/api/fees/payments/${paymentId}/invoice`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data || response], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice_${paymentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success('Invoice downloaded successfully!', { id: importToast });
    } catch (e: any) {
      toast.error('Failed to export invoice PDF.', { id: importToast });
    }
  };

  const handleExportReport = async () => {
    const importToast = toast.loading('Exporting tuition ledger...');
    try {
      const response: any = await api.get('/api/reports/fees', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data || response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Fee_Ledger_Export.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success('Ledger exported successfully!', { id: importToast });
    } catch (e) {
      toast.error('Failed to export tuition ledger excel.', { id: importToast });
    }
  };

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

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !selectedStructure || !amountPaid) {
      toast.error('All payment fields are required.');
      return;
    }
    if (method === 'UPI' && !utrNumber) {
      toast.error('UTR Reference Number is required for UPI payments.');
      return;
    }

    setIsSubmittingPayment(true);
    try {
      await api.post('/api/fees/payments', {
        studentId: selectedStudent,
        feeStructureId: selectedStructure,
        amountPaid: Number(amountPaid),
        method,
        remarks,
        utrNumber: method === 'UPI' ? utrNumber : null,
        receiptUrl: method === 'UPI' ? receiptUrl : null,
        paymentDate,
      });
      toast.success('Tuition payment collected successfully!');
      setShowModal(false);
      setSelectedStudent('');
      setSelectedStructure('');
      setAmountPaid('');
      setRemarks('');
      setUtrNumber('');
      setReceiptUrl('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      fetchDashboardData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to record tuition collection.');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" className="h-[50vh]" />;
  if (!data) return <div className="text-center py-12">No data returned.</div>;

  // Prepare charts data
  const chartData = data.monthlyCollection || [];
  const pieData = [
    { name: 'Cash', value: data.paymentModes?.cash || 0, color: '#10b981' },
    { name: 'Online', value: data.paymentModes?.online || 0, color: '#6366f1' },
    { name: 'Bank Transfer', value: data.paymentModes?.bankTransfer || 0, color: '#3b82f6' },
    { name: 'Cheque', value: data.paymentModes?.cheque || 0, color: '#f59e0b' },
    { name: 'UPI', value: data.paymentModes?.upi || 0, color: '#ec4899' },
  ].filter(p => p.value > 0);

  return (
    <div className="space-y-6">
      {/* Page Header Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-teal-600 via-indigo-650 to-primary-600 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-teal-500/10 animate-fade-in-up">
        {/* Background decorative blobs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 animate-float" />
        <div className="absolute bottom-0 left-1/4 w-60 h-60 bg-teal-400/20 rounded-full blur-2xl -ml-20 -mb-20 animate-pulse" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              Finance Operations
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight">Cashier & Accountant Portal</h2>
            <p className="text-primary-100 text-sm md:text-base font-medium max-w-xl">
              Real-time tuition cash flows, payments tracking, and billing targets.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExportReport}
              className="px-4 py-2.5 rounded-xl border border-white/20 hover:bg-white/10 text-white text-xs font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer"
            >
              <FileDown className="w-4.5 h-4.5" />
              <span>Export Ledger</span>
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="bg-white hover:bg-teal-50 text-indigo-700 px-4 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-black/10 transition-all duration-200 flex items-center gap-2 hover:scale-102 active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-4.5 h-4.5 text-teal-650" />
              <span>Quick Collect</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Stat row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6 flex items-start gap-4 hover:scale-102 hover:-translate-y-1 transition-all duration-300 shadow-glow-teal border-l-4 border-l-transparent hover:border-l-teal-500 dark:bg-gray-900/80 backdrop-blur-md">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-md">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Collected</span>
            <span className="text-2xl font-black text-gray-950 dark:text-white mt-1 block">
              ₹{data.totalCollected.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="card p-6 flex items-start gap-4 hover:scale-102 hover:-translate-y-1 transition-all duration-300 shadow-glow-amber border-l-4 border-l-transparent hover:border-l-amber-500 dark:bg-gray-900/80 backdrop-blur-md">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Pending Dues</span>
            <span className="text-2xl font-black text-gray-950 dark:text-white mt-1 block">
              ₹{data.pendingDues.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="card p-6 flex items-start gap-4 hover:scale-102 hover:-translate-y-1 transition-all duration-300 shadow-glow-primary border-l-4 border-l-transparent hover:border-l-primary-500 dark:bg-gray-900/80 backdrop-blur-md">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-md">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Collection Target</span>
            <span className="text-2xl font-black text-gray-950 dark:text-white mt-1 block">
              ₹{data.totalExpected.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="card p-6 flex items-start gap-4 hover:scale-102 hover:-translate-y-1 transition-all duration-300 shadow-glow-red border-l-4 border-l-transparent hover:border-l-red-500 dark:bg-gray-900/80 backdrop-blur-md">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-red-400 to-rose-500 text-white shadow-md animate-pulse">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Overdue Invoices</span>
            <span className="text-2xl font-black text-gray-950 dark:text-white mt-1 block">
              {data.overdueInvoicesCount} Active
            </span>
          </div>
        </div>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6 lg:col-span-2 space-y-4 dark:bg-gray-900/80 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
            <div>
              <h3 className="font-extrabold text-lg text-gray-955 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-500" />
                Tuition Income Analytics
              </h3>
              <p className="text-xs text-gray-400">Monthly breakdown of fee collection trends</p>
            </div>
          </div>
          <div className="h-72">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <filter id="areaGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156, 163, 175, 0.15)" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.9)', borderColor: '#374151', borderRadius: '16px', color: '#fff' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#6366f1" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorAmount)" 
                    filter="url(#areaGlow)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-gray-450">No monthly metrics recorded.</div>
            )}
          </div>
        </div>

        <div className="card p-6 space-y-4 flex flex-col justify-between dark:bg-gray-900/80 backdrop-blur-md">
          <div>
            <h3 className="font-extrabold text-lg text-gray-955 dark:text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-500" />
              Payment Mode Share
            </h3>
            <p className="text-xs text-gray-400">Tuition payments breakdown by method</p>
          </div>
          <div className="h-60 flex justify-center items-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} payments`} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-gray-450">No payments share recorded.</div>
            )}
          </div>
        </div>
      </div>

      {/* Middle row: Overdue payments and Fee summary details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue Accounts list */}
        <div className="card p-6 space-y-4 dark:bg-gray-900/80 backdrop-blur-md">
          <div>
            <h3 className="font-extrabold text-lg text-gray-950 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Overdue Collections Checklist
            </h3>
            <p className="text-xs text-gray-400">Students with unpaid items past the deadline</p>
          </div>
          <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
            {data.overduePayments?.length > 0 ? (
              data.overduePayments.map((p: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 bg-red-50/20 dark:bg-red-950/5 rounded-2xl border border-red-100/50 dark:border-red-900/20 hover:scale-102 transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-rose-500 text-white flex items-center justify-center font-bold text-sm shadow-md">
                      {p.studentName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-950 dark:text-white leading-snug">{p.studentName}</h4>
                      <p className="text-xs text-gray-400 font-medium">
                        {p.className} • ID: {p.rollNo}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-red-550 dark:text-red-400 block">
                      ₹{p.amountDue.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-gray-400 block font-bold mt-0.5">
                      Due: {new Date(p.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-xs text-gray-400">No overdue balances detected!</div>
            )}
          </div>
        </div>

        {/* Collection details by fee components */}
        <div className="card p-6 space-y-4 dark:bg-gray-900/80 backdrop-blur-md">
          <div>
            <h3 className="font-extrabold text-lg text-gray-950 dark:text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-indigo-500" />
              Fee Component Analysis
            </h3>
            <p className="text-xs text-gray-400">Target totals and collection stats per structured component</p>
          </div>
          <div className="space-y-4.5 max-h-[350px] overflow-y-auto pr-1">
            {data.structureSummary?.length > 0 ? (
              data.structureSummary.map((s: any) => {
                const percentage = s.target > 0 ? Math.round((s.collected / s.target) * 100) : 0;
                return (
                  <div key={s.id} className="space-y-2 bg-gray-50/50 dark:bg-gray-800/10 p-3 rounded-2xl border border-gray-100/50 dark:border-gray-800/50">
                    <div className="flex justify-between text-xs font-bold text-gray-800 dark:text-gray-200">
                      <span>
                        {s.name} <span className="text-[10px] text-gray-400 font-medium">({s.className})</span>
                      </span>
                      <span className="text-indigo-600 dark:text-indigo-400">{percentage}%</span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-gray-150 dark:bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-primary-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, percentage)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-400 font-medium">
                      <span>Paid: ₹{s.collected.toLocaleString()}</span>
                      <span>Target: ₹{s.target.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-xs text-gray-400">No fee components configured.</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Payments Table */}
      <div className="card overflow-hidden dark:bg-gray-900/80 backdrop-blur-md">
        <div className="p-6 border-b border-gray-150 dark:border-gray-800 flex justify-between items-center">
          <div>
            <h3 className="font-extrabold text-lg text-gray-950 dark:text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-indigo-500" />
              Transactions Ledger
            </h3>
            <p className="text-xs text-gray-400">8 latest tuition invoice collection statements</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-800/40 text-gray-500 font-semibold border-b border-gray-150 dark:border-gray-850">
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Receipt</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Student</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Component</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Method</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-right font-bold text-xs uppercase tracking-wider">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
              {data.recentPayments?.map((p: any) => (
                <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/10 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-gray-900 dark:text-gray-300">
                    {p.receiptNo.slice(0, 18)}...
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                    {p.student?.user?.name}
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400 font-medium">
                    {p.feeStructure?.name}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={p.method === 'UPI' ? 'danger' : 'info'}>{p.method}</Badge>
                  </td>
                  <td className="px-6 py-4 font-black text-gray-950 dark:text-white">
                    ₹{p.amountPaid.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDownloadInvoice(p.id)}
                      className="p-2 rounded-xl text-gray-400 hover:text-primary-650 hover:bg-primary-50 dark:hover:bg-primary-950/20 transition-all cursor-pointer border border-transparent hover:border-primary-100/50 dark:hover:border-primary-900/30 shadow-sm"
                      title="Download PDF Invoice"
                    >
                      <FileDown className="w-4.5 h-4.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Collect Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/45 backdrop-blur-xs">
          <div className="fixed inset-0" onClick={() => setShowModal(false)} />
          <div className="relative card w-full max-w-md p-6 space-y-5 animate-scale-in z-10 bg-white dark:bg-gray-900">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-teal-500" />
                Quick Tuition Collection
              </h3>
              <p className="text-xs text-gray-400 mt-1">Record a payment transaction directly to the database ledger.</p>
            </div>

            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div>
                <label className="label">Select Student</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4.5 h-4.5 text-gray-450" />
                  <select
                    required
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    className="input pl-10 text-xs focus:ring-teal-500"
                  >
                    <option value="">-- Choose Student --</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.user.name} ({s.rollNo})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Fee Structure Component</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-3 w-4.5 h-4.5 text-gray-450" />
                  <select
                    required
                    value={selectedStructure}
                    onChange={(e) => setSelectedStructure(e.target.value)}
                    className="input pl-10 text-xs focus:ring-teal-500"
                  >
                    <option value="">-- Select Structure --</option>
                    {structures.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} - ₹{st.amount.toLocaleString()} ({st.class?.name || 'All'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Amount Paid (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 5000"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="input text-xs focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="label">Payment Date</label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="input text-xs focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="label">Payment Mode</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="input text-xs focus:ring-teal-500"
                >
                  <option value="CASH">Cash</option>
                  <option value="ONLINE">Online Transfer</option>
                  <option value="BANK_TRANSFER">Bank Deposit</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="UPI">UPI / QR Code</option>
                </select>
              </div>

              {/* UPI fields details */}
              {method === 'UPI' && (
                <div className="space-y-4 border-l-2 border-primary-500 pl-3.5 my-2 animate-slide-in">
                  <div>
                    <label className="label">UPI UTR Reference Number</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 12-digit transaction number"
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value)}
                      className="input text-xs focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="label">Upload Payment Receipt</label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                        className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
                      />
                    </div>
                    {isUploading && (
                      <span className="text-xxs text-primary-500 block mt-1 animate-pulse">
                        Uploading receipt...
                      </span>
                    )}
                    {receiptUrl && (
                      <span className="text-xxs text-emerald-600 font-bold block mt-1">
                        ✓ Receipt uploaded successfully
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="label">Remarks (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Reference codes, cheque details..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="input text-xs focus:ring-teal-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1 py-2 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayment || isUploading}
                  className="btn-primary flex-1 py-2 text-xs font-bold flex items-center justify-center gap-2 focus:ring-teal-500 bg-teal-600 hover:bg-teal-700 shadow-teal-550/20"
                >
                  <span>{isSubmittingPayment ? 'Saving...' : 'Record Payment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountantDashboard;
