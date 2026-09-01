import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Badge } from '../../components/UI/Badge';
import { Trash2, AlertTriangle, Shield, CheckCircle, Save, Settings as SettingsIcon, Users, UserX, Database, Eye, School, CalendarDays, Search, Plus, Edit, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '../../components/UI/PageHeader';
import { useOutletContext } from 'react-router-dom';
import { DeleteRecordsTab } from './DeleteRecordsTab';
import { PaymentSettingsTab } from './PaymentSettingsTab';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'system' | 'users' | 'delete' | 'payments'>('system');
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const { setDynamicTitle } = (useOutletContext() as { setDynamicTitle?: (title: string) => void }) || {};

  useEffect(() => {
    if (setDynamicTitle) {
      setDynamicTitle(activeTab === 'system' ? 'System Settings' : 'User Management');
    }
  }, [activeTab, setDynamicTitle]);

  // System Settings States
  const [schoolName, setSchoolName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [currentYear, setCurrentYear] = useState('2024-2025');

  // Users Management States
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [usersPage, setUsersPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // User Form Modal States
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState('ADMIN');
  const [formPhone, setFormPhone] = useState('');
  const [isSavingUser, setIsSavingUser] = useState(false);

  const fetchSettings = async () => {
    try {
      const res: any = await api.get('/api/settings');
      const settings = res.data;
      if (settings) {
        setSchoolName(settings.schoolName);
        setAddress(settings.address || '');
        setPhone(settings.phone || '');
        setEmail(settings.email || '');
        setWebsite(settings.website || '');
        setCurrentYear(settings.currentYear || '2024-2025');
      }
    } catch (e) {
      toast.error('Failed to load system settings');
    } finally {
      setLoadingSettings(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res: any = await api.get('/api/users', {
        params: {
          page: usersPage,
          limit: 6,
          search: userSearch,
          role: userRoleFilter,
        },
      });
      setUsers(Array.isArray(res.data) ? res.data : (res.data?.data || []));
      setTotalUsers((res.data as any)?.meta?.total || 0);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load users directory');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab, usersPage, userRoleFilter]);

  // Debounced user search
  useEffect(() => {
    if (activeTab !== 'users') return;
    const timer = setTimeout(() => {
      setUsersPage(1);
      fetchUsers();
    }, 400);
    return () => clearTimeout(timer);
  }, [userSearch]);

  const handleSystemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.put('/api/settings', {
        schoolName,
        address,
        phone,
        email,
        website,
        currentYear,
      });
      toast.success('System settings saved successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Error updating settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenCreateModal = () => {
    setSelectedUser(null);
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormRole('ADMIN');
    setFormPhone('');
    setShowModal(true);
  };

  const handleOpenEditModal = (user: any) => {
    setSelectedUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormPassword(''); // blank to keep current
    setFormRole(user.role);
    setFormPhone(user.phone || '');
    setShowModal(true);
  };

  const handleSaveUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingUser(true);
    try {
      const payload: any = {
        name: formName,
        email: formEmail,
        role: formRole,
        phone: formPhone || null,
      };
      if (formPassword) payload.password = formPassword;

      if (selectedUser) {
        // Edit User
        await api.put(`/api/users/${selectedUser.id}`, payload);
        toast.success('User updated successfully!');
      } else {
        // Create User
        if (!formPassword) {
          toast.error('Password is required for new user account');
          setIsSavingUser(false);
          return;
        }
        await api.post('/api/users', payload);
        toast.success('New user account registered successfully!');
      }
      setShowModal(false);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Error saving user details');
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to deactivate this user account?')) return;
    try {
      await api.delete(`/api/users/${userId}`);
      toast.success('User account deactivated successfully');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to deactivate user');
    }
  };

  if (loadingSettings) return <LoadingSpinner size="lg" className="h-[50vh]" />;

  return (
    <div className="flex flex-col h-full bg-gray-50/50" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader 
        title="Settings & Administration" 
        icon={<Shield className="w-5 h-5" />} 
      />
      <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto w-full">

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-3 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md p-2 rounded-2xl border border-white/20 shadow-sm">
        <button
          onClick={() => setActiveTab('system')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
            activeTab === 'system'
              ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md shadow-indigo-500/30'
              : 'text-gray-600 hover:bg-white/60 dark:text-gray-300 dark:hover:bg-gray-800'
          }`}
        >
          <SettingsIcon className="w-4 h-4" /> System Config
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
            activeTab === 'users'
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md shadow-blue-500/30'
              : 'text-gray-600 hover:bg-white/60 dark:text-gray-300 dark:hover:bg-gray-800'
          }`}
        >
          <Users className="w-4 h-4" /> Roles & Users
        </button>
        <button
          onClick={() => setActiveTab('delete')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
            activeTab === 'delete'
              ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md shadow-rose-500/30'
              : 'text-gray-600 hover:bg-rose-50 dark:text-gray-300 dark:hover:bg-rose-950/30 hover:text-rose-600'
          }`}
        >
          <Trash2 className="w-4 h-4" /> Danger Zone
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
            activeTab === 'payments'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/30'
              : 'text-gray-600 hover:bg-emerald-50 dark:text-gray-300 dark:hover:bg-emerald-900/30 hover:text-emerald-600'
          }`}
        >
          <Key className="w-4 h-4" /> Payment Setup
        </button>
      </div>

      <div className="mt-6">
        {activeTab === 'payments' ? (
          <PaymentSettingsTab />
        ) : activeTab === 'system' ? (
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/40 dark:border-gray-800 rounded-3xl p-8 shadow-xl max-w-3xl mx-auto transform transition-all duration-500">
            <div className="mb-8">
              <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">Branding & System Info</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure global metadata tags and default academic session years.</p>
            </div>

            <form onSubmit={handleSystemSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">School Branding Name</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                      <School className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Springfield High"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Academic Session</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                      <CalendarDays className="w-5 h-5" />
                    </div>
                    <select
                      value={currentYear}
                      onChange={(e) => setCurrentYear(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none appearance-none"
                    >
                      <option value="2024-2025">2024-2025</option>
                      <option value="2025-2026">2025-2026</option>
                      <option value="2026-2027">2026-2027</option>
                      <option value="2027-2028">2027-2028</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Office Telephone</label>
                  <input
                    type="text"
                    placeholder="+91-9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Office Email</label>
                  <input
                    type="email"
                    placeholder="admin@school.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Website URL</label>
                  <input
                    type="text"
                    placeholder="https://school.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Physical Address</label>
                  <textarea
                    rows={3}
                    placeholder="Location details..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none resize-none"
                  ></textarea>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0 w-full md:w-auto"
                >
                  <Save className="w-5 h-5" />
                  <span>{isSaving ? 'Saving Configurations...' : 'Save Configurations'}</span>
                </button>
              </div>
            </form>
          </div>
        ) : activeTab === 'users' ? (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            {/* Action Header */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-4 rounded-2xl border border-white/40 dark:border-gray-800 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="relative w-full md:w-96 group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
              
              <div className="flex gap-3 w-full md:w-auto">
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">All Roles</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="ADMIN">Admin</option>
                  <option value="TEACHER">Teacher</option>
                  <option value="STUDENT">Student</option>
                </select>
                <button
                  onClick={handleOpenCreateModal}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-2.5 px-5 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap"
                >
                  <Plus className="w-5 h-5" /> Create User
                </button>
              </div>
            </div>

            {/* User Table list */}
            {loadingUsers ? (
              <div className="flex justify-center items-center h-64 bg-white/50 dark:bg-gray-900/50 rounded-3xl backdrop-blur-sm border border-white/20">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/40 dark:border-gray-800 rounded-3xl shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="bg-gray-50/50 dark:bg-gray-800/30 text-gray-500 dark:text-gray-400 font-extrabold text-[11px] uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
                        <th className="px-6 py-4">Name</th>
                        <th className="px-6 py-4">Login Details</th>
                        <th className="px-6 py-4">Password</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="font-bold text-gray-900 dark:text-white text-base">{user.name}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">{user.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400 tracking-[0.2em]">••••••••</span>
                              <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full border border-gray-200">Encrypted</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                              user.role === 'SUPER_ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800/50' :
                              user.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800/50' :
                              user.role === 'TEACHER' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50' :
                              'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`}></div>
                              <span className={`text-xs font-bold ${user.isActive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {user.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleOpenEditModal(user)}
                                className="p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all cursor-pointer"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                disabled={!user.isActive}
                                className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all cursor-pointer disabled:opacity-30 disabled:hover:bg-transparent"
                                title="Deactivate"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalUsers > 6 && (
                  <div className="flex items-center justify-between px-6 py-4 bg-gray-50/50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800">
                    <button
                      disabled={usersPage === 1}
                      onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                      className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      Previous
                    </button>
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-white/60 dark:bg-gray-800/60 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-700">
                      Page {usersPage} of {Math.ceil(totalUsers / 6)}
                    </span>
                    <button
                      disabled={usersPage * 6 >= totalUsers}
                      onClick={() => setUsersPage(p => p + 1)}
                      className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : activeTab === 'delete' ? (
          <div className="animate-in fade-in zoom-in-95 duration-300">
             <DeleteRecordsTab />
          </div>
        ) : null}
      </div>

      {/* User Form Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-300 border border-white/20">
            
            <div className="mb-6">
              <h3 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Shield className="w-6 h-6 text-indigo-500" />
                {selectedUser ? 'Edit User' : 'Create User'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
                Configure profile data, roles, and login credentials.
              </p>
            </div>

            <form onSubmit={handleSaveUserSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Full Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="e.g. Principal John Doe"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Login ID (Email/Student ID)</label>
                <input
                  type="text"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="e.g. principal@school.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                  Password {selectedUser && <span className="text-gray-400 font-normal normal-case">(Leave blank to keep)</span>}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                    <Key className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required={!selectedUser}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Security Role</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                    <Shield className="w-4 h-4" />
                  </div>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
                  >
                    <option value="SUPER_ADMIN">Super Admin</option>
                    <option value="ADMIN">Admin</option>
                    <option value="TEACHER">Teacher</option>
                    <option value="STUDENT">Student</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Phone (Optional)</label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="+91-XXXXXXXXXX"
                />
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingUser}
                  className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingUser ? 'Saving...' : 'Save User'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};
export default SettingsPage;

