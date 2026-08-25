import React, { useEffect, useState } from 'react';
import { Bus, Map, Users, Wrench, Fuel, ShieldCheck, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/UI/PageHeader';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';

export const TransportDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/api/transport/dashboard');
        setStats(res.data);
      } catch (e) {
        console.error('Failed to fetch stats', e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const tools = [
    { 
      title: 'BUS ROUTES & STOPS', 
      description: 'Manage bus routes and stops on Map', 
      icon: Map, 
      gradient: 'from-blue-500 to-cyan-400',
      shadow: 'shadow-blue-500/30',
      to: '/transport/routes'
    },
    { 
      title: 'VEHICLES', 
      description: 'Track fleet and details', 
      icon: Bus, 
      gradient: 'from-indigo-500 to-purple-500',
      shadow: 'shadow-indigo-500/30',
      to: '/transport/vehicles'
    },
    { 
      title: 'STUDENT TRANSPORT', 
      description: 'Map students to bus routes & fees', 
      icon: Users, 
      gradient: 'from-fuchsia-500 to-pink-500',
      shadow: 'shadow-fuchsia-500/30',
      to: '/transport/students'
    },
    { 
      title: 'FUEL LOGS', 
      description: 'Track diesel expenses', 
      icon: Fuel, 
      gradient: 'from-rose-500 to-orange-400',
      shadow: 'shadow-rose-500/30',
      to: '/transport/fuel'
    },
    { 
      title: 'MAINTENANCE', 
      description: 'Manage repairs and servicing', 
      icon: Wrench, 
      gradient: 'from-emerald-500 to-teal-400',
      shadow: 'shadow-emerald-500/30',
      to: '/transport/maintenance'
    }
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="flex-1 overflow-auto bg-gray-50/50" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader 
        title="Transport Dashboard" 
        icon={<Bus className="w-5 h-5" />} 
      />
      <div className="p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total Vehicles</p>
                  <p className="text-3xl font-bold text-gray-800">{stats.totalVehicles}</p>
                </div>
                <div className="p-4 bg-blue-50 text-blue-600 rounded-xl"><Bus className="w-6 h-6" /></div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Active Routes</p>
                  <p className="text-3xl font-bold text-gray-800">{stats.totalRoutes}</p>
                </div>
                <div className="p-4 bg-green-50 text-green-600 rounded-xl"><Map className="w-6 h-6" /></div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Fuel Cost (Month)</p>
                  <p className="text-3xl font-bold text-gray-800">₹{stats.monthlyFuelCost.toFixed(0)}</p>
                </div>
                <div className="p-4 bg-orange-50 text-orange-600 rounded-xl"><Fuel className="w-6 h-6" /></div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Maintenance (Month)</p>
                  <p className="text-3xl font-bold text-gray-800">₹{stats.monthlyMaintenanceCost.toFixed(0)}</p>
                </div>
                <div className="p-4 bg-red-50 text-red-600 rounded-xl"><Wrench className="w-6 h-6" /></div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {tools.map((tool, index) => {
              const Icon = tool.icon;
              return (
                <Link 
                  to={tool.to}
                  key={index} 
                  className="group relative bg-white/60 dark:bg-slate-900/40 backdrop-blur-md border border-white/20 dark:border-slate-800 p-6 rounded-3xl shadow-lg hover:shadow-xl hover:bg-white/80 dark:hover:bg-slate-900/60 transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden flex flex-col items-start gap-4 animate-fade-in-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${tool.gradient} opacity-80`} />
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 bg-gradient-to-br ${tool.gradient}`}></div>
                  
                  <div className={`relative z-10 p-4 rounded-2xl bg-gradient-to-br ${tool.gradient} shadow-lg ${tool.shadow} text-white group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                    <Icon className="w-6 h-6" strokeWidth={2} />
                  </div>
                  
                  <div className="relative z-10 w-full mt-2">
                    <div className="flex items-center justify-between w-full">
                      <h3 className="font-extrabold text-slate-800 dark:text-white text-lg group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-slate-800 group-hover:to-slate-600 transition-colors leading-tight">{tool.title}</h3>
                      <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors transform group-hover:translate-x-1 shrink-0" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-3 font-semibold leading-relaxed bg-slate-50/50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">{tool.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransportDashboard;
