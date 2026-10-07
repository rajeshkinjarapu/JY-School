import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Calendar, Clock, AlertCircle, ArrowLeft, Plus, FileText, Target, Award, Timer, Hash, Zap, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/UI/PageHeader';

const CreateCompetitiveExamPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    classId: '',
    subjectIds: [] as string[],
    duration: 180,
    totalMarks: 300,
    marksPerQuestion: 4,
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
        
        const allC = clsRes.data?.data || clsRes.data || [];
        setClasses(allC);
        
        const allS = subRes.data?.data || subRes.data || [];
        const uniqueSubjects: any[] = [];
        const seen = new Set();
        for (const s of allS) {
          if (s.name && s.name === s.name.toUpperCase() && !seen.has(s.name)) {
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

  useEffect(() => {
    const fetchSubjects = async () => {
      if (!formData.classId) {
        setSubjects(allSubjects);
        return;
      }
      try {
        const res = await api.get('/api/subjects?classId=' + formData.classId);
        const data = res.data?.data || res.data || [];
        if (data.length > 0) {
          const uniqueSubjects: any[] = [];
          const seen = new Set();
          for (const s of data) {
            if (s.name && s.name === s.name.toUpperCase() && !seen.has(s.name)) {
              seen.add(s.name);
              uniqueSubjects.push(s);
            }
          }
          uniqueSubjects.sort((a: any, b: any) => a.name.localeCompare(b.name));
          setSubjects(uniqueSubjects.length > 0 ? uniqueSubjects : allSubjects);
        } else {
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
    
    if (formData.subjectIds.length === 0) {
      alert('Please select at least one subject');
      return;
    }
    
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
      
      alert("Exam Created Successfully!");
      navigate('/competitive-exams');
    } catch (error) {
      alert('Failed to create competitive exam');
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

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT COLUMN: Main Details & Subjects */}
            <div className="lg:col-span-7 space-y-8">
              {/* Exam Info Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800">Exam Details</h2>
                    <p className="text-xs text-slate-500">Configure the basic exam information</p>
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  <div>
                    <label className={labelClass}>Exam Title</label>
                    <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className={inputClass} placeholder="e.g., JEE Mains Grand Test 1" />
                  </div>
                  <div>
                    <label className={labelClass}>Select Class</label>
                    <select required value={formData.classId} onChange={e => setFormData({...formData, classId: e.target.value, subjectIds: []})} className={inputClass}>
                      <option value="">Choose a Class</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.section ? `- ${c.section}` : ''}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Subjects Selection Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800">Select Subjects</h2>
                    <p className="text-xs text-slate-500">Choose the subjects for this exam</p>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {subjects.map(s => (
                      <label key={s.id} className="flex items-center gap-3 p-3 border-2 border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50 group">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                          checked={formData.subjectIds.includes(s.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({...formData, subjectIds: [...formData.subjectIds, s.id]});
                            } else {
                              setFormData({...formData, subjectIds: formData.subjectIds.filter(id => id !== s.id)});
                            }
                          }}
                        />
                        <span className="font-bold text-sm text-slate-700 group-hover:text-slate-900">{s.name}</span>
                      </label>
                    ))}
                  </div>
                  {subjects.length === 0 && (
                    <div className="text-center py-6">
                      <p className="text-sm text-amber-600 font-medium flex items-center justify-center gap-2">
                        <AlertCircle size={16} /> Loading available subjects...
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Schedule, Marks & Submit */}
            <div className="lg:col-span-5 space-y-8">
              {/* Schedule Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                  <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800">Schedule & Timing</h2>
                    <p className="text-xs text-slate-500">Set the exam time window</p>
                  </div>
                </div>
                <div className="p-6 space-y-5">
                  <div>
                    <label className={labelClass}>Exam Date</label>
                    <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className={inputClass} />
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className={labelClass}>Start Time</label>
                      <input type="time" required value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>End Time</label>
                      <input type="time" required value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} className={inputClass} />
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-100 mt-2">
                    <label className={labelClass}>Total Duration (Mins)</label>
                    <div className="relative">
                      <Timer className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input type="number" required value={formData.duration} onChange={e => setFormData({...formData, duration: parseInt(e.target.value)})} className={`${inputClass} pl-12`} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Scoring Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <Target className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800">Scoring Rules</h2>
                    <p className="text-xs text-slate-500">Marks schema configuration</p>
                  </div>
                </div>
                <div className="p-6 space-y-5">
                  <div>
                    <label className={labelClass}>Total Max Marks</label>
                    <div className="relative">
                      <Award className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
                      <input type="number" required value={formData.totalMarks} onChange={e => setFormData({...formData, totalMarks: parseInt(e.target.value)})} className={`${inputClass} pl-12 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/10`} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className={labelClass}>Marks Per Q</label>
                      <div className="relative">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500" />
                        <input type="number" required value={formData.marksPerQuestion} onChange={e => setFormData({...formData, marksPerQuestion: parseInt(e.target.value)})} className={`${inputClass} pl-12 border-blue-200 focus:border-blue-500 focus:ring-blue-500/10`} />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Negative Marks</label>
                      <div className="relative">
                        <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-rose-500" />
                        <input type="number" required value={formData.negativeMarks} onChange={e => setFormData({...formData, negativeMarks: parseInt(e.target.value)})} className={`${inputClass} pl-12 border-rose-200 focus:border-rose-500 focus:ring-rose-500/10`} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button type="submit" disabled={loading} className="w-full py-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 font-bold shadow-xl shadow-indigo-200 hover:-translate-y-1 transition-all disabled:opacity-50 text-base flex items-center justify-center gap-3">
                <Plus className="w-6 h-6" />
                {loading ? 'Publishing Exam...' : 'Create Exam & Publish'}
              </button>
            </div>
            
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCompetitiveExamPage;
