import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Calendar, Clock, AlertCircle, ArrowLeft, Plus, FileText, Target, Award, Timer, Hash, Zap, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/UI/PageHeader';
import toast from 'react-hot-toast';

const CreateCompetitiveExamPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    classId: '',
    subjectId: '',
    duration: 180,
    totalMarks: 300,
    passMarks: 100,
    negativeMarks: 1,
    date: '',
    startTime: '',
    endTime: ''
  });
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [allSubjects, setAllSubjects] = useState<any[]>([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [clsRes, subRes] = await Promise.all([
          api.get('/api/classes'),
          api.get('/api/subjects?limit=5000')
        ]);
        
        // Deduplicate classes by name
        const allC = clsRes.data?.data || clsRes.data || [];
        setClasses(allC);
        
        // Deduplicate subjects by name
        const allS = subRes.data?.data || subRes.data || [];
        const uniqueSubjects: any[] = [];
        const seen = new Set();
        for (const s of allS) {
          if (!seen.has(s.name)) {
            seen.add(s.name);
            uniqueSubjects.push(s);
          }
        }
        uniqueSubjects.sort((a: any, b: any) => a.name.localeCompare(b.name));
        setAllSubjects(uniqueSubjects);
      } catch (e) {
        console.error("Failed to load data", e);
      }
    };
    fetchInitialData();
  }, []);

  // Fetch subjects specific to selected class
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!formData.classId) {
        setSubjects(allSubjects); // Show all subjects if no class selected
        return;
      }
      try {
        const res = await api.get(`/api/subjects?classId=${formData.classId}`);
        const data = res.data?.data || res.data || [];
        if (data.length > 0) {
          setSubjects(data);
        } else {
          // Fallback to all subjects if class-specific fetch returns empty
          setSubjects(allSubjects);
        }
      } catch (e) {
        setSubjects(allSubjects);
      }
    };
    fetchSubjects();
  }, [formData.classId, allSubjects]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const startDateTime = new Date(`${formData.date}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.date}T${formData.endTime}`);
      
      await api.post('/api/competitive-exams', {
        ...formData,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        isPublished: true
      });
      
      toast.success("Exam Created Successfully!");
      navigate('/competitive-exams');
    } catch (error) {
      toast.error('Failed to create competitive exam');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-400";
  const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2";

  return (
    <div className="flex-1 overflow-auto bg-slate-50/50" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader 
        title="Create Competitive Exam" 
        icon={<Plus className="w-5 h-5" />}
        action={
          <button onClick={() => navigate('/competitive-exams')} className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all backdrop-blur-md border border-white/20 font-medium text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
        }
      />

      <div className="max-w-5xl mx-auto p-4 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section 1: Basic Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">Exam Details</h2>
                <p className="text-xs text-slate-500">Configure the basic exam information</p>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className={labelClass}>Exam Title</label>
                <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className={inputClass} placeholder="e.g., JEE Mains Grand Test 1 - Physics" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Select Class</label>
                  <select required value={formData.classId} onChange={e => setFormData({...formData, classId: e.target.value, subjectId: ''})} className={inputClass}>
                    <option value="">Choose a Class</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.section ? `- ${c.section}` : ''}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>
                    <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> Select Subject</span>
                  </label>
                  <select required value={formData.subjectId} onChange={e => setFormData({...formData, subjectId: e.target.value})} className={inputClass}>
                    <option value="">Choose a Subject</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  {subjects.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1.5 font-medium flex items-center gap-1">
                      <AlertCircle size={12} /> Loading subjects...
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Marks & Scoring */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Target className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">Marks & Scoring Scheme</h2>
                <p className="text-xs text-slate-500">Configure marks per question and negative marking scheme for this exam</p>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Marks Per Question *</label>
                  <div className="relative">
                    <Award className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
                    <input
                      type="number"
                      min={1}
                      required
                      value={formData.totalMarks > 0 ? (formData.totalMarks >= 100 ? 4 : Math.max(1, Math.round(formData.totalMarks / 25))) : 4}
                      onChange={e => {
                        const m = parseInt(e.target.value) || 4;
                        setFormData({ ...formData, totalMarks: m * 25 });
                      }}
                      className={`${inputClass} pl-12 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/10`}
                      placeholder="e.g. 4 marks per question"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Each correct question in this exam carries this score</p>
                </div>

                <div>
                  <label className={labelClass}>Does this Exam have Negative Marking? *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, negativeMarks: 0 })}
                      className={`px-3 py-2.5 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        formData.negativeMarks === 0
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span>No Negative (0)</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, negativeMarks: formData.negativeMarks > 0 ? formData.negativeMarks : 1 })}
                        className={`flex-1 px-3 py-2.5 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          formData.negativeMarks > 0
                            ? 'bg-rose-50 border-rose-500 text-rose-800 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                        <span>Yes, Deduct</span>
                      </button>

                      {formData.negativeMarks > 0 && (
                        <div className="w-20 shrink-0">
                          <input
                            type="number"
                            min={0.25}
                            step={0.25}
                            value={formData.negativeMarks}
                            onChange={e => setFormData({ ...formData, negativeMarks: Math.max(0, parseFloat(e.target.value) || 0) })}
                            className="w-full px-2 py-2 bg-white border-2 border-rose-400 rounded-xl text-rose-800 font-extrabold text-xs text-center outline-none"
                            title="Negative marks per wrong answer"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {formData.negativeMarks === 0 ? 'Zero penalty for wrong answers' : `-${formData.negativeMarks} mark deducted per incorrect answer`}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-slate-100">
                <div>
                  <label className={labelClass}>Total Exam Marks</label>
                  <div className="relative">
                    <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500" />
                    <input type="number" required value={formData.totalMarks} onChange={e => setFormData({...formData, totalMarks: parseInt(e.target.value) || 100})} className={`${inputClass} pl-12`} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Pass Marks</label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500" />
                    <input type="number" required value={formData.passMarks} onChange={e => setFormData({...formData, passMarks: parseInt(e.target.value) || 35})} className={`${inputClass} pl-12`} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Schedule */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">Schedule & Duration</h2>
                <p className="text-xs text-slate-500">Set exam date, time window, and duration</p>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className={labelClass}>
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Exam Date</span>
                  </label>
                  <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Start Time</span>
                  </label>
                  <input type="time" required value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> End Time</span>
                  </label>
                  <input type="time" required value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>
                  <span className="flex items-center gap-1.5"><Timer className="w-3.5 h-3.5" /> Duration (Minutes)</span>
                </label>
                <input type="number" required value={formData.duration} onChange={e => setFormData({...formData, duration: parseInt(e.target.value)})} className={inputClass} />
                <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5 font-medium">
                  <AlertCircle size={14} className="text-indigo-400" /> This sets the exam session timer for the student.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-2 pb-4">
            <button type="button" onClick={() => navigate('/competitive-exams')} className="px-8 py-3.5 text-slate-600 bg-white border-2 border-slate-200 rounded-xl hover:bg-slate-50 font-bold transition-colors text-sm">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-10 py-3.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-200 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 text-sm flex items-center gap-2">
              <Plus className="w-5 h-5" />
              {loading ? 'Creating...' : 'Create Exam'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCompetitiveExamPage;
