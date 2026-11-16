import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import {
  Calendar as CalendarIcon, Plus, Trash2, Edit2, Search, Filter,
  Printer, Download, Sparkles, AlertCircle, CheckCircle2, ChevronRight,
  ArrowLeft, Clock, Sun, Flame, Award, Building, Landmark, Star,
  RefreshCw, X, Check, Eye, ChevronLeft, MapPin, Layers
} from 'lucide-react';

interface SchoolHoliday {
  id: string;
  title: string;
  description?: string | null;
  startDate: string;
  endDate?: string | null;
  allDay: boolean;
  targetRoles?: string;
  createdAt?: string;
}

export const HolidayCalendarPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const [holidays, setHolidays] = useState<SchoolHoliday[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'all' | 'table'>('upcoming');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('FESTIVAL');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formRoles, setFormRoles] = useState<string[]>(['STUDENT', 'TEACHER']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch holidays from API
  const fetchHolidays = async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/api/events');
      const data = res.data?.data || res.data || [];
      setHolidays(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to load holidays:', err);
      toast.error('Failed to load school holidays');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  // Populate AP State official holidays
  const handlePopulateDefaults = async () => {
    if (!window.confirm('Do you want to automatically load Andhra Pradesh official school holidays for the academic year?')) return;
    const toastId = toast.loading('Populating official school holidays...');
    try {
      await api.post('/api/events/populate-defaults', { year: 2026 });
      toast.success('Official school holidays loaded successfully!', { id: toastId, icon: '🎉' });
      fetchHolidays();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to populate holidays', { id: toastId });
    }
  };

  // Open Create Modal
  const openCreateModal = () => {
    setEditingId(null);
    setFormTitle('');
    setFormCategory('FESTIVAL');
    setFormStartDate(new Date().toISOString().split('T')[0]);
    setFormEndDate('');
    setFormDescription('');
    setFormRoles(['STUDENT', 'TEACHER']);
    setShowModal(true);
  };

  // Open Edit Modal
  const openEditModal = (h: SchoolHoliday) => {
    setEditingId(h.id);
    setFormTitle(h.title);
    
    // Extract category from description (e.g., HOLIDAY:FESTIVAL)
    let cat = 'FESTIVAL';
    let desc = h.description || '';
    if (desc.startsWith('HOLIDAY:')) {
      const parts = desc.split(' - ');
      cat = parts[0].replace('HOLIDAY:', '').trim();
      desc = parts.slice(1).join(' - ');
    }
    setFormCategory(cat);
    setFormDescription(desc);

    setFormStartDate(h.startDate ? new Date(h.startDate).toISOString().split('T')[0] : '');
    setFormEndDate(h.endDate ? new Date(h.endDate).toISOString().split('T')[0] : '');
    setFormRoles(h.targetRoles ? h.targetRoles.split(',') : ['STUDENT', 'TEACHER']);
    setShowModal(true);
  };

  // Save Holiday Form Submit
  const handleSaveHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return toast.error('Please enter a holiday title');
    if (!formStartDate) return toast.error('Please select a start date');

    setIsSubmitting(true);
    const toastId = toast.loading(editingId ? 'Updating holiday...' : 'Adding holiday...');
    try {
      const fullDescription = `HOLIDAY:${formCategory}${formDescription.trim() ? ` - ${formDescription.trim()}` : ''}`;
      const payload = {
        title: formTitle.trim(),
        description: fullDescription,
        startDate: formStartDate,
        endDate: formEndDate || formStartDate,
        allDay: true,
        targetRoles: formRoles
      };

      if (editingId) {
        await api.put(`/api/events/${editingId}`, payload);
        toast.success('Holiday updated successfully!', { id: toastId });
      } else {
        await api.post('/api/events', payload);
        toast.success('New holiday added successfully!', { id: toastId, icon: '🎉' });
      }
      setShowModal(false);
      fetchHolidays();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save holiday', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Holiday
  const handleDeleteHoliday = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete the holiday "${title}"?`)) return;
    const toastId = toast.loading('Deleting holiday...');
    try {
      await api.delete(`/api/events/${id}`);
      toast.success('Holiday deleted successfully!', { id: toastId });
      setHolidays(prev => prev.filter(h => h.id !== id));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete holiday', { id: toastId });
    }
  };

  // Helper to get category tag from description
  const getCategory = (h: SchoolHoliday) => {
    if (h.description?.includes('NATIONAL')) return 'NATIONAL';
    if (h.description?.includes('VACATION')) return 'VACATION';
    if (h.description?.includes('EMERGENCY')) return 'EMERGENCY';
    if (h.description?.includes('LOCAL')) return 'LOCAL';
    return 'FESTIVAL';
  };

  // Helper: Format Date Span
  const formatDateSpan = (start: string, end?: string | null) => {
    const s = new Date(start);
    const startStr = s.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const dayOfWeek = s.toLocaleDateString('en-IN', { weekday: 'long' });

    if (!end || end === start) {
      return { spanText: startStr, dayText: dayOfWeek, totalDays: 1 };
    }

    const e = new Date(end);
    const endStr = e.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const diffTime = Math.abs(e.getTime() - s.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    return {
      spanText: `${startStr} — ${endStr}`,
      dayText: `${totalDays} Days Break`,
      totalDays
    };
  };

  // Filtered holidays
  const filteredHolidays = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    let list = [...holidays].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(h => h.title.toLowerCase().includes(q) || (h.description || '').toLowerCase().includes(q));
    }

    // Category filter
    if (selectedCategory !== 'all') {
      list = list.filter(h => getCategory(h) === selectedCategory);
    }

    // Month filter
    if (selectedMonth !== 'all') {
      const monthNum = parseInt(selectedMonth, 10);
      list = list.filter(h => new Date(h.startDate).getMonth() === monthNum);
    }

    // Tab Filter
    if (activeTab === 'upcoming') {
      list = list.filter(h => {
        const d = new Date(h.endDate || h.startDate);
        return d >= now;
      });
    }

    return list;
  }, [holidays, searchQuery, selectedCategory, selectedMonth, activeTab]);

  // Next Upcoming Holiday for Hero Badge
  const nextHoliday = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const upcoming = holidays
      .filter(h => new Date(h.endDate || h.startDate) >= now)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    if (upcoming.length === 0) return null;

    const next = upcoming[0];
    const startDate = new Date(next.startDate);
    const diffDays = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      holiday: next,
      daysLeft: diffDays
    };
  }, [holidays]);

  // Total Vacation Days
  const totalVacationDays = useMemo(() => {
    return holidays.reduce((sum, h) => {
      const { totalDays } = formatDateSpan(h.startDate, h.endDate);
      return sum + totalDays;
    }, 0);
  }, [holidays]);

  // PDF Export
  const handleDownloadPDF = async () => {
    const toastId = toast.loading('Generating official holiday PDF...');
    try {
      const { default: jsPDF } = await import('jspdf');
      const autoTableModule: any = await import('jspdf-autotable');
      const autoTable = autoTableModule.default || autoTableModule;

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();

      // Official Header
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('SRI VENKATESWARA JY HIGH SCHOOL', pageWidth / 2, 14, { align: 'center' });

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta, Srikakulam Dist. • Contact: 9441104648', pageWidth / 2, 20, { align: 'center' });

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(79, 70, 229);
      doc.text('ACADEMIC YEAR 2026 - 2027 OFFICIAL HOLIDAY CALENDAR', pageWidth / 2, 28, { align: 'center' });

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(14, 32, pageWidth - 14, 32);

      const tableRows = holidays.map((h, idx) => {
        const { spanText, dayText, totalDays } = formatDateSpan(h.startDate, h.endDate);
        const cat = getCategory(h);
        return [
          idx + 1,
          spanText,
          dayText,
          h.title,
          cat === 'NATIONAL' ? 'National Holiday' : cat === 'VACATION' ? 'Vacation Break' : 'Festival Holiday',
          `${totalDays} Day(s)`
        ];
      });

      autoTable(doc, {
        startY: 36,
        head: [['#', 'Date / Duration', 'Day of Week', 'Occasion / Holiday Name', 'Category', 'Days']],
        body: tableRows,
        theme: 'grid',
        headStyles: {
          fillColor: [30, 41, 59],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center'
        },
        styles: {
          font: 'helvetica',
          fontSize: 8.5,
          cellPadding: 2.5,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 38 },
          2: { cellWidth: 28 },
          3: { cellWidth: 60, fontStyle: 'bold' },
          4: { cellWidth: 32 },
          5: { cellWidth: 18, halign: 'center' }
        },
        didDrawPage: (data: any) => {
          const pageStr = `Page ${data.pageNumber} of ${doc.getNumberOfPages()}`;
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184);
          doc.text(pageStr, pageWidth - 14, doc.internal.pageSize.getHeight() - 8, { align: 'right' });
          doc.text('Sri Venkateswara JY High School • Official Academic Schedule', 14, doc.internal.pageSize.getHeight() - 8);
        }
      });

      doc.save(`JY_School_Holiday_Calendar_2026_2027.pdf`);
      toast.success('Holiday calendar downloaded successfully!', { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to export PDF', { id: toastId });
    }
  };

  const CATEGORY_TAGS = {
    NATIONAL: { label: 'National Holiday', telugu: 'జాతీయ దినోత్సవం', bg: 'bg-amber-100 text-amber-900 border-amber-300', dot: 'bg-amber-500' },
    FESTIVAL: { label: 'Festival Holiday', telugu: 'పండుగ సెలవు', bg: 'bg-purple-100 text-purple-900 border-purple-300', dot: 'bg-purple-500' },
    VACATION: { label: 'Vacation Break', telugu: 'వేసవి / దసరా సెలవులు', bg: 'bg-emerald-100 text-emerald-900 border-emerald-300', dot: 'bg-emerald-500' },
    EMERGENCY: { label: 'Emergency / Order', telugu: 'ప్రభుత్వ ఆదేశం / వర్షం', bg: 'bg-rose-100 text-rose-900 border-rose-300', dot: 'bg-rose-500' },
    LOCAL: { label: 'Local Break', telugu: 'స్థానిక సెలవు', bg: 'bg-blue-100 text-blue-900 border-blue-300', dot: 'bg-blue-500' },
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] text-slate-800 font-sans print:bg-white print:p-0 print:m-0">
      
      {/* ============================================================ */}
      {/* ── 1. ULTRA-PREMIUM COLORFUL HERO BANNER (HIDDEN IN PRINT) ── */}
      {/* ============================================================ */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0F172A] via-[#1E1B4B] to-[#312E81] text-white p-5 sm:p-7 shadow-xl border-b border-indigo-950 print:hidden">
        
        {/* Ambient lighting bubbles */}
        <div className="absolute -top-12 right-1/4 w-80 h-80 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 right-10 w-96 h-96 rounded-full bg-fuchsia-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -left-12 top-0 w-64 h-64 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto space-y-4">
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Title & Navigation */}
            <div className="flex items-center gap-3.5">
              <Link
                to="/attendance"
                className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all hover:scale-105 border border-white/10 shadow-sm"
                title="Back to Attendance Dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                    <span>School Holiday & Event Calendar</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black shadow-sm uppercase tracking-wider">
                      2026 – 2027
                    </span>
                  </h1>
                </div>
                <p className="text-xs sm:text-sm text-indigo-200/90 font-medium mt-0.5">
                  పాఠశాల అధికారిక సెలవులు, పండుగలు & వెకేషన్ క్యాలెండర్ నిర్వహణ
                </p>
              </div>
            </div>

            {/* Quick Master Actions */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {isAdmin && (
                <>
                  <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add Holiday</span>
                  </button>

                  <button
                    onClick={handlePopulateDefaults}
                    className="flex items-center gap-2 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-amber-300 border border-amber-300/30 rounded-xl text-xs font-bold backdrop-blur-md hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-sm"
                    title="Populate Andhra Pradesh Official School Holidays"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>⚡ Auto Populate AP Holidays</span>
                  </button>
                </>
              )}

              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold backdrop-blur-md hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-sm"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>Print List</span>
              </button>

              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold backdrop-blur-md hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-sm"
              >
                <Download className="w-4 h-4 text-rose-400" />
                <span>PDF Export</span>
              </button>
            </div>

          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            
            {/* Stat 1: Total Holidays */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0 border border-blue-400/20">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider">Total Holidays</p>
                <p className="text-lg font-black text-white">{holidays.length} Days</p>
              </div>
            </div>

            {/* Stat 2: Upcoming Next Holiday Countdown */}
            <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-md rounded-2xl p-3 border border-amber-400/30 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/30 text-amber-300 flex items-center justify-center shrink-0 border border-amber-400/40">
                <Clock className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-amber-200 uppercase tracking-wider">
                  {nextHoliday ? (nextHoliday.daysLeft === 0 ? 'Holiday Today!' : `In ${nextHoliday.daysLeft} Days`) : 'Next Holiday'}
                </p>
                <p className="text-xs font-black text-white truncate" title={nextHoliday?.holiday.title}>
                  {nextHoliday ? nextHoliday.holiday.title : 'None Scheduled'}
                </p>
              </div>
            </div>

            {/* Stat 3: Total Vacation & Break Days */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-400/20">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider">Total Break Days</p>
                <p className="text-lg font-black text-white">{totalVacationDays} Days</p>
              </div>
            </div>

            {/* Stat 4: Academic Year */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0 border border-purple-400/20">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider">Academic Session</p>
                <p className="text-lg font-black text-white">2026 – 2027</p>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* ============================================================ */}
      {/* ── 2. FILTER & CONTROLS TOOLBAR (HIDDEN IN PRINT) ──          */}
      {/* ============================================================ */}
      <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 py-4 space-y-4 print:p-0 print:m-0 print:max-w-none">
        
        <div className="bg-white rounded-3xl border border-slate-200/90 p-4 shadow-sm space-y-3.5 print:hidden">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            
            {/* View Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80">
              {[
                { id: 'upcoming', label: 'Upcoming Holidays (రాబోయేవి)', icon: Clock },
                { id: 'all', label: 'All Holidays (మొత్తం సెలవులు)', icon: CalendarIcon },
                { id: 'table', label: 'Official Table View', icon: Layers },
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white text-indigo-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search holiday name, festival..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
              />
            </div>

          </div>

          {/* Category Filter Pills & Month Selector */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
            
            {/* Category Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 mr-1">
                Category:
              </span>
              {[
                { id: 'all', label: 'All Categories' },
                { id: 'FESTIVAL', label: '🪔 Festivals' },
                { id: 'NATIONAL', label: '🏛️ National' },
                { id: 'VACATION', label: '☀️ Vacations' },
                { id: 'EMERGENCY', label: '🚨 Emergency/Orders' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    selectedCategory === cat.id
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Month Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Month:
              </span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="all">Full Year (All Months)</option>
                {[
                  'January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'
                ].map((m, idx) => (
                  <option key={idx} value={String(idx)}>{m}</option>
                ))}
              </select>
            </div>

          </div>

        </div>

        {/* ============================================================ */}
        {/* ── 3. HOLIDAYS CONTENT (CARDS & TABLE) ──                     */}
        {/* ============================================================ */}
        {loading ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 shadow-sm">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-500">Loading school calendar...</p>
          </div>
        ) : filteredHolidays.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200 shadow-sm space-y-3">
            <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto">
              <CalendarIcon className="w-8 h-8" />
            </div>
            <h3 className="text-base font-black text-slate-900">No Holidays Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              సెలవుల వివరాలు ఏవీ కనుగొనబడలేదు. అడ్మిన్ అయితే పైన ఉన్న <strong>"⚡ Auto Populate AP Holidays"</strong> బటన్ క్లిక్ చేసి రాష్ట్ర అధికారిక క్యాలెండర్‌ను లోడ్ చేసుకోవచ్చు.
            </p>
            {isAdmin && (
              <button
                onClick={handlePopulateDefaults}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl text-xs font-black shadow-md hover:scale-105 transition-all cursor-pointer"
              >
                + Auto Populate AP State Holidays
              </button>
            )}
          </div>
        ) : activeTab === 'table' ? (
          /* ============================================================ */
          /* ── TABLE VIEW (OFFICIAL ACADEMIC REGISTRY) ──                 */
          /* ============================================================ */
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md p-6 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-slate-300">
                    <th className="py-3 px-4 text-xs font-black text-center w-12 border border-slate-300">#</th>
                    <th className="py-3 px-4 text-xs font-black border border-slate-300">Date / Duration</th>
                    <th className="py-3 px-4 text-xs font-black border border-slate-300">Day</th>
                    <th className="py-3 px-4 text-xs font-black border border-slate-300">Holiday / Festival Name</th>
                    <th className="py-3 px-4 text-xs font-black border border-slate-300 text-center">Category</th>
                    <th className="py-3 px-4 text-xs font-black border border-slate-300 text-center">Break</th>
                    {isAdmin && <th className="py-3 px-4 text-xs font-black border border-slate-300 text-center">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredHolidays.map((h, idx) => {
                    const { spanText, dayText, totalDays } = formatDateSpan(h.startDate, h.endDate);
                    const cat = getCategory(h);
                    const tag = CATEGORY_TAGS[cat as keyof typeof CATEGORY_TAGS] || CATEGORY_TAGS.FESTIVAL;

                    return (
                      <tr key={h.id} className="hover:bg-indigo-50/40 transition-colors">
                        <td className="py-3 px-4 text-xs font-bold text-center border border-slate-300 text-slate-500 font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 text-xs font-black border border-slate-300 text-slate-900 whitespace-nowrap">
                          {spanText}
                        </td>
                        <td className="py-3 px-4 text-xs font-medium border border-slate-300 text-slate-600 whitespace-nowrap">
                          {dayText}
                        </td>
                        <td className="py-3 px-4 text-xs font-black border border-slate-300 text-indigo-950">
                          {h.title}
                          {h.description && !h.description.startsWith('HOLIDAY:') && (
                            <span className="block text-[11px] font-normal text-slate-400">{h.description}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs border border-slate-300 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black border ${tag.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${tag.dot}`} />
                            {tag.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs font-black border border-slate-300 text-center text-slate-700">
                          {totalDays} Day{totalDays > 1 ? 's' : ''}
                        </td>
                        {isAdmin && (
                          <td className="py-3 px-4 text-xs border border-slate-300 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => openEditModal(h)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                                title="Edit Holiday"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteHoliday(h.id, h.title)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Delete Holiday"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ============================================================ */
          /* ── CARDS GRID VIEW (ULTRA MODERN & COLORFUL) ──               */
          /* ============================================================ */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredHolidays.map((h) => {
              const { spanText, dayText, totalDays } = formatDateSpan(h.startDate, h.endDate);
              const cat = getCategory(h);
              const tag = CATEGORY_TAGS[cat as keyof typeof CATEGORY_TAGS] || CATEGORY_TAGS.FESTIVAL;
              const dateObj = new Date(h.startDate);
              const monthStr = dateObj.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase();
              const dayNum = dateObj.getDate();

              return (
                <div
                  key={h.id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-lg transition-all p-4 flex flex-col justify-between group hover:border-indigo-300 relative overflow-hidden"
                >
                  {/* Category Accent top border */}
                  <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                    cat === 'NATIONAL' ? 'bg-amber-500' :
                    cat === 'VACATION' ? 'bg-emerald-500' :
                    cat === 'EMERGENCY' ? 'bg-rose-500' : 'bg-purple-600'
                  }`} />

                  <div>
                    {/* Top Date Ribbon & Category Badge */}
                    <div className="flex items-start justify-between gap-3 mb-3 pt-1">
                      <div className="flex items-center gap-3">
                        {/* Calendar Icon Tile */}
                        <div className="w-12 h-14 rounded-2xl bg-gradient-to-b from-indigo-50 to-indigo-100/70 border border-indigo-200 flex flex-col items-center justify-center shrink-0 shadow-2xs">
                          <span className="text-[9px] font-black text-indigo-700 uppercase tracking-wider">{monthStr}</span>
                          <span className="text-lg font-black text-slate-900 leading-none">{dayNum}</span>
                        </div>

                        <div>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border ${tag.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${tag.dot}`} />
                            <span>{tag.label}</span>
                          </span>
                          <p className="text-xs font-bold text-slate-500 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{dayText}</span>
                          </p>
                        </div>
                      </div>

                      {isAdmin && (
                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditModal(h)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteHoliday(h.id, h.title)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Holiday Title & Description */}
                    <h4 className="text-base font-black text-slate-900 group-hover:text-indigo-700 transition-colors">
                      {h.title}
                    </h4>

                    {h.description && !h.description.startsWith('HOLIDAY:') && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {h.description}
                      </p>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-400">
                      Duration: <strong className="text-slate-800">{totalDays} Day{totalDays > 1 ? 's' : ''}</strong>
                    </span>
                    <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                      {spanText}
                    </span>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ============================================================ */}
      {/* ── PRINT-ONLY OFFICIAL FORMAT (WINDOW.PRINT) ──               */}
      {/* ============================================================ */}
      <div className="hidden print:block p-8 bg-white text-slate-900">
        
        {/* Header */}
        <div className="text-center pb-4 mb-4 border-b-2 border-slate-900 space-y-1">
          <h2 className="text-2xl font-black uppercase tracking-wide">
            SRI VENKATESWARA JY HIGH SCHOOL
          </h2>
          <p className="text-xs text-slate-600">
            Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta, Srikakulam Dist. • Contact: 9441104648
          </p>
          <h3 className="text-base font-black text-indigo-900 uppercase pt-2">
            ACADEMIC YEAR 2026 – 2027 OFFICIAL HOLIDAY CALENDAR
          </h3>
        </div>

        {/* Printable Table */}
        <table className="w-full text-left border-collapse border border-slate-400 text-xs">
          <thead>
            <tr className="bg-slate-100 border border-slate-400">
              <th className="p-2 border border-slate-400 text-center w-10">S.No</th>
              <th className="p-2 border border-slate-400">Date / Duration</th>
              <th className="p-2 border border-slate-400">Day</th>
              <th className="p-2 border border-slate-400">Holiday / Festival Occasion</th>
              <th className="p-2 border border-slate-400 text-center">Category</th>
              <th className="p-2 border border-slate-400 text-center w-16">Total Days</th>
            </tr>
          </thead>
          <tbody>
            {holidays.map((h, i) => {
              const { spanText, dayText, totalDays } = formatDateSpan(h.startDate, h.endDate);
              const cat = getCategory(h);
              return (
                <tr key={h.id} className="border border-slate-400">
                  <td className="p-2 border border-slate-400 text-center">{i + 1}</td>
                  <td className="p-2 border border-slate-400 font-bold">{spanText}</td>
                  <td className="p-2 border border-slate-400">{dayText}</td>
                  <td className="p-2 border border-slate-400 font-bold">{h.title}</td>
                  <td className="p-2 border border-slate-400 text-center">
                    {cat === 'NATIONAL' ? 'National Holiday' : cat === 'VACATION' ? 'Vacation Break' : 'Festival'}
                  </td>
                  <td className="p-2 border border-slate-400 text-center font-bold">{totalDays}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Signature Line */}
        <div className="pt-16 mt-8 flex items-center justify-between text-xs font-bold border-t border-slate-300">
          <div>
            <div className="w-36 border-b border-slate-900 mb-1" />
            <p>Academic Coordinator</p>
          </div>
          <div className="w-24 h-24 border border-dashed border-slate-400 rounded-full flex items-center justify-center text-[10px] text-slate-400">
            School Seal
          </div>
          <div className="text-right">
            <div className="w-36 border-b border-slate-900 mb-1 ml-auto" />
            <p>Principal / Headmaster</p>
            <p className="text-[10px] font-normal text-slate-500">Sri Venkateswara JY High School</p>
          </div>
        </div>

      </div>

      {/* ============================================================ */}
      {/* ── CREATE / EDIT HOLIDAY MODAL ──                            */}
      {/* ============================================================ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 print:hidden">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 animate-scale-up">
            
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {editingId ? 'Edit Holiday (సెలవు వివరాలు మార్చండి)' : 'Add New Holiday (కొత్త సెలవును చేర్చండి)'}
                  </h3>
                  <p className="text-xs text-slate-400">Official academic calendar entry</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHoliday} className="space-y-4 pt-4">
              
              {/* Title */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  Holiday / Occasion Title (సెలవు పేరు) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Makara Sankranti, Independence Day..."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  Category (వర్గం) *
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="FESTIVAL">🪔 Festival Holiday (పండుగ సెలవు)</option>
                  <option value="NATIONAL">🏛️ National Holiday (జాతీయ సెలవు)</option>
                  <option value="VACATION">☀️ Vacation Break (వేసవి / దసరా సెలవులు)</option>
                  <option value="EMERGENCY">🚨 Emergency / Govt Order (వర్షం / ప్రభుత్వ ఉత్తర్వు)</option>
                  <option value="LOCAL">🏫 Local / Institutional Break (పాఠశాల సెలవు)</option>
                </select>
              </div>

              {/* Date Pickers (Start & End) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                    Start Date (ప్రారంభ తేదీ) *
                  </label>
                  <input
                    type="date"
                    required
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                    End Date (ముగింపు తేదీ)
                  </label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-400">ఒక రోజు మాత్రమే అయితే ఖాళీగా ఉంచండి</span>
                </div>
              </div>

              {/* Optional Description */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  Description / Remarks (వివరాలు / సూచనలు)
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional details or instructions..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl text-xs font-black shadow-md hover:scale-105 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingId ? 'Update Holiday' : 'Add Holiday'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default HolidayCalendarPage;

