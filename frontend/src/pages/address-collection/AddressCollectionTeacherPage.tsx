import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { User, MapPin, Phone, CheckCircle, Navigation, PlusCircle, ListFilter, Search, Download, Trash2, Calendar, FileSpreadsheet, RefreshCw, Upload, X, AlertCircle, Check } from 'lucide-react';
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

  // Excel Import States
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [importDefaultTeacher, setImportDefaultTeacher] = useState<string>('');
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const downloadSampleTemplate = () => {
    const templateData = [
      {
        'Student Name': 'K. SAI KUMAR',
        'Father Name': 'K. RAMA RAO',
        'Village': 'NARASANNAPETA',
        'Mandal': 'NARASANNAPETA',
        'Mobile No': '9876543210',
        'Alternate Mobile No': '9123456780',
        'Reference Teacher': teachers[0]?.name || ''
      },
      {
        'Student Name': 'P. ANITHA',
        'Father Name': 'P. VENKATA RAO',
        'Village': 'JALUMURU',
        'Mandal': 'JALUMURU',
        'Mobile No': '8765432109',
        'Alternate Mobile No': '',
        'Reference Teacher': teachers[1]?.name || ''
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students Data');
    XLSX.writeFile(workbook, 'Student_Address_Collection_Template.xlsx');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processExcelFile(file);
  };

  const processExcelFile = (file: File) => {
    setImportError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          setImportError('Excel sheet is empty.');
          return;
        }
        const worksheet = workbook.Sheets[sheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (rawJson.length === 0) {
          setImportError('No records found in the Excel sheet.');
          return;
        }

        const mapped: any[] = [];
        for (const row of rawJson) {
          const normRow: any = {};
          for (const [key, val] of Object.entries(row)) {
            const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
            if (cleanKey.includes('student') || cleanKey === 'name') normRow.studentName = String(val).trim();
            else if (cleanKey.includes('father')) normRow.fatherName = String(val).trim();
            else if (cleanKey.includes('village') || cleanKey.includes('town') || cleanKey.includes('city') || cleanKey === 'address') normRow.village = String(val).trim();
            else if (cleanKey.includes('mandal') || cleanKey.includes('taluk') || cleanKey.includes('block')) normRow.mandal = String(val).trim();
            else if (cleanKey.includes('alt') || cleanKey.includes('secondary')) normRow.alternateMobileNo = String(val).trim();
            else if (cleanKey.includes('mobile') || cleanKey.includes('phone') || cleanKey.includes('contact')) normRow.mobileNo = String(val).trim();
            else if (cleanKey.includes('teacher') || cleanKey.includes('ref')) normRow.referenceTeacherName = String(val).trim();
          }

          if (normRow.studentName && (normRow.village || normRow.mandal || normRow.mobileNo)) {
            mapped.push(normRow);
          }
        }

        if (mapped.length === 0) {
          setImportError('Could not find valid student records. Please ensure columns: Student Name, Village, Mandal, Mobile No exist in your sheet.');
          return;
        }

        setParsedRows(mapped);
        setImportFile(file);
      } catch (err: any) {
        console.error('Error parsing Excel:', err);
        setImportError('Failed to parse Excel file: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImportSubmit = async () => {
    if (parsedRows.length === 0) return;
    setImportLoading(true);
    setImportError('');
    try {
      const response = await axios.post('http://66.116.252.191:19998/api/address-collection/bulk', {
        records: parsedRows,
        defaultTeacherId: importDefaultTeacher || undefined
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });

      if (response.data.success) {
        toast.success(`విజయవంతంగా ${response.data.count} చిరునామాలు దిగుమతి అయ్యాయి!`);
        setShowImportModal(false);
        setImportFile(null);
        setParsedRows([]);
        setImportDefaultTeacher('');
        fetchRecords(); // refresh list
      }
    } catch (err: any) {
      console.error('Import error:', err);
      const msg = err.response?.data?.message || err.message || 'Import failed.';
      setImportError(msg);
      toast.error(msg);
    } finally {
      setImportLoading(false);
    }
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
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs sm:text-sm font-extrabold shadow-sm shadow-purple-200 transition active:scale-95 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Excel</span>
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

      {/* ── Excel Import Modal ── */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md">
                  <FileSpreadsheet size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black">Upload Student Addresses (Excel / CSV)</h2>
                  <p className="text-white/80 text-xs font-medium">Excel ఫైల్ ద్వారా విద్యార్థుల చిరునామాలను ఒకేసారి దిగుమతి చేయండి</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                  setParsedRows([]);
                  setImportError('');
                }}
                className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-xl transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto">
              
              {/* Template Download Card */}
              <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-extrabold text-indigo-950 text-sm">నమూనా Excel టెంప్లేట్ (Sample Template)</h4>
                  <p className="text-indigo-600/80 text-xs mt-0.5">కాలమ్స్ సరిగ్గా ఉండేలా ఈ టెంప్లేట్ డౌన్‌లోడ్ చేసుకొని డేటా నింపండి.</p>
                </div>
                <button
                  type="button"
                  onClick={downloadSampleTemplate}
                  className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition active:scale-95 shrink-0"
                >
                  <Download size={14} />
                  Download Sample Template
                </button>
              </div>

              {/* Upload Dropzone */}
              <div>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".xlsx, .xls, .csv" 
                  className="hidden" 
                />

                {!importFile ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-indigo-50/20 hover:bg-indigo-50/50 rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition shadow-inner">
                      <Upload size={28} />
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-800 text-sm">ఇక్కడ మీ Excel ఫైల్ ను ఎంచుకోండి</p>
                      <p className="text-slate-400 text-xs mt-1">.xlsx, .xls, .csv ఫైల్స్ సపోర్ట్ చేయబడతాయి</p>
                    </div>
                    <span className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200">
                      Browse File
                    </span>
                  </div>
                ) : (
                  <div className="border border-emerald-200 bg-emerald-50/40 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                        <FileSpreadsheet size={20} />
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-800 text-sm">{importFile.name}</p>
                        <p className="text-xs text-emerald-600 font-bold mt-0.5">
                          ✓ {parsedRows.length} విద్యార్థుల రికార్డులు గుర్తించబడ్డాయి
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setImportFile(null);
                        setParsedRows([]);
                        setImportError('');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>

              {/* Default Teacher Assignment Option */}
              {teachers.length > 0 && (
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    Reference Teacher (ఐచ్చికం - షీట్‌లో లేకపోతే దీనికి అసైన్ అవుతుంది):
                  </label>
                  <select
                    value={importDefaultTeacher}
                    onChange={(e) => setImportDefaultTeacher(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-500 transition"
                  >
                    <option value="">-- Self / Excel లో పేర్కొన్న ఉపాధ్యాయులు --</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Data Preview Table (First 5 Rows) */}
              {parsedRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">
                      డేటా ప్రివ్యూ (మొదటి {Math.min(5, parsedRows.length)} / {parsedRows.length} వరుసలు)
                    </span>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm max-h-48">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-bold uppercase sticky top-0 border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">#</th>
                          <th className="p-2.5">Student Name</th>
                          <th className="p-2.5">Father Name</th>
                          <th className="p-2.5">Village</th>
                          <th className="p-2.5">Mandal</th>
                          <th className="p-2.5">Mobile No</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-700">
                        {parsedRows.slice(0, 5).map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold text-slate-400">{idx + 1}</td>
                            <td className="p-2.5 font-bold text-slate-900">{row.studentName}</td>
                            <td className="p-2.5">{row.fatherName || '-'}</td>
                            <td className="p-2.5">{row.village}</td>
                            <td className="p-2.5">{row.mandal}</td>
                            <td className="p-2.5 font-mono">{row.mobileNo || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {importError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm font-semibold">
                  <AlertCircle size={20} className="flex-shrink-0 text-red-500" />
                  <span>{importError}</span>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex justify-end items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                  setParsedRows([]);
                  setImportError('');
                }}
                className="px-5 py-2.5 rounded-xl text-slate-600 font-bold border border-slate-200 hover:bg-slate-100 transition text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!importFile || parsedRows.length === 0 || importLoading}
                onClick={handleImportSubmit}
                className={`flex items-center gap-2 px-7 py-2.5 rounded-xl text-white font-extrabold shadow-md transition text-sm cursor-pointer ${
                  !importFile || parsedRows.length === 0 || importLoading
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-indigo-200 active:scale-95'
                }`}
              >
                {importLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Check size={16} />
                )}
                {importLoading ? 'అప్‌లోడ్ చేస్తోంది...' : `అన్నీ దిగుమతి చేయండి (${parsedRows.length})`}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default AddressCollectionTeacherPage;
