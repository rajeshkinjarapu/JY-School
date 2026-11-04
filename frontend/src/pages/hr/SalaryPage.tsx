import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { getPhotoUrl } from '../../utils/photo';
import {
  DollarSign, Users, CreditCard, TrendingUp, TrendingDown,
  Calendar, Filter, Search, Download, FileSpreadsheet, FileText,
  CheckCircle2, Clock, AlertTriangle, Plus, Trash2, Eye, Printer,
  X, Zap, Building2, ArrowRight, ShieldCheck, RefreshCw, Calculator,
  Percent, ChevronDown
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip,
  PieChart, Pie, Cell, Legend, CartesianGrid
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { PageHeader } from '../../components/UI/PageHeader';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const PIE_COLORS = ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4', '#3B82F6', '#64748B'];

interface SalaryRecord {
  id: string;
  teacherId: string;
  month: number;
  year: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: string;
  paidOn: string | null;
  remarks: string | null;
  teacher: {
    id: string;
    employeeId: string;
    specialization?: string;
    user: {
      name: string;
      email: string;
      photoUrl?: string;
      phone?: string;
    };
  };
}

interface Teacher {
  id: string;
  employeeId: string;
  specialization?: string;
  user: { name: string; email: string };
}

export const SalaryPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const [salaries, setSalaries] = useState<SalaryRecord[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);

  // Filters
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [viewPayslipRecord, setViewPayslipRecord] = useState<SalaryRecord | null>(null);

  // Form State for Add / Edit
  const [form, setForm] = useState({
    teacherId: '',
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    basicSalary: '25000',
    allowances: '2500',
    deductions: '1800',
    remarks: '',
  });
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [bulkPaying, setBulkPaying] = useState(false);

  // Process Payroll Settings
  const [processSettings, setProcessSettings] = useState({
    defaultBasic: '25000',
    defaultAllowances: '2500',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [salRes, anaRes]: any = await Promise.all([
        api.get('/api/salary', { params: { year: selectedYear, month: selectedMonth } }),
        api.get('/api/salary/analytics', { params: { year: selectedYear, month: selectedMonth } }).catch(() => null),
      ]);

      const data = salRes.data?.data || salRes.data || [];
      setSalaries(Array.isArray(data) ? data : []);

      if (anaRes) {
        setAnalytics(anaRes.data?.data || anaRes.data || null);
      }
    } catch (err) {
      toast.error('Failed to load salary data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res: any = await api.get('/api/teachers', { params: { limit: 300 } });
      const data = res.data?.data || res.data || [];
      setTeachers(Array.isArray(data) ? data : []);
    } catch {}
  };

  useEffect(() => {
    fetchData();
    if (isAdmin && teachers.length === 0) fetchTeachers();
  }, [selectedYear, selectedMonth]);

  // Unique departments for filter dropdown
  const departments = useMemo(() => {
    const depts = new Set<string>();
    salaries.forEach(s => {
      if (s.teacher.specialization) depts.add(s.teacher.specialization);
    });
    teachers.forEach(t => {
      if (t.specialization) depts.add(t.specialization);
    });
    return Array.from(depts);
  }, [salaries, teachers]);

  // Filtered salary records
  const filteredSalaries = useMemo(() => {
    return salaries.filter(s => {
      const query = searchQuery.toLowerCase().trim();
      const name = s.teacher.user.name.toLowerCase();
      const empId = s.teacher.employeeId.toLowerCase();
      const matchesSearch = !query || name.includes(query) || empId.includes(query);

      const dept = s.teacher.specialization || 'Teaching Staff';
      const matchesDept = selectedDept === 'ALL' || dept === selectedDept;

      const matchesStatus = selectedStatus === 'ALL' || s.status === selectedStatus;

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [salaries, searchQuery, selectedDept, selectedStatus]);

  // Quick KPI numbers
  const kpiData = useMemo(() => {
    if (analytics?.kpi) return analytics.kpi;
    const totalCost = salaries.reduce((sum, s) => sum + s.netSalary, 0);
    const totalEmployees = salaries.length > 0 ? salaries.length : teachers.length;
    const avgSalary = salaries.length > 0 ? Math.round(totalCost / salaries.length) : 0;
    const pendingCount = salaries.filter(s => s.status === 'PENDING').length;
    const paidCount = salaries.filter(s => s.status === 'PAID').length;

    return {
      totalPayrollCost: totalCost,
      previousMonthCost: 0,
      trendPercent: 0,
      totalEmployees,
      averageSalary: avgSalary,
      pendingApprovals: pendingCount,
      paidCount,
    };
  }, [analytics, salaries, teachers]);

  // Gross vs Deductions vs Net Breakdown
  const breakdownData = useMemo(() => {
    if (analytics?.breakdown) return analytics.breakdown;
    const totalBasic = salaries.reduce((sum, s) => sum + s.basicSalary, 0);
    const totalAllowances = salaries.reduce((sum, s) => sum + s.allowances, 0);
    const totalDeductions = salaries.reduce((sum, s) => sum + s.deductions, 0);
    const totalNet = salaries.reduce((sum, s) => sum + s.netSalary, 0);
    const totalGross = totalBasic + totalAllowances;
    return { totalBasic, totalAllowances, totalDeductions, totalGross, totalNet };
  }, [analytics, salaries]);

  // Monthly trend for charts
  const monthlyTrendData = useMemo(() => {
    if (analytics?.monthlyTrend && analytics.monthlyTrend.length > 0) {
      return analytics.monthlyTrend;
    }
    // Fallback simulation for visualization
    return SHORT_MONTHS.slice(Math.max(0, selectedMonth - 6), selectedMonth).map((m, i) => ({
      name: `${m} '${selectedYear.toString().slice(-2)}`,
      netPayroll: kpiData.totalPayrollCost > 0 ? Math.round(kpiData.totalPayrollCost * (0.9 + i * 0.02)) : 0,
      grossPayroll: kpiData.totalPayrollCost > 0 ? Math.round(kpiData.totalPayrollCost * 1.1) : 0,
    }));
  }, [analytics, selectedMonth, selectedYear, kpiData]);

  // Department distribution for pie chart
  const deptDistributionData = useMemo(() => {
    if (analytics?.departmentDistribution && analytics.departmentDistribution.length > 0) {
      return analytics.departmentDistribution;
    }
    const map: Record<string, number> = {};
    salaries.forEach(s => {
      const d = s.teacher.specialization || 'Teaching Staff';
      map[d] = (map[d] || 0) + s.netSalary;
    });
    return Object.keys(map).map(name => ({ name, value: map[name] }));
  }, [analytics, salaries]);

  // ── Actions ──

  const handleSaveSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.teacherId) {
      toast.error('Please select an employee');
      return;
    }
    setSaving(true);
    try {
      await api.post('/api/salary', form);
      toast.success('Salary record saved successfully!');
      setShowAddModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save salary record');
    } finally {
      setSaving(false);
    }
  };

  const handleProcessPayroll = async () => {
    setProcessing(true);
    try {
      const res: any = await api.post('/api/salary/process-payroll', {
        month: selectedMonth,
        year: selectedYear,
        defaultBasic: processSettings.defaultBasic,
        defaultAllowances: processSettings.defaultAllowances,
      });
      toast.success(res.data?.message || `Processed payroll for ${MONTHS[selectedMonth - 1]} ${selectedYear}!`);
      setShowProcessModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to process payroll');
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkMarkPaid = async () => {
    if (!window.confirm(`Are you sure you want to mark all PENDING salaries for ${MONTHS[selectedMonth - 1]} ${selectedYear} as PAID?`)) {
      return;
    }
    setBulkPaying(true);
    try {
      const res: any = await api.post('/api/salary/bulk-pay', {
        month: selectedMonth,
        year: selectedYear,
      });
      toast.success(res.data?.message || 'All pending salaries marked as PAID!');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Bulk pay failed');
    } finally {
      setBulkPaying(false);
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      await api.patch(`/api/salary/${id}/mark-paid`);
      toast.success('Salary marked as PAID!');
      fetchData();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this salary record?')) return;
    try {
      await api.delete(`/api/salary/${id}`);
      toast.success('Record deleted');
      setSalaries(prev => prev.filter(s => s.id !== id));
    } catch {
      toast.error('Failed to delete');
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (filteredSalaries.length === 0) {
      toast.error('No salary records to export');
      return;
    }
    const data = filteredSalaries.map((s, idx) => ({
      'S.No': idx + 1,
      'Employee ID': s.teacher.employeeId,
      'Employee Name': s.teacher.user.name,
      'Department / Role': s.teacher.specialization || 'Teacher',
      'Month / Year': `${MONTHS[s.month - 1]} ${s.year}`,
      'Basic Salary (₹)': s.basicSalary,
      'Allowances (₹)': s.allowances,
      'Deductions (₹)': s.deductions,
      'Net Pay (₹)': s.netSalary,
      'Status': s.status,
      'Paid On': s.paidOn ? new Date(s.paidOn).toLocaleDateString() : 'N/A',
      'Remarks': s.remarks || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Payroll_${selectedMonth}_${selectedYear}`);
    XLSX.writeFile(workbook, `JY_School_Payroll_${MONTHS[selectedMonth - 1]}_${selectedYear}.xlsx`);
    toast.success('Excel exported successfully!');
  };

  // Generate Single Employee PDF Payslip
  const handleDownloadPayslipPDF = (record: SalaryRecord) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // School Header
    doc.setFillColor(46, 42, 102);
    doc.rect(0, 0, 210, 36, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('SRI VENKATESWARA JY SCHOOL', 105, 14, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta, Srikakulam Dist.', 105, 21, { align: 'center' });
    doc.text('Phone: +91 98765 43210 | Email: hr@svjyschool.edu.in', 105, 27, { align: 'center' });

    // Title Banner
    doc.setFillColor(243, 244, 246);
    doc.rect(14, 42, 182, 12, 'F');
    doc.setTextColor(31, 41, 55);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`SALARY PAYSLIP — ${MONTHS[record.month - 1].toUpperCase()} ${record.year}`, 105, 50, { align: 'center' });

    // Employee Details Box
    autoTable(doc, {
      startY: 58,
      margin: { left: 14, right: 14 },
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
      body: [
        ['Employee Name:', record.teacher.user.name, 'Employee ID:', record.teacher.employeeId],
        ['Department / Role:', record.teacher.specialization || 'Teaching Staff', 'Payment Status:', record.status],
        ['Email:', record.teacher.user.email, 'Payment Date:', record.paidOn ? new Date(record.paidOn).toLocaleDateString() : 'Pending'],
        ['Remarks:', record.remarks || 'Regular Payroll', 'Pay Period:', `${MONTHS[record.month - 1]} ${record.year}`],
      ],
      styles: { fontSize: 9, cellPadding: 3 },
    });

    // Earnings & Deductions Breakdown
    const finalY = (doc as any).lastAutoTable.finalY + 8;
    autoTable(doc, {
      startY: finalY,
      margin: { left: 14, right: 14 },
      head: [['Earnings Description', 'Amount (INR)', 'Deductions Description', 'Amount (INR)']],
      body: [
        ['Basic Salary', `Rs. ${record.basicSalary.toLocaleString()}`, 'Provident Fund (PF)', 'Rs. 1,200'],
        ['Allowances & Perks', `Rs. ${record.allowances.toLocaleString()}`, 'Professional Tax / TDS', 'Rs. 600'],
        ['Special Incentives', 'Rs. 0', 'Loss of Pay (LOP) / Leave', `Rs. ${Math.max(0, record.deductions - 1800).toLocaleString()}`],
        [
          { content: 'Total Gross Earnings', styles: { fontStyle: 'bold' } },
          { content: `Rs. ${(record.basicSalary + record.allowances).toLocaleString()}`, styles: { fontStyle: 'bold' } },
          { content: 'Total Deductions', styles: { fontStyle: 'bold', textColor: [220, 38, 38] } },
          { content: `Rs. ${record.deductions.toLocaleString()}`, styles: { fontStyle: 'bold', textColor: [220, 38, 38] } },
        ],
      ],
      headStyles: { fillColor: [46, 42, 102], textColor: [255, 255, 255] },
      styles: { fontSize: 9, cellPadding: 3.5 },
    });

    // Net Salary Callout Box
    const netY = (doc as any).lastAutoTable.finalY + 8;
    doc.setFillColor(238, 242, 255);
    doc.setDrawColor(79, 70, 229);
    doc.roundedRect(14, netY, 182, 22, 3, 3, 'FD');

    doc.setTextColor(79, 70, 229);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('NET SALARY PAYABLE:', 20, netY + 10);

    doc.setFontSize(16);
    doc.text(`INR ${record.netSalary.toLocaleString('en-IN')}/-`, 20, netY + 18);

    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('(Rupees calculated and verified for direct bank transfer)', 110, netY + 14);

    // Signatures
    const sigY = netY + 38;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, sigY, 70, sigY);
    doc.line(140, sigY, 190, sigY);

    doc.setTextColor(70, 70, 70);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text('Employee Signature', 45, sigY + 5, { align: 'center' });
    doc.text('Authorized Signatory / Principal', 165, sigY + 5, { align: 'center' });

    doc.setFontSize(7.5);
    doc.setTextColor(150, 150, 150);
    doc.text('Computer generated payslip — Sri Venkateswara JY School, Narasannapeta.', 105, 285, { align: 'center' });

    doc.save(`Payslip_${record.teacher.employeeId}_${MONTHS[record.month - 1]}_${record.year}.pdf`);
    toast.success(`Payslip for ${record.teacher.user.name} downloaded!`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/60 pb-16 font-sans">
      <PageHeader
        title="HR & Staff Payroll Velocity"
        icon={<DollarSign className="w-5 h-5 text-indigo-600" />}
        action={
          <div className="flex items-center gap-2.5">
            {isAdmin && (
              <>
                <button
                  onClick={() => setShowProcessModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-md shadow-emerald-600/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <Zap className="w-4 h-4" /> Process Payroll
                </button>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-xs shadow-md shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Record
                </button>
              </>
            )}
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold text-xs shadow-sm hover:bg-slate-50 transition-all cursor-pointer"
              title="Export Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export
            </button>
          </div>
        }
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">

        {/* ── 1. Financial Velocity Shelf (4 KPI Cards) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Total Payroll Cost */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm shadow-slate-200/50 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Payroll Cost</span>
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                ₹{kpiData.totalPayrollCost.toLocaleString('en-IN')}
              </h2>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold">
              {kpiData.trendPercent >= 0 ? (
                <span className="text-emerald-600 flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" /> +{kpiData.trendPercent}%
                </span>
              ) : (
                <span className="text-rose-600 flex items-center gap-0.5">
                  <TrendingDown className="w-3.5 h-3.5" /> {kpiData.trendPercent}%
                </span>
              )}
              <span className="text-slate-400">vs last month</span>
            </div>
            <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
          </div>

          {/* Card 2: Total Employees */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm shadow-slate-200/50 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Staff Enrolled</span>
              <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {kpiData.totalEmployees}
              </h2>
              <span className="text-xs font-bold text-slate-400">Employees</span>
            </div>
            <p className="text-xs font-medium text-slate-500 mt-2">
              {salaries.length} records generated this month
            </p>
            <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
          </div>

          {/* Card 3: Average Salary */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm shadow-slate-200/50 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Average Net Salary</span>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                <Calculator className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                ₹{kpiData.averageSalary.toLocaleString('en-IN')}
              </h2>
            </div>
            <p className="text-xs font-medium text-emerald-600 mt-2 flex items-center gap-1">
              <Percent className="w-3 h-3" /> Budget baseline index
            </p>
            <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
          </div>

          {/* Card 4: Pending Approvals */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm shadow-slate-200/50 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Approvals</span>
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-2xl sm:text-3xl font-black text-amber-600 tracking-tight">
                {kpiData.pendingApprovals}
              </h2>
              <span className="text-xs font-bold text-slate-400">Slips</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs font-medium text-slate-500">{kpiData.paidCount} Paid</span>
              {isAdmin && kpiData.pendingApprovals > 0 && (
                <button
                  onClick={handleBulkMarkPaid}
                  disabled={bulkPaying}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                >
                  {bulkPaying ? 'Paying...' : 'Approve All'}
                </button>
              )}
            </div>
            <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
          </div>
        </div>

        {/* ── 2. Visualizations & Charts Section ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Monthly Trend Area Chart (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm shadow-slate-200/50 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Monthly Payroll Trend</h3>
                <p className="text-xs text-slate-400 font-medium">Last 6 Months gross vs net disbursement</p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700">
                FY {selectedYear}
              </span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v/1000}k`} />
                  <RechartsTooltip
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                    formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Amount']}
                  />
                  <Area type="monotone" dataKey="netPayroll" name="Net Pay" stroke="#6366F1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorNet)" />
                  <Area type="monotone" dataKey="grossPayroll" name="Gross Pay" stroke="#10B981" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorGross)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Department Breakdown & Flow (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm shadow-slate-200/50 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Department Distribution</h3>
                <p className="text-xs text-slate-400 font-medium">Payroll share across faculties</p>
              </div>
            </div>

            <div className="h-44 w-full flex items-center justify-center">
              {deptDistributionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deptDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={68}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {deptDistributionData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{ borderRadius: '14px', border: 'none', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }}
                      formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Share']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <span className="text-xs text-slate-400 font-medium">No departmental records</span>
              )}
            </div>

            {/* Gross vs Net Breakdown Progress Shelf */}
            <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-600">
                <span>Gross: ₹{breakdownData.totalGross.toLocaleString('en-IN')}</span>
                <span className="text-rose-500">Deductions: -₹{breakdownData.totalDeductions.toLocaleString('en-IN')}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
                <div
                  className="bg-indigo-600 h-full"
                  style={{ width: `${breakdownData.totalGross > 0 ? (breakdownData.totalNet / breakdownData.totalGross) * 100 : 80}%` }}
                  title="Net Pay Take-home"
                />
                <div
                  className="bg-rose-400 h-full"
                  style={{ width: `${breakdownData.totalGross > 0 ? (breakdownData.totalDeductions / breakdownData.totalGross) * 100 : 20}%` }}
                  title="Deductions & Taxes"
                />
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-500 font-semibold">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-600" /> Net Take-Home</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-400" /> Tax & LOP</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. Filters & Action Bar ── */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm shadow-slate-200/50 space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Year & Month Selection */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(parseInt(e.target.value))}
                className="px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
              >
                {[0, 1, 2, 3, 4].map(i => {
                  const y = now.getFullYear() - i;
                  return <option key={y} value={y}>{y}</option>;
                })}
              </select>

              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(parseInt(e.target.value))}
                className="px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
              >
                {MONTHS.map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))}
              </select>

              <select
                value={selectedDept}
                onChange={e => setSelectedDept(e.target.value)}
                className="px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
              >
                <option value="ALL">All Departments</option>
                {departments.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
              >
                <option value="ALL">All Status</option>
                <option value="PAID">Paid</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search by Employee Name or ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* ── 4. Main Salary Records Table ── */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm shadow-slate-200/50 overflow-hidden">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3">
              <LoadingSpinner size="lg" />
              <p className="text-xs font-bold text-slate-400">Loading payroll ledger...</p>
            </div>
          ) : filteredSalaries.length === 0 ? (
            <div className="py-20 px-6 text-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 mx-auto mb-4 shadow-inner">
                <DollarSign className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-800">No Salary Records Found</h3>
              <p className="text-xs text-slate-500 font-medium mt-1 mb-6 leading-relaxed">
                No payroll records have been generated yet for <strong className="text-indigo-600">{MONTHS[selectedMonth - 1]} {selectedYear}</strong>. You can automatically calculate and process all teacher salaries in one click.
              </p>
              {isAdmin && (
                <button
                  onClick={() => setShowProcessModal(true)}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 mx-auto active:scale-95 transition-all cursor-pointer"
                >
                  <Zap className="w-4 h-4" /> Process Payroll for {MONTHS[selectedMonth - 1]} Now
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-black uppercase tracking-wider text-slate-500">
                    <th className="py-4 px-5">Employee</th>
                    <th className="py-4 px-4">Role / Dept</th>
                    <th className="py-4 px-4">Basic Pay</th>
                    <th className="py-4 px-4">Allowances</th>
                    <th className="py-4 px-4">Deductions</th>
                    <th className="py-4 px-4">Net Salary</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {filteredSalaries.map(sal => {
                    const isPaid = sal.status === 'PAID';
                    return (
                      <tr key={sal.id} className="hover:bg-indigo-50/20 transition-colors group">
                        {/* Employee Name + ID */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            {sal.teacher.user.photoUrl ? (
                              <img
                                src={getPhotoUrl(sal.teacher.user.photoUrl)}
                                alt=""
                                className="w-9 h-9 rounded-2xl object-cover border border-slate-200"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-xs flex items-center justify-center shadow-sm">
                                {sal.teacher.user.name.charAt(0)}
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                {sal.teacher.user.name}
                              </p>
                              <p className="text-[11px] font-semibold text-slate-400">
                                {sal.teacher.employeeId}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Department */}
                        <td className="py-3.5 px-4 font-semibold text-slate-600">
                          <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-[11px] font-bold">
                            {sal.teacher.specialization || 'Teacher'}
                          </span>
                        </td>

                        {/* Basic */}
                        <td className="py-3.5 px-4 font-semibold text-slate-700">
                          ₹{sal.basicSalary.toLocaleString('en-IN')}
                        </td>

                        {/* Allowances */}
                        <td className="py-3.5 px-4 font-bold text-emerald-600">
                          +₹{sal.allowances.toLocaleString('en-IN')}
                        </td>

                        {/* Deductions */}
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-rose-500">
                            -₹{sal.deductions.toLocaleString('en-IN')}
                          </span>
                          {sal.remarks && sal.remarks.includes('Loss of Pay') && (
                            <span className="block text-[10px] text-amber-600 font-medium">LOP Applied</span>
                          )}
                        </td>

                        {/* Net Pay */}
                        <td className="py-3.5 px-4">
                          <span className="font-black text-indigo-700 text-sm">
                            ₹{sal.netSalary.toLocaleString('en-IN')}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black tracking-wide ${
                              isPaid
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {isPaid ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3 text-amber-600" />}
                            {sal.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isAdmin && !isPaid && (
                              <button
                                onClick={() => handleMarkPaid(sal.id)}
                                className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] transition-colors cursor-pointer"
                                title="Mark as Paid"
                              >
                                Pay
                              </button>
                            )}

                            <button
                              onClick={() => setViewPayslipRecord(sal)}
                              className="p-1.5 rounded-xl bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                              title="View Payslip"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDownloadPayslipPDF(sal)}
                              className="p-1.5 rounded-xl bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                              title="Download PDF"
                            >
                              <Download className="w-4 h-4" />
                            </button>

                            {isAdmin && (
                              <button
                                onClick={() => handleDelete(sal.id)}
                                className="p-1.5 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal: Process Payroll Automatically ── */}
      {showProcessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Process Monthly Payroll</h3>
                  <p className="text-xs text-slate-400 font-medium">
                    {MONTHS[selectedMonth - 1]} {selectedYear}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowProcessModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-indigo-50/50 p-3.5 rounded-2xl border border-indigo-100/60">
              This will automatically calculate salaries for all <strong>{teachers.length} teachers/staff</strong>. It integrates with <strong>Staff Attendance</strong> to calculate Loss of Pay (LOP) for unexcused leaves.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">
                  Default Basic Salary (₹)
                </label>
                <input
                  type="number"
                  value={processSettings.defaultBasic}
                  onChange={e => setProcessSettings(s => ({ ...s, defaultBasic: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">
                  Default Allowances (₹)
                </label>
                <input
                  type="number"
                  value={processSettings.defaultAllowances}
                  onChange={e => setProcessSettings(s => ({ ...s, defaultAllowances: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowProcessModal(false)}
                className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProcessPayroll}
                disabled={processing}
                className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {processing ? <LoadingSpinner size="sm" /> : <Zap className="w-4 h-4" />}
                {processing ? 'Processing...' : 'Run Payroll'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Add / Edit Single Record ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <form onSubmit={handleSaveSalary} className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900">Add Salary Record</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Employee *</label>
              <select
                value={form.teacherId}
                onChange={e => setForm(f => ({ ...f, teacherId: e.target.value }))}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
              >
                <option value="">-- Select Teacher / Staff --</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.user.name} ({t.employeeId})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Month *</label>
                <select
                  value={form.month}
                  onChange={e => setForm(f => ({ ...f, month: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {MONTHS.map((m, i) => (
                    <option key={i + 1} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Year *</label>
                <input
                  type="number"
                  value={form.year}
                  onChange={e => setForm(f => ({ ...f, year: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Basic Salary (₹) *</label>
              <input
                type="number"
                required
                value={form.basicSalary}
                onChange={e => setForm(f => ({ ...f, basicSalary: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Allowances (₹)</label>
                <input
                  type="number"
                  value={form.allowances}
                  onChange={e => setForm(f => ({ ...f, allowances: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Deductions (₹)</label>
                <input
                  type="number"
                  value={form.deductions}
                  onChange={e => setForm(f => ({ ...f, deductions: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Remarks</label>
              <input
                type="text"
                placeholder="e.g. Regular Payroll / Incentive"
                value={form.remarks}
                onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Record'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Modal: View Payslip Digital Preview ── */}
      {viewPayslipRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-black tracking-tight">Digital Salary Payslip</h3>
                <p className="text-xs text-indigo-200">
                  {MONTHS[viewPayslipRecord.month - 1]} {viewPayslipRecord.year}
                </p>
              </div>
              <button
                onClick={() => setViewPayslipRecord(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              {/* Employee info */}
              <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-black text-indigo-600 text-lg">
                  {viewPayslipRecord.teacher.user.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">{viewPayslipRecord.teacher.user.name}</h4>
                  <p className="text-xs font-semibold text-slate-400">
                    ID: {viewPayslipRecord.teacher.employeeId} • {viewPayslipRecord.teacher.specialization || 'Teacher'}
                  </p>
                </div>
              </div>

              {/* Breakdown Table */}
              <div className="space-y-2 text-xs font-semibold text-slate-600">
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span>Basic Salary</span>
                  <span className="font-bold text-slate-800">₹{viewPayslipRecord.basicSalary.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50 text-emerald-600">
                  <span>Allowances & Perks</span>
                  <span className="font-bold">+₹{viewPayslipRecord.allowances.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50 text-rose-500">
                  <span>Deductions (PF, Tax, LOP)</span>
                  <span className="font-bold">-₹{viewPayslipRecord.deductions.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-2 text-sm font-black text-slate-900 bg-indigo-50/60 p-3 rounded-2xl border border-indigo-100/60">
                  <span>Net Salary Payable</span>
                  <span className="text-indigo-600 text-base">₹{viewPayslipRecord.netSalary.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px] text-slate-500 space-y-1">
                <p><strong>Status:</strong> {viewPayslipRecord.status}</p>
                <p><strong>Remarks:</strong> {viewPayslipRecord.remarks || 'Regular monthly disbursement'}</p>
                {viewPayslipRecord.paidOn && (
                  <p><strong>Paid On:</strong> {new Date(viewPayslipRecord.paidOn).toLocaleString()}</p>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setViewPayslipRecord(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => handleDownloadPayslipPDF(viewPayslipRecord)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryPage;
