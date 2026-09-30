import React, { useState } from 'react';
import api from '../../api/axios';
import { Calendar, Clock, AlertCircle, ArrowLeft, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
        isPublished: true // Auto publish for testing
      });
      
      alert("Exam Created Successfully!");
      navigate('/competitive-exams');
    } catch (error) {
      alert('Failed to create competitive exam');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <button 
        onClick={() => navigate('/competitive-exams')}
        className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-semibold mb-2"
      >
        <ArrowLeft size={18} /> Back to Dashboard
      </button>

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-8 py-6 text-white">
          <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-3">
            <Plus className="h-8 w-8" />
            Create Competitive Exam
          </h1>
          <p className="text-indigo-100 mt-2">Configure JEE / NEET pattern mock tests.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Exam Title</label>
              <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="e.g., JEE Mains Grand Test 1" />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Class</label>
              <select required value={formData.classId} onChange={e => setFormData({...formData, classId: e.target.value, subjectId: ''})} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                <option value="">Select Class</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.section ? `- ${c.section}` : ''}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Subject</label>
              <select required value={formData.subjectId} disabled={!formData.classId} onChange={e => setFormData({...formData, subjectId: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-50">
                <option value="">{formData.classId ? "Select Subject" : "Select a class first"}</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Total Marks</label>
              <input type="number" required value={formData.totalMarks} onChange={e => setFormData({...formData, totalMarks: parseInt(e.target.value)})} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Negative Marks (Per Question)</label>
              <input type="number" required value={formData.negativeMarks} onChange={e => setFormData({...formData, negativeMarks: parseInt(e.target.value)})} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all" />
            </div>

            <div className="col-span-2 grid grid-cols-1 md:grid-cols-3 gap-5 bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
              <div>
                <label className="block text-sm font-bold text-indigo-900 mb-1.5 flex items-center gap-1.5"><Calendar size={16} /> Date</label>
                <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-indigo-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-indigo-900 mb-1.5 flex items-center gap-1.5"><Clock size={16} /> Start Time</label>
                <input type="time" required value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-indigo-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-indigo-900 mb-1.5 flex items-center gap-1.5"><Clock size={16} /> End Time</label>
                <input type="time" required value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-indigo-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Duration (Minutes)</label>
              <input type="number" required value={formData.duration} onChange={e => setFormData({...formData, duration: parseInt(e.target.value)})} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5"><AlertCircle size={14}/> Auto calculated for exam session timer.</p>
            </div>
          </div>
          
          <div className="mt-10 flex justify-end gap-4 border-t border-slate-100 pt-6">
            <button type="button" onClick={() => navigate('/competitive-exams')} className="px-6 py-3 text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 font-bold transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50">
              {loading ? 'Creating...' : 'Create Exam'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCompetitiveExamPage;
