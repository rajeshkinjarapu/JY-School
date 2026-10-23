import React, { useState, useEffect } from 'react';
import { 
  UserPlus, Search, Filter, Phone, Calendar, User, 
  Trash2, Printer, CheckCircle, Clock, XCircle, 
  RefreshCw, BookOpen, CreditCard, ChevronRight, Eye, UserCheck,
  MapPin, ChevronDown
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
      toast.success('Admission application deleted');
      setAdmissions(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      toast.error('Failed to delete admission');
    }
  };

  // Filtered List
  const filteredList = admissions.filter(item => {
    const matchesSearch = !search ||
      item.studentName?.toLowerCase().includes(search.toLowerCase()) ||
      item.phone?.includes(search) ||
      item.aadharNo?.includes(search) ||
      item.fatherName?.toLowerCase().includes(search.toLowerCase()) ||
      item.registeredByName?.toLowerCase().includes(search.toLowerCase()) ||
      item.academicYear?.toLowerCase().includes(search.toLowerCase());

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
              <table className="w-full min-w-[1250px] text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 uppercase tracking-wider text-[11px] font-black text-slate-600">
                    <th className="py-4 px-5 w-20">Photo</th>
                    <th className="py-4 px-5 min-w-[260px]">Student & Details</th>
                    <th className="py-4 px-5 min-w-[130px] text-center">Class Applied</th>
                    <th className="py-4 px-5 min-w-[270px]">Parents & Contact</th>
                    <th className="py-4 px-5 min-w-[240px]">Registered By</th>
                    <th className="py-4 px-5 min-w-[170px]">App Fee / Mode</th>
                    <th className="py-4 px-5 min-w-[170px]">Status</th>
                    <th className="py-4 px-5 min-w-[140px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredList.map(adm => {
                    const regNo = `ADM-${adm.id?.slice(0, 6).toUpperCase()}`;
                    const isMale = (adm.gender || '').toUpperCase() === 'MALE';
                    const isFemale = (adm.gender || '').toUpperCase() === 'FEMALE';
                    return (
                      <tr key={adm.id} className="hover:bg-indigo-50/25 transition-all duration-150 group">
                        
                        {/* Student Photo */}
                        <td className="py-6 px-5 align-middle">
                          <div 
                            onClick={() => adm.studentImage && setPreviewPhoto({ url: adm.studentImage, name: adm.studentName })}
                            className={`w-14 h-14 rounded-2xl overflow-hidden border-2 border-slate-200/90 bg-gradient-to-br from-slate-100 to-slate-200 shadow-sm flex items-center justify-center shrink-0 transition-all group-hover:scale-105 group-hover:border-indigo-300 ${adm.studentImage ? 'cursor-pointer hover:ring-2 hover:ring-indigo-500' : ''}`}
                            title={adm.studentImage ? 'Click to view photo' : 'No photo uploaded'}
                          >
                            {adm.studentImage ? (
                              <img src={adm.studentImage} alt={adm.studentName} className="w-full h-full object-cover" />
                            ) : (
                              <span className="font-black text-slate-400 text-sm tracking-wider uppercase">
                                {adm.studentName?.slice(0, 2) || 'ST'}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Student Details */}
                        <td className="py-6 px-5 align-middle">
                          <div className="space-y-2">
                            <div className="font-black text-slate-900 text-base leading-tight group-hover:text-indigo-600 transition-colors">
                              {adm.studentName}
                            </div>
                            
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Gender Badge */}
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                isMale 
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                                  : isFemale 
                                  ? 'bg-pink-50 text-pink-700 border border-pink-200' 
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isMale ? 'bg-blue-500' : isFemale ? 'bg-pink-500' : 'bg-slate-400'}`} />
                                {adm.gender || 'Not specified'}
                              </span>

                              {/* DOB Badge */}
                              {adm.dob && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                  <Calendar className="w-3 h-3 text-slate-400" />
                                  DOB: {new Date(adm.dob).toLocaleDateString('en-IN')}
                                </span>
                              )}
                            </div>

                            {/* App No & Reg Date */}
                            <div className="flex items-center gap-2 pt-0.5 text-[11px] text-slate-500 font-medium">
                              <span className="font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                                {regNo}
                              </span>
                              <span>•</span>
                              <span className="text-slate-400">
                                Registered {new Date(adm.createdAt).toLocaleDateString('en-IN')}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Class Applied */}
                        <td className="py-6 px-5 align-middle text-center">
                          <span className="inline-block px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-800 rounded-xl font-black text-xs border border-indigo-200 shadow-xs whitespace-nowrap">
                            {adm.classApplied || 'N/A'}
                          </span>
                        </td>

                        {/* Parents & Contact */}
                        <td className="py-6 px-5 align-middle">
                          <div className="space-y-2">
                            {/* Parent Name */}
                            <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[230px]">
                                {adm.fatherName ? `Father: ${adm.fatherName}` : adm.motherName ? `Mother: ${adm.motherName}` : '-'}
                              </span>
                            </div>

                            {/* Phone with Call */}
                            <div className="flex items-center gap-2">
                              {adm.phone ? (
                                <a 
                                  href={`tel:${adm.phone}`} 
                                  title="Click to call parent"
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-mono font-bold text-xs transition shadow-xs"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                  {adm.phone}
                                </a>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">No phone</span>
                              )}
                            </div>

                            {/* Address */}
                            {adm.address && (
                              <div className="flex items-start gap-1.5 text-[11px] text-slate-500 pt-0.5" title={adm.address}>
                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                <span className="line-clamp-2 max-w-[240px] leading-relaxed font-medium">
                                  {adm.address}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Registered By & Cash Collector */}
                        <td className="py-6 px-5 align-middle">
                          <div className="space-y-2">
                            {/* Staff Name */}
                            <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                              <UserCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              <span className="truncate max-w-[190px]">
                                {adm.registeredByName || 'Direct / Online'}
                              </span>
                            </div>

                            {/* Cash Collector Badge */}
                            {adm.cashReceivedByName && (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black bg-amber-50 text-amber-900 border border-amber-200 shadow-xs">
                                <span className="text-amber-600">💵 Cash Recvd:</span>
                                <span className="underline decoration-amber-400 font-black">
                                  {adm.cashReceivedByName}
                                </span>
                              </div>
                            )}

                            {/* Academic Year */}
                            {adm.academicYear && (
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium pt-0.5">
                                <span className="font-semibold text-slate-400">Academic Year:</span>
                                <span className="font-black text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md">
                                  {adm.academicYear}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Fee & Mode */}
                        <td className="py-6 px-5 align-middle">
                          <div className="space-y-1.5">
                            {/* Amount */}
                            <div className="flex items-baseline gap-1">
                              {adm.admissionFee ? (
                                <span className="font-black text-slate-900 text-base leading-none">
                                  ₹{Number(adm.admissionFee).toLocaleString('en-IN')}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-bold text-xs">Standard Fee</span>
                              )}
                            </div>

                            {/* Payment Status Pill */}
                            <div>
                              <span className={`inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider ${
                                adm.paymentStatus === 'COMPLETED' 
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${adm.paymentStatus === 'COMPLETED' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                {adm.paymentMethod || 'CASH'} • {adm.paymentStatus || 'PENDING'}
                              </span>
                            </div>

                            {/* View Receipt */}
                            {adm.paymentReceipt && (
                              <div className="pt-0.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const receipt = adm.paymentReceipt;
                                    if (!receipt) return;
                                    if (receipt.startsWith('data:')) {
                                      const win = window.open('', '_blank');
                                      if (win) {
                                        const isImage = receipt.startsWith('data:image');
                                        win.document.write(
                                          isImage
                                            ? `<html><body style="margin:0;background:#000;display:flex;align-items:center;justify-content:center;min-height:100vh;"><img src="${receipt}" style="max-width:100%;max-height:100vh;object-fit:contain;" /></body></html>`
                                            : `<html><body style="margin:0;"><embed src="${receipt}" width="100%" height="100%" style="position:fixed;top:0;left:0;width:100%;height:100%;" /></body></html>`
                                        );
                                        win.document.close();
                                      }
                                      return;
                                    }
                                    const url = receipt.startsWith('http')
                                      ? receipt
                                      : `http://66.116.252.191:19998/${receipt.replace(/^\/+/, '')}`;
                                    window.open(url, '_blank', 'noreferrer');
                                  }}
                                  className="inline-flex items-center gap-1.5 text-[11px] text-indigo-600 hover:text-indigo-800 font-black hover:underline cursor-pointer bg-indigo-50/70 hover:bg-indigo-100/70 px-2.5 py-1 rounded-lg border border-indigo-100 transition"
                                >
                                  <Eye className="w-3 h-3 text-indigo-600" /> View Receipt
                                </button>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Status with quick changer */}
                        <td className="py-6 px-5 align-middle">
                          <div className="relative inline-block w-full max-w-[155px]">
                            <select
                              value={adm.status || 'PENDING'}
                              onChange={e => handleUpdateStatus(adm.id, e.target.value)}
                              className={`w-full text-xs font-black px-3 py-2 pr-7 rounded-xl border-2 cursor-pointer outline-none transition-all shadow-xs appearance-none ${
                                adm.status === 'ENROLLED' 
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:border-emerald-400' 
                                  : adm.status === 'REJECTED'
                                  ? 'bg-rose-50 text-rose-800 border-rose-300 hover:border-rose-400'
                                  : 'bg-amber-50 text-amber-800 border-amber-300 hover:border-amber-400'
                              }`}
                            >
                              <option value="PENDING">Pending Review</option>
                              <option value="ENROLLED">Enrolled / Admitted</option>
                              <option value="REJECTED">Rejected</option>
                            </select>
                            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </td>

                        {/* Action Buttons */}
                        <td className="py-6 px-5 align-middle text-right">
                          <div className="flex items-center justify-end gap-2">
                            
                            {/* PRINT OFFICIAL FORM BUTTON */}
                            <button
                              type="button"
                              onClick={() => setSelectedForPrint(adm)}
                              className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl font-black text-xs flex items-center gap-1.5 transition-all shadow-sm hover:shadow-indigo-200 active:scale-95 cursor-pointer whitespace-nowrap"
                              title="Print Official A4 Registration Form"
                            >
                              <Printer className="w-3.5 h-3.5" /> Print PDF
                            </button>

                            {/* DELETE BUTTON */}
                            <button
                              type="button"
                              onClick={() => handleDelete(adm.id, adm.studentName)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-rose-200"
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
