import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Search, User as UserIcon, Shield, Loader } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export const StaffManagement: React.FC = () => {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Form States
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState('ACCOUNTANT');
  const [formPhone, setFormPhone] = useState('');

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      // Fetch only accountants for now (Admin/SuperAdmin fetching can be added later)
      const res = await api.get('/users?role=ACCOUNTANT');
      setStaff(res.data.data);
    } catch (error) {
      toast.error('Failed to fetch staff');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/users', {
        name: formName,
        email: formEmail,
        password: formPassword,
        role: formRole,
        phone: formPhone
      });
      toast.success('Staff added successfully!');
      setShowModal(false);
      resetForm();
      fetchStaff();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add staff');
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (confirm('Are you sure you want to deactivate this staff account?')) {
      try {
        await api.delete(`/users/${id}`);
        toast.success('Staff deactivated successfully!');
        fetchStaff();
      } catch (error) {
        toast.error('Failed to deactivate staff');
      }
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormPhone('');
    setFormRole('ACCOUNTANT');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-gray-100 dark:border-gray-800">
        <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-indigo-500" />
          Staff Management
        </h3>
        <p className="text-xs text-indigo-500 font-semibold mt-0.5">Settings / Staff Management</p>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search staff..." 
              className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none w-64 focus:border-indigo-500"
            />
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-indigo-500/15 flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Staff
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-gray-450 border-b border-gray-150 dark:border-gray-800 font-extrabold text-[11px] uppercase tracking-wider">
                <th className="pb-3">Name</th>
                <th className="pb-3">Email</th>
                <th className="pb-3">Role</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center"><Loader className="w-6 h-6 animate-spin mx-auto text-indigo-500" /></td>
                </tr>
              ) : staff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">No staff found.</td>
                </tr>
              ) : (
                staff.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-855/10 transition-colors">
                    <td className="py-4 font-bold text-gray-900 dark:text-white flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      {s.name}
                    </td>
                    <td className="py-4 text-gray-600 dark:text-gray-400">{s.email}</td>
                    <td className="py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#e8f8f5] text-[#1abc9c]">
                        {s.role}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        s.isActive ? 'bg-teal-50 text-teal-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {s.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <button
                        onClick={() => handleDeleteStaff(s.id)}
                        className="w-8 h-8 rounded-full bg-indigo-50 hover:bg-red-50 text-indigo-650 hover:text-red-600 inline-flex items-center justify-center transition-colors cursor-pointer"
                        title="Deactivate Staff"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/45 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-150 dark:border-gray-800 shadow-xl max-w-md w-full space-y-4 animate-scale-in">
            <h4 className="text-base font-extrabold text-gray-900 dark:text-white border-b pb-2 mb-2 flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-indigo-500" />
              Add New Staff
            </h4>
            <form onSubmit={handleAddStaff} className="space-y-4">
              <div className="space-y-1">
                <label className="label text-xs uppercase font-extrabold text-gray-400">Name</label>
                <input
                  type="text"
                  className="input w-full bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm font-bold outline-none"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="label text-xs uppercase font-extrabold text-gray-400">Email (Username)</label>
                <input
                  type="email"
                  className="input w-full bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm font-bold outline-none"
                  value={formEmail}
                  onChange={e => setFormEmail(e.target.value)}
                  placeholder="john@jyschool.com"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="label text-xs uppercase font-extrabold text-gray-400">Password</label>
                <input
                  type="password"
                  className="input w-full bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm font-bold outline-none"
                  value={formPassword}
                  onChange={e => setFormPassword(e.target.value)}
                  placeholder="********"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="label text-xs uppercase font-extrabold text-gray-400">Phone (Optional)</label>
                <input
                  type="text"
                  className="input w-full bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm font-bold outline-none"
                  value={formPhone}
                  onChange={e => setFormPhone(e.target.value)}
                  placeholder="9876543210"
                />
              </div>

              <div className="space-y-1">
                <label className="label text-xs uppercase font-extrabold text-gray-400">Role</label>
                <select
                  className="input w-full bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm font-bold outline-none"
                  value={formRole}
                  onChange={e => setFormRole(e.target.value)}
                  required
                >
                  <option value="ACCOUNTANT">Accountant</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="btn-secondary px-4 py-2 rounded-xl text-xs font-bold transition-all border border-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-650 hover:bg-indigo-750 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow transition-all"
                >
                  Save Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;
