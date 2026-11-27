import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Navigation,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Trash2,
  X,
  ArrowLeft,
  Bus,
  Map as MapIcon,
  Users,
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { PageHeader } from '../../components/UI/PageHeader';
import { Portal } from '../../components/UI/Portal';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';

export const TripLogsPage: React.FC = () => {
  const [trips, setTrips] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    routeId: '',
    vehicleId: '',
    tripDate: new Date().toISOString().split('T')[0],
    shift: 'MORNING_PICKUP',
    status: 'ON_TIME',
    studentsBoarded: '',
    delayMinutes: '0',
    notes: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tRes, rRes, vRes] = await Promise.all([
        api.get('/api/transport/trips'),
        api.get('/api/transport/routes'),
        api.get('/api/transport/vehicles'),
      ]);
      setTrips(Array.isArray(tRes.data) ? tRes.data : []);
      setRoutes(Array.isArray(rRes.data) ? rRes.data : []);
      setVehicles(Array.isArray(vRes.data) ? vRes.data : []);
    } catch {
      toast.error('Failed to load trip dispatch logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const kpis = useMemo(() => {
    const total = trips.length;
    const onTime = trips.filter(t => t.status === 'ON_TIME' || t.status === 'COMPLETED').length;
    const delayed = trips.filter(t => t.status === 'DELAYED').length;
    const breakdowns = trips.filter(t => t.status === 'BREAKDOWN').length;
    return { total, onTime, delayed, breakdowns };
  }, [trips]);

  const handleRouteSelect = (routeId: string) => {
    const r = routes.find(rt => rt.id === routeId);
    setFormData(prev => ({
      ...prev,
      routeId,
      vehicleId: r?.vehicleId || prev.vehicleId,
      studentsBoarded: r?._count?.students ? String(r._count.students) : prev.studentsBoarded,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.routeId) return;
    setSubmitting(true);
    try {
      await api.post('/api/transport/trips', formData);
      toast.success('Trip logged successfully');
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to log trip');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/transport/trips/${id}`);
      toast.success('Trip log removed');
      setTrips(prev => prev.filter(t => t.id !== id));
    } catch {
      toast.error('Failed to remove trip log');
    }
  };

  const getStatusPill = (status: string) => {
    if (status === 'ON_TIME' || status === 'COMPLETED') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (status === 'DELAYED') return 'bg-amber-50 text-amber-800 border-amber-200';
    return 'bg-rose-50 text-rose-700 border-rose-200';
  };

  return (
    <div className="min-h-screen bg-[#F4F7FC] text-slate-800 pb-12">
      <PageHeader
        title="Daily Trip Dispatch & Shift Logs"
        icon={<Navigation className="w-5 h-5" />}
        action={
          <div className="flex items-center gap-2">
            <Link
              to="/transport"
              className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-extrabold flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Command Center</span>
            </Link>
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-105 text-white text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Log Bus Trip</span>
            </button>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF] border border-indigo-200 rounded-[22px] p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase text-indigo-700/80">Total Trips</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">{kpis.total}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <Navigation className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#ECFDF5] to-[#D1FAE5] border border-emerald-200 rounded-[22px] p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase text-emerald-700/80">On Time</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">{kpis.onTime}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] border border-amber-200 rounded-[22px] p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase text-amber-800/80">Delayed</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">{kpis.delayed}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#FFF1F2] to-[#FFE4E6] border border-rose-200 rounded-[22px] p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase text-rose-700/80">Breakdowns</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">{kpis.breakdowns}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[24px] border border-indigo-100 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-16 flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F8FAFF] border-b border-slate-200 text-slate-600 font-black uppercase text-[10px] tracking-wider">
                    <th className="py-3.5 px-5">Date &amp; Shift</th>
                    <th className="py-3.5 px-4">Route &amp; Bus</th>
                    <th className="py-3.5 px-4 text-center">Boarded</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4">Notes</th>
                    <th className="py-3.5 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {trips.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-14 text-center text-slate-400 font-bold">
                        No trip logs yet. Click "Log Bus Trip" to record morning pickup or evening drop runs.
                      </td>
                    </tr>
                  ) : (
                    trips.map(t => (
                      <tr key={t.id} className="hover:bg-[#FAFBFD]">
                        <td className="py-3.5 px-5">
                          <p className="font-black text-slate-900">
                            {new Date(t.tripDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {t.shift === 'MORNING_PICKUP' ? 'Morning Pickup' : 'Evening Drop'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-black text-slate-900 flex items-center gap-1.5">
                            <MapIcon className="w-3.5 h-3.5 text-sky-600" />
                            <span>{t.route?.name || 'Route'}</span>
                          </p>
                          <p className="text-[11px] font-bold text-slate-500 flex items-center gap-1 mt-0.5">
                            <Bus className="w-3 h-3" />
                            <span>{t.vehicle?.registrationNo || 'No Vehicle'}</span>
                          </p>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1 font-black text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                            <Users className="w-3.5 h-3.5 text-indigo-600" />
                            {t.studentsBoarded}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full border text-[10px] font-black uppercase ${getStatusPill(t.status)}`}>
                            {t.status.replace('_', ' ')}
                            {t.status === 'DELAYED' && t.delayMinutes > 0 ? ` (+${t.delayMinutes}m)` : ''}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">{t.notes || '—'}</td>
                        <td className="py-3.5 px-5 text-right">
                          <button
                            type="button"
                            onClick={() => handleDelete(t.id)}
                            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <Portal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/35 backdrop-blur-xs">
            <div className="bg-white rounded-[24px] p-6 w-full max-w-md shadow-2xl border border-indigo-100">
              <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
                <h2 className="text-base font-black text-slate-900">Log Daily Bus Trip</h2>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-full cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-black text-slate-500 uppercase mb-1">Route *</label>
                  <select
                    required
                    value={formData.routeId}
                    onChange={e => handleRouteSelect(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none"
                  >
                    <option value="">-- Select Route --</option>
                    {routes.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.startPoint} → {r.endPoint})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-black text-slate-500 uppercase mb-1">Vehicle</label>
                    <select
                      value={formData.vehicleId}
                      onChange={e => setFormData({ ...formData, vehicleId: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none"
                    >
                      <option value="">-- Optional --</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.registrationNo}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-black text-slate-500 uppercase mb-1">Trip Date</label>
                    <input
                      type="date"
                      value={formData.tripDate}
                      onChange={e => setFormData({ ...formData, tripDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-black text-slate-500 uppercase mb-1">Shift</label>
                    <select
                      value={formData.shift}
                      onChange={e => setFormData({ ...formData, shift: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none"
                    >
                      <option value="MORNING_PICKUP">Morning Pickup</option>
                      <option value="EVENING_DROP">Evening Drop</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-black text-slate-500 uppercase mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none"
                    >
                      <option value="ON_TIME">ON TIME</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="DELAYED">DELAYED</option>
                      <option value="BREAKDOWN">BREAKDOWN</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-black text-slate-500 uppercase mb-1">Students Boarded</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.studentsBoarded}
                      onChange={e => setFormData({ ...formData, studentsBoarded: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-black text-slate-500 uppercase mb-1">Delay (Mins)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.delayMinutes}
                      onChange={e => setFormData({ ...formData, delayMinutes: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-black text-slate-500 uppercase mb-1">Notes / Remarks</label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-semibold outline-none resize-none"
                    placeholder="Optional traffic or mechanical note..."
                  />
                </div>

                <div className="flex gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-extrabold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Save Trip Log'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
};

export default TripLogsPage;
