import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Users, Plus, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { PageHeader } from '../../components/UI/PageHeader';

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
    <div className="flex flex-col h-full bg-gray-50/50" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader 
        title="Student Transport" 
        icon={<Users className="w-5 h-5" />} 
        action={
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-pink-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all font-bold"
          >
            <Plus className="w-5 h-5" /> Assign Transport
          </button>
        }
      />
      <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up">

        {loading ? <div className="py-20 flex justify-center"><LoadingSpinner size="lg" /></div> : (
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200/60 dark:border-slate-800 overflow-hidden relative animate-fade-in-up delay-75">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60">
                  <tr>
                    <th className="px-6 py-5 font-bold">Student</th>
                    <th className="px-6 py-5 font-bold">Class & Roll</th>
                    <th className="px-6 py-5 font-bold">Route</th>
                    <th className="px-6 py-5 font-bold">Stop</th>
                    <th className="px-6 py-5 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="font-bold">No students assigned</p>
                      </td>
                    </tr>
                  ) : items.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-black text-slate-800 dark:text-slate-200 text-base">{r.student?.user?.name}</div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">
                        {r.student?.class?.name} - {r.student?.class?.section} <span className="text-slate-400">({r.student?.rollNo})</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-fuchsia-50 dark:bg-fuchsia-900/20 text-fuchsia-600 dark:text-fuchsia-400 font-bold rounded-lg text-xs border border-fuchsia-100 dark:border-fuchsia-800">
                          {r.route?.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">{r.stop?.stopName}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-fuchsia-600 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-900/20 rounded-xl transition-colors shadow-sm">
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
                <div className="p-2 bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-400 rounded-xl">
                  <Plus className="w-5 h-5" />
                </div>
                Assign Transport
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Student</label>
                  <select required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-400 outline-none transition-all" value={formData.studentId} onChange={e => setFormData({...formData, studentId: e.target.value})}>
                    <option value="">Select Student</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.user?.name} - {s.rollNo}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Route</label>
                  <select required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-400 outline-none transition-all" value={formData.routeId} onChange={e => setFormData({...formData, routeId: e.target.value, stopId: ''})}>
                    <option value="">Select Route</option>
                    {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Stop</label>
                  <select required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-400 outline-none transition-all" value={formData.stopId} onChange={e => setFormData({...formData, stopId: e.target.value})}>
                    <option value="">Select Stop</option>
                    {routes.find(r => r.id === formData.routeId)?.stops?.map((s:any) => <option key={s.id} value={s.id}>{s.stopName}</option>)}
                  </select>
                </div>
                
                <div className="flex gap-4 pt-4 mt-6">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm rounded-xl transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-3 bg-gradient-to-r from-fuchsia-500 to-pink-600 hover:from-fuchsia-600 hover:to-pink-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-fuchsia-500/30 transition-all hover:-translate-y-0.5">Save</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
  );
};

export default StudentTransportPage;
