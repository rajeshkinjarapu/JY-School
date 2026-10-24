import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Download, Search, FileText, Plus, X, User, MapPin, Phone, Navigation, CheckCircle, Trash, Upload, FileSpreadsheet, AlertCircle, Check, Pencil } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AddressCollection {
  id: string;
  studentName: string;
  className?: string | null;
  fatherName: string;
  village: string;
  mandal: string;
  mobileNo: string;
  alternateMobileNo: string | null;
  referenceTeacherName: string;
  referenceTeacherId?: string | null;
  createdAt: string;
}

const AddressCollectionAdminPage = () => {
  const [data, setData] = useState<AddressCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [teachers, setTeachers] = useState<{id: string, name: string}[]>([]);
  const [schoolClasses, setSchoolClasses] = useState<string[]>([]);
  
  // Data Entry / Edit Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<AddressCollection | null>(null);
  const [formData, setFormData] = useState({
    studentName: '',
    className: '',
    fatherName: '',
    village: '',
    mandal: '',
    mobileNo: '',
    alternateMobileNo: '',
    referenceTeacherId: ''
  });
  const [submitLoading, setSubmitLoading] = useState(false);

  // Excel Import States
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [importDefaultTeacher, setImportDefaultTeacher] = useState<string>('');
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
    fetchTeachers();
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await axios.get('http://66.116.252.191:19998/api/classes?limit=1000', {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      if (response.data.success && Array.isArray(response.data.data)) {
        const unique = Array.from(new Set(response.data.data.map((c: any) => c.name).filter(Boolean))) as string[];
        setSchoolClasses(unique);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

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

  const fetchData = async () => {
    try {
      const response = await axios.get('http://66.116.252.191:19998/api/address-collection', {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      const backendError = error.response?.data?.error || error.response?.data?.message || error.message;
      alert(`Failed to fetch data: ${backendError}`);
    } finally {
      setLoading(false);
    }
  };

  const uniqueTeachers = Array.from(new Set(data.map(item => item.referenceTeacherName))).filter(Boolean).sort();
  
  const standardClasses = [
    'Nursery', 'LKG', 'UKG',
    '1st Class', '2nd Class', '3rd Class', '4th Class', '5th Class',
    '6th Class', '7th Class', '8th Class', '9th Class', '10th Class'
  ];
  const uniqueClasses = Array.from(new Set([
    ...standardClasses,
    ...schoolClasses,
    ...data.map(item => item.className).filter(Boolean) as string[]
  ])).filter(Boolean);

  const filteredData = data.filter(item => {
    const matchesSearch = item.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (item.className && item.className.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          item.village.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.mandal.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTeacher = selectedTeacher === '' || item.referenceTeacherName === selectedTeacher;
    const matchesClass = selectedClass === '' || item.className === selectedClass;
    return matchesSearch && matchesTeacher && matchesClass;
  });

  const exportToExcel = () => {
    const exportData = filteredData.map((item, index) => ({
      'S.No': index + 1,
      'Student Name': item.studentName,
      'Class': item.className || '-',
      'Father Name': item.fatherName,
      'Village': item.village,
      'Mandal': item.mandal,
      'Mobile No': item.mobileNo,
      'Alternate Mobile No': item.alternateMobileNo || '-',
      'Reference Teacher': item.referenceTeacherName
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students Data');
    XLSX.writeFile(workbook, 'Student_Address_Collection.xlsx');
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.name === 'referenceTeacherId' ? e.target.value : e.target.value.toUpperCase();
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleEdit = (item: AddressCollection) => {
    let refTeacherId = item.referenceTeacherId || '';
    if (!refTeacherId && item.referenceTeacherName) {
      const match = teachers.find(t => t.name.toLowerCase() === item.referenceTeacherName.toLowerCase());
      if (match) refTeacherId = match.id;
    }

    setFormData({
      studentName: item.studentName,
      className: item.className || '',
      fatherName: item.fatherName,
      village: item.village,
      mandal: item.mandal,
      mobileNo: item.mobileNo,
      alternateMobileNo: item.alternateMobileNo || '',
      referenceTeacherId: refTeacherId
    });
    setEditingItem(item);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingItem(null);
    setFormData({
      studentName: '',
      className: '',
      fatherName: '',
      village: '',
      mandal: '',
      mobileNo: '',
      alternateMobileNo: '',
      referenceTeacherId: ''
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentName || !formData.fatherName || !formData.village || !formData.mandal || !formData.mobileNo) {
      alert('Please fill all required fields');
      return;
    }
    setSubmitLoading(true);
    try {
      if (editingItem) {
        const response = await axios.put(`http://66.116.252.191:19998/api/address-collection/${editingItem.id}`, formData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
        });
        if (response.data.success) {
          handleCloseModal();
          fetchData(); // Refresh the list
        }
      } else {
        const response = await axios.post('http://66.116.252.191:19998/api/address-collection', formData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
        });
        if (response.data.success) {
          handleCloseModal();
          fetchData(); // Refresh the list
        }
      }
    } catch (error: any) {
      console.error('Error submitting form:', error);
      const backendError = error.response?.data?.error || error.response?.data?.message || error.message;
      alert(`Failed to submit data: ${backendError}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      const response = await axios.delete(`http://66.116.252.191:19998/api/address-collection/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      if (response.data.success) {
        fetchData(); // Refresh the list
      }
    } catch (error: any) {
      console.error('Error deleting record:', error);
      alert('Failed to delete record.');
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF('landscape', 'mm', 'a4');
    
    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('JY SCHOOL', 148.5, 15, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Student Address Collection Report', 148.5, 22, { align: 'center' });

    let subHeader = [];
    if (selectedClass) subHeader.push(`Class: ${selectedClass}`);
    if (selectedTeacher) subHeader.push(`Ref Teacher: ${selectedTeacher}`);
    if (subHeader.length > 0) {
      doc.setFontSize(10);
      doc.text(subHeader.join('   |   '), 148.5, 28, { align: 'center' });
    }

    const tableColumn = ['S.No', 'Student Name', 'Class', 'Father Name', 'Village', 'Mandal', 'Mobile No', 'Alt Mobile', 'Ref Teacher'];
    
    // Pad data to exact multiples of 15 for perfect layout
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
      if (!item.studentName) {
        // Empty padded row
        return [index < filteredData.length ? index + 1 : '', '', '', '', '', '', '', '', ''];
      }
      return [
        index + 1,
        item.studentName,
        item.className || '-',
        item.fatherName,
        item.village,
        item.mandal,
        item.mobileNo,
        item.alternateMobileNo || '-',
        item.referenceTeacherName
      ];
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: subHeader.length > 0 ? 32 : 28,
      theme: 'grid',
      styles: { 
        fontSize: 9,
        cellPadding: 3,
        minCellHeight: 10.5, // Specifically chosen to fit 15 rows comfortably on A4 Landscape
        valign: 'middle',
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [46, 42, 102], // Premium JY School Purple
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 40 },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 38 },
        4: { cellWidth: 32 },
        5: { cellWidth: 32 },
        6: { cellWidth: 28, halign: 'center' },
        7: { cellWidth: 28, halign: 'center' },
        8: { cellWidth: 36 }
      },
      margin: { top: 15, bottom: 15, left: 13, right: 13 },
      didDrawPage: function (data: any) {
        // Footer with page number
        doc.setFontSize(8);
        doc.text(
          `Page ${data.pageNumber}`,
          148.5,
          200,
          { align: 'center' }
        );
      }
    });

    doc.save('Student_Address_Collection.pdf');
  };

  const downloadSampleTemplate = () => {
    const templateData = [
      {
        'Student Name': 'K. SAI KUMAR',
        'Class': '10th Class',
        'Father Name': 'K. RAMA RAO',
        'Village': 'NARASANNAPETA',
        'Mandal': 'NARASANNAPETA',
        'Mobile No': '9876543210',
        'Alternate Mobile No': '9123456780',
        'Reference Teacher': teachers[0]?.name || 'RAMESH'
      },
      {
        'Student Name': 'P. ANITHA',
        'Class': '9th Class',
        'Father Name': 'P. VENKATA RAO',
        'Village': 'JALUMURU',
        'Mandal': 'JALUMURU',
        'Mobile No': '8765432109',
        'Alternate Mobile No': '',
        'Reference Teacher': teachers[1]?.name || 'SURESH'
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
            else if (cleanKey.includes('class') || cleanKey.includes('grade') || cleanKey.includes('standard')) normRow.className = String(val).trim();
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
        alert(`✅ Successfully imported ${response.data.count} student address records!`);
        setShowImportModal(false);
        setImportFile(null);
        setParsedRows([]);
        setImportDefaultTeacher('');
        fetchData(); // refresh list
      }
    } catch (err: any) {
      console.error('Import error:', err);
      setImportError(err.response?.data?.message || err.message || 'Import failed.');
    } finally {
      setImportLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Student Address Collection (Admin)</h1>
        <div className="flex gap-4 flex-wrap">
          <button 
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg transition shadow-sm font-semibold active:scale-95"
          >
            <Upload size={18} />
            Upload Excel
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            <Plus size={18} />
            Add New Data
          </button>
          <button 
            onClick={exportToPDF}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition font-semibold"
          >
            <FileText size={18} />
            Export PDF
          </button>
          <button 
            onClick={exportToExcel}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-semibold"
          >
            <Download size={18} />
            Export Excel
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by Student, Class, Village, or Mandal..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="md:w-56">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium text-gray-700"
          >
            <option value="">All Classes</option>
            {uniqueClasses.map((cls, idx) => (
              <option key={idx} value={cls}>{cls}</option>
            ))}
          </select>
        </div>
        <div className="md:w-64">
          <select
            value={selectedTeacher}
            onChange={(e) => setSelectedTeacher(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium text-gray-700"
          >
            <option value="">All Teachers</option>
            {uniqueTeachers.map((teacher, idx) => (
              <option key={idx} value={teacher}>{teacher}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#f8fafc] border-b border-gray-100">
              <tr className="text-gray-600 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-bold rounded-tl-xl text-gray-700">S.No</th>
                <th className="px-6 py-4 font-bold text-gray-700">Student Name</th>
                <th className="px-6 py-4 font-bold text-gray-700">Class</th>
                <th className="px-6 py-4 font-bold text-gray-700">Father Name</th>
                <th className="px-6 py-4 font-bold text-gray-700">Village</th>
                <th className="px-6 py-4 font-bold text-gray-700">Mandal</th>
                <th className="px-6 py-4 font-bold text-center text-gray-700">Mobile No</th>
                <th className="px-6 py-4 font-bold text-center text-gray-700">Ref Teacher</th>
                <th className="px-6 py-4 font-bold text-center rounded-tr-xl text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredData.map((item, index) => (
                <tr key={item.id} className="hover:bg-blue-50/50 transition-colors duration-200 group">
                  <td className="px-6 py-4 text-sm text-gray-500">{index + 1}</td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">{item.studentName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {item.className || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.fatherName}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                      {item.village}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.mandal}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="text-sm font-medium text-gray-800">{item.mobileNo}</div>
                    {item.alternateMobileNo && (
                      <div className="text-xs text-gray-500 mt-1">{item.alternateMobileNo}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                      item.referenceTeacherName === 'Unknown' || !item.referenceTeacherName
                        ? 'bg-gray-100 text-gray-600 border-gray-200' 
                        : 'bg-purple-100 text-purple-800 border-purple-200'
                    }`}>
                      {item.referenceTeacherName || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors cursor-pointer"
                        title="Edit Entry"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                        title="Delete Entry"
                      >
                        <Trash size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <Search size={48} className="mb-4 text-gray-300" />
                      <p className="text-lg font-medium text-gray-500">No data found</p>
                      <p className="text-sm mt-1">Try adjusting your search filters or add new data.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Data Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                {editingItem ? <Pencil size={24} className="text-blue-600" /> : <User size={24} className="text-blue-600" />}
                {editingItem ? 'Edit Student Details' : 'Add Student Details'}
              </h2>
              <button 
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Student Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                      type="text"
                      name="studentName"
                      value={formData.studentName}
                      onChange={handleFormChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter student full name"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Class / Grade <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="className"
                      list="admin-class-options"
                      value={formData.className}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Select or enter Class (e.g. 10th Class)"
                    />
                    <datalist id="admin-class-options">
                      {uniqueClasses.map((cls, idx) => (
                        <option key={idx} value={cls} />
                      ))}
                    </datalist>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Father Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                      type="text"
                      name="fatherName"
                      value={formData.fatherName}
                      onChange={handleFormChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter father's name"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Village <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                      type="text"
                      name="village"
                      value={formData.village}
                      onChange={handleFormChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Village / Town"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mandal <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Navigation className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                      type="text"
                      name="mandal"
                      value={formData.mandal}
                      onChange={handleFormChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Mandal"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                      type="tel"
                      name="mobileNo"
                      value={formData.mobileNo}
                      onChange={handleFormChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="10 digit mobile no"
                      maxLength={10}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alternate Mobile <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                      type="tel"
                      name="alternateMobileNo"
                      value={formData.alternateMobileNo}
                      onChange={handleFormChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Alternate number"
                      maxLength={10}
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reference Teacher <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <select
                    name="referenceTeacherId"
                    value={formData.referenceTeacherId}
                    onChange={(e: any) => handleFormChange(e)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">-- Select Reference Teacher --</option>
                    {teachers.map(teacher => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2.5 rounded-xl text-gray-600 font-medium border border-gray-200 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-medium shadow-md transition ${
                    submitLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
                  }`}
                >
                  {submitLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <CheckCircle size={20} />
                  )}
                  {submitLoading ? 'Saving...' : editingItem ? 'Update Details' : 'Save Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Excel Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-indigo-50/30">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
                  <FileSpreadsheet size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800">
                    Upload Student Addresses via Excel
                  </h2>
                  <p className="text-xs font-semibold text-slate-500">
                    Upload .xlsx, .xls, or .csv file to bulk import all student addresses at once
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                  setParsedRows([]);
                  setImportError('');
                }}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition"
              >
                <X size={22} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              
              {/* Template Download Banner */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-600 text-white rounded-lg">
                    <FileSpreadsheet size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-emerald-950">Excel Column Template</h4>
                    <p className="text-xs text-emerald-700 font-medium">Use our official template with columns: Student Name, Father Name, Village, Mandal, Mobile No, Ref Teacher</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={downloadSampleTemplate}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm whitespace-nowrap active:scale-95"
                >
                  <Download size={15} />
                  Download Sample Template
                </button>
              </div>

              {/* Upload Dropzone */}
              {!importFile ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-indigo-50/20 hover:bg-indigo-50/50 rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 group"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="p-4 bg-white rounded-2xl shadow-sm text-indigo-600 group-hover:scale-110 transition">
                    <Upload size={32} />
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-700 text-sm block">Click to Browse or Drag & Drop Excel File</span>
                    <span className="text-xs text-slate-400 font-medium">Supports .XLSX, .XLS, or .CSV</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* File Info Bar */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-indigo-600 text-white rounded-xl">
                        <FileSpreadsheet size={22} />
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-800 text-sm block">{importFile.name}</span>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          ✓ {parsedRows.length} Valid Records Ready to Import
                        </span>
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
                      className="text-xs text-red-600 hover:text-red-800 font-bold px-3 py-1.5 rounded-lg hover:bg-red-50 border border-red-200 transition"
                    >
                      Change File
                    </button>
                  </div>

                  {/* Optional Default Teacher Selector */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                      Default Reference Teacher (Optional)
                    </label>
                    <p className="text-xs text-slate-500 font-medium">
                      If an Excel row doesn't have a teacher name, this teacher will be assigned automatically.
                    </p>
                    <select
                      value={importDefaultTeacher}
                      onChange={(e) => setImportDefaultTeacher(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-semibold text-slate-800 text-sm"
                    >
                      <option value="">-- Auto-detect from Excel / No Default --</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Preview Table (First 5 Rows) */}
                  <div>
                    <div className="flex justify-between items-center mb-2 px-1">
                      <span className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">
                        Data Preview (First {Math.min(5, parsedRows.length)} of {parsedRows.length} rows)
                      </span>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                          <tr>
                            <th className="p-3">#</th>
                            <th className="p-3">Student Name</th>
                            <th className="p-3">Class</th>
                            <th className="p-3">Father Name</th>
                            <th className="p-3">Village</th>
                            <th className="p-3">Mandal</th>
                            <th className="p-3">Mobile No</th>
                            <th className="p-3">Teacher</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-700">
                          {parsedRows.slice(0, 5).map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/80">
                              <td className="p-3 font-bold text-slate-500">{idx + 1}</td>
                              <td className="p-3 font-bold text-slate-900">{row.studentName}</td>
                              <td className="p-3">
                                <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[11px] font-bold border border-blue-200">
                                  {row.className || '-'}
                                </span>
                              </td>
                              <td className="p-3">{row.fatherName || '-'}</td>
                              <td className="p-3">{row.village}</td>
                              <td className="p-3">{row.mandal}</td>
                              <td className="p-3 font-mono">{row.mobileNo || '-'}</td>
                              <td className="p-3 text-indigo-600 font-semibold">{row.referenceTeacherName || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                  setParsedRows([]);
                  setImportError('');
                }}
                className="px-6 py-2.5 rounded-xl text-slate-600 font-bold border border-slate-200 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!importFile || parsedRows.length === 0 || importLoading}
                onClick={handleImportSubmit}
                className={`flex items-center gap-2 px-8 py-2.5 rounded-xl text-white font-extrabold shadow-md transition ${
                  !importFile || parsedRows.length === 0 || importLoading
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-indigo-200 active:scale-95'
                }`}
              >
                {importLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Check size={18} />
                )}
                {importLoading ? 'Importing Data...' : `Import All ${parsedRows.length} Records`}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default AddressCollectionAdminPage;
