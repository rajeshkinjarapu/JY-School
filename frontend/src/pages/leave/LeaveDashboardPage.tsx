import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';
import { 
  Calendar, CheckCircle, Clock, XCircle, Plus, 
  Briefcase, FileText, UserCheck, TrendingUp,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

// Reusing LeaveTypePage and LeaveRequestLogPage as tabs, or building a new unified one
import LeaveTypeTab from './tabs/LeaveTypeTab';
import LeaveRequestTab from './tabs/LeaveRequestTab';

const LeaveDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  
  // Default tab based on role. Admins might want to see requests or types first
  const [activeTab, setActiveTab] = useState('requests');

  return (
    <div className="flex flex-col h-full bg-gray-50/50 -m-6" style={{ minHeight: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <div className="px-6 py-6 bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-700 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-2xl">
            <Calendar className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-white drop-shadow-sm">Leave Management</h1>
            <p className="text-white/80 text-sm font-medium mt-0.5">Manage leave requests and leave types.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6 overflow-auto">
        {/* Top Navigation Cards */}
        <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all cursor-pointer ${
              activeTab === 'requests'
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-md'
                : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200 hover:bg-gray-50'
            }`}
          >
            <FileText className={`w-8 h-8 mb-2 ${activeTab === 'requests' ? 'text-indigo-600' : 'text-gray-400'}`} />
            <span className="font-bold">Leave Requests</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab('types')}
              className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all cursor-pointer ${
                activeTab === 'types'
                  ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-md'
                  : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Briefcase className={`w-8 h-8 mb-2 ${activeTab === 'types' ? 'text-purple-600' : 'text-gray-400'}`} />
              <span className="font-bold">Leave Types</span>
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 min-h-[400px]">
          {activeTab === 'requests' && <LeaveRequestTab />}
          {activeTab === 'types' && isAdmin && <LeaveTypeTab />}
        </div>
      </div>
    </div>
  );
};

export default LeaveDashboardPage;
