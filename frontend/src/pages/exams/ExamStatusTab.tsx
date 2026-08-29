import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { formatExamOptionLabel } from '../../utils/formatters';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Shield, Lock, CheckCircle2, Edit3, XCircle, ChevronDown, Check, Minus } from 'lucide-react';
import toast from 'react-hot-toast';

export const ExamStatusTab: React.FC<{ exams: any[] }> = ({ exams }) => {
  const [loading, setLoading] = useState(false);
  const [examData, setExamData] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');

  useEffect(() => {
    const fetchLatestExams = async () => {
      setLoading(true);
      try {
        const res: any = await api.get('/api/exams/status/all');
        const data = res.data.data || res.data || [];
        setExamData(data);
        if (data.length > 0 && !selectedExamId) {
          setSelectedExamId(data[0].id);
        }
      } catch (error) {
        console.error(error);
        toast.error('Failed to load exam status');
      } finally {
        setLoading(false);
      }
    };
    fetchLatestExams();
  }, [exams]);

  if (loading) return <LoadingSpinner size="lg" className="h-[50vh]" />;

  const activeExamData = examData.find(e => e.id === selectedExamId) || null;

  // Derive all unique subjects across all classes in the selected exam
  const allSubjectNames: string[] = [];
  if (activeExamData?.classes) {
    for (const cls of activeExamData.classes) {
      const subjects = cls.subjectStats?.totalSubjects || [];
      for (const sub of subjects) {
        if (!sub.name) continue;
        const normalizedName = sub.name.trim().toUpperCase();
        if (!allSubjectNames.includes(normalizedName)) {
          allSubjectNames.push(normalizedName);
        }
      }
    }
    // We no longer sort alphabetically. We keep the order as they were inserted (which is derived from the first class's subjectStats, preserving original order)
    // allSubjectNames.sort((a, b) => a.localeCompare(b));
  }

  let frozenClasses: string[] = [];
  if (activeExamData?.frozenClasses) {
    try {
      frozenClasses = typeof activeExamData.frozenClasses === 'string'
        ? JSON.parse(activeExamData.frozenClasses)
        : activeExamData.frozenClasses;
    } catch (e) {}
  }
  const classesWithMarks = activeExamData?.classesWithMarks || [];
  const isPublished = activeExamData?.admitCardSettings?.progressCardPublished === true;

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Header & Exam Dropdown */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm">
        <div className="w-full relative">
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm cursor-pointer truncate pr-8"
          >
            <option value="" disabled>Select an Exam...</option>
            {examData.map(e => (
              <option key={e.id} value={e.id} className="text-xs font-medium">
                {formatExamOptionLabel(e.name)}{e.term?.trim() ? ` (${e.term.trim()})` : ''}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden w-full">
        {activeExamData ? (
          <div className="w-full overflow-x-auto">
            {(!activeExamData.classes || activeExamData.classes.length === 0) ? (
              <div className="p-10 flex flex-col items-center justify-center text-center">
                <Shield className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-xs font-bold text-slate-500">No classes assigned to this exam yet.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-max">
                <thead>
                  <tr className="bg-indigo-50 dark:bg-indigo-950/40">
                    {/* Sticky Class column */}
                    <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/40 whitespace-nowrap sticky left-0 bg-indigo-50 dark:bg-indigo-950/40 z-10 min-w-[130px]">
                      Class / Section
                    </th>
                    {/* Subject columns */}
                    {allSubjectNames.map(subName => (
                      <th key={subName} className="px-3 py-3 text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-center whitespace-nowrap min-w-[100px]">
                        {subName}
                      </th>
                    ))}
                    {/* Progress column */}
                    <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-center whitespace-nowrap min-w-[90px]">
                      Progress
                    </th>
                    {/* Status column */}
                    <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-center whitespace-nowrap min-w-[110px]">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(activeExamData.classes || []).map((cls: any, rowIdx: number) => {
                    const hasMarks = classesWithMarks.includes(cls.id);
                    const isExplicitlyFrozen = frozenClasses.includes(cls.id);
                    const stats = cls.subjectStats || { totalSubjects: [], enteredSubjects: [], pendingSubjects: [], progress: 0 };
                    const progress = Math.round(stats.progress || 0);

                    // Build a quick Set for O(1) lookup
                    const enteredSet = new Set<string>((stats.enteredSubjects || []).map((s: any) => s.name?.trim().toUpperCase()));
                    const classSubjectNames = new Set<string>((stats.totalSubjects || []).map((s: any) => s.name?.trim().toUpperCase()));

                    const totalUnique = classSubjectNames.size;
                    const enteredUnique = enteredSet.size;
                    const calculatedProgress = totalUnique === 0 ? 0 : Math.round((enteredUnique / totalUnique) * 100);

                    const rowBg = rowIdx % 2 === 0
                      ? 'bg-white dark:bg-slate-900'
                      : 'bg-slate-50/60 dark:bg-slate-800/30';

                    return (
                      <tr key={cls.id} className={`${rowBg} hover:bg-indigo-50/40 dark:hover:bg-indigo-900/10 transition-colors`}>
                        {/* Class name - sticky */}
                        <td className={`px-4 py-3 border border-slate-200 dark:border-slate-700 sticky left-0 z-10 ${rowBg}`}>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-extrabold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/40 whitespace-nowrap">
                            {cls.name} – {cls.section}
                          </span>
                        </td>

                        {/* Subject cells */}
                        {allSubjectNames.map(subName => {
                          const applicable = classSubjectNames.has(subName);
                          const entered = enteredSet.has(subName);

                          if (!applicable) {
                            return (
                              <td key={subName} className="px-3 py-3 border border-slate-200 dark:border-slate-700 text-center">
                                <Minus className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 mx-auto" />
                              </td>
                            );
                          }

                          return (
                            <td key={subName} className="px-3 py-3 border border-slate-200 dark:border-slate-700 text-center">
                              {entered ? (
                                <div className="flex flex-col items-center gap-0.5">
                                  <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto">
                                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 font-bold" strokeWidth={3} />
                                  </div>
                                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Done</span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center gap-0.5">
                                  <div className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center mx-auto">
                                    <XCircle className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                                  </div>
                                  <span className="text-[9px] font-bold text-rose-500 dark:text-rose-400 uppercase tracking-wider">Pending</span>
                                </div>
                              )}
                            </td>
                          );
                        })}

                        {/* Progress cell */}
                        <td className="px-4 py-3 border border-slate-200 dark:border-slate-700 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden mx-auto" style={{ maxWidth: 70 }}>
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${calculatedProgress}%`,
                                  backgroundColor: calculatedProgress === 100 ? '#10b981' : calculatedProgress > 0 ? '#6366f1' : '#e2e8f0'
                                }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                              {enteredUnique}/{totalUnique}
                            </span>
                          </div>
                        </td>

                        {/* Status badge cell */}
                        <td className="px-3 py-3 border border-slate-200 dark:border-slate-700 text-center">
                          {isExplicitlyFrozen ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                              <Lock className="w-3 h-3" /> Frozen
                            </span>
                          ) : (isPublished && hasMarks) ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40">
                              <CheckCircle2 className="w-3 h-3" /> Published
                            </span>
                          ) : hasMarks ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
                              <Edit3 className="w-3 h-3" /> Draft
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40">
                              <XCircle className="w-3 h-3" /> Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div className="p-10 flex flex-col items-center justify-center text-center">
            <Shield className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-xs font-bold text-slate-500">Please select an exam to view status.</p>
          </div>
        )}
      </div>

      {/* Legend */}
      {activeExamData && allSubjectNames.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 px-1 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide text-[10px]">Legend:</span>
          <span className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
              <Check className="w-3 h-3 text-emerald-600" strokeWidth={3} />
            </div>
            Marks Entered
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center">
              <XCircle className="w-3 h-3 text-rose-500" />
            </div>
            Pending Entry
          </span>
          <span className="flex items-center gap-1.5">
            <Minus className="w-4 h-4 text-slate-300" />
            Not Applicable
          </span>
        </div>
      )}
    </div>
  );
};
