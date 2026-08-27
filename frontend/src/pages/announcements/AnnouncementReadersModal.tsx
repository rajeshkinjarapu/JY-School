import React, { useEffect, useState } from 'react';
import { X, Users, GraduationCap, Clock, CheckCircle, Circle } from 'lucide-react';
import api from '../../api/axios';

interface Reader {
  id: string;
  name: string;
  role: string;
  hasRead: boolean;
  readAt: string | null;
}

interface Props {
  announcementId: string;
  onClose: () => void;
}

export const AnnouncementReadersModal: React.FC<Props> = ({ announcementId, onClose }) => {
  const [readers, setReaders] = useState<Reader[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  const [filter, setFilter] = useState<'ALL' | 'READ' | 'UNREAD'>('ALL');

  useEffect(() => {
    const fetchReaders = async () => {
      try {
        const res = await api.get(`/api/announcements/${announcementId}/read-stats`);
        setReaders(res.data.data?.readers || []);
      } catch (err) {
        console.error('Failed to fetch readers', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReaders();
  }, [announcementId]);

  const filteredReaders = readers.filter(r => {
    if (r.role !== activeTab) return false;
    if (filter === 'READ' && !r.hasRead) return false;
    if (filter === 'UNREAD' && r.hasRead) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900">Read Receipts</h2>
              <p className="text-sm font-medium text-gray-500">Track who has seen this announcement</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 border-b border-gray-100 flex gap-6">
          <button 
            onClick={() => setActiveTab('STUDENT')}
            className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'STUDENT' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <GraduationCap className="w-4 h-4" /> Students
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
              {readers.filter(r => r.role === 'STUDENT').length}
            </span>
          </button>
          <button 
            onClick={() => setActiveTab('TEACHER')}
            className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'TEACHER' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-4 h-4" /> Teachers
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
              {readers.filter(r => r.role === 'TEACHER').length}
            </span>
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 flex gap-2">
          {['ALL', 'READ', 'UNREAD'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filter === f 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 pt-0">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : filteredReaders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-500">
              <Users className="w-8 h-8 mb-2 opacity-50" />
              <p className="font-medium">No users found in this category.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReaders.map(reader => (
                <div key={reader.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                      {reader.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{reader.name}</h4>
                      <p className="text-xs font-medium text-gray-500 flex items-center gap-1">
                        {reader.role === 'STUDENT' ? <GraduationCap className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                        {reader.role.charAt(0) + reader.role.slice(1).toLowerCase()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {reader.hasRead ? (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
                        <CheckCircle className="w-4 h-4" />
                        <div className="flex flex-col text-right">
                          <span className="text-xs font-bold leading-tight">Read</span>
                          {reader.readAt && (
                            <span className="text-[10px] font-medium opacity-80 leading-tight">
                              {new Date(reader.readAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-500 rounded-lg border border-gray-200">
                        <Circle className="w-4 h-4" />
                        <span className="text-xs font-bold">Unread</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
