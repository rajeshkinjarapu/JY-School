import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Users, Plus, Trash2, X, Map, MapPin, User, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '../../components/UI/PageHeader';


export const StudentTransportPage = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({ studentId: '', routeId: '', stopId: '' });
  
  const [students, setStudents] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [availableStops, setAvailableStops] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const [transRes, stdRes, rtsRes] = await Promise.all([
        api.get('/api/transport/students'),
        api.get('/api/students?limit=2000'), // limit for performance
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

  // Update available stops when route changes
  useEffect(() => {
    if (formData.routeId) {
      const selectedRoute = routes.find(r => r.id === formData.routeId);
      setAvailableStops(selectedRoute?.stops || []);
      // Auto-select first stop if none selected and stops exist
      if (selectedRoute?.stops?.length > 0 && !formData.stopId) {
        setFormData(prev => ({ ...prev, stopId: selectedRoute.stops[0].id }));
      }
    } else {
      setAvailableStops([]);
    }
  }, [formData.routeId, routes]);

  const openAddModal = () => {
    setFormData({ studentId: '', routeId: '', stopId: '' });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove transport for this student?")) return;
    const t = toast.loading('Removing...');
    try {
      await api.delete(`/api/transport/students/${id}`);
      toast.success('Transport removed successfully', { id: t });
      fetchData();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to remove transport', { id: t });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    const t = toast.loading('Assigning transport...');
    try {
      await api.post('/api/transport/students', formData);
      toast.success('Student assigned to transport successfully', { id: t });
      setShowModal(false);
      fetchData();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error assigning transport', { id: t });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/50" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader 
        title="Student Transport" 
        icon={<Users className="w-6 h-6 text-fuchsia-600" />} 
        action={
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg shadow-md hover:bg-gray-800 hover:-translate-y-0.5 transition-all font-bold text-sm"
          >
            <Plus className="w-4 h-4" /> Assign Transport
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
                    <th className="px-6 py-4 font-bold">Student Name</th>
                    <th className="px-6 py-4 font-bold">Class / Section</th>
                    <th className="px-6 py-4 font-bold">Transport Route</th>
                    <th className="px-6 py-4 font-bold">Pickup/Drop Stop</th>
                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                          <Users className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="font-bold text-gray-900 text-base">No students assigned</p>
                        <p className="text-sm text-gray-500 mt-1">Assign students to transport routes.</p>
                      </td>
                    </tr>
                  ) : items.map(r => (
                    <tr key={r.id} className="hover:bg-fuchsia-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-fuchsia-50 flex items-center justify-center border border-fuchsia-100 flex-shrink-0">
                            <span className="text-fuchsia-600 font-bold text-sm">
                              {r.student?.user?.name?.charAt(0) || <User className="w-4 h-4" />}
                            </span>
                          </div>
                          <div>
                            <div className="font-black text-gray-900 text-sm tracking-wide">{r.student?.user?.name}</div>
                            <div className="text-[11px] font-bold text-gray-400 tracking-wider">Admission: {r.student?.admissionNumber || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-800">{r.student?.class?.name}</div>
                        <div className="text-[11px] text-gray-500 font-semibold">Section {r.student?.class?.section} • Roll {r.student?.rollNo}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex w-max items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-widest bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200">
                            <Map className="w-3.5 h-3.5" /> {r.route?.name}
                          </span>
                          <span className="text-[10px] font-semibold text-gray-400 flex items-center gap-1 mt-0.5">
                            {r.route?.vehicle?.registrationNo || 'No vehicle'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div>
                            <div className="font-bold text-gray-800">{r.stop?.stopName || 'Unknown Stop'}</div>
                            <div className="text-[11px] text-gray-500 font-semibold flex items-center gap-1 mt-0.5">
                              {r.stop?.pickupTime || '--'} <ChevronRight className="w-3 h-3" /> {r.stop?.dropTime || '--'}
                            </div>
                          </div>
                        </div>
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
            <div className="relative bg-white rounded-[24px] p-6 w-full max-w-md shadow-2xl">
              <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <h2 className="text-lg font-black text-gray-900 flex items-center gap-2.5">
                  <div className="p-1.5 bg-fuchsia-100 text-fuchsia-600 rounded-lg">
                    <Users className="w-4 h-4" />
                  </div>
                  Assign Student Transport
                </h2>
                <button onClick={() => setShowModal(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Select Student <span className="text-rose-500">*</span></label>
                  <select required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 outline-none transition-all" value={formData.studentId} onChange={e => setFormData({...formData, studentId: e.target.value})}>
                    <option value="">-- Choose Student --</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.user?.name} (Class {s.class?.name || '-'})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Select Route <span className="text-rose-500">*</span></label>
                  <select required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 outline-none transition-all" value={formData.routeId} onChange={e => setFormData({...formData, routeId: e.target.value, stopId: ''})}>
                    <option value="">-- Choose Route --</option>
                    {routes.map(r => <option key={r.id} value={r.id}>{r.name} ({r.startPoint} to {r.endPoint})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Select Stop <span className="text-rose-500">*</span></label>
                  <select required disabled={!formData.routeId || availableStops.length === 0} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 outline-none transition-all disabled:opacity-50" value={formData.stopId} onChange={e => setFormData({...formData, stopId: e.target.value})}>
                    <option value="">{availableStops.length === 0 && formData.routeId ? '-- No Stops Found --' : '-- Choose Stop --'}</option>
                    {availableStops.map((s:any) => <option key={s.id} value={s.id}>{s.stopName} (₹{s.monthlyFee})</option>)}
                  </select>
                </div>
                
                <div className="flex gap-3 pt-4 border-t border-gray-100 mt-6">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl transition-colors">Cancel</button>
                  <button type="submit" disabled={isSubmitting || !formData.stopId} className="flex-1 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-gray-900/20 transition-all hover:-translate-y-0.5 disabled:opacity-50">
                    {isSubmitting ? 'Saving...' : 'Assign Transport'}
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

export default StudentTransportPage;
