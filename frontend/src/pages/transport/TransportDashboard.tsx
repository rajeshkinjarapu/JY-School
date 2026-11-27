import React, { useEffect, useState } from 'react';
import {
  Bus,
  Map as MapIcon,
  Users,
  Wrench,
  Fuel,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  IndianRupee,
  AlertTriangle,
  Navigation,
  Phone,
  UserCheck,
  Clock,
  CheckCircle2,
  Armchair,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';
import { PageHeader } from '../../components/UI/PageHeader';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

export const TransportDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/transport/dashboard');
      const payload = res?.data?.data !== undefined ? res.data.data : res?.data;
      setStats(payload);
    } catch {
      toast.error('Failed to load transport dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const modules = [
    {
      title: 'Bus Routes & Stops',
      description: 'Manage routes, boarding stops & fees',
      icon: MapIcon,
      bg: 'from-[#E0F2FE] to-[#BAE6FD] border-sky-200',
      iconBg: 'bg-sky-600',
      to: '/transport/routes',
    },
    {
      title: 'Vehicles & Compliance',
      description: 'Fleet specs, Insurance, FC, Permit & PUC',
      icon: Bus,
      bg: 'from-[#EEF2FF] to-[#E0E7FF] border-indigo-200',
      iconBg: 'bg-indigo-600',
      to: '/transport/vehicles',
    },
    {
      title: 'Drivers & Crew',
      description: 'Drivers, attendants & license tracking',
      icon: UserCheck,
      bg: 'from-[#F5F3FF] to-[#EDE9FE] border-violet-200',
      iconBg: 'bg-violet-600',
      to: '/transport/crew',
    },
    {
      title: 'Student Boarding & Pass',
      description: 'Assign stops, print manifests & passes',
      icon: Users,
      bg: 'from-[#FDF2F8] to-[#FCE7F3] border-pink-200',
      iconBg: 'bg-pink-600',
      to: '/transport/students',
    },
    {
      title: 'Daily Trip Dispatch',
      description: 'Morning & evening shift run logs',
      icon: Navigation,
      bg: 'from-[#ECFDF5] to-[#D1FAE5] border-emerald-200',
      iconBg: 'bg-emerald-600',
      to: '/transport/trips',
    },
    {
      title: 'Fuel & Mileage Logs',
      description: 'Track diesel refills, liters & cost',
      icon: Fuel,
      bg: 'from-[#FFFBEB] to-[#FEF3C7] border-amber-200',
      iconBg: 'bg-amber-600',
      to: '/transport/fuel-logs',
    },
    {
      title: 'Workshop & Repairs',
      description: 'Servicing, spare parts & bills',
      icon: Wrench,
      bg: 'from-[#FFF1F2] to-[#FFE4E6] border-rose-200',
      iconBg: 'bg-rose-600',
      to: '/transport/maintenance-logs',
    },
  ];

  if (loading && !stats) return <LoadingSpinner size="lg" className="h-[70vh]" />;

  const isManager = user?.role === 'TRANSPORT_MANAGER';
  const busOccupancy: any[] = stats?.busOccupancy || [];
  const complianceAlerts: any[] = stats?.complianceAlerts || [];
  const chartData: any[] = stats?.monthlySpendChart || [];
  const recentFuel: any[] = stats?.recentFuelLogs || [];
  const recentMaint: any[] = stats?.recentMaintenanceLogs || [];

  return (
    <div className="min-h-screen bg-[#F4F7FC] text-slate-800 pb-12">
      <PageHeader
        title={isManager ? `Fleet Command Center • ${user?.name || 'Transport Mgr'}` : 'Transport & Fleet Command Center'}
        icon={<Bus className="w-5 h-5" />}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={fetchStats}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <Link
              to="/transport/trips"
              className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-extrabold flex items-center gap-1.5 transition-all"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Log Trip</span>
            </Link>
            <Link
              to="/transport/fuel-logs"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:brightness-105 text-white text-xs font-black shadow-md flex items-center gap-1.5 transition-all"
            >
              <Fuel className="w-3.5 h-3.5" />
              <span>+ Add Fuel</span>
            </Link>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* 6 REAL-TIME LIGHT PASTEL KPI CARDS                              */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* KPI 1: Fleet Readiness */}
          <div className="bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF] border border-indigo-200/80 rounded-[22px] p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700/85">Active Fleet</span>
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Bus className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <h3 className="text-2xl font-black text-slate-900">
                {stats?.activeVehicles ?? 0} <span className="text-sm font-bold text-slate-500">/ {stats?.totalVehicles ?? 0}</span>
              </h3>
              <p className="text-[11px] font-bold text-indigo-700 mt-0.5">
                {stats?.totalCapacity ?? 0} Seats • {stats?.maintenanceVehicles ?? 0} Maint
              </p>
            </div>
          </div>

          {/* KPI 2: Seat Occupancy */}
          <div className="bg-gradient-to-br from-[#ECFDF5] to-[#D1FAE5] border border-emerald-200/80 rounded-[22px] p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700/85">Seat Occupancy</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <Armchair className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <h3 className="text-2xl font-black text-slate-900">{stats?.seatOccupancyPct ?? 0}%</h3>
              <p className="text-[11px] font-bold text-emerald-800 mt-0.5">
                {stats?.totalStudents ?? 0} Riders Mapped
              </p>
            </div>
          </div>

          {/* KPI 3: Routes & Stops */}
          <div className="bg-gradient-to-br from-[#E0F2FE] to-[#BAE6FD] border border-sky-200/80 rounded-[22px] p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-800/85">Routes &amp; Stops</span>
              <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-xs">
                <MapIcon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <h3 className="text-2xl font-black text-slate-900">{stats?.totalRoutes ?? 0}</h3>
              <p className="text-[11px] font-bold text-sky-800 mt-0.5">
                {stats?.totalStops ?? 0} Boarding Stops
              </p>
            </div>
          </div>

          {/* KPI 4: Expected Monthly Bus Revenue */}
          <div className="bg-gradient-to-br from-[#F5F3FF] to-[#EDE9FE] border border-violet-200/80 rounded-[22px] p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-violet-700/85">Monthly Fee</span>
              <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-xs">
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <h3 className="text-2xl font-black text-slate-900">
                ₹{(stats?.expectedMonthlyRevenue ?? 0).toLocaleString('en-IN')}
              </h3>
              <p className="text-[11px] font-bold text-violet-800 mt-0.5">Projected Stop Revenue</p>
            </div>
          </div>

          {/* KPI 5: Fuel Spend (Month) */}
          <div className="bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] border border-amber-200/80 rounded-[22px] p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800/85">Fuel (Month)</span>
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <Fuel className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <h3 className="text-2xl font-black text-slate-900">
                ₹{Math.round(stats?.monthlyFuelCost ?? 0).toLocaleString('en-IN')}
              </h3>
              <p className="text-[11px] font-bold text-amber-800 mt-0.5">
                {Math.round(stats?.monthlyFuelLiters ?? 0)} L • ₹{stats?.avgFuelRate ?? 0}/L
              </p>
            </div>
          </div>

          {/* KPI 6: Maintenance & Compliance */}
          <div className="bg-gradient-to-br from-[#FFF1F2] to-[#FFE4E6] border border-rose-200/80 rounded-[22px] p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-700/85">Maint &amp; Alerts</span>
              <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
                <Wrench className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <h3 className="text-2xl font-black text-slate-900">
                ₹{Math.round(stats?.monthlyMaintenanceCost ?? 0).toLocaleString('en-IN')}
              </h3>
              <p className="text-[11px] font-bold text-rose-800 mt-0.5">
                {stats?.expiringDocsCount ?? 0} Expiring Docs
              </p>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* QUICK MODULE DOCK (7 LIVE ROUTES)                               */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3.5">
          {modules.map(mod => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.to}
                to={mod.to}
                className={`group bg-gradient-to-br ${mod.bg} border rounded-[20px] p-4 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl ${mod.iconBg} text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 leading-tight">{mod.title}</h4>
                  <p className="text-[11px] font-semibold text-slate-600 mt-1 line-clamp-2">{mod.description}</p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* MAIN ANALYTICS + OCCUPANCY + COMPLIANCE GRID                    */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* LEFT 2 COLUMNS: Spend Chart + Live Route Occupancy */}
          <div className="lg:col-span-2 space-y-6">
            {/* 6-Month Fuel vs Maintenance Spend */}
            <div className="bg-white rounded-[24px] border border-indigo-100/90 shadow-xs p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900">6-Month Fleet Operating Cost</h3>
                  <p className="text-xs font-medium text-slate-500">Monthly diesel fuel spend vs workshop maintenance costs</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-[11px] font-black">
                  Live ERP Analytics
                </span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} />
                    <RechartsTooltip
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e0e7ff', fontSize: '12px', fontWeight: 700 }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 700 }} />
                    <Bar dataKey="fuel" name="Fuel Cost (₹)" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="maintenance" name="Maintenance (₹)" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Live Route & Seat Occupancy Board */}
            <div className="bg-white rounded-[24px] border border-indigo-100/90 shadow-xs overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-[#EEF2FF] via-[#F5F3FF] to-[#E0F2FE] border-b border-indigo-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900">Route-Wise Fleet &amp; Seat Occupancy</h3>
                  <p className="text-xs font-medium text-slate-600">Assigned riders, bus capacity, driver contact &amp; expected route fee</p>
                </div>
                <Link to="/transport/students" className="text-xs font-black text-indigo-700 hover:underline">
                  Manage Riders →
                </Link>
              </div>

              <div className="p-5 space-y-3">
                {busOccupancy.length === 0 ? (
                  <div className="py-10 text-center text-xs font-bold text-slate-400">
                    No routes configured yet. Add a vehicle and route to see live seat occupancy.
                  </div>
                ) : (
                  busOccupancy.map(bus => (
                    <div
                      key={bus.routeId}
                      className="p-4 rounded-2xl border border-slate-200/80 bg-[#FAFBFD] hover:bg-white transition-colors space-y-2.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-black">
                            {bus.vehicleNo}
                          </span>
                          <h4 className="text-sm font-black text-slate-900">{bus.routeName}</h4>
                          <span className="text-[11px] font-bold text-slate-500">
                            ({bus.startPoint} → {bus.endPoint})
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {bus.overloaded && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-black">
                              OVER CAPACITY
                            </span>
                          )}
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-black">
                            ₹{Number(bus.expectedRevenue || 0).toLocaleString('en-IN')}/mo
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              bus.overloaded
                                ? 'bg-rose-600'
                                : bus.occupancyPct >= 80
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, bus.occupancyPct)}%` }}
                          />
                        </div>
                        <span className="text-xs font-black text-slate-800 whitespace-nowrap">
                          {bus.assignedStudents} / {bus.capacity} Seats ({bus.occupancyPct}%)
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-slate-500 pt-0.5">
                        <span>{bus.stopsCount} Stops • Status: {bus.vehicleStatus}</span>
                        {bus.driverName ? (
                          <span className="inline-flex items-center gap-1.5 text-slate-700">
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span>
                              Driver: <strong>{bus.driverName}</strong> {bus.driverPhone ? `(${bus.driverPhone})` : ''}
                            </span>
                          </span>
                        ) : (
                          <Link to="/transport/crew" className="text-indigo-600 hover:underline">
                            + Assign Driver
                          </Link>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Compliance Alerts + Today Trips + Recent Logs */}
          <div className="space-y-5">
            {/* Compliance & Document Expiry Watchlist */}
            <div className="bg-white rounded-[24px] border border-rose-100 shadow-xs overflow-hidden">
              <div className="px-5 py-3.5 bg-gradient-to-r from-[#FFF1F2] via-[#FFFBEB] to-[#FEF2F2] border-b border-rose-100 flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-rose-600" />
                  <span>Document Expiry Watchlist</span>
                </h3>
                <Link to="/transport/vehicles" className="text-[11px] font-black text-rose-700 hover:underline">
                  Manage →
                </Link>
              </div>
              <div className="p-4 space-y-2">
                {complianceAlerts.length === 0 ? (
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>No Insurance, FC, Permit or License expiring within 30 days.</span>
                  </div>
                ) : (
                  complianceAlerts.slice(0, 6).map(al => (
                    <div
                      key={al.id}
                      className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
                        al.daysLeft <= 0
                          ? 'bg-rose-50 border-rose-200 text-rose-900'
                          : 'bg-amber-50 border-amber-200 text-amber-900'
                      }`}
                    >
                      <div>
                        <p className="font-black">{al.title}</p>
                        <p className="text-[11px] font-bold opacity-80">{al.docType}</p>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-white text-[10px] font-black border border-current/20">
                        {al.daysLeft <= 0 ? 'Expired' : `${al.daysLeft}d left`}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Today's Trip Dispatch Snapshot */}
            <div className="bg-white rounded-[24px] border border-emerald-100 shadow-xs p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>Today's Trip Dispatch</span>
                </h3>
                <Link to="/transport/trips" className="text-xs font-black text-emerald-700 hover:underline">
                  Log Shift →
                </Link>
              </div>
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase text-emerald-800">Trips Logged Today</p>
                  <p className="text-2xl font-black text-slate-900">{stats?.todayTripsCount ?? 0}</p>
                </div>
                <div className="text-right text-xs font-bold text-emerald-800">
                  <p>{stats?.crewCount ?? 0} Active Crew</p>
                  <p>{stats?.totalRoutes ?? 0} Active Routes</p>
                </div>
              </div>
            </div>

            {/* Recent Fuel & Repairs Feed */}
            <div className="bg-white rounded-[24px] border border-indigo-100 shadow-xs p-5 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <Fuel className="w-3.5 h-3.5 text-amber-600" />
                    <span>Recent Fuel Refills</span>
                  </h4>
                  <Link to="/transport/fuel-logs" className="text-[11px] font-bold text-indigo-600 hover:underline">
                    View All
                  </Link>
                </div>
                <div className="space-y-1.5 text-xs">
                  {recentFuel.length === 0 ? (
                    <p className="text-slate-400 font-semibold py-2">No fuel refills recorded yet.</p>
                  ) : (
                    recentFuel.map(f => (
                      <div key={f.id} className="p-2.5 rounded-xl bg-[#FAFBFD] border border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="font-black text-slate-800">{f.vehicle?.registrationNo || 'Vehicle'}</p>
                          <p className="text-[10px] font-semibold text-slate-500">
                            {f.liters}L • {new Date(f.date).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                        <span className="font-black text-amber-700">₹{Math.round(f.totalCost).toLocaleString('en-IN')}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Recent Maintenance</span>
                  </h4>
                  <Link to="/transport/maintenance-logs" className="text-[11px] font-bold text-indigo-600 hover:underline">
                    View All
                  </Link>
                </div>
                <div className="space-y-1.5 text-xs">
                  {recentMaint.length === 0 ? (
                    <p className="text-slate-400 font-semibold py-2">No workshop logs recorded yet.</p>
                  ) : (
                    recentMaint.map(m => (
                      <div key={m.id} className="p-2.5 rounded-xl bg-[#FAFBFD] border border-slate-100 flex items-center justify-between">
                        <div className="min-w-0 pr-2">
                          <p className="font-black text-slate-800 truncate">{m.vehicle?.registrationNo || 'Vehicle'}</p>
                          <p className="text-[10px] font-semibold text-slate-500 truncate">{m.description}</p>
                        </div>
                        <span className="font-black text-rose-700 shrink-0">₹{Math.round(m.cost).toLocaleString('en-IN')}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TransportDashboard;
