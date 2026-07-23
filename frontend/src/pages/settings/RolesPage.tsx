import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Shield, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export const RolesPage: React.FC = () => {
  const [roles, setRoles] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  
  // Form States
  const [formName, setFormName] = useState('');
  const [formPermissionsCount, setFormPermissionsCount] = useState('0');
  const [formStatus, setFormStatus] = useState('Active');

  useEffect(() => {
    const stored = localStorage.getItem('fin_roles');
    if (!stored) {
      const defaultRoles = [
        { id: '1', name: 'Super Admin', permissions: 294, status: 'Active' },
        { id: '2', name: 'Admin', permissions: 17, status: 'Active' },
        { id: '3', name: 'Staff', permissions: 0, status: 'Active' },
        { id: '4', name: 'Accounting', permissions: 17, status: 'Active' },
        { id: '5', name: 'Teacher', permissions: 10, status: 'Active' },
        { id: '6', name: 'Student', permissions: 0, status: 'Active' },
        { id: '7', name: 'Gurdian', permissions: 0, status: 'Active' },
      ];
      localStorage.setItem('fin_roles', JSON.stringify(defaultRoles));
      setRoles(defaultRoles);
    } else {
      setRoles(JSON.parse(stored));
    }
  }, []);

  const saveRoles = (updated: any[]) => {
    setRoles(updated);
    localStorage.setItem('fin_roles', JSON.stringify(updated));
  };

  const handleAddRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error('Role name is required.');
      return;
    }

    const newRole = {
      id: Date.now().toString(),
      name: formName.trim(),
      permissions: Number(formPermissionsCount) || 0,
      status: formStatus,
    };

    saveRoles([...roles, newRole]);
    toast.success('Role added successfully!');
    setShowModal(false);
    setFormName('');
    setFormPermissionsCount('0');
    setFormStatus('Active');
  };

  const handleDeleteRole = (id: string) => {
    if (confirm('Are you sure you want to delete this role?')) {
      const updated = roles.filter(r => r.id !== id);
      saveRoles(updated);
      toast.success('Role deleted successfully!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Header */}
      <div className="pb-4 border-b border-gray-100 dark:border-gray-800">
        <h3 className="text-xl font-black text-gray-900 dark:text-white">Roles</h3>
        <p className="text-xs text-indigo-500 font-semibold mt-0.5">Home / Roles</p>
      </div>

      {/* Main card wrapper */}
      <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <h4 className="text-base font-extrabold text-gray-955 dark:text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-500" />
            Roles
          </h4>
          <button
            onClick={() => setShowModal(true)}
            className="bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-indigo-500/15 flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Role
          </button>
        </div>

        {/* Roles Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-gray-450 border-b border-gray-150 dark:border-gray-800 font-extrabold text-[11px] uppercase tracking-wider">
                <th className="pb-3">Sr No</th>
                <th className="pb-3">Name</th>
                <th className="pb-3">Permissions</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {roles.map((r, index) => (
                <tr key={r.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-855/10 transition-colors">
                  <td className="py-4 font-semibold text-gray-500">{index + 1}</td>
                  <td className="py-4 font-bold text-gray-900 dark:text-white">{r.name}</td>
                  <td className="py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#e8f8f5] text-[#1abc9c]">
                      {r.permissions}
                    </span>
                  </td>
                  <td className="py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      r.status === 'Active' 
                        ? 'bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-400' 
                        : 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    {r.name !== 'Super Admin' && (
                      <button
                        onClick={() => handleDeleteRole(r.id)}
                        className="w-8 h-8 rounded-full bg-indigo-50 hover:bg-red-50 text-indigo-650 hover:text-red-600 flex items-center justify-center transition-colors cursor-pointer"
                        title="Delete Role"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {roles.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">No roles configured.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Role Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/45 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-150 dark:border-gray-800 shadow-xl max-w-md w-full space-y-4 animate-scale-in">
            <h4 className="text-base font-extrabold text-gray-900 dark:text-white border-b pb-2 mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
              Create Role
            </h4>
            <form onSubmit={handleAddRole} className="space-y-4">
              <div className="space-y-1">
                <label className="label text-xs uppercase font-extrabold text-gray-400">Role Name</label>
                <input
                  type="text"
                  className="input w-full bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm font-bold outline-none"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="e.g. Accounting"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="label text-xs uppercase font-extrabold text-gray-400">Permissions Count</label>
                <input
                  type="number"
                  className="input w-full bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm font-bold outline-none"
                  value={formPermissionsCount}
                  onChange={e => setFormPermissionsCount(e.target.value)}
                  placeholder="e.g. 17"
                />
              </div>

              <div className="space-y-1">
                <label className="label text-xs uppercase font-extrabold text-gray-400">Status</label>
                <select
                  className="input w-full bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm font-bold outline-none"
                  value={formStatus}
                  onChange={e => setFormStatus(e.target.value)}
                  required
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary px-4 py-2 rounded-xl text-xs font-bold transition-all border border-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-650 hover:bg-indigo-750 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow transition-all"
                >
                  Save Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolesPage;

