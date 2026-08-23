import React, { useEffect, useState } from 'react';
import { 
  Users, LogOut, CheckCircle2, Clock, Search, 
  MapPin, User, ShieldCheck, XCircle, ArrowRight,
  Filter
} from 'lucide-react';
import axios from '../../api/axios';
import toast from 'react-hot-toast';

interface GatePass {
  id: string;
  studentId: string | null;
  staffId: string | null;
  student?: { id: string; user: { firstName: string; lastName: string; rollNumber?: string }; class: { className: string; section: string } };
  staff?: { id: string; user: { firstName: string; lastName: string; role: string } };
  reason: string;
  destination: string;
  expectedExitTime: string;
  expectedReturnTime: string | null;
  actualExitTime: string | null;
  actualReturnTime: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'COMPLETED' | 'OVERDUE';
  issuedBy: string;
  createdAt: string;
  type: 'STUDENT' | 'STAFF' | 'VISITOR';
}

interface Stats {
  inside: number;
  out: number;
  pending: number;
  todayTotal: number;
}

export const GatePassPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'APPROVALS' | 'HISTORY'>('DASHBOARD');
  const [stats, setStats] = useState<Stats>({ inside: 0, out: 0, pending: 0, todayTotal: 0 });
  const [passes, setPasses] = useState<GatePass[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchStats = async () => {
    try {
      const res = await axios.get('/gate-pass/stats');
      setStats(res.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchPasses = async () => {
    setLoading(true);
    try {
      // Fetch today's passes or pending passes based on tab
      const statusFilter = activeTab === 'APPROVALS' ? 'PENDING' : '';
      const res = await axios.get(`/gate-pass?limit=50&status=${statusFilter}`);
      setPasses(res.data.data);
    } catch (error) {
      toast.error('Failed to load gate passes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchPasses();
    const interval = setInterval(() => {
      fetchStats();
      if(activeTab !== 'HISTORY') fetchPasses();
    }, 30000); // Auto refresh every 30s
    return () => clearInterval(interval);
  }, [activeTab]);

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await axios.patch(`/gate-pass/${id}`, { status });
      toast.success(`Gate pass ${status.toLowerCase()} successfully`);
      fetchStats();
      fetchPasses();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const filteredPasses = passes.filter(p => {
    const name = p.student ? `${p.student.user.firstName} ${p.student.user.lastName}` : (p.staff ? `${p.staff.user.firstName} ${p.staff.user.lastName}` : '');
    return name.toLowerCase().includes(search.toLowerCase()) || p.destination.toLowerCase().includes(search.toLowerCase());
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'PENDING': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'APPROVED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ACTIVE': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'COMPLETED': return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'REJECTED': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'OVERDUE': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTime = (isoString: string | null) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex gap-2">
          {['DASHBOARD', 'APPROVALS', 'HISTORY'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                activeTab === tab 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
              {tab === 'APPROVALS' && stats.pending > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-500 text-white text-[10px]">
                  {stats.pending}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by name..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 pr-4 py-2.5 rounded-full border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all w-64"
          />
        </div>
      </div>

      {/* Stats Cards - Only visible on Dashboard */}
      {activeTab === 'DASHBOARD' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Currently Inside', value: stats.inside, icon: Users, color: 'from-emerald-500 to-teal-400', bg: 'bg-emerald-50' },
            { label: 'Currently Out', value: stats.out, icon: LogOut, color: 'from-rose-500 to-pink-400', bg: 'bg-rose-50' },
            { label: 'Pending Approvals', value: stats.pending, icon: Clock, color: 'from-amber-500 to-orange-400', bg: 'bg-amber-50' },
            { label: 'Total Today', value: stats.todayTotal, icon: CheckCircle2, color: 'from-indigo-500 to-blue-400', bg: 'bg-indigo-50' },
          ].map((stat, idx) => (
            <div key={idx} className={`${stat.bg} rounded-[2rem] p-6 border border-white/50 shadow-sm relative overflow-hidden group`}>
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110`} />
              <div className="flex items-center gap-4 relative">
                <div className={`w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-700`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                  <h3 className="text-3xl font-black text-slate-800 mt-1">{stat.value}</h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Content Area */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            {activeTab === 'DASHBOARD' ? 'Live Gate Passes' : activeTab === 'APPROVALS' ? 'Pending Approvals' : 'Pass History'}
            <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-600 text-xs font-bold">{filteredPasses.length}</span>
          </h2>
          <button className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-4 pl-6">Person Details</th>
                <th className="p-4">Destination & Reason</th>
                <th className="p-4">Time Window</th>
                <th className="p-4">Status</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      Loading live data...
                    </div>
                  </td>
                </tr>
              ) : filteredPasses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400 font-medium flex flex-col items-center">
                    <ShieldCheck className="w-12 h-12 text-slate-200 mb-3" />
                    No gate passes found for this category.
                  </td>
                </tr>
              ) : (
                filteredPasses.map((pass) => (
                  <tr key={pass.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                          {pass.student ? pass.student.user.firstName[0] : (pass.staff ? pass.staff.user.firstName[0] : 'V')}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">
                            {pass.student ? `${pass.student.user.firstName} ${pass.student.user.lastName}` : 
                             (pass.staff ? `${pass.staff.user.firstName} ${pass.staff.user.lastName}` : 'Visitor')}
                          </p>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            {pass.type === 'STUDENT' && pass.student ? `Class ${pass.student.class.className}-${pass.student.class.section}` : pass.type}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        {pass.destination}
                      </div>
                      <p className="text-xs text-slate-500 mt-1 truncate max-w-xs">{pass.reason}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1 text-xs font-semibold">
                        <div className="flex items-center gap-2 text-slate-600">
                          <span className="w-10 text-slate-400">Exit:</span> 
                          <span className="bg-slate-100 px-2 py-0.5 rounded">{formatTime(pass.expectedExitTime)}</span>
                        </div>
                        {pass.expectedReturnTime && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <span className="w-10 text-slate-400">Return:</span> 
                            <span className="bg-slate-100 px-2 py-0.5 rounded">{formatTime(pass.expectedReturnTime)}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusColor(pass.status)}`}>
                        {pass.status}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      {pass.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleStatusUpdate(pass.id, 'APPROVED')} className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-colors" title="Approve">
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleStatusUpdate(pass.id, 'REJECTED')} className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white transition-colors" title="Reject">
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GatePassPage;
