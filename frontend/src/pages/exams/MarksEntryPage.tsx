import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { ArrowLeft, Save, Filter, BookOpen, User, CheckCircle2, Lock, Trash2, Unlock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

export const MarksEntryPage: React.FC = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const classId = searchParams.get('classId');
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  
  const [exam, setExam] = useState<any>(null);
  const [currentClass, setCurrentClass] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [marksData, setMarksData] = useState<{ [key: string]: number | string }>({});
  const [remarksData, setRemarksData] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [isClassFrozen, setIsClassFrozen] = useState(false);
  
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('ALL');

  const fetchData = async () => {
    try {
      if (!classId) {
        toast.error('No class selected for marks entry.');
        navigate('/exams');
        return;
      }

      // 1. Get Exam
      const examRes: any = await api.get(`/api/exams/${id}`);
      const examObj = examRes.data;
      setExam(examObj);

      let frozenArr: string[] = [];
      if (examObj.frozenClasses) {
        try {
          frozenArr = typeof examObj.frozenClasses === 'string' ? JSON.parse(examObj.frozenClasses) : examObj.frozenClasses;
        } catch(e) {}
      }
      setIsClassFrozen(frozenArr.includes(classId));

      // 2. Get specific class
      const classRes: any = await api.get(`/api/classes/${classId}`);
      setCurrentClass(classRes.data);

      // 3. Get students in class
      const studentsRes: any = await api.get(`/api/classes/${classId}/students`);
      setStudents(studentsRes.data || []);

      // 4. Get subjects from exam JSON (fallback to empty array)
      const rawExamSubjects = Array.isArray(examObj.subjects) ? examObj.subjects : [];
      // Only keep exam subjects that are globally mapped to this specific class
      const classMappedSubjects = classRes.data?.subjects || [];
      const examSubjects = rawExamSubjects.filter(examSub => 
        classMappedSubjects.some((classSub: any) => classSub.name?.trim().toLowerCase() === examSub.name?.trim().toLowerCase())
      );
      setSubjects(examSubjects);

      // 5. Get existing flat marks from marks API
      const marksRes: any = await api.get(`/api/marks/exam/${id}`);
      const flatMarks = marksRes.data || [];
      
      const initialMarks: { [key: string]: number | string } = {};
      const initialRemarks: { [key: string]: string } = {};

      flatMarks.forEach((m: any) => {
        if (m.student?.classId === classId || (currentClass && m.student?.rollNo)) { 
          // Match the real subject from DB to the fake subject in exam.subjects by name
          const fakeSub = examSubjects.find((s: any) => s.name?.toLowerCase() === m.subject?.name?.toLowerCase());
          const fakeSubId = fakeSub ? fakeSub.id : m.subjectId;

          initialMarks[`${m.studentId}_${fakeSubId}`] = m.remarks === 'AB' ? 'AB' : m.marksObtained;
          initialRemarks[`${m.studentId}_${fakeSubId}`] = m.remarks || '';
        }
      });

      setMarksData(initialMarks);
      setRemarksData(initialRemarks);
    } catch (e) {
      toast.error('Failed to load marks matrix');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, classId]);

  const handleMarkChange = (studentId: string, subjectId: string, val: string) => {
    setMarksData((prev) => {
      const next = { ...prev };
      if (val === '') {
        delete next[`${studentId}_${subjectId}`];
      } else if (val.toUpperCase() === 'AB') {
        next[`${studentId}_${subjectId}`] = 'AB';
      } else {
        next[`${studentId}_${subjectId}`] = Number(val);
      }
      return next;
    });
  };

  const handleRemarkChange = (studentId: string, subjectId: string, val: string) => {
    setRemarksData((prev) => ({
      ...prev,
      [`${studentId}_${subjectId}`]: val,
    }));
  };

  const handleSave = async (isFreeze = false) => {
    if (isClassFrozen) {
      toast.error('Marks are frozen and cannot be updated.');
      return;
    }
    if (isFreeze) {
      if (!window.confirm("Are you sure you want to freeze the marks for this class? Once frozen, progress cards will be generated and marks cannot be edited.")) return;
    }

    // Frontend validation
    for (const key of Object.keys(marksData)) {
      const val = marksData[key];
      if (val !== null && val !== undefined && val !== '') {
        const [studentId, subjectId] = key.split('_');
        const subjectInfo = subjects.find(s => s.id === subjectId);
        const maxMarks = Number(subjectInfo?.maxMarks) || 100;
        
        if (val !== 'AB' && Number(val) > maxMarks) {
           toast.error(`Marks cannot exceed ${maxMarks} for ${subjectInfo?.name || 'subject'}`);
           return;
        }
      }
    }

    const payload = {
      marks: Object.keys(marksData)
        .filter(key => marksData[key] !== null && marksData[key] !== undefined && marksData[key] !== '')
        .map(key => {
          const [studentId, subjectId] = key.split('_');
          const subjectInfo = subjects.find(s => s.id === subjectId);
          const val = marksData[key];
          const isAB = val === 'AB';
          
          return {
            studentId,
            examId: id,
            subjectId,
            marksObtained: isAB ? 0 : Number(val),
            maxMarks: Number(subjectInfo?.maxMarks) || 100,
            remarks: isAB ? 'AB' : (remarksData[key] || ''),
          };
        }),
    };

    if (payload.marks.length === 0 && !isFreeze) {
      toast.error('No marks entered to save');
      return;
    }

    try {
      if (payload.marks.length > 0) {
        await api.post('/api/marks/bulk', payload);
      }
      if (isFreeze) {
        await api.post(`/api/exams/${id}/freeze`, { classId, isFrozen: true });
        toast.success('Marks frozen successfully! Progress cards generated.');
        navigate(`/exams?tab=progress-card&classId=${classId}`);
      } else {
        toast.success('Marks saved as draft successfully!');
        navigate('/exams?tab=written-exam');
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to save marks');
    }
  };

  const handleClearMarks = async () => {
    const isSingleSubject = selectedSubjectId !== 'ALL';
    const subjectName = isSingleSubject ? subjects.find(s => s.id === selectedSubjectId)?.name || 'selected subject' : 'ALL subjects';
    
    if (!window.confirm(`Are you sure you want to clear marks for ${subjectName} in this exam? The teacher will have to re-enter them.`)) return;
    
    try {
      let url = `/api/marks/exam/${id}/clear?classId=${classId}`;
      if (isSingleSubject) {
        url += `&subjectId=${selectedSubjectId}`;
      }
      await api.delete(url);
      toast.success(`Marks cleared for ${subjectName}!`);
      
      // Fast state refresh for cleared subject without full reload
      if (isSingleSubject) {
        const newMarks = { ...marksData };
        const newRemarks = { ...remarksData };
        Object.keys(newMarks).forEach(key => {
          if (key.endsWith(`_${selectedSubjectId}`)) {
            delete newMarks[key];
            delete newRemarks[key];
          }
        });
        setMarksData(newMarks);
        setRemarksData(newRemarks);
      } else {
        setMarksData({});
        setRemarksData({});
      }
      
    } catch (e: any) {
      toast.error(e.message || "Failed to clear marks");
    }
  };

  if (loading) return <LoadingSpinner size="lg" className="h-[50vh]" />;

  const filteredSubjects = selectedSubjectId === 'ALL' 
    ? subjects 
    : subjects.filter(s => s.id === selectedSubjectId);

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 min-h-screen font-sans overflow-x-hidden flex flex-col pb-28 md:pb-0">
      
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-4 md:p-6 shadow-2xl shadow-purple-500/20 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 sticky top-0 rounded-b-3xl mb-6 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

        <div className="flex items-center gap-4 z-10">
          <Link to="/exams?tab=written-exam" className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl transition-all cursor-pointer">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div>
            <h2 className="text-xs sm:text-lg md:text-2xl font-black tracking-tight text-white uppercase drop-shadow-sm whitespace-nowrap truncate max-w-[240px] sm:max-w-none">{exam?.name}</h2>
            <div className="flex flex-wrap items-center gap-3 mt-1">
              <span className="bg-white/20 px-3 py-1 text-[11px] md:text-xs font-bold uppercase tracking-wider rounded-lg backdrop-blur-sm border border-white/10">
                Class: {currentClass?.name}-{currentClass?.section}
              </span>
              <span className="bg-white/20 px-3 py-1 text-[11px] md:text-xs font-bold uppercase tracking-wider rounded-lg backdrop-blur-sm border border-white/10">
                Max Marks: {exam?.maxMarks}
              </span>
            </div>
          </div>
        </div>
        
        {/* Save/Freeze buttons have been moved to the bottom bar for all devices */}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full p-0 space-y-0 pb-32 bg-transparent">
      <div className="w-full border-0 bg-transparent p-2 md:p-6">
        
        {/* Toolbar */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-200/50 pb-6">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white p-3 rounded-2xl shadow-md shadow-indigo-200">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-xl tracking-tight">Marks Entry Panel</h3>
              <p className="text-sm text-slate-500 font-medium mt-0.5">Select a subject and enter marks carefully.</p>
            </div>
          </div>

          <div className="relative w-full sm:w-72">
            <Filter className="absolute left-4 top-3.5 w-5 h-5 text-indigo-400" />
            <select 
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border-2 border-indigo-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all appearance-none shadow-sm cursor-pointer"
            >
              <option value="ALL">All Subjects</option>
              {subjects.map(sub => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
            <div className="absolute right-4 top-4 pointer-events-none">
              <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>

        {/* Desktop Table View (Hidden on mobile) */}
        <div className="hidden lg:block overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest min-w-[250px]">Student Info</th>
                {filteredSubjects.map((sub) => (
                  <th key={sub.id} className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest min-w-[200px]">
                    <div className="flex flex-col">
                      <span className="text-indigo-900">{sub.name}</span>
                      <span className="text-[10px] text-slate-400 font-bold mt-1 bg-slate-200/50 w-max px-2 py-0.5 rounded-full">MAX: {sub.maxMarks || 100}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((student, index) => (
                <tr key={student.id} className="hover:bg-indigo-50/40 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm shrink-0 shadow-inner">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-900 text-base">{student.user.name}</p>
                        <p className="text-xs font-bold text-slate-400 mt-1 tracking-wider uppercase bg-slate-100 w-max px-2 py-0.5 rounded-md">{student.rollNo || 'N/A'}</p>
                      </div>
                    </div>
                  </td>
                  
                  {filteredSubjects.map((sub) => {
                    const key = `${student.id}_${sub.id}`;
                    return (
                      <td key={sub.id} className="px-6 py-5 align-top">
                        <div className="flex flex-col gap-3">
                          <div className="relative flex gap-2">
                                  <input 
                                    type="text" 
                                    value={marksData[key] ?? ''}
                                    onChange={(e) => {
                                      const val = e.target.value.toUpperCase();
                                      if (val === '' || val === 'A' || val === 'AB' || (!isNaN(Number(val)) && Number(val) >= 0)) {
                                         handleMarkChange(student.id, sub.id, val);
                                      }
                                    }}
                                    className={`w-[70px] text-center p-2 text-sm font-bold border-2 rounded-lg outline-none transition-all ${isClassFrozen ? 'bg-gray-100 cursor-not-allowed border-gray-200' : 'bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100'} ${(marksData[key] !== 'AB' && marksData[key] && Number(marksData[key]) < (sub.passMarks || 35)) ? 'border-red-300 text-red-600 bg-red-50' : 'border-slate-200 text-slate-800'}`}
                                    placeholder="--"
                                    disabled={isClassFrozen}
                                  />
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile / Tablet Card View */}
        {/* Mobile View */}
        <div className="lg:hidden space-y-4 pb-24">
          {students.map((student, index) => (
            <div key={student.id} className="bg-white/80 backdrop-blur-md border border-indigo-100 rounded-3xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 border-b border-indigo-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold flex items-center justify-center shrink-0 shadow-sm shadow-indigo-200">
                  {index + 1}
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 uppercase tracking-wide text-sm">{student.user.name}</h4>
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md text-[10px] font-bold mt-1 inline-block">
                    ROLL: {student.rollNo || 'N/A'}
                  </span>
                </div>
              </div>
              
              <div className="p-4 space-y-4">
                {filteredSubjects.map((sub) => {
                  const key = `${student.id}_${sub.id}`;
                  return (
                    <div key={sub.id} className="bg-white rounded-2xl p-4 border border-indigo-50 shadow-sm relative">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-sm text-indigo-900">{sub.name}</span>
                        <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md">MAX: {sub.maxMarks || 100}</span>
                      </div>
                      
                      <div className="space-y-3">
                        <input
                          type="number"
                          min={0}
                          max={sub.maxMarks || 100}
                          value={marksData[key] !== undefined ? marksData[key] : ''}
                          onChange={(e) => handleMarkChange(student.id, sub.id, e.target.value)}
                          placeholder="Obtained Marks"
                          disabled={isClassFrozen}
                          className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-base font-black text-indigo-900 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all placeholder:font-medium placeholder:text-slate-400 shadow-sm"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {students.length === 0 && (
          <div className="py-16 text-center border-2 border-dashed border-indigo-100 rounded-3xl bg-indigo-50/30">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white shadow-sm border border-indigo-50 mb-4">
              <User className="w-10 h-10 text-indigo-300" />
            </div>
            <h3 className="text-xl font-extrabold text-indigo-900">No Students Found</h3>
            <p className="text-sm font-medium text-slate-500 mt-2">There are no students enrolled in this class to enter marks.</p>
          </div>
        )}
      </div>
      </div>

      {/* Universal Sticky Save Bar — always at bottom */}
      {students.length > 0 && !isClassFrozen && (
        <div
          className="sticky bottom-0 left-0 right-0 z-[99] flex gap-3 sm:gap-4 justify-center sm:justify-end mt-auto"
          style={{
            padding: '12px 24px',
            paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))',
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(99,102,241,0.15)',
            boxShadow: '0 -8px 32px rgba(0,0,0,0.08)',
          }}
        >
          {isAdmin && (
            <button onClick={handleClearMarks} className="hidden sm:flex px-6 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-xl font-bold text-sm transition-all items-center gap-2 cursor-pointer sm:mr-auto">
              <Trash2 className="w-4 h-4" />
              CLEAR MARKS
            </button>
          )}
          <button
            onClick={() => handleSave(false)}
            className="flex-1 sm:flex-none sm:w-auto px-8 py-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
          >
            <Save className="w-5 h-5" />
            SAVE MARKS
          </button>
          <button
            onClick={() => handleSave(true)}
            className="flex-1 sm:flex-none sm:w-auto px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 active:scale-95 transition-all cursor-pointer"
          >
            <Lock className="w-5 h-5" />
            FREEZE MARKS
          </button>
        </div>
      )}
      {students.length > 0 && isClassFrozen && (
        <div
          className="sticky bottom-0 left-0 right-0 z-[99] flex gap-3 sm:gap-4 justify-center sm:justify-end mt-auto"
          style={{
            padding: '12px 24px',
            paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))',
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(34,197,94,0.2)',
            boxShadow: '0 -8px 32px rgba(0,0,0,0.08)',
          }}
        >
          <div className="flex-1 sm:flex-none px-8 py-3 bg-green-500 text-white rounded-xl font-bold text-sm sm:text-base shadow-lg flex items-center justify-center gap-2">
            <Lock className="w-5 h-5" />
            MARKS FROZEN
          </div>
          {isAdmin && (
            <button
              onClick={async () => {
                if(window.confirm('Are you sure you want to unfreeze marks for this class?')) {
                  try {
                    await api.post(`/api/exams/${id}/freeze`, { classId, isFrozen: false });
                    toast.success('Marks unfrozen successfully');
                    window.location.reload();
                  } catch(e) { toast.error('Failed to unfreeze marks'); }
                }
              }}
              className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-bold text-sm shadow-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              <Unlock className="w-4 h-4" />
              UNFREEZE (ADMIN)
            </button>
          )}
        </div>
      )}
    </div>
  );
};
export default MarksEntryPage;
