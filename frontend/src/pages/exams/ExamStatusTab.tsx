import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Shield, Lock, Unlock, CheckCircle2, Edit3, XCircle, Search, ChevronDown } from 'lucide-react';
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

  const toggleFreeze = async (examId: string, classId: string, isCurrentlyFrozen: boolean) => {
    if (!window.confirm(`Are you sure you want to ${isCurrentlyFrozen ? 'unfreeze' : 'freeze'} marks for this class?`)) return;
    
    try {
      await api.post(`/api/exams/${examId}/freeze`, { classId, isFrozen: !isCurrentlyFrozen });
      toast.success(`Marks ${!isCurrentlyFrozen ? 'frozen' : 'unfrozen'} successfully`);
      
      setExamData(prev => prev.map(ex => {
        if (ex.id === examId) {
          let frozenClasses = [];
          try {
            frozenClasses = typeof ex.frozenClasses === 'string' ? JSON.parse(ex.frozenClasses) : (ex.frozenClasses || []);
          } catch(e){}
          
          if (!isCurrentlyFrozen) {
             frozenClasses.push(classId);
          } else {
             frozenClasses = frozenClasses.filter((c: string) => c !== classId);
          }
          return { ...ex, frozenClasses };
        }
        return ex;
      }));
      
    } catch (error) {
      toast.error('Action failed');
    }
  };

  if (loading) return <LoadingSpinner size="lg" className="h-[50vh]" />;

  const activeExamData = examData.find(e => e.id === selectedExamId) || null;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/60 dark:bg-slate-900/50 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-fuchsia-500 to-purple-600 p-3.5 rounded-2xl shadow-lg shadow-purple-500/30 text-white">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-fuchsia-600 to-purple-600 bg-clip-text text-transparent drop-shadow-sm">Status Overview</h2>
            <p className="text-sm font-semibold text-slate-500 mt-0.5">Monitor and manage marks entry status for selected exam</p>
          </div>
        </div>

        <div className="w-full sm:w-auto relative min-w-[280px]">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-purple-500" />
          </div>
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="w-full appearance-none bg-white dark:bg-slate-800 border-2 border-purple-100 dark:border-purple-900/30 rounded-xl pl-11 pr-10 py-3 text-sm font-extrabold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-400 transition-all shadow-sm cursor-pointer hover:border-purple-300"
          >
            <option value="" disabled>Select an Exam...</option>
            {examData.map(e => (
              <option key={e.id} value={e.id}>{e.name} ({e.term})</option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200/60 dark:border-slate-800 overflow-hidden">
        
        {activeExamData ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest">
                  <th className="px-6 py-5 font-black border-b border-slate-100 dark:border-slate-700/50">Class / Section</th>
                  <th className="px-6 py-5 font-black border-b border-slate-100 dark:border-slate-700/50">Exam Date</th>
                  <th className="px-6 py-5 font-black border-b border-slate-100 dark:border-slate-700/50">Current Status</th>
                  <th className="px-6 py-5 font-black border-b border-slate-100 dark:border-slate-700/50 text-center">Freeze Action</th>
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
                        <td colSpan={4} className="p-12 text-center text-slate-400 font-bold">
                          No classes assigned to this exam yet.
                        </td>
                      </tr>
                    );
                  }

                  return (activeExamData.classes || []).map((cls: any) => {
                    const hasMarks = classesWithMarks.includes(cls.id);
                    const isExplicitlyFrozen = frozenClasses.includes(cls.id);

                    return (
                      <tr key={cls.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-extrabold bg-gradient-to-r from-fuchsia-50 to-purple-50 dark:from-fuchsia-950/30 dark:to-purple-950/30 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-800/30 shadow-sm">
                            {cls.name} - {cls.section}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-slate-600 dark:text-slate-300">
                            {new Date(activeExamData.examDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {isExplicitlyFrozen ? (
                            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-lg w-fit border border-emerald-200 dark:border-emerald-800/50 shadow-sm">
                              <Lock className="w-4 h-4" />
                              <span className="text-[11px] font-black uppercase tracking-widest">Frozen</span>
                            </div>
                          ) : (isPublished && hasMarks) ? (
                            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-3 py-1.5 rounded-lg w-fit border border-blue-200 dark:border-blue-800/50 shadow-sm">
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="text-[11px] font-black uppercase tracking-widest">Published</span>
                            </div>
                          ) : hasMarks ? (
                            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5 rounded-lg w-fit border border-amber-200 dark:border-amber-800/50 shadow-sm">
                              <Edit3 className="w-4 h-4" />
                              <span className="text-[11px] font-black uppercase tracking-widest">Draft</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg w-fit border border-slate-200 dark:border-slate-700 shadow-sm">
                              <XCircle className="w-4 h-4" />
                              <span className="text-[11px] font-black uppercase tracking-widest">Not Entered</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => toggleFreeze(activeExamData.id, cls.id, isExplicitlyFrozen)}
                            className={`px-4 py-2 rounded-xl text-[11px] uppercase tracking-widest font-black transition-all duration-300 flex items-center justify-center gap-2 mx-auto ${
                              isExplicitlyFrozen 
                                ? 'bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-rose-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 shadow-sm' 
                                : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md shadow-emerald-500/20 hover:-translate-y-0.5'
                            }`}
                          >
                            {isExplicitlyFrozen ? (
                              <>
                                <Unlock className="w-3.5 h-3.5" /> Unfreeze
                              </>
                            ) : (
                              <>
                                <Lock className="w-3.5 h-3.5" /> Freeze
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-10 h-10 text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">No Exam Selected</h3>
            <p className="text-slate-500 font-medium">Please select an exam from the dropdown above to view its status.</p>
          </div>
        )}
      </div>
    </div>
  );
};
