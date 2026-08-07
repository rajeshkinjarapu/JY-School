import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { formatExamOptionLabel } from '../../utils/formatters';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Shield, Lock, CheckCircle2, Edit3, XCircle, ChevronDown } from 'lucide-react';
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

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Header & Exam Dropdown */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-3">
        <h2 className="text-lg sm:text-xl font-black bg-gradient-to-r from-fuchsia-600 to-purple-600 bg-clip-text text-transparent">
          Status Overview
        </h2>

        <div className="w-full relative">
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-sm cursor-pointer truncate pr-8"
          >
            <option value="" disabled>Select an Exam...</option>
            {examData.map(e => (
              <option key={e.id} value={e.id} className="text-xs font-medium">{formatExamOptionLabel(e.name)} ({e.term})</option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800 overflow-hidden w-full">
        {activeExamData ? (
          <div className="w-full overflow-hidden">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider font-extrabold border-b border-slate-100 dark:border-slate-800">
                  <th className="px-3.5 py-3 w-1/2">Class / Section</th>
                  <th className="px-3.5 py-3 w-1/2 text-right">Current Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {(() => {
                  let frozenClasses: string[] = [];
                  if (activeExamData.frozenClasses) {
                    try {
                      frozenClasses = typeof activeExamData.frozenClasses === 'string' ? JSON.parse(activeExamData.frozenClasses) : activeExamData.frozenClasses;
                    } catch(e) {}
                  }
                  const classesWithMarks = activeExamData.classesWithMarks || [];
                  const isPublished = activeExamData.admitCardSettings?.progressCardPublished === true;

                  if (!activeExamData.classes || activeExamData.classes.length === 0) {
                    return (
                      <tr>
                        <td colSpan={2} className="p-8 text-center text-slate-400 text-xs font-bold">
                          No classes assigned to this exam yet.
                        </td>
                      </tr>
                    );
                  }

                  return (activeExamData.classes || []).map((cls: any) => {
                    const hasMarks = classesWithMarks.includes(cls.id);
                    const isExplicitlyFrozen = frozenClasses.includes(cls.id);

                    return (
                      <tr key={cls.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-3.5 py-3.5">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-extrabold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-800/40">
                            {cls.name} - {cls.section}
                          </span>
                        </td>
                        <td className="px-3.5 py-3.5 flex justify-end">
                          {isExplicitlyFrozen ? (
                            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200/60 dark:border-emerald-800/40 shadow-xs">
                              <Lock className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-black uppercase tracking-wider">Frozen</span>
                            </div>
                          ) : (isPublished && hasMarks) ? (
                            <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-lg border border-blue-200/60 dark:border-blue-800/40 shadow-xs">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-black uppercase tracking-wider">Published</span>
                            </div>
                          ) : hasMarks ? (
                            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-200/60 dark:border-amber-800/40 shadow-xs">
                              <Edit3 className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-black uppercase tracking-wider">Draft</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-lg border border-rose-200/60 dark:border-rose-800/40 shadow-xs">
                              <XCircle className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-black uppercase tracking-wider">Not Entered</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 flex flex-col items-center justify-center text-center">
            <Shield className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-xs font-bold text-slate-500">Please select an exam to view status.</p>
          </div>
        )}
      </div>
    </div>
  );
};
