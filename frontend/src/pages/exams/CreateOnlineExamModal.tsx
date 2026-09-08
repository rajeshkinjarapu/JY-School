import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';

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
      const res = await api.get('/classes');
      if (res.data.success) {
        setClasses(res.data.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSubjects = async (classId: string) => {
    try {
      const res = await api.get(`/subjects?classId=${classId}`);
      if (res.data.success) {
        setSubjects(res.data.data);
      }
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
      const res = await api.post('/online-exams', formData);
      if (res.data.success) {
        onSuccess();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Online Exam</DialogTitle>
          <DialogDescription>Setup a new quiz for your students.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Quiz Title</Label>
            <Input 
              required 
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})} 
              placeholder="e.g. Weekly Math Assessment"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Class</Label>
              <select 
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={formData.classId}
                onChange={handleClassChange}
              >
                <option value="">Select Class</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} {c.section}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <select 
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
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
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input 
                type="datetime-local" 
                required
                value={formData.startTime}
                onChange={e => setFormData({...formData, startTime: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Input 
                type="datetime-local" 
                required
                value={formData.endTime}
                onChange={e => setFormData({...formData, endTime: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Duration (Mins)</Label>
              <Input 
                type="number" 
                required 
                value={formData.duration}
                onChange={e => setFormData({...formData, duration: parseInt(e.target.value)})}
              />
            </div>
            <div className="space-y-2">
              <Label>Total Marks</Label>
              <Input 
                type="number" 
                required 
                value={formData.totalMarks}
                onChange={e => setFormData({...formData, totalMarks: parseInt(e.target.value)})}
              />
            </div>
            <div className="space-y-2">
              <Label>Pass Marks</Label>
              <Input 
                type="number" 
                required 
                value={formData.passMarks}
                onChange={e => setFormData({...formData, passMarks: parseInt(e.target.value)})}
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Exam'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateOnlineExamModal;
