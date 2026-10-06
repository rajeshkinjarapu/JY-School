import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Download, Search, FileText } from 'lucide-react';
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get('http://66.116.252.191:19998/api/address-collection', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
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
        <div className="flex gap-4">
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 text-sm font-medium text-gray-600">S.No</th>
                <th className="p-4 text-sm font-medium text-gray-600">Student Name</th>
                <th className="p-4 text-sm font-medium text-gray-600">Father Name</th>
                <th className="p-4 text-sm font-medium text-gray-600">Village</th>
                <th className="p-4 text-sm font-medium text-gray-600">Mandal</th>
                <th className="p-4 text-sm font-medium text-gray-600">Mobile No</th>
                <th className="p-4 text-sm font-medium text-gray-600">Ref Teacher</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredData.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50 transition">
                  <td className="p-4 text-sm text-gray-600">{index + 1}</td>
                  <td className="p-4 text-sm font-medium text-gray-900">{item.studentName}</td>
                  <td className="p-4 text-sm text-gray-600">{item.fatherName}</td>
                  <td className="p-4 text-sm text-gray-600">{item.village}</td>
                  <td className="p-4 text-sm text-gray-600">{item.mandal}</td>
                  <td className="p-4 text-sm text-gray-600">
                    <div>{item.mobileNo}</div>
                    {item.alternateMobileNo && (
                      <div className="text-xs text-gray-400 mt-1">{item.alternateMobileNo}</div>
                    )}
                  </td>
                  <td className="p-4 text-sm text-gray-600">{item.referenceTeacherName}</td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    No data found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AddressCollectionAdminPage;
