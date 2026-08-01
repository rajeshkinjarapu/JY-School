import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Users, Plus, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const StudentTransportPage = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ studentId: '', routeId: '', stopId: '' });
  
  const [students, setStudents] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const [transRes, stdRes, rtsRes] = await Promise.all([
        api.get('/api/transport/students'),
        api.get('/api/students?limit=5000'),
        api.get('/api/transport/routes')
      ]);
      setItems(transRes.data);
      setStudents(stdRes.data?.data || stdRes.data || []);
      setRoutes(rtsRes.data);
    } catch (e) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/transport/students', formData);
      toast.success('Assigned student to transport');
      setShowModal(false);
      setFormData({ studentId: '', routeId: '', stopId: '' });
      fetchData();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="w-6 h-6 text-fuchsia-500" /> Student Transport Assignment</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Assign Transport
        </button>
      </div>

      {loading ? <LoadingSpinner size="lg" /> : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 font-semibold border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Class & Roll</th>
                <th className="px-6 py-4">Route</th>
                <th className="px-6 py-4">Stop</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map(r => (
                <tr key={r.id}>
                  <td className="px-6 py-4 font-bold">{r.student?.user?.name}</td>
                  <td className="px-6 py-4">{r.student?.class?.name} - {r.student?.class?.section} ({r.student?.rollNo})</td>
                  <td className="px-6 py-4">{r.route?.name}</td>
                  <td className="px-6 py-4">{r.stop?.stopName}</td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <button className="p-2 text-gray-400 hover:text-fuchsia-600"><Edit className="w-4 h-4" /></button>
                    <button className="p-2 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Assign Student to Transport</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Student</label>
                <select required className="input" value={formData.studentId} onChange={e => setFormData({...formData, studentId: e.target.value})}>
                  <option value="">Select Student</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.user?.name} - {s.rollNo}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Route</label>
                <select required className="input" value={formData.routeId} onChange={e => setFormData({...formData, routeId: e.target.value, stopId: ''})}>
                  <option value="">Select Route</option>
                  {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Stop</label>
                <select required className="input" value={formData.stopId} onChange={e => setFormData({...formData, stopId: e.target.value})}>
                  <option value="">Select Stop</option>
                  {routes.find(r => r.id === formData.routeId)?.stops?.map((s:any) => <option key={s.id} value={s.id}>{s.stopName}</option>)}
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentTransportPage;
