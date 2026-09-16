import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/UI/PageHeader';
import { Book, Phone, Trash, Check, X, Clock, Edit2 } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export const AdmissionsListPage = () => {
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAdmissions = async () => {
    try {
      const res = await api.get('/api/admissions');
      setAdmissions(res.data.data);
    } catch (error) {
      toast.error('Failed to fetch admissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmissions();
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/api/admissions/${id}`, { status });
      toast.success(`Status updated to ${status}`);
      fetchAdmissions();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this inquiry?')) return;
    try {
      await api.delete(`/api/admissions/${id}`);
      toast.success('Inquiry deleted');
      fetchAdmissions();
    } catch (error) {
      toast.error('Failed to delete inquiry');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">Pending</span>;
      case 'CONTACTED': return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">Contacted</span>;
      case 'ENROLLED': return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">Enrolled</span>;
      case 'REJECTED': return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">Rejected</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50/50" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader title="Admissions Inquiries" icon={<Book className="w-5 h-5" />} />
      
      <div className="p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-gray-500">Loading admissions...</div>
          ) : admissions.length === 0 ? (
            <div className="p-10 text-center text-gray-500">No admission inquiries found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                    <th className="p-4 font-bold">Student Name</th>
                    <th className="p-4 font-bold">Parents</th>
                    <th className="p-4 font-bold">Contact</th>
                    <th className="p-4 font-bold">Class Applied</th>
                    <th className="p-4 font-bold">Date</th>
                    <th className="p-4 font-bold">Status</th>
                    <th className="p-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {admissions.map(adm => (
                    <tr key={adm.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-gray-900">{adm.studentName}</div>
                        <div className="text-xs text-gray-500">{adm.gender} {adm.dob ? `• ${new Date(adm.dob).toLocaleDateString()}` : ''}</div>
                      </td>
                      <td className="p-4 text-sm text-gray-700">
                        {adm.fatherName && <div>F: {adm.fatherName}</div>}
                        {adm.motherName && <div>M: {adm.motherName}</div>}
                      </td>
                      <td className="p-4 text-sm">
                        <a href={`tel:${adm.phone}`} className="text-indigo-600 hover:underline flex items-center gap-1 font-semibold">
                          <Phone className="w-3 h-3" /> {adm.phone}
                        </a>
                      </td>
                      <td className="p-4 text-sm font-bold text-gray-700">
                        {adm.classApplied || '-'}
                      </td>
                      <td className="p-4 text-sm text-gray-500">
                        {new Date(adm.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        {getStatusBadge(adm.status)}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <select 
                            className="text-xs border border-gray-300 rounded p-1"
                            value={adm.status}
                            onChange={(e) => handleUpdateStatus(adm.id, e.target.value)}
                          >
                            <option value="PENDING">Pending</option>
                            <option value="CONTACTED">Contacted</option>
                            <option value="ENROLLED">Enrolled</option>
                            <option value="REJECTED">Rejected</option>
                          </select>
                          <button onClick={() => handleDelete(adm.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Delete">
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdmissionsListPage;
