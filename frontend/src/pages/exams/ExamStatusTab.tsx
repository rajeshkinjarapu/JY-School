import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Shield, Lock, Unlock, CheckCircle2, Edit3, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const ExamStatusTab: React.FC<{ exams: any[] }> = ({ exams }) => {
  const [loading, setLoading] = useState(false);
  const [examData, setExamData] = useState<any[]>([]);

  useEffect(() => {
    const fetchLatestExams = async () => {
      setLoading(true);
      try {
        const res: any = await api.get('/api/exams/status/all');
        setExamData(res.data.data || res.data || []);
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

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-indigo-100 text-indigo-600 p-2 rounded-xl">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Status Overview</h2>
            <p className="text-sm text-slate-500">Monitor and manage marks entry and freeze status for all classes</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
                <th className="p-4 font-bold border-b border-slate-200 rounded-tl-xl">Exam Name</th>
                <th className="p-4 font-bold border-b border-slate-200">Term / Date</th>
                <th className="p-4 font-bold border-b border-slate-200">Class</th>
                <th className="p-4 font-bold border-b border-slate-200">Status</th>
                <th className="p-4 font-bold border-b border-slate-200 rounded-tr-xl text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {examData.map((exam) => {
                let frozenClasses: string[] = [];
                if (exam.frozenClasses) {
                  try {
                    frozenClasses = typeof exam.frozenClasses === 'string' ? JSON.parse(exam.frozenClasses) : exam.frozenClasses;
                  } catch(e) {}
                }
                const classesWithMarks = exam.classesWithMarks || [];
                const isPublished = exam.admitCardSettings?.progressCardPublished === true;

                return (exam.classes || []).map((cls: any) => {
                  const hasMarks = classesWithMarks.includes(cls.id);
                  const isFrozen = frozenClasses.includes(cls.id) || (isPublished && hasMarks);

                  return (
                    <tr key={`${exam.id}-${cls.id}`} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{exam.name}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm font-medium text-slate-600">{exam.term}</div>
                        <div className="text-xs text-slate-400">{new Date(exam.examDate).toLocaleDateString()}</div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                          {cls.name}-{cls.section}
                        </span>
                      </td>
                      <td className="p-4">
                        {isFrozen ? (
                          <div className="flex items-center gap-1.5 text-green-600 bg-green-50 px-2.5 py-1 rounded-md w-fit border border-green-100">
                            <Lock className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold uppercase">{isPublished ? 'PUBLISHED' : 'FROZEN'}</span>
                          </div>
                        ) : hasMarks ? (
                          <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md w-fit border border-amber-100">
                            <Edit3 className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold uppercase">Draft (Pending)</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md w-fit border border-slate-200">
                            <XCircle className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold uppercase">Not Entered</span>
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {isPublished ? (
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Results Out</span>
                        ) : (
                          <button
                            onClick={() => toggleFreeze(exam.id, cls.id, isFrozen)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 mx-auto ${
                              isFrozen 
                                ? 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900' 
                                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-500/20 shadow-md'
                            }`}
                          >
                            {isFrozen ? (
                              <>Unfreeze</>
                            ) : (
                              <>
                                <Lock className="w-3 h-3" />
                                Freeze
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                });
              })}
              {examData.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    No exams found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
