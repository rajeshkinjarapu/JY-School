import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Map, Plus, Trash2, X, MapPin, Bus, Clock, DollarSign, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '../../components/UI/PageHeader';
import { Portal } from '../../components/UI/Portal';

export const RoutesPage = () => {
  const [routes, setRoutes] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({ 
    name: '', 
    startPoint: '', 
    endPoint: '', 
    vehicleId: '' 
  });
  
  const [stops, setStops] = useState([{ stopName: '', pickupTime: '', dropTime: '', monthlyFee: 0 }]);

  const fetchData = async () => {
    try {
      const [rRes, vRes] = await Promise.all([
        api.get('/api/transport/routes'),
        api.get('/api/transport/vehicles')
      ]);
      setRoutes(rRes.data);
      setVehicles(vRes.data);
    } catch (e) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setFormData({ name: '', startPoint: '', endPoint: '', vehicleId: '' });
    setStops([{ stopName: '', pickupTime: '', dropTime: '', monthlyFee: 0 }]);
    setShowModal(true);
  };

  const handleAddStop = () => {
    setStops([...stops, { stopName: '', pickupTime: '', dropTime: '', monthlyFee: 0 }]);
  };

  const handleRemoveStop = (index: number) => {
    const newStops = [...stops];
    newStops.splice(index, 1);
    setStops(newStops);
  };

  const handleStopChange = (index: number, field: string, value: any) => {
    const newStops = [...stops] as any;
    newStops[index][field] = value;
    setStops(newStops);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this route? This will also delete all associated stops.")) return;
    const t = toast.loading('Deleting...');
    try {
      await api.delete(`/api/transport/routes/${id}`);
      toast.success('Route deleted successfully', { id: t });
      fetchData();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to delete route', { id: t });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    // validate stops
    if (stops.some(s => !s.stopName)) {
      toast.error('All stops must have a name');
      return;
    }

    setIsSubmitting(true);
    const t = toast.loading('Adding route...');
    try {
      await api.post('/api/transport/routes', {
        ...formData,
        stops: stops.map(s => ({ ...s, monthlyFee: Number(s.monthlyFee) }))
      });
      toast.success('Route added successfully', { id: t });
      setShowModal(false);
      fetchData();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error saving route', { id: t });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/50" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader 
        title="Bus Routes & Stops" 
        icon={<Map className="w-6 h-6 text-blue-600" />} 
        action={
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg shadow-md hover:bg-gray-800 hover:-translate-y-0.5 transition-all font-bold text-sm"
          >
            <Plus className="w-4 h-4" /> Create Route
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
                    <th className="px-6 py-4 font-bold">Route Name</th>
                    <th className="px-6 py-4 font-bold">Path</th>
                    <th className="px-6 py-4 font-bold">Vehicle Assigned</th>
                    <th className="px-6 py-4 font-bold text-center">Total Stops</th>
                    <th className="px-6 py-4 font-bold text-center">Students</th>
                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {routes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                          <Map className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="font-bold text-gray-900 text-base">No routes configured</p>
                        <p className="text-sm text-gray-500 mt-1">Create routes and define stops to map student transport.</p>
                      </td>
                    </tr>
                  ) : routes.map(r => (
                    <tr key={r.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100 flex-shrink-0">
                            <MapPin className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-black text-gray-900 text-sm tracking-wide">{r.name}</div>
                            <div className="text-[11px] font-bold text-gray-400 tracking-wider">ID: {r.id.split('-')[0]}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-700">{r.startPoint}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                          <span className="font-semibold text-gray-700">{r.endPoint}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {r.vehicle ? (
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-indigo-50 rounded text-indigo-600"><Bus className="w-3.5 h-3.5" /></div>
                            <div>
                              <div className="text-xs font-bold text-gray-800">{r.vehicle.registrationNo}</div>
                              <div className="text-[10px] text-gray-500">{r.vehicle.capacity} Seats</div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-bold text-xs border border-gray-200">
                          {r.stops?.length || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200">
                          {r._count?.students || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
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
          <Portal>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-950/40 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="fixed inset-0" onClick={() => !isSubmitting && setShowModal(false)} />
              <div className="relative bg-white rounded-[24px] p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                  <h2 className="text-lg font-black text-gray-900 flex items-center gap-2.5">
                    <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
                      {editingId ? <Settings2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </div>
                    {editingId ? 'Edit Route' : 'Add New Route'}
                  </h2>
                  <button onClick={() => setShowModal(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Route Name <span className="text-rose-500">*</span></label>
                    <input required type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder-gray-400" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Route A (City Center)" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Start Point <span className="text-rose-500">*</span></label>
                      <input required type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder-gray-400" value={formData.startPoint} onChange={e => setFormData({...formData, startPoint: e.target.value})} placeholder="e.g. Central Station" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-1.5">End Point <span className="text-rose-500">*</span></label>
                      <input required type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder-gray-400" value={formData.endPoint} onChange={e => setFormData({...formData, endPoint: e.target.value})} placeholder="e.g. School Campus" />
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xs font-black text-gray-700 uppercase tracking-widest">Route Stops</h3>
                      <button type="button" onClick={addStop} className="px-3 py-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-bold text-xs rounded-lg transition-colors flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Add Stop
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {formData.stops.map((stop, index) => (
                        <div key={index} className="flex gap-3 items-start p-3 bg-white rounded-lg border border-gray-100 shadow-sm relative group">
                          <div className="flex-1 space-y-3">
                            <input required type="text" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" value={stop.stopName} onChange={e => handleStopChange(index, 'stopName', e.target.value)} placeholder="Stop Name" />
                            <div className="flex gap-3">
                              <div className="flex-1 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <input type="time" className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-800 focus:ring-2 focus:ring-emerald-500/20 outline-none" value={stop.pickupTime} onChange={e => handleStopChange(index, 'pickupTime', e.target.value)} />
                              </div>
                              <div className="flex-1 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <input type="time" className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-800 focus:ring-2 focus:ring-emerald-500/20 outline-none" value={stop.dropTime} onChange={e => handleStopChange(index, 'dropTime', e.target.value)} />
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500 font-bold text-sm">₹</span>
                              <input required type="number" min="0" className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-800 focus:ring-2 focus:ring-emerald-500/20 outline-none" value={stop.monthlyFee} onChange={e => handleStopChange(index, 'monthlyFee', e.target.value)} placeholder="Monthly Fee" />
                            </div>
                          </div>
                          {formData.stops.length > 1 && (
                            <button type="button" onClick={() => removeStop(index)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl transition-colors">Cancel</button>
                    <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-gray-900/20 transition-all hover:-translate-y-0.5 disabled:opacity-50">
                      {isSubmitting ? 'Saving...' : (editingId ? 'Update Route' : 'Save Route')}
                    </button>
                  </div>
                </form>
    const t = toast.loading('Adding route...');
    try {
      await api.post('/api/transport/routes', {
        ...formData,
        stops: stops.map(s => ({ ...s, monthlyFee: Number(s.monthlyFee) }))
      });
      toast.success('Route added successfully', { id: t });
      setShowModal(false);
      fetchData();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error saving route', { id: t });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/50" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader 
        title="Bus Routes & Stops" 
        icon={<Map className="w-6 h-6 text-blue-600" />} 
        action={
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg shadow-md hover:bg-gray-800 hover:-translate-y-0.5 transition-all font-bold text-sm"
          >
            <Plus className="w-4 h-4" /> Create Route
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
                    <th className="px-6 py-4 font-bold">Route Name</th>
                    <th className="px-6 py-4 font-bold">Path</th>
                    <th className="px-6 py-4 font-bold">Vehicle Assigned</th>
                    <th className="px-6 py-4 font-bold text-center">Total Stops</th>
                    <th className="px-6 py-4 font-bold text-center">Students</th>
                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {routes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                          <Map className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="font-bold text-gray-900 text-base">No routes configured</p>
                        <p className="text-sm text-gray-500 mt-1">Create routes and define stops to map student transport.</p>
                      </td>
                    </tr>
                  ) : routes.map(r => (
                    <tr key={r.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100 flex-shrink-0">
                            <MapPin className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-black text-gray-900 text-sm tracking-wide">{r.name}</div>
                            <div className="text-[11px] font-bold text-gray-400 tracking-wider">ID: {r.id.split('-')[0]}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-700">{r.startPoint}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                          <span className="font-semibold text-gray-700">{r.endPoint}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {r.vehicle ? (
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-indigo-50 rounded text-indigo-600"><Bus className="w-3.5 h-3.5" /></div>
                            <div>
                              <div className="text-xs font-bold text-gray-800">{r.vehicle.registrationNo}</div>
                              <div className="text-[10px] text-gray-500">{r.vehicle.capacity} Seats</div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-bold text-xs border border-gray-200">
                          {r.stops?.length || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200">
                          {r._count?.students || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
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
          <Portal>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-950/40 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="fixed inset-0" onClick={() => !isSubmitting && setShowModal(false)} />
              <div className="relative bg-white rounded-[24px] p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                  <h2 className="text-lg font-black text-gray-900 flex items-center gap-2.5">
                    <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
                      {editingId ? <Settings2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </div>
                    {editingId ? 'Edit Route' : 'Add New Route'}
                  </h2>
                  <button onClick={() => setShowModal(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Route Name <span className="text-rose-500">*</span></label>
                    <input required type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder-gray-400" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Route A (City Center)" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Start Point <span className="text-rose-500">*</span></label>
                      <input required type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder-gray-400" value={formData.startPoint} onChange={e => setFormData({...formData, startPoint: e.target.value})} placeholder="e.g. Central Station" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-1.5">End Point <span className="text-rose-500">*</span></label>
                      <input required type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder-gray-400" value={formData.endPoint} onChange={e => setFormData({...formData, endPoint: e.target.value})} placeholder="e.g. School Campus" />
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xs font-black text-gray-700 uppercase tracking-widest">Route Stops</h3>
                      <button type="button" onClick={addStop} className="px-3 py-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-bold text-xs rounded-lg transition-colors flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Add Stop
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {formData.stops.map((stop, index) => (
                        <div key={index} className="flex gap-3 items-start p-3 bg-white rounded-lg border border-gray-100 shadow-sm relative group">
                          <div className="flex-1 space-y-3">
                            <input required type="text" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" value={stop.stopName} onChange={e => handleStopChange(index, 'stopName', e.target.value)} placeholder="Stop Name" />
                            <div className="flex gap-3">
                              <div className="flex-1 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <input type="time" className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-800 focus:ring-2 focus:ring-emerald-500/20 outline-none" value={stop.pickupTime} onChange={e => handleStopChange(index, 'pickupTime', e.target.value)} />
                              </div>
                              <div className="flex-1 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <input type="time" className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-800 focus:ring-2 focus:ring-emerald-500/20 outline-none" value={stop.dropTime} onChange={e => handleStopChange(index, 'dropTime', e.target.value)} />
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500 font-bold text-sm">₹</span>
                              <input required type="number" min="0" className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-800 focus:ring-2 focus:ring-emerald-500/20 outline-none" value={stop.monthlyFee} onChange={e => handleStopChange(index, 'monthlyFee', e.target.value)} placeholder="Monthly Fee" />
                            </div>
                          </div>
                          {formData.stops.length > 1 && (
                            <button type="button" onClick={() => removeStop(index)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl transition-colors">Cancel</button>
                    <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-gray-900/20 transition-all hover:-translate-y-0.5 disabled:opacity-50">
                      {isSubmitting ? 'Saving...' : (editingId ? 'Update Route' : 'Save Route')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </Portal>
        )}
      </div>
      </div>
    </div>
  );
};

export default RoutesPage;
