import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';
import { Avatar } from '../../components/UI/Avatar';
import { PageHeader } from '../../components/UI/PageHeader';
import { io, Socket } from 'socket.io-client';
import { Send, MessageSquare, Plus, Search, ArrowLeft, CheckCheck, Smile, Paperclip, MoreVertical, ShieldCheck, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { getPhotoUrl } from '../../utils/photo';

export const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [activePartner, setActivePartner] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
  const activePartnerRef = useRef<any>(null);

  useEffect(() => {
    activePartnerRef.current = activePartner;
  }, [activePartner]);

  useEffect(() => {
    // Init Socket.io connection
    const socket = io(SOCKET_URL, { withCredentials: true });
    socketRef.current = socket;

    if (user) {
      socket.emit('join', user.id);
    }

    socket.on('new_message', (data) => {
      const partner = activePartnerRef.current;
      if (partner && (data.senderId === partner.id || data.receiverId === partner.id)) {
        setMessages((prev) => [...prev, data]);
      }
      fetchConversations();
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const fetchConversations = async () => {
    try {
      const res: any = await api.get('/api/messages/conversations');
      setConversations(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (partnerId: string) => {
    try {
      const res: any = await api.get(`/api/messages/conversation/${partnerId}`);
      setMessages(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activePartner) {
      fetchMessages(activePartner.id);
    }
  }, [activePartner]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectPartner = (partner: any) => {
    setActivePartner(partner);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activePartner) return;

    const content = newMessage;
    setNewMessage('');

    try {
      const res: any = await api.post('/api/messages', {
        receiverId: activePartner.id,
        content: content,
      });

      const savedMessage = res.data;
      setMessages((prev) => [...prev, savedMessage]);

      socketRef.current?.emit('send_message', {
        senderId: user!.id,
        senderName: user!.name,
        receiverId: activePartner.id,
        content: content,
      });

      fetchConversations();
    } catch (e) {
      toast.error('Message failed to send');
    }
  };

  const fetchUsers = async () => {
    try {
      const res: any = await api.get('/api/users', { params: { search: userSearch } });
      const list = (res.data.data || res.data || []).filter((u: any) => u.id !== user!.id);
      setUsersList(list);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (showNewChatModal) {
      fetchUsers();
    }
  }, [showNewChatModal, userSearch]);

  const handleStartChat = (selectedUser: any) => {
    setActivePartner(selectedUser);
    setShowNewChatModal(false);
  };

  const filteredConversations = conversations.filter(c => {
    if (!searchQuery.trim()) return true;
    return c.partner?.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full bg-slate-900 min-h-[calc(100vh-64px)]">
      {/* WhatsApp Style Page Header */}
      <PageHeader 
        title="JY School Messenger" 
        icon={<MessageSquare className="w-5 h-5 text-emerald-400" />}
        action={
          <button
            onClick={() => setShowNewChatModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" /> New Chat
          </button>
        }
      />

      <div className="flex-1 flex overflow-hidden max-w-7xl w-full mx-auto p-0 sm:p-4 gap-0 sm:gap-4">
        {/* Main Messenger Container */}
        <div className="w-full flex-1 flex rounded-none sm:rounded-3xl overflow-hidden shadow-2xl border-0 sm:border border-slate-700/50 bg-slate-950">
          
          {/* LEFT SIDEBAR: Chats List */}
          <div className={`${activePartner ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 flex-col border-r border-slate-800 bg-slate-900/90 shrink-0`}>
            
            {/* WhatsApp Sidebar Header */}
            <div className="p-3.5 border-b border-slate-800 bg-slate-900 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <Avatar name={user?.name || 'User'} src={getPhotoUrl(user?.photoUrl)} size="sm" />
                <div>
                  <h3 className="font-black text-sm text-white truncate">{user?.name}</h3>
                  <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowNewChatModal(true)}
                className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all cursor-pointer"
                title="Start New Chat"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* WhatsApp Search Input */}
            <div className="p-3 border-b border-slate-800 bg-slate-900/60">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
              {filteredConversations.map((c) => {
                const partner = c.partner;
                const isSelected = activePartner?.id === partner.id;
                return (
                  <button
                    key={partner.id}
                    onClick={() => handleSelectPartner(partner)}
                    className={`w-full flex items-center gap-3 p-3.5 text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-950/40 border-l-4 border-emerald-500 text-white'
                        : 'hover:bg-slate-800/50 text-slate-300'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <Avatar name={partner.name} src={getPhotoUrl(partner.photoUrl)} size="md" />
                      <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 ${partner.isOnline ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h4 className="font-bold text-sm text-white truncate">
                          {partner.name}
                        </h4>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {c.lastMessage && new Date(c.lastMessage.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs text-slate-400 truncate leading-snug">
                          {c.lastMessage?.content || 'Tap to start chatting...'}
                        </p>
                        {c.unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black shrink-0">
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}

              {filteredConversations.length === 0 && !loading && (
                <div className="text-center py-12 px-4 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-800 text-emerald-400 flex items-center justify-center mx-auto">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-semibold text-slate-400">No active conversations found.</p>
                  <button
                    onClick={() => setShowNewChatModal(true)}
                    className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-bold text-xs hover:bg-emerald-600 transition-all shadow-md"
                  >
                    + Start New Conversation
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDE: Chat Room */}
          <div className={`${!activePartner ? 'hidden md:flex' : 'flex'} flex-1 flex-col h-full bg-[#0b141a] relative`}>
            
            {/* WhatsApp Wallpaper Doodle Effect */}
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h80v80H0z' fill='none'/%3E%3Cpath d='M20 20h10v10H20zM50 50h10v10H50z' fill='%23ffffff'/%3E%3C/svg%3E")`
            }} />

            {activePartner ? (
              <>
                {/* Active Partner Top Bar */}
                <div className="px-3.5 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 relative z-10">
                  <div className="flex items-center gap-3 min-w-0">
                    <button 
                      onClick={() => setActivePartner(null)} 
                      className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 md:hidden shrink-0"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>

                    <div className="relative shrink-0">
                      <Avatar name={activePartner.name} src={getPhotoUrl(activePartner.photoUrl)} size="sm" />
                      <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${activePartner.isOnline ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
                    </div>

                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-white truncate leading-tight">
                        {activePartner.name}
                      </h4>
                      <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-wider block">
                        {activePartner.role} • JY School
                      </span>
                    </div>
                  </div>
                </div>

                {/* Messages Thread */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 relative z-10">
                  {messages.map((m, index) => {
                    const isSelf = m.senderId === user!.id;
                    return (
                      <div
                        key={index}
                        className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[70%] p-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-md ${
                            isSelf
                              ? 'bg-[#005c4b] text-white rounded-tr-none border border-emerald-500/20'
                              : 'bg-[#202c33] text-gray-100 rounded-tl-none border border-slate-700/30'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{m.content}</p>
                          <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-300">
                            <span>
                              {new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isSelf && <CheckCheck className="w-3.5 h-3.5 text-cyan-400" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* WhatsApp Style Message Input Form */}
                <form onSubmit={handleSendMessage} className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2 relative z-10">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-all"
                  />

                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="p-3 rounded-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:hover:bg-emerald-500 text-white shadow-lg transition-all active:scale-95 shrink-0 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            ) : (
              /* WhatsApp Empty State */
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4 relative z-10">
                <div className="w-20 h-20 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-xl animate-pulse">
                  <MessageSquare className="w-10 h-10" />
                </div>
                <div className="max-w-md">
                  <h3 className="text-xl font-black text-white">JY School Messenger</h3>
                  <p className="text-xs font-semibold text-slate-400 mt-1">
                    Select a conversation from the left or start a new chat with staff, teachers, or students on JY School Campus.
                  </p>
                </div>
                <button
                  onClick={() => setShowNewChatModal(true)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-lg transition-all active:scale-95 cursor-pointer"
                >
                  + Start New Conversation
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-400" /> Start New Chat
              </h3>
              <button 
                onClick={() => setShowNewChatModal(false)} 
                className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff, teachers, students..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 divide-y divide-slate-800/40">
              {usersList.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleStartChat(u)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-800 hover:bg-slate-800/60 text-left transition-colors cursor-pointer"
                >
                  <div className="relative shrink-0">
                    <Avatar name={u.name} src={getPhotoUrl(u.photoUrl)} size="sm" />
                    <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${u.isOnline ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-sm text-white truncate">{u.name}</h4>
                    <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-wider block mt-0.5">
                      {u.role}
                    </span>
                  </div>
                </button>
              ))}
              {usersList.length === 0 && (
                <p className="text-center py-6 text-xs text-slate-400">No users found.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesPage;
