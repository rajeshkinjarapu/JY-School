import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Download, Search, FileText, Plus, X, User, MapPin, Phone, Navigation, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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

const AddressCollectionAdminPage = () => {
  const [data, setData] = useState<AddressCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [teachers, setTeachers] = useState<{id: string, name: string}[]>([]);
  
  // Data Entry Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    studentName: '',
    fatherName: '',
    village: '',
    mandal: '',
    mobileNo: '',
    alternateMobileNo: '',
    referenceTeacherId: ''
  });
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    fetchData();
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const response = await axios.get('http://66.116.252.191:19998/api/teachers', {
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

  const filteredData = data.filter(item => {
    const matchesSearch = item.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.village.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.mandal.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTeacher = selectedTeacher === '' || item.referenceTeacherName === selectedTeacher;
    return matchesSearch && matchesTeacher;
  });

  const exportToExcel = () => {
    const exportData = filteredData.map((item, index) => ({
      'S.No': index + 1,
      'Student Name': item.studentName,
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

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentName || !formData.fatherName || !formData.village || !formData.mandal || !formData.mobileNo) {
      alert('Please fill all required fields');
      return;
    }
    setSubmitLoading(true);
    try {
      const response = await axios.post('http://66.116.252.191:19998/api/address-collection', formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      });
      if (response.data.success) {
        setShowAddModal(false);
        setFormData({
          studentName: '',
          fatherName: '',
          village: '',
          mandal: '',
          mobileNo: '',
          alternateMobileNo: '',
          referenceTeacherId: ''
        });
        fetchData(); // Refresh the list
      }
    } catch (error: any) {
      console.error('Error submitting form:', error);
      const backendError = error.response?.data?.error || error.response?.data?.message || error.message;
      alert(`Failed to submit data: ${backendError}`);
    } finally {
      setSubmitLoading(false);
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

    if (selectedTeacher) {
      doc.setFontSize(10);
      doc.text(`Reference Teacher: ${selectedTeacher}`, 148.5, 28, { align: 'center' });
    }

    const tableColumn = ['S.No', 'Student Name', 'Father Name', 'Village', 'Mandal', 'Mobile No', 'Alt Mobile', 'Ref Teacher'];
    
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
        return [index < filteredData.length ? index + 1 : '', '', '', '', '', '', '', ''];
      }
      return [
        index + 1,
        item.studentName,
        item.fatherName,
        item.village,
        item.mandal,
        item.mobileNo,
        item.alternateMobileNo || '-',
        item.referenceTeacherName
      ];
    });

    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: selectedTeacher ? 32 : 28,
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
        0: { cellWidth: 15, halign: 'center' },
        1: { cellWidth: 45 },
        2: { cellWidth: 40 },
        3: { cellWidth: 35 },
        4: { cellWidth: 35 },
        5: { cellWidth: 30, halign: 'center' },
        6: { cellWidth: 30, halign: 'center' },
        7: { cellWidth: 40 }
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

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Student Address Collection (Admin)</h1>
        <div className="flex gap-4 flex-wrap">
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={18} />
            Add New Data
          </button>
          <button 
            onClick={exportToPDF}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
          >
            <FileText size={18} />
            Export PDF
          </button>
          <button 
            onClick={exportToExcel}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
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
            placeholder="Search by Student, Village, or Mandal..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="md:w-72">
          <select
            value={selectedTeacher}
            onChange={(e) => setSelectedTeacher(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
            <thead>
              <tr className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold rounded-tl-xl">S.No</th>
                <th className="px-6 py-4 font-semibold">Student Name</th>
                <th className="px-6 py-4 font-semibold">Father Name</th>
                <th className="px-6 py-4 font-semibold">Village</th>
                <th className="px-6 py-4 font-semibold">Mandal</th>
                <th className="px-6 py-4 font-semibold text-center">Mobile No</th>
                <th className="px-6 py-4 font-semibold text-center rounded-tr-xl">Ref Teacher</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredData.map((item, index) => (
                <tr key={item.id} className="hover:bg-blue-50/50 transition-colors duration-200 group">
                  <td className="px-6 py-4 text-sm text-gray-500">{index + 1}</td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">{item.studentName}</div>
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
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
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

      {/* Add New Data Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <User size={24} className="text-blue-600" />
                Add Student Details
              </h2>
              <button 
                onClick={() => setShowAddModal(false)}
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
                  onClick={() => setShowAddModal(false)}
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
                  {submitLoading ? 'Saving...' : 'Save Details'}
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
