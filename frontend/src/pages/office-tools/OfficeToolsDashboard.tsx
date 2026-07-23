import React from 'react';
import { Briefcase, FileText, Settings, Database, Server, Image, Calendar, Book } from 'lucide-react';

export const OfficeToolsDashboard = () => {
  const tools = [
    { title: 'Tool 1', description: 'Description for tool 1', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' },
    { title: 'Tool 2', description: 'Description for tool 2', icon: Settings, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { title: 'Tool 3', description: 'Description for tool 3', icon: Database, color: 'text-purple-500', bg: 'bg-purple-50' },
    { title: 'Tool 4', description: 'Description for tool 4', icon: Server, color: 'text-pink-500', bg: 'bg-pink-50' },
    { title: 'Tool 5', description: 'Description for tool 5', icon: Image, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { title: 'Tool 6', description: 'Description for tool 6', icon: Calendar, color: 'text-orange-500', bg: 'bg-orange-50' },
    { title: 'Tool 7', description: 'Description for tool 7', icon: Book, color: 'text-cyan-500', bg: 'bg-cyan-50' },
    { title: 'Tool 8', description: 'Description for tool 8', icon: Briefcase, color: 'text-gray-500', bg: 'bg-gray-50' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <span className="p-2.5 bg-indigo-50 rounded-xl">
              <Briefcase className="w-6 h-6 text-indigo-600" />
            </span>
            Office Tools
          </h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">Manage and access all office utility tools from this dashboard.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {tools.map((tool, index) => {
          const Icon = tool.icon;
          return (
            <div 
              key={index} 
              className="group bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:border-indigo-100 cursor-pointer flex flex-col items-start gap-4"
            >
              <div className={`p-4 rounded-xl ${tool.bg} group-hover:scale-110 transition-transform duration-300`}>
                <Icon className={`w-6 h-6 ${tool.color}`} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors">{tool.title}</h3>
                <p className="text-slate-500 text-sm mt-1">{tool.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OfficeToolsDashboard;
