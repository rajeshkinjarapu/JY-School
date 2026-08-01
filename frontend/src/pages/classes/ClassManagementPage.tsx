import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Badge } from '../../components/UI/Badge';
import { School, User, Users, Plus, Trash2, Edit3, Upload, FileDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const ClassManagementPage: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Form states
  const [name, setName] = useState('');
  const [section, setSection] = useState('');
  const [academicYear, setAcademicYear] = useState('2024-2025');
  const [classTeacherId, setClassTeacherId] = useState('');
  const [capacity, setCapacity] = useState(40);

  const fetchClasses = async () => {
    try {
      const res: any = await api.get('/api/classes');
      setClasses(res.data || res || []);
    } catch (e) {
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res: any = await api.get('/api/teachers');
      setTeachers(res.data.data || res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
  }, []);

  const openCreateModal = () => {
    setEditingClassId(null);
    setName('');
    setSection('');
    setAcademicYear('2024-2025');
    setClassTeacherId('');
    setCapacity(40);
    setShowModal(true);
  };

  const openEditModal = (cls: any) => {
    setEditingClassId(cls.id);
    setName(cls.name);
    setSection(cls.section);
    setAcademicYear(cls.academicYear || '2024-2025');
    setClassTeacherId(cls.classTeacherId || '');
    setCapacity(cls.capacity || 40);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingClassId) {
        await api.put(`/api/classes/${editingClassId}`, {
          name,
          section,
          academicYear,
          classTeacherId: classTeacherId || null,
          capacity: Number(capacity),
        });
        toast.success('Class updated successfully!');
      } else {
        await api.post('/api/classes', {
          name,
          section,
          academicYear,
          classTeacherId: classTeacherId || null,
          capacity: Number(capacity),
        });
        toast.success('Class created successfully!');
      }
      setShowModal(false);
      setName('');
      setSection('');
      setClassTeacherId('');
      setEditingClassId(null);
      fetchClasses();
    } catch (error: any) {
      toast.error(error.message || 'Error saving class');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this class? This will delete all course metadata.')) return;
    try {
      await api.delete(`/api/classes/${id}`);
      toast.success('Class deleted successfully');
      fetchClasses();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete class');
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/50 -m-6 h-[calc(100vh-64px)]">
      {/* Colorful Header */}
      <div className="px-3 pt-3 pb-4 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-white drop-shadow-sm">Classes Directory</h1>
          <p className="text-white/80 text-sm font-medium mt-1">Manage all grades, sections, and class teacher assignments.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button onClick={openCreateModal} className="flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-extrabold text-indigo-700 bg-white rounded-xl shadow hover:bg-indigo-50 transition-colors w-full md:w-auto cursor-pointer">
            <Plus className="w-4 h-4" />
            <span>New Class</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="min-w-[800px] w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-600 border-b border-gray-200 font-bold uppercase tracking-wider text-xs">
                <th className="px-5 py-4 text-center w-12 border-r border-gray-100">#</th>
                <th className="px-5 py-4 border-r border-gray-100">Class Info</th>
                <th className="px-5 py-4 border-r border-gray-100">Academic Year</th>
                <th className="px-5 py-4 border-r border-gray-100">Students</th>
                <th className="px-5 py-4 border-r border-gray-100">Class Teacher</th>
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
              ) : classes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 font-bold">
                    No classes configured yet. Create your first class!
                  </td>
                </tr>
              ) : (
                classes.map((cls, idx) => (
                  <tr key={cls.id} className="hover:bg-indigo-50/50 transition-colors bg-white">
                    <td className="px-5 py-4 text-center text-sm font-bold text-gray-500 border-r border-gray-100">
                      {idx + 1}
                    </td>
                    <td className="px-5 py-4 border-r border-gray-100">
                      <Link to={`/classes/${cls.id}`} className="flex items-center gap-3 group">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded flex items-center justify-center text-white shadow-sm shrink-0">
                          <School className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm group-hover:text-indigo-600 transition-colors">
                            {cls.name}-{cls.section}
                          </h4>
                          <span className="text-xs text-gray-500">View details</span>
                        </div>
                      </Link>
                    </td>
                    <td className="px-5 py-4 border-r border-gray-100">
                      <span className="text-xs font-bold text-fuchsia-700 bg-fuchsia-50 border border-fuchsia-100 px-3 py-1.5 rounded uppercase shadow-sm">
                        {cls.academicYear}
                      </span>
                    </td>
                    <td className="px-5 py-4 border-r border-gray-100">
                      <div className="flex items-center gap-2 text-gray-700 font-medium text-sm">
                        <Users className="w-4 h-4 text-gray-400" />
                        {cls._count?.students || 0} Students
                      </div>
                    </td>
                    <td className="px-5 py-4 border-r border-gray-100">
                      <div className="flex items-center gap-2 text-gray-700 font-medium text-sm">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="truncate">
                          {cls.classTeacher?.user?.name || 'No Teacher'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(cls)}
                          className="p-2 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                          title="Edit class"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {isSuperAdmin && (
                          <button
                            onClick={() => handleDelete(cls.id)}
                            className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete class"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
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
              <h3 className="text-xl font-bold">
                {editingClassId ? 'Edit Class Details' : 'Add New Class'}
              </h3>
              <p className="text-xs text-gray-400">Configure class details and assignments.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Class/Grade Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grade 10"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Section (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. A"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Class Teacher</label>
                <select
                  value={classTeacherId}
                  onChange={(e) => setClassTeacherId(e.target.value)}
                  className="input"
                >
                  <option value="">Select Class Teacher</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.user.name} ({t.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Student Capacity</label>
                <input
                  type="number"
                  required
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="input"
                />
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
                  {editingClassId ? 'Save Changes' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default ClassManagementPage;

