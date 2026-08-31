import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Bus, Plus, Edit, Trash2, X, Settings2, ShieldCheck, AlertTriangle, BadgeAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '../../components/UI/PageHeader';


export const VehiclesPage = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
    registrationNo: '', 
    capacity: '', 
    make: '',
    model: '', 
    status: 'ACTIVE' 
  });

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

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ registrationNo: '', capacity: '', make: '', model: '', status: 'ACTIVE' });
    setShowModal(true);
  };

  const openEditModal = (vehicle: any) => {
    setEditingId(vehicle.id);
    setFormData({ 
      registrationNo: vehicle.registrationNo, 
      capacity: vehicle.capacity.toString(), 
      make: vehicle.make || '', 
      model: vehicle.model || '',
      status: vehicle.status 
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this vehicle?")) return;
    const t = toast.loading('Deleting...');
    try {
      await api.delete(`/api/transport/vehicles/${id}`);
      toast.success('Vehicle deleted successfully', { id: t });
      fetchData();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to delete vehicle', { id: t });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    const t = toast.loading(editingId ? 'Updating vehicle...' : 'Adding vehicle...');
    try {
      if (editingId) {
        await api.put(`/api/transport/vehicles/${editingId}`, formData);
        toast.success('Vehicle updated successfully', { id: t });
      } else {
        await api.post('/api/transport/vehicles', formData);
        toast.success('Vehicle added successfully', { id: t });
      }
      setShowModal(false);
      fetchData();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to save vehicle', { id: t });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" /> ACTIVE
          </span>
        );
      case 'MAINTENANCE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-widest bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5" /> MAINTENANCE
          </span>
        );
      case 'INACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-widest bg-rose-50 text-rose-700 border border-rose-200">
            <BadgeAlert className="w-3.5 h-3.5" /> INACTIVE
          </span>
        );
      default:
        return <span className="inline-flex px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs font-bold uppercase">{status}</span>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/50" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader 
        title="Fleet Management" 
        icon={<Bus className="w-6 h-6 text-indigo-600" />} 
        action={
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg shadow-md hover:bg-gray-800 hover:-translate-y-0.5 transition-all font-bold text-sm"
          >
            <Plus className="w-4 h-4" /> Add Vehicle
          </button>
        }
      />
      <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in-up">

        {loading ? <div className="py-20 flex justify-center"><LoadingSpinner size="lg" /></div> : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden relative">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50/80 text-gray-500 text-[11px] uppercase tracking-widest border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-bold">Registration No</th>
                    <th className="px-6 py-4 font-bold">Make & Model</th>
                    <th className="px-6 py-4 font-bold">Capacity</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                          <Bus className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="font-bold text-gray-900 text-base">No vehicles found</p>
                        <p className="text-sm text-gray-500 mt-1">Add a vehicle to manage your school's transport fleet.</p>
                      </td>
                    </tr>
                  ) : items.map(r => (
                    <tr key={r.id} className="hover:bg-indigo-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100 flex-shrink-0">
                            <Bus className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div>
                            <div className="font-black text-gray-900 text-sm tracking-wide">{r.registrationNo}</div>
                            <div className="text-[11px] font-bold text-gray-400 tracking-wider">ID: {r.id.split('-')[0]}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-800">{r.make || 'Unknown'}</div>
                        <div className="text-[11px] text-gray-500 font-semibold">{r.model || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 max-w-[80px] h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: '60%' }} />
                          </div>
                          <span className="font-bold text-gray-700 text-xs">{r.capacity} Seats</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(r.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEditModal(r)} className="p-2 bg-white border border-gray-200 text-gray-400 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-100 rounded-lg transition-all shadow-sm">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(r.id)} className="p-2 bg-white border border-gray-200 text-gray-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 rounded-lg transition-all shadow-sm">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-950/40 backdrop-blur-sm">
            <div className="fixed inset-0" onClick={() => !isSubmitting && setShowModal(false)} />
            <div className="relative bg-white rounded-[24px] p-6 w-full max-w-md shadow-2xl">
              <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <h2 className="text-lg font-black text-gray-900 flex items-center gap-2.5">
                  <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                    {editingId ? <Settings2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </div>
                  {editingId ? 'Edit Vehicle' : 'Add New Vehicle'}
                </h2>
                <button onClick={() => setShowModal(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Registration Number <span className="text-rose-500">*</span></label>
                  <input required type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder-gray-400" value={formData.registrationNo} onChange={e => setFormData({...formData, registrationNo: e.target.value.toUpperCase()})} placeholder="e.g. MH-12-AB-1234" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Make</label>
                    <input type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder-gray-400" value={formData.make} onChange={e => setFormData({...formData, make: e.target.value})} placeholder="e.g. Tata" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Model</label>
                    <input type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder-gray-400" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} placeholder="e.g. Starbus" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Capacity (Seats) <span className="text-rose-500">*</span></label>
                    <input required type="number" min="1" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder-gray-400" value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} placeholder="e.g. 40" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Status <span className="text-rose-500">*</span></label>
                    <select required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="MAINTENANCE">MAINTENANCE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4 border-t border-gray-100 mt-6">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl transition-colors">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-gray-900/20 transition-all hover:-translate-y-0.5 disabled:opacity-50">
                    {isSubmitting ? 'Saving...' : (editingId ? 'Update Vehicle' : 'Save Vehicle')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VehiclesPage;
