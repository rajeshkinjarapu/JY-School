import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Badge } from '../../components/UI/Badge';
import { Plus, Edit, Trash2, School } from 'lucide-react';
import { Avatar } from '../../components/UI/Avatar';
import toast from 'react-hot-toast';

export const SubjectPage: React.FC = () => {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [classId, setClassId] = useState('');
  const [teacherId, setTeacherId] = useState('');

  const fetchData = async () => {
    try {
      const [subRes, classRes, teachRes]: any = await Promise.all([
        api.get('/api/subjects'),
        api.get('/api/classes'),
        api.get('/api/teachers'),
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
      <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-150 dark:border-gray-800">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white">Curriculum & Subjects</h3>
          <p className="text-xs text-gray-400">Map course subjects, codes, classes, and teachers.</p>
        </div>
        <button
          onClick={() => {
            setEditingSubject(null);
            setName('');
            setCode('');
            setClassId('');
            setTeacherId('');
            setShowModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4.5 h-4.5" />
          <span>New Subject</span>
        </button>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" className="py-12" />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/40 text-gray-500 font-semibold border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4">Subject Name</th>
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Class</th>
                <th className="px-6 py-4">Assigned Teacher</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
              {subjects.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/10">
                  <td className="px-6 py-4 font-semibold text-gray-950 dark:text-white">{sub.name}</td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">{sub.code}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center shadow-sm">
                        <School className="w-4.5 h-4.5" />
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {sub.class ? `${sub.class.name}-${sub.class.section}` : 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {sub.classSubjectTeachers?.[0]?.teacher ? (
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          name={sub.classSubjectTeachers[0].teacher.user.name}
                          src={sub.classSubjectTeachers[0].teacher.user.photoUrl}
                          size="sm"
                          variant="rectangular"
                        />
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {sub.classSubjectTeachers[0].teacher.user.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-450 italic text-xs">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEditClick(sub)}
                        className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/20 transition-all cursor-pointer"
                        title="Edit Subject"
                      >
                        <Edit className="w-4.5 h-4.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(sub.id)}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer"
                        title="Delete Subject"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {subjects.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    No subjects configured yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
