import React, { useState, useEffect } from 'react';
import { 
  UserPlus, Search, Filter, Phone, Calendar, User, 
  Trash2, Printer, CheckCircle, Clock, XCircle, 
  RefreshCw, BookOpen, CreditCard, ChevronRight, Eye, UserCheck,
  MapPin, ChevronDown, X, MessageCircle, Heart, ExternalLink
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

  // Selected admission for full details modal
  const [selectedAdmission, setSelectedAdmission] = useState<any>(null);

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
      if (selectedAdmission && selectedAdmission.id === id) {
        setSelectedAdmission((prev: any) => ({ ...prev, status: newStatus }));
      }
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
              <table className="w-full min-w-[1050px] text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/90 border-b border-slate-200 uppercase tracking-wider text-[11px] font-black text-slate-600">
                    <th className="py-4 px-4 w-14 text-center">S.No</th>
                    <th className="py-4 px-4 w-18 text-center">Photo</th>
                    <th className="py-4 px-5 min-w-[220px]">Student Name</th>
                    <th className="py-4 px-4 min-w-[120px] text-center">Class</th>
                    <th className="py-4 px-5 min-w-[190px]">Parent Name</th>
                    <th className="py-4 px-4 min-w-[150px]">Mobile No</th>
                    <th className="py-4 px-5 min-w-[170px]">Reference</th>
                    <th className="py-4 px-4 min-w-[130px] text-center">Status</th>
                    <th className="py-4 px-4 min-w-[130px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredList.map((adm, index) => {
                    const regNo = `ADM-${adm.id?.slice(0, 6).toUpperCase()}`;
                    const isMale = (adm.gender || '').toUpperCase() === 'MALE';
                    const isFemale = (adm.gender || '').toUpperCase() === 'FEMALE';
                    return (
                      <tr 
                        key={adm.id} 
                        className="hover:bg-indigo-50/20 transition-all duration-150 group"
                      >
                        {/* 1. S.No */}
                        <td className="py-4 px-4 align-middle text-center font-bold text-slate-500 text-xs">
                          {index + 1}
                        </td>

                        {/* 2. Photo */}
                        <td className="py-4 px-4 align-middle text-center">
                          <div 
                            onClick={() => adm.studentImage && setPreviewPhoto({ url: adm.studentImage, name: adm.studentName })}
                            className={`w-11 h-11 rounded-xl overflow-hidden border border-slate-200 bg-gradient-to-br from-slate-100 to-slate-200 shadow-xs flex items-center justify-center mx-auto transition-transform group-hover:scale-105 ${adm.studentImage ? 'cursor-pointer hover:ring-2 hover:ring-indigo-500' : ''}`}
                            title={adm.studentImage ? 'Click to view photo' : 'No photo uploaded'}
                          >
                            {adm.studentImage ? (
                              <img src={adm.studentImage} alt={adm.studentName} className="w-full h-full object-cover" />
                            ) : (
                              <span className="font-black text-slate-400 text-xs tracking-wider uppercase">
                                {adm.studentName?.slice(0, 2) || 'ST'}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 3. Student Name (Clickable for full details) */}
                        <td className="py-4 px-5 align-middle">
                          <button
                            type="button"
                            onClick={() => setSelectedAdmission(adm)}
                            className="group/btn text-left flex items-start gap-1.5 focus:outline-none cursor-pointer"
                            title="Click to view full admission details"
                          >
                            <div>
                              <div className="font-black text-slate-900 text-sm leading-snug group-hover/btn:text-indigo-600 transition-colors flex items-center gap-1.5">
                                <span>{adm.studentName}</span>
                                <span className="text-slate-400 group-hover/btn:text-indigo-600 text-xs transition-transform group-hover/btn:translate-x-0.5">
                                  ↗
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                                  {regNo}
                                </span>
                                {adm.gender && (
                                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded capitalize ${
                                    isMale ? 'text-blue-700 bg-blue-50' : isFemale ? 'text-pink-700 bg-pink-50' : 'text-slate-600 bg-slate-100'
                                  }`}>
                                    {adm.gender}
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        </td>

                        {/* 4. Class */}
                        <td className="py-4 px-4 align-middle text-center">
                          <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg font-black text-xs border border-indigo-100 shadow-2xs whitespace-nowrap">
                            {adm.classApplied || 'N/A'}
                          </span>
                        </td>

                        {/* 5. Parent Name */}
                        <td className="py-4 px-5 align-middle">
                          <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[180px]">
                              {adm.fatherName || adm.motherName || '-'}
                            </span>
                          </div>
                          {adm.fatherName && adm.motherName && (
                            <div className="text-[10px] text-slate-400 pl-5">
                              M: {adm.motherName}
                            </div>
                          )}
                        </td>

                        {/* 6. Mobile No */}
                        <td className="py-4 px-4 align-middle">
                          {adm.phone ? (
                            <a 
                              href={`tel:${adm.phone}`} 
                              title="Click to call parent"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-mono font-bold text-xs transition shadow-2xs whitespace-nowrap"
                            >
                              <Phone className="w-3 h-3 text-emerald-600" />
                              {adm.phone}
                            </a>
                          ) : (
                            <span className="text-slate-400 text-xs italic">-</span>
                          )}
                        </td>

                        {/* 7. Reference */}
                        <td className="py-4 px-5 align-middle">
                          <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span className="truncate max-w-[160px]">
                              {adm.registeredByName || 'Direct / Online'}
                            </span>
                          </div>
                          {adm.cashReceivedByName && (
                            <div className="text-[10px] text-amber-700 font-medium pl-5 truncate max-w-[160px]">
                              Recvd: {adm.cashReceivedByName}
                            </div>
                          )}
                        </td>

                        {/* 8. Status */}
                        <td className="py-4 px-4 align-middle text-center">
                          <div className="relative inline-block w-full max-w-[125px]">
                            <select
                              value={adm.status || 'PENDING'}
                              onChange={e => handleUpdateStatus(adm.id, e.target.value)}
                              className={`w-full text-[11px] font-black px-2.5 py-1.5 pr-6 rounded-lg border cursor-pointer outline-none transition-all shadow-2xs appearance-none ${
                                adm.status === 'ENROLLED' 
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:border-emerald-400' 
                                  : adm.status === 'REJECTED'
                                  ? 'bg-rose-50 text-rose-800 border-rose-300 hover:border-rose-400'
                                  : 'bg-amber-50 text-amber-800 border-amber-300 hover:border-amber-400'
                              }`}
                            >
                              <option value="PENDING">Pending</option>
                              <option value="ENROLLED">Enrolled</option>
                              <option value="REJECTED">Rejected</option>
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </td>

                        {/* 9. Actions */}
                        <td className="py-4 px-4 align-middle text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View Full Details Button */}
                            <button
                              type="button"
                              onClick={() => setSelectedAdmission(adm)}
                              className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer border border-transparent hover:border-indigo-100"
                              title="View full admission details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Print PDF Button */}
                            <button
                              type="button"
                              onClick={() => setSelectedForPrint(adm)}
                              className="p-1.5 text-slate-600 hover:text-indigo-700 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                              title="Print A4 Application Form"
                            >
                              <Printer className="w-4 h-4" />
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleDelete(adm.id, adm.studentName)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
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

      {/* FULL ADMISSION DETAILS MODAL */}
      {selectedAdmission && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setSelectedAdmission(null)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden my-auto border border-slate-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Top Header */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 relative">
              <button
                onClick={() => setSelectedAdmission(null)}
                className="absolute top-5 right-5 text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-xl transition cursor-pointer"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                {/* Photo */}
                <div 
                  onClick={() => selectedAdmission.studentImage && setPreviewPhoto({ url: selectedAdmission.studentImage, name: selectedAdmission.studentName })}
                  className={`w-20 h-20 rounded-2xl bg-white/10 border-2 border-white/20 shadow-inner overflow-hidden flex items-center justify-center shrink-0 ${selectedAdmission.studentImage ? 'cursor-pointer hover:border-indigo-400' : ''}`}
                  title={selectedAdmission.studentImage ? 'Click to view photo' : ''}
                >
                  {selectedAdmission.studentImage ? (
                    <img src={selectedAdmission.studentImage} alt={selectedAdmission.studentName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-black text-2xl text-indigo-200">
                      {selectedAdmission.studentName?.slice(0, 2) || 'ST'}
                    </span>
                  )}
                </div>

                {/* Student Info in Header */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-2xl font-black text-white tracking-tight">
                      {selectedAdmission.studentName}
                    </h2>
                    <span className="font-mono text-xs font-bold bg-white/15 px-2.5 py-1 rounded-lg text-indigo-200 border border-white/10">
                      ADM-{selectedAdmission.id?.slice(0, 6).toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-2 flex-wrap text-xs text-slate-300">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 font-bold">
                      Applied for {selectedAdmission.classApplied || 'N/A'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-300">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Registered: {new Date(selectedAdmission.createdAt).toLocaleDateString('en-IN')}
                    </span>
                    {selectedAdmission.academicYear && (
                      <>
                        <span>•</span>
                        <span className="text-purple-300 font-semibold">
                          Year: {selectedAdmission.academicYear}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Status Badge in Header */}
                <div className="sm:self-center">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider ${
                    selectedAdmission.status === 'ENROLLED'
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                      : selectedAdmission.status === 'REJECTED'
                      ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                      : 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                  }`}>
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    {selectedAdmission.status || 'PENDING'}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">

              {/* 4 CARDS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Card 1: Student Personal Details */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                      <User className="w-4 h-4" />
                    </div>
                    <h3 className="font-black text-slate-900 text-sm">Personal Information</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium block text-[11px]">Gender</span>
                      <span className="font-bold text-slate-800 capitalize">{selectedAdmission.gender || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block text-[11px]">Date of Birth</span>
                      <span className="font-bold text-slate-800">
                        {selectedAdmission.dob ? new Date(selectedAdmission.dob).toLocaleDateString('en-IN') : '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block text-[11px]">Aadhaar Number</span>
                      <span className="font-mono font-bold text-slate-800">{selectedAdmission.aadharNo || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block text-[11px]">Mother Tongue</span>
                      <span className="font-bold text-slate-800">{selectedAdmission.motherTongue || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block text-[11px]">Nationality</span>
                      <span className="font-bold text-slate-800">{selectedAdmission.nationality || 'Indian'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block text-[11px]">Religion / Caste</span>
                      <span className="font-bold text-slate-800">
                        {selectedAdmission.religion || ''} {selectedAdmission.caste ? `(${selectedAdmission.caste})` : ''} {selectedAdmission.subCaste ? `- ${selectedAdmission.subCaste}` : ''}
                        {!selectedAdmission.religion && !selectedAdmission.caste ? '-' : ''}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 font-medium block text-[11px]">Previous School</span>
                      <span className="font-bold text-slate-800">{selectedAdmission.previousSchool || 'None / Not Mentioned'}</span>
                    </div>
                  </div>
                </div>

                {/* Card 2: Parent & Family Details */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                    <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center font-bold">
                      <Heart className="w-4 h-4" />
                    </div>
                    <h3 className="font-black text-slate-900 text-sm">Parent & Guardian Details</h3>
                  </div>

                  <div className="space-y-3 text-xs">
                    {/* Father */}
                    <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-bold">Father:</span>
                        <span className="font-black text-slate-900">{selectedAdmission.fatherName || '-'}</span>
                      </div>
                      {selectedAdmission.fatherOccupation && (
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>Occupation:</span>
                          <span className="font-semibold text-slate-700">{selectedAdmission.fatherOccupation}</span>
                        </div>
                      )}
                      {selectedAdmission.fatherPhone && (
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>Phone:</span>
                          <span className="font-mono font-bold text-indigo-600">{selectedAdmission.fatherPhone}</span>
                        </div>
                      )}
                      {selectedAdmission.fatherAadhar && (
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>Aadhaar:</span>
                          <span className="font-mono text-slate-700">{selectedAdmission.fatherAadhar}</span>
                        </div>
                      )}
                    </div>

                    {/* Mother */}
                    <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-bold">Mother:</span>
                        <span className="font-black text-slate-900">{selectedAdmission.motherName || '-'}</span>
                      </div>
                      {selectedAdmission.motherOccupation && (
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>Occupation:</span>
                          <span className="font-semibold text-slate-700">{selectedAdmission.motherOccupation}</span>
                        </div>
                      )}
                      {selectedAdmission.motherPhone && (
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>Phone:</span>
                          <span className="font-mono font-bold text-pink-600">{selectedAdmission.motherPhone}</span>
                        </div>
                      )}
                      {selectedAdmission.motherAadhar && (
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>Aadhaar:</span>
                          <span className="font-mono text-slate-700">{selectedAdmission.motherAadhar}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card 3: Contact & Address */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <h3 className="font-black text-slate-900 text-sm">Contact & Address Details</h3>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                      <div>
                        <span className="text-[11px] text-slate-500 block">Primary Contact Phone</span>
                        <span className="text-base font-black font-mono text-emerald-800">{selectedAdmission.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={`tel:${selectedAdmission.phone}`}
                          className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                          title="Call Parent"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                        <a
                          href={`https://wa.me/91${selectedAdmission.phone?.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
                          title="WhatsApp Parent"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      </div>
                    </div>

                    {selectedAdmission.alternatePhone && (
                      <div className="flex justify-between text-xs py-1">
                        <span className="text-slate-400 font-medium">Alternate Phone:</span>
                        <span className="font-mono font-bold text-slate-800">{selectedAdmission.alternatePhone}</span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-slate-400 font-medium block mb-1">Full Residential Address</span>
                      <p className="text-xs font-semibold text-slate-800 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                        {selectedAdmission.address || (
                          [
                            selectedAdmission.doorNo,
                            selectedAdmission.village,
                            selectedAdmission.mandal,
                            selectedAdmission.district,
                            selectedAdmission.state
                          ].filter(Boolean).join(', ') || 'No address provided'
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card 4: Fee & Administrative Details */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <h3 className="font-black text-slate-900 text-sm">Fee & Administration</h3>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <span className="text-slate-400 font-medium block text-[11px]">Application Fee</span>
                        <span className="text-lg font-black text-slate-900">
                          {selectedAdmission.admissionFee ? `₹${Number(selectedAdmission.admissionFee).toLocaleString('en-IN')}` : 'Standard'}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <span className="text-slate-400 font-medium block text-[11px]">Payment Mode</span>
                        <span className="text-sm font-black text-slate-900 uppercase">
                          {selectedAdmission.paymentMethod || 'CASH'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-2 border-y border-slate-100">
                      <span className="text-slate-500 font-bold">Payment Status:</span>
                      <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase ${
                        selectedAdmission.paymentStatus === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {selectedAdmission.paymentStatus || 'PENDING'}
                      </span>
                    </div>

                    {selectedAdmission.cashReceivedByName && (
                      <div className="flex justify-between text-xs py-1">
                        <span className="text-slate-500 font-medium">Cash Collected By:</span>
                        <span className="font-black text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {selectedAdmission.cashReceivedByName}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-xs py-1">
                      <span className="text-slate-500 font-medium">Registered Staff Reference:</span>
                      <span className="font-black text-indigo-900">
                        {selectedAdmission.registeredByName || 'Direct / Online'}
                      </span>
                    </div>

                    {selectedAdmission.paymentReceipt && (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            const receipt = selectedAdmission.paymentReceipt;
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
                          className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl border border-indigo-200 flex items-center justify-center gap-2 transition cursor-pointer"
                        >
                          <Eye className="w-4 h-4" /> View Payment Receipt
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Change Status Box inside Modal */}
              <div className="bg-slate-100 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-700">Update Admission Status:</span>
                  <div className="relative inline-block">
                    <select
                      value={selectedAdmission.status || 'PENDING'}
                      onChange={e => handleUpdateStatus(selectedAdmission.id, e.target.value)}
                      className="text-xs font-black px-3 py-1.5 pr-7 rounded-xl border-2 bg-white cursor-pointer outline-none shadow-xs"
                    >
                      <option value="PENDING">Pending Review</option>
                      <option value="ENROLLED">Enrolled / Admitted</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div className="text-xs text-slate-500">
                  Clicking "Enrolled" marks this applicant as officially admitted.
                </div>
              </div>

            </div>

            {/* Modal Bottom Footer */}
            <div className="bg-white p-4 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedForPrint(selectedAdmission);
                }}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-2 transition cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print Official A4 Application Form
              </button>

              <button
                type="button"
                onClick={() => setSelectedAdmission(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
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
