import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import {
  X, Send, Bell, Image as ImageIcon, Users, GraduationCap, School,
  AlertTriangle, Calendar, Sparkles, CheckCircle2, Upload, Trash2, Smartphone
} from 'lucide-react';
import toast from 'react-hot-toast';

interface SendCustomNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SendCustomNotificationModal: React.FC<SendCustomNotificationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetType, setTargetType] = useState<'ALL' | 'ROLE' | 'CLASS'>('ALL');
  const [targetRole, setTargetRole] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  const [targetClassId, setTargetClassId] = useState('');
  const [notificationType, setNotificationType] = useState('ANNOUNCEMENT');
  const [route, setRoute] = useState('announcements');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      api.get('/api/classes').then((res: any) => {
        const data = res.data?.data || res.data || [];
        setClasses(Array.isArray(data) ? data : []);
      }).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      toast.error('Image size must be under 8MB');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    try {
      const res: any = await api.post('/api/uploads/share', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data?.data?.url || res.data?.url;
      if (url) {
        setImageUrl(url);
        toast.success('Banner image uploaded successfully!');
      } else {
        toast.error('Failed to get uploaded image URL');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error uploading image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter notification title');
      return;
    }
    if (!message.trim()) {
      toast.error('Please enter notification message');
      return;
    }
    if (targetType === 'CLASS' && !targetClassId) {
      toast.error('Please select a target class');
      return;
    }

    setIsSending(true);
    try {
      const payload: any = {
        title: title.trim(),
        message: message.trim(),
        imageUrl: imageUrl.trim() || undefined,
        targetType,
        route,
        type: notificationType,
      };

      if (targetType === 'ROLE') {
        payload.targetRole = targetRole;
      } else if (targetType === 'CLASS') {
        payload.targetClassId = targetClassId;
      }

      const res: any = await api.post('/api/notifications/send-custom', payload);
      const devicesCount = res.data?.data?.devicesReachedCount ?? 0;
      toast.success(
        devicesCount > 0
          ? `Push notification sent to ${devicesCount} devices!`
          : 'Notification sent successfully!',
        { duration: 4000 }
      );

      // Reset
      setTitle('');
      setMessage('');
      setImageUrl('');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send notification');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">Send Custom Push Notification</h3>
              <p className="text-xs text-indigo-200 font-medium">
                Broadcast instant rich alerts with poster images directly to mobile phones
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form Fields (7 cols) */}
            <form onSubmit={handleSend} id="pushForm" className="lg:col-span-7 space-y-5">
              {/* Target Audience Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                  Target Audience (ఎవరికి వెళ్ళాలి)
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setTargetType('ALL')}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      targetType === 'ALL'
                        ? 'bg-indigo-50/80 border-indigo-500 text-indigo-700 shadow-sm ring-2 ring-indigo-500/20'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Users className="w-5 h-5" />
                    <span className="text-xs font-black">All School</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetType('ROLE')}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      targetType === 'ROLE'
                        ? 'bg-indigo-50/80 border-indigo-500 text-indigo-700 shadow-sm ring-2 ring-indigo-500/20'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <GraduationCap className="w-5 h-5" />
                    <span className="text-xs font-black">By Role</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetType('CLASS')}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      targetType === 'CLASS'
                        ? 'bg-indigo-50/80 border-indigo-500 text-indigo-700 shadow-sm ring-2 ring-indigo-500/20'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <School className="w-5 h-5" />
                    <span className="text-xs font-black">Specific Class</span>
                  </button>
                </div>

                {/* Sub-selectors */}
                {targetType === 'ROLE' && (
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setTargetRole('STUDENT')}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        targetRole === 'STUDENT'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      All Students & Parents
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetRole('TEACHER')}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        targetRole === 'TEACHER'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      All Teachers & Staff
                    </button>
                  </div>
                )}

                {targetType === 'CLASS' && (
                  <div className="mt-3">
                    <select
                      value={targetClassId}
                      onChange={(e) => setTargetClassId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                    >
                      <option value="">-- Select Class --</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          Class {cls.name} - {cls.section}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Title & Notification Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                    Notification Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. స్కూల్ సంక్రాంతి సెలవులు / Exam Alert"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                    Type
                  </label>
                  <select
                    value={notificationType}
                    onChange={(e) => setNotificationType(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                  >
                    <option value="ANNOUNCEMENT">Announcement</option>
                    <option value="ALERT">Urgent Alert</option>
                    <option value="EVENT">School Event</option>
                    <option value="HOLIDAY">Holiday</option>
                    <option value="FEE">Fee Reminder</option>
                  </select>
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                  Message Content *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Enter complete notification message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none resize-none"
                />
              </div>

              {/* Poster Image Upload (Big Picture) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                  Big Picture Banner / Poster (Optional)
                </label>

                {imageUrl ? (
                  <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 p-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={imageUrl.startsWith('http') ? imageUrl : `http://66.116.252.191:19998${imageUrl}`}
                        alt="Banner Preview"
                        className="w-16 h-12 object-cover rounded-lg border border-gray-200"
                      />
                      <div>
                        <p className="text-xs font-bold text-gray-800">Banner attached</p>
                        <p className="text-[11px] text-emerald-600 font-semibold">Ready to display on phone</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Remove image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-gray-300 hover:border-indigo-400 bg-gray-50/70 hover:bg-indigo-50/30 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all">
                    {isUploading ? (
                      <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold py-2">
                        <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        Uploading banner image...
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="w-6 h-6 text-gray-400 mb-1" />
                        <span className="text-xs font-bold text-gray-700">Click to upload poster image (JPG, PNG, WebP)</span>
                        <span className="text-[11px] text-gray-400 mt-0.5">Will display as a large notification banner</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploading}
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Target Screen on Click */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                  When User Taps Notification Open:
                </label>
                <select
                  value={route}
                  onChange={(e) => setRoute(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                >
                  <option value="announcements">Announcements Screen (Default)</option>
                  <option value="homework">Homework Screen</option>
                  <option value="events">Events Calendar</option>
                  <option value="messages">Chat Messages</option>
                  <option value="fees">Fee Payments</option>
                </select>
              </div>
            </form>

            {/* Live Mobile Notification Preview (5 cols) */}
            <div className="lg:col-span-5 bg-gradient-to-b from-slate-100 to-slate-200/70 p-5 rounded-3xl border border-slate-200 flex flex-col items-center justify-center">
              <div className="flex items-center gap-2 mb-3 text-slate-700 text-xs font-extrabold uppercase tracking-widest">
                <Smartphone className="w-4 h-4" /> Live Mobile Preview
              </div>

              {/* Simulated Phone Notification Card */}
              <div className="w-full max-w-[320px] bg-white rounded-2xl shadow-xl border border-gray-200 p-4 transition-all">
                {/* Notification Header */}
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-indigo-600 flex items-center justify-center text-white text-[10px] font-black">
                      JY
                    </div>
                    <span className="text-[11px] font-bold text-gray-800">JY School</span>
                    <span className="text-[10px] text-gray-400">• now</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600">
                    {notificationType}
                  </span>
                </div>

                {/* Notification Content */}
                <div>
                  <h4 className="text-xs font-black text-gray-900 leading-snug">
                    {title || 'Notification Title...'}
                  </h4>
                  <p className="text-[11px] text-gray-600 mt-1 line-clamp-3 leading-relaxed">
                    {message || 'Your detailed announcement or urgent alert message will be displayed here in full clarity...'}
                  </p>
                </div>

                {/* Big Picture Banner in Preview */}
                {imageUrl && (
                  <div className="mt-2.5 rounded-xl overflow-hidden border border-gray-100 shadow-sm max-h-[140px] bg-slate-900 flex items-center justify-center">
                    <img
                      src={imageUrl.startsWith('http') ? imageUrl : `http://66.116.252.191:19998${imageUrl}`}
                      alt="Banner Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              <p className="text-[11px] text-slate-500 text-center mt-4 font-medium px-4">
                This shows how students, parents, and teachers see the alert on their Android notification tray.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="pushForm"
            disabled={isSending || isUploading}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {isSending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Broadcasting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Push Notification
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

