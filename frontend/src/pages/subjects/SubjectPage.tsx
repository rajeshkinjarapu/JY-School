import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import {
  Plus, BookOpen, Search, LayoutGrid, List, ArrowUpRight,
  Calculator, FlaskConical, Globe2, Languages, Palette, Leaf,
  Atom, Sparkles, GraduationCap, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '../../components/UI/PageHeader';
import { DataCache } from '../../services/dataCache';

interface SubjectPalette {
  cardGlow: string;
  badgeBg: string;
  softPill: string;
  accentText: string;
  hoverBorder: string;
  barGradient: string;
}

const SUBJECT_PALETTES: SubjectPalette[] = [
  {
    cardGlow: 'from-[#F4F0FF] via-[#FAF8FF] to-white',
    badgeBg: 'from-[#8B5CF6] to-[#6D28D9]',
    softPill: 'bg-[#F2EDFF] text-[#5B21B6] border-[#DDD2FF]',
    accentText: 'text-[#5B21B6]',
    hoverBorder: 'hover:border-[#C4B5FD]',
    barGradient: 'from-[#8B5CF6] to-[#6D28D9]',
  },
  {
    cardGlow: 'from-[#EDF4FF] via-[#F6FAFF] to-white',
    badgeBg: 'from-[#3B82F6] to-[#1D4ED8]',
    softPill: 'bg-[#EAF2FF] text-[#1D4ED8] border-[#BFDBFE]',
    accentText: 'text-[#1D4ED8]',
    hoverBorder: 'hover:border-[#93C5FD]',
    barGradient: 'from-[#3B82F6] to-[#1D4ED8]',
  },
  {
    cardGlow: 'from-[#E8FBF2] via-[#F4FDF9] to-white',
    badgeBg: 'from-[#10B981] to-[#059669]',
    softPill: 'bg-[#E5FAEF] text-[#047857] border-[#A7F3D0]',
    accentText: 'text-[#047857]',
    hoverBorder: 'hover:border-[#6EE7B7]',
    barGradient: 'from-[#10B981] to-[#059669]',
  },
  {
    cardGlow: 'from-[#FFF0F4] via-[#FFF8FA] to-white',
    badgeBg: 'from-[#F43F5E] to-[#E11D48]',
    softPill: 'bg-[#FFEFF3] text-[#BE123C] border-[#FECDD3]',
    accentText: 'text-[#BE123C]',
    hoverBorder: 'hover:border-[#FDA4AF]',
    barGradient: 'from-[#F43F5E] to-[#E11D48]',
  },
  {
    cardGlow: 'from-[#FFF6E8] via-[#FFFBF4] to-white',
    badgeBg: 'from-[#F59E0B] to-[#D97706]',
    softPill: 'bg-[#FFF5E5] text-[#B45309] border-[#FDE68A]',
    accentText: 'text-[#B45309]',
    hoverBorder: 'hover:border-[#FCD34D]',
    barGradient: 'from-[#F59E0B] to-[#D97706]',
  },
  {
    cardGlow: 'from-[#E9FAFD] via-[#F5FCFE] to-white',
    badgeBg: 'from-[#06B6D4] to-[#0891B2]',
    softPill: 'bg-[#E6FAFC] text-[#0E7490] border-[#A5F3FC]',
    accentText: 'text-[#0E7490]',
    hoverBorder: 'hover:border-[#67E8F9]',
    barGradient: 'from-[#06B6D4] to-[#0891B2]',
  },
];

const getClassRank = (clsName: string = ''): number => {
  const lower = clsName.toLowerCase().trim();
  if (lower.includes('nur')) return 1;
  if (lower.includes('pp1') || lower.includes('pp-1') || lower.includes('lkg')) return 2;
  if (lower.includes('pp2') || lower.includes('pp-2') || lower.includes('ukg')) return 3;
  const m = lower.match(/(\d+)/);
  return m ? 10 + parseInt(m[1], 10) : 999;
};

const getSubjectMeta = (subjectName: string) => {
  const s = subjectName.toUpperCase();
  if (s.includes('MATH')) return { icon: Calculator, category: 'Core Mathematics' };
  if (s.includes('PHYS') && !s.includes('PHYSICAL')) return { icon: Atom, category: 'Physical Science' };
  if (s.includes('CHEM')) return { icon: FlaskConical, category: 'Chemical Science' };
  if (s.includes('BIO') || s.includes('EVS')) return { icon: Leaf, category: 'Life & Nature' };
  if (s.includes('SCI')) return { icon: FlaskConical, category: 'General Science' };
  if (s.includes('ART') || s.includes('CRAFT') || s.includes('DRAW')) return { icon: Palette, category: 'Creative Arts' };
  if (s.includes('SOCIAL') || s.includes('GENERAL') || s.includes('GK')) return { icon: Globe2, category: 'Humanities & GK' };
  if (s.includes('ENG') || s.includes('HINDI') || s.includes('TELUGU')) return { icon: Languages, category: 'Language Arts' };
  return { icon: BookOpen, category: 'Academic Subject' };
};

export const SubjectPage: React.FC = () => {
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [teacherId, setTeacherId] = useState('');

  const fetchData = async (forceRefresh = false) => {
    try {
      const [subRes, teachRes]: any = await Promise.all([
        DataCache.get('subjects', forceRefresh),
        DataCache.get('teachers'),
      ]);
      setSubjects(Array.isArray(subRes) ? subRes : []);
      setTeachers(Array.isArray(teachRes) ? teachRes : []);
    } catch {
      toast.error('Failed to load curriculum data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const subjectSummaries = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    subjects.forEach((sub: any) => {
      const key = (sub.name?.trim() || 'Unknown').toUpperCase();
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(sub);
    });

    return Object.keys(grouped)
      .sort()
      .map((subjectName) => {
        const entries = grouped[subjectName];

        // Sort classes cleanly from Nursery -> PP1 -> PP2 -> 1st..10th
        const sortedClasses = Array.from(
          new Set(
            entries
              .map((e) => (e.class ? `${e.class.name}-${e.class.section}` : null))
              .filter(Boolean) as string[]
          )
        ).sort((a, b) => {
          const rA = getClassRank(a);
          const rB = getClassRank(b);
          if (rA !== rB) return rA - rB;
          return a.localeCompare(b, undefined, { numeric: true });
        });

        const uniqueBaseGrades = Array.from(
          new Set(entries.map((e) => e.class?.name).filter(Boolean) as string[])
        ).sort((a, b) => getClassRank(a) - getClassRank(b));

        const gradeRange =
          uniqueBaseGrades.length === 0
            ? 'Not Mapped'
            : uniqueBaseGrades.length === 1
              ? uniqueBaseGrades[0]
              : `${uniqueBaseGrades[0]} – ${uniqueBaseGrades[uniqueBaseGrades.length - 1]}`;

        const teacherNames = Array.from(
          new Set(
            entries
              .map((e) => e.classSubjectTeachers?.[0]?.teacher?.user?.name)
              .filter(Boolean) as string[]
          )
        );

        const meta = getSubjectMeta(subjectName);

        return {
          subjectName,
          abbr: subjectName.substring(0, 2).toUpperCase(),
          classCount: entries.length,
          sortedClasses,
          gradeRange,
          teacherNames,
          Icon: meta.icon,
          category: meta.category,
        };
      });
  }, [subjects]);

  const filteredSummaries = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return subjectSummaries;
    return subjectSummaries.filter(
      (item) =>
        item.subjectName.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.sortedClasses.some((c) => c.toLowerCase().includes(q)) ||
        item.teacherNames.some((t) => t.toLowerCase().includes(q))
    );
  }, [subjectSummaries, searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await api.post('/api/subjects', { name: name.trim(), teacherId: teacherId || undefined });
      toast.success('Subject created successfully!');
      setShowModal(false);
      setName('');
      setTeacherId('');
      DataCache.invalidate('subjects');
      fetchData(true);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'Error saving subject details');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F4F7FC] text-slate-800 overflow-hidden">
      <PageHeader
        title="Subjects & Curriculum"
        icon={<BookOpen className="w-5 h-5 text-white" />}
        action={
          <button
            type="button"
            onClick={() => {
              setName('');
              setTeacherId('');
              setShowModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-white hover:bg-indigo-50 text-[#1E1B4B] text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 text-[#5B21B6]" />
            <span>New Subject</span>
          </button>
        }
      />

      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="w-full max-w-7xl mx-auto space-y-5 pb-10">

          {/* Clean Compact Workspace Control Strip (No KPI Clutter) */}
          <div className="bg-white/90 backdrop-blur-md border border-[#E2DDF5] rounded-[20px] p-3 sm:p-3.5 shadow-[0_6px_22px_rgba(91,33,182,0.06)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#F4F2FC] border border-[#DDD6FE] text-[#5B21B6] shrink-0">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-black">{filteredSummaries.length} Subjects</span>
              </div>

              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-indigo-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search subjects, categories or classes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#F8FAFF] border border-[#E7E4F6] rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
              <div className="inline-flex items-center bg-[#F3F5FC] p-1 rounded-xl border border-indigo-100">
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === 'cards' ? 'bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] text-white shadow-xs' : 'text-slate-600 hover:text-[#1E1B4B]'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === 'table' ? 'bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] text-white shadow-xs' : 'text-slate-600 hover:text-[#1E1B4B]'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>List</span>
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[22px] border border-indigo-100/80 shadow-xs">
              <LoadingSpinner size="lg" />
              <p className="text-xs font-bold text-slate-400 mt-3 uppercase tracking-wider">Loading curriculum...</p>
            </div>
          ) : filteredSummaries.length === 0 ? (
            <div className="bg-white border border-[#DDD7F3] rounded-[22px] p-14 text-center shadow-xs flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-[#EFEAFE] border border-[#DDD6FE] flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8 text-[#5B21B6]" />
              </div>
              <h3 className="text-lg font-black text-[#1E1B4B] mb-1">No Subjects Found</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm">
                {subjects.length === 0
                  ? 'Click "New Subject" above to add your first curriculum subject.'
                  : 'Try searching with a different keyword.'}
              </p>
            </div>
          ) : viewMode === 'cards' ? (
            /* ── ULTRA-CLEAN MODERN SUBJECT CARDS ── */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredSummaries.map((item, idx) => {
                const pal = SUBJECT_PALETTES[idx % SUBJECT_PALETTES.length];
                const SubjectIcon = item.Icon;

                return (
                  <div
                    key={item.subjectName}
                    onClick={() => navigate('/subjects/' + encodeURIComponent(item.subjectName))}
                    className={`group relative bg-gradient-to-b ${pal.cardGlow} rounded-[22px] border border-[#E5E0FA] ${pal.hoverBorder} shadow-[0_6px_22px_-8px_rgba(91,33,182,0.10)] hover:shadow-[0_18px_36px_-10px_rgba(91,33,182,0.18)] hover:-translate-y-1 transition-all duration-200 overflow-hidden cursor-pointer flex flex-col`}
                  >
                    {/* Top Subtle Accent Bar */}
                    <div className={`h-1.5 w-full bg-gradient-to-r ${pal.barGradient}`} />

                    <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                      {/* Header: Icon Badge + Category + Arrow */}
                      <div className="flex items-start justify-between gap-3">
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${pal.badgeBg} flex items-center justify-center text-white shadow-md shrink-0 group-hover:scale-105 transition-transform`}>
                          <SubjectIcon className="w-6 h-6" />
                        </div>

                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${pal.softPill}`}>
                          {item.abbr} &bull; {item.classCount} {item.classCount === 1 ? 'Sec' : 'Secs'}
                        </span>
                      </div>

                      {/* Subject Title & Category */}
                      <div>
                        <p className={`text-[10px] font-extrabold uppercase tracking-wider ${pal.accentText} opacity-80`}>
                          {item.category}
                        </p>
                        <h3 className="text-base sm:text-[17px] font-black text-[#1E1B4B] tracking-tight leading-snug mt-0.5 truncate">
                          {item.subjectName}
                        </h3>
                      </div>

                      {/* Footer: Grade Span + Open Trigger */}
                      <div className="pt-3 border-t border-indigo-100/70 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-xs font-bold text-slate-600 truncate">
                            {item.gradeRange}
                          </span>
                        </div>

                        <span className={`inline-flex items-center gap-0.5 text-[11px] font-black ${pal.accentText} group-hover:translate-x-0.5 transition-transform shrink-0`}>
                          <span>Open</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ── PURPLE GRID LIST TABLE VIEW ── */
            <div className="bg-white border border-[#DDD7F3] rounded-[20px] overflow-hidden shadow-[0_12px_32px_-6px_rgba(91,33,182,0.10)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs student-grid-table">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#7D3CEF] via-[#6D38EA] to-[#5B21B6] !text-white font-extrabold uppercase text-[11px] tracking-wider">
                      <th className="py-3.5 px-3 w-14 text-center border-r border-white/20 !text-white">#</th>
                      <th className="py-3.5 px-4 text-center border-r border-white/20 !text-white">Code</th>
                      <th className="py-3.5 px-5 text-left border-r border-white/20 !text-white">Subject Name</th>
                      <th className="py-3.5 px-5 text-left border-r border-white/20 !text-white">Category</th>
                      <th className="py-3.5 px-4 text-center border-r border-white/20 !text-white">Sections</th>
                      <th className="py-3.5 px-5 text-left border-r border-white/20 !text-white">Grade Span</th>
                      <th className="py-3.5 px-4 text-center !text-white">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSummaries.map((item, idx) => {
                      const rowBorderBottom = idx === filteredSummaries.length - 1 ? '' : 'border-b border-[#EAE7F6]';
                      return (
                        <tr
                          key={item.subjectName}
                          onClick={() => navigate('/subjects/' + encodeURIComponent(item.subjectName))}
                          className="even:bg-[#FAF9FF] hover:bg-[#F3EFFE]/60 transition-colors bg-white cursor-pointer"
                        >
                          <td className={`py-3 px-3 text-center font-bold text-[#1E1B4B] border-r border-[#EAE7F6] ${rowBorderBottom}`}>
                            {idx + 1}
                          </td>
                          <td className={`py-3 px-4 text-center border-r border-[#EAE7F6] ${rowBorderBottom}`}>
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black text-[#5B21B6] bg-[#EFEAFE] border border-[#DDD6FE] font-mono">
                              {item.abbr}
                            </span>
                          </td>
                          <td className={`py-3 px-5 font-extrabold text-[#1E1B4B] border-r border-[#EAE7F6] ${rowBorderBottom}`}>
                            {item.subjectName}
                          </td>
                          <td className={`py-3 px-5 font-semibold text-slate-600 border-r border-[#EAE7F6] ${rowBorderBottom}`}>
                            {item.category}
                          </td>
                          <td className={`py-3 px-4 text-center font-black text-[#5B21B6] border-r border-[#EAE7F6] ${rowBorderBottom}`}>
                            {item.classCount}
                          </td>
                          <td className={`py-3 px-5 font-bold text-slate-700 border-r border-[#EAE7F6] ${rowBorderBottom}`}>
                            {item.gradeRange}
                          </td>
                          <td className={`py-3 px-4 text-center ${rowBorderBottom}`}>
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#EFEAFE] text-[#5B21B6] font-extrabold text-[11px] hover:bg-[#5B21B6] hover:text-white transition-colors">
                              Open <ArrowUpRight className="w-3.5 h-3.5" />
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Add Subject Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden border border-[#DDD7F3]">
            <div className="px-6 py-4 bg-gradient-to-r from-[#F2EDFF] to-[#EAF2FF] border-b border-indigo-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5B21B6] to-[#7C3AED] text-white flex items-center justify-center shadow-sm">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#1E1B4B]">Add New Subject</h3>
                  <p className="text-[11px] font-semibold text-slate-500">Create a curriculum subject and optionally assign a teacher</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-white/80 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold text-[#5B21B6] uppercase tracking-wider mb-1.5">
                  Subject Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mathematics"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-[#5B21B6] uppercase tracking-wider mb-1.5">
                  Assign Teacher (Optional)
                </label>
                <select
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition cursor-pointer"
                >
                  <option value="">Select Teacher</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.user?.name} ({t.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2.5 justify-end pt-3 border-t border-indigo-50">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-extrabold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-extrabold text-white bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] hover:opacity-95 rounded-xl transition-all cursor-pointer shadow-md disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectPage;
