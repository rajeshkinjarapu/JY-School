import React, { useEffect, useState, useRef, useMemo } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import {
  Plus, Upload, FileSpreadsheet, Trash2, Search, ChevronDown,
  X, BookOpen, Users, User, Building2, Download, CheckCircle2,
  AlertCircle, IndianRupee, Calendar, Layers, FileDown, RefreshCw,
  Filter, Eye, BarChart3
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const CLASS_COLORS = [
  'from-blue-500 to-cyan-500',
  'from-violet-500 to-purple-500',
  'from-emerald-500 to-teal-500',
  'from-orange-500 to-amber-500',
  'from-rose-500 to-pink-500',
  'from-indigo-500 to-blue-500',
  'from-fuchsia-500 to-rose-500',
  'from-sky-500 to-indigo-500',
  'from-lime-500 to-green-500',
  'from-red-500 to-orange-500',
];
const getClassColor = (idx: number) => CLASS_COLORS[idx % CLASS_COLORS.length];

const fmt = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

// ─── Component ────────────────────────────────────────────────────────────────
export const FeeStructurePage: React.FC = () => {
  const [structures, setStructures] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [modal, setModal] = useState<'class' | 'student' | 'excel' | 'view' | null>(null);
  const [viewClass, setViewClass] = useState<any>(null);

  // Class-wise form
  const [cfName, setCfName] = useState('');
  const [cfTerm, setCfTerm] = useState('Annual');
  const [cfAmount, setCfAmount] = useState('');
  const [cfDueDate, setCfDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [cfClassId, setCfClassId] = useState('');
  const [cfSaving, setCfSaving] = useState(false);

  // Student-wise form
  const [sfStudentSearch, setSfStudentSearch] = useState('');
  const [sfStudents, setSfStudents] = useState<any[]>([]);
  const [sfStudentId, setSfStudentId] = useState('');
  const [sfName, setSfName] = useState('');
  const [sfTerm, setSfTerm] = useState('Annual');
  const [sfAmount, setSfAmount] = useState('');
  const [sfDueDate, setSfDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [sfSaving, setSfSaving] = useState(false);
  const [sfDropOpen, setSfDropOpen] = useState(false);
  const [sfSelectedStudent, setSfSelectedStudent] = useState<any>(null);

  // Excel import
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const excelRef = useRef<HTMLInputElement>(null);

  // Filter
  const [filterClass, setFilterClass] = useState('ALL');
  const [searchFee, setSearchFee] = useState('');

  // ── Data Fetching ────────────────────────────────────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    try {
      const [sRes, cRes]: any = await Promise.all([
        api.get('/api/fees/structures?limit=750'),
        api.get('/api/classes?limit=750'),
      ]);
      const structs = sRes.data?.data || sRes.data || sRes || [];
      const cls = cRes.data?.data || cRes.data || cRes || [];
      setStructures(Array.isArray(structs) ? structs : []);
      setClasses(Array.isArray(cls) ? cls : []);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Search students for student-wise
  useEffect(() => {
    if (sfStudentSearch.length < 2) { setSfStudents([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res: any = await api.get(`/api/students?search=${sfStudentSearch}&limit=20`);
        const data = res.data?.data || res.data || [];
        setSfStudents(Array.isArray(data) ? data : []);
      } catch {}
    }, 400);
    return () => clearTimeout(timer);
  }, [sfStudentSearch]);

  // ── Stats ────────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalFee = structures.reduce((s, x) => s + (Number(x.amount) || 0), 0);
    const classWise = structures.filter(s => s.classId && !s.studentId);
    const studentWise = structures.filter(s => s.studentId);
    return { total: structures.length, totalFee, classWise: classWise.length, studentWise: studentWise.length };
  }, [structures]);

  // ── Grouped by class ─────────────────────────────────────────────────────────
  const groupedByClass = useMemo(() => {
    const map = new Map<string, { cls: any; fees: any[] }>();
    classes.forEach(c => map.set(c.id, { cls: c, fees: [] }));
    structures.forEach(s => {
      if (s.classId && map.has(s.classId)) {
        map.get(s.classId)!.fees.push(s);
      }
    });
    return Array.from(map.values()).filter(g => g.fees.length > 0);
  }, [structures, classes]);

  // Individual student fees
  const studentFees = useMemo(() =>
    structures.filter(s => s.studentId),
  [structures]);

  // Filtered view
  const filteredStructures = useMemo(() => {
    let list = structures;
    if (filterClass !== 'ALL') list = list.filter(s => s.classId === filterClass);
    if (searchFee) list = list.filter(s => s.name?.toLowerCase().includes(searchFee.toLowerCase()));
    return list;
  }, [structures, filterClass, searchFee]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleClassFeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cfClassId) return toast.error('Please select a class');
    setCfSaving(true);
    try {
      await api.post('/api/fees/structures', {
        name: cfName, term: cfTerm, amount: Number(cfAmount),
        dueDate: new Date(cfDueDate), classId: cfClassId,
      });
      toast.success('Fee component created!');
      setCfName(''); setCfAmount(''); setCfClassId('');
      setModal(null); fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create fee');
    } finally { setCfSaving(false); }
  };

  const handleStudentFeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sfStudentId) return toast.error('Please select a student');
    setSfSaving(true);
    try {
      await api.post('/api/fees/structures', {
        name: sfName, term: sfTerm, amount: Number(sfAmount),
        dueDate: new Date(sfDueDate), studentId: sfStudentId,
      });
      toast.success('Student fee assigned!');
      setSfName(''); setSfAmount(''); setSfStudentId('');
      setSfSelectedStudent(null); setSfStudentSearch('');
      setModal(null); fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to assign fee');
    } finally { setSfSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this fee component?')) return;
    try {
      await api.delete(`/api/fees/structures/${id}`);
      toast.success('Deleted!');
      fetchData();
    } catch { toast.error('Delete failed'); }
  };

  const handleExcelImport = async () => {
    if (!excelFile) return;
    setImporting(true);
    const fd = new FormData();
    fd.append('file', excelFile);
    try {
      const res: any = await api.post('/api/fees/structures/bulk-import', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const d = res.data?.data || res.data || {};
      toast.success(`✅ Success: ${d.success || 0} | ❌ Failed: ${d.failed || 0}`);
      setExcelFile(null); setModal(null); fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Import failed');
    } finally { setImporting(false); }
  };

  const downloadTemplate = () => {
    const data = [
      { 'Student ID': 'JY26-0001', 'Fee Name': 'Tuition Fee', 'Term': 'Annual', 'Amount': 15000, 'Due Date': '2026-06-01' },
      { 'Student ID': 'JY26-0002', 'Fee Name': 'Lab Fee', 'Term': 'Term 1', 'Amount': 3000, 'Due Date': '2026-06-01' },
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Fee Template');
    XLSX.writeFile(wb, 'Fee_Import_Template.xlsx');
  };

  const resetClassForm = () => { setCfName(''); setCfAmount(''); setCfClassId(''); setCfTerm('Annual'); };
  const resetStudentForm = () => { setSfName(''); setSfAmount(''); setSfStudentId(''); setSfSelectedStudent(null); setSfStudentSearch(''); setSfTerm('Annual'); };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 space-y-6 min-h-screen bg-slate-50 dark:bg-gray-950">

      {/* ── Top Action Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Fee Structure</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage class-wise and student-wise fee components</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => { resetClassForm(); setModal('class'); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md shadow-indigo-500/20 transition-all hover:-translate-y-0.5"
          >
            <Building2 className="w-4 h-4" /> Class-wise Fee
          </button>
          <button
            onClick={() => { resetStudentForm(); setModal('student'); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-500/20 transition-all hover:-translate-y-0.5"
          >
            <User className="w-4 h-4" /> Student Fee
          </button>
          <button
            onClick={() => { setExcelFile(null); setModal('excel'); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl shadow-md shadow-amber-500/20 transition-all hover:-translate-y-0.5"
          >
            <FileSpreadsheet className="w-4 h-4" /> Excel Import
          </button>
          <button
            onClick={fetchData}
            className="p-2.5 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl hover:bg-slate-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Components', value: stats.total, icon: Layers, color: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50 dark:bg-blue-950' },
          { label: 'Total Fee Value', value: fmt(stats.totalFee), icon: IndianRupee, color: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50 dark:bg-emerald-950' },
          { label: 'Class-wise Fees', value: stats.classWise, icon: Building2, color: 'from-violet-500 to-purple-600', bg: 'bg-violet-50 dark:bg-violet-950' },
          { label: 'Student-specific', value: stats.studentWise, icon: User, color: 'from-orange-500 to-amber-600', bg: 'bg-orange-50 dark:bg-orange-950' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} border border-white/50 dark:border-gray-800 rounded-2xl p-4 flex items-center gap-4`}>
            <div className={`w-12 h-12 bg-gradient-to-br ${s.color} rounded-xl flex items-center justify-center shadow-md flex-shrink-0`}>
              <s.icon className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{s.label}</p>
              <p className="text-xl font-black text-slate-900 dark:text-white truncate">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Class-wise Fee Cards ── */}
      {!loading && groupedByClass.length > 0 && (
        <div>
          <h3 className="text-base font-black text-slate-800 dark:text-white mb-3 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-500" /> Class-wise Fee Components
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {groupedByClass.map(({ cls, fees }, idx) => {
              const total = fees.reduce((s, f) => s + (Number(f.amount) || 0), 0);
              const color = getClassColor(idx);
              return (
                <div key={cls.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                  <div className={`bg-gradient-to-r ${color} p-4`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-white/70 text-[10px] font-black uppercase tracking-wider">Class</span>
                        <h4 className="text-white font-black text-lg leading-tight">{cls.name} – {cls.section}</h4>
                      </div>
                      <div className="text-right">
                        <span className="text-white/70 text-[10px] font-bold block">Total</span>
                        <span className="text-white font-black text-base">{fmt(total)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    {fees.slice(0, 4).map(fee => (
                      <div key={fee.id} className="flex items-center justify-between py-1.5 px-3 bg-slate-50 dark:bg-gray-800 rounded-xl">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0" />
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{fee.name}</span>
                          <span className="text-[10px] text-slate-400 font-medium hidden sm:block">{fee.term}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <span className="text-sm font-black text-slate-800 dark:text-white">{fmt(fee.amount)}</span>
                          <button onClick={() => handleDelete(fee.id)} className="p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {fees.length > 4 && (
                      <button
                        onClick={() => { setViewClass({ cls, fees }); setModal('view'); }}
                        className="w-full text-center text-xs font-bold text-indigo-600 py-1.5 hover:bg-indigo-50 rounded-xl transition-colors"
                      >
                        + {fees.length - 4} more components →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Student-specific Fees ── */}
      {!loading && studentFees.length > 0 && (
        <div>
          <h3 className="text-base font-black text-slate-800 dark:text-white mb-3 flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-500" /> Student-specific Fees
            <span className="ml-auto text-xs text-slate-400 font-medium">{studentFees.length} records</span>
          </h3>
          <div className="bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-gray-800/60 border-b border-slate-100 dark:border-gray-700">
                    <th className="px-5 py-3 text-left text-[11px] font-black text-slate-500 uppercase tracking-wider">Student</th>
                    <th className="px-5 py-3 text-left text-[11px] font-black text-slate-500 uppercase tracking-wider">Fee Name</th>
                    <th className="px-5 py-3 text-left text-[11px] font-black text-slate-500 uppercase tracking-wider">Term</th>
                    <th className="px-5 py-3 text-right text-[11px] font-black text-slate-500 uppercase tracking-wider">Amount</th>
                    <th className="px-5 py-3 text-right text-[11px] font-black text-slate-500 uppercase tracking-wider">Due</th>
                    <th className="px-2 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-gray-800">
                  {studentFees.map(fee => (
                    <tr key={fee.id} className="hover:bg-slate-50 dark:hover:bg-gray-800/40 transition-colors group">
                      <td className="px-5 py-3">
                        <span className="font-bold text-slate-700 dark:text-slate-200">{fee.student?.user?.name || fee.student?.rollNo || '—'}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-semibold text-slate-600 dark:text-slate-300">{fee.name}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 text-[10px] font-black uppercase rounded-md">{fee.term}</span>
                      </td>
                      <td className="px-5 py-3 text-right font-black text-slate-800 dark:text-white">{fmt(fee.amount)}</td>
                      <td className="px-5 py-3 text-right text-slate-400 text-xs font-medium">
                        {fee.dueDate ? new Date(fee.dueDate).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="px-2 py-3">
                        <button onClick={() => handleDelete(fee.id)} className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && structures.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-slate-200 dark:border-gray-700">
          <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-950 rounded-2xl flex items-center justify-center mb-4">
            <Layers className="w-10 h-10 text-indigo-400" />
          </div>
          <p className="text-lg font-black text-slate-700 dark:text-white mb-1">No Fee Structures</p>
          <p className="text-sm text-slate-400 mb-6">Add a class-wise fee or assign individual student fees</p>
          <div className="flex gap-3">
            <button onClick={() => setModal('class')} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-sm">+ Class Fee</button>
            <button onClick={() => setModal('excel')} className="px-4 py-2 bg-amber-500 text-white font-bold rounded-xl text-sm">Excel Import</button>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: Class-wise Fee */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {modal === 'class' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md border border-slate-100 dark:border-gray-800">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-t-3xl px-6 py-5 flex items-center justify-between">
              <div>
                <h3 className="text-white font-black text-lg">Class-wise Fee</h3>
                <p className="text-indigo-200 text-xs mt-0.5">Apply fee to all students in a class</p>
              </div>
              <button onClick={() => setModal(null)} className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <form onSubmit={handleClassFeeSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">Fee Name *</label>
                <input
                  required value={cfName} onChange={e => setCfName(e.target.value)}
                  placeholder="e.g. Tuition Fee, Lab Fee"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">Class *</label>
                <select
                  required value={cfClassId} onChange={e => setCfClassId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition appearance-none cursor-pointer"
                >
                  <option value="">Select Class</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} – {c.section}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">Term</label>
                  <select
                    value={cfTerm} onChange={e => setCfTerm(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition appearance-none cursor-pointer"
                  >
                    {['Annual', 'Term 1', 'Term 2', 'Term 3', 'Final'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">Amount (₹) *</label>
                  <input
                    required type="number" min="1" value={cfAmount} onChange={e => setCfAmount(e.target.value)}
                    placeholder="e.g. 15000"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">Due Date</label>
                <input
                  type="date" value={cfDueDate} onChange={e => setCfDueDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className="flex-1 py-3 bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-gray-700 transition">Cancel</button>
                <button type="submit" disabled={cfSaving} className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-2xl hover:from-indigo-700 hover:to-violet-700 transition shadow-md disabled:opacity-60 flex items-center justify-center gap-2">
                  {cfSaving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</> : <><Plus className="w-4 h-4" /> Add Fee</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: Student-wise Fee */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {modal === 'student' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md border border-slate-100 dark:border-gray-800">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-t-3xl px-6 py-5 flex items-center justify-between">
              <div>
                <h3 className="text-white font-black text-lg">Student-specific Fee</h3>
                <p className="text-emerald-200 text-xs mt-0.5">Assign individual fee to one student</p>
              </div>
              <button onClick={() => setModal(null)} className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <form onSubmit={handleStudentFeeSubmit} className="p-6 space-y-4">
              {/* Student Search */}
              <div className="relative">
                <label className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">Search Student *</label>
                {sfSelectedStudent ? (
                  <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-2xl px-4 py-3">
                    <div>
                      <p className="font-bold text-emerald-700 dark:text-emerald-300 text-sm">{sfSelectedStudent.user?.name}</p>
                      <p className="text-xs text-emerald-500">{sfSelectedStudent.rollNo}</p>
                    </div>
                    <button type="button" onClick={() => { setSfSelectedStudent(null); setSfStudentId(''); setSfStudentSearch(''); }} className="p-1 hover:bg-emerald-100 rounded-lg">
                      <X className="w-4 h-4 text-emerald-600" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      value={sfStudentSearch}
                      onChange={e => { setSfStudentSearch(e.target.value); setSfDropOpen(true); }}
                      placeholder="Type student name or roll no..."
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition"
                    />
                    {sfStudents.length > 0 && sfDropOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-2xl shadow-xl z-20 max-h-48 overflow-y-auto">
                        {sfStudents.map(s => (
                          <button
                            key={s.id} type="button"
                            onClick={() => { setSfSelectedStudent(s); setSfStudentId(s.id); setSfDropOpen(false); }}
                            className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors border-b border-slate-50 dark:border-gray-800 last:border-0"
                          >
                            <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">{s.user?.name}</p>
                            <p className="text-xs text-slate-400">{s.rollNo}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">Fee Name *</label>
                <input
                  required value={sfName} onChange={e => setSfName(e.target.value)}
                  placeholder="e.g. Special Tuition Fee"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">Term</label>
                  <select value={sfTerm} onChange={e => setSfTerm(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition appearance-none cursor-pointer">
                    {['Annual', 'Term 1', 'Term 2', 'Term 3', 'Final'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">Amount (₹) *</label>
                  <input
                    required type="number" min="1" value={sfAmount} onChange={e => setSfAmount(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">Due Date</label>
                <input type="date" value={sfDueDate} onChange={e => setSfDueDate(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className="flex-1 py-3 bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 transition">Cancel</button>
                <button type="submit" disabled={sfSaving || !sfStudentId} className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-2xl hover:from-emerald-700 hover:to-teal-700 transition shadow-md disabled:opacity-60 flex items-center justify-center gap-2">
                  {sfSaving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</> : <><Plus className="w-4 h-4" /> Assign Fee</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: Excel Bulk Import */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {modal === 'excel' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md border border-slate-100 dark:border-gray-800">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-t-3xl px-6 py-5 flex items-center justify-between">
              <div>
                <h3 className="text-white font-black text-lg">Excel Bulk Import</h3>
                <p className="text-amber-100 text-xs mt-0.5">Upload fees for many students at once</p>
              </div>
              <button onClick={() => setModal(null)} className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Template Download */}
              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
                <p className="text-sm font-bold text-amber-800 dark:text-amber-200 mb-1">📋 Excel Template Format</p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mb-3">
                  Columns needed: <strong>Student ID</strong>, <strong>Fee Name</strong>, <strong>Term</strong>, <strong>Amount</strong>, <strong>Due Date</strong>
                </p>
                <button onClick={downloadTemplate} className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-colors">
                  <FileDown className="w-3.5 h-3.5" /> Download Template
                </button>
              </div>

              {/* File Upload */}
              <div>
                <label className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block">Upload Excel File</label>
                <div
                  onClick={() => excelRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 dark:border-gray-700 rounded-2xl p-6 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-all"
                >
                  {excelFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileSpreadsheet className="w-8 h-8 text-emerald-500" />
                      <div className="text-left">
                        <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">{excelFile.name}</p>
                        <p className="text-xs text-slate-400">{(excelFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="font-bold text-slate-500 text-sm">Click to browse</p>
                      <p className="text-xs text-slate-400 mt-1">Supports .xlsx and .xls</p>
                    </>
                  )}
                </div>
                <input ref={excelRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={e => setExcelFile(e.target.files?.[0] || null)} />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setModal(null)} className="flex-1 py-3 bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 transition">Cancel</button>
                <button onClick={handleExcelImport} disabled={!excelFile || importing} className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-2xl hover:from-amber-600 hover:to-orange-600 transition shadow-md disabled:opacity-60 flex items-center justify-center gap-2">
                  {importing ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Importing...</> : <><Upload className="w-4 h-4" /> Import Now</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: View All Fees for a Class */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {modal === 'view' && viewClass && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg border border-slate-100 dark:border-gray-800">
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-t-3xl px-6 py-5 flex items-center justify-between">
              <div>
                <h3 className="text-white font-black text-lg">{viewClass.cls.name} – {viewClass.cls.section}</h3>
                <p className="text-indigo-200 text-xs mt-0.5">All fee components for this class</p>
              </div>
              <button onClick={() => { setModal(null); setViewClass(null); }} className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto space-y-2">
              {viewClass.fees.map((fee: any) => (
                <div key={fee.id} className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-gray-800 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors group">
                  <div>
                    <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">{fee.name}</p>
                    <p className="text-xs text-slate-400">{fee.term}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-slate-800 dark:text-white">{fmt(fee.amount)}</span>
                    <button onClick={() => handleDelete(fee.id)} className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeStructurePage;
