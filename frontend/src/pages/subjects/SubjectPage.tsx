import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Badge } from '../../components/UI/Badge';
import { Plus, Edit, Trash2, School, Upload, FileDown } from 'lucide-react';
import { Avatar } from '../../components/UI/Avatar';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { getPhotoUrl } from '../../utils/photo';

export const SubjectPage: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [classId, setClassId] = useState('');
  const [teacherId, setTeacherId] = useState('');

  const fetchData = async () => {
    try {
      const [subRes, classRes, teachRes]: any = await Promise.all([
        api.get('/api/subjects?limit=5000'),
        api.get('/api/classes?limit=5000'),
        api.get('/api/teachers?limit=5000'),
      ]);
      setSubjects(subRes.data || subRes || []);
      setClasses(classRes.data || classRes || []);
      setTeachers(teachRes.data.data || teachRes.data || []);
    } catch (e) {
      toast.error('Failed to load curriculum data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEditClick = (sub: any) => {
    setEditingSubject(sub);
    setName(sub.name);
    setCode(sub.code);
    setClassId(sub.classId);
    setTeacherId(sub.classSubjectTeachers?.[0]?.teacherId || '');
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this subject? This action cannot be undone.')) return;
    try {
      await api.delete(`/api/subjects/${id}`);
      toast.success('Subject deleted successfully!');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete subject');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSubject) {
        // 1. Update subject details
        await api.put(`/api/subjects/${editingSubject.id}`, { name, code });

        // 2. Assign/update teacher mapping
        if (teacherId) {
          await api.post('/api/subjects/assign-teacher', {
            classId,
            subjectId: editingSubject.id,
            teacherId,
          });
        }
        toast.success('Subject updated successfully!');
      } else {
        // 1. Create subject
        const subRes: any = await api.post('/api/subjects', { name, code, classId });
        const subject = subRes.data;

        // 2. Assign teacher if selected
        if (teacherId) {
          await api.post('/api/subjects/assign-teacher', {
            classId,
            subjectId: subject.id,
            teacherId,
          });
        }
        toast.success('Subject created and mapped successfully!');
      }

      setShowModal(false);
      setName('');
      setCode('');
      setClassId('');
      setTeacherId('');
      setEditingSubject(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Error saving subject details');
    }
  };



  return (
    <div className="space-y-6">
      <div className="flex justify-end px-4 md:px-0 md:justify-between items-center md:bg-white md:dark:bg-gray-900 md:p-4 md:rounded-2xl md:border md:border-gray-150 md:dark:border-gray-800">
        <div className="hidden md:block">
          <h3 className="font-bold text-gray-900 dark:text-white">Curriculum & Subjects</h3>
          <p className="text-xs text-gray-400">Map course subjects, codes, classes, and teachers.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">

          <button
            onClick={() => {
              setEditingSubject(null);
              setName('');
              setCode('');
              setClassId('');
              setTeacherId('');
              setShowModal(true);
            }}
            className="btn-primary flex items-center justify-center gap-2 w-full md:w-auto"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>New Subject</span>
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" className="py-12" />
      ) : (
        <div className="md:bg-white/40 md:dark:bg-white/5 md:border md:border-white/60 md:dark:border-white/10 md:rounded-3xl md:shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden md:backdrop-blur-2xl">
          
          {/* Grid View for All Devices */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-transparent">
            {subjects.map((sub, idx) => (
              <div key={sub.id} className="bg-gradient-to-br from-white to-indigo-50/30 p-4 rounded-3xl shadow-sm hover:shadow-glow-primary hover:-translate-y-1 transition-all duration-300 border border-indigo-50 flex items-center gap-4 relative overflow-visible mt-2 backdrop-blur-md animate-fade-in-up" style={{ animationDelay: `${idx * 40}ms` }}>
                 <div className="absolute -top-2.5 -left-2.5 w-7 h-7 bg-indigo-500 rounded-full flex items-center justify-center text-white font-black text-[10px] shadow-lg border-2 border-white z-10">
                   {idx + 1}
                 </div>
                 <div className="shrink-0 pl-2">
                   <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-md border-2 border-white">
                     {sub.name.substring(0, 2).toUpperCase()}
                   </div>
                 </div>
                 <div className="flex-1 min-w-0">
                   <h4 className="font-extrabold text-[15px] text-indigo-950 truncate mb-1.5">{sub.name}</h4>
                   <div className="flex flex-wrap gap-1.5">
                     <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">{sub.code}</span>
                     <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">{sub.class ? `${sub.class.name}-${sub.class.section}` : 'N/A'}</span>
                   </div>
                   <div className="mt-1.5 text-[10px] font-semibold text-gray-500">
                      Teacher: {sub.classSubjectTeachers?.[0]?.teacher ? sub.classSubjectTeachers[0].teacher.user.name : 'Unassigned'}
                   </div>
                 </div>
                 <div className="shrink-0 flex flex-col gap-2">
                   <button onClick={() => handleEditClick(sub)} className="flex items-center justify-center w-8 h-8 bg-gray-50 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 rounded-lg transition-all shadow-sm border border-gray-200 cursor-pointer">
                     <Edit className="w-3.5 h-3.5" />
                   </button>
                   {isSuperAdmin && (
                      <button onClick={() => handleDelete(sub.id)} className="flex items-center justify-center w-8 h-8 bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 rounded-lg transition-all shadow-sm border border-red-200 cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                   )}
                 </div>
              </div>
            ))}
            {subjects.length === 0 && (
              <div className="py-12 text-center text-gray-400 font-semibold">
                No subjects found.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="card w-full max-w-md p-6 space-y-6">
            <div>
              <h3 className="text-xl font-bold">{editingSubject ? 'Edit Subject' : 'Add New Subject'}</h3>
              <p className="text-xs text-gray-400">
                {editingSubject ? 'Modify classroom details and assigned teacher.' : 'Configure a new subject and assign teaching staff.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Subject Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Science"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Subject Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS10"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Class Room</label>
                <select
                  required
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="input"
                  disabled={!!editingSubject}
                >
                  <option value="">Select Class</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}-{c.section}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Assign Teacher (Optional)</label>
                <select
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className="input"
                >
                  <option value="">Select Teacher</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.user.name} ({t.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary text-sm"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-sm">
                  {editingSubject ? 'Save Changes' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectPage;

