import React, { useEffect, useState, useMemo } from 'react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { 
  School, User, Users, Plus, Edit3, Search, Filter, 
  GraduationCap, Calendar, Sparkles, CheckCircle2, 
  AlertCircle, ArrowRight, LayoutGrid, List, RefreshCw,
  X, Check, ShieldCheck, ChevronRight, UserCheck, BookOpen
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { DataCache } from '../../services/dataCache';

// Dynamic Color Theme Generator per Class/Grade
const getClassTheme = (name: string) => {
  const lower = (name || '').toLowerCase();
  if (lower.includes('nur') || lower.includes('lkg') || lower.includes('ukg') || lower.includes('pp')) {
    return {
      gradient: 'from-pink-500 via-rose-500 to-red-500',
      softBg: 'bg-pink-50/90 dark:bg-pink-950/20',
      border: 'border-pink-200 dark:border-pink-900/40',
      text: 'text-pink-700 dark:text-pink-300',
      badge: 'bg-pink-100 text-pink-800 dark:bg-pink-900/60 dark:text-pink-200',
      iconBg: 'bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-pink-500/25',
      accentGlow: 'shadow-pink-500/10',
      progressFill: 'bg-gradient-to-r from-pink-500 to-rose-500'
    };
  }
  if (lower.includes('1') || lower.includes('2') || lower.includes('3')) {
    return {
      gradient: 'from-blue-500 via-indigo-500 to-cyan-500',
      softBg: 'bg-blue-50/90 dark:bg-blue-950/20',
      border: 'border-blue-200 dark:border-blue-900/40',
      text: 'text-blue-700 dark:text-blue-300',
      badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200',
      iconBg: 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-blue-500/25',
      accentGlow: 'shadow-blue-500/10',
      progressFill: 'bg-gradient-to-r from-blue-500 to-indigo-600'
    };
  }
  if (lower.includes('4') || lower.includes('5') || lower.includes('6')) {
    return {
      gradient: 'from-violet-500 via-purple-500 to-indigo-600',
      softBg: 'bg-purple-50/90 dark:bg-purple-950/20',
      border: 'border-purple-200 dark:border-purple-900/40',
      text: 'text-purple-700 dark:text-purple-300',
      badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200',
      iconBg: 'bg-gradient-to-br from-purple-600 to-violet-700 text-white shadow-purple-500/25',
      accentGlow: 'shadow-purple-500/10',
      progressFill: 'bg-gradient-to-r from-purple-500 to-indigo-600'
    };
  }
  if (lower.includes('7') || lower.includes('8')) {
    return {
      gradient: 'from-amber-500 via-orange-500 to-amber-600',
      softBg: 'bg-amber-50/90 dark:bg-amber-950/20',
      border: 'border-amber-200 dark:border-amber-900/40',
      text: 'text-amber-800 dark:text-amber-300',
      badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200',
      iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-amber-500/25',
      accentGlow: 'shadow-amber-500/10',
      progressFill: 'bg-gradient-to-r from-amber-500 to-orange-500'
    };
  }
  // 9th, 10th or higher
  return {
    gradient: 'from-emerald-500 via-teal-500 to-cyan-600',
    softBg: 'bg-emerald-50/90 dark:bg-emerald-950/20',
    border: 'border-emerald-200 dark:border-emerald-900/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200',
    iconBg: 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-emerald-500/25',
    accentGlow: 'shadow-emerald-500/10',
    progressFill: 'bg-gradient-to-r from-emerald-500 to-teal-600'
  };
};

export const ClassManagementPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState<'all' | 'assigned' | 'unassigned'>('all');

  // Form modal states
  const [showModal, setShowModal] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [section, setSection] = useState('');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [classTeacherId, setClassTeacherId] = useState('');
  const [capacity, setCapacity] = useState(40);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchInitialData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      const [cachedClasses, cachedTeachers] = await Promise.all([
        DataCache.get('classes', forceRefresh),
        DataCache.get('teachers', forceRefresh)
      ]);
      if (cachedClasses) {
        setClasses(Array.isArray(cachedClasses) ? cachedClasses : (cachedClasses.data || []));
      }
      if (cachedTeachers) {
        setTeachers(Array.isArray(cachedTeachers) ? cachedTeachers : (cachedTeachers.data || []));
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load class directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Filtered classes calculation
  const filteredClasses = useMemo(() => {
    return classes.filter((cls) => {
      const matchSearch =
        cls.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cls.section?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cls.academicYear?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cls.classTeacher?.user?.name?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

      if (selectedTeacherFilter === 'assigned') {
        return !!cls.classTeacherId;
      }
      if (selectedTeacherFilter === 'unassigned') {
        return !cls.classTeacherId;
      }
      return true;
    });
  }, [classes, searchQuery, selectedTeacherFilter]);

  // Aggregate statistics
  const stats = useMemo(() => {
    const totalClasses = classes.length;
    const totalStudents = classes.reduce((acc, c) => acc + (c._count?.students || 0), 0);
    const classesWithTeacher = classes.filter((c) => !!c.classTeacherId).length;
    const activeAcademicYear = classes[0]?.academicYear || '2026-2027';
    return {
      totalClasses,
      totalStudents,
      classesWithTeacher,
      unassignedTeachers: totalClasses - classesWithTeacher,
      activeAcademicYear
    };
  }, [classes]);

  const openCreateModal = () => {
    setEditingClassId(null);
    setName('');
    setSection('A');
    setAcademicYear(stats.activeAcademicYear || '2026-2027');
    setClassTeacherId('');
    setCapacity(40);
    setShowModal(true);
  };

  const openEditModal = (cls: any) => {
    setEditingClassId(cls.id);
    setName(cls.name);
    setSection(cls.section || 'A');
    setAcademicYear(cls.academicYear || '2026-2027');
    setClassTeacherId(cls.classTeacherId || '');
    setCapacity(cls.capacity || 40);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingClassId) {
        await api.put(`/api/classes/${editingClassId}`, {
          name,
          section,
          academicYear,
          classTeacherId: classTeacherId || null,
          capacity: Number(capacity),
        });
        toast.success('Class details updated successfully!');
      } else {
        await api.post('/api/classes', {
          name,
          section,
          academicYear,
          classTeacherId: classTeacherId || null,
          capacity: Number(capacity),
        });
        toast.success('New class registered successfully!');
      }
      setShowModal(false);
      setName('');
      setSection('');
      setEditingClassId(null);
      DataCache.invalidate('classes');
      fetchInitialData(true);
    } catch (error: any) {
      toast.error(error.message || 'Error saving class');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/20 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      
      {/* ============================================================ */}
      {/* HERO BANNER SECTION (SUPER COLORFUL & PROFESSIONAL)          */}
      {/* ============================================================ */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white shadow-xl">
        {/* Glow Spheres & Watermarks */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
          <School className="w-64 h-64 text-white" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-200/90 mb-3">
            <Link to="/dashboard" className="hover:text-white transition-colors flex items-center gap-1">
              <span>Dashboard</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-white">Classes & Sections</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-inner">
                  <School className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                      Classes Directory
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 backdrop-blur-md">
                      Academic Year {stats.activeAcademicYear}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-blue-100/80 font-medium mt-1">
                    Manage grades, sections, student capacity, and assigned class teachers
                  </p>
                </div>
              </div>
            </div>

            {/* Top Action Buttons */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => fetchInitialData(true)}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all backdrop-blur-md cursor-pointer"
                title="Refresh Directory"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Class</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MAIN CONTAINER                                               */}
      {/* ============================================================ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 w-full">
        
        {/* ============================================================ */}
        {/* 4 VIBRANT COLORFUL STAT CARDS                                */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Total Classes */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-indigo-100 dark:border-indigo-900/40 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-bl-3xl group-hover:scale-110 transition-transform" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Classes</p>
                <h3 className="text-2xl font-black text-indigo-700 dark:text-indigo-300 mt-1">
                  {stats.totalClasses}
                </h3>
                <p className="text-[11px] font-bold text-slate-500 mt-0.5">Pre-Primary to 10th</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <School className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Enrolled Students */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-900/40 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-3xl group-hover:scale-110 transition-transform" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Students</p>
                <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {stats.totalStudents}
                </h3>
                <p className="text-[11px] font-bold text-emerald-600/80 mt-0.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Enrolled across classes
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Teachers Assigned */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-amber-100 dark:border-amber-900/40 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-bl-3xl group-hover:scale-110 transition-transform" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Class Teachers</p>
                <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                  {stats.classesWithTeacher} / {stats.totalClasses}
                </h3>
                <p className="text-[11px] font-bold text-amber-700/80 mt-0.5">
                  {stats.unassignedTeachers > 0 ? `${stats.unassignedTeachers} Needs assignment` : 'All assigned'}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/25">
                <UserCheck className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Academic Session */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-purple-100 dark:border-purple-900/40 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-bl-3xl group-hover:scale-110 transition-transform" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Academic Year</p>
                <h3 className="text-xl font-black text-purple-700 dark:text-purple-300 mt-1">
                  {stats.activeAcademicYear}
                </h3>
                <p className="text-[11px] font-bold text-slate-500 mt-0.5">Active Academic Session</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/25">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
          </div>

        </div>

        {/* ============================================================ */}
        {/* SEARCH & FILTER CONTROLS BAR                                 */}
        {/* ============================================================ */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-3 sm:p-4 border border-slate-200/80 dark:border-gray-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by class name, section, teacher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Teacher Assignment Filter & View Mode */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-gray-800 rounded-xl text-xs font-bold">
              <button
                onClick={() => setSelectedTeacherFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedTeacherFilter === 'all'
                    ? 'bg-white dark:bg-gray-900 text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-indigo-600'
                }`}
              >
                All ({classes.length})
              </button>
              <button
                onClick={() => setSelectedTeacherFilter('assigned')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedTeacherFilter === 'assigned'
                    ? 'bg-white dark:bg-gray-900 text-emerald-600 shadow-sm'
                    : 'text-slate-600 hover:text-emerald-600'
                }`}
              >
                Assigned ({stats.classesWithTeacher})
              </button>
              <button
                onClick={() => setSelectedTeacherFilter('unassigned')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedTeacherFilter === 'unassigned'
                    ? 'bg-white dark:bg-gray-900 text-amber-600 shadow-sm'
                    : 'text-slate-600 hover:text-amber-600'
                }`}
              >
                Unassigned ({stats.unassignedTeachers})
              </button>
            </div>

            {/* View Switcher: Table vs Cards */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-gray-800 rounded-xl">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-gray-900 text-indigo-600 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-gray-900 text-indigo-600 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Grid Cards View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

        {/* ============================================================ */}
        {/* VIEW 1: VIBRANT & COLORFUL TABLE VIEW                        */}
        {/* ============================================================ */}
        {viewMode === 'table' && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-slate-200/80 dark:border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-gray-800/60 border-b border-slate-200 dark:border-gray-800 text-[11px] font-black uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3.5 text-center w-14">#</th>
                    <th className="px-5 py-3.5">Class Info</th>
                    <th className="px-5 py-3.5">Academic Year</th>
                    <th className="px-5 py-3.5">Students Enrolled</th>
                    <th className="px-5 py-3.5">Class Teacher</th>
                    <th className="px-5 py-3.5 text-center w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-gray-800 text-xs font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center">
                        <LoadingSpinner size="lg" />
                        <p className="text-xs text-slate-400 font-bold mt-2">Loading classes directory...</p>
                      </td>
                    </tr>
                  ) : filteredClasses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-slate-400 font-bold">
                        {searchQuery ? 'No classes matched your search criteria.' : 'No classes configured yet.'}
                      </td>
                    </tr>
                  ) : (
                    filteredClasses.map((cls, idx) => {
                      const theme = getClassTheme(cls.name);
                      const studentCount = cls._count?.students || 0;
                      const capacityLimit = cls.capacity || 40;
                      const hasTeacher = !!cls.classTeacherId;

                      return (
                        <tr 
                          key={cls.id} 
                          className="hover:bg-slate-50/70 dark:hover:bg-gray-800/40 transition-colors group"
                        >
                          {/* Index */}
                          <td className="px-5 py-4 text-center font-bold text-slate-400">
                            {idx + 1}
                          </td>

                          {/* Class Info */}
                          <td className="px-5 py-4">
                            <Link 
                              to={`/classes/${cls.id}`} 
                              className="flex items-center gap-3.5 group/link"
                            >
                              <div className={`w-11 h-11 rounded-2xl ${theme.iconBg} flex items-center justify-center font-black text-sm shrink-0 transition-transform group-hover/link:scale-105 shadow-md`}>
                                <School className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white group-hover/link:text-indigo-600 transition-colors flex items-center gap-1.5">
                                  <span>{cls.name}-{cls.section}</span>
                                </h4>
                                <span className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-0.5 mt-0.5">
                                  <span>View details</span>
                                  <ArrowRight className="w-3 h-3" />
                                </span>
                              </div>
                            </Link>
                          </td>

                          {/* Academic Year */}
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black uppercase bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200/80 shadow-xs">
                              <Calendar className="w-3 h-3 text-fuchsia-600" />
                              <span>{cls.academicYear}</span>
                            </span>
                          </td>

                          {/* Students Count with Progress */}
                          <td className="px-5 py-4">
                            <div className="flex flex-col gap-1.5 max-w-[140px]">
                              <div className="flex items-center justify-between text-xs font-extrabold text-slate-700 dark:text-slate-300">
                                <span className="flex items-center gap-1.5">
                                  <Users className="w-3.5 h-3.5 text-indigo-500" />
                                  <span>{studentCount} Students</span>
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${theme.progressFill}`}
                                  style={{ width: `${Math.min(100, Math.round((studentCount / capacityLimit) * 100))}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Class Teacher */}
                          <td className="px-5 py-4">
                            {hasTeacher ? (
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-200/70">
                                  👨‍🏫
                                </div>
                                <div>
                                  <p className="font-extrabold text-xs text-slate-800 dark:text-white">
                                    {cls.classTeacher?.user?.name}
                                  </p>
                                  {cls.classTeacher?.user?.phone && (
                                    <p className="text-[10px] text-slate-400 font-mono">
                                      {cls.classTeacher?.user?.phone}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                                <span>No Teacher Assigned</span>
                              </span>
                            )}
                          </td>

                          {/* Actions (ONLY EDIT, DELETE REMOVED AS REQUESTED) */}
                          <td className="px-5 py-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => openEditModal(cls)}
                                className="p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                                title="Edit Class"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW 2: VIBRANT & COLORFUL GRID CARDS VIEW                   */}
        {/* ============================================================ */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {loading ? (
              <div className="col-span-full py-16 text-center">
                <LoadingSpinner size="lg" />
                <p className="text-xs text-slate-400 font-bold mt-2">Loading classes...</p>
              </div>
            ) : filteredClasses.length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-400 font-bold">
                No classes found matching your criteria.
              </div>
            ) : (
              filteredClasses.map((cls) => {
                const theme = getClassTheme(cls.name);
                const studentCount = cls._count?.students || 0;
                const capacityLimit = cls.capacity || 40;
                const hasTeacher = !!cls.classTeacherId;

                return (
                  <div
                    key={cls.id}
                    className="bg-white dark:bg-gray-900 rounded-3xl border border-slate-200/80 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group"
                  >
                    {/* Vibrant Top Header */}
                    <div className={`p-5 bg-gradient-to-r ${theme.gradient} text-white relative overflow-hidden`}>
                      <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />
                      
                      <div className="flex items-center justify-between relative z-10">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-white">
                          Academic {cls.academicYear}
                        </span>
                        
                        <button
                          onClick={() => openEditModal(cls)}
                          className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white flex items-center justify-center transition-colors cursor-pointer"
                          title="Edit Class"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="mt-4 flex items-center gap-3 relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-white text-slate-800 flex items-center justify-center font-black text-base shadow-md">
                          <School className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-white leading-tight">
                            Class {cls.name}-{cls.section}
                          </h3>
                          <p className="text-xs text-white/80 font-medium">Standard & Section</p>
                        </div>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                      
                      {/* Student Enrollment Progress */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-gray-800/50 border border-slate-100 dark:border-gray-800 space-y-2">
                        <div className="flex items-center justify-between text-xs font-black">
                          <span className="text-slate-500 uppercase tracking-wider text-[10px]">Enrollment</span>
                          <span className="text-slate-800 dark:text-white font-extrabold">
                            {studentCount} / {capacityLimit} Students
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-700 ${theme.progressFill}`}
                            style={{ width: `${Math.min(100, Math.round((studentCount / capacityLimit) * 100))}%` }}
                          />
                        </div>
                      </div>

                      {/* Class Teacher Card */}
                      <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-gray-800/50 border border-slate-100 dark:border-gray-800">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm shrink-0">
                          👨‍🏫
                        </div>
                        <div className="overflow-hidden flex-1">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Class Teacher</p>
                          <p className="text-xs font-black text-slate-800 dark:text-white truncate">
                            {hasTeacher ? cls.classTeacher?.user?.name : 'Not Assigned'}
                          </p>
                        </div>
                        {!hasTeacher && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                            Pending
                          </span>
                        )}
                      </div>

                      {/* Card Footer: View Details Action */}
                      <Link
                        to={`/classes/${cls.id}`}
                        className={`w-full py-2.5 rounded-xl bg-gradient-to-r ${theme.gradient} text-white font-black text-xs text-center shadow-md hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer`}
                      >
                        <span>View Class Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>

                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

      </div>

      {/* ============================================================ */}
      {/* ADD / EDIT CLASS MODAL                                       */}
      {/* ============================================================ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-6 md:p-8 border border-slate-100 dark:border-gray-800 space-y-6">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                  <School className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {editingClassId ? 'Edit Class Details' : 'Register New Class'}
                  </h3>
                  <p className="text-xs text-slate-400">Configure grade, section and class teacher</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Class / Grade Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 5th, PP1"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Section *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. A, B"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Academic Year *
                  </label>
                  <input
                    type="text"
                    required
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Max Capacity
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Assigned Class Teacher
                </label>
                <select
                  value={classTeacherId}
                  onChange={(e) => setClassTeacherId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                >
                  <option value="">-- No Class Teacher Assigned --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.user?.name || 'Teacher'} ({t.employeeId || 'ID'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-extrabold shadow-md hover:scale-[1.02] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingClassId ? 'Save Changes' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ClassManagementPage;
