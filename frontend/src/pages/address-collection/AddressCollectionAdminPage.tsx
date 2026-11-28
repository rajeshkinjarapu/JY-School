import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import {
  Download, Search, FileText, Plus, X, User, MapPin, Phone,
  Navigation, CheckCircle2, Trash2, Users, Building2, Award,
  Filter, RotateCcw
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';
import { PageHeader } from '../../components/UI/PageHeader';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';

interface AddressCollection {
  id: string;
  studentName: string;
  fatherName: string;
  village: string;
  mandal: string;
  mobileNo: string;
  alternateMobileNo: string | null;
  referenceTeacherName: string;
  createdAt: string;
}

const extractArray = <T = any>(res: any): T[] => {
  const payload = res?.data ?? res;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const AddressCollectionAdminPage: React.FC = () => {
  const [data, setData] = useState<AddressCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [selectedMandal, setSelectedMandal] = useState<string>('');
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([]);

  // Data Entry Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    studentName: '',
    fatherName: '',
    village: '',
    mandal: '',
    mobileNo: '',
    alternateMobileNo: '',
    referenceTeacherId: '',
  });
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchTeachers = async () => {
    try {
      const response: any = await api.get('/api/teachers', { params: { limit: 500 } });
      const list = extractArray(response);
      setTeachers(
        list.map((t: any) => ({
          id: t.id,
          name: t.user?.name || 'Unknown',
        }))
      );
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const fetchData = async () => {
    try {
      const response: any = await api.get('/api/address-collection');
      setData(extractArray<AddressCollection>(response));
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error(error?.response?.data?.message || 'Failed to load address data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchTeachers();
  }, []);

  // Analytics & Dashboard KPIs
  const analytics = useMemo(() => {
    const villageCounts: Record<string, number> = {};
    const mandalCounts: Record<string, number> = {};
    const teacherCounts: Record<string, number> = {};

    const todayStr = new Date().toDateString();
    let addedToday = 0;

    data.forEach((item) => {
      const v = (item.village || '').trim().toUpperCase();
      if (v && v !== '-') villageCounts[v] = (villageCounts[v] || 0) + 1;

      const m = (item.mandal || '').trim().toUpperCase();
      if (m && m !== '-') mandalCounts[m] = (mandalCounts[m] || 0) + 1;

      const t = (item.referenceTeacherName || '').trim();
      if (t && t !== 'Unknown') teacherCounts[t] = (teacherCounts[t] || 0) + 1;

      if (item.createdAt && new Date(item.createdAt).toDateString() === todayStr) {
        addedToday++;
      }
    });

    const topTeachers = Object.entries(teacherCounts)
      .sort((a, b) => b[1] - a[1]);

    const uniqueMandals = Object.keys(mandalCounts).sort();
    const uniqueTeacherNames = Array.from(
      new Set(data.map((i) => i.referenceTeacherName).filter((n) => n && n !== 'Unknown'))
    ).sort();

    return {
      totalEntries: data.length,
      addedToday,
      uniqueVillageCount: Object.keys(villageCounts).length,
      uniqueMandalCount: uniqueMandals.length,
      uniqueMandals,
      uniqueTeacherNames,
      activeTeachersCount: Object.keys(teacherCounts).length,
      topTeacher: topTeachers[0] || null,
    };
  }, [data]);

  const filteredData = useMemo(() => {
    const s = searchTerm.toLowerCase().trim();
    return data.filter((item) => {
      const matchesSearch =
        !s ||
        (item.studentName || '').toLowerCase().includes(s) ||
        (item.fatherName || '').toLowerCase().includes(s) ||
        (item.village || '').toLowerCase().includes(s) ||
        (item.mandal || '').toLowerCase().includes(s) ||
        (item.mobileNo || '').includes(s) ||
        (item.referenceTeacherName || '').toLowerCase().includes(s);

      const matchesTeacher = !selectedTeacher || item.referenceTeacherName === selectedTeacher;
      const matchesMandal =
        !selectedMandal || (item.mandal || '').trim().toUpperCase() === selectedMandal;

      return matchesSearch && matchesTeacher && matchesMandal;
    });
  }, [data, searchTerm, selectedTeacher, selectedMandal]);

  const hasActiveFilters = Boolean(searchTerm || selectedTeacher || selectedMandal);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedTeacher('');
    setSelectedMandal('');
  };

  const exportToExcel = () => {
    const exportData = filteredData.map((item, index) => ({
      'S.No': index + 1,
      'Student Name': item.studentName || '-',
      'Father Name': item.fatherName || '-',
      'Village': item.village || '-',
      'Mandal': item.mandal || '-',
      'Mobile No': item.mobileNo,
      'Alternate Mobile No': item.alternateMobileNo || '-',
      'Reference Teacher': item.referenceTeacherName || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students Data');
    XLSX.writeFile(workbook, 'Student_Address_Collection.xlsx');
    toast.success('Excel exported successfully!');
  };

  const exportToPDF = () => {
    const doc = new jsPDF('landscape', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('SRI VENKATESWARA JY HIGH SCHOOL', pageWidth / 2, 13, { align: 'center' });

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(91, 33, 182);
    doc.text('STUDENT ADDRESS COLLECTION REPORT', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    const filterInfo = [
      `Total Records: ${filteredData.length}`,
      selectedTeacher ? `Ref Teacher: ${selectedTeacher}` : null,
      selectedMandal ? `Mandal: ${selectedMandal}` : null,
    ]
      .filter(Boolean)
      .join('   |   ');
    doc.text(filterInfo, pageWidth / 2, 25.5, { align: 'center' });

    const tableColumn = ['S.No', 'Student Name', 'Father Name', 'Village', 'Mandal', 'Mobile No', 'Alt Mobile', 'Ref Teacher'];

    const rowsPerPage = 15;
    const paddedData = [...filteredData];
    const remainder = paddedData.length % rowsPerPage;
    if (remainder !== 0 || paddedData.length === 0) {
      const rowsToAdd = paddedData.length === 0 ? rowsPerPage : rowsPerPage - remainder;
      for (let i = 0; i < rowsToAdd; i++) {
        paddedData.push({} as any);
      }
    }

    const tableRows = paddedData.map((item, index) => {
      if (!item.id && !item.mobileNo) {
        return [index < filteredData.length ? index + 1 : '', '', '', '', '', '', '', ''];
      }
      return [
        index + 1,
        item.studentName || '-',
        item.fatherName || '-',
        item.village || '-',
        item.mandal || '-',
        item.mobileNo,
        item.alternateMobileNo || '-',
        item.referenceTeacherName || '-',
      ];
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 29,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 2.8,
        minCellHeight: 10.2,
        valign: 'middle',
        lineColor: [226, 232, 240],
        lineWidth: 0.15,
      },
      headStyles: {
        fillColor: [91, 33, 182],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center',
      },
      alternateRowStyles: {
        fillColor: [250, 249, 255],
      },
      columnStyles: {
        0: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 46, fontStyle: 'bold' },
        2: { cellWidth: 40 },
        3: { cellWidth: 35 },
        4: { cellWidth: 34 },
        5: { cellWidth: 30, halign: 'center' },
        6: { cellWidth: 30, halign: 'center' },
        7: { cellWidth: 42 },
      },
      margin: { top: 15, bottom: 15, left: 13, right: 13 },
      didDrawPage: (d: any) => {
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(`JY School ERP Portal • Page ${d.pageNumber}`, pageWidth / 2, 200, { align: 'center' });
      },
    });

    doc.save('Student_Address_Collection.pdf');
    toast.success('PDF exported successfully!');
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.name === 'referenceTeacherId' ? e.target.value : e.target.value.toUpperCase();
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.mobileNo || !formData.mobileNo.trim()) {
      toast.error('Please enter Mobile Number');
      return;
    }
    setSubmitLoading(true);
    try {
      await api.post('/api/address-collection', formData);
      toast.success('Student address saved successfully!');
      setShowAddModal(false);
      setFormData({
        studentName: '',
        fatherName: '',
        village: '',
        mandal: '',
        mobileNo: '',
        alternateMobileNo: '',
        referenceTeacherId: '',
      });
      fetchData();
    } catch (error: any) {
      console.error('Error submitting form:', error);
      toast.error(error?.response?.data?.message || 'Failed to save student details');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await api.delete(`/api/address-collection/${id}`);
      toast.success('Record deleted');
      fetchData();
    } catch (error: any) {
      console.error('Error deleting record:', error);
      toast.error(error?.response?.data?.message || 'Failed to delete record.');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F4F7FC] text-slate-800 overflow-hidden">
      <PageHeader
        title="Address Collection & Survey"
        icon={<MapPin className="w-5 h-5 text-white" />}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={exportToPDF}
              className="px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/25 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>
            <button
              type="button"
              onClick={exportToExcel}
              className="px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/25 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-4 py-1.5 rounded-xl bg-white hover:bg-indigo-50 text-[#1E1B4B] text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#5B21B6]" />
              <span>Add Entry</span>
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="w-full max-w-7xl mx-auto space-y-5 pb-10">

          {/* 4 Dashboard Glossy Pastel KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="relative overflow-hidden rounded-[20px] px-4 py-4 border bg-gradient-to-br from-[#EAF2FF] to-[#CBE0FF] border-[#B6D2FF] shadow-[0_6px_18px_-6px_rgba(15,23,42,0.10)]">
              <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/55 to-transparent pointer-events-none rounded-t-[20px]" />
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] flex items-center justify-center text-white shadow-md shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">Total Survey Leads</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-black text-slate-900 leading-tight">{analytics.totalEntries}</p>
                    {analytics.addedToday > 0 && (
                      <span className="text-[10px] font-extrabold text-blue-700 bg-white/75 px-1.5 py-0.5 rounded-full">
                        +{analytics.addedToday} today
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[20px] px-4 py-4 border bg-gradient-to-br from-[#E5FAEF] to-[#C2F2D9] border-[#ACEAD0] shadow-[0_6px_18px_-6px_rgba(15,23,42,0.10)]">
              <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/55 to-transparent pointer-events-none rounded-t-[20px]" />
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center text-white shadow-md shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">Unique Villages</p>
                  <p className="text-2xl font-black text-[#065F46] leading-tight">{analytics.uniqueVillageCount}</p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[20px] px-4 py-4 border bg-gradient-to-br from-[#F2EDFF] to-[#DDD2FF] border-[#CEC0FF] shadow-[0_6px_18px_-6px_rgba(15,23,42,0.10)]">
              <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/55 to-transparent pointer-events-none rounded-t-[20px]" />
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] flex items-center justify-center text-white shadow-md shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">Mandals Covered</p>
                  <p className="text-2xl font-black text-[#4C1D95] leading-tight">{analytics.uniqueMandalCount}</p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[20px] px-4 py-4 border bg-gradient-to-br from-[#FFF6E5] to-[#FFE4B8] border-[#FAD79B] shadow-[0_6px_18px_-6px_rgba(15,23,42,0.10)]">
              <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/55 to-transparent pointer-events-none rounded-t-[20px]" />
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F59E0B] to-[#D97706] flex items-center justify-center text-white shadow-md shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">
                    Top Staff ({analytics.activeTeachersCount} Active)
                  </p>
                  <p className="text-sm font-black text-[#9A3412] truncate leading-tight mt-0.5">
                    {analytics.topTeacher ? `${analytics.topTeacher[0]} (${analytics.topTeacher[1]})` : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Search & Multi-Filter Toolbar */}
          <div className="bg-white border border-indigo-100/80 rounded-[18px] p-3.5 shadow-[0_6px_22px_-6px_rgba(91,33,182,0.08)] flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-indigo-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by Student, Father, Village, Mandal, Mobile..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#F8FAFF] border border-indigo-100 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl px-3 py-2">
                <Filter className="w-3.5 h-3.5 text-[#5B21B6]" />
                <select
                  value={selectedMandal}
                  onChange={(e) => setSelectedMandal(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="">All Mandals</option>
                  {analytics.uniqueMandals.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl px-3 py-2">
                <Users className="w-3.5 h-3.5 text-[#5B21B6]" />
                <select
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer max-w-[190px]"
                >
                  <option value="">All Reference Teachers</option>
                  {analytics.uniqueTeacherNames.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-extrabold flex items-center gap-1 cursor-pointer transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Signature Purple Header Directory Table */}
          <div className="bg-white border border-[#DDD7F3] rounded-[20px] overflow-hidden shadow-[0_12px_32px_-6px_rgba(91,33,182,0.10)]">
            <div className="px-5 py-3 border-b border-indigo-100/80 bg-[#FAF9FF] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#5B21B6]" />
                <h3 className="text-xs font-black uppercase tracking-wider text-[#1E1B4B]">
                  Student Address Directory
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-500">
                Showing <strong className="text-[#1E1B4B]">{filteredData.length}</strong> of {data.length} records
              </span>
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center">
                <LoadingSpinner size="lg" />
                <p className="text-xs font-bold text-slate-400 mt-3 uppercase tracking-wider">Loading address records...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs student-grid-table">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#7D3CEF] via-[#6D38EA] to-[#5B21B6] !text-white font-extrabold uppercase text-[11px] tracking-wider">
                      <th className="py-3.5 px-3 w-12 text-center border-r border-white/20 !text-white">#</th>
                      <th className="py-3.5 px-4 text-left border-r border-white/20 !text-white">Student Name</th>
                      <th className="py-3.5 px-4 text-left border-r border-white/20 !text-white">Father Name</th>
                      <th className="py-3.5 px-4 text-left border-r border-white/20 !text-white">Village</th>
                      <th className="py-3.5 px-4 text-left border-r border-white/20 !text-white">Mandal</th>
                      <th className="py-3.5 px-4 text-center border-r border-white/20 !text-white">Mobile No</th>
                      <th className="py-3.5 px-4 text-center border-r border-white/20 !text-white">Ref Teacher</th>
                      <th className="py-3.5 px-3 text-center w-20 !text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((item, idx) => {
                      const rowBorderBottom = idx === filteredData.length - 1 ? '' : 'border-b border-[#EAE7F6]';
                      const refTeacher = item.referenceTeacherName && item.referenceTeacherName !== 'Unknown'
                        ? item.referenceTeacherName
                        : null;

                      return (
                        <tr
                          key={item.id}
                          className="even:bg-[#FAF9FF] hover:bg-[#F3EFFE]/60 transition-colors bg-white"
                        >
                          <td className={`py-3 px-3 text-center font-bold text-[#1E1B4B] border-r border-[#EAE7F6] ${rowBorderBottom}`}>
                            {idx + 1}
                          </td>
                          <td className={`py-3 px-4 font-extrabold text-[#1E1B4B] border-r border-[#EAE7F6] ${rowBorderBottom}`}>
                            {item.studentName || <span className="text-slate-400 font-medium">—</span>}
                          </td>
                          <td className={`py-3 px-4 font-semibold text-slate-600 border-r border-[#EAE7F6] ${rowBorderBottom}`}>
                            {item.fatherName || <span className="text-slate-400">—</span>}
                          </td>
                          <td className={`py-3 px-4 border-r border-[#EAE7F6] ${rowBorderBottom}`}>
                            {item.village ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]">
                                {item.village}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className={`py-3 px-4 font-bold text-slate-700 border-r border-[#EAE7F6] ${rowBorderBottom}`}>
                            {item.mandal || <span className="text-slate-400">—</span>}
                          </td>
                          <td className={`py-3 px-4 text-center border-r border-[#EAE7F6] whitespace-nowrap ${rowBorderBottom}`}>
                            <a
                              href={`tel:${item.mobileNo}`}
                              className="font-mono font-extrabold text-[#1E1B4B] hover:text-[#5B21B6]"
                            >
                              {item.mobileNo}
                            </a>
                            {item.alternateMobileNo && (
                              <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                                {item.alternateMobileNo}
                              </div>
                            )}
                          </td>
                          <td className={`py-3 px-4 text-center border-r border-[#EAE7F6] ${rowBorderBottom}`}>
                            {refTeacher ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold bg-[#EFEAFE] text-[#5B21B6] border border-[#DDD6FE]">
                                {refTeacher}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-slate-100 text-slate-500">
                                Unknown
                              </span>
                            )}
                          </td>
                          <td className={`py-3 px-3 text-center ${rowBorderBottom}`}>
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                              title="Delete Entry"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredData.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-6 py-14 text-center">
                          <Search className="w-10 h-10 mx-auto text-indigo-200 mb-3" />
                          <p className="text-sm font-black text-[#1E1B4B]">No matching address records found</p>
                          <p className="text-xs text-slate-500 mt-1">
                            Try adjusting your search query or click "Add Entry" to create a new record.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Add New Entry Modal (Clean Light Theme) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/35 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-[24px] w-full max-w-3xl shadow-2xl overflow-hidden border border-[#DDD7F3]">
            <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-[#F2EDFF] to-[#EAF2FF] border-b border-indigo-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5B21B6] to-[#7C3AED] text-white flex items-center justify-center shadow-sm">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-[#1E1B4B]">Add Student Survey Details</h2>
                  <p className="text-[11px] font-semibold text-slate-500">Enter student contact &amp; village address information</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-white/80 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-extrabold text-[#5B21B6] uppercase tracking-wider mb-1.5">
                    Student Name <span className="text-slate-400 font-medium lowercase">(optional)</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 text-indigo-400 w-4 h-4" />
                    <input
                      type="text"
                      name="studentName"
                      value={formData.studentName}
                      onChange={handleFormChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      placeholder="Enter student full name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-[#5B21B6] uppercase tracking-wider mb-1.5">
                    Father Name <span className="text-slate-400 font-medium lowercase">(optional)</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 text-indigo-400 w-4 h-4" />
                    <input
                      type="text"
                      name="fatherName"
                      value={formData.fatherName}
                      onChange={handleFormChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      placeholder="Enter father's name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-[#5B21B6] uppercase tracking-wider mb-1.5">
                    Village / Town <span className="text-slate-400 font-medium lowercase">(optional)</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3 text-indigo-400 w-4 h-4" />
                    <input
                      type="text"
                      name="village"
                      value={formData.village}
                      onChange={handleFormChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      placeholder="Village / Town"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-[#5B21B6] uppercase tracking-wider mb-1.5">
                    Mandal <span className="text-slate-400 font-medium lowercase">(optional)</span>
                  </label>
                  <div className="relative">
                    <Navigation className="absolute left-3.5 top-3 text-indigo-400 w-4 h-4" />
                    <input
                      type="text"
                      name="mandal"
                      value={formData.mandal}
                      onChange={handleFormChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      placeholder="Mandal"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-[#5B21B6] uppercase tracking-wider mb-1.5">
                    Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 text-indigo-400 w-4 h-4" />
                    <input
                      type="tel"
                      name="mobileNo"
                      value={formData.mobileNo}
                      onChange={handleFormChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      placeholder="10 digit mobile no"
                      maxLength={10}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-[#5B21B6] uppercase tracking-wider mb-1.5">
                    Alternate Mobile <span className="text-slate-400 font-medium lowercase">(optional)</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 text-indigo-400 w-4 h-4" />
                    <input
                      type="tel"
                      name="alternateMobileNo"
                      value={formData.alternateMobileNo}
                      onChange={handleFormChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      placeholder="Alternate number"
                      maxLength={10}
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-extrabold text-[#5B21B6] uppercase tracking-wider mb-1.5">
                    Reference Teacher <span className="text-slate-400 font-medium lowercase">(optional)</span>
                  </label>
                  <select
                    name="referenceTeacherId"
                    value={formData.referenceTeacherId}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 cursor-pointer"
                  >
                    <option value="">-- Select Reference Teacher --</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-indigo-50 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-[#5B21B6] to-[#7C3AED] hover:opacity-95 shadow-md transition disabled:opacity-60 cursor-pointer"
                >
                  {submitLoading ? <LoadingSpinner size="sm" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{submitLoading ? 'Saving...' : 'Save Details'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressCollectionAdminPage;
