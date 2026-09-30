import React, { useState } from 'react';
import api from '../../api/axios';
import { Calendar, Clock, AlertCircle, ArrowLeft, Plus, FileText, Target, Award, Timer, Hash, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/UI/PageHeader';

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

  React.useEffect(() => {
    const fetchClasses = async () => {
      try {
        const clsRes = await api.get('/api/classes');
        setClasses(clsRes.data.data || []);
      } catch (e) {
        console.error("Failed to load classes", e);
      }
    };
    fetchClasses();
  }, []);

  React.useEffect(() => {
    const fetchSubjects = async () => {
      if (!formData.classId) {
        setSubjects([]);
        return;
      }
      try {
        const subRes = await api.get(`/api/classes/${formData.classId}/subjects`);
        setSubjects(subRes.data.data || []);
      } catch (e) {
        console.error("Failed to load subjects", e);
      }
    };
    fetchSubjects();
  }, [formData.classId]);
  
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
                  <label className={labelClass}>Select Subject</label>
                  <select required value={formData.subjectId} disabled={!formData.classId} onChange={e => setFormData({...formData, subjectId: e.target.value})} className={`${inputClass} disabled:opacity-50 disabled:cursor-not-allowed`}>
                    <option value="">{formData.classId ? "Choose a Subject" : "Select a class first"}</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
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
                <h2 className="text-base font-bold text-slate-800">Marks & Scoring</h2>
                <p className="text-xs text-slate-500">Set total marks and negative marking scheme</p>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className={labelClass}>Total Marks</label>
                  <div className="relative">
                    <Award className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
                    <input type="number" required value={formData.totalMarks} onChange={e => setFormData({...formData, totalMarks: parseInt(e.target.value)})} className={`${inputClass} pl-12 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/10`} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Pass Marks</label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500" />
                    <input type="number" required value={formData.passMarks} onChange={e => setFormData({...formData, passMarks: parseInt(e.target.value)})} className={`${inputClass} pl-12 border-blue-200 focus:border-blue-500 focus:ring-blue-500/10`} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Negative Marks (Per Q)</label>
                  <div className="relative">
                    <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-rose-500" />
                    <input type="number" required value={formData.negativeMarks} onChange={e => setFormData({...formData, negativeMarks: parseInt(e.target.value)})} className={`${inputClass} pl-12 border-rose-200 focus:border-rose-500 focus:ring-rose-500/10`} />
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
