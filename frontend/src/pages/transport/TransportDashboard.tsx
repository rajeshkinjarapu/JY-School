import React, { useEffect, useMemo, useState } from 'react';
import {
  Bus,
  MapPin,
  Users,
  IndianRupee,
  UserCheck,
  Navigation,
  Fuel,
  Wrench,
  ChevronRight,
  RefreshCw,
  Phone,
  Search,
  AlertTriangle,
  Plus,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/UI/PageHeader';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

export const TransportDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/transport/dashboard');
      const payload = res?.data?.data !== undefined ? res.data.data : res?.data;
      setStats(payload);
    } catch {
      toast.error('Failed to load transport summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const busOccupancy: any[] = stats?.busOccupancy || [];
  const complianceAlerts: any[] = stats?.complianceAlerts || [];

  const filteredRoutes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return busOccupancy;
    return busOccupancy.filter(
      b =>
        (b.routeName || '').toLowerCase().includes(q) ||
        (b.vehicleNo || '').toLowerCase().includes(q) ||
        (b.driverName || '').toLowerCase().includes(q) ||
        (b.startPoint || '').toLowerCase().includes(q) ||
        (b.endPoint || '').toLowerCase().includes(q)
    );
  }, [busOccupancy, searchQuery]);

  if (loading && !stats) return <LoadingSpinner size="lg" className="h-[70vh]" />;

  const isManager = user?.role === 'TRANSPORT_MANAGER';

  const coreSections = [
    {
      title: 'Buses & Vehicles',
      subtitle: 'Add buses, seating capacity & RC / Insurance dates',
      countLabel: `${stats?.totalVehicles ?? 0} Buses`,
      icon: Bus,
      iconBg: 'bg-indigo-600',
      badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      to: '/transport/vehicles',
    },
    {
      title: 'Routes & Bus Stops',
      subtitle: 'Create bus routes, pickup stops & monthly bus fee',
      countLabel: `${stats?.totalRoutes ?? 0} Routes · ${stats?.totalStops ?? 0} Stops`,
      icon: MapPin,
      iconBg: 'bg-sky-600',
      badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
      to: '/transport/routes',
    },
    {
      title: 'Drivers & Helpers',
      subtitle: 'Manage driver names, phone numbers & licenses',
      countLabel: `${stats?.crewCount ?? 0} Staff`,
      icon: UserCheck,
      iconBg: 'bg-violet-600',
      badgeClass: 'bg-violet-50 text-violet-700 border-violet-200',
      to: '/transport/crew',
    },
    {
      title: 'Student Bus Allocation',
      subtitle: 'Assign students to buses/stops & print bus pass',
      countLabel: `${stats?.totalStudents ?? 0} Students`,
      icon: Users,
      iconBg: 'bg-emerald-600',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      to: '/transport/students',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F4F7FC] text-slate-800 pb-12">
      <PageHeader
        title={isManager ? `Transport Portal · ${user?.name || 'Manager'}` : 'Transport Management'}
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
              to="/transport/students"
              className="px-4 py-2 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 text-xs font-black shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Assign Student Bus</span>
            </Link>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Optional Alert Banner: Only visible when any Bus Insurance/FC/License is actually expiring */}
        {complianceAlerts.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-amber-900">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <span className="text-xs sm:text-sm font-black">
                {complianceAlerts.length} Vehicle / Driver document{complianceAlerts.length > 1 ? 's' : ''} expiring soon ({complianceAlerts[0]?.title} - {complianceAlerts[0]?.docType})
              </span>
            </div>
            <Link
              to="/transport/vehicles"
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black transition-all"
            >
              Check Documents →
            </Link>
          </div>
        )}

        {/* 1. CLEAN 4 ESSENTIAL KPI SUMMARY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/transport/vehicles"
            className="bg-white border border-indigo-100 hover:border-indigo-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Bus className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">School Buses</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">
                {stats?.activeVehicles ?? 0} <span className="text-sm font-bold text-slate-400">/ {stats?.totalVehicles ?? 0}</span>
              </p>
              <p className="text-xs font-bold text-indigo-600">{stats?.totalCapacity ?? 0} Total Seats</p>
            </div>
          </Link>

          <Link
            to="/transport/routes"
            className="bg-white border border-sky-100 hover:border-sky-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
              <MapPin className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Bus Routes</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">{stats?.totalRoutes ?? 0}</p>
              <p className="text-xs font-bold text-sky-600">{stats?.totalStops ?? 0} Pickup Stops</p>
            </div>
          </Link>

          <Link
            to="/transport/students"
            className="bg-white border border-emerald-100 hover:border-emerald-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Bus Students</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">{stats?.totalStudents ?? 0}</p>
              <p className="text-xs font-bold text-emerald-600">{stats?.seatOccupancyPct ?? 0}% Seats Filled</p>
            </div>
          </Link>

          <Link
            to="/transport/routes"
            className="bg-white border border-violet-100 hover:border-violet-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
              <IndianRupee className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Monthly Bus Fee</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">
                ₹{(stats?.expectedMonthlyRevenue ?? 0).toLocaleString('en-IN')}
              </p>
              <p className="text-xs font-bold text-violet-600">{stats?.crewCount ?? 0} Drivers &amp; Helpers</p>
            </div>
          </Link>
        </div>

        {/* 2. 4 SIMPLE PRIMARY SETUP & MANAGEMENT SECTIONS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {coreSections.map(item => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className="group bg-white border border-slate-200/80 hover:border-indigo-300 rounded-2xl p-5 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all flex flex-col justify-between gap-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className={`w-11 h-11 rounded-2xl ${item.iconBg} text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-black border ${item.badgeClass}`}>
                    {item.countLabel}
                  </span>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-black text-slate-900 group-hover:text-indigo-700 transition-colors">
                      {item.title}
                    </h3>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="text-xs font-semibold text-slate-500 mt-1 leading-relaxed">
                    {item.subtitle}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* 3. COMPACT DAILY LOGS BAR (OPTIONAL LOGS WITHOUT CLUTTER) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl px-5 py-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500">
            Daily Transport Registers:
          </span>
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/transport/trips"
              className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-extrabold flex items-center gap-1.5 transition-all"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Daily Trips ({stats?.todayTripsCount ?? 0} today)</span>
            </Link>
            <Link
              to="/transport/fuel-logs"
              className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-extrabold flex items-center gap-1.5 transition-all"
            >
              <Fuel className="w-3.5 h-3.5" />
              <span>Diesel / Fuel (₹{Math.round(stats?.monthlyFuelCost ?? 0).toLocaleString('en-IN')})</span>
            </Link>
            <Link
              to="/transport/maintenance-logs"
              className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-extrabold flex items-center gap-1.5 transition-all"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Repairs &amp; Service (₹{Math.round(stats?.monthlyMaintenanceCost ?? 0).toLocaleString('en-IN')})</span>
            </Link>
          </div>
        </div>

        {/* 4. SINGLE CLEAN FULL-WIDTH TABLE: BUSES & ROUTES SUMMARY */}
        <div className="bg-white border border-indigo-100/90 rounded-[24px] shadow-xs overflow-hidden">
          <div className="px-6 py-4 bg-[#F8FAFF] border-b border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-slate-900">Buses &amp; Routes Summary</h3>
              <p className="text-xs font-semibold text-slate-500">
                Simple overview of every school bus, assigned route, driver phone, and student seats
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search route, bus no, driver..."
                className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
              />
            </div>
          </div>

          {filteredRoutes.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <Bus className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-black text-slate-800">
                {busOccupancy.length === 0 ? 'No Buses or Routes Linked Yet' : 'No matching routes found'}
              </h4>
              <p className="text-xs font-semibold text-slate-500 max-w-md mx-auto">
                Step 1: Add your school buses in <strong>Buses &amp; Vehicles</strong>. Step 2: Link a bus when creating a route in <strong>Routes &amp; Bus Stops</strong>.
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                <Link
                  to="/transport/vehicles"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-black shadow-xs hover:bg-indigo-700"
                >
                  + Add School Bus
                </Link>
                <Link
                  to="/transport/routes"
                  className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-black hover:bg-slate-50"
                >
                  Manage Routes
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-5">Route &amp; Stops</th>
                    <th className="py-3.5 px-4">Bus Number</th>
                    <th className="py-3.5 px-4">Driver &amp; Phone</th>
                    <th className="py-3.5 px-4">Students / Capacity</th>
                    <th className="py-3.5 px-4">Monthly Fee</th>
                    <th className="py-3.5 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredRoutes.map(bus => (
                    <tr key={bus.routeId} className="hover:bg-[#F8FAFF] transition-colors">
                      <td className="py-3.5 px-5">
                        <p className="font-black text-slate-900">{bus.routeName}</p>
                        <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                          {bus.startPoint} → {bus.endPoint} · {bus.stopsCount} Stops
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 font-black text-[11px]">
                          {bus.vehicleNo || 'Unassigned'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {bus.driverName ? (
                          <div className="font-bold text-slate-800">
                            <p>{bus.driverName}</p>
                            {bus.driverPhone && (
                              <p className="text-[11px] text-emerald-700 flex items-center gap-1 mt-0.5">
                                <Phone className="w-3 h-3" /> {bus.driverPhone}
                              </p>
                            )}
                          </div>
                        ) : (
                          <Link to="/transport/crew" className="text-indigo-600 font-extrabold hover:underline">
                            + Assign Driver
                          </Link>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                bus.overloaded
                                  ? 'bg-rose-600'
                                  : bus.occupancyPct >= 80
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, bus.occupancyPct || 0)}%` }}
                            />
                          </div>
                          <span className="font-black text-slate-800 whitespace-nowrap">
                            {bus.assignedStudents} / {bus.capacity || 0}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-black text-slate-900">
                        ₹{Number(bus.expectedRevenue || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <Link
                          to="/transport/students"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-700 font-extrabold text-[11px] transition-all"
                        >
                          <span>Students</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransportDashboard;
