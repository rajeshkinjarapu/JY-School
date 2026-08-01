import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Plus, Edit, Trash2, BookOpen, ChevronRight, School } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

const SUBJECT_COLORS = [
  { bg: 'from-violet-500 to-purple-600', light: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-100', dot: 'bg-violet-500' },
  { bg: 'from-blue-500 to-indigo-600', light: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100', dot: 'bg-blue-500' },
  { bg: 'from-emerald-500 to-teal-600', light: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', dot: 'bg-emerald-500' },
  { bg: 'from-rose-500 to-pink-600', light: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100', dot: 'bg-rose-500' },
  { bg: 'from-amber-500 to-orange-500', light: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', dot: 'bg-amber-500' },
  { bg: 'from-cyan-500 to-sky-600', light: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-100', dot: 'bg-cyan-500' },
  { bg: 'from-fuchsia-500 to-purple-600', light: 'bg-fuchsia-50', text: 'text-fuchsia-700', border: 'border-fuchsia-100', dot: 'bg-fuchsia-500' },
  { bg: 'from-lime-500 to-green-600', light: 'bg-lime-50', text: 'text-lime-700', border: 'border-lime-100', dot: 'bg-lime-500' },
];

export const SubjectPage: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

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

  // Group subjects by name
  const groupedSubjects = subjects.reduce((acc: Record<string, any[]>, sub: any) => {
    const key = sub.name?.trim() || 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(sub);
    return acc;
  }, {});

  const uniqueSubjectNames = Object.keys(groupedSubjects).sort();

  const handleEditClick = (sub: any) => {
    setEditingSubject(sub);
    setName(sub.name);
    setCode(sub.code);
    setClassId(sub.classId);
    setTeacherId(sub.classSubjectTeachers?.[0]?.teacherId || '');
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this subject entry?')) return;
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
        await api.put(`/api/subjects/${editingSubject.id}`, { name, code });
        if (teacherId) {
          await api.post('/api/subjects/assign-teacher', {
            classId,
            subjectId: editingSubject.id,
            teacherId,
          });
        }
        toast.success('Subject updated successfully!');
      } else {
        const subRes: any = await api.post('/api/subjects', { name, code, classId });
        const subject = subRes.data;
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
    <div className="flex flex-col h-full bg-gray-50/50 -m-6 h-[calc(100vh-64px)]">
      {/* Colorful Header */}
      <div className="px-6 py-6 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-white drop-shadow-sm">Subjects & Curriculum</h1>
          <p className="text-white/80 text-sm font-medium mt-1">Manage subjects and assign them to specific classes and teachers.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={() => {
              setEditingSubject(null);
              setName('');
              setCode('');
              setClassId('');
              setTeacherId('');
              setShowModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-extrabold text-indigo-700 bg-white rounded-xl shadow hover:bg-indigo-50 transition-colors w-full md:w-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Subject</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="min-w-[800px] w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-600 border-b border-gray-200 font-bold uppercase tracking-wider text-xs">
                <th className="px-5 py-4 text-center w-12 border-r border-gray-100">#</th>
                <th className="px-5 py-4 border-r border-gray-100">Subject Info</th>
                <th className="px-5 py-4 border-r border-gray-100">Code</th>
                <th className="px-5 py-4 border-r border-gray-100">Class</th>
                <th className="px-5 py-4 border-r border-gray-100">Teacher</th>
                <th className="px-5 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <LoadingSpinner size="lg" />
                  </td>
                </tr>
              ) : subjects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 font-bold">
                    No subjects configured yet.
                  </td>
                </tr>
              ) : (
                subjects.map((sub, idx) => {
                  const teacherName = sub.classSubjectTeachers?.[0]?.teacher?.user?.name;
                  return (
                    <tr key={sub.id} className="hover:bg-indigo-50/50 transition-colors bg-white">
                      <td className="px-5 py-4 text-center text-sm font-bold text-gray-500 border-r border-gray-100">
                        {idx + 1}
                      </td>
                      <td className="px-5 py-4 border-r border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded flex items-center justify-center text-white font-black text-sm shadow-sm shrink-0">
                            {sub.name?.substring(0, 2).toUpperCase() || 'SB'}
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm">
                              {sub.name}
                            </h4>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 border-r border-gray-100">
                        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded font-mono uppercase shadow-sm">
                          {sub.code || 'N/A'}
                        </span>
                      </td>
                      <td className="px-5 py-4 border-r border-gray-100">
                        <div className="flex items-center gap-2 text-gray-700 font-medium text-sm">
                          <School className="w-4 h-4 text-gray-400 shrink-0" />
                          <span>{sub.class ? `${sub.class.name}-${sub.class.section}` : 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 border-r border-gray-100">
                        <div className="flex items-center gap-2 text-gray-700 font-medium text-sm">
                          <span className="truncate">
                            {teacherName || 'No Teacher'}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEditClick(sub)}
                            className="p-2 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {isSuperAdmin && (
                            <button
                              onClick={() => handleDelete(sub.id)}
                              className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

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
                  placeholder="e.g. Mathematics"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Subject Code (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. MATH"
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
