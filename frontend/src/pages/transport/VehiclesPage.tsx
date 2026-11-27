import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import {
  Bus,
  Plus,
  Edit,
  Trash2,
  X,
  Settings2,
  ShieldCheck,
  AlertTriangle,
  BadgeAlert,
  ArrowLeft,
  Camera,
  Radio,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '../../components/UI/PageHeader';
import { Portal } from '../../components/UI/Portal';

const EMPTY_FORM = {
  registrationNo: '',
  capacity: '',
  make: '',
  model: '',
  status: 'ACTIVE',
  insuranceExpiry: '',
  fitnessExpiry: '',
  permitExpiry: '',
  pucExpiry: '',
  gpsDeviceId: '',
  hasCctv: false,
};

export const VehiclesPage = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const fetchData = async () => {
    try {
      const res = await api.get('/api/transport/vehicles');
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDateInput = (dt?: string | null) => {
    if (!dt) return '';
    const d = new Date(dt);
    return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setShowModal(true);
  };

  const openEditModal = (vehicle: any) => {
    const c = vehicle.compliance || {};
    setEditingId(vehicle.id);
    setFormData({
      registrationNo: vehicle.registrationNo,
      capacity: String(vehicle.capacity || ''),
      make: vehicle.make || '',
      model: vehicle.model || '',
      status: vehicle.status || 'ACTIVE',
      insuranceExpiry: formatDateInput(c.insuranceExpiry),
      fitnessExpiry: formatDateInput(c.fitnessExpiry),
      permitExpiry: formatDateInput(c.permitExpiry),
      pucExpiry: formatDateInput(c.pucExpiry),
      gpsDeviceId: c.gpsDeviceId || '',
      hasCctv: Boolean(c.hasCctv),
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
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
        toast.success('Vehicle & compliance updated!', { id: t });
      } else {
        await api.post('/api/transport/vehicles', formData);
        toast.success('Vehicle added successfully!', { id: t });
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
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" /> ACTIVE
          </span>
        );
      case 'MAINTENANCE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-50 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5" /> MAINTENANCE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-rose-50 text-rose-700 border border-rose-200">
            <BadgeAlert className="w-3.5 h-3.5" /> {status}
          </span>
        );
    }
  };

  const getDocHealth = (comp: any) => {
    if (!comp) return { label: 'Not Set', cls: 'bg-slate-100 text-slate-500 border-slate-200' };
    const dates = [comp.insuranceExpiry, comp.fitnessExpiry, comp.permitExpiry, comp.pucExpiry].filter(Boolean);
    if (dates.length === 0) return { label: 'Not Set', cls: 'bg-slate-100 text-slate-500 border-slate-200' };
    const minDays = Math.min(...dates.map(d => Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)));
    if (minDays <= 0) return { label: 'Doc Expired', cls: 'bg-rose-50 text-rose-700 border-rose-200' };
    if (minDays <= 30) return { label: `Expiring in ${minDays}d`, cls: 'bg-amber-50 text-amber-800 border-amber-200' };
    return { label: 'Docs Valid', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  };

  return (
    <div className="min-h-screen bg-[#F4F7FC] text-slate-800 pb-12">
      <PageHeader
        title="Fleet & Vehicle Compliance"
        icon={<Bus className="w-5 h-5" />}
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
              onClick={openAddModal}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:brightness-105 text-white text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Vehicle</span>
            </button>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {loading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="bg-white rounded-[24px] shadow-xs border border-indigo-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-[#F8FAFF] text-slate-600 text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
                    <th className="px-6 py-4">Registration &amp; Safety</th>
                    <th className="px-6 py-4">Make &amp; Model</th>
                    <th className="px-6 py-4">Capacity</th>
                    <th className="px-6 py-4">Compliance Docs</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center text-slate-400 font-bold">
                        No vehicles found. Click "Add Vehicle" to register school buses.
                      </td>
                    </tr>
                  ) : (
                    items.map(r => {
                      const docHealth = getDocHealth(r.compliance);
                      return (
                        <tr key={r.id} className="hover:bg-[#FAFBFD] transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100 shrink-0">
                                <Bus className="w-5 h-5 text-indigo-600" />
                              </div>
                              <div>
                                <div className="font-black text-slate-900 text-sm">{r.registrationNo}</div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  {r.compliance?.gpsDeviceId && (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded">
                                      <Radio className="w-2.5 h-2.5" /> GPS
                                    </span>
                                  )}
                                  {r.compliance?.hasCctv && (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-violet-700 bg-violet-50 px-1.5 py-0.2 rounded">
                                      <Camera className="w-2.5 h-2.5" /> CCTV
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-extrabold text-slate-800">{r.make || 'Standard Bus'}</div>
                            <div className="text-[11px] text-slate-500 font-semibold">{r.model || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 font-black text-slate-800">{r.capacity} Seats</td>
                          <td className="px-6 py-4">
                            <span className={`inline-block px-2.5 py-1 rounded-full border text-[10px] font-black ${docHealth.cls}`}>
                              {docHealth.label}
                            </span>
                          </td>
                          <td className="px-6 py-4">{getStatusBadge(r.status)}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditModal(r)}
                                className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl cursor-pointer"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(r.id)}
                                className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl cursor-pointer"
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
          </div>
        )}
      </div>

      {showModal && (
        <Portal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/35 backdrop-blur-xs">
            <div className="bg-white rounded-[24px] p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-indigo-100">
              <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                    {editingId ? <Settings2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </span>
                  <span>{editingId ? 'Edit Vehicle & Compliance' : 'Add Vehicle & Compliance'}</span>
                </h2>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-full cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-black text-slate-500 uppercase mb-1">Registration Number *</label>
                  <input
                    required
                    type="text"
                    value={formData.registrationNo}
                    onChange={e => setFormData({ ...formData, registrationNo: e.target.value.toUpperCase() })}
                    placeholder="e.g. AP-30-AB-1234"
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-black text-slate-500 uppercase mb-1">Make</label>
                    <input
                      type="text"
                      value={formData.make}
                      onChange={e => setFormData({ ...formData, make: e.target.value })}
                      placeholder="e.g. Ashok Leyland"
                      className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-black text-slate-500 uppercase mb-1">Model</label>
                    <input
                      type="text"
                      value={formData.model}
                      onChange={e => setFormData({ ...formData, model: e.target.value })}
                      placeholder="e.g. Sunshine"
                      className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-black text-slate-500 uppercase mb-1">Seat Capacity *</label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={formData.capacity}
                      onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                      placeholder="40"
                      className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-black text-slate-500 uppercase mb-1">Status *</label>
                    <select
                      required
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="MAINTENANCE">MAINTENANCE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAFBFD] border border-slate-200 space-y-3">
                  <p className="font-black text-slate-700 uppercase text-[10px] tracking-wider">
                    Legal Compliance &amp; Safety Vault
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-500 mb-1">Insurance Expiry</label>
                      <input
                        type="date"
                        value={formData.insuranceExpiry}
                        onChange={e => setFormData({ ...formData, insuranceExpiry: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-500 mb-1">Fitness (FC) Expiry</label>
                      <input
                        type="date"
                        value={formData.fitnessExpiry}
                        onChange={e => setFormData({ ...formData, fitnessExpiry: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-500 mb-1">Road Permit Expiry</label>
                      <input
                        type="date"
                        value={formData.permitExpiry}
                        onChange={e => setFormData({ ...formData, permitExpiry: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-500 mb-1">Pollution (PUC) Expiry</label>
                      <input
                        type="date"
                        value={formData.pucExpiry}
                        onChange={e => setFormData({ ...formData, pucExpiry: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <input
                      type="text"
                      value={formData.gpsDeviceId}
                      onChange={e => setFormData({ ...formData, gpsDeviceId: e.target.value })}
                      placeholder="GPS Tracker ID (optional)"
                      className="flex-1 min-w-[160px] px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold outline-none"
                    />
                    <label className="inline-flex items-center gap-2 font-extrabold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.hasCctv}
                        onChange={e => setFormData({ ...formData, hasCctv: e.target.checked })}
                        className="w-4 h-4 rounded text-indigo-600"
                      />
                      <span>CCTV Installed</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-extrabold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black rounded-xl cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : editingId ? 'Update Vehicle' : 'Save Vehicle'}
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

export default VehiclesPage;
