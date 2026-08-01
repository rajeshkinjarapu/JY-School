import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Bus, Plus, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const VehiclesPage = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ registrationNo: '', capacity: '', make: '', status: 'ACTIVE' });

  const fetchData = async () => {
    try {
      const res = await api.get('/api/transport/vehicles');
      setItems(res.data);
    } catch (e) {
      toast.error('Failed to load vehicles');
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
      await api.post('/api/transport/vehicles', formData);
      toast.success('Vehicle added');
      setShowModal(false);
      setFormData({ registrationNo: '', capacity: '', make: '', status: 'ACTIVE' });
      fetchData();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Bus className="w-6 h-6 text-indigo-500" /> Vehicles</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Vehicle
        </button>
      </div>

      {loading ? <LoadingSpinner size="lg" /> : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 font-semibold border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Reg. No</th>
                <th className="px-6 py-4">Make</th>
                <th className="px-6 py-4">Capacity</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map(r => (
                <tr key={r.id}>
                  <td className="px-6 py-4 font-bold">{r.registrationNo}</td>
                  <td className="px-6 py-4">{r.make || 'N/A'}</td>
                  <td className="px-6 py-4">{r.capacity} seats</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${r.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{r.status}</span>
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <button className="p-2 text-gray-400 hover:text-indigo-600"><Edit className="w-4 h-4" /></button>
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
            <h2 className="text-xl font-bold mb-4">Add Vehicle</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Registration No</label>
                <input required type="text" className="input" value={formData.registrationNo} onChange={e => setFormData({...formData, registrationNo: e.target.value})} />
              </div>
              <div>
                <label className="label">Make/Model</label>
                <input type="text" className="input" value={formData.make} onChange={e => setFormData({...formData, make: e.target.value})} />
              </div>
              <div>
                <label className="label">Capacity (Seats)</label>
                <input required type="number" className="input" value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} />
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

export default VehiclesPage;
