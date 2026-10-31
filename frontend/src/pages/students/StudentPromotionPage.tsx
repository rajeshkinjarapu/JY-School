import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../api/axios';
import {
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  History,
  Copy,
  Users,
  Search,
  Filter,
  RotateCcw,
  Sparkles,
  Calendar,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { getPhotoUrl } from '../../utils/photo';

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

  // Confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

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

  // 2. Fetch classes for fromYear
  const fetchFromClasses = useCallback(async (year: string) => {
    if (!year) return;
    try {
      const res: any = await api.get(`/api/promotion/classes?academicYear=${year}`);
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setFromClasses(list);

      // Auto-select class with students or first available class
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

    // Map: Nursery -> LKG -> UKG -> 1st -> 2nd ... -> 10th
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
      // Also try to match section (e.g. "A" or "B")
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
      prev.map(s => {
        if (s.action === 'PROMOTE') {
          return { ...s, targetClassId: targetId };
        }
        return s;
      })
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
          // Keep same grade class in the new year
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

  // Change individual student target class
  const handleStudentTargetClassChange = (studentId: string, targetClassId: string) => {
    setStudents(prev =>
      prev.map(s => (s.id === studentId ? { ...s, targetClassId } : s))
    );
  };

  // Change individual student remarks
  const handleStudentRemarksChange = (studentId: string, remarks: string) => {
    setStudents(prev =>
      prev.map(s => (s.id === studentId ? { ...s, remarks } : s))
    );
  };

  // Quick action: Promote All
  const handlePromoteAll = () => {
    setStudents(prev =>
      prev.map(s => ({
        ...s,
        action: 'PROMOTE',
        targetClassId: defaultTargetClassId
      }))
    );
    toast.success('All students set to PROMOTE');
  };

  // Clone classes helper
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

  // Execute bulk promotion
  const handleExecutePromotion = async () => {
    if (students.length === 0) {
      toast.error('No students to promote');
      return;
    }

    // Verify all PROMOTE students have targetClassId
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
      // Refresh list
      fetchStudents(selectedFromClassId);
      fetchFromClasses(fromYear);
      fetchToClasses(toYear);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to execute promotion');
    } finally {
      setSubmitting(false);
    }
  };

  // Fetch promotion history
  const fetchPromotionHistory = async () => {
    setLoadingHistory(true);
    setShowHistoryModal(true);
    try {
      const res: any = await api.get(`/api/promotion/history?limit=100`);
      const logs = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setHistoryLogs(logs);
    } catch (err) {
      console.error('Failed to load promotion history', err);
      toast.error('Failed to load promotion history');
    } finally {
      setLoadingHistory(false);
    }
  };

  // Metrics summary
  const metrics = useMemo(() => {
    let promote = 0;
    let detain = 0;
    let graduate = 0;
    let tc = 0;
    students.forEach(s => {
      if (s.action === 'PROMOTE') promote++;
      else if (s.action === 'DETAIN') detain++;
      else if (s.action === 'GRADUATE') graduate++;
      else if (s.action === 'TC_LEAVE') tc++;
    });
    return { total: students.length, promote, detain, graduate, tc };
  }, [students]);

  // Filtered students
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

  const selectedFromClassObj = fromClasses.find(c => c.id === selectedFromClassId);

  return (
    <div className="min-h-screen bg-slate-50/70 p-4 md:p-8 pb-32">
      {/* ── Top Header ── */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <GraduationCap className="w-6 h-6" />
              </span>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                Student Promotion & Year Transition
              </h1>
            </div>
            <p className="text-sm font-medium text-slate-500">
              Bulk promote whole classes from current academic year to the next academic session with zero data loss.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={fetchPromotionHistory}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <History className="w-4 h-4 text-slate-500" />
              View Promotion History
            </button>
            <Link
              to="/classes"
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer"
            >
              Manage Classes
            </Link>
          </div>
        </div>
      </div>

      {/* ── Main Selector Card: From vs To ── */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            {/* SOURCE CLASS (FROM) */}
            <div className="lg:col-span-5 bg-gradient-to-br from-indigo-50/60 via-white to-purple-50/40 p-5 rounded-2xl border border-indigo-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-lg">
                  1. Current Class (Source)
                </span>
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Session
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Academic Year
                  </label>
                  <select
                    value={fromYear}
                    onChange={e => {
                      setFromYear(e.target.value);
                      setSelectedFromClassId('');
                    }}
                    className="w-full px-3 py-2.5 bg-white border border-indigo-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer shadow-sm"
                  >
                    {academicYears.map(yr => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Select Class
                  </label>
                  <select
                    value={selectedFromClassId}
                    onChange={e => setSelectedFromClassId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-indigo-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer shadow-sm"
                  >
                    <option value="">-- Choose Class --</option>
                    {fromClasses.map(cls => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} {cls.section} ({cls._count?.students || 0} students)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* CONNECTING ARROW & CLONE SHORTCUT */}
            <div className="lg:col-span-2 flex flex-col items-center justify-center gap-2">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <ArrowRight className="w-6 h-6" />
              </div>
              <button
                onClick={handleCloneClasses}
                disabled={cloning}
                title="If next year's classes don't exist yet, click here to copy classes from source year"
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline cursor-pointer disabled:opacity-50"
              >
                <Copy className="w-3 h-3" />
                {cloning ? 'Cloning Classes...' : 'Clone Classes for Target Year'}
              </button>
            </div>

            {/* TARGET CLASS (TO) */}
            <div className="lg:col-span-5 bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/40 p-5 rounded-2xl border border-emerald-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-lg">
                  2. Promoted To (Target)
                </span>
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-500" /> New Session
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Target Academic Year
                  </label>
                  <select
                    value={toYear}
                    onChange={e => {
                      setToYear(e.target.value);
                      setDefaultTargetClassId('');
                    }}
                    className="w-full px-3 py-2.5 bg-white border border-emerald-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer shadow-sm"
                  >
                    {academicYears.map(yr => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Default Target Class
                  </label>
                  <select
                    value={defaultTargetClassId}
                    onChange={e => handleApplyDefaultTargetClass(e.target.value)}
                    disabled={toClasses.length === 0}
                    className="w-full px-3 py-2.5 bg-white border border-emerald-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer shadow-sm disabled:bg-slate-100"
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
                <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200/80 rounded-xl flex items-center justify-between gap-2">
                  <p className="text-[11px] font-bold text-amber-800">
                    No classes in <strong>{toYear}</strong> yet.
                  </p>
                  <button
                    type="button"
                    onClick={handleCloneClasses}
                    disabled={cloning}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[11px] rounded-lg shadow-xs cursor-pointer active:scale-95 transition-all whitespace-nowrap"
                  >
                    {cloning ? 'Cloning...' : '⚡ 1-Click Clone'}
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* ── Empty State / Quick Class Picker Guide ── */}
      {!selectedFromClassId && (
        <div className="max-w-7xl mx-auto bg-white rounded-3xl border border-slate-200/80 p-10 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-inner">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-slate-800 mb-1">
            Select a Class to Begin Academic Year Rollover
          </h3>
          <p className="text-xs font-medium text-slate-500 max-w-md mx-auto mb-6">
            Choose a Source Academic Year and Class from the panel above to review students, marks averages, and promote them with zero data loss.
          </p>
          {fromClasses.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                Quick Select Class for Session {fromYear}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
                {fromClasses.map(cls => (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => setSelectedFromClassId(cls.id)}
                    className="px-3.5 py-2 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:text-indigo-700 transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
                  >
                    <span>{cls.name} {cls.section ? `- ${cls.section}` : ''}</span>
                    <span className="px-1.5 py-0.5 bg-white border border-slate-200 text-[10px] text-slate-500 font-extrabold rounded-md">
                      {cls._count?.students || 0}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Students Review Table & Action Bar ── */}
      {selectedFromClassId && (
        <div className="max-w-7xl mx-auto">
          {/* Action Stats & Filters */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 mb-4 flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Quick Metrics Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                Total: <strong className="text-slate-900">{metrics.total}</strong>
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Promoted: <strong>{metrics.promote}</strong>
              </span>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Detained: <strong>{metrics.detain}</strong>
              </span>
              <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200 flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5" /> Alumni: <strong>{metrics.graduate}</strong>
              </span>
              <span className="text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" /> Left / TC: <strong>{metrics.tc}</strong>
              </span>
            </div>

            {/* Quick Toolbar */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-56">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search student..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <button
                onClick={handlePromoteAll}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer whitespace-nowrap"
              >
                Promote All
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                    <th className="py-3.5 px-4 w-12 text-center">#</th>
                    <th className="py-3.5 px-4">Student Info</th>
                    <th className="py-3.5 px-4">Roll No / ID</th>
                    <th className="py-3.5 px-4">Performance</th>
                    <th className="py-3.5 px-4 w-72">Promotion Action</th>
                    <th className="py-3.5 px-4">Target Class</th>
                    <th className="py-3.5 px-4">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingStudents ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-slate-400">
                        <div className="animate-spin w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                        <p className="text-xs font-bold text-slate-500">Loading students for promotion...</p>
                      </td>
                    </tr>
                  ) : filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-slate-400">
                        <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="text-sm font-bold text-slate-600">No students found</p>
                        <p className="text-xs text-slate-400 mt-1">This class currently has no active enrolled students.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student, idx) => {
                      const photo = getPhotoUrl(student.photoUrl);
                      return (
                        <tr
                          key={student.id}
                          className={`hover:bg-slate-50/60 transition-colors ${
                            student.action === 'PROMOTE'
                              ? 'bg-white'
                              : student.action === 'DETAIN'
                              ? 'bg-amber-50/30'
                              : student.action === 'GRADUATE'
                              ? 'bg-purple-50/30'
                              : 'bg-rose-50/30'
                          }`}
                        >
                          {/* S.No */}
                          <td className="py-3.5 px-4 text-center font-bold text-xs text-slate-400">
                            {idx + 1}
                          </td>

                          {/* Student Info */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                                {photo ? (
                                  <img
                                    src={photo}
                                    alt={student.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-sm font-black text-indigo-600">
                                    {student.name ? student.name[0].toUpperCase() : 'S'}
                                  </span>
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 text-sm leading-tight">
                                  {student.name}
                                </p>
                                {student.phone && (
                                  <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                                    {student.phone}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Roll No */}
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-1 bg-slate-100 border border-slate-200/80 rounded-lg text-xs font-mono font-bold text-slate-700">
                              {student.rollNo || '–'}
                            </span>
                          </td>

                          {/* Performance Indicator */}
                          <td className="py-3.5 px-4">
                            {student.averagePercentage !== null ? (
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
                                  student.averagePercentage >= 60
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : student.averagePercentage >= 40
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {student.averagePercentage}% Avg
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 font-medium">
                                Enrolled
                              </span>
                            )}
                          </td>

                          {/* Promotion Action Selector */}
                          <td className="py-3.5 px-4">
                            <select
                              value={student.action}
                              onChange={e =>
                                handleStudentActionChange(
                                  student.id,
                                  e.target.value as any
                                )
                              }
                              className={`w-full py-1.5 px-3 rounded-xl text-xs font-extrabold border transition-all cursor-pointer shadow-2xs ${
                                student.action === 'PROMOTE'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : student.action === 'DETAIN'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : student.action === 'GRADUATE'
                                  ? 'bg-purple-50 text-purple-800 border-purple-200'
                                  : 'bg-rose-50 text-rose-800 border-rose-200'
                              }`}
                            >
                              <option value="PROMOTE">🟢 Promote to Next Class</option>
                              <option value="DETAIN">🟡 Detain (Repeat in {toYear})</option>
                              <option value="GRADUATE">🎓 Graduated / Passed Out (Alumni)</option>
                              <option value="TC_LEAVE">🔴 Left School (TC Issued)</option>
                            </select>
                          </td>

                          {/* Target Class Selection */}
                          <td className="py-3.5 px-4">
                            {student.action === 'PROMOTE' || student.action === 'DETAIN' ? (
                              <select
                                value={student.targetClassId}
                                onChange={e =>
                                  handleStudentTargetClassChange(student.id, e.target.value)
                                }
                                className="w-full py-1.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-2xs"
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
                                {student.action === 'GRADUATE' ? 'Alumni (No Class)' : 'Inactive (TC)'}
                              </span>
                            )}
                          </td>

                          {/* Remarks */}
                          <td className="py-3.5 px-4">
                            <input
                              type="text"
                              placeholder="Optional note..."
                              value={student.remarks}
                              onChange={e => handleStudentRemarksChange(student.id, e.target.value)}
                              className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
        </div>
      )}

      {/* ── Sticky Bottom Execution Bar ── */}
      {selectedFromClassId && students.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-xl p-4 z-30">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  Ready to execute promotion for{' '}
                  <span className="text-indigo-600 font-black">
                    {selectedFromClassObj?.name} {selectedFromClassObj?.section}
                  </span>{' '}
                  ({fromYear} → {toYear})
                </p>
                <p className="text-xs text-slate-500 font-medium">
                  {metrics.promote} to be promoted, {metrics.detain} detained, {metrics.graduate} graduated, {metrics.tc} left.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={submitting || metrics.total === 0}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-indigo-500/25 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              Confirm & Execute Promotion
            </button>
          </div>
        </div>
      )}

      {/* ── Confirmation Modal ── */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-black text-slate-900 text-center mb-2">
              Confirm Academic Year Rollover
            </h3>
            <p className="text-xs font-medium text-slate-500 text-center mb-6">
              You are about to promote students from <strong>{fromYear}</strong> to{' '}
              <strong>{toYear}</strong>. All previous attendance and exam records will remain safe and permanently intact in the system history.
            </p>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2.5 mb-6 text-xs font-bold text-slate-700">
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
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecutePromotion}
                disabled={submitting}
                className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Executing...' : 'Yes, Execute Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Promotion History Modal ── */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-100 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <History className="w-5 h-5" />
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  Academic Promotion Audit History
                </h3>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              {loadingHistory ? (
                <div className="py-16 text-center text-slate-400">
                  <div className="animate-spin w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-xs font-bold text-slate-500">Loading audit trail...</p>
                </div>
              ) : historyLogs.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <p className="text-sm font-bold text-slate-500">No promotion history recorded yet.</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Student</th>
                      <th className="py-2.5 px-3">From</th>
                      <th className="py-2.5 px-3">To</th>
                      <th className="py-2.5 px-3">Action</th>
                      <th className="py-2.5 px-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historyLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-medium text-slate-500">
                          {new Date(log.promotedAt).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {log.student?.user?.name || 'Unknown'}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-600">
                          {log.fromClassName} ({log.fromAcademicYear})
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-600">
                          {log.toClassName ? `${log.toClassName} (${log.toAcademicYear})` : '–'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
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
                        <td className="py-2.5 px-3 text-slate-400 italic">
                          {log.remarks || '–'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPromotionPage;
