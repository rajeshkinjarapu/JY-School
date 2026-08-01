import React, { useEffect, useState } from 'react';
import { Plus, Trash2, CheckCircle, XCircle, Clock, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../api/axios';
import { useAuth } from '../../../hooks/useAuth';

const LeaveRequestTab: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const [requests, setRequests] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);

  // Form States
  const [formApplicant, setFormApplicant] = useState('');
  const [formTypeId, setFormTypeId] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formReason, setFormReason] = useState('');

  useEffect(() => {
    // Load types
    const storedTypes = localStorage.getItem('fin_leave_types');
    const types = storedTypes ? JSON.parse(storedTypes) : [
      { id: '1', name: 'Sick Leave' },
      { id: '2', name: 'Casual Leave' },
      { id: '3', name: 'Earned Leave' }
    ];
    setLeaveTypes(types);
    if (types.length > 0) setFormTypeId(types[0].id);

    // Load requests from API
    const fetchLeaves = async () => {
      try {
        const res = await api.get('/api/leave?limit=5000');
        setRequests(res.data.data || res.data || []);
      } catch (err) {
        console.error('Failed to fetch leaves', err);
      }
    };
    fetchLeaves();

    // Fetch teachers list
    api.get('/api/teachers?limit=5000')
      .then((res: any) => {
        const list = res.data.data || res.data || [];
        setTeachers(list);
        if (list.length > 0) {
          setFormApplicant(list[0].user.name);
        }
      })
      .catch(console.error);
  }, []);

  const saveRequests = (updated: any[]) => {
    setRequests(updated);
    localStorage.setItem('fin_leave_requests', JSON.stringify(updated));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if ((isAdmin && !formApplicant.trim()) || !formStartDate || !formEndDate || !formReason.trim()) {
      toast.error('All fields are required.');
      return;
    }

    const type = leaveTypes.find(t => t.id === formTypeId);

    const newReq = {
      id: Date.now().toString(),
      applicant: isAdmin ? formApplicant.trim() : user?.name || 'Unknown',
      typeName: type ? type.name : 'General Leave',
      startDate: formStartDate,
      endDate: formEndDate,
      reason: formReason.trim(),
      status: 'Pending'
    };

    saveRequests([...requests, newReq]);
    toast.success('Leave request submitted!');
    setShowModal(false);
    setFormApplicant(teachers.length > 0 ? teachers[0].user.name : '');
    setFormReason('');
    setFormStartDate('');
    setFormEndDate('');
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await api.put(`/api/leave/${id}/status`, { status: newStatus.toUpperCase() });
      const updated = requests.map(r => r.id === id ? { ...r, status: newStatus } : r);
      setRequests(updated);
      toast.success(`Leave request ${newStatus.toLowerCase()} successfully.`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this leave record?')) {
      const updated = requests.filter(r => r.id !== id);
      saveRequests(updated);
      toast.success('Leave record deleted.');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-black text-gray-900">
          Leave Requests
        </h4>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Request Leave
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="text-gray-400 border-b border-gray-100 font-extrabold text-xs uppercase tracking-wider">
              <th className="pb-3">Applicant</th>
              <th className="pb-3">Leave Type</th>
              <th className="pb-3">Start Date</th>
              <th className="pb-3">End Date</th>
              <th className="pb-3">Reason</th>
              <th className="pb-3">Status</th>
              <th className="pb-3 text-right">{isAdmin && 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(isAdmin ? requests : requests.filter(r => r.applicant === user?.name)).map((r) => (
              <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-4 font-bold text-gray-900">{r.requester?.name || r.applicant}</td>
                <td className="py-4 text-gray-600 font-semibold">{r.type || r.typeName}</td>
                <td className="py-4 text-xs text-gray-500 font-semibold">{new Date(r.startDate).toLocaleDateString()}</td>
                <td className="py-4 text-xs text-gray-500 font-semibold">{r.endDate ? new Date(r.endDate).toLocaleDateString() : '-'}</td>
                <td className="py-4 text-xs text-gray-400 font-medium max-w-[200px] truncate" title={r.reason}>
                  {r.reason}
                </td>
                <td className="py-4">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    r.status === 'Approved'
                      ? 'bg-emerald-50 text-emerald-700'
                      : r.status === 'Rejected'
                      ? 'bg-red-50 text-red-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}>
                    {r.status === 'Approved' && <CheckCircle className="w-3 h-3" />}
                    {r.status === 'Rejected' && <XCircle className="w-3 h-3" />}
                    {r.status === 'Pending' && <Clock className="w-3 h-3" />}
                    {r.status}
                  </span>
                </td>
                <td className="py-4 text-right flex justify-end gap-2">
                  {isAdmin && (r.status === 'Pending' || r.status === 'PENDING') && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(r.id, 'APPROVED')}
                        className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(r.id, 'REJECTED')}
                        className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="w-8 h-8 rounded-full bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-600 flex items-center justify-center transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {(isAdmin ? requests : requests.filter(r => r.applicant === user?.name)).length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-400 font-semibold">No leave requests found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-md w-full space-y-4">
            <h4 className="text-lg font-black text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              Request Leave
            </h4>
            <form onSubmit={handleCreate} className="space-y-4">
              {isAdmin && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Applicant Name</label>
                  <select
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formApplicant}
                    onChange={e => setFormApplicant(e.target.value)}
                    required={isAdmin}
                  >
                    <option value="">Select Teacher</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.user.name}>
                        {t.user.name} ({t.employeeId})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Leave Type</label>
                <select
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formTypeId}
                  onChange={e => setFormTypeId(e.target.value)}
                  required
                >
                  {leaveTypes.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Start Date</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formStartDate}
                    onChange={e => setFormStartDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">End Date</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formEndDate}
                    onChange={e => setFormEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Reason</label>
                <textarea
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  rows={3}
                  value={formReason}
                  onChange={e => setFormReason(e.target.value)}
                  placeholder="Enter Reason"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-gray-600 border border-gray-200 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm px-4 py-2 rounded-xl shadow-md"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveRequestTab;
