import React, { useEffect, useState, useRef, useMemo } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  Plus, Upload, FileSpreadsheet, Trash2, Search, X, 
  User, IndianRupee, Layers, FileDown, RefreshCw, 
} from 'lucide-react';

const fmt = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export const FeeStructurePage: React.FC = () => {
  const [structures, setStructures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [modal, setModal] = useState<'student' | 'excel' | null>(null);

  // Student-wise form (Simplified)
  const [sfStudentSearch, setSfStudentSearch] = useState('');
  const [sfStudents, setSfStudents] = useState<any[]>([]);
  const [sfStudentId, setSfStudentId] = useState('');
  const [sfAmount, setSfAmount] = useState('');
  const [sfSaving, setSfSaving] = useState(false);
  const [sfDropOpen, setSfDropOpen] = useState(false);
  const [sfSelectedStudent, setSfSelectedStudent] = useState<any>(null);

  // Excel import
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const excelRef = useRef<HTMLInputElement>(null);

  // Filter
  const [searchFee, setSearchFee] = useState('');

  // ── Data Fetching ────────────────────────────────────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    try {
      // Only need structures, skipping classes since we only do student-wise fee now
      const sRes: any = await api.get('/api/fees/structures?limit=750');
      const structs = sRes.data?.data || sRes.data || sRes || [];
      // Keep only student fees
      setStructures(Array.isArray(structs) ? structs.filter((s:any) => s.studentId) : []);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Search students
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
    return { total: structures.length, totalFee };
  }, [structures]);

  // Filtered view
  const filteredStructures = useMemo(() => {
    let list = structures;
    if (searchFee) {
      const s = searchFee.toLowerCase();
      list = list.filter(x => 
        x.student?.user?.name?.toLowerCase().includes(s) || 
        x.student?.rollNo?.toLowerCase().includes(s)
      );
    }
    return list;
  }, [structures, searchFee]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleStudentFeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sfStudentId) return toast.error('Please select a student');
    setSfSaving(true);
    try {
      await api.post('/api/fees/structures', {
        name: 'Tuition Fee', 
        term: 'Annual', 
        amount: Number(sfAmount),
        dueDate: new Date(), 
        studentId: sfStudentId,
      });
      toast.success('Fee successfully added to student!');
      setSfAmount(''); setSfStudentId('');
      setSfSelectedStudent(null); setSfStudentSearch('');
      setModal(null); fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to assign fee');
    } finally { setSfSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this fee entry?')) return;
    try {
      await api.delete(`/api/fees/structures/${id}`);
      toast.success('Deleted successfully!');
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

  const downloadTemplate = async () => {
    const XLSX = await import('xlsx');
    const data = [
      { 'Student ID': 'JY26-0001', 'Amount': 30000 },
      { 'Student ID': 'JY26-0002', 'Amount': 28000 },
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Fees');
    XLSX.writeFile(wb, 'Fee_Import_Template.xlsx');
  };

  const resetStudentForm = () => { setSfAmount(''); setSfStudentId(''); setSfSelectedStudent(null); setSfStudentSearch(''); };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Top Action Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-800">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Fee Configuration</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage individual student tuition fees</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => { resetStudentForm(); setModal('student'); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md shadow-indigo-500/20 transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" /> Add Student Fee
          </button>
          <button
            onClick={() => { setExcelFile(null); setModal('excel'); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-500/20 transition-all hover:-translate-y-0.5"
          >
            <FileSpreadsheet className="w-4 h-4" /> Bulk Excel Import
          </button>
          <button
            onClick={fetchData}
            className="p-2.5 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl hover:bg-slate-100 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-800 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <User className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Students with Fee Added</p>
            <p className="text-2xl font-black text-slate-800 dark:text-white">{stats.total}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-800 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Fee Expected</p>
            <p className="text-2xl font-black text-slate-800 dark:text-white">{fmt(stats.totalFee)}</p>
          </div>
        </div>
      </div>

      {/* ── Search & List ── */}
      <div className="bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-gray-800">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student name or ID..."
              value={searchFee}
              onChange={e => setSearchFee(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-gray-800 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-gray-800/50 border-b border-slate-100 dark:border-gray-800">
                <th className="px-5 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Student ID</th>
                <th className="px-5 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Name</th>
                <th className="px-5 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Fee Category</th>
                <th className="px-5 py-3 text-right text-xs font-black text-slate-500 uppercase tracking-wider">Amount Expected</th>
                <th className="px-5 py-3 text-right text-xs font-black text-slate-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-gray-800">
              {filteredStructures.map(fee => (
                <tr key={fee.id} className="hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-5 py-3 font-semibold text-slate-600 dark:text-slate-400">{fee.student?.rollNo || '—'}</td>
                  <td className="px-5 py-3 font-bold text-slate-900 dark:text-white">{fee.student?.user?.name || '—'}</td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-md">Tuition Fee</span>
                  </td>
                  <td className="px-5 py-3 text-right font-black text-emerald-600 dark:text-emerald-400 text-base">{fmt(fee.amount)}</td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => handleDelete(fee.id)} className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && filteredStructures.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Layers className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="font-bold text-slate-500">No fee records found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: Single Student Fee */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {modal === 'student' && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md border border-slate-100 dark:border-gray-800 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-black text-slate-900 text-lg">Add Student Fee</h3>
              <button onClick={() => setModal(null)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleStudentFeeSubmit} className="p-6 space-y-5">
              <div className="relative">
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider mb-2 block">Search Student</label>
                {sfSelectedStudent ? (
                  <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-3">
                    <div>
                      <p className="font-bold text-indigo-900 text-sm">{sfSelectedStudent.user?.name}</p>
                      <p className="text-xs text-indigo-500 font-semibold">{sfSelectedStudent.rollNo}</p>
                    </div>
                    <button type="button" onClick={() => { setSfSelectedStudent(null); setSfStudentId(''); setSfStudentSearch(''); }} className="p-1.5 hover:bg-indigo-100 rounded-xl transition">
                      <X className="w-4 h-4 text-indigo-600" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      value={sfStudentSearch}
                      onChange={e => { setSfStudentSearch(e.target.value); setSfDropOpen(true); }}
                      placeholder="Type name or ID..."
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none transition"
                    />
                    {sfStudents.length > 0 && sfDropOpen && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 max-h-48 overflow-y-auto">
                        {sfStudents.map(s => (
                          <button
                            key={s.id} type="button"
                            onClick={() => { setSfSelectedStudent(s); setSfStudentId(s.id); setSfDropOpen(false); }}
                            className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                          >
                            <p className="font-bold text-slate-800 text-sm">{s.user?.name}</p>
                            <p className="text-xs font-semibold text-slate-400">{s.rollNo}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider mb-2 block">Amount to Pay (₹)</label>
                <div className="relative">
                  <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    required type="number" min="1" value={sfAmount} onChange={e => setSfAmount(e.target.value)}
                    placeholder="e.g. 30000"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-base font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" disabled={sfSaving || !sfStudentId} className="w-full py-3.5 bg-indigo-600 text-white font-black text-sm rounded-2xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/25 disabled:opacity-60 flex items-center justify-center gap-2">
                  {sfSaving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</> : 'Save Fee Configuration'}
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
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md border border-slate-100 dark:border-gray-800 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-black text-slate-900 text-lg">Bulk Fee Upload</h3>
              <button onClick={() => setModal(null)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <p className="text-sm font-bold text-amber-900 mb-1">📋 Simple Excel Format</p>
                <p className="text-xs font-medium text-amber-700 mb-3">
                  Only 2 columns needed: <strong>Student ID</strong> and <strong>Amount</strong>
                </p>
                <button onClick={downloadTemplate} className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-colors shadow-md shadow-amber-500/20">
                  <FileDown className="w-3.5 h-3.5" /> Download Template
                </button>
              </div>

              <div>
                <div
                  onClick={() => excelRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-all group"
                >
                  {excelFile ? (
                    <div>
                      <FileSpreadsheet className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                      <p className="font-bold text-slate-700 text-sm">{excelFile.name}</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 text-slate-300 mx-auto mb-3 group-hover:text-emerald-400 transition-colors" />
                      <p className="font-bold text-slate-600 text-sm">Click to select Excel File</p>
                    </>
                  )}
                </div>
                <input ref={excelRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={e => setExcelFile(e.target.files?.[0] || null)} />
              </div>

              <div className="pt-2">
                <button onClick={handleExcelImport} disabled={!excelFile || importing} className="w-full py-3.5 bg-emerald-600 text-white font-black text-sm rounded-2xl hover:bg-emerald-700 transition shadow-lg shadow-emerald-500/25 disabled:opacity-60 flex items-center justify-center gap-2">
                  {importing ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading...</> : 'Upload & Save Fees'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
