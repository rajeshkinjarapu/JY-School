import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../../api/axios';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateOnlineExamModal: React.FC<CreateModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    classId: '',
    subjectId: '',
    duration: 30,
    startTime: '',
    endTime: '',
    totalMarks: 100,
    passMarks: 40
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchClasses();
    }
  }, [isOpen]);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/api/classes');
      setClasses(res.data?.data || res.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSubjects = async (classId: string) => {
    try {
      const res = await api.get(`/api/subjects?classId=${classId}`);
      setSubjects(res.data?.data || res.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const classId = e.target.value;
    setFormData({ ...formData, classId, subjectId: '' });
    fetchSubjects(classId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/online-exams', formData);
      onSuccess();
    } catch (error) {
      console.error(error);
      alert('Failed to create exam. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputCls = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
  const labelCls = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center bg-indigo-600 px-6 py-4 text-white">
          <h2 className="text-xl font-bold">Create Online Exam</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={labelCls}>Quiz Title</label>
            <input
              className={inputCls}
              required
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              placeholder="e.g. Weekly Math Assessment"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Class</label>
              <select className={inputCls} required value={formData.classId} onChange={handleClassChange}>
                <option value="">Select Class</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} {c.section}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Subject</label>
              <select
                className={inputCls}
                required
                value={formData.subjectId}
                onChange={e => setFormData({...formData, subjectId: e.target.value})}
                disabled={!formData.classId}
              >
                <option value="">Select Subject</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Start Time</label>
              <input type="datetime-local" className={inputCls} required value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />
            </div>
            <div>
              <label className={labelCls}>End Time</label>
              <input type="datetime-local" className={inputCls} required value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Duration (Mins)</label>
              <input type="number" className={inputCls} required value={formData.duration} onChange={e => setFormData({...formData, duration: parseInt(e.target.value)})} />
            </div>
            <div>
              <label className={labelCls}>Total Marks</label>
              <input type="number" className={inputCls} required value={formData.totalMarks} onChange={e => setFormData({...formData, totalMarks: parseInt(e.target.value)})} />
            </div>
            <div>
              <label className={labelCls}>Pass Marks</label>
              <input type="number" className={inputCls} required value={formData.passMarks} onChange={e => setFormData({...formData, passMarks: parseInt(e.target.value)})} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50">
              {loading ? 'Creating...' : 'Create Exam'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOnlineExamModal;
