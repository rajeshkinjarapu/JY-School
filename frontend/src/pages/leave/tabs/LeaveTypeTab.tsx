import React, { useState, useEffect } from 'react';
import { Trash2, CheckSquare } from 'lucide-react';
import toast from 'react-hot-toast';

const LeaveTypeTab: React.FC = () => {
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState('Staff');
  const [formStatus, setFormStatus] = useState('Active');
  const [formDesc, setFormDesc] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('fin_leave_types');
    if (stored) {
      setLeaveTypes(JSON.parse(stored));
    } else {
      const defaults = [
        { id: '1', name: 'Sick Leave', role: 'Staff', status: 'Active', desc: 'Medical emergencies' },
        { id: '2', name: 'Casual Leave', role: 'Teacher', status: 'Active', desc: 'Personal reasons' }
      ];
      setLeaveTypes(defaults);
      localStorage.setItem('fin_leave_types', JSON.stringify(defaults));
    }
  }, []);

  const saveTypes = (updated: any[]) => {
    setLeaveTypes(updated);
    localStorage.setItem('fin_leave_types', JSON.stringify(updated));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error('Name is required');
      return;
    }
    const newType = {
      id: Date.now().toString(),
      name: formName.trim(),
      role: formRole,
      status: formStatus,
      desc: formDesc.trim()
    };
    saveTypes([...leaveTypes, newType]);
    toast.success('Leave Type added successfully!');
    setFormName('');
    setFormDesc('');
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this leave type?')) {
      const updated = leaveTypes.filter(t => t.id !== id);
      saveTypes(updated);
      toast.success('Leave Type deleted successfully!');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
      <div className="space-y-4">
        <h4 className="text-lg font-black text-gray-900 border-b border-gray-100 pb-3">
          Leave Type
        </h4>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              placeholder="Enter Name"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              value={formName}
              onChange={e => setFormName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Role</label>
            <select
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              value={formRole}
              onChange={e => setFormRole(e.target.value)}
            >
              <option value="Staff">Staff</option>
              <option value="Teacher">Teacher</option>
              <option value="Student">Student</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Status <span className="text-red-500">*</span></label>
            <select
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              value={formStatus}
              onChange={e => setFormStatus(e.target.value)}
              required
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Description</label>
            <textarea
              placeholder="Enter Description"
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              value={formDesc}
              onChange={e => setFormDesc(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-1.5"
          >
            <CheckSquare className="w-4 h-4" />
            Submit
          </button>
        </form>
      </div>

      <div className="lg:col-span-2 space-y-4 lg:pl-6 lg:border-l border-gray-100">
        <h4 className="text-lg font-black text-gray-900 border-b border-gray-100 pb-3">
          Existing Leave Types
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-gray-400 border-b border-gray-100 font-extrabold text-xs uppercase tracking-wider">
                <th className="pb-3">Sr No</th>
                <th className="pb-3">Name</th>
                <th className="pb-3">Short Desc</th>
                <th className="pb-3">Role</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {leaveTypes.map((t, index) => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 font-semibold text-gray-500">{index + 1}</td>
                  <td className="py-4 font-bold text-gray-900">{t.name}</td>
                  <td className="py-4 text-gray-500 text-xs font-medium">{t.desc}</td>
                  <td className="py-4 text-gray-600 font-semibold">{t.role}</td>
                  <td className="py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      t.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-red-50 text-red-700'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="w-8 h-8 rounded-full bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-600 flex items-center justify-center transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {leaveTypes.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400 font-semibold">No leave types configured.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LeaveTypeTab;
