import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import { 
  FileText, CheckCircle2, XCircle, PlusCircle, Printer, Clock, 
  LogOut, MapPin, User, Search, Users, ShieldCheck, Activity 
} from 'lucide-react';
import { GatePassPrint } from '../../components/gate-pass/GatePassPrint';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { PageHeader } from '../../components/UI/PageHeader';

interface GatePassItem {
  id: string;
  reason: string;
  destination?: string;
  exitTime?: string;
  returnTime?: string;
  notes?: string;
  requestType: string;
  status: string;
  slipNumber?: string;
  requestedDate: string;
  requester: { name: string; role: string };
  student?: { rollNo?: string; user?: { name: string; photoUrl?: string }; class?: { name: string; section: string } };
  approvedBy?: { name: string };
  rejectionReason?: string;
}

interface StudentOption {
  id: string;
  rollNo?: string;
  user?: { name: string };
  class?: { name: string; section: string };
}

interface Stats {
  inside: number;
  out: number;
  pending: number;
  todayTotal: number;
}

const GatePassPage: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<GatePassItem[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [schoolName, setSchoolName] = useState('JY SCHOOL');
  
  // Dashboard states
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'APPROVALS' | 'HISTORY'>('DASHBOARD');
  const [stats, setStats] = useState<Stats>({ inside: 0, out: 0, pending: 0, todayTotal: 0 });
  
  // Form states
  const [selectedClassName, setSelectedClassName] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState({ 
    reason: '', destination: '', exitTime: '', returnTime: '', notes: '', studentId: '', 
    requestType: user?.role === 'TEACHER' ? 'TEACHER' : 'STUDENT' 
  });
  
  const [printGatePass, setPrintGatePass] = useState<any>(null);
  const canApprove = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'SECURITY';

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch stats
      const statsRes = await api.get('/api/gate-pass/stats').catch(() => null);
      if (statsRes?.data?.data) {
        setStats(statsRes.data.data);
      }

      // Fetch gate passes based on tab
      let statusFilter = '';
      if (activeTab === 'APPROVALS') statusFilter = 'PENDING';
      
      const res = await api.get(`/api/gate-pass?limit=50&status=${statusFilter}`);
      setItems(res.data?.data || res.data || []);
    } catch {
      toast.error('Unable to load gate passes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    api.get('/api/settings').then((response: any) => {
      if (response?.data?.schoolName) setSchoolName(response.data.schoolName);
    }).catch(() => {});

    if (canApprove) {
      api.get('/api/classes?limit=5000').then((res: any) => {
        setClasses(res.data?.data || res.data || []);
      }).catch(() => {});
      
      api.get('/api/students?limit=5000').then((res: any) => {
        setStudents(res.data?.data || res.data || []);
      }).catch(() => {});
    }

    const interval = setInterval(() => {
      loadData();
    }, 30000); // 30s auto-refresh
    
    return () => clearInterval(interval);
  }, [activeTab, canApprove]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (canApprove && !form.studentId) {
      toast.error('Please select a student before issuing a gate pass');
      return;
    }
    try {
      await api.post('/api/gate-pass', { ...form, studentId: form.studentId || undefined });
      toast.success(canApprove ? 'Gate pass issued' : 'Gate pass requested');
      setForm({ reason: '', destination: '', exitTime: '', returnTime: '', notes: '', studentId: '', requestType: user?.role === 'TEACHER' ? 'TEACHER' : 'STUDENT' });
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to submit request');
    }
  };

  const approve = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await api.patch(`/api/gate-pass/${id}`, { 
        status, 
        rejectionReason: status === 'REJECTED' ? 'Not approved by Admin/Security' : undefined 
      });
      toast.success(`Gate pass ${status.toLowerCase()}`);
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Update failed');
    }
  };

  const markExitReturn = async (id: string, action: 'EXIT' | 'RETURN') => {
    try {
      await api.patch(`/api/gate-pass/${id}`, { 
        status: action === 'EXIT' ? 'ACTIVE' : 'COMPLETED' 
      });
      toast.success(action === 'EXIT' ? 'Marked as EXITED' : 'Marked as RETURNED');
      loadData();
    } catch (err: any) {
      toast.error('Failed to update status');
    }
  };

  const printSlip = (item: GatePassItem) => {
    setPrintGatePass(item);
    setTimeout(() => {
      window.print();
    }, 100);
  };
  
  const uniqueClassNames = Array.from(new Set(classes.map(c => c.name)));
  const availableSections = classes.filter(c => c.name === selectedClassName).map(c => c.section);
  
  const filteredStudents = students.filter(student => {
    const matchClass = !selectedClassName || student.class?.name === selectedClassName;
    const matchSection = !selectedSection || student.class?.section === selectedSection;
    const matchSearch = !searchQuery || 
      (student.user?.name && student.user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (student.rollNo && student.rollNo.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchClass && matchSection && matchSearch;
  });

  return (
    <div className="flex flex-col h-full bg-slate-50" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader 
        title="Gate Pass Command Center"
        icon={<ShieldCheck className="w-6 h-6" />}
      />

      {/* Printable Area */}
      <div className="hidden print:block absolute inset-0 bg-white z-[9999]">
        {printGatePass && <GatePassPrint gatePass={printGatePass} schoolName={schoolName} />}
      </div>

      <div className="print:hidden flex-1 overflow-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-[1400px] mx-auto space-y-6">

          {/* Stats Bar */}
          {canApprove && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up">
              {[
                { label: 'Inside Campus', value: stats.inside, icon: Users, color: 'emerald' },
                { label: 'Outside Campus', value: stats.out, icon: LogOut, color: 'rose' },
                { label: 'Pending Approvals', value: stats.pending, icon: Clock, color: 'amber' },
                { label: 'Passes Today', value: stats.todayTotal, icon: Activity, color: 'indigo' }
              ].map((stat, idx) => (
                <div key={idx} className={`bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden group hover:border-${stat.color}-200 transition-colors`}>
                  <div className={`absolute top-0 right-0 w-24 h-24 bg-${stat.color}-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110`} />
                  <div className="flex items-center gap-4 relative">
                    <div className={`w-12 h-12 rounded-xl bg-${stat.color}-100 text-${stat.color}-600 flex items-center justify-center`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                      <h3 className="text-2xl font-black text-slate-800 mt-1">{stat.value}</h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            
            {/* LEFT COL: Issue Form */}
            <div className="xl:col-span-4 space-y-6 animate-fade-in-up delay-75">
              <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden h-full flex flex-col">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500" />
                
                <div className="p-6 md:p-8 flex-1">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                      <PlusCircle className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-black text-slate-800">{canApprove ? 'Issue Gate Pass' : 'Request Pass'}</h2>
                  </div>
                  
                  <form onSubmit={submit} className="space-y-5">
                    {canApprove && (
                      <div className="p-5 bg-slate-50/80 border border-slate-100 rounded-2xl space-y-4">
                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                          <Users className="w-4 h-4 text-slate-400" /> Student Selection
                        </h4>
                        
                        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                          <select 
                            value={selectedClassName} 
                            onChange={(e) => { setSelectedClassName(e.target.value); setSelectedSection(''); setForm({...form, studentId: ''}); }} 
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none"
                          >
                            <option value="">All Classes</option>
                            {uniqueClassNames.map((name) => (
                              <option key={name as string} value={name as string}>{name as string}</option>
                            ))}
                          </select>
                          
                          <select 
                            value={selectedSection} 
                            onChange={(e) => { setSelectedSection(e.target.value); setForm({...form, studentId: ''}); }} 
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none disabled:opacity-50"
                            disabled={!selectedClassName}
                          >
                            <option value="">All Sections</option>
                            {availableSections.map((sec) => (
                              <option key={sec} value={sec}>{sec}</option>
                            ))}
                          </select>
                          
                          <div className="sm:col-span-2 relative">
                            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                            <input 
                              type="text" 
                              placeholder="Search by name or roll no..." 
                              value={searchQuery} 
                              onChange={(e) => setSearchQuery(e.target.value)} 
                              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 mt-2">Select Student <span className="text-rose-500">*</span></label>
                          <select 
                            className="w-full px-4 py-2.5 bg-white border-2 border-indigo-100 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none" 
                            value={form.studentId} 
                            onChange={(e) => setForm({ ...form, studentId: e.target.value })} 
                            required
                          >
                            <option value="">-- Choose a student --</option>
                            {filteredStudents.map((student) => (
                              <option key={student.id} value={student.id}>
                                {student.user?.name || 'Unknown'} {student.rollNo ? `(${student.rollNo})` : ''} {student.class ? `- ${student.class.name} ${student.class.section}` : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Reason <span className="text-rose-500">*</span></label>
                        <input 
                          type="text" 
                          placeholder="e.g. Medical emergency"
                          className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-all"
                          value={form.reason} 
                          onChange={(e) => setForm({ ...form, reason: e.target.value })} 
                          required 
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Destination</label>
                        <input 
                          type="text" 
                          placeholder="Where are they going?"
                          className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-all"
                          value={form.destination} 
                          onChange={(e) => setForm({ ...form, destination: e.target.value })} 
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Exit Time</label>
                          <input 
                            type="time" 
                            className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-all"
                            value={form.exitTime} 
                            onChange={(e) => setForm({ ...form, exitTime: e.target.value })} 
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Return Time</label>
                          <input 
                            type="time" 
                            className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-all"
                            value={form.returnTime} 
                            onChange={(e) => setForm({ ...form, returnTime: e.target.value })} 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 mt-auto">
                      <button 
                        type="submit" 
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-xs px-6 py-4 rounded-xl shadow-lg shadow-indigo-600/20 transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {canApprove ? 'Generate Pass' : 'Submit Request'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* RIGHT COL: Tabs & Records */}
            <div className="xl:col-span-8 animate-fade-in-up delay-150">
              <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden h-full flex flex-col">
                
                {/* Tabs */}
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-2">
                  {['DASHBOARD', 'APPROVALS', 'HISTORY'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab as any)}
                      className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                        activeTab === tab 
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {tab === 'DASHBOARD' ? 'Live Passes' : tab.charAt(0) + tab.slice(1).toLowerCase()}
                      {tab === 'APPROVALS' && stats.pending > 0 && (
                        <span className={`ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] ${activeTab === tab ? 'bg-white text-indigo-600' : 'bg-rose-500 text-white'}`}>
                          {stats.pending}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto">
                  {loading ? (
                    <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
                  ) : items.length === 0 ? (
                    <div className="text-center py-20 text-slate-400 flex flex-col items-center">
                      <FileText className="w-16 h-16 mb-4 opacity-20 text-slate-400" />
                      <p className="font-black text-xl text-slate-600">No records found</p>
                      <p className="text-sm font-medium mt-1 text-slate-500">Gate pass records will appear here.</p>
                    </div>
                  ) : (
                    <table className="w-full text-sm text-left">
                      <thead className="bg-white text-slate-400 text-xs uppercase tracking-widest sticky top-0 z-10 border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-4 font-bold">Pass Info</th>
                          <th className="px-6 py-4 font-bold">Person Details</th>
                          <th className="px-6 py-4 font-bold">Reason & Times</th>
                          <th className="px-6 py-4 font-bold">Status</th>
                          <th className="px-6 py-4 font-bold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {items.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                            <td className="px-6 py-4 align-top">
                              <div className="font-black text-slate-800 text-base">{item.slipNumber || '-'}</div>
                              <div className="text-xs text-slate-500 font-bold mt-1 bg-slate-100 w-fit px-2 py-0.5 rounded-md">{new Date(item.requestedDate).toLocaleDateString()}</div>
                            </td>
                            <td className="px-6 py-4 align-top">
                              <div className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                                <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                                  <User className="w-4 h-4" />
                                </div>
                                {item.requestType === 'STUDENT' ? item.student?.user?.name : item.requester?.name}
                              </div>
                              <div className="text-xs text-slate-500 font-semibold mt-1.5 bg-slate-50 w-fit px-2.5 py-1 rounded-lg border border-slate-100">
                                {item.requestType === 'STUDENT' 
                                  ? `Class ${item.student?.class?.name}-${item.student?.class?.section} | Roll: ${item.student?.rollNo || 'N/A'}`
                                  : `Role: ${item.requester?.role}`
                                }
                              </div>
                            </td>
                            <td className="px-6 py-4 align-top max-w-[200px]">
                              <div className="font-bold text-slate-700 line-clamp-2 leading-relaxed" title={item.reason}>{item.reason}</div>
                              <div className="flex items-center gap-3 text-xs font-bold mt-2">
                                <div className="flex items-center gap-1.5 text-slate-500"><LogOut className="w-3.5 h-3.5 text-rose-500" /> {item.exitTime || '--:--'}</div>
                                <div className="flex items-center gap-1.5 text-slate-500"><Clock className="w-3.5 h-3.5 text-emerald-500" /> {item.returnTime || '--:--'}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 align-top">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                                item.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                item.status === 'REJECTED' ? 'bg-red-50 text-red-600 border-red-200' :
                                item.status === 'ACTIVE' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' :
                                item.status === 'COMPLETED' ? 'bg-slate-100 text-slate-600 border-slate-300' :
                                'bg-amber-50 text-amber-600 border-amber-200'
                              }`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 align-top text-right">
                              <div className="flex flex-wrap items-center justify-end gap-2">
                                {canApprove && item.status === 'PENDING' && (
                                  <>
                                    <button onClick={() => approve(item.id, 'APPROVED')} className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-colors border border-emerald-100" title="Approve">
                                      <CheckCircle2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => approve(item.id, 'REJECTED')} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors border border-red-100" title="Reject">
                                      <XCircle className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                                
                                {user?.role === 'SECURITY' && item.status === 'APPROVED' && (
                                  <button onClick={() => markExitReturn(item.id, 'EXIT')} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100 rounded-lg text-xs font-bold uppercase transition-colors">
                                    Mark Exit
                                  </button>
                                )}
                                {user?.role === 'SECURITY' && item.status === 'ACTIVE' && (
                                  <button onClick={() => markExitReturn(item.id, 'RETURN')} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100 rounded-lg text-xs font-bold uppercase transition-colors">
                                    Mark Return
                                  </button>
                                )}

                                {(item.status === 'APPROVED' || item.status === 'ACTIVE' || item.status === 'COMPLETED') && (
                                  <button onClick={() => printSlip(item)} className="px-3 py-1.5 bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold uppercase transition-colors flex items-center gap-1.5 shadow-sm" title="Print Slip">
                                    <Printer className="w-3.5 h-3.5" /> Print
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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

export default GatePassPage;
