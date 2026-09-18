import React, { useState, useEffect } from 'react';
import { 
  UserPlus, Search, Filter, Phone, Calendar, User, 
  Trash2, Printer, CheckCircle, Clock, XCircle, 
  RefreshCw, BookOpen, CreditCard, ChevronRight, Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { PageHeader } from '../../components/UI/PageHeader';
import { AdmissionPrintModal } from './AdmissionPrintModal';

export const AdmissionsManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [classFilter, setClassFilter] = useState('ALL');
  const [schoolSettings, setSchoolSettings] = useState<any>(null);

  // Selected admission for printing
  const [selectedForPrint, setSelectedForPrint] = useState<any>(null);

  // Photo viewer modal
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; name: string } | null>(null);

  const fetchAdmissions = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/api/admissions');
      setAdmissions(res.data?.data || res.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load admissions');
      setAdmissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmissions();
    api.get('/api/settings').then(r => setSchoolSettings(r.data)).catch(() => {});
  }, []);

  // Update Status
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await api.put(`/api/admissions/${id}`, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      setAdmissions(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  // Delete Admission
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the admission application for "${name}"?`)) return;
    try {
      await api.delete(`/api/admissions/${id}`);
      toast.success('Application deleted');
      setAdmissions(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      toast.error('Failed to delete application');
    }
  };

  // Filters calculation
  const filteredList = admissions.filter(item => {
    const matchesSearch = 
      !search.trim() ||
      item.studentName?.toLowerCase().includes(search.toLowerCase()) ||
      item.phone?.includes(search) ||
      item.aadharNo?.includes(search) ||
      item.fatherName?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const matchesClass = classFilter === 'ALL' || item.classApplied === classFilter;

    return matchesSearch && matchesStatus && matchesClass;
  });

  // KPI Counts
  const totalCount = admissions.length;
  const pendingCount = admissions.filter(a => a.status === 'PENDING').length;
  const enrolledCount = admissions.filter(a => a.status === 'ENROLLED').length;
  const rejectedCount = admissions.filter(a => a.status === 'REJECTED').length;

  const uniqueClasses = Array.from(new Set(admissions.map(a => a.classApplied).filter(Boolean)));

  return (
    <div className="flex-1 overflow-auto bg-slate-50/70" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader 
        title="Admissions Management" 
        icon={<UserPlus className="w-6 h-6 text-indigo-600" />}
      />

      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">

        {/* TOP KPI CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xl">
              👥
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Inquiries</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">{totalCount}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black text-xl">
              ⏳
            </div>
            <div>
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Pending Review</p>
              <h3 className="text-2xl font-black text-amber-900 mt-0.5">{pendingCount}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xl">
              🎓
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Enrolled / Admitted</p>
              <h3 className="text-2xl font-black text-emerald-900 mt-0.5">{enrolledCount}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-rose-200/80 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-black text-xl">
              ✕
            </div>
            <div>
              <p className="text-xs font-bold text-rose-700 uppercase tracking-wider">Rejected</p>
              <h3 className="text-2xl font-black text-rose-900 mt-0.5">{rejectedCount}</h3>
            </div>
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search student, parent, phone, Aadhar..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {['ALL', 'PENDING', 'ENROLLED', 'REJECTED'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === st
                      ? 'bg-white text-indigo-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st === 'ALL' ? 'All' : st.charAt(0) + st.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            {/* Class Filter */}
            {uniqueClasses.length > 0 && (
              <select
                value={classFilter}
                onChange={e => setClassFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Classes</option>
                {uniqueClasses.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={fetchAdmissions}
              title="Refresh list"
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={() => navigate('/admissions/register')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-200 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" /> New Registration
            </button>
          </div>

        </div>

        {/* ADMISSIONS LIST TABLE */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-slate-400 font-medium">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-3" />
              Loading admission inquiries...
            </div>
          ) : filteredList.length === 0 ? (
            <div className="p-16 text-center text-slate-500">
              <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
                📂
              </div>
              <h4 className="font-bold text-slate-800 text-base">No admission records found</h4>
              <p className="text-xs text-slate-400 mt-1">
                {search || statusFilter !== 'ALL' ? 'Try adjusting your search filters.' : 'Click "New Registration" to add an admission.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 uppercase tracking-wider text-[11px] font-black text-slate-500">
                    <th className="p-4 w-16">Photo</th>
                    <th className="p-4">Student & Details</th>
                    <th className="p-4">Class Applied</th>
                    <th className="p-4">Parents & Contact</th>
                    <th className="p-4">Fee / Mode</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredList.map(adm => {
                    const regNo = `ADM-${adm.id?.slice(0, 6).toUpperCase()}`;
                    return (
                      <tr key={adm.id} className="hover:bg-slate-50/60 transition-colors">
                        
                        {/* Student Photo */}
                        <td className="p-4">
                          <div 
                            onClick={() => adm.studentImage && setPreviewPhoto({ url: adm.studentImage, name: adm.studentName })}
                            className={`w-12 h-12 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center shrink-0 ${adm.studentImage ? 'cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all' : ''}`}
                            title={adm.studentImage ? 'Click to view photo' : 'No photo uploaded'}
                          >
                            {adm.studentImage ? (
                              <img src={adm.studentImage} alt={adm.studentName} className="w-full h-full object-cover" />
                            ) : (
                              <span className="font-black text-slate-400 text-sm uppercase">
                                {adm.studentName?.slice(0, 2) || 'ST'}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Student Details */}
                        <td className="p-4">
                          <div className="font-black text-slate-900 text-sm">{adm.studentName}</div>
                          <div className="flex items-center gap-2 mt-1 text-slate-500 font-medium text-[11px]">
                            <span className="font-bold text-slate-700">{adm.gender || '-'}</span>
                            {adm.dob && (
                              <span>• DOB: {new Date(adm.dob).toLocaleDateString('en-IN')}</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1 font-mono">
                            App No: <span className="font-bold text-indigo-700">{regNo}</span> • Registered {new Date(adm.createdAt).toLocaleDateString('en-IN')}
                          </div>
                        </td>

                        {/* Class Applied */}
                        <td className="p-4">
                          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-800 rounded-lg font-black text-xs border border-indigo-100">
                            {adm.classApplied || 'N/A'}
                          </span>
                        </td>

                        {/* Parents & Phone */}
                        <td className="p-4">
                          <div className="font-bold text-slate-800">
                            {adm.fatherName ? `Father: ${adm.fatherName}` : adm.motherName ? `Mother: ${adm.motherName}` : '-'}
                          </div>
                          <div className="mt-1">
                            <a 
                              href={`tel:${adm.phone}`} 
                              className="text-indigo-600 hover:text-indigo-800 font-mono font-bold flex items-center gap-1.5"
                            >
                              <Phone className="w-3 h-3" /> {adm.phone}
                            </a>
                          </div>
                          {adm.address && (
                            <div className="text-[10px] text-slate-400 truncate max-w-[180px] mt-0.5" title={adm.address}>
                              {adm.address}
                            </div>
                          )}
                        </td>

                        {/* Fee & Mode */}
                        <td className="p-4">
                          {adm.admissionFee ? (
                            <div className="font-black text-emerald-700 text-xs">
                              ₹ {adm.admissionFee}
                            </div>
                          ) : (
                            <span className="text-slate-400 font-medium">Standard</span>
                          )}
                          <div className="mt-0.5">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${adm.paymentStatus === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                              {adm.paymentMethod || 'CASH'} • {adm.paymentStatus || 'PENDING'}
                            </span>
                          </div>
                        </td>

                        {/* Status with quick changer */}
                        <td className="p-4">
                          <select
                            value={adm.status || 'PENDING'}
                            onChange={e => handleUpdateStatus(adm.id, e.target.value)}
                            className={`text-xs font-black px-2 py-1 rounded-lg border cursor-pointer outline-none ${
                              adm.status === 'ENROLLED' 
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                : adm.status === 'REJECTED'
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            <option value="PENDING">Pending Review</option>
                            <option value="ENROLLED">Enrolled / Admitted</option>
                            <option value="REJECTED">Rejected</option>
                          </select>
                        </td>

                        {/* Action Buttons */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            
                            {/* PRINT OFFICIAL FORM BUTTON */}
                            <button
                              type="button"
                              onClick={() => setSelectedForPrint(adm)}
                              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                              title="Print Official A4 Registration Form"
                            >
                              <Printer className="w-3.5 h-3.5" /> Print PDF
                            </button>

                            {/* DELETE BUTTON */}
                            <button
                              type="button"
                              onClick={() => handleDelete(adm.id, adm.studentName)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                              title="Delete application"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>

                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Official A4 Print Modal */}
      {selectedForPrint && (
        <AdmissionPrintModal
          isOpen={!!selectedForPrint}
          onClose={() => setSelectedForPrint(null)}
          admission={selectedForPrint}
          schoolSettings={schoolSettings}
        />
      )}

      {/* Photo Preview Modal */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm" onClick={() => setPreviewPhoto(null)}>
          <div className="bg-white p-3 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
              <h4 className="font-black text-sm text-slate-900 truncate">{previewPhoto.name}</h4>
              <button onClick={() => setPreviewPhoto(null)} className="text-slate-400 hover:text-slate-700 p-1">✕</button>
            </div>
            <img src={previewPhoto.url} alt={previewPhoto.name} className="w-full max-h-[350px] object-contain rounded-xl" />
          </div>
        </div>
      )}

    </div>
  );
};

export default AdmissionsManagementPage;
