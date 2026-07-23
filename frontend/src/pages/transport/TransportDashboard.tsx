import React from 'react';
import { Bus, Map, Users, Settings, Activity, Calendar, ShieldCheck, ChevronRight } from 'lucide-react';

export const TransportDashboard = () => {
  const tools = [
    { 
      title: 'BUS ROUTES', 
      description: 'Manage bus routes and stops', 
      icon: Map, 
      gradient: 'from-blue-500 to-cyan-400',
      shadow: 'shadow-blue-500/30'
    },
    { 
      title: 'VEHICLES', 
      description: 'Track fleet and maintenance', 
      icon: Bus, 
      gradient: 'from-indigo-500 to-purple-500',
      shadow: 'shadow-indigo-500/30'
    },
    { 
      title: 'DRIVERS & STAFF', 
      description: 'Manage transport personnel', 
      icon: Users, 
      gradient: 'from-fuchsia-500 to-pink-500',
      shadow: 'shadow-fuchsia-500/30'
    },
    { 
      title: 'LIVE TRACKING', 
      description: 'Real-time GPS tracking', 
      icon: Activity, 
      gradient: 'from-rose-500 to-orange-400',
      shadow: 'shadow-rose-500/30'
    },
    { 
      title: 'TRANSPORT FEE', 
      description: 'Manage fees and payments', 
      icon: Settings, 
      gradient: 'from-emerald-500 to-teal-400',
      shadow: 'shadow-emerald-500/30'
    },
    { 
      title: 'SCHEDULES', 
      description: 'View and update timings', 
      icon: Calendar, 
      gradient: 'from-amber-500 to-yellow-400',
      shadow: 'shadow-amber-500/30'
    },
    { 
      title: 'SAFETY COMPLIANCE', 
      description: 'Insurance and safety checks', 
      icon: ShieldCheck, 
      gradient: 'from-violet-500 to-indigo-500',
      shadow: 'shadow-violet-500/30'
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-800">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">TRANSPORT DASHBOARD</h2>
          <p className="text-slate-500 dark:text-gray-400 font-medium mt-1">Manage school transportation, routes, and vehicles.</p>
        </div>
        <div className="hidden md:flex w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white items-center justify-center shadow-lg shadow-indigo-500/30 transform hover:scale-110 transition-transform">
          <Bus className="w-8 h-8" strokeWidth={2.5} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {tools.map((tool, index) => {
          const Icon = tool.icon;
          return (
            <div 
              key={index} 
              className="group relative bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden flex flex-col items-start gap-4"
            >
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 bg-gradient-to-br ${tool.gradient}`}></div>
              
              <div className={`relative z-10 p-4 rounded-xl bg-gradient-to-br ${tool.gradient} shadow-lg ${tool.shadow} text-white group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                <Icon className="w-6 h-6" strokeWidth={2} />
              </div>
              
              <div className="relative z-10 w-full mt-2">
                <div className="flex items-center justify-between w-full">
                  <h3 className="font-extrabold text-slate-800 text-lg group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-slate-800 group-hover:to-slate-600 transition-colors">{tool.title}</h3>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 transition-colors transform group-hover:translate-x-1" />
                </div>
                <p className="text-slate-500 text-sm mt-1.5 font-medium leading-relaxed">{tool.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TransportDashboard;

