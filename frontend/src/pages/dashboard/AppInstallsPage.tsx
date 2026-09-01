import React, { useState, useEffect } from 'react';
import { Smartphone, MonitorSmartphone, Calendar, RefreshCw, UserCircle, Wifi } from 'lucide-react';
import { api } from '../../api/axios';

interface AppInstallUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  deviceModel: string | null;
  appVersion: string | null;
  lastAppLoginAt: string;
  student?: {
    class: {
      name: string;
      section: string;
    } | null;
  } | null;
}

export const AppInstallsPage: React.FC = () => {
  const [users, setUsers] = useState<AppInstallUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInstalls = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/app-installs');
      setUsers(res.data.data);
    } catch (error) {
      console.error('Failed to fetch app installs', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstalls();
  }, []);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'STUDENT': return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900/30 dark:text-blue-300">Student</span>;
      case 'TEACHER': return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full dark:bg-green-900/30 dark:text-green-300">Teacher</span>;
      default: return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full dark:bg-gray-800 dark:text-gray-300">{role}</span>;
    }
  };

  const isOnline = (lastLogin: string) => {
    if (!lastLogin) return false;
    const diffHours = (new Date().getTime() - new Date(lastLogin).getTime()) / (1000 * 60 * 60);
    return diffHours < 24; // online in last 24h
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Smartphone className="w-6 h-6 text-indigo-500" />
            Mobile App Installs
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track students and teachers who have installed and are using the mobile app.
          </p>
        </div>
        <button
          onClick={fetchInstalls}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors shadow-sm disabled:opacity-50"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Refresh
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role & Class</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Device Info</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Active</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <RefreshCw className="mx-auto mb-2 w-6 h-6 animate-spin text-indigo-500" />
                    Loading app installs...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No app installations recorded yet.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr 
                    key={user.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-750/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold shrink-0">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{user.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{user.phone || user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        {getRoleBadge(user.role)}
                        {user.role === 'STUDENT' && user.student?.class && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {user.student.class.name} - {user.student.class.section}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                          <MonitorSmartphone className="w-4 h-4 text-gray-400" />
                          {user.deviceModel || 'Unknown Device'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 ml-5.5">
                          App Ver: {user.appVersion || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4" />
                        {user.lastAppLoginAt ? new Date(user.lastAppLoginAt).toLocaleDateString() : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-400 ml-5.5 mt-0.5">
                        {user.lastAppLoginAt ? new Date(user.lastAppLoginAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${isOnline(user.lastAppLoginAt) ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-gray-300 dark:bg-gray-600'}`} />
                        <span className={`text-sm font-medium ${isOnline(user.lastAppLoginAt) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                          {isOnline(user.lastAppLoginAt) ? 'Recently Active' : 'Offline'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
