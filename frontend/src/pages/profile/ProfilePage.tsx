import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { changePassword } from '../../api/auth';
import { Avatar } from '../../components/UI/Avatar';
import { Badge } from '../../components/UI/Badge';
import { Save, Lock, User as UserIcon, Key, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { getPhotoUrl } from '../../utils/photo';

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [uploading, setUploading] = useState(false);

  // Password form states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    const loadingToast = toast.loading('Uploading photo...');
    try {
      const uploadRes: any = await api.post('/api/uploads/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const uploadedUrl = uploadRes.data.url || uploadRes.data.data?.url;
      if (!uploadedUrl) throw new Error('Upload returned no URL');
      
      await api.put('/api/auth/profile', {
        photoUrl: uploadedUrl,
      });

      updateUser({ ...user, photoUrl: uploadedUrl } as any);
      toast.success('Photo updated successfully!', { id: loadingToast });
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to upload photo', { id: loadingToast });
    } finally {
      setUploading(false);
    }
  };

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
        <div className="relative">
          <Avatar name={user.name} src={getPhotoUrl(user.photoUrl)} size="lg" className="w-24 h-24 sm:w-28 sm:h-28 text-3xl" />
          <label className="cursor-pointer absolute bottom-0 right-0 inline-flex items-center gap-1.5 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 px-2.5 py-1.5 rounded-full transition-colors shadow-sm hover:scale-105 active:scale-95 select-none z-10" title="Upload Photo">
            <Camera className="w-4 h-4" />
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
          </label>
        </div>
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
            <UserIcon className="w-5 h-5 text-gray-400" />
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
