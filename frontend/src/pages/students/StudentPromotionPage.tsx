import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../api/axios';
import {
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  History,
  Copy,
  Users,
  Search,
  Sparkles,
  Calendar,
  HelpCircle,
  ChevronRight,
  UserCheck,
  LayoutDashboard,
  Layers,
  BookOpen,
  Award,
  Activity,
  RefreshCw,
  ArrowUpRight,
  ShieldCheck,
  Clock,
  SlidersHorizontal
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { getPhotoUrl } from '../../utils/photo';
import { PageHeader } from '../../components/UI/PageHeader';

interface StudentItem {
  id: string;
  userId: string;
  name: string;
  rollNo: string;
  phone?: string;
  photoUrl?: string;
  isActive: boolean;
  currentClass: string;
  currentAcademicYear: string;
  recentMarksCount: number;
  averagePercentage: number | null;
  action: 'PROMOTE' | 'DETAIN' | 'GRADUATE' | 'TC_LEAVE';
  targetClassId: string;
  remarks: string;
}

export const StudentPromotionPage: React.FC = () => {
  const [activeView, setActiveView] = useState<'dashboard' | 'workspace' | 'history'>('dashboard');

  const [academicYears, setAcademicYears] = useState<string[]>([]);
  const [fromYear, setFromYear] = useState<string>('2026-2027');
  const [toYear, setToYear] = useState<string>('2027-2028');

  const [fromClasses, setFromClasses] = useState<any[]>([]);
  const [toClasses, setToClasses] = useState<any[]>([]);

  const [selectedFromClassId, setSelectedFromClassId] = useState<string>('');
  const [defaultTargetClassId, setDefaultTargetClassId] = useState<string>('');

  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loadingYears, setLoadingYears] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cloning, setCloning] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<'ALL' | 'PROMOTE' | 'DETAIN' | 'GRADUATE' | 'TC_LEAVE'>('ALL');
  const [dashboardClassSearch, setDashboardClassSearch] = useState('');

  // Confirmation & History state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState('');

  // 1. Fetch available Academic Years
  useEffect(() => {
    const fetchYears = async () => {
      setLoadingYears(true);
      try {
        const res: any = await api.get('/api/promotion/years');
        const payload = res.data?.data !== undefined ? res.data.data : res.data;
        const yearsList: string[] = Array.isArray(payload) ? payload : (payload?.years || []);

        if (yearsList.length > 0) {
          setAcademicYears(yearsList);
          const defaultActive = payload?.activeYear || (yearsList.includes('2024-2025') ? '2024-2025' : yearsList[0]);
          const defaultTarget = payload?.nextYear || (yearsList.includes('2025-2026') ? '2025-2026' : (yearsList[1] || '2025-2026'));
          setFromYear(defaultActive);
          setToYear(defaultTarget);
        }
      } catch (err: any) {
        console.error('Failed to load academic years', err);
        toast.error('Failed to load academic years');
      } finally {
        setLoadingYears(false);
      }
    };
    fetchYears();
  }, []);

  // Fetch promotion audit history (used both for Dashboard KPIs & Audit Tab)
  const fetchPromotionHistory = useCallback(async (quiet = false) => {
    if (!quiet) setLoadingHistory(true);
    try {
      const res: any = await api.get('/api/promotion/history?limit=100');
      const logs = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setHistoryLogs(logs);
    } catch (err) {
      if (!quiet) {
        console.error('Failed to load promotion history', err);
        toast.error('Failed to load promotion history');
      }
    } finally {
      if (!quiet) setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchPromotionHistory(true);
  }, [fetchPromotionHistory]);

  // 2. Fetch classes for fromYear
  const fetchFromClasses = useCallback(async (year: string) => {
    if (!year) return;
    try {
      const res: any = await api.get(`/api/promotion/classes?academicYear=${year}`);
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setFromClasses(list);

      if (list.length > 0) {
        setSelectedFromClassId(prev => {
          const exists = list.some((c: any) => c.id === prev);
          if (exists) return prev;
          const withStudents = list.find((c: any) => (c._count?.students || 0) > 0);
          return withStudents?.id || list[0].id;
        });
      } else {
        setSelectedFromClassId('');
      }
    } catch (err) {
      console.error('Failed to load source classes', err);
    }
  }, []);

  // 3. Fetch classes for toYear
  const fetchToClasses = useCallback(async (year: string) => {
    if (!year) return;
    try {
      const res: any = await api.get(`/api/promotion/classes?academicYear=${year}`);
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setToClasses(list);
    } catch (err) {
      console.error('Failed to load target classes', err);
    }
  }, []);

  useEffect(() => {
    fetchFromClasses(fromYear);
  }, [fromYear, fetchFromClasses]);

  useEffect(() => {
    fetchToClasses(toYear);
  }, [toYear, fetchToClasses]);

  // Suggest default target class based on progression
  const suggestNextClass = useCallback((fromClassName: string, availableToClasses: any[]) => {
    if (!fromClassName || availableToClasses.length === 0) return '';
    const lower = fromClassName.toLowerCase().trim();

    let targetKeyword = '';
    if (lower.includes('nur')) targetKeyword = 'lkg';
    else if (lower.includes('lkg') || lower.includes('pp1')) targetKeyword = 'ukg';
    else if (lower.includes('ukg') || lower.includes('pp2')) targetKeyword = '1';
    else if (lower.includes('1st') || lower.includes('1 class') || lower === '1') targetKeyword = '2';
    else if (lower.includes('2nd') || lower.includes('2 class') || lower === '2') targetKeyword = '3';
    else if (lower.includes('3rd') || lower.includes('3 class') || lower === '3') targetKeyword = '4';
    else if (lower.includes('4th') || lower.includes('4 class') || lower === '4') targetKeyword = '5';
    else if (lower.includes('5th') || lower.includes('5 class') || lower === '5') targetKeyword = '6';
    else if (lower.includes('6th') || lower.includes('6 class') || lower === '6') targetKeyword = '7';
    else if (lower.includes('7th') || lower.includes('7 class') || lower === '7') targetKeyword = '8';
    else if (lower.includes('8th') || lower.includes('8 class') || lower === '8') targetKeyword = '9';
    else if (lower.includes('9th') || lower.includes('9 class') || lower === '9') targetKeyword = '10';

    if (targetKeyword) {
      const sectionMatch = lower.match(/\b([a-d])\b/);
      const section = sectionMatch ? sectionMatch[1] : '';

      if (section) {
        const exactMatch = availableToClasses.find(c =>
          c.name.toLowerCase().includes(targetKeyword) &&
          c.section && c.section.toLowerCase() === section
        );
        if (exactMatch) return exactMatch.id;
      }

      const nameMatch = availableToClasses.find(c =>
        c.name.toLowerCase().includes(targetKeyword)
      );
      if (nameMatch) return nameMatch.id;
    }

    return availableToClasses.length > 0 ? availableToClasses[0].id : '';
  }, []);

  // 4. Fetch students when source class changes
  const fetchStudents = useCallback(async (classId: string) => {
    if (!classId) {
      setStudents([]);
      return;
    }
    setLoadingStudents(true);
    try {
      const res: any = await api.get(`/api/promotion/students?classId=${classId}`);
      const rawList = Array.isArray(res.data) ? res.data : (res.data?.data || []);

      const fromClass = fromClasses.find(c => c.id === classId);
      const fromClassName = fromClass ? `${fromClass.name} ${fromClass.section || ''}` : '';
      const isTenthClass = fromClassName.toLowerCase().includes('10');

      const initialTargetId = suggestNextClass(fromClassName, toClasses);
      setDefaultTargetClassId(initialTargetId);

      const mapped: StudentItem[] = rawList.map((s: any) => ({
        ...s,
        action: isTenthClass ? 'GRADUATE' : 'PROMOTE',
        targetClassId: isTenthClass ? '' : initialTargetId,
        remarks: ''
      }));
      setStudents(mapped);
    } catch (err: any) {
      console.error('Failed to load students for this class', err);
      toast.error('Failed to load students for this class');
    } finally {
      setLoadingStudents(false);
    }
  }, [fromClasses, toClasses, suggestNextClass]);

  useEffect(() => {
    if (selectedFromClassId) {
      fetchStudents(selectedFromClassId);
    } else {
      setStudents([]);
    }
  }, [selectedFromClassId, fetchStudents]);

  // Update all students to a single default target class
  const handleApplyDefaultTargetClass = (targetId: string) => {
    setDefaultTargetClassId(targetId);
    setStudents(prev =>
      prev.map(s => (s.action === 'PROMOTE' ? { ...s, targetClassId: targetId } : s))
    );
  };

  // Change individual student action
  const handleStudentActionChange = (
    studentId: string,
    action: 'PROMOTE' | 'DETAIN' | 'GRADUATE' | 'TC_LEAVE'
  ) => {
    setStudents(prev =>
      prev.map(s => {
        if (s.id !== studentId) return s;

        let targetId = s.targetClassId;
        if (action === 'PROMOTE') {
          targetId = targetId || defaultTargetClassId;
        } else if (action === 'DETAIN') {
          const fromClass = fromClasses.find(c => c.id === selectedFromClassId);
          if (fromClass) {
            const sameGradeInNewYear = toClasses.find(
              c => c.name.toLowerCase() === fromClass.name.toLowerCase()
            );
            targetId = sameGradeInNewYear ? sameGradeInNewYear.id : '';
          }
        } else {
          targetId = '';
        }

        return { ...s, action, targetClassId: targetId };
      })
    );
  };

  const handleStudentTargetClassChange = (studentId: string, targetClassId: string) => {
    setStudents(prev =>
      prev.map(s => (s.id === studentId ? { ...s, targetClassId } : s))
    );
  };

  const handleStudentRemarksChange = (studentId: string, remarks: string) => {
    setStudents(prev =>
      prev.map(s => (s.id === studentId ? { ...s, remarks } : s))
    );
  };

  const handlePromoteAll = () => {
    setStudents(prev =>
      prev.map(s => ({
        ...s,
        action: 'PROMOTE',
        targetClassId: defaultTargetClassId
      }))
    );
    toast.success('All students marked for Promotion');
  };

  const handleCloneClasses = async () => {
    if (!fromYear || !toYear || fromYear === toYear) {
      toast.error('Select valid different Source and Target academic years');
      return;
    }

    if (!confirm(`Are you sure you want to clone all classes and subjects from ${fromYear} to ${toYear}?`)) {
      return;
    }

    setCloning(true);
    try {
      const res: any = await api.post('/api/promotion/clone-classes', {
        fromAcademicYear: fromYear,
        toAcademicYear: toYear
      });
      const msg = res.data?.message || res.message || `Classes cloned successfully for ${toYear}!`;
      toast.success(msg);
      fetchToClasses(toYear);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to clone classes');
    } finally {
      setCloning(false);
    }
  };

  const handleExecutePromotion = async () => {
    if (students.length === 0) {
      toast.error('No students to promote');
      return;
    }

    const missingTarget = students.find(s => s.action === 'PROMOTE' && !s.targetClassId);
    if (missingTarget) {
      toast.error(`Please select a target class for ${missingTarget.name}`);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        fromAcademicYear: fromYear,
        toAcademicYear: toYear,
        promotions: students.map(s => ({
          studentId: s.id,
          action: s.action,
          targetClassId: s.targetClassId || undefined,
          remarks: s.remarks || undefined
        }))
      };

      const res: any = await api.post('/api/promotion/execute', payload);
      const msg = res.data?.message || res.message || 'Promotion executed successfully!';
      toast.success(msg);
      setShowConfirmModal(false);
      fetchStudents(selectedFromClassId);
      fetchFromClasses(fromYear);
      fetchToClasses(toYear);
      fetchPromotionHistory(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to execute promotion');
    } finally {
      setSubmitting(false);
    }
  };

  const openClassInWorkspace = (classId: string) => {
    setSelectedFromClassId(classId);
    setActionFilter('ALL');
    setSearchQuery('');
    setActiveView('workspace');
  };

  // Current selected class metrics
  const metrics = useMemo(() => {
    let promote = 0;
    let detain = 0;
    let graduate = 0;
    let tc = 0;
    let scoreSum = 0;
    let scoreCount = 0;
    students.forEach(s => {
      if (s.action === 'PROMOTE') promote++;
      else if (s.action === 'DETAIN') detain++;
      else if (s.action === 'GRADUATE') graduate++;
      else if (s.action === 'TC_LEAVE') tc++;
      if (s.averagePercentage !== null && s.averagePercentage !== undefined) {
        scoreSum += s.averagePercentage;
        scoreCount++;
      }
    });
    const avgPerformance = scoreCount > 0 ? Math.round(scoreSum / scoreCount) : null;
    return { total: students.length, promote, detain, graduate, tc, avgPerformance };
  }, [students]);

  // Dashboard-wide session KPIs
  const dashboardStats = useMemo(() => {
    const totalSessionStudents = fromClasses.reduce((sum, c) => sum + (c._count?.students || 0), 0);
    const activeClassesCount = fromClasses.filter(c => (c._count?.students || 0) > 0).length;
    const totalTargetClasses = toClasses.length;
    const promotedHistoryCount = historyLogs.filter(h => h.action === 'PROMOTE').length;
    const archivedHistoryCount = historyLogs.filter(h => h.action === 'GRADUATE' || h.action === 'TC_LEAVE').length;
    const detainedHistoryCount = historyLogs.filter(h => h.action === 'DETAIN').length;

    const readinessScore =
      totalTargetClasses > 0 && fromClasses.length > 0
        ? Math.min(100, Math.round((totalTargetClasses / fromClasses.length) * 100))
        : 0;

    return {
      totalSessionStudents,
      activeClassesCount,
      totalTargetClasses,
      promotedHistoryCount,
      archivedHistoryCount,
      detainedHistoryCount,
      readinessScore
    };
  }, [fromClasses, toClasses, historyLogs]);

  const filteredDashboardClasses = useMemo(() => {
    if (!dashboardClassSearch.trim()) return fromClasses;
    const q = dashboardClassSearch.toLowerCase();
    return fromClasses.filter(c =>
      `${c.name} ${c.section || ''}`.toLowerCase().includes(q)
    );
  }, [fromClasses, dashboardClassSearch]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch =
        searchQuery === '' ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.rollNo.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesAction = actionFilter === 'ALL' || s.action === actionFilter;
      return matchesSearch && matchesAction;
    });
  }, [students, searchQuery, actionFilter]);

  const filteredHistoryLogs = useMemo(() => {
    if (!historySearch.trim()) return historyLogs;
    const q = historySearch.toLowerCase();
    return historyLogs.filter(log =>
      (log.student?.user?.name || '').toLowerCase().includes(q) ||
      (log.fromClassName || '').toLowerCase().includes(q) ||
      (log.toClassName || '').toLowerCase().includes(q) ||
      (log.action || '').toLowerCase().includes(q)
    );
  }, [historyLogs, historySearch]);

  const selectedFromClassObj = fromClasses.find(c => c.id === selectedFromClassId);
  const selectedTargetObj = toClasses.find(c => c.id === defaultTargetClassId);

  return (
    <div className="min-h-full bg-[#F5F7FB] text-slate-800 flex flex-col font-sans">
      
      {/* ── UNIFIED PAGE HEADER BAR ── */}
      <PageHeader
        title="Student Promotion & Year Transition"
        icon={<GraduationCap className="w-5 h-5 text-white" />}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 border border-white/20 text-white text-xs font-extrabold">
              <Calendar className="w-3.5 h-3.5 text-cyan-200" />
              <span>{fromYear}</span>
              <ArrowRight className="w-3 h-3 text-cyan-200" />
              <span>{toYear}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveView('history');
                fetchPromotionHistory(false);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-bold transition-all cursor-pointer"
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit History</span>
            </button>
            <Link
              to="/classes"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 text-xs font-extrabold shadow-sm transition-all"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Manage Classes</span>
            </Link>
          </div>
        }
      />

      <div className="p-3 sm:p-5 lg:p-6 max-w-7xl mx-auto w-full space-y-5">

        {/* ── SUB-HEADER: NAVIGATION TABS + QUICK SESSION SWITCHER ── */}
        <div className="bg-white rounded-[22px] p-2.5 sm:p-3 shadow-[0_8px_24px_-6px_rgba(79,70,229,0.08)] border border-indigo-100/90 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* View Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#F3F5FC] rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveView('dashboard')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                activeView === 'dashboard'
                  ? 'bg-gradient-to-r from-[#4F46E5] to-[#6D28D9] text-white shadow-sm'
                  : 'text-slate-600 hover:text-indigo-700 hover:bg-white/70'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Promotion Dashboard</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('workspace')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                activeView === 'workspace'
                  ? 'bg-gradient-to-r from-[#4F46E5] to-[#6D28D9] text-white shadow-sm'
                  : 'text-slate-600 hover:text-indigo-700 hover:bg-white/70'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Rollover Workspace</span>
              {selectedFromClassObj && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  activeView === 'workspace' ? 'bg-white/25 text-white' : 'bg-indigo-100 text-indigo-700'
                }`}>
                  {selectedFromClassObj.name} {selectedFromClassObj.section}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveView('history');
                fetchPromotionHistory(false);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                activeView === 'history'
                  ? 'bg-gradient-to-r from-[#4F46E5] to-[#6D28D9] text-white shadow-sm'
                  : 'text-slate-600 hover:text-indigo-700 hover:bg-white/70'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit Logs</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeView === 'history' ? 'bg-white/25 text-white' : 'bg-indigo-100 text-indigo-700'
              }`}>
                {historyLogs.length}
              </span>
            </button>
          </div>

          {/* Inline Academic Session Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl px-2.5 py-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">From</span>
              <select
                value={fromYear}
                disabled={loadingYears}
                onChange={e => {
                  setFromYear(e.target.value);
                  setSelectedFromClassId('');
                }}
                className="bg-transparent text-xs font-extrabold text-slate-800 focus:outline-none cursor-pointer"
              >
                {academicYears.map(yr => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>

            <ArrowRight className="w-3.5 h-3.5 text-indigo-400 shrink-0" />

            <div className="flex items-center gap-1.5 bg-[#ECFDF5] border border-emerald-200 rounded-xl px-2.5 py-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">To</span>
              <select
                value={toYear}
                disabled={loadingYears}
                onChange={e => {
                  setToYear(e.target.value);
                  setDefaultTargetClassId('');
                }}
                className="bg-transparent text-xs font-extrabold text-emerald-900 focus:outline-none cursor-pointer"
              >
                {academicYears.map(yr => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleCloneClasses}
              disabled={cloning}
              title="Copy class structure and subjects into target session"
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer disabled:opacity-50 ${
                toClasses.length === 0
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm animate-pulse'
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80'
              }`}
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{cloning ? 'Cloning...' : 'Clone Classes'}</span>
            </button>
          </div>

        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* VIEW 1: DEDICATED PROMOTION DASHBOARD (WITH PASTEL KPI CARDS)    */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {activeView === 'dashboard' && (
          <div className="space-y-5 animate-fade-in">

            {/* 5 Glossy Pastel KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5">

              {/* KPI 1: Total Session Students */}
              <div className="relative overflow-hidden rounded-[22px] p-4 border bg-gradient-to-br from-[#EBF3FF] to-[#D6E6FF] border-[#C5DBFF] shadow-[0_6px_18px_-6px_rgba(37,99,235,0.16)] flex flex-col justify-between gap-3">
                <div className="absolute inset-x-0 top-0 h-[42%] bg-gradient-to-b from-white/55 to-transparent pointer-events-none rounded-t-[22px]" />
                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-800">Session Students</span>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="relative z-10">
                  <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {dashboardStats.totalSessionStudents}
                  </p>
                  <p className="text-[11px] font-bold text-blue-700 mt-0.5">
                    Across {dashboardStats.activeClassesCount} active classes ({fromYear})
                  </p>
                </div>
              </div>

              {/* KPI 2: Target Session Readiness */}
              <div className="relative overflow-hidden rounded-[22px] p-4 border bg-gradient-to-br from-[#E5FAEF] to-[#C2F2D9] border-[#ACEAD0] shadow-[0_6px_18px_-6px_rgba(16,185,129,0.16)] flex flex-col justify-between gap-3">
                <div className="absolute inset-x-0 top-0 h-[42%] bg-gradient-to-b from-white/55 to-transparent pointer-events-none rounded-t-[22px]" />
                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">Target Classes</span>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-sm">
                    <Layers className="w-4 h-4" />
                  </div>
                </div>
                <div className="relative z-10">
                  <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {dashboardStats.totalTargetClasses}
                  </p>
                  <p className="text-[11px] font-bold text-emerald-800 mt-0.5">
                    {toClasses.length > 0 ? `${dashboardStats.readinessScore}% structure ready (${toYear})` : `Setup needed for ${toYear}`}
                  </p>
                </div>
              </div>

              {/* KPI 3: Selected Batch Queue */}
              <button
                type="button"
                onClick={() => setActiveView('workspace')}
                className="text-left relative overflow-hidden rounded-[22px] p-4 border bg-gradient-to-br from-[#F1EDFF] to-[#DFD5FF] border-[#D0C2FF] shadow-[0_6px_18px_-6px_rgba(109,40,217,0.16)] hover:-translate-y-0.5 transition-all flex flex-col justify-between gap-3 cursor-pointer group"
              >
                <div className="absolute inset-x-0 top-0 h-[42%] bg-gradient-to-b from-white/55 to-transparent pointer-events-none rounded-t-[22px]" />
                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-violet-800">Selected Class Queue</span>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-purple-700 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                    <BookOpen className="w-4 h-4" />
                  </div>
                </div>
                <div className="relative z-10">
                  <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {metrics.total}
                  </p>
                  <p className="text-[11px] font-bold text-violet-800 mt-0.5 flex items-center justify-between">
                    <span>{selectedFromClassObj ? `${selectedFromClassObj.name} ${selectedFromClassObj.section || ''}` : 'Choose a class'}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </p>
                </div>
              </button>

              {/* KPI 4: Completed Promotions (Audit) */}
              <button
                type="button"
                onClick={() => {
                  setActiveView('history');
                  fetchPromotionHistory(false);
                }}
                className="text-left relative overflow-hidden rounded-[22px] p-4 border bg-gradient-to-br from-[#FFF4E0] to-[#FFE1B3] border-[#FAD496] shadow-[0_6px_18px_-6px_rgba(217,119,6,0.16)] hover:-translate-y-0.5 transition-all flex flex-col justify-between gap-3 cursor-pointer group"
              >
                <div className="absolute inset-x-0 top-0 h-[42%] bg-gradient-to-b from-white/55 to-transparent pointer-events-none rounded-t-[22px]" />
                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">Promoted (Logs)</span>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                    <Award className="w-4 h-4" />
                  </div>
                </div>
                <div className="relative z-10">
                  <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {dashboardStats.promotedHistoryCount}
                  </p>
                  <p className="text-[11px] font-bold text-amber-800 mt-0.5">
                    {dashboardStats.detainedHistoryCount} Detained in history
                  </p>
                </div>
              </button>

              {/* KPI 5: Alumni & TC Transitions */}
              <div className="col-span-2 md:col-span-1 relative overflow-hidden rounded-[22px] p-4 border bg-gradient-to-br from-[#FCE7F3] to-[#FBCFE8] border-[#F9A8D4] shadow-[0_6px_18px_-6px_rgba(219,39,119,0.16)] flex flex-col justify-between gap-3">
                <div className="absolute inset-x-0 top-0 h-[42%] bg-gradient-to-b from-white/55 to-transparent pointer-events-none rounded-t-[22px]" />
                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-pink-800">Alumni &amp; TC Exit</span>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 text-white flex items-center justify-center shadow-sm">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                </div>
                <div className="relative z-10">
                  <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {dashboardStats.archivedHistoryCount}
                  </p>
                  <p className="text-[11px] font-bold text-pink-800 mt-0.5">
                    Graduated &amp; TC records
                  </p>
                </div>
              </div>

            </div>

            {/* Session Readiness Banner Card (Pure Light Pastel) */}
            <div className="bg-white rounded-[24px] border border-indigo-100/90 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-[#EEF2FF] via-[#F5F3FF] to-[#ECFDF5] p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-indigo-200/80 text-[11px] font-black text-indigo-700 shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>ACADEMIC ROLLOVER PIPELINE</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    Transitioning <span className="text-indigo-700">{fromYear}</span> Classes to{' '}
                    <span className="text-emerald-700">{toYear}</span>
                  </h2>
                  <p className="text-xs font-semibold text-slate-600 max-w-2xl">
                    Review class-by-class enrollment below. Click any class card to verify exam averages, assign promote/detain/alumni actions, and commit promotions safely with full audit history.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  {toClasses.length === 0 && (
                    <button
                      type="button"
                      onClick={handleCloneClasses}
                      disabled={cloning}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-black shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                    >
                      <Copy className="w-4 h-4" />
                      <span>{cloning ? 'Cloning Structure...' : `1-Click Clone ${fromYear} → ${toYear}`}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveView('workspace')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 hover:opacity-95 text-white text-xs font-black shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Open Rollover Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* 2-Column Executive Dashboard Body */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

              {/* LEFT: Class-by-Class Rollover Readiness Matrix */}
              <div className="lg:col-span-8 bg-white rounded-[24px] border border-slate-200/80 shadow-sm p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      <span>Class Rollover Matrix ({fromYear})</span>
                    </h3>
                    <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                      Select any class below to inspect students and execute promotions
                    </p>
                  </div>
                  <div className="relative w-full sm:w-56">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={dashboardClassSearch}
                      onChange={e => setDashboardClassSearch(e.target.value)}
                      placeholder="Filter classes..."
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#F8FAFF] border border-indigo-100 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                {filteredDashboardClasses.length === 0 ? (
                  <div className="py-12 text-center bg-[#F8FAFF] rounded-2xl border border-dashed border-indigo-200">
                    <GraduationCap className="w-10 h-10 text-indigo-300 mx-auto mb-2" />
                    <p className="text-sm font-extrabold text-slate-700">No classes found in {fromYear}</p>
                    <p className="text-xs text-slate-500 mt-1">Switch the source academic year above or create classes first.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filteredDashboardClasses.map(cls => {
                      const count = cls._count?.students || 0;
                      const isTenth = `${cls.name} ${cls.section || ''}`.toLowerCase().includes('10');
                      const autoTargetId = isTenth ? '' : suggestNextClass(`${cls.name} ${cls.section || ''}`, toClasses);
                      const autoTargetCls = toClasses.find(t => t.id === autoTargetId);
                      const isSelected = cls.id === selectedFromClassId;

                      return (
                        <div
                          key={cls.id}
                          onClick={() => openClassInWorkspace(cls.id)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between gap-3 ${
                            isSelected
                              ? 'bg-gradient-to-br from-[#EEF2FF] to-[#F8FAFF] border-indigo-300 shadow-sm'
                              : 'bg-[#FAFBFD] hover:bg-white border-slate-200/80 hover:border-indigo-200 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-slate-900">
                                  {cls.name} {cls.section ? `- ${cls.section}` : ''}
                                </span>
                                {isSelected && (
                                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                                    Active
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                                Teacher: {cls.classTeacher?.user?.name || 'Not Assigned'}
                              </p>
                            </div>

                            <span className={`px-2.5 py-1 rounded-xl text-xs font-black shrink-0 ${
                              count > 0
                                ? 'bg-indigo-100/80 text-indigo-800 border border-indigo-200'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}>
                              {count} {count === 1 ? 'Student' : 'Students'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/70 text-[11px]">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <ArrowRight className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              {isTenth ? (
                                <span className="font-extrabold text-purple-700 truncate">Graduating Batch (Alumni)</span>
                              ) : autoTargetCls ? (
                                <span className="font-extrabold text-emerald-700 truncate">
                                  Target: {autoTargetCls.name} {autoTargetCls.section || ''}
                                </span>
                              ) : (
                                <span className="font-bold text-amber-700 truncate">No target class in {toYear}</span>
                              )}
                            </div>
                            <span className="inline-flex items-center gap-1 font-extrabold text-indigo-600 group-hover:translate-x-0.5 transition-transform shrink-0">
                              <span>Promote</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* RIGHT: Pre-Flight Checklist & Recent Activity Feed */}
              <div className="lg:col-span-4 space-y-4">

                {/* Pre-Flight Checklist Card */}
                <div className="bg-white rounded-[24px] border border-slate-200/80 shadow-sm p-5 space-y-3.5">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">Rollover Readiness</h3>
                      <p className="text-[11px] text-slate-400 font-medium">Zero data loss transition checks</p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {[
                      {
                        label: `Source Classes Loaded (${fromYear})`,
                        done: fromClasses.length > 0,
                        meta: `${fromClasses.length} classes`
                      },
                      {
                        label: `Target Classes Ready (${toYear})`,
                        done: toClasses.length > 0,
                        meta: toClasses.length > 0 ? `${toClasses.length} classes` : 'Needs Clone'
                      },
                      {
                        label: 'Batch Selected for Review',
                        done: Boolean(selectedFromClassId),
                        meta: selectedFromClassObj ? `${selectedFromClassObj.name} ${selectedFromClassObj.section || ''}` : 'Pending'
                      },
                      {
                        label: 'Target Mapping Verified',
                        done: metrics.total === 0 || students.every(s => s.action !== 'PROMOTE' || Boolean(s.targetClassId)),
                        meta: metrics.total > 0 ? `${metrics.promote} mapped` : 'Waiting'
                      }
                    ].map((step, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-2xl border flex items-center justify-between gap-2 text-xs ${
                          step.done
                            ? 'bg-[#ECFDF5] border-emerald-200/80 text-emerald-900'
                            : 'bg-[#FFF8EB] border-amber-200/80 text-amber-900'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {step.done ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          )}
                          <span className="font-bold truncate">{step.label}</span>
                        </div>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-white/80 shrink-0">
                          {step.meta}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Promotion Activity Card */}
                <div className="bg-white rounded-[24px] border border-slate-200/80 shadow-sm p-5 space-y-3.5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900">Recent Transitions</h3>
                        <p className="text-[11px] text-slate-400 font-medium">Latest audit trail entries</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveView('history');
                        fetchPromotionHistory(false);
                      }}
                      className="text-[11px] font-extrabold text-indigo-600 hover:underline cursor-pointer"
                    >
                      View All
                    </button>
                  </div>

                  {historyLogs.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                      <Clock className="w-7 h-7 mx-auto mb-1.5 text-slate-300" />
                      <p className="text-xs font-bold text-slate-500">No promotion logs yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {historyLogs.slice(0, 5).map(log => (
                        <div key={log.id} className="p-3 rounded-2xl bg-[#F8FAFF] border border-indigo-100/80 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-extrabold text-slate-900 truncate">
                              {log.student?.user?.name || 'Student'}
                            </p>
                            <p className="text-[10px] font-semibold text-slate-500 truncate mt-0.5">
                              {log.fromClassName} → {log.toClassName || log.action}
                            </p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black shrink-0 ${
                            log.action === 'PROMOTE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : log.action === 'DETAIN'
                              ? 'bg-amber-100 text-amber-800'
                              : log.action === 'GRADUATE'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {log.action}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>

          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* VIEW 2: ROLLOVER WORKSPACE (CLASS-BY-CLASS EXECUTION STUDIO)     */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {activeView === 'workspace' && (
          <div className="space-y-4 animate-fade-in">

            {/* Sleek Class Mapping Bar (Replaces bulky old Source/Target panel) */}
            <div className="bg-white rounded-[24px] border border-indigo-100/90 shadow-sm p-4 sm:p-5">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">

                <div className="lg:col-span-5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-indigo-700 flex items-center gap-1.5 mb-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 inline-flex items-center justify-center text-[10px]">1</span>
                    <span>Source Class ({fromYear})</span>
                  </label>
                  <select
                    value={selectedFromClassId}
                    onChange={e => setSelectedFromClassId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6F8FF] border border-indigo-200 text-xs sm:text-sm font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                  >
                    <option value="">-- Select Source Class --</option>
                    {fromClasses.map(cls => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} {cls.section || ''} ({cls._count?.students || 0} students)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="lg:col-span-2 flex items-center justify-center pb-1">
                  <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-gradient-to-r from-indigo-50 via-purple-50 to-emerald-50 border border-indigo-100 text-indigo-700 text-xs font-black">
                    <span>Promote</span>
                    <ArrowRight className="w-4 h-4 text-emerald-600" />
                  </div>
                </div>

                <div className="lg:col-span-5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-emerald-700 flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 inline-flex items-center justify-center text-[10px]">2</span>
                      <span>Default Target Class ({toYear})</span>
                    </span>
                    {selectedTargetObj && (
                      <span className="text-[10px] font-bold text-emerald-600">Auto-suggested</span>
                    )}
                  </label>
                  <select
                    value={defaultTargetClassId}
                    onChange={e => handleApplyDefaultTargetClass(e.target.value)}
                    disabled={toClasses.length === 0}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F2FCF7] border border-emerald-200 text-xs sm:text-sm font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer disabled:bg-slate-100"
                  >
                    <option value="">-- Choose Target Class --</option>
                    {toClasses.map(cls => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} {cls.section ? `- ${cls.section}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

              </div>

              {toClasses.length === 0 && (
                <div className="mt-4 p-3 rounded-2xl bg-[#FFF6E5] border border-amber-200 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-bold text-amber-900">
                    No classes found in target academic year <strong>{toYear}</strong> yet. Clone your class structure to map promotions.
                  </p>
                  <button
                    type="button"
                    onClick={handleCloneClasses}
                    disabled={cloning}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold cursor-pointer transition-all"
                  >
                    {cloning ? 'Cloning...' : '⚡ 1-Click Clone Classes'}
                  </button>
                </div>
              )}
            </div>

            {!selectedFromClassId ? (
              <div className="bg-white rounded-[24px] border border-slate-200/80 p-10 text-center shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <h3 className="text-base font-black text-slate-800">Select a Source Class to Load Students</h3>
                <p className="text-xs text-slate-500 mt-1">Choose a class from the selector above or pick one from the Promotion Dashboard.</p>
              </div>
            ) : (
              <>
                {/* Workspace Action KPI Strip & Filters */}
                <div className="bg-white rounded-[22px] border border-slate-200/80 shadow-sm p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      { id: 'ALL', label: 'All', count: metrics.total, active: 'bg-indigo-600 text-white', idle: 'bg-slate-100 text-slate-700 hover:bg-slate-200' },
                      { id: 'PROMOTE', label: 'Promote', count: metrics.promote, active: 'bg-emerald-600 text-white', idle: 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' },
                      { id: 'DETAIN', label: 'Detain', count: metrics.detain, active: 'bg-amber-600 text-white', idle: 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100' },
                      { id: 'GRADUATE', label: 'Alumni', count: metrics.graduate, active: 'bg-purple-600 text-white', idle: 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100' },
                      { id: 'TC_LEAVE', label: 'Left / TC', count: metrics.tc, active: 'bg-rose-600 text-white', idle: 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100' }
                    ].map(f => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setActionFilter(f.id as any)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                          actionFilter === f.id ? `${f.active} shadow-xs` : f.idle
                        }`}
                      >
                        <span>{f.label}</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                          actionFilter === f.id ? 'bg-white/25 text-white' : 'bg-white/80'
                        }`}>
                          {f.count}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 sm:w-52">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search name or ID..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 bg-[#F8FAFF] border border-indigo-100 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handlePromoteAll}
                      className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      Mark All Promote
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowConfirmModal(true)}
                      disabled={submitting || metrics.total === 0}
                      className="px-4 py-2 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 hover:opacity-95 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Execute Promotion</span>
                    </button>
                  </div>
                </div>

                {/* Modern Student Transition Table */}
                <div className="bg-white rounded-[24px] border border-indigo-100/90 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gradient-to-r from-[#4F46E5] via-[#6D28D9] to-[#7C3AED] text-white text-[11px] font-extrabold uppercase tracking-wider">
                          <th className="py-3.5 px-4 w-12 text-center">#</th>
                          <th className="py-3.5 px-4">Student</th>
                          <th className="py-3.5 px-4">Roll / ID</th>
                          <th className="py-3.5 px-4">Performance</th>
                          <th className="py-3.5 px-4">Decision Action</th>
                          <th className="py-3.5 px-4">Target Class ({toYear})</th>
                          <th className="py-3.5 px-4">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {loadingStudents ? (
                          <tr>
                            <td colSpan={7} className="py-16 text-center text-slate-400">
                              <div className="animate-spin w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full mx-auto mb-2" />
                              <p className="text-xs font-bold text-slate-500">Loading students for promotion review...</p>
                            </td>
                          </tr>
                        ) : filteredStudents.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-16 text-center text-slate-400">
                              <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                              <p className="text-sm font-extrabold text-slate-600">No students match this view</p>
                              <p className="text-xs text-slate-400 mt-1">Adjust search/filters or pick another class.</p>
                            </td>
                          </tr>
                        ) : (
                          filteredStudents.map((student, idx) => {
                            const photo = getPhotoUrl(student.photoUrl);
                            return (
                              <tr
                                key={student.id}
                                className={`transition-colors hover:bg-[#F8FAFF] ${
                                  student.action === 'PROMOTE'
                                    ? 'bg-white'
                                    : student.action === 'DETAIN'
                                    ? 'bg-amber-50/35'
                                    : student.action === 'GRADUATE'
                                    ? 'bg-purple-50/35'
                                    : 'bg-rose-50/35'
                                }`}
                              >
                                <td className="py-3.5 px-4 text-center font-bold text-xs text-slate-400">
                                  {idx + 1}
                                </td>

                                <td className="py-3.5 px-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 overflow-hidden">
                                      {photo ? (
                                        <img src={photo} alt={student.name} className="w-full h-full object-cover" />
                                      ) : (
                                        <span className="text-sm font-black text-indigo-600">
                                          {student.name ? student.name[0].toUpperCase() : 'S'}
                                        </span>
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-extrabold text-slate-900 text-xs sm:text-sm leading-tight truncate max-w-[190px]">
                                        {student.name}
                                      </p>
                                      {student.phone && (
                                        <p className="text-[11px] font-medium text-slate-400 mt-0.5">{student.phone}</p>
                                      )}
                                    </div>
                                  </div>
                                </td>

                                <td className="py-3.5 px-4">
                                  <span className="px-2.5 py-1 bg-[#F3F5FC] border border-indigo-100 rounded-lg text-xs font-mono font-bold text-indigo-800">
                                    {student.rollNo || '–'}
                                  </span>
                                </td>

                                <td className="py-3.5 px-4">
                                  {student.averagePercentage !== null ? (
                                    <div className="space-y-1 min-w-[90px]">
                                      <span
                                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-black ${
                                          student.averagePercentage >= 60
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : student.averagePercentage >= 40
                                            ? 'bg-amber-100 text-amber-800'
                                            : 'bg-rose-100 text-rose-800'
                                        }`}
                                      >
                                        {student.averagePercentage}% Avg
                                      </span>
                                      <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                        <div
                                          className={`h-1.5 rounded-full ${
                                            student.averagePercentage >= 60
                                              ? 'bg-emerald-500'
                                              : student.averagePercentage >= 40
                                              ? 'bg-amber-500'
                                              : 'bg-rose-500'
                                          }`}
                                          style={{ width: `${Math.min(100, student.averagePercentage)}%` }}
                                        />
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-slate-400 font-semibold">Enrolled</span>
                                  )}
                                </td>

                                {/* Segmented Pill Decision Selector */}
                                <td className="py-3.5 px-4">
                                  <div className="inline-flex items-center p-1 rounded-xl bg-slate-100/90 border border-slate-200/70 gap-1">
                                    {[
                                      { val: 'PROMOTE', label: 'Promote', cls: 'bg-emerald-600 text-white shadow-2xs' },
                                      { val: 'DETAIN', label: 'Detain', cls: 'bg-amber-500 text-white shadow-2xs' },
                                      { val: 'GRADUATE', label: 'Alumni', cls: 'bg-purple-600 text-white shadow-2xs' },
                                      { val: 'TC_LEAVE', label: 'TC', cls: 'bg-rose-600 text-white shadow-2xs' }
                                    ].map(opt => (
                                      <button
                                        key={opt.val}
                                        type="button"
                                        onClick={() => handleStudentActionChange(student.id, opt.val as any)}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                                          student.action === opt.val
                                            ? opt.cls
                                            : 'text-slate-600 hover:bg-white hover:text-slate-900'
                                        }`}
                                      >
                                        {opt.label}
                                      </button>
                                    ))}
                                  </div>
                                </td>

                                <td className="py-3.5 px-4">
                                  {student.action === 'PROMOTE' || student.action === 'DETAIN' ? (
                                    <select
                                      value={student.targetClassId}
                                      onChange={e => handleStudentTargetClassChange(student.id, e.target.value)}
                                      className="w-full min-w-[140px] py-1.5 px-3 bg-white border border-indigo-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                                    >
                                      <option value="">-- Target Class --</option>
                                      {toClasses.map(cls => (
                                        <option key={cls.id} value={cls.id}>
                                          {cls.name} {cls.section}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <span className="text-xs font-bold text-slate-400 italic">
                                      {student.action === 'GRADUATE' ? 'Alumni Registry' : 'TC Archived'}
                                    </span>
                                  )}
                                </td>

                                <td className="py-3.5 px-4">
                                  <input
                                    type="text"
                                    placeholder="Optional note..."
                                    value={student.remarks}
                                    onChange={e => handleStudentRemarksChange(student.id, e.target.value)}
                                    className="w-full min-w-[130px] py-1.5 px-2.5 bg-[#F8FAFF] border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                  />
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Inline Sticky Execution Footer (Never overlaps Sidebar) */}
                {students.length > 0 && (
                  <div className="sticky bottom-3 z-20 bg-white/95 backdrop-blur-md rounded-[22px] border border-indigo-200/90 shadow-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                        <Sparkles className="w-5 h-5" />
                      </span>
                      <div>
                        <p className="text-xs sm:text-sm font-black text-slate-900">
                          Ready for Rollover: <span className="text-indigo-700">{selectedFromClassObj?.name} {selectedFromClassObj?.section}</span> ({fromYear} → {toYear})
                        </p>
                        <p className="text-[11px] text-slate-500 font-semibold">
                          {metrics.promote} Promote • {metrics.detain} Detain • {metrics.graduate} Alumni • {metrics.tc} Left/TC
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowConfirmModal(true)}
                      disabled={submitting || metrics.total === 0}
                      className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 hover:opacity-95 text-white font-black text-xs sm:text-sm rounded-xl shadow-md shadow-indigo-500/25 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Confirm &amp; Execute Promotion</span>
                    </button>
                  </div>
                )}
              </>
            )}

          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* VIEW 3: PROMOTION AUDIT HISTORY TAB                              */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {activeView === 'history' && (
          <div className="bg-white rounded-[24px] border border-indigo-100/90 shadow-sm p-5 space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Academic Promotion Audit History</h3>
                  <p className="text-xs text-slate-500 font-medium">Complete permanent log of class transitions &amp; graduations</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={historySearch}
                    onChange={e => setHistorySearch(e.target.value)}
                    placeholder="Search student or class..."
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#F8FAFF] border border-indigo-100 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => fetchPromotionHistory(false)}
                  className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 cursor-pointer transition-all"
                  title="Refresh Audit Logs"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingHistory ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {loadingHistory ? (
              <div className="py-16 text-center text-slate-400">
                <div className="animate-spin w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-500">Loading audit trail...</p>
              </div>
            ) : filteredHistoryLogs.length === 0 ? (
              <div className="py-16 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                <SlidersHorizontal className="w-9 h-9 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-600">No promotion history records found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-indigo-100">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white font-extrabold uppercase text-[11px]">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">From Session / Class</th>
                      <th className="py-3 px-4">To Session / Class</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredHistoryLogs.map(log => (
                      <tr key={log.id} className="hover:bg-[#F8FAFF] transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-500 whitespace-nowrap">
                          {new Date(log.promotedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-3 px-4 font-extrabold text-slate-900">
                          {log.student?.user?.name || 'Unknown'}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-600">
                          {log.fromClassName} ({log.fromAcademicYear})
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-700">
                          {log.toClassName ? `${log.toClassName} (${log.toAcademicYear})` : '–'}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                              log.action === 'PROMOTE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : log.action === 'DETAIN'
                                ? 'bg-amber-100 text-amber-800'
                                : log.action === 'GRADUATE'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 italic">
                          {log.remarks || '–'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── CONFIRMATION MODAL ── */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-indigo-950/35 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-indigo-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-black text-slate-900 text-center mb-2">
              Confirm Academic Year Rollover
            </h3>
            <p className="text-xs font-medium text-slate-500 text-center mb-5">
              You are about to promote students from <strong>{fromYear}</strong> to{' '}
              <strong>{toYear}</strong>. Previous attendance and exam records remain safely preserved in history.
            </p>

            <div className="bg-[#F8FAFF] rounded-2xl p-4 border border-indigo-100 space-y-2.5 mb-6 text-xs font-bold text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Source Class:</span>
                <span className="text-slate-900 font-black">
                  {selectedFromClassObj?.name} {selectedFromClassObj?.section} ({fromYear})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-700">Students to Promote:</span>
                <span className="text-emerald-700 font-black">{metrics.promote}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-700">Students Detained (Repeat):</span>
                <span className="text-amber-700 font-black">{metrics.detain}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-700">Graduated (Alumni):</span>
                <span className="text-purple-700 font-black">{metrics.graduate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-rose-700">Left School (TC Issued):</span>
                <span className="text-rose-700 font-black">{metrics.tc}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecutePromotion}
                disabled={submitting}
                className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Executing...' : 'Yes, Execute Now'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentPromotionPage;
