import React, { useEffect, useMemo, useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import { FileText, CheckCircle2, XCircle, PlusCircle, Printer, Clock, LogOut, MapPin, User, ChevronDown, Search, Users } from 'lucide-react';
import { GatePassPrint } from '../../components/gate-pass/GatePassPrint';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';

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

const GatePassPage: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<GatePassItem[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [schoolName, setSchoolName] = useState('JY SCHOOL');
  
  // Search & Filter state
  const [selectedClassName, setSelectedClassName] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [form, setForm] = useState({ reason: '', destination: '', exitTime: '', returnTime: '', notes: '', studentId: '', requestType: user?.role === 'TEACHER' ? 'TEACHER' : 'STUDENT' });
  
  const [printGatePass, setPrintGatePass] = useState<any>(null);
  const canApprove = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/gate-pass?limit=5000');
      setItems(res.data || []);
    } catch {
      toast.error('Unable to load gate passes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    api.get('/api/settings').then((response: any) => {
      if (response?.data?.schoolName) setSchoolName(response.data.schoolName);
    }).catch(() => {});

    if (canApprove) {
      api.get('/api/classes?limit=5000').then((res: any) => {
        const data = res.data || res || [];
        setClasses(data);
      }).catch(() => {});
      
      // Load all students by default for the admin
      api.get('/api/students?limit=5000').then((res: any) => {
        const data = res.data?.data || res.data || [];
        setStudents(data);
      }).catch(() => {});
    }
  }, [canApprove]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (canApprove && !form.studentId) {
      toast.error('Please select a student before issuing a gate pass');
      return;
    }

    try {
      await api.post('/api/gate-pass', { ...form, studentId: form.studentId || undefined });
      toast.success(canApprove ? 'Gate pass issued to student' : 'Gate pass requested');
      setForm({ reason: '', destination: '', exitTime: '', returnTime: '', notes: '', studentId: '', requestType: user?.role === 'TEACHER' ? 'TEACHER' : 'STUDENT' });
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to submit request');
    }
  };

  const approve = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await api.patch(`/api/gate-pass/${id}`, { status, rejectionReason: status === 'REJECTED' ? 'Not approved' : undefined });
      toast.success(`Gate pass ${status.toLowerCase()}`);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Update failed');
    }
  };

  const printSlip = (item: GatePassItem) => {
    setPrintGatePass(item);
    setTimeout(() => {
      window.print();
    }, 100);
  };
  
  const roleLabel = useMemo(() => {
    if (user?.role === 'STUDENT') return 'Student';
    if (user?.role === 'TEACHER') return 'Teacher';
    return 'Admin';
  }, [user?.role]);

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
    <div className="flex flex-col h-full bg-gray-50/50" style={{ minHeight: 'calc(100vh - 64px)' }}>
      {/* Printable Area - Hidden normally */}
      <div className="hidden print:block absolute inset-0 bg-white z-[9999]">
        {printGatePass && <GatePassPrint gatePass={printGatePass} schoolName={schoolName} />}
      </div>

      <div className="print:hidden flex-1 overflow-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white/60 dark:bg-slate-900/50 backdrop-blur-md p-6 lg:p-8 rounded-3xl border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden animate-fade-in-up">
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>
            
            <div className="flex items-center gap-5 relative z-10">
              <div className="bg-gradient-to-br from-rose-500 to-pink-600 p-4 rounded-2xl shadow-lg shadow-rose-500/30 text-white shrink-0">
                <MapPin className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">Gate Pass Manager</h1>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">Manage and issue out-passes for students and staff.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            
            {/* Issue Form Card */}
            <div className="xl:col-span-4 space-y-6 animate-fade-in-up delay-75">
              <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md rounded-3xl border border-white/20 shadow-lg relative overflow-hidden h-full">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-rose-500 to-pink-500 opacity-80" />
                
                <div className="p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl">
                      <PlusCircle className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-black text-slate-800 dark:text-white">{canApprove ? 'Issue Gate Pass' : 'Request Pass'}</h2>
                  </div>
                  
                  <form onSubmit={submit} className="space-y-5">
                    {/* Admin filters for student selection */}
                    {canApprove && (
                      <div className="p-5 bg-white/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700 rounded-2xl space-y-4 shadow-inner">
                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                          <Users className="w-4 h-4 text-slate-400" /> Student Selection
                        </h4>
                        
                        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                          <div>
                            <select 
                              value={selectedClassName} 
                              onChange={(e) => { setSelectedClassName(e.target.value); setSelectedSection(''); setForm({...form, studentId: ''}); }} 
                              className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 outline-none"
                            >
                              <option value="">All Classes</option>
                              {uniqueClassNames.map((name) => (
                                <option key={name as string} value={name as string}>{name as string}</option>
                              ))}
                            </select>
                          </div>
                          
                          <div>
                            <select 
                              value={selectedSection} 
                              onChange={(e) => { setSelectedSection(e.target.value); setForm({...form, studentId: ''}); }} 
                              className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 outline-none disabled:opacity-50"
                              disabled={!selectedClassName}
                            >
                              <option value="">All Sections</option>
                              {availableSections.map((sec) => (
                                <option key={sec} value={sec}>{sec}</option>
                              ))}
                            </select>
                          </div>
                          
                          <div className="sm:col-span-2">
                            <div className="relative">
                              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                              <input 
                                type="text" 
                                placeholder="Search by name or roll no..." 
                                value={searchQuery} 
                                onChange={(e) => setSearchQuery(e.target.value)} 
                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 outline-none"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 mt-2">Select Student <span className="text-rose-500">*</span></label>
                          <select 
                            className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border-2 border-rose-100 dark:border-rose-900/30 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 outline-none" 
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

                    {/* Form fields */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Reason for leaving <span className="text-rose-500">*</span></label>
                        <input 
                          type="text" 
                          placeholder="e.g. Medical emergency, Family function"
                          className="w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 outline-none"
                          value={form.reason} 
                          onChange={(e) => setForm({ ...form, reason: e.target.value })} 
                          required 
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Destination / Going with</label>
                        <input 
                          type="text" 
                          placeholder="Where is the person going and with whom?"
                          className="w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 outline-none"
                          value={form.destination} 
                          onChange={(e) => setForm({ ...form, destination: e.target.value })} 
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Exit Time</label>
                          <input 
                            type="time" 
                            className="w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 outline-none"
                            value={form.exitTime} 
                            onChange={(e) => setForm({ ...form, exitTime: e.target.value })} 
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Return Time</label>
                          <input 
                            type="time" 
                            className="w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 outline-none"
                            value={form.returnTime} 
                            onChange={(e) => setForm({ ...form, returnTime: e.target.value })} 
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Additional Notes</label>
                        <textarea 
                          placeholder="Any other details..."
                          rows={2}
                          className="w-full px-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 outline-none resize-none"
                          value={form.notes} 
                          onChange={(e) => setForm({ ...form, notes: e.target.value })} 
                        />
                      </div>
                    </div>

                    <div className="pt-4">
                      <button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-black uppercase tracking-widest text-xs px-6 py-4 rounded-xl shadow-lg shadow-rose-500/30 hover:shadow-xl hover:shadow-rose-500/40 transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {canApprove ? 'Generate & Issue Gate Pass' : 'Submit Request'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Recent Records Table */}
            <div className="xl:col-span-8 animate-fade-in-up delay-150">
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200/60 dark:border-slate-800 overflow-hidden h-full flex flex-col">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-3">
                  <div className="p-2.5 bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-400 rounded-xl">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-white">Recent Records</h3>
                </div>

                <div className="flex-1 overflow-auto">
                  {loading ? (
                    <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
                  ) : items.length === 0 ? (
                    <div className="text-center py-20 text-slate-400 flex flex-col items-center">
                      <FileText className="w-16 h-16 mb-4 opacity-30 text-slate-300" />
                      <p className="font-black text-xl text-slate-600 dark:text-slate-300">No records found</p>
                      <p className="text-sm font-semibold mt-2 text-slate-500">Gate pass records will appear here.</p>
                    </div>
                  ) : (
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest sticky top-0 z-10 backdrop-blur-md">
                        <tr>
                          <th className="px-6 py-4 font-bold">Slip # / Date</th>
                          <th className="px-6 py-4 font-bold">Person Details</th>
                          <th className="px-6 py-4 font-bold">Reason & Destination</th>
                          <th className="px-6 py-4 font-bold">Status</th>
                          <th className="px-6 py-4 font-bold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {items.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                            <td className="px-6 py-4 align-top">
                              <div className="font-black text-slate-800 dark:text-slate-200 text-base">{item.slipNumber || '-'}</div>
                              <div className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 w-fit px-2 py-0.5 rounded-md">{new Date(item.requestedDate).toLocaleDateString()}</div>
                            </td>
                            <td className="px-6 py-4 align-top">
                              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 text-sm">
                                <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                  <User className="w-3.5 h-3.5" />
                                </div>
                                {item.requestType === 'STUDENT' ? item.student?.user?.name : item.requester?.name}
                              </div>
                              <div className="text-xs text-slate-500 font-semibold mt-2 bg-slate-50 dark:bg-slate-800/50 w-fit px-2.5 py-1 rounded-lg border border-slate-100 dark:border-slate-700/50">
                                {item.requestType === 'STUDENT' 
                                  ? `Class ${item.student?.class?.name}-${item.student?.class?.section} | Roll: ${item.student?.rollNo || 'N/A'}`
                                  : `Role: ${item.requester?.role}`
                                }
                              </div>
                            </td>
                            <td className="px-6 py-4 align-top max-w-[200px]">
                              <div className="font-bold text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed" title={item.reason}>{item.reason}</div>
                              {item.destination && (
                                <div className="text-xs font-semibold text-slate-500 mt-2 flex items-center gap-1.5 bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 w-fit px-2 py-1 rounded-md">
                                  <MapPin className="w-3.5 h-3.5" /> {item.destination}
                                </div>
                              )}
                              <div className="flex items-center gap-3 text-xs font-bold mt-3">
                                <div className="flex items-center gap-1.5 text-slate-500"><LogOut className="w-3.5 h-3.5 text-rose-500" /> {item.exitTime || 'N/A'}</div>
                                {item.returnTime && <div className="flex items-center gap-1.5 text-slate-500"><Clock className="w-3.5 h-3.5 text-emerald-500" /> {item.returnTime}</div>}
                              </div>
                            </td>
                            <td className="px-6 py-4 align-top">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                                item.status === 'APPROVED' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50' :
                                item.status === 'REJECTED' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/50' :
                                'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/50'
                              }`}>
                                {item.status === 'APPROVED' && <CheckCircle2 className="w-3.5 h-3.5" />}
                                {item.status === 'REJECTED' && <XCircle className="w-3.5 h-3.5" />}
                                {item.status === 'PENDING' && <Clock className="w-3.5 h-3.5" />}
                                {item.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 align-top text-right">
                              <div className="flex items-center justify-end gap-2 opacity-100 xl:opacity-0 group-hover:opacity-100 transition-opacity">
                                {canApprove && item.status === 'PENDING' && (
                                  <>
                                    <button onClick={() => approve(item.id, 'APPROVED')} className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-xl transition-colors border border-emerald-100 dark:border-emerald-800" title="Approve">
                                      <CheckCircle2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => approve(item.id, 'REJECTED')} className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl transition-colors border border-red-100 dark:border-red-800" title="Reject">
                                      <XCircle className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                                {item.status === 'APPROVED' && (
                                  <button onClick={() => printSlip(item)} className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border border-indigo-100 dark:border-indigo-800 rounded-xl text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2 shadow-sm" title="Print Slip">
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
