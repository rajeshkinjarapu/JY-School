import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import {
  Users,
  Plus,
  Trash2,
  X,
  Map as MapIcon,
  MapPin,
  User,
  ChevronRight,
  Printer,
  Search,
  ArrowLeft,
  CreditCard,
  IndianRupee,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '../../components/UI/PageHeader';
import { Portal } from '../../components/UI/Portal';

export const StudentTransportPage = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [routeFilter, setRouteFilter] = useState('');

  const [formData, setFormData] = useState({ studentId: '', routeId: '', stopId: '' });
  const [students, setStudents] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [availableStops, setAvailableStops] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const [transRes, stdRes, rtsRes] = await Promise.all([
        api.get('/api/transport/students'),
        api.get('/api/students?limit=2000'),
        api.get('/api/transport/routes'),
      ]);
      setItems(Array.isArray(transRes.data) ? transRes.data : []);
      setStudents(stdRes.data?.data || stdRes.data || []);
      setRoutes(Array.isArray(rtsRes.data) ? rtsRes.data : []);
    } catch {
      toast.error('Failed to load transport data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.routeId) {
      const selectedRoute = routes.find(r => r.id === formData.routeId);
      setAvailableStops(selectedRoute?.stops || []);
      if (selectedRoute?.stops?.length > 0 && !formData.stopId) {
        setFormData(prev => ({ ...prev, stopId: selectedRoute.stops[0].id }));
      }
    } else {
      setAvailableStops([]);
    }
  }, [formData.routeId, routes]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter(r => {
      if (routeFilter && r.routeId !== routeFilter) return false;
      if (!q) return true;
      return (
        (r.student?.user?.name || '').toLowerCase().includes(q) ||
        (r.student?.rollNo || '').toLowerCase().includes(q) ||
        (r.stop?.stopName || '').toLowerCase().includes(q)
      );
    });
  }, [items, searchQuery, routeFilter]);

  const handleDelete = async (id: string) => {
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

  const printRouteManifest = () => {
    if (filtered.length === 0) {
      toast.error('No students in current filter to print');
      return;
    }
    const routeObj = routes.find(r => r.id === routeFilter);
    const title = routeObj
      ? `Bus Manifest: ${routeObj.name} (${routeObj.vehicle?.registrationNo || 'Bus'})`
      : 'Complete School Transport Manifest';

    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;
    win.document.write(`
      <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
          h1 { font-size: 18px; margin-bottom: 4px; }
          p { font-size: 12px; color: #475569; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
          th { background: #eef2ff; color: #1e3a8a; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p>Total Riders: ${filtered.length} &bull; Generated on ${new Date().toLocaleDateString('en-IN')}</p>
        <table>
          <thead>
            <tr>
              <th>#</th><th>Student Name</th><th>Roll No</th><th>Class</th><th>Boarding Stop</th><th>Pickup / Drop</th><th>Parent Phone</th>
            </tr>
          </thead>
          <tbody>
            ${filtered
              .map(
                (r, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td><strong>${r.student?.user?.name || ''}</strong></td>
                <td>${r.student?.rollNo || ''}</td>
                <td>${r.student?.class?.name || ''} ${r.student?.class?.section || ''}</td>
                <td>${r.stop?.stopName || ''}</td>
                <td>${r.stop?.pickupTime || '--'} / ${r.stop?.dropTime || '--'}</td>
                <td>${r.student?.fatherPhone || r.student?.user?.phone || '-'}</td>
              </tr>`
              )
              .join('')}
          </tbody>
        </table>
      </body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
  };

  const printBusPass = (r: any) => {
    const win = window.open('', '_blank', 'width=500,height=400');
    if (!win) return;
    win.document.write(`
      <html>
      <head>
        <title>Bus Pass - ${r.student?.user?.name}</title>
        <style>
          body { font-family: Arial, sans-serif; display: flex; justify-content: center; padding: 30px; }
          .pass { width: 340px; border: 2px solid #1e3a8a; border-radius: 14px; overflow: hidden; }
          .head { background: #1e3a8a; color: #fff; padding: 12px; text-align: center; font-weight: 900; font-size: 14px; }
          .body { padding: 14px; font-size: 12px; line-height: 1.6; }
          .badge { background: #fef3c7; color: #92400e; padding: 3px 10px; border-radius: 99px; font-weight: bold; font-size: 11px; display: inline-block; margin-bottom: 8px; }
        </style>
      </head>
      <body>
        <div class="pass">
          <div class="head">OFFICIAL STUDENT BUS PASS</div>
          <div class="body">
            <div class="badge">BUS: ${r.route?.vehicle?.registrationNo || 'Assigned'} &bull; ${r.route?.name || ''}</div>
            <div><strong>Name:</strong> ${r.student?.user?.name || ''}</div>
            <div><strong>Roll No:</strong> ${r.student?.rollNo || ''}</div>
            <div><strong>Class:</strong> ${r.student?.class?.name || ''} - ${r.student?.class?.section || ''}</div>
            <div><strong>Boarding Stop:</strong> ${r.stop?.stopName || ''}</div>
            <div><strong>Timing:</strong> ${r.stop?.pickupTime || '--'} / ${r.stop?.dropTime || '--'}</div>
            <div><strong>Emergency Phone:</strong> ${r.student?.fatherPhone || r.student?.user?.phone || 'N/A'}</div>
          </div>
        </div>
      </body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
  };

  return (
    <div className="min-h-screen bg-[#F4F7FC] text-slate-800 pb-12">
      <PageHeader
        title="Student Transport & Bus Passes"
        icon={<Users className="w-5 h-5" />}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/transport"
              className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-extrabold flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Command Center</span>
            </Link>
            <button
              type="button"
              onClick={printRouteManifest}
              className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Manifest</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setFormData({ studentId: '', routeId: '', stopId: '' });
                setShowModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:brightness-105 text-white text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Assign Student</span>
            </button>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-5">
        <div className="bg-white rounded-[20px] border border-indigo-100 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search student, roll no, or stop..."
              className="w-full pl-9 pr-3 py-2 bg-[#F8FAFF] border border-indigo-100 rounded-xl text-xs font-bold outline-none"
            />
          </div>

          <select
            value={routeFilter}
            onChange={e => setRouteFilter(e.target.value)}
            className="px-3.5 py-2 bg-[#F8FAFF] border border-indigo-100 rounded-xl text-xs font-extrabold text-slate-800 outline-none"
          >
            <option value="">All Routes ({items.length})</option>
            {routes.map(r => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.vehicle?.registrationNo || 'No Bus'})
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="bg-white rounded-[24px] shadow-xs border border-indigo-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-[#F8FAFF] text-slate-600 text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Class &amp; Roll</th>
                    <th className="px-6 py-4">Route &amp; Bus</th>
                    <th className="px-6 py-4">Stop &amp; Timing</th>
                    <th className="px-6 py-4 text-center">Monthly Fee</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center text-slate-400 font-bold">
                        No students assigned in this filter.
                      </td>
                    </tr>
                  ) : (
                    filtered.map(r => (
                      <tr key={r.id} className="hover:bg-[#FAFBFD] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-fuchsia-50 flex items-center justify-center border border-fuchsia-100 shrink-0 font-black text-fuchsia-700">
                              {r.student?.user?.name?.charAt(0) || <User className="w-4 h-4" />}
                            </div>
                            <div>
                              <div className="font-black text-slate-900 text-sm">{r.student?.user?.name}</div>
                              <div className="text-[11px] font-semibold text-slate-500">
                                Ph: {r.student?.fatherPhone || r.student?.user?.phone || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-extrabold text-slate-800">
                            {r.student?.class?.name} {r.student?.class?.section ? `- ${r.student.class.section}` : ''}
                          </div>
                          <div className="text-[11px] text-slate-500 font-semibold">Roll: {r.student?.rollNo || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <MapIcon className="w-3 h-3" /> {r.route?.name}
                          </span>
                          <div className="text-[11px] font-bold text-slate-500 mt-1">
                            {r.route?.vehicle?.registrationNo || 'Unassigned'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 mt-0.5 shrink-0" />
                            <div>
                              <div className="font-bold text-slate-900">{r.stop?.stopName || 'Unknown Stop'}</div>
                              <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                                {r.stop?.pickupTime || '--'} <ChevronRight className="w-3 h-3" /> {r.stop?.dropTime || '--'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center gap-0.5 font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                            <IndianRupee className="w-3 h-3" />
                            {r.stop?.monthlyFee ?? 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => printBusPass(r)}
                              className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-xl font-extrabold text-[11px] inline-flex items-center gap-1 cursor-pointer transition-colors"
                              title="Print Bus Pass"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Pass</span>
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
                    ))
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
            <div className="bg-white rounded-[24px] p-6 w-full max-w-md shadow-2xl border border-indigo-100">
              <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
                <h2 className="text-base font-black text-slate-900">Assign Student Transport</h2>
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
                  <label className="block font-black text-slate-500 uppercase mb-1">Select Student *</label>
                  <select
                    required
                    value={formData.studentId}
                    onChange={e => setFormData({ ...formData, studentId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none"
                  >
                    <option value="">-- Choose Student --</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.user?.name} ({s.rollNo} • {s.class?.name || '-'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-black text-slate-500 uppercase mb-1">Select Route *</label>
                  <select
                    required
                    value={formData.routeId}
                    onChange={e => setFormData({ ...formData, routeId: e.target.value, stopId: '' })}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none"
                  >
                    <option value="">-- Choose Route --</option>
                    {routes.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.startPoint} to {r.endPoint})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-black text-slate-500 uppercase mb-1">Select Boarding Stop *</label>
                  <select
                    required
                    disabled={!formData.routeId || availableStops.length === 0}
                    value={formData.stopId}
                    onChange={e => setFormData({ ...formData, stopId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFF] border border-indigo-100 rounded-xl font-bold outline-none disabled:opacity-50"
                  >
                    <option value="">
                      {availableStops.length === 0 && formData.routeId ? '-- No Stops Found --' : '-- Choose Stop --'}
                    </option>
                    {availableStops.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.stopName} (₹{s.monthlyFee}/mo)
                      </option>
                    ))}
                  </select>
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
                    disabled={isSubmitting || !formData.stopId}
                    className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black rounded-xl cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : 'Assign Transport'}
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

export default StudentTransportPage;
