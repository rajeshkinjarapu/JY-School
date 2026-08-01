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
    <div className="flex flex-col h-full bg-gray-50/50 -m-6" style={{ minHeight: 'calc(100vh - 64px)' }}>
      {/* Printable Area - Hidden normally */}
      <div className="hidden print:block absolute inset-0 bg-white z-[9999]">
        {printGatePass && <GatePassPrint gatePass={printGatePass} schoolName={schoolName} />}
      </div>

      <div className="print:hidden flex-1 overflow-auto">
        {/* Header */}
        <div className="px-6 py-6 bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-600 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl">
              <MapPin className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight text-white drop-shadow-sm">Gate Pass</h1>
              <p className="text-white/80 text-sm font-medium mt-0.5">Manage and issue out-passes for students and staff.</p>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
          {/* Issue Form Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-rose-400 to-pink-500" />
            <div className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-black text-gray-900">{canApprove ? 'Issue New Gate Pass' : 'Request Gate Pass'}</h2>
              </div>
              
              <form onSubmit={submit} className="space-y-6">
                {/* Admin filters for student selection */}
                {canApprove && (
                  <div className="p-5 bg-gray-50 border border-gray-200 rounded-2xl space-y-4">
                    <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" /> Student Selection
                    </h4>
                    
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Class</label>
                        <select 
                          value={selectedClassName} 
                          onChange={(e) => { setSelectedClassName(e.target.value); setSelectedSection(''); setForm({...form, studentId: ''}); }} 
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                        >
                          <option value="">All Classes</option>
                          {uniqueClassNames.map((name) => (
                            <option key={name as string} value={name as string}>{name as string}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Section</label>
                        <select 
                          value={selectedSection} 
                          onChange={(e) => { setSelectedSection(e.target.value); setForm({...form, studentId: ''}); }} 
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 outline-none disabled:opacity-50"
                          disabled={!selectedClassName}
                        >
                          <option value="">All Sections</option>
                          {availableSections.map((sec) => (
                            <option key={sec} value={sec}>{sec}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Search</label>
                        <div className="relative">
                          <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                          <input 
                            type="text" 
                            placeholder="Name or roll no..." 
                            value={searchQuery} 
                            onChange={(e) => setSearchQuery(e.target.value)} 
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Select Student <span className="text-red-500">*</span></label>
                      <select 
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 outline-none font-medium" 
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
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Reason for leaving <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      placeholder="e.g. Medical emergency, Family function"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                      value={form.reason} 
                      onChange={(e) => setForm({ ...form, reason: e.target.value })} 
                      required 
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Destination / Going with</label>
                    <input 
                      type="text" 
                      placeholder="Where is the person going and with whom?"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                      value={form.destination} 
                      onChange={(e) => setForm({ ...form, destination: e.target.value })} 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Expected Exit Time</label>
                    <input 
                      type="time" 
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                      value={form.exitTime} 
                      onChange={(e) => setForm({ ...form, exitTime: e.target.value })} 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Expected Return Time (Optional)</label>
                    <input 
                      type="time" 
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                      value={form.returnTime} 
                      onChange={(e) => setForm({ ...form, returnTime: e.target.value })} 
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Additional Notes</label>
                    <textarea 
                      placeholder="Any other details..."
                      rows={2}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 outline-none resize-none"
                      value={form.notes} 
                      onChange={(e) => setForm({ ...form, notes: e.target.value })} 
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button 
                    type="submit" 
                    className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-extrabold text-sm px-6 py-3 rounded-xl shadow-md transition-all flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    {canApprove ? 'Generate & Issue Gate Pass' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Recent Records Table */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mt-8">
            <div className="p-6 border-b border-gray-100 flex items-center gap-3">
              <div className="p-2.5 bg-fuchsia-50 text-fuchsia-600 rounded-xl">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-gray-900">Recent Gate Pass Records</h3>
            </div>

            {loading ? (
              <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
            ) : items.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="font-bold text-lg">No records found</p>
                <p className="text-sm">Gate pass records will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-gray-50/50 text-gray-500 font-extrabold text-[11px] uppercase tracking-wider">
                      <th className="px-6 py-4">Slip # / Date</th>
                      <th className="px-6 py-4">Person Details</th>
                      <th className="px-6 py-4">Reason & Destination</th>
                      <th className="px-6 py-4">Timings</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{item.slipNumber || '-'}</div>
                          <div className="text-xs text-gray-500 font-medium mt-0.5">{new Date(item.requestedDate).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-gray-400" />
                            {item.requestType === 'STUDENT' ? item.student?.user?.name : item.requester?.name}
                          </div>
                          <div className="text-xs text-gray-500 font-medium mt-0.5">
                            {item.requestType === 'STUDENT' 
                              ? `Class ${item.student?.class?.name}-${item.student?.class?.section} | Roll: ${item.student?.rollNo || 'N/A'}`
                              : `Role: ${item.requester?.role}`
                            }
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900 line-clamp-1" title={item.reason}>{item.reason}</div>
                          {item.destination && <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" /> {item.destination}</div>}
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold">
                          <div className="flex items-center gap-1 text-rose-600"><LogOut className="w-3 h-3" /> Exit: {item.exitTime || 'N/A'}</div>
                          {item.returnTime && <div className="flex items-center gap-1 text-emerald-600 mt-0.5"><Clock className="w-3 h-3" /> Return: {item.returnTime}</div>}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            item.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' :
                            item.status === 'REJECTED' ? 'bg-red-50 text-red-700' :
                            'bg-amber-50 text-amber-700'
                          }`}>
                            {item.status === 'APPROVED' && <CheckCircle2 className="w-3 h-3" />}
                            {item.status === 'REJECTED' && <XCircle className="w-3 h-3" />}
                            {item.status === 'PENDING' && <Clock className="w-3 h-3" />}
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {canApprove && item.status === 'PENDING' && (
                              <>
                                <button onClick={() => approve(item.id, 'APPROVED')} className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors" title="Approve">
                                  <Check className="w-4 h-4" />
                                </button>
                                <button onClick={() => approve(item.id, 'REJECTED')} className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Reject">
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {item.status === 'APPROVED' && (
                              <button onClick={() => printSlip(item)} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5" title="Print Slip">
                                <Printer className="w-3.5 h-3.5" /> Print
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GatePassPage;
