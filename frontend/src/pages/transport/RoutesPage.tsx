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
  return (
    <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white/60 dark:bg-slate-900/50 backdrop-blur-md p-6 lg:p-8 rounded-3xl border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>
          
          <div className="flex items-center gap-5 relative z-10">
            <div className="bg-gradient-to-br from-cyan-400 to-blue-600 p-4 rounded-2xl shadow-lg shadow-cyan-500/30 text-white shrink-0">
              <Map className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">Bus Routes</h1>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">Manage transport routes and assign vehicles.</p>
            </div>
          </div>
          
          <div className="mt-4 md:mt-0 relative z-10">
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 transition-all duration-300 hover:-translate-y-0.5">
              <Plus className="w-4 h-4" /> Add Route
            </button>
          </div>
        </div>

        {loading ? <div className="py-20 flex justify-center"><LoadingSpinner size="lg" /></div> : (
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200/60 dark:border-slate-800 overflow-hidden relative animate-fade-in-up delay-75">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60">
                  <tr>
                    <th className="px-6 py-5 font-bold">Route Name</th>
                    <th className="px-6 py-5 font-bold">Start Point</th>
                    <th className="px-6 py-5 font-bold">End Point</th>
                    <th className="px-6 py-5 font-bold">Vehicle</th>
                    <th className="px-6 py-5 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {routes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        <Map className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="font-bold">No routes available</p>
                      </td>
                    </tr>
                  ) : routes.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-black text-slate-800 dark:text-slate-200 text-base">{r.name}</div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">{r.startPoint}</td>
                      <td className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">{r.endPoint}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold rounded-lg text-xs border border-indigo-100 dark:border-indigo-800">
                          {r.vehicle?.registrationNo || 'Unassigned'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors shadow-sm">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors shadow-sm">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)' }}>
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 w-full max-w-md shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300">
              <h2 className="text-xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-3">
                <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-xl">
                  <Plus className="w-5 h-5" />
                </div>
                Add New Route
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Route Name</label>
                  <input required type="text" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 outline-none transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Route A" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Start Point</label>
                  <input required type="text" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 outline-none transition-all" value={formData.startPoint} onChange={e => setFormData({...formData, startPoint: e.target.value})} placeholder="e.g. City Center" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">End Point</label>
                  <input required type="text" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 outline-none transition-all" value={formData.endPoint} onChange={e => setFormData({...formData, endPoint: e.target.value})} placeholder="e.g. School Campus" />
                </div>
                
                <div className="flex gap-4 pt-4 mt-6">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm rounded-xl transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-cyan-500/30 transition-all hover:-translate-y-0.5">Save Route</button>
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
