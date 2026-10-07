import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import { 
  FileText, CheckCircle2, XCircle, PlusCircle, Printer, Clock, 
  LogOut, MapPin, User, Search, Users, ShieldCheck, Activity, X, ChevronRight, Check
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
  
  // Form modal state
  const [showIssueModal, setShowIssueModal] = useState(false);
  
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
      
      const res = await api.get(/api/gate-pass?limit=50&status=\);
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
      setShowIssueModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to submit request');
    }
  };

  const approve = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await api.patch(/api/gate-pass/\, { 
        status, 
        rejectionReason: status === 'REJECTED' ? 'Not approved by Admin/Security' : undefined 
      });
      toast.success(Gate pass \);
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Update failed');
    }
  };

  const markExitReturn = async (id: string, action: 'EXIT' | 'RETURN') => {
    try {
      await api.patch(/api/gate-pass/\, { 
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
    <div className="flex flex-col h-full bg-slate-50/50" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader 
        title="Gatepass Command Center"
        icon={<ShieldCheck className="w-5 h-5 text-indigo-600" />}
        action={
          <button 
            onClick={() => setShowIssueModal(true)} 
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 hover:-translate-y-0.5 font-bold text-sm"
          >
            <PlusCircle className="w-4 h-4" />
            {canApprove ? 'Issue New Gatepass' : 'Request Gatepass'}
          </button>
        }
      />

      {/* Printable Area */}
      <div className="hidden print:block absolute inset-0 bg-white z-[9999]">
        {printGatePass && <GatePassPrint gatePass={printGatePass} schoolName={schoolName} />}
      </div>

      <div className="print:hidden flex-1 overflow-auto p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* Stats Bar */}
          {canApprove && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 animate-fade-in-up">
              {[
                { label: 'Inside Campus', value: stats.inside, icon: Users, color: 'emerald', bg: 'bg-emerald-500' },
                { label: 'Outside Campus', value: stats.out, icon: LogOut, color: 'rose', bg: 'bg-rose-500' },
                { label: 'Pending Approvals', value: stats.pending, icon: Clock, color: 'amber', bg: 'bg-amber-500' },
                { label: 'Passes Today', value: stats.todayTotal, icon: Activity, color: 'indigo', bg: 'bg-indigo-500' }
              ].map((stat, idx) => (
                <div key={idx} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center gap-5 relative overflow-hidden group hover:shadow-md transition-all">
                  <div className={bsolute top-0 right-0 w-24 h-24 \ opacity-10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110} />
                  <div className={w-14 h-14 rounded-2xl \ bg-opacity-10 text-\-600 flex items-center justify-center shrink-0}>
                    <stat.icon className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-extrabold text-slate-800">{stat.value}</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Main Content Area */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col min-h-[500px]">
            
            {/* Tabs */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-2">
              {['DASHBOARD', 'APPROVALS', 'HISTORY'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={px-6 py-2.5 rounded-xl text-sm font-bold transition-all \}
                >
                  {tab === 'DASHBOARD' ? 'Live Passes' : tab.charAt(0) + tab.slice(1).toLowerCase()}
                  {tab === 'APPROVALS' && stats.pending > 0 && (
                    <span className={ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] \}>
                      {stats.pending}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
              {loading ? (
                <div className="flex justify-center py-20">
                   <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-200 border-t-indigo-600"></div>
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-24 text-slate-400 flex flex-col items-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <FileText className="w-10 h-10 text-slate-300" />
                  </div>
                  <p className="font-bold text-lg text-slate-600">No records found</p>
                  <p className="text-sm font-medium mt-1 text-slate-400">Gate pass records will appear here.</p>
                </div>
              ) : (
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider sticky top-0 z-10 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 font-bold">Pass ID & Date</th>
                      <th className="px-6 py-4 font-bold">Person Details</th>
                      <th className="px-6 py-4 font-bold">Reason & Times</th>
                      <th className="px-6 py-4 font-bold">Status</th>
                      <th className="px-6 py-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 align-top">
                          <div className="font-bold text-slate-800 text-base">{item.slipNumber || '-'}</div>
                          <div className="text-xs text-slate-400 font-medium mt-1">{new Date(item.requestedDate).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <div className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                              <User className="w-4 h-4" />
                            </div>
                            {item.requestType === 'STUDENT' ? item.student?.user?.name : item.requester?.name}
                          </div>
                          <div className="text-xs text-slate-500 font-medium mt-2 bg-slate-50 w-fit px-2 py-1 rounded-md border border-slate-100">
                            {item.requestType === 'STUDENT' 
                              ? Class \-\ | Roll: \
                              : Role: \
                            }
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <div className="font-bold text-slate-700 max-w-xs truncate" title={item.reason}>{item.reason}</div>
                          <div className="flex items-center gap-4 text-xs font-semibold mt-2">
                            <div className="flex items-center gap-1.5 text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100"><LogOut className="w-3.5 h-3.5 text-rose-500" /> {item.exitTime || '--:--'}</div>
                            <div className="flex items-center gap-1.5 text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100"><Clock className="w-3.5 h-3.5 text-emerald-500" /> {item.returnTime || '--:--'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <span className={inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border \}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 align-top text-right">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            {canApprove && item.status === 'PENDING' && (
                              <>
                                <button onClick={() => approve(item.id, 'APPROVED')} className="p-2 bg-white text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 rounded-lg transition-colors border border-slate-200 shadow-sm" title="Approve">
                                  <Check className="w-4 h-4 font-bold" />
                                </button>
                                <button onClick={() => approve(item.id, 'REJECTED')} className="p-2 bg-white text-rose-600 hover:bg-rose-50 hover:border-rose-200 rounded-lg transition-colors border border-slate-200 shadow-sm" title="Reject">
                                  <X className="w-4 h-4 font-bold" />
                                </button>
                              </>
                            )}
                            
                            {user?.role === 'SECURITY' && item.status === 'APPROVED' && (
                              <button onClick={() => markExitReturn(item.id, 'EXIT')} className="px-3 py-2 bg-white text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 border border-slate-200 shadow-sm rounded-lg text-xs font-bold transition-colors">
                                Mark Exit
                              </button>
                            )}
                            {user?.role === 'SECURITY' && item.status === 'ACTIVE' && (
                              <button onClick={() => markExitReturn(item.id, 'RETURN')} className="px-3 py-2 bg-white text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 border border-slate-200 shadow-sm rounded-lg text-xs font-bold transition-colors">
                                Mark Return
                              </button>
                            )}

                            {(item.status === 'APPROVED' || item.status === 'ACTIVE' || item.status === 'COMPLETED') && (
                              <button onClick={() => printSlip(item)} className="p-2 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 border border-slate-200 shadow-sm rounded-lg transition-colors" title="Print Slip">
                                <Printer className="w-4 h-4" />
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

      {/* ISSUE GATE PASS MODAL */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm z-[99]">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">{canApprove ? 'Issue New Gatepass' : 'Request Gatepass'}</h2>
                  <p className="text-xs text-slate-500 font-medium">Fill the details to generate a pass</p>
                </div>
              </div>
              <button onClick={() => setShowIssueModal(false)} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="gatepass-form" onSubmit={submit} className="space-y-6">
                {canApprove && (
                  <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Student Selection</h4>
                    
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                      <select 
                        value={selectedClassName} 
                        onChange={(e) => { setSelectedClassName(e.target.value); setSelectedSection(''); setForm({...form, studentId: ''}); }} 
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      >
                        <option value="">All Classes</option>
                        {uniqueClassNames.map((name) => (
                          <option key={name as string} value={name as string}>{name as string}</option>
                        ))}
                      </select>
                      
                      <select 
                        value={selectedSection} 
                        onChange={(e) => { setSelectedSection(e.target.value); setForm({...form, studentId: ''}); }} 
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none disabled:opacity-50 disabled:bg-slate-50"
                        disabled={!selectedClassName}
                      >
                        <option value="">All Sections</option>
                        {availableSections.map((sec) => (
                          <option key={sec} value={sec}>{sec}</option>
                        ))}
                      </select>
                      
                      <div className="sm:col-span-2 relative">
                        <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                        <input 
                          type="text" 
                          placeholder="Search student by name or roll no..." 
                          value={searchQuery} 
                          onChange={(e) => setSearchQuery(e.target.value)} 
                          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mt-4 mb-2">Select Student <span className="text-rose-500">*</span></label>
                      <select 
                        className="w-full px-4 py-3 bg-white border-2 border-indigo-100 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" 
                        value={form.studentId} 
                        onChange={(e) => setForm({ ...form, studentId: e.target.value })} 
                        required
                      >
                        <option value="">-- Choose a student --</option>
                        {filteredStudents.map((student) => (
                          <option key={student.id} value={student.id}>
                            {student.user?.name || 'Unknown'} {student.rollNo ? (\) : ''} {student.class ? - \ \ : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Reason <span className="text-rose-500">*</span></label>
                    <input 
                      type="text" 
                      placeholder="e.g. Medical emergency or Going home"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      value={form.reason} 
                      onChange={(e) => setForm({ ...form, reason: e.target.value })} 
                      required 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Destination</label>
                    <input 
                      type="text" 
                      placeholder="Where are they going?"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      value={form.destination} 
                      onChange={(e) => setForm({ ...form, destination: e.target.value })} 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Expected Exit Time</label>
                      <input 
                        type="time" 
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                        value={form.exitTime} 
                        onChange={(e) => setForm({ ...form, exitTime: e.target.value })} 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Expected Return Time</label>
                      <input 
                        type="time" 
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                        value={form.returnTime} 
                        onChange={(e) => setForm({ ...form, returnTime: e.target.value })} 
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setShowIssueModal(false)}
                className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="gatepass-form"
                className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md hover:-translate-y-0.5 flex items-center gap-2 text-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                {canApprove ? 'Generate Pass' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GatePassPage;
