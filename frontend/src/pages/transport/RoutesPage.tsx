import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Map, Plus, Trash2, X, MapPin, Bus, Clock, DollarSign, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '../../components/UI/PageHeader';


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
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-950/40 backdrop-blur-sm">
            <div className="fixed inset-0" onClick={() => !isSubmitting && setShowModal(false)} />
            <div className="relative bg-white rounded-[24px] p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-white z-10 flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <h2 className="text-lg font-black text-gray-900 flex items-center gap-2.5">
                  <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                    <Map className="w-4 h-4" />
                  </div>
                  Create New Route
                </h2>
                <button onClick={() => setShowModal(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-800">Basic Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Route Name <span className="text-rose-500">*</span></label>
                      <input required type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder-gray-400" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Route A" />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Assign Vehicle</label>
                      <select className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" value={formData.vehicleId} onChange={e => setFormData({...formData, vehicleId: e.target.value})}>
                        <option value="">-- No Vehicle Assigned --</option>
                        {vehicles.map(v => (
                          <option key={v.id} value={v.id}>{v.registrationNo} ({v.capacity} Seats)</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Start Point <span className="text-rose-500">*</span></label>
                      <input required type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder-gray-400" value={formData.startPoint} onChange={e => setFormData({...formData, startPoint: e.target.value})} placeholder="e.g. City Center" />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-1.5">End Point <span className="text-rose-500">*</span></label>
                      <input required type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder-gray-400" value={formData.endPoint} onChange={e => setFormData({...formData, endPoint: e.target.value})} placeholder="e.g. School Campus" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-gray-800">Route Stops</h3>
                    <button type="button" onClick={handleAddStop} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Add Stop
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {stops.map((stop, index) => (
                      <div key={index} className="flex flex-col md:flex-row gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl relative group">
                        <div className="absolute -left-2 -top-2 w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-black shadow-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Stop Name</label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input required type="text" className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" value={stop.stopName} onChange={e => handleStopChange(index, 'stopName', e.target.value)} placeholder="Stop name" />
                          </div>
                        </div>
                        <div className="w-full md:w-32">
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Pickup</label>
                          <div className="relative">
                            <Clock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input type="time" className="w-full pl-9 pr-2 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" value={stop.pickupTime} onChange={e => handleStopChange(index, 'pickupTime', e.target.value)} />
                          </div>
                        </div>
                        <div className="w-full md:w-32">
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Drop</label>
                          <div className="relative">
                            <Clock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input type="time" className="w-full pl-9 pr-2 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" value={stop.dropTime} onChange={e => handleStopChange(index, 'dropTime', e.target.value)} />
                          </div>
                        </div>
                        <div className="w-full md:w-32">
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Monthly Fee (₹)</label>
                          <div className="relative">
                            <DollarSign className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
                            <input type="number" min="0" className="w-full pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" value={stop.monthlyFee} onChange={e => handleStopChange(index, 'monthlyFee', e.target.value)} placeholder="0" />
                          </div>
                        </div>
                        {stops.length > 1 && (
                          <button type="button" onClick={() => handleRemoveStop(index)} className="mt-5 p-2 h-[38px] text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors md:self-end">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="sticky bottom-0 bg-white pt-4 border-t border-gray-100 mt-6 flex gap-3">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl transition-colors">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-gray-900/20 transition-all hover:-translate-y-0.5 disabled:opacity-50">
                    {isSubmitting ? 'Saving...' : 'Save Route & Stops'}
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

export default RoutesPage;
