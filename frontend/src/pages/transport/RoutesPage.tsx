import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Map, Plus, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const RoutesPage = () => {
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', startPoint: '', endPoint: '', vehicleId: '' });

  const fetchRoutes = async () => {
    try {
      const res = await api.get('/api/transport/routes');
      setRoutes(res.data);
    } catch (e) {
      toast.error('Failed to load routes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/transport/routes', formData);
      toast.success('Route added');
      setShowModal(false);
      setFormData({ name: '', startPoint: '', endPoint: '', vehicleId: '' });
      fetchRoutes();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Map className="w-6 h-6 text-blue-500" /> Bus Routes</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Route
        </button>
      </div>

      {loading ? <LoadingSpinner size="lg" /> : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 font-semibold border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Route Name</th>
                <th className="px-6 py-4">Start Point</th>
                <th className="px-6 py-4">End Point</th>
                <th className="px-6 py-4">Vehicle</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {routes.map(r => (
                <tr key={r.id}>
                  <td className="px-6 py-4 font-bold">{r.name}</td>
                  <td className="px-6 py-4">{r.startPoint}</td>
                  <td className="px-6 py-4">{r.endPoint}</td>
                  <td className="px-6 py-4">{r.vehicle?.registrationNo || 'None'}</td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <button className="p-2 text-gray-400 hover:text-blue-600"><Edit className="w-4 h-4" /></button>
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
            <h2 className="text-xl font-bold mb-4">Add Route</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Route Name</label>
                <input required type="text" className="input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="label">Start Point</label>
                <input required type="text" className="input" value={formData.startPoint} onChange={e => setFormData({...formData, startPoint: e.target.value})} />
              </div>
              <div>
                <label className="label">End Point</label>
                <input required type="text" className="input" value={formData.endPoint} onChange={e => setFormData({...formData, endPoint: e.target.value})} />
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

export default RoutesPage;
