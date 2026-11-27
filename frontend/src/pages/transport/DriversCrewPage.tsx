import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  UserCheck,
  Plus,
  Phone,
  Bus,
  ShieldAlert,
  CheckCircle2,
  Edit,
  Trash2,
  X,
  Search,
  ArrowLeft,
  Calendar,
  Users,
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { PageHeader } from '../../components/UI/PageHeader';
import { Portal } from '../../components/UI/Portal';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';

const EMPTY_FORM = {
  name: '',
  phone: '',
  role: 'DRIVER',
  vehicleId: '',
  licenseNo: '',
  licenseExpiry: '',
  status: 'ACTIVE',
};

export const DriversCrewPage: React.FC = () => {
  const [crew, setCrew] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cRes, vRes] = await Promise.all([
        api.get('/api/transport/crew'),
        api.get('/api/transport/vehicles'),
      ]);
      setCrew(Array.isArray(cRes.data) ? cRes.data : []);
      setVehicles(Array.isArray(vRes.data) ? vRes.data : []);
    } catch {
      toast.error('Failed to load transport crew');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const daysUntil = (dt?: string | null) => {
    if (!dt) return null;
    const d = new Date(dt);
    if (isNaN(d.getTime())) return null;
    return Math.ceil((d.getTime() - Date.now()) / 86400000);
  };

  const kpis = useMemo(() => {
    const total = crew.length;
    const drivers = crew.filter(c => c.role === 'DRIVER').length;
    const attendants = crew.filter(c => c.role === 'ATTENDANT').length;
    const expiring = crew.filter(c => {
      const d = daysUntil(c.licenseExpiry);
      return d !== null && d <= 30;
    }).length;
    return { total, drivers, attendants, expiring };
  }, [crew]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return crew.filter(c => {
      if (roleFilter !== 'ALL' && c.role !== roleFilter) return false;
      if (!q) return true;
      return (
        (c.name || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q) ||
        (c.licenseNo || '').toLowerCase().includes(q) ||
        (c.vehicle?.registrationNo || '').toLowerCase().includes(q)
      );
    });
  }, [crew, search, roleFilter]);

  const openAdd = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({
      name: item.name || '',
      phone: item.phone || '',
      role: item.role || 'DRIVER',
      vehicleId: item.vehicleId || '',
      licenseNo: item.licenseNo || '',
      licenseExpiry: item.licenseExpiry ? new Date(item.licenseExpiry).toISOString().split('T')[0] : '',
      status: item.status || 'ACTIVE',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/api/transport/crew/${editingId}`, formData);
        toast.success('Crew member updated');
      } else {
        await api.post('/api/transport/crew', formData);
        toast.success('Crew member added');
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save crew member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/transport/crew/${id}`);
      toast.success('Crew member removed');
      setCrew(prev => prev.filter(c => c.id !== id));
    } catch {
      toast.error('Failed to delete crew member');
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FC] text-slate-800 pb-12">
      <PageHeader
        title="Drivers, Conductors & Transport Crew"
        icon={<UserCheck className="w-5 h-5" />}
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
              onClick={openAdd}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:brightness-105 text-white text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Driver / Crew</span>
            </button>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF] border border-indigo-200 rounded-[22px] p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase text-indigo-700/80">Total Crew</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">{kpis.total}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#ECFDF5] to-[#D1FAE5] border border-emerald-200 rounded-[22px] p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase text-emerald-700/80">Drivers</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">{kpis.drivers}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <Bus className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#F5F3FF] to-[#EDE9FE] border border-violet-200 rounded-[22px] p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase text-violet-700/80">Attendants</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">{kpis.attendants}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#FFF1F2] to-[#FFE4E6] border border-rose-200 rounded-[22px] p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase text-rose-700/80">License Alerts</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">{kpis.expiring}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-[20px] border border-indigo-100 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, phone, license or bus..."
              className="w-full pl-9 pr-3 py-2 bg-[#F8FAFF] border border-indigo-100 rounded-xl text-xs font-bold outline-none"
            />
          </div>

          <div className="flex gap-2">
            {['ALL', 'DRIVER', 'ATTENDANT', 'COORDINATOR'].map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer ${
                  roleFilter === r ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {r === 'ALL' ? 'All Roles' : r}
              </button>
            ))}
          </div>
        </div>

        {/* Crew Table */}
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
                    <th className="py-3.5 px-5">Crew Member</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Assigned Vehicle</th>
                    <th className="py-3.5 px-4">License &amp; Expiry</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-14 text-center text-slate-400 font-bold">
                        No transport crew members found. Click "Add Driver / Crew" to add one.
                      </td>
                    </tr>
                  ) : (
                    filtered.map(item => {
                      const days = daysUntil(item.licenseExpiry);
                      return (
                        <tr key={item.id} className="hover:bg-[#FAFBFD]">
                          <td className="py-3.5 px-5">
                            <p className="font-black text-slate-900 text-sm">{item.name}</p>
                            {item.phone && (
                              <a
                                href={`tel:${item.phone}`}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:underline mt-0.5"
                              >
                                <Phone className="w-3 h-3" />
                                <span>{item.phone}</span>
                              </a>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-black uppercase">
                              {item.role}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-800">
                            {item.vehicle ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-black text-[11px]">
                                <Bus className="w-3.5 h-3.5 text-indigo-600" />
                                {item.vehicle.registrationNo}
                              </span>
                            ) : (
                              <span className="text-slate-400">Unassigned</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-slate-800">{item.licenseNo || '—'}</p>
                            {item.licenseExpiry && (
                              <p
                                className={`text-[10px] font-black mt-0.5 inline-flex items-center gap-1 ${
                                  days !== null && days <= 0
                                    ? 'text-rose-600'
                                    : days !== null && days <= 30
                                    ? 'text-amber-700'
                                    : 'text-emerald-700'
                                }`}
                              >
                                <Calendar className="w-3 h-3" />
                                Exp: {new Date(item.licenseExpiry).toLocaleDateString('en-IN')}
                              </p>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                                item.status === 'ACTIVE'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEdit(item)}
                                className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 cursor-pointer"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(item.id)}
                                className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
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
                <h2 className="text-base font-black text-slate-900">
                  {editingId ? 'Edit Transport Crew' : 'Add Driver / Attendant'}
                </h2>
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
                  <label className="block font-black text-slate-500 uppercase mb-1">Full Name *</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none"
                    placeholder="e.g. Ramesh Babu"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-black text-slate-500 uppercase mb-1">Phone</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none"
                      placeholder="+91 98..."
                    />
                  </div>
                  <div>
                    <label className="block font-black text-slate-500 uppercase mb-1">Role</label>
                    <select
                      value={formData.role}
                      onChange={e => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none"
                    >
                      <option value="DRIVER">DRIVER</option>
                      <option value="ATTENDANT">ATTENDANT / HELPER</option>
                      <option value="COORDINATOR">COORDINATOR</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-black text-slate-500 uppercase mb-1">Assigned Bus / Vehicle</label>
                  <select
                    value={formData.vehicleId}
                    onChange={e => setFormData({ ...formData, vehicleId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none"
                  >
                    <option value="">-- Unassigned --</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.registrationNo} ({v.make || 'Bus'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-black text-slate-500 uppercase mb-1">License No</label>
                    <input
                      type="text"
                      value={formData.licenseNo}
                      onChange={e => setFormData({ ...formData, licenseNo: e.target.value.toUpperCase() })}
                      className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none"
                      placeholder="AP30-2026..."
                    />
                  </div>
                  <div>
                    <label className="block font-black text-slate-500 uppercase mb-1">License Expiry</label>
                    <input
                      type="date"
                      value={formData.licenseExpiry}
                      onChange={e => setFormData({ ...formData, licenseExpiry: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-black text-slate-500 uppercase mb-1">Duty Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="ON_LEAVE">ON LEAVE</option>
                  </select>
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
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Save Crew'}
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

export default DriversCrewPage;
