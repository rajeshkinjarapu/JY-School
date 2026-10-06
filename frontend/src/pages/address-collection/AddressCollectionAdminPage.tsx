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

  const filteredData = data.filter(item => 
    item.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.village.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.mandal.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    const doc = new jsPDF();
    
    doc.text('Student Address Collection', 14, 15);
    
    const tableColumn = ['S.No', 'Student Name', 'Father Name', 'Village', 'Mandal', 'Mobile', 'Alt Mobile', 'Ref Teacher'];
    const tableRows = filteredData.map((item, index) => [
      index + 1,
      item.studentName,
      item.fatherName,
      item.village,
      item.mandal,
      item.mobileNo,
      item.alternateMobileNo || '-',
      item.referenceTeacherName
    ]);

    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: { fontSize: 8 },
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

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by Student, Village, or Mandal..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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
