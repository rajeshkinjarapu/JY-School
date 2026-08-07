import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Plus, X, Edit3, Calendar, FileText, CheckCircle, Hash } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { PageHeader } from '../../components/UI/PageHeader';

export const CreateExamPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editExam = location.state?.exam;

  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [examName, setExamName] = useState(editExam?.name || '');
  const [examCategory, setExamCategory] = useState<'JEE' | 'BOARD' | ''>('');
  const [boardExamType, setBoardExamType] = useState('');
  const [examClassIds, setExamClassIds] = useState<string[]>(editExam?.classes?.map((c: any) => c.id) || []);
  const [examDate, setExamDate] = useState(
    editExam?.examDate 
      ? new Date(editExam.examDate).toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0]
  );
  const [selectedExamSubjects, setSelectedExamSubjects] = useState<{id: string, name: string, maxMarks: number, date?: string}[]>(
    editExam?.subjects || []
  );

  const totalMarks = selectedExamSubjects.reduce((sum, sub) => sum + (Number(sub.maxMarks) || 0), 0);

  useEffect(() => {
    fetchClasses();
    if (editExam) {
      if (editExam.name.includes('JEE')) setExamCategory('JEE');
      else if (['FA-1', 'FA-2', 'FA-3', 'FA-4', 'SA-1', 'SA-2', 'Pre-Final'].some(t => editExam.name.includes(t))) setExamCategory('BOARD');
      else setExamCategory('');
    }
  }, [editExam]);

  const fetchClasses = async () => {
    try {
      const res: any = await api.get('/api/classes?limit=500');
      setClasses(res.data || res || []);
    } catch {
      toast.error('Failed to load classes');
    }
  };

  const handleClassToggle = (classId: string) => {
    if (examClassIds.includes(classId)) {
      setExamClassIds(examClassIds.filter(id => id !== classId));
    } else {
      setExamClassIds([...examClassIds, classId]);
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (examClassIds.length === 0) {
      toast.error('Please select at least one class');
      return;
    }
    if (selectedExamSubjects.length === 0) {
      toast.error('Please select at least one subject');
      return;
    }
    
    setLoading(true);
    try {
      if (editExam?.id) {
        await api.put(`/api/exams/${editExam.id}`, {
          name: examName,
          classIds: examClassIds,
          examDate: new Date(examDate),
          maxMarks: totalMarks,
          subjects: selectedExamSubjects
        });
        toast.success('Exam updated successfully!');
      } else {
        await api.post('/api/exams', {
          name: examName,
          classIds: examClassIds,
          examDate: new Date(examDate),
          maxMarks: totalMarks,
          subjects: selectedExamSubjects
        });
        toast.success('Exam created successfully!');
      }
      navigate('/exams');
    } catch (err: any) {
      toast.error(err.message || 'Error saving exam');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 animate-fade-in" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader 
        title={editExam ? 'Edit Exam Configuration' : 'Create New Exam'}
        icon={
          <button 
            type="button"
            onClick={() => navigate('/exams')}
            className="text-white hover:text-indigo-200 transition-colors cursor-pointer flex items-center justify-center"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        }
      />

      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <form onSubmit={handleCreateExam} className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Form Left Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* General Settings Card */}
            <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-sm p-6 sm:p-8">
              <h2 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2.5 mb-6">
                <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg dark:bg-indigo-950/50 dark:text-indigo-400">
                  <FileText className="w-5 h-5" />
                </span>
                General Details
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-3">Exam Category</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className={`flex items-center gap-3.5 p-4 rounded-2xl border-2 cursor-pointer transition-all ${examCategory === 'JEE' ? 'border-amber-500 bg-amber-50/40 text-amber-900 shadow-sm' : 'border-slate-100 hover:border-slate-200 bg-white'}`}>
                      <input type="radio" name="examCategory" value="JEE" checked={examCategory === 'JEE'} onChange={() => { setExamCategory('JEE'); setBoardExamType(''); setExamName('JEE Mains Model Examination'); }} className="w-5 h-5 text-amber-600 focus:ring-amber-500 cursor-pointer" />
                      <div>
                        <div className="text-sm font-black text-slate-800">JEE Mains Exams</div>
                        <div className="text-xs font-bold text-slate-500 mt-0.5">Objective patterns</div>
                      </div>
                    </label>
                    <label className={`flex items-center gap-3.5 p-4 rounded-2xl border-2 cursor-pointer transition-all ${examCategory === 'BOARD' ? 'border-indigo-500 bg-indigo-50/40 text-indigo-900 shadow-sm' : 'border-slate-100 hover:border-slate-200 bg-white'}`}>
                      <input type="radio" name="examCategory" value="BOARD" checked={examCategory === 'BOARD'} onChange={() => { setExamCategory('BOARD'); setExamName(''); }} className="w-5 h-5 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                      <div>
                        <div className="text-sm font-black text-slate-800">Board Exams</div>
                        <div className="text-xs font-bold text-slate-500 mt-0.5">FA / SA / Finals</div>
                      </div>
                    </label>
                  </div>
                </div>

                {examCategory === 'BOARD' && (
                  <div className="animate-fade-in">
                    <label className="block text-xs font-black text-slate-700 mb-2 uppercase tracking-wide">Board Exam Type</label>
                    <select value={boardExamType} onChange={(e) => { setBoardExamType(e.target.value); setExamName(e.target.value + ' Examination'); }} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-indigo-400 focus:bg-white transition-all shadow-sm">
                      <option value="">Select Board Exam Type...</option>
                      {['FA-1', 'FA-2', 'FA-3', 'FA-4', 'SA-1', 'SA-2', 'Pre-Final'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-2 uppercase tracking-wide">Exam Name / Title</label>
                  <input type="text" required placeholder="e.g. Mid-Term 1" value={examName} onChange={e => setExamName(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-indigo-400 focus:bg-white transition-all shadow-sm" />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-2 uppercase tracking-wide">Exam Start Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input type="date" required value={examDate} onChange={e => setExamDate(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-indigo-400 focus:bg-white transition-all shadow-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-2 uppercase tracking-wide">Total Max Marks</label>
                    <div className="relative">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input type="number" readOnly value={totalMarks} className="w-full pl-12 pr-4 py-3 bg-slate-100 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-500 outline-none shadow-sm cursor-not-allowed" />
                    </div>
                    <p className="text-[10px] text-slate-500 font-semibold mt-2">Auto-calculated from subjects.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Subjects Card */}
            <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-sm p-6 sm:p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2.5">
                  <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg dark:bg-emerald-950/50 dark:text-emerald-400">
                    <Edit3 className="w-5 h-5" />
                  </span>
                  Subjects & Max Marks
                </h2>
                <button 
                  type="button" 
                  onClick={() => setSelectedExamSubjects([...selectedExamSubjects, { id: Date.now().toString(), name: '', maxMarks: 100, date: examDate }])}
                  className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Add Subject
                </button>
              </div>

              <div className="space-y-4">
                {selectedExamSubjects.map((sub, i) => (
                  <div key={sub.id} className="flex flex-col sm:flex-row gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm relative group">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Subject Name</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="e.g. Mathematics" 
                        value={sub.name}
                        onChange={(e) => {
                          const newSubs = [...selectedExamSubjects];
                          newSubs[i].name = e.target.value;
                          setSelectedExamSubjects(newSubs);
                        }}
                        className="w-full px-3 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-indigo-400 transition-colors"
                      />
                    </div>
                    <div className="w-full sm:w-40">
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Exam Date</label>
                      <input 
                        type="date"
                        value={sub.date || ''}
                        onChange={(e) => {
                          const newSubs = [...selectedExamSubjects];
                          newSubs[i].date = e.target.value;
                          setSelectedExamSubjects(newSubs);
                        }}
                        className="w-full px-3 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-indigo-400 transition-colors"
                      />
                    </div>
                    <div className="w-full sm:w-28">
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Max Marks</label>
                      <input 
                        type="number" 
                        required
                        min={1}
                        value={sub.maxMarks}
                        onChange={(e) => {
                          const newSubs = [...selectedExamSubjects];
                          newSubs[i].maxMarks = Number(e.target.value);
                          setSelectedExamSubjects(newSubs);
                        }}
                        className="w-full px-3 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold text-indigo-700 outline-none focus:border-indigo-400 text-center transition-colors"
                      />
                    </div>
                    
                    <button 
                      type="button"
                      onClick={() => setSelectedExamSubjects(selectedExamSubjects.filter((_, idx) => idx !== i))}
                      className="absolute -top-3 -right-3 w-8 h-8 bg-white border-2 border-slate-100 text-red-500 hover:bg-red-50 hover:border-red-100 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                {selectedExamSubjects.length === 0 && (
                  <div className="py-12 flex flex-col items-center justify-center text-center bg-slate-50/60 border-2 border-dashed border-slate-200 rounded-[2rem]">
                    <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-md mb-4 text-slate-400">
                      <Edit3 className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-black text-slate-700">No Subjects Added</h3>
                    <p className="text-xs font-bold text-slate-500 mt-2 max-w-xs leading-relaxed">
                      Click the "Add Subject" button above to start configuring the exam structure.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar / Classes Column */}
          <div className="space-y-6">
            <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-sm p-6 sm:p-8 sticky top-6">
              <h2 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2.5 mb-1">
                <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg dark:bg-amber-950/50 dark:text-amber-400">
                  <CheckCircle className="w-5 h-5" />
                </span>
                Assign Classes
              </h2>
              <p className="text-xs font-bold text-slate-500 mb-6 pl-9">
                Select which classes will take this exam.
              </p>
              
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {classes.map(c => {
                  const isSelected = examClassIds.includes(c.id);
                  return (
                    <div 
                      key={c.id} 
                      onClick={() => handleClassToggle(c.id)}
                      className={`flex items-center justify-between p-4 cursor-pointer rounded-2xl border-2 transition-all ${
                        isSelected 
                          ? 'border-indigo-500 bg-indigo-50 shadow-sm' 
                          : 'border-slate-100 bg-white hover:border-indigo-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}`}>
                          {isSelected && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <div>
                          <div className={`text-sm font-black ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                            {c.name} - {c.section}
                          </div>
                        </div>
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 bg-white px-2 py-1 rounded-md border border-slate-100">
                        {c._count?.students || 0} students
                      </div>
                    </div>
                  );
                })}
                
                {classes.length === 0 && (
                  <div className="py-8 text-center text-xs font-semibold text-slate-500">
                    Loading classes or none available...
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-3">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-sm transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {loading ? 'Saving...' : (
                    <>
                      <Save className="w-5 h-5" /> 
                      {editExam ? 'Save Changes' : 'Create Exam'}
                    </>
                  )}
                </button>
                <button 
                  type="button" 
                  onClick={() => navigate('/exams')}
                  className="w-full py-3 bg-white border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600 rounded-xl font-bold text-sm transition-all flex items-center justify-center"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateExamPage;
