import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, MapPin, Phone, CheckCircle, Navigation, PlusCircle, ListFilter, Search, Download, Trash2, Calendar, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';

interface AddressRecord {
  id: string;
  studentName: string;
  fatherName: string;
  village: string;
  mandal: string;
  mobileNo: string;
  alternateMobileNo?: string;
  referenceTeacherName?: string;
  createdAt: string;
}

export const AddressCollectionTeacherPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'entry' | 'list'>('entry');

  const [formData, setFormData] = useState({
    studentName: '',
    fatherName: '',
    village: '',
    mandal: '',
    mobileNo: '',
    alternateMobileNo: '',
    referenceTeacherId: ''
  });
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([]);

  // List view states
  const [records, setRecords] = useState<AddressRecord[]>([]);
  const [fetchingRecords, setFetchingRecords] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchTeachers = async () => {
    try {
      const response = await axios.get('http://66.116.252.191:19998/api/teachers?limit=1000', {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      if (response.data.success) {
        setTeachers(response.data.data.map((t: any) => ({
          id: t.id,
          name: t.user?.name || 'Unknown'
        })));
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const fetchRecords = async () => {
    setFetchingRecords(true);
    try {
      const response = await axios.get('http://66.116.252.191:19998/api/address-collection', {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      if (response.data.success) {
        setRecords(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching address collections:', error);
      toast.error('Failed to load your collected addresses');
    } finally {
      setFetchingRecords(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
    fetchRecords();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.name === 'referenceTeacherId' ? e.target.value : e.target.value.toUpperCase();
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.studentName || !formData.fatherName || !formData.village || !formData.mandal || !formData.mobileNo) {
      toast.error('దయచేసి అన్ని తప్పనిసరి వివరాలను నింపండి.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://66.116.252.191:19998/api/address-collection', formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      
      if (response.data.success) {
        toast.success('చిరునామా వివరాలు విజయవంతంగా సేవ్ అయ్యాయి!');
        setFormData({
          studentName: '',
          fatherName: '',
          village: '',
          mandal: '',
          mobileNo: '',
          alternateMobileNo: '',
          referenceTeacherId: ''
        });
        // Refresh list immediately so when tab 2 is clicked, it shows the new record
        fetchRecords();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to submit form. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`మీరు ఖచ్చితంగా "${name}" చిరునామా వివరాలను తొలగించాలనుకుంటున్నారా?`)) return;
    
    setDeletingId(id);
    try {
      const response = await axios.delete(`http://66.116.252.191:19998/api/address-collection/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      if (response.data.success) {
        toast.success('రికార్డ్ విజయవంతంగా తొలగించబడింది');
        setRecords(prev => prev.filter(r => r.id !== id));
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'తొలగించడం విఫలమైంది');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredRecords = records.filter(r => {
    const term = searchTerm.toLowerCase();
    return (
      r.studentName.toLowerCase().includes(term) ||
      r.fatherName.toLowerCase().includes(term) ||
      r.village.toLowerCase().includes(term) ||
      r.mandal.toLowerCase().includes(term) ||
      r.mobileNo.includes(term) ||
      (r.alternateMobileNo && r.alternateMobileNo.includes(term))
    );
  });

  const exportToExcel = () => {
    if (filteredRecords.length === 0) {
      toast.error('ఎగుమతి చేయడానికి ఎంట్రీలు లేవు');
      return;
    }
    const exportData = filteredRecords.map((item, index) => ({
      'S.No': index + 1,
      'Student Name': item.studentName,
      'Father Name': item.fatherName,
      'Village': item.village,
      'Mandal': item.mandal,
      'Mobile No': item.mobileNo,
      'Alternate Mobile No': item.alternateMobileNo || '-',
      'Entry Date': item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN') : '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'My_Addresses');
    XLSX.writeFile(workbook, `My_Collected_Addresses_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('Excel ఫైల్ డౌన్‌లోడ్ అయింది!');
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      
      {/* ── Colorful Hero Header ── */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2.5">
            <MapPin className="w-8 h-8 text-yellow-300 shrink-0" />
            Address Collection & Survey
          </h1>
          <p className="text-white/80 text-sm font-medium mt-1">
            విద్యార్థుల సర్వే వివరాలు మరియు చిరునామా సేకరణ ప్యానెల్
          </p>
        </div>
        
        {/* Total stats pill */}
        <div className="flex items-center gap-3">
          <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-2.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-black text-lg">
              {records.length}
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-white/70">Total Collected</p>
              <p className="text-sm font-extrabold text-white">My Submissions</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modern Tabs Navigation ── */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2 w-full sm:w-max border border-slate-200/80">
        <button
          type="button"
          onClick={() => setActiveTab('entry')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            activeTab === 'entry'
              ? 'bg-white text-indigo-700 shadow-md scale-[1.02]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <PlusCircle className="w-4 h-4 text-indigo-600" />
          <span>New Entry (కొత్త చిరునామా)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('list');
            fetchRecords();
          }}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            activeTab === 'list'
              ? 'bg-white text-indigo-700 shadow-md scale-[1.02]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <ListFilter className="w-4 h-4 text-purple-600" />
          <span>My Submissions (సేవ్ చేసినవి)</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-black bg-indigo-100 text-indigo-700">
            {records.length}
          </span>
        </button>
      </div>

      {/* ── Tab 1: New Address Entry Form ── */}
      {activeTab === 'entry' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden animate-fade-in">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 border-b border-indigo-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800">Student Address Form</h2>
                <p className="text-xs text-slate-500 font-medium">నమోదు చేయవలసిన వివరాలను పూరించండి</p>
              </div>
            </div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full">
              * Required Fields
            </span>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Student Name */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-2">
                  Student Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                  <input
                    type="text"
                    name="studentName"
                    value={formData.studentName}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 bg-slate-50/50 focus:bg-white transition"
                    placeholder="Enter student full name"
                    required
                  />
                </div>
              </div>

              {/* Father Name */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-2">
                  Father Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                  <input
                    type="text"
                    name="fatherName"
                    value={formData.fatherName}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 bg-slate-50/50 focus:bg-white transition"
                    placeholder="Enter father's name"
                    required
                  />
                </div>
              </div>

              {/* Village */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-2">
                  Village <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                  <input
                    type="text"
                    name="village"
                    value={formData.village}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 bg-slate-50/50 focus:bg-white transition"
                    placeholder="Village / Town"
                    required
                  />
                </div>
              </div>

              {/* Mandal */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-2">
                  Mandal <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Navigation className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                  <input
                    type="text"
                    name="mandal"
                    value={formData.mandal}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 bg-slate-50/50 focus:bg-white transition"
                    placeholder="Mandal"
                    required
                  />
                </div>
              </div>

              {/* Mobile No */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-2">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                  <input
                    type="tel"
                    name="mobileNo"
                    value={formData.mobileNo}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 bg-slate-50/50 focus:bg-white transition font-mono"
                    placeholder="10 digit mobile no"
                    maxLength={10}
                    required
                  />
                </div>
              </div>

              {/* Alternate Mobile */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-2">
                  Alternate Mobile <span className="text-slate-400 text-xs font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                  <input
                    type="tel"
                    name="alternateMobileNo"
                    value={formData.alternateMobileNo}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 bg-slate-50/50 focus:bg-white transition font-mono"
                    placeholder="Alternate number"
                    maxLength={10}
                  />
                </div>
              </div>
              
              {/* Reference Teacher (Optional dropdown) */}
              <div className="md:col-span-2">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-2">
                  Reference Teacher <span className="text-slate-400 text-xs font-normal">(Defaults to you if empty)</span>
                </label>
                <select
                  name="referenceTeacherId"
                  value={formData.referenceTeacherId}
                  onChange={handleChange}
                  className="w-full pl-4 pr-4 py-3 border-2 border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 bg-slate-50/50 focus:bg-white transition"
                >
                  <option value="">-- Self (నా పేరు మీద నమోదు) --</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </div>
              
            </div>

            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setFormData({
                  studentName: '',
                  fatherName: '',
                  village: '',
                  mandal: '',
                  mobileNo: '',
                  alternateMobileNo: '',
                  referenceTeacherId: ''
                })}
                className="px-5 py-2.5 text-slate-500 hover:bg-slate-100 font-bold text-sm rounded-xl transition cursor-pointer"
              >
                Clear Form
              </button>

              <button
                type="submit"
                disabled={loading}
                className={`flex items-center gap-2 px-8 py-3.5 rounded-xl text-white font-extrabold shadow-lg shadow-indigo-300 transition-all active:scale-95 cursor-pointer ${
                  loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
                }`}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle size={20} />
                )}
                {loading ? 'సేవ్ చేస్తోంది...' : 'Save Details (సేవ్ చేయండి)'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Tab 2: My Collected Entries (List / Table) ── */}
      {activeTab === 'list' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden animate-fade-in space-y-4 p-5 sm:p-6">
          
          {/* List Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="విద్యార్థి పేరు, గ్రామం, మండలం లేదా మొబైల్ తో వెతకండి..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-800 placeholder:font-medium placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchRecords}
                disabled={fetchingRecords}
                className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${fetchingRecords ? 'animate-spin text-indigo-600' : ''}`} />
              </button>
              <button
                onClick={exportToExcel}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-extrabold shadow-sm shadow-emerald-200 transition active:scale-95 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export Excel</span>
              </button>
            </div>
          </div>

          {/* Table Container */}
          {fetchingRecords ? (
            <div className="py-20 text-center flex flex-col items-center justify-center">
              <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
              <p className="text-sm font-bold text-slate-500">చిరునామాలు లోడ్ అవుతున్నాయి...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-extrabold text-slate-700">ఎలాంటి చిరునామాలు కనుగొనబడలేదు</h3>
              <p className="text-xs text-slate-400 mt-1">
                {searchTerm ? 'మీరు వెతికిన పదానికి ఎలాంటి ఫలితాలు లేవు' : 'మీరు ఇంకా ఎలాంటి చిరునామాలను నమోదు చేయలేదు.'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setActiveTab('entry')}
                  className="mt-4 px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-indigo-700 transition"
                >
                  + కొత్త చిరునామా నమోదు చేయండి
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-black text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    <th className="px-4 py-3.5 text-center w-12">#</th>
                    <th className="px-4 py-3.5">Student Details</th>
                    <th className="px-4 py-3.5">Village & Mandal</th>
                    <th className="px-4 py-3.5">Mobile Numbers</th>
                    <th className="px-4 py-3.5">Entry Date</th>
                    <th className="px-4 py-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredRecords.map((item, index) => (
                    <tr key={item.id} className="hover:bg-indigo-50/40 transition-colors">
                      <td className="px-4 py-3.5 text-center font-bold text-slate-400 text-xs">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <p className="font-extrabold text-slate-900">{item.studentName}</p>
                        <p className="text-xs font-medium text-slate-500">Father: {item.fatherName}</p>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span>{item.village}</span>
                        </div>
                        <p className="text-xs text-slate-500 pl-5">Mandal: {item.mandal}</p>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap font-mono text-xs">
                        <a 
                          href={`tel:${item.mobileNo}`} 
                          className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 transition"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          {item.mobileNo}
                        </a>
                        {item.alternateMobileNo && (
                          <p className="text-slate-400 mt-0.5 pl-5">Alt: {item.alternateMobileNo}</p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs font-medium text-slate-500">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        }) : '-'}
                      </td>
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleDelete(item.id, item.studentName)}
                          disabled={deletingId === item.id}
                          className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                          title="Delete entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AddressCollectionTeacherPage;
