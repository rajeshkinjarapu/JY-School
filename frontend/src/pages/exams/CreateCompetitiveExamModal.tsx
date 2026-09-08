import React, { useState } from 'react';
import api from '../../api/axios';
import { X, Calendar, Clock, BookOpen, AlertCircle } from 'lucide-react';

interface Props {
  onClose: () => void;
}

const CreateCompetitiveExamModal = ({ onClose }: Props) => {
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
  const [classes, setClasses] = useState<any[]>([]); // mock
  const [subjects, setSubjects] = useState<any[]>([]); // mock

  // We should ideally fetch classes and subjects. Hardcoded for brevity.
  
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
      
      onClose();
    } catch (error) {
      alert('Failed to create competitive exam');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
        <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center text-white">
          <h2 className="text-xl font-bold">Create Competitive Exam (JEE/NEET)</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors"><X size={24} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Exam Title</label>
              <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g., JEE Mains Grand Test 1" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class ID (Temp text input)</label>
              <input type="text" required value={formData.classId} onChange={e => setFormData({...formData, classId: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Class ID" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject ID (Temp text input)</label>
              <input type="text" required value={formData.subjectId} onChange={e => setFormData({...formData, subjectId: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Subject ID" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Marks</label>
              <input type="number" required value={formData.totalMarks} onChange={e => setFormData({...formData, totalMarks: parseInt(e.target.value)})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Negative Marks (Per Question)</label>
              <input type="number" required value={formData.negativeMarks} onChange={e => setFormData({...formData, negativeMarks: parseInt(e.target.value)})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            </div>

            <div className="col-span-2 grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1"><Calendar size={14} className="inline mr-1"/> Date</label>
                <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1"><Clock size={14} className="inline mr-1"/> Start Time</label>
                <input type="time" required value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1"><Clock size={14} className="inline mr-1"/> End Time</label>
                <input type="time" required value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Minutes)</label>
              <input type="number" required value={formData.duration} onChange={e => setFormData({...formData, duration: parseInt(e.target.value)})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><AlertCircle size={12}/> Auto calculated for exam session timer.</p>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium">Cancel</button>
            <button type="submit" disabled={loading} className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50">
              {loading ? 'Creating...' : 'Create Exam'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCompetitiveExamModal;
