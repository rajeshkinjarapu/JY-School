import React, { useEffect, useState } from 'react';
import { Plus, Trash2, CalendarDays, CheckSquare } from 'lucide-react';
import toast from 'react-hot-toast';

export const LeaveTypePage: React.FC = () => {
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  
  // Form States
  const [formName, setFormName] = useState('');
  const [formStatus, setFormStatus] = useState('Active');
  const [formRole, setFormRole] = useState('Staff');
  const [formDesc, setFormDesc] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('fin_leave_types');
    if (!stored) {
      const defaultTypes = [
        { id: '1', name: 'Sick Leave', desc: 'Staff Sick Leave Type', role: 'Staff', status: 'Active' },
        { id: '2', name: 'Personal Leave', desc: 'Staff Personal Leave Type', role: 'Staff', status: 'Active' },
        { id: '3', name: 'Health Issue Leave', desc: 'Staff Health Issue Leave Type', role: 'Staff', status: 'Active' },
        { id: '4', name: 'Casual Leave', desc: 'Staff Casual Leave Type', role: 'Staff', status: 'Active' },
      ];
      localStorage.setItem('fin_leave_types', JSON.stringify(defaultTypes));
      setLeaveTypes(defaultTypes);
    } else {
      setLeaveTypes(JSON.parse(stored));
    }
  }, []);

  const saveTypes = (updated: any[]) => {
    setLeaveTypes(updated);
    localStorage.setItem('fin_leave_types', JSON.stringify(updated));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error('Leave type name is required.');
      return;
    }

    const newType = {
      id: Date.now().toString(),
      name: formName.trim(),
      desc: formDesc.trim() || 'No description provided',
      role: formRole,
      status: formStatus,
    };

    saveTypes([...leaveTypes, newType]);
    toast.success('Leave Type added successfully!');
    setFormName('');
    setFormDesc('');
    setFormRole('Staff');
    setFormStatus('Active');
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this leave type?')) {
      const updated = leaveTypes.filter(t => t.id !== id);
      saveTypes(updated);
      toast.success('Leave Type deleted successfully!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="pb-4 border-b border-gray-100 dark:border-gray-800">
        <h3 className="text-xl font-black text-gray-900 dark:text-white">Leave Type</h3>
        <p className="text-xs text-indigo-500 font-semibold mt-0.5">Home / Leave Type</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Form Panel (1 Col) */}
        <div className="px-4 md:px-0 md:bg-white md:dark:bg-gray-900 md:border md:border-gray-150 md:dark:border-gray-800 md:rounded-3xl md:p-6 md:shadow-sm space-y-4 animate-fade-in">
          <h4 className="text-base font-extrabold text-gray-950 dark:text-white pb-3 border-b border-gray-100 dark:border-gray-800">
            Leave Type
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="label text-xs uppercase font-extrabold text-gray-400">Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                placeholder="Enter Name"
                className="input w-full bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/25"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="label text-xs uppercase font-extrabold text-gray-400">Role</label>
              <select
                className="input w-full bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/25"
                value={formRole}
                onChange={e => setFormRole(e.target.value)}
              >
                <option value="Staff">Staff</option>
                <option value="Teacher">Teacher</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="label text-xs uppercase font-extrabold text-gray-400">Status <span className="text-red-500">*</span></label>
              <select
                className="input w-full bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/25"
                value={formStatus}
                onChange={e => setFormStatus(e.target.value)}
                required
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="label text-xs uppercase font-extrabold text-gray-400">Description</label>
              <textarea
                placeholder="Enter Description"
                rows={4}
                className="input w-full bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/25"
                value={formDesc}
                onChange={e => setFormDesc(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#243e8b] hover:bg-[#1a2d66] text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-[#243e8b]/15 flex items-center justify-center gap-1.5"
            >
              <CheckSquare className="w-4 h-4" />
              Submit
            </button>
          </form>
        </div>

        {/* Right Column: Table Panel (2 Cols) */}
        <div className="lg:col-span-2 px-4 md:px-0 md:bg-white md:dark:bg-gray-900 md:border md:border-gray-150 md:dark:border-gray-800 md:rounded-3xl md:p-6 md:shadow-sm space-y-4 animate-fade-in mt-6 md:mt-0">
          <h4 className="text-base font-extrabold text-gray-955 dark:text-white pb-3 border-b border-gray-100 dark:border-gray-800">
            Leave Type
          </h4>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-gray-450 border-b border-gray-150 dark:border-gray-800 font-extrabold text-[11px] uppercase tracking-wider">
                  <th className="pb-3">Sr No</th>
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Short Desc</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {leaveTypes.map((t, index) => (
                  <tr key={t.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-855/10 transition-colors">
                    <td className="py-4 font-semibold text-gray-500">{index + 1}</td>
                    <td className="py-4 font-bold text-gray-900 dark:text-white">{t.name}</td>
                    <td className="py-4 text-gray-500 text-xs font-medium">{t.desc}</td>
                    <td className="py-4 text-gray-600 dark:text-gray-300 font-semibold">{t.role}</td>
                    <td className="py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        t.status === 'Active'
                          ? 'bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-400'
                          : 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="w-8 h-8 rounded-full bg-indigo-50 hover:bg-red-50 text-indigo-650 hover:text-red-600 flex items-center justify-center transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {leaveTypes.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">No leave types configured.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LeaveTypePage;
