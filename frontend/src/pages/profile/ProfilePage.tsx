import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { changePassword } from '../../api/auth';
import { Avatar } from '../../components/UI/Avatar';
import { Badge } from '../../components/UI/Badge';
import { Save, Lock, User, Key } from 'lucide-react';
import toast from 'react-hot-toast';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

  // Password form states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password don't match");
      return;
    }
    setIsSaving(true);
    try {
      await changePassword({ oldPassword, newPassword });
      toast.success('Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Error changing password. Verify old password.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="card p-6 flex flex-col sm:flex-row items-center gap-6">
        <Avatar name={user.name} src={user.photoUrl} size="lg" />
        <div className="flex-1 text-center sm:text-left space-y-1">
          <h2 className="text-2xl font-bold">{user.name}</h2>
          {user.role !== 'STUDENT' && <span className="text-xs text-gray-400 block">{user.email}</span>}
          <Badge variant="info" className="mt-1">
            {user.role}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActiveTab('profile')}
          className={`py-2 px-4 text-sm font-bold border-b-2 cursor-pointer ${
            activeTab === 'profile' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-400'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('password')}
          className={`py-2 px-4 text-sm font-bold border-b-2 cursor-pointer ${
            activeTab === 'password' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-400'
          }`}
        >
          Change Password
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'profile' ? (
        <div className="card p-6 space-y-6">
          <h3 className="font-bold text-lg border-b pb-2 flex items-center gap-2">
            <User className="w-5 h-5 text-gray-400" />
            <span>Profile Overview</span>
          </h3>
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <span className="text-xs text-gray-400 block">Name</span>
              <span className="font-semibold text-gray-900 dark:text-white">{user.name}</span>
            </div>
            <div>
              <span className="text-xs text-gray-400 block">Role Group</span>
              <span className="font-semibold text-gray-900 dark:text-white">{user.role}</span>
            </div>
            {user.role === 'STUDENT' ? (
              user.phone && (
                <div>
                  <span className="text-xs text-gray-400 block">Contact Phone</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{user.phone}</span>
                </div>
              )
            ) : (
              <div>
                <span className="text-xs text-gray-400 block">Email Address</span>
                <span className="font-semibold text-gray-900 dark:text-white">{user.email}</span>
              </div>
            )}
            <div>
              <span className="text-xs text-gray-400 block">Account Status</span>
              <span className="font-semibold">
                <Badge variant={user.isActive ? 'success' : 'danger'}>
                  {user.isActive ? 'Active' : 'Suspended'}
                </Badge>
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-6 space-y-6">
          <h3 className="font-bold text-lg border-b pb-2 flex items-center gap-2">
            <Key className="w-5 h-5 text-gray-400" />
            <span>Change Security Password</span>
          </h3>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="label">Current Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="input pl-11"
                />
              </div>
            </div>

            <div>
              <label className="label">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input pl-11"
                />
              </div>
            </div>

            <div>
              <label className="label">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input pl-11"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              <span>{isSaving ? 'Updating Password...' : 'Save New Password'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
export default ProfilePage;
