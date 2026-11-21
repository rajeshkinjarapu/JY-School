import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import { formatExamOptionLabel } from '../../utils/formatters';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import {
  Shield, Lock, CheckCircle2, Edit3, XCircle, ChevronDown, Check, Minus,
  LayoutGrid, Table, Search, AlertCircle, RefreshCw, Copy, ExternalLink,
  GraduationCap, Clock, Share2, ArrowRight, BookOpen, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const ExamStatusTab: React.FC<{ exams: any[] }> = ({ exams }) => {
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [examData, setExamData] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');

  // View & Filter states
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'draft' | 'completed'>('all');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fetch status data
  const fetchLatestExams = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res: any = await api.get('/api/exams/status/all');
      const data = res.data.data || res.data || [];
      setExamData(data);
      if (data.length > 0 && !selectedExamId) {
        setSelectedExamId(data[0].id);
      }
      if (isManualRefresh) {
        toast.success('Exam status refreshed successfully');
      }
    } catch (error) {
      console.error('Failed to load exam status', error);
      toast.error('Failed to load exam status');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLatestExams();
  }, [exams]);

  const activeExamData = useMemo(() => {
    return examData.find(e => e.id === selectedExamId) || null;
  }, [examData, selectedExamId]);

  // Derived subjects across all classes in active exam
  const allSubjectNames: string[] = useMemo(() => {
    if (!activeExamData?.classes) return [];
    const names: string[] = [];
    for (const cls of activeExamData.classes) {
      const subjects = cls.subjectStats?.totalSubjects || [];
      for (const sub of subjects) {
        if (!sub.name) continue;
        const normalizedName = sub.name.trim().toUpperCase();
        if (!names.includes(normalizedName)) {
          names.push(normalizedName);
        }
      }
    }
    return names;
  }, [activeExamData]);

  // Frozen classes parsing
  const frozenClasses: string[] = useMemo(() => {
    if (!activeExamData?.frozenClasses) return [];
    try {
      return typeof activeExamData.frozenClasses === 'string'
        ? JSON.parse(activeExamData.frozenClasses)
        : activeExamData.frozenClasses;
    } catch {
      return [];
    }
  }, [activeExamData]);

  const classesWithMarks = activeExamData?.classesWithMarks || [];
  const isPublished = activeExamData?.admitCardSettings?.progressCardPublished === true;

  // Process and sort classes
  const processedClasses = useMemo(() => {
    if (!activeExamData?.classes) return [];

    return activeExamData.classes.map((cls: any) => {
      const isExplicitlyFrozen = frozenClasses.includes(cls.id);
      const hasMarks = classesWithMarks.includes(cls.id);
      const stats = cls.subjectStats || {
        totalSubjects: [],
        enteredSubjects: [],
        pendingSubjects: [],
        progress: 0
      };

      const totalUnique = (stats.totalSubjects || []).length;
      const enteredUnique = (stats.enteredSubjects || []).length;
      const pendingUnique = (stats.pendingSubjects || []).length;
      const progress = totalUnique === 0 ? 0 : Math.round((enteredUnique / totalUnique) * 100);

      let statusType: 'completed' | 'draft' | 'pending' = 'pending';
      let statusLabel = 'Pending';
      let badgeColor = 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/40';

      if (isExplicitlyFrozen) {
        statusType = 'completed';
        statusLabel = 'Frozen';
        badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40';
      } else if (progress === 100) {
        statusType = 'completed';
        statusLabel = 'Completed';
        badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40';
      } else if (enteredUnique > 0 || hasMarks) {
        statusType = 'draft';
        statusLabel = `In Progress (${enteredUnique}/${totalUnique})`;
        badgeColor = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40';
      }

      const enteredSet = new Set<string>((stats.enteredSubjects || []).map((s: any) => s.name?.trim().toUpperCase()));
      const classSubjectNames = new Set<string>((stats.totalSubjects || []).map((s: any) => s.name?.trim().toUpperCase()));

      return {
        ...cls,
        isExplicitlyFrozen,
        hasMarks,
        statusType,
        statusLabel,
        badgeColor,
        totalUnique,
        enteredUnique,
        pendingUnique,
        progress,
        enteredSet,
        classSubjectNames,
        pendingSubjectsList: stats.pendingSubjects || [],
        enteredSubjectsList: stats.enteredSubjects || [],
      };
    }).sort((a: any, b: any) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      if (nameA.length !== nameB.length) return nameA.length - nameB.length;
      if (nameA !== nameB) return nameA.localeCompare(nameB);
      const secA = a.section?.toLowerCase() || '';
      const secB = b.section?.toLowerCase() || '';
      return secA.localeCompare(secB);
    });
  }, [activeExamData, frozenClasses, classesWithMarks]);

  // Filtered classes by search, status filter, and class filter
  const filteredClasses = useMemo(() => {
    return processedClasses.filter((cls: any) => {
      // Status filter
      if (statusFilter === 'pending' && cls.statusType !== 'pending') return false;
      if (statusFilter === 'draft' && cls.statusType !== 'draft') return false;
      if (statusFilter === 'completed' && cls.statusType !== 'completed') return false;

      // Class filter dropdown
      if (selectedClassFilter !== 'all' && cls.id !== selectedClassFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const fullName = `${cls.name} ${cls.section || ''}`.toLowerCase();
        const matchesClass = fullName.includes(query);
        const matchesPendingSub = (cls.pendingSubjectsList || []).some((s: any) =>
          (s.name || '').toLowerCase().includes(query)
        );
        if (!matchesClass && !matchesPendingSub) return false;
      }

      return true;
    });
  }, [processedClasses, statusFilter, selectedClassFilter, searchQuery]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = processedClasses.length;
    const completed = processedClasses.filter(c => c.statusType === 'completed').length;
    const draft = processedClasses.filter(c => c.statusType === 'draft').length;
    const pending = processedClasses.filter(c => c.statusType === 'pending').length;

    let totalSubjectEntries = 0;
    let completedSubjectEntries = 0;
    let pendingSubjectEntries = 0;

    processedClasses.forEach(c => {
      totalSubjectEntries += c.totalUnique;
      completedSubjectEntries += c.enteredUnique;
      pendingSubjectEntries += c.pendingUnique;
    });

    const overallPercentage = totalSubjectEntries > 0
      ? Math.round((completedSubjectEntries / totalSubjectEntries) * 100)
      : 0;

    return {
      total,
      completed,
      draft,
      pending,
      totalSubjectEntries,
      completedSubjectEntries,
      pendingSubjectEntries,
      overallPercentage
    };
  }, [processedClasses]);

  // Navigate to Marks Entry for a specific class
  const handleGoToMarksEntry = (classId?: string) => {
    setSearchParams({ tab: 'written-exam' });
    navigate(`/exams?tab=written-exam`);
  };

  // Copy full pending report to clipboard for WhatsApp/Notices
  const handleCopyPendingReport = () => {
    if (!activeExamData || processedClasses.length === 0) {
      toast.error('No exam data available to copy');
      return;
    }

    const examTitle = formatExamOptionLabel(activeExamData.name) + (activeExamData.term ? ` (${activeExamData.term})` : '');
    const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    let text = `📢 *JY SCHOOL - EXAM MARKS PENDING STATUS*\n`;
    text += `*Exam:* ${examTitle}\n`;
    text += `*Date:* ${dateStr}\n`;
    text += `*Summary:* Total: ${metrics.total} Classes | Pending: ${metrics.pending} | Draft: ${metrics.draft} | Done: ${metrics.completed}\n\n`;

    const pendingClasses = processedClasses.filter(c => c.pendingUnique > 0);

    if (pendingClasses.length === 0) {
      text += `🎉 *All classes have completed marks entry! Zero pending subjects.*`;
    } else {
      text += `🔴 *CLASS-WISE PENDING MARKS LIST:*\n`;
      pendingClasses.forEach(c => {
        const subNames = c.pendingSubjectsList.map((s: any) => s.name).join(', ');
        text += `• *${c.name} - ${c.section}* (${c.pendingUnique} Pending): ${subNames}\n`;
      });
    }

    navigator.clipboard.writeText(text);
    toast.success('Pending status copied! Ready to paste into WhatsApp.', {
      duration: 4000,
      icon: '📋'
    });
  };

  // Copy single class pending subjects
  const handleCopyClassPending = (cls: any) => {
    if (cls.pendingUnique === 0) {
      toast.success(`${cls.name}-${cls.section} has no pending subjects!`);
      return;
    }
    const subNames = cls.pendingSubjectsList.map((s: any) => s.name).join(', ');
    const text = `*${cls.name} - ${cls.section} Pending Marks:* ${subNames}`;
    navigator.clipboard.writeText(text);
    toast.success(`Copied pending subjects for ${cls.name}-${cls.section}`);
  };

  if (loading) return <LoadingSpinner size="lg" className="h-[50vh]" />;

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* ══ 1. TOP HEADER & EXAM SELECTION ══ */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex-1 relative">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-indigo-500" /> Select Examination
          </label>
          <div className="relative">
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full appearance-none bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-black text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm cursor-pointer pr-10"
            >
              <option value="" disabled>Select an Exam...</option>
              {examData.map(e => (
                <option key={e.id} value={e.id} className="text-xs font-semibold py-1">
                  {formatExamOptionLabel(e.name)}{e.term?.trim() ? ` (${e.term.trim()})` : ''}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-slate-400">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Action Controls: Refresh, WhatsApp Copy & View Switcher */}
        <div className="flex items-center gap-2.5 self-end md:self-auto pt-2 md:pt-4">
          <button
            onClick={() => fetchLatestExams(true)}
            disabled={refreshing}
            className="p-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
            title="Refresh Status"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          <button
            onClick={handleCopyPendingReport}
            className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl text-xs font-black shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer whitespace-nowrap"
            title="Copy pending list formatted for WhatsApp"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">WhatsApp</span> Pending Report
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Class Cards View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Class Cards</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Matrix Table View"
            >
              <Table className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Matrix Grid</span>
            </button>
          </div>
        </div>
      </div>

      {activeExamData ? (
        <>
          {/* ══ 2. EXECUTIVE KPI SUMMARY METRICS ══ */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {/* Total Classes */}
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-4 sm:p-5 rounded-3xl shadow-lg shadow-indigo-500/15 border border-indigo-400/20">
              <div className="flex justify-between items-start">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-indigo-100">Total Classes</span>
                <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
                  <GraduationCap className="w-4 h-4 text-white" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">{metrics.total}</p>
              <p className="text-[10px] sm:text-xs font-semibold text-indigo-100/90 mt-1">
                {metrics.totalSubjectEntries} Total Subject Entries
              </p>
            </div>

            {/* Completed */}
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-4 sm:p-5 rounded-3xl shadow-lg shadow-emerald-500/15 border border-emerald-400/20">
              <div className="flex justify-between items-start">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-emerald-100">Completed</span>
                <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">{metrics.completed}</p>
              <p className="text-[10px] sm:text-xs font-semibold text-emerald-100/90 mt-1">
                {metrics.completedSubjectEntries} Subjects Finished
              </p>
            </div>

            {/* In Progress (Draft) */}
            <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-500 text-white p-4 sm:p-5 rounded-3xl shadow-lg shadow-amber-500/15 border border-amber-400/20">
              <div className="flex justify-between items-start">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-100">In Progress (Draft)</span>
                <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
                  <Clock className="w-4 h-4 text-white" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">{metrics.draft}</p>
              <p className="text-[10px] sm:text-xs font-semibold text-amber-100/90 mt-1">
                Partially Entered Classes
              </p>
            </div>

            {/* Pending Classes */}
            <div className="relative overflow-hidden bg-gradient-to-br from-rose-500 to-pink-600 text-white p-4 sm:p-5 rounded-3xl shadow-lg shadow-rose-500/15 border border-rose-400/20">
              <div className="flex justify-between items-start">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-rose-100">Pending Classes</span>
                <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
                  <AlertCircle className="w-4 h-4 text-white" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">{metrics.pending}</p>
              <p className="text-[10px] sm:text-xs font-semibold text-rose-100/90 mt-1">
                {metrics.pendingSubjectEntries} Subjects Awaiting Marks
              </p>
            </div>
          </div>

          {/* Overall Exam Completion Bar */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black shrink-0">
                {metrics.overallPercentage}%
              </div>
              <div>
                <p className="text-xs font-black text-slate-800 dark:text-slate-100">
                  Overall Marks Completion Rate
                </p>
                <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                  {metrics.completedSubjectEntries} of {metrics.totalSubjectEntries} total subject entries entered
                </p>
              </div>
            </div>

            <div className="w-full sm:max-w-md bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200/50 dark:border-slate-700/50">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-emerald-500 to-teal-500 transition-all duration-700"
                style={{ width: `${metrics.overallPercentage}%` }}
              />
            </div>
          </div>

          {/* ══ 3. FILTERS & SEARCH CONTROLS ══ */}
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Status Tabs */}
              <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  All ({metrics.total})
                </button>
                <button
                  onClick={() => setStatusFilter('pending')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    statusFilter === 'pending'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  Pending Only ({metrics.pending})
                </button>
                <button
                  onClick={() => setStatusFilter('draft')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    statusFilter === 'draft'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  In Progress ({metrics.draft})
                </button>
                <button
                  onClick={() => setStatusFilter('completed')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    statusFilter === 'completed'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Completed ({metrics.completed})
                </button>
              </div>

              {/* Class Dropdown & Search Bar */}
              <div className="flex items-center gap-2 flex-1 md:max-w-md">
                <select
                  value={selectedClassFilter}
                  onChange={(e) => setSelectedClassFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer max-w-[140px] truncate"
                >
                  <option value="all">All Classes</option>
                  {processedClasses.map((cls: any) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} – {cls.section}
                    </option>
                  ))}
                </select>

                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search class or subject..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ══ 4. VIEW MODE 1: CLASS-WISE CARDS (EXPLICIT USER REQUIREMENT) ══ */}
          {viewMode === 'cards' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <p className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Showing {filteredClasses.length} of {processedClasses.length} Classes
                </p>
                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Pending subjects highlighted below
                </span>
              </div>

              {filteredClasses.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-500 mb-3">
                    <Shield className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-black text-slate-700 dark:text-slate-200">No Classes Match Your Filter</h4>
                  <p className="text-xs text-slate-400 font-semibold mt-1">Try switching the status filter or clearing your search.</p>
                  <button
                    onClick={() => {
                      setStatusFilter('all');
                      setSelectedClassFilter('all');
                      setSearchQuery('');
                    }}
                    className="mt-4 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300 rounded-xl text-xs font-bold transition-all"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredClasses.map((cls: any) => {
                    const isDone = cls.statusType === 'completed';
                    const hasPending = cls.pendingUnique > 0;

                    return (
                      <div
                        key={cls.id}
                        className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-lg transition-all duration-300 flex flex-col justify-between gap-4 group relative overflow-hidden"
                      >
                        {/* Status bar accent on left */}
                        <div
                          className={`absolute top-0 left-0 w-1.5 h-full ${
                            isDone
                              ? 'bg-emerald-500'
                              : cls.statusType === 'draft'
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                        />

                        {/* Top Card Row */}
                        <div>
                          <div className="flex items-start justify-between gap-2 pl-2">
                            <div>
                              <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-black bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/40">
                                {cls.name} – {cls.section}
                              </span>
                              <p className="text-[11px] font-bold text-slate-400 mt-1 pl-0.5">
                                {cls.totalUnique} Subjects Configured
                              </p>
                            </div>

                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border shadow-sm ${cls.badgeColor}`}>
                              {cls.isExplicitlyFrozen ? (
                                <><Lock className="w-3 h-3" /> Frozen</>
                              ) : isDone ? (
                                <><CheckCircle2 className="w-3 h-3" /> Done</>
                              ) : cls.statusType === 'draft' ? (
                                <><Edit3 className="w-3 h-3" /> Draft</>
                              ) : (
                                <><XCircle className="w-3 h-3" /> Pending</>
                              )}
                            </span>
                          </div>

                          {/* Progress Meter */}
                          <div className="mt-3.5 pl-2 space-y-1.5">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-extrabold text-slate-600 dark:text-slate-300">
                                {cls.enteredUnique} of {cls.totalUnique} Entered
                              </span>
                              <span className={`font-black ${isDone ? 'text-emerald-600' : 'text-slate-500'}`}>
                                {cls.progress}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isDone
                                    ? 'bg-emerald-500'
                                    : cls.progress > 0
                                    ? 'bg-indigo-500'
                                    : 'bg-rose-400'
                                }`}
                                style={{ width: `${Math.max(cls.progress, 5)}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Middle: Pending & Completed Subject Chips */}
                        <div className="space-y-3 pl-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                          {/* Pending Subjects Block */}
                          {hasPending ? (
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  Pending Marks ({cls.pendingUnique})
                                </span>
                                <button
                                  onClick={() => handleCopyClassPending(cls)}
                                  className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 flex items-center gap-0.5 cursor-pointer"
                                  title="Copy pending subjects for WhatsApp"
                                >
                                  <Copy className="w-3 h-3" /> Copy
                                </button>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {cls.pendingSubjectsList.map((sub: any) => (
                                  <span
                                    key={sub.id || sub.name}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/40 shadow-xs"
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                    {sub.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>All subjects marks entered successfully!</span>
                            </div>
                          )}

                          {/* Completed Subjects Preview (Collapsible / Compact) */}
                          {cls.enteredUnique > 0 && hasPending && (
                            <div>
                              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1.5 flex items-center gap-1">
                                <Check className="w-3 h-3" strokeWidth={3} />
                                Completed ({cls.enteredUnique})
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {cls.enteredSubjectsList.map((sub: any) => (
                                  <span
                                    key={sub.id || sub.name}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/30"
                                  >
                                    ✓ {sub.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Card Bottom Actions */}
                        <div className="pl-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                          <button
                            onClick={() => handleGoToMarksEntry(cls.id)}
                            className="flex-1 py-2.5 px-3 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-600 dark:hover:text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            <span>Enter Marks</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══ 5. VIEW MODE 2: MATRIX GRID VIEW (FULL MATRIX TABLE) ══ */}
          {viewMode === 'table' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden w-full">
              <div className="w-full overflow-x-auto">
                {filteredClasses.length === 0 ? (
                  <div className="p-10 flex flex-col items-center justify-center text-center">
                    <Shield className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-xs font-bold text-slate-500">No classes match current filter criteria.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse min-w-max">
                    <thead>
                      <tr className="bg-indigo-50/90 dark:bg-indigo-950/50">
                        {/* Sticky Class column */}
                        <th className="px-4 py-3.5 text-[11px] font-black uppercase tracking-wider text-indigo-800 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/40 whitespace-nowrap sticky left-0 bg-indigo-50 dark:bg-indigo-950 z-20 min-w-[140px] shadow-sm">
                          Class / Section
                        </th>

                        {/* Subject columns */}
                        {allSubjectNames.map(subName => (
                          <th key={subName} className="px-3 py-3 text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-center whitespace-nowrap min-w-[100px]">
                            {subName}
                          </th>
                        ))}

                        {/* Progress column */}
                        <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-center whitespace-nowrap min-w-[95px]">
                          Progress
                        </th>

                        {/* Status column */}
                        <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-center whitespace-nowrap min-w-[110px]">
                          Status
                        </th>

                        {/* Action column */}
                        <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-center whitespace-nowrap min-w-[110px]">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredClasses.map((cls: any, rowIdx: number) => {
                        const rowBg = rowIdx % 2 === 0
                          ? 'bg-white dark:bg-slate-900'
                          : 'bg-slate-50/60 dark:bg-slate-800/30';

                        return (
                          <tr key={cls.id} className={`${rowBg} hover:bg-indigo-50/40 dark:hover:bg-indigo-900/10 transition-colors`}>
                            {/* Sticky Class Name */}
                            <td className={`px-4 py-3 border border-slate-200 dark:border-slate-800 sticky left-0 z-10 ${rowBg} shadow-sm`}>
                              <div className="flex items-center gap-1.5">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-black bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/40 whitespace-nowrap">
                                  {cls.name} – {cls.section}
                                </span>
                              </div>
                            </td>

                            {/* Subject Cells */}
                            {allSubjectNames.map(subName => {
                              const applicable = cls.classSubjectNames.has(subName);
                              const entered = cls.enteredSet.has(subName);

                              if (!applicable) {
                                return (
                                  <td key={subName} className="px-3 py-3 border border-slate-200 dark:border-slate-800 text-center">
                                    <Minus className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 mx-auto" />
                                  </td>
                                );
                              }

                              return (
                                <td key={subName} className="px-3 py-3 border border-slate-200 dark:border-slate-800 text-center">
                                  {entered ? (
                                    <div className="flex flex-col items-center gap-0.5">
                                      <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto">
                                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 font-bold" strokeWidth={3} />
                                      </div>
                                      <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Done</span>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-center gap-0.5">
                                      <div className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center mx-auto">
                                        <XCircle className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                                      </div>
                                      <span className="text-[9px] font-black text-rose-500 dark:text-rose-400 uppercase tracking-wider">Pending</span>
                                    </div>
                                  )}
                                </td>
                              );
                            })}

                            {/* Progress Cell */}
                            <td className="px-4 py-3 border border-slate-200 dark:border-slate-800 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden mx-auto" style={{ maxWidth: 70 }}>
                                  <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                      width: `${cls.progress}%`,
                                      backgroundColor: cls.progress === 100 ? '#10b981' : cls.progress > 0 ? '#6366f1' : '#f43f5e'
                                    }}
                                  />
                                </div>
                                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400">
                                  {cls.enteredUnique}/{cls.totalUnique}
                                </span>
                              </div>
                            </td>

                            {/* Status Badge Cell */}
                            <td className="px-3 py-3 border border-slate-200 dark:border-slate-800 text-center">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wide border ${cls.badgeColor}`}>
                                {cls.isExplicitlyFrozen ? (
                                  <><Lock className="w-3 h-3" /> Frozen</>
                                ) : (isPublished && cls.hasMarks) ? (
                                  <><CheckCircle2 className="w-3 h-3" /> Published</>
                                ) : cls.statusType === 'completed' ? (
                                  <><CheckCircle2 className="w-3 h-3" /> Completed</>
                                ) : cls.hasMarks ? (
                                  <><Edit3 className="w-3 h-3" /> Draft</>
                                ) : (
                                  <><XCircle className="w-3 h-3" /> Pending</>
                                )}
                              </span>
                            </td>

                            {/* Action Cell */}
                            <td className="px-3 py-3 border border-slate-200 dark:border-slate-800 text-center">
                              <button
                                onClick={() => handleGoToMarksEntry(cls.id)}
                                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-600 dark:hover:text-white rounded-xl text-[11px] font-black transition-all cursor-pointer inline-flex items-center gap-1"
                              >
                                Enter Marks
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ══ 6. LEGEND & FOOTER ══ */}
          {activeExamData && allSubjectNames.length > 0 && (
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex flex-wrap items-center gap-4">
                <span className="font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">Legend:</span>
                <span className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                    <Check className="w-3 h-3 text-emerald-600 font-bold" strokeWidth={3} />
                  </div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Marks Entered (Done)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center">
                    <XCircle className="w-3 h-3 text-rose-500" />
                  </div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Pending Marks Entry</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Minus className="w-4 h-4 text-slate-300" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Not Applicable For Class</span>
                </span>
              </div>

              <div className="text-[11px] font-bold text-slate-400">
                Tip: Click "WhatsApp Pending Report" above to copy a full summary to share with subject teachers!
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="p-12 flex flex-col items-center justify-center text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <Shield className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2" />
          <p className="text-sm font-bold text-slate-500">Please select an exam to view class-wise status.</p>
        </div>
      )}
    </div>
  );
};

export default ExamStatusTab;
