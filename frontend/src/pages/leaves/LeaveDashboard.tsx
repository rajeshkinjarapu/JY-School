import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Calendar, User, FileText, CheckCircle, XCircle, Clock, Search, Filter, AlertCircle, Building, FileSignature } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// Configure Axios
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const LeaveDashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('PENDING'); // ALL, PENDING, APPROVED, REJECTED
  const [search, setSearch] = useState('');

  const { data: leaves = [], isLoading } = useQuery({
    queryKey: ['leaves', filter],
    queryFn: async () => {
      const res = await api.get(`/api/leave?status=${filter}`);
      return res.data.data;
    },
  });

  const approveRejectMutation = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string, status: string, reason?: string }) => {
      const res = await api.patch(`/api/leave/${id}/approve`, { status, rejectionReason: reason });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
  });

  const handleAction = (id: string, status: 'APPROVED' | 'REJECTED') => {
    let reason = '';
    if (status === 'REJECTED') {
      const input = prompt("Please provide a reason for rejection:");
      if (input === null) return; // Cancelled
      reason = input;
    }
    
    if (confirm(`Are you sure you want to ${status.toLowerCase()} this leave request?`)) {
      approveRejectMutation.mutate({ id, status, reason });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold flex items-center gap-1"><Clock size={14}/> Pending</span>;
      case 'APPROVED': return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold flex items-center gap-1"><CheckCircle size={14}/> Approved</span>;
      case 'REJECTED': return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold flex items-center gap-1"><XCircle size={14}/> Rejected</span>;
      default: return null;
    }
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'SICK': return 'text-red-500 bg-red-50';
      case 'CASUAL': return 'text-blue-500 bg-blue-50';
      case 'EMERGENCY': return 'text-orange-500 bg-orange-50';
      case 'EARNED': return 'text-emerald-500 bg-emerald-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  const calculateDays = (start: string, end: string | null) => {
    if (!end) return 1;
    const diffTime = Math.abs(new Date(end).getTime() - new Date(start).getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const filteredLeaves = leaves.filter((l: any) => 
    l.requester?.name?.toLowerCase().includes(search.toLowerCase()) || 
    l.reason?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FileSignature className="text-indigo-600" size={32} />
            Leave Management
          </h1>
          <p className="text-gray-500 mt-1">Review and manage staff and student leave requests</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Main Content (Table) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
              
              <div className="flex bg-gray-100 p-1 rounded-xl">
                {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === f ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search name or reason..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

            </div>

            {isLoading ? (
              <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
            ) : filteredLeaves.length === 0 ? (
              <div className="text-center p-12 text-gray-500">
                <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                <p>No leave requests found for this filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                      <th className="p-4 font-semibold rounded-tl-xl">Applicant</th>
                      <th className="p-4 font-semibold">Leave Type</th>
                      <th className="p-4 font-semibold">Duration</th>
                      <th className="p-4 font-semibold">Reason</th>
                      <th className="p-4 font-semibold">Status</th>
                      <th className="p-4 font-semibold text-right rounded-tr-xl">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredLeaves.map((leave: any) => (
                      <tr key={leave.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold overflow-hidden border border-indigo-200">
                              {leave.requester?.photoUrl ? (
                                <img src={leave.requester.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                              ) : (
                                leave.requester?.name?.charAt(0) || 'U'
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{leave.requester?.name}</p>
                              <p className="text-xs text-gray-500 capitalize">{leave.requester?.role?.toLowerCase()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${getTypeColor(leave.type)}`}>
                            {leave.type}
                          </span>
                        </td>
                        <td className="p-4">
                          <p className="text-sm font-medium text-gray-800">
                            {new Date(leave.startDate).toLocaleDateString()} 
                            {leave.endDate && ` - ${new Date(leave.endDate).toLocaleDateString()}`}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">{calculateDays(leave.startDate, leave.endDate)} Day(s)</p>
                        </td>
                        <td className="p-4 max-w-xs">
                          <p className="text-sm text-gray-600 truncate" title={leave.reason}>{leave.reason}</p>
                          {leave.documentUrl && (
                            <a href={leave.documentUrl} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline flex items-center gap-1 mt-1">
                              <FileText size={12}/> View Proof
                            </a>
                          )}
                        </td>
                        <td className="p-4">
                          {getStatusBadge(leave.status)}
                        </td>
                        <td className="p-4 text-right space-x-2">
                          {leave.status === 'PENDING' && (
                            <>
                              <button 
                                onClick={() => handleAction(leave.id, 'APPROVED')}
                                className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                                title="Approve"
                              >
                                <CheckCircle size={18} />
                              </button>
                              <button 
                                onClick={() => handleAction(leave.id, 'REJECTED')}
                                className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                title="Reject"
                              >
                                <XCircle size={18} />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Stats */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="text-indigo-600" size={20} />
              Quick Stats
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100 flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-800 font-medium">Pending Requests</p>
                  <p className="text-2xl font-black text-yellow-900">
                    {leaves.filter((l:any) => l.status === 'PENDING').length}
                  </p>
                </div>
                <Clock className="text-yellow-400" size={32} />
              </div>

              <div className="p-4 bg-green-50 rounded-xl border border-green-100 flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-800 font-medium">Approved Today</p>
                  <p className="text-2xl font-black text-green-900">
                    {leaves.filter((l:any) => l.status === 'APPROVED' && new Date(l.updatedAt).toDateString() === new Date().toDateString()).length}
                  </p>
                </div>
                <CheckCircle className="text-green-400" size={32} />
              </div>
              
              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                <p className="text-sm text-indigo-800 font-medium mb-2 flex items-center gap-1"><Building size={16}/> Staff on Leave Today</p>
                <div className="space-y-2">
                   {leaves.filter((l:any) => 
                      l.status === 'APPROVED' && 
                      l.requester?.role !== 'STUDENT' &&
                      new Date(l.startDate) <= new Date() && 
                      (!l.endDate || new Date(l.endDate) >= new Date())
                   ).length > 0 ? (
                      leaves.filter((l:any) => 
                        l.status === 'APPROVED' && 
                        l.requester?.role !== 'STUDENT' &&
                        new Date(l.startDate) <= new Date() && 
                        (!l.endDate || new Date(l.endDate) >= new Date())
                     ).map((l:any) => (
                       <div key={l.id} className="flex items-center gap-2 text-sm text-indigo-900">
                         <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                         {l.requester?.name}
                       </div>
                     ))
                   ) : (
                     <p className="text-xs text-indigo-400 italic">No staff on leave today.</p>
                   )}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LeaveDashboard;
