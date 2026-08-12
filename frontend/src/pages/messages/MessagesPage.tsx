import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';
import { Avatar } from '../../components/UI/Avatar';
import { io, Socket } from 'socket.io-client';
import { Send, MessageSquare, Plus, Search, ArrowLeft, CheckCheck, Menu } from 'lucide-react';
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

  const getSocketUrl = () => {
    if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;
    if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
      return 'http://148.113.9.103:19999';
    }
    return window.location.origin;
  };

  const activePartnerRef = useRef<any>(null);

  useEffect(() => {
    activePartnerRef.current = activePartner;
  }, [activePartner]);

  // Socket.io initialization & real-time updates
  useEffect(() => {
    const socket = io(getSocketUrl(), { withCredentials: true, transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    if (user?.id) {
      socket.emit('join', user.id);
    }

    socket.on('new_message', (data) => {
      const partner = activePartnerRef.current;
      if (partner && (data.senderId === partner.id || data.receiverId === partner.id)) {
        setMessages((prev) => {
          const list = Array.isArray(prev) ? prev : [];
          if (list.some(m => m.id === data.id || (m.content === data.content && m.senderId === data.senderId))) {
            return list;
          }
          return [...list, data];
        });
      }
      fetchConversations();
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id]);

  const fetchConversations = async () => {
    try {
      const res: any = await api.get('/api/messages/conversations');
      const raw = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setConversations(Array.isArray(raw) ? raw : []);
    } catch (e) {
      console.error(e);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (partnerId: string) => {
    try {
      const res: any = await api.get(`/api/messages/conversation/${partnerId}`);
      const raw = Array.isArray(res.data) ? res.data : (res.data?.data || res.data?.messages || []);
      setMessages(Array.isArray(raw) ? raw : []);
    } catch (e) {
      console.error(e);
      setMessages([]);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // Poll messages every 3 seconds when chat is active
  useEffect(() => {
    if (activePartner?.id) {
      fetchMessages(activePartner.id);
      const interval = setInterval(() => {
        fetchMessages(activePartner.id);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [activePartner?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectPartner = (partner: any) => {
    setActivePartner(partner);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activePartner?.id || !user?.id) return;

    const content = newMessage.trim();
    setNewMessage('');

    // Optimistic UI update
    const tempMsg = {
      id: 'temp-' + Date.now(),
      senderId: user.id,
      receiverId: activePartner.id,
      content,
      sentAt: new Date().toISOString(),
    };
    setMessages((prev) => [...(Array.isArray(prev) ? prev : []), tempMsg]);

    try {
      const res: any = await api.post('/api/messages', {
        receiverId: activePartner.id,
        content: content,
      });

      const savedMessage = res.data?.data || res.data;
      if (savedMessage?.id) {
        setMessages((prev) => 
          (Array.isArray(prev) ? prev : []).map(m => m.id === tempMsg.id ? savedMessage : m)
        );
      }

      socketRef.current?.emit('send_message', {
        senderId: user.id,
        senderName: user.name,
        receiverId: activePartner.id,
        content: content,
      });

      fetchConversations();
    } catch (e) {
      toast.error('Message failed to send');
      setMessages((prev) => (Array.isArray(prev) ? prev : []).filter(m => m.id !== tempMsg.id));
    }
  };

  const fetchUsers = async () => {
    try {
      const res: any = await api.get('/api/messages/users', { params: { search: userSearch } });
      const raw = Array.isArray(res.data) ? res.data : (res.data?.data || res.data?.users || []);
      const list = Array.isArray(raw) ? raw.filter((u: any) => u.id !== user?.id) : [];
      setUsersList(list);
    } catch (e) {
      console.error(e);
      setUsersList([]);
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

  const safeConversations = Array.isArray(conversations) ? conversations : [];
  const filteredConversations = safeConversations.filter(c => {
    if (!searchQuery.trim()) return true;
    return c.partner?.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full bg-[#0b141a] w-full overflow-hidden" style={{ minHeight: 'calc(100vh - 64px)' }}>
      
      {/* Custom Signature Header (NO EXTRA PLUS BUTTON) */}
      <div className="bg-[#0f172a] text-white px-3.5 py-3 flex items-center justify-between shadow-md shrink-0 border-b border-slate-800">
        <div className="flex items-center gap-3 min-w-0">
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('toggleSidebar'))} 
            className="p-1.5 -ml-1 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-all lg:hidden shrink-0 cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="p-1.5 bg-indigo-500/20 backdrop-blur-md rounded-xl border border-indigo-500/30 shadow-inner flex items-center justify-center shrink-0">
            <MessageSquare className="w-4 h-4 text-indigo-400" />
          </div>

          <h1 className="text-base sm:text-lg font-black text-white tracking-tight truncate drop-shadow-sm">
            JY Messenger
          </h1>
        </div>
      </div>

      {/* Main WhatsApp Layout Container */}
      <div className="flex-1 flex overflow-hidden w-full min-h-0">
        
        {/* LEFT SIDEBAR: Conversations List (Official WhatsApp Dark Sidebar #111b21) */}
        <div className={`${activePartner ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 flex-col border-r border-[#222d34] bg-[#111b21] shrink-0 h-full`}>
          
          {/* Sidebar User Header Bar (#202c33) */}
          <div className="p-3.5 border-b border-[#222d34] bg-[#202c33] flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar name={user?.name || 'User'} src={getPhotoUrl(user?.photoUrl)} size="sm" />
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-[#e9edef] truncate">{user?.name}</h3>
                <span className="text-[10px] text-[#00a884] font-extrabold uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00a884] animate-pulse" /> Online
                </span>
              </div>
            </div>

            {/* Single Plus / New Chat Icon */}
            <button
              onClick={() => setShowNewChatModal(true)}
              className="p-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md active:scale-95 flex items-center justify-center cursor-pointer shrink-0"
              title="Start New Chat"
            >
              <Plus className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* WhatsApp Search Input */}
          <div className="p-2.5 border-b border-[#222d34] bg-[#111b21] shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#8696a0]" />
              <input
                type="text"
                placeholder="Search or start new chat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#202c33] border border-[#222d34] rounded-xl text-xs text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:border-[#00a884] transition-all"
              />
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#222d34]/60">
            {filteredConversations.map((c) => {
              const partner = c.partner;
              if (!partner) return null;
              const isSelected = activePartner?.id === partner.id;

              return (
                <button
                  key={partner.id}
                  onClick={() => handleSelectPartner(partner)}
                  className={`w-full flex items-center gap-3 p-3.5 text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#2a3942] border-l-4 border-[#00a884] text-[#e9edef]'
                      : 'hover:bg-[#202c33] text-[#8696a0]'
                  }`}
                >
                  <div className="relative shrink-0">
                    <Avatar name={partner.name} src={getPhotoUrl(partner.photoUrl)} size="md" />
                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#111b21] ${partner.isOnline ? 'bg-[#00a884]' : 'bg-[#8696a0]'}`}></span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h4 className="font-bold text-sm text-[#e9edef] truncate">
                        {partner.name}
                      </h4>
                      <span className="text-[10px] text-[#8696a0] shrink-0">
                        {c.lastMessage?.sentAt && new Date(c.lastMessage.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs text-[#8696a0] truncate leading-snug">
                        {c.lastMessage?.content || 'Tap to chat...'}
                      </p>
                      {c.unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-[#00a884] text-white text-[10px] font-black shrink-0 shadow-sm">
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
                <div className="w-12 h-12 rounded-full bg-[#202c33] text-[#00a884] flex items-center justify-center mx-auto shadow-inner">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-[#8696a0]">No active chats found.</p>
                <button
                  onClick={() => setShowNewChatModal(true)}
                  className="px-4 py-2 rounded-xl bg-[#00a884] hover:bg-[#029071] text-white font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  + Start New Chat
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT CHAT WINDOW: WhatsApp Room (#0b141a) */}
        <div className={`${!activePartner ? 'hidden md:flex' : 'flex'} flex-1 flex-col h-full bg-[#0b141a] relative`}>
          
          {/* WhatsApp Wallpaper Doodle Pattern */}
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h80v80H0z' fill='none'/%3E%3Cpath d='M20 20h10v10H20zM50 50h10v10H50z' fill='%23ffffff'/%3E%3C/svg%3E")`
          }} />

          {activePartner ? (
            <>
              {/* WhatsApp Active Contact Header (#202c33) */}
              <div className="px-3.5 py-2.5 bg-[#202c33] border-b border-[#222d34] flex items-center justify-between gap-3 relative z-10 shrink-0 shadow-md">
                <div className="flex items-center gap-3 min-w-0">
                  <button 
                    onClick={() => setActivePartner(null)} 
                    className="p-1.5 rounded-lg text-[#8696a0] hover:text-white hover:bg-[#2a3942] md:hidden shrink-0 cursor-pointer"
                    title="Back to Chats"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <div className="relative shrink-0">
                    <Avatar name={activePartner.name} src={getPhotoUrl(activePartner.photoUrl)} size="sm" />
                    <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#202c33] ${activePartner.isOnline ? 'bg-[#00a884]' : 'bg-[#8696a0]'}`}></span>
                  </div>

                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-[#e9edef] truncate leading-tight">
                      {activePartner.name}
                    </h4>
                    <span className="text-[10px] text-[#00a884] font-extrabold uppercase tracking-wider block">
                      {activePartner.role} • JY School
                    </span>
                  </div>
                </div>
              </div>

              {/* Real-time 2-Way Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 relative z-10">
                {messages.map((m, index) => {
                  const isSelf = m.senderId === user?.id;
                  
                  return (
                    <div
                      key={m.id || index}
                      className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[70%] p-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-md ${
                          isSelf
                            ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-none border border-[#00a884]/20 ml-auto'
                            : 'bg-[#202c33] text-[#e9edef] rounded-tl-none border border-[#222d34] mr-auto'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words font-medium">{m.content}</p>
                        <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-[#8696a0]">
                          <span>
                            {m.sentAt ? new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                          </span>
                          {isSelf && <CheckCheck className="w-3.5 h-3.5 text-[#34b7f1]" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Bottom WhatsApp Message Input Box (#202c33) */}
              <form onSubmit={handleSendMessage} className="p-3 bg-[#202c33] border-t border-[#222d34] flex items-center gap-2 relative z-10 shrink-0">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 bg-[#2a3942] border border-[#222d34] rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:border-[#00a884] transition-all"
                />

                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-3 rounded-full bg-[#00a884] hover:bg-[#029071] disabled:opacity-40 disabled:hover:bg-[#00a884] text-white shadow-lg transition-all active:scale-95 shrink-0 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            /* WhatsApp Web Placeholder */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4 relative z-10">
              <div className="w-20 h-20 rounded-full bg-[#202c33] border border-[#00a884]/30 text-[#00a884] flex items-center justify-center shadow-2xl animate-pulse">
                <MessageSquare className="w-10 h-10" />
              </div>
              <div className="max-w-md">
                <h3 className="text-xl font-black text-[#e9edef]">JY WhatsApp Messenger</h3>
                <p className="text-xs font-semibold text-[#8696a0] mt-1">
                  Select a contact on the left to start instant 2-way messaging with teachers, staff, or students.
                </p>
              </div>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="px-5 py-2.5 rounded-xl bg-[#00a884] hover:bg-[#029071] text-white font-extrabold text-xs shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                + Start New Chat
              </button>
            </div>
          )}
        </div>
      </div>

      {/* New Chat Contacts Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-[#111b21] border border-[#222d34] w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-[#e9edef] flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#00a884]" /> Select Contact to Chat
              </h3>
              <button 
                onClick={() => setShowNewChatModal(false)} 
                className="text-[#8696a0] hover:text-white text-xs font-bold px-2 py-1 rounded-lg hover:bg-[#202c33] transition-colors"
              >
                Close
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-[#8696a0]" />
              <input
                type="text"
                placeholder="Search staff, teachers, students..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-[#202c33] border border-[#222d34] rounded-xl text-xs text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:border-[#00a884]"
              />
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 divide-y divide-[#222d34]/60">
              {usersList.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleStartChat(u)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-[#222d34] hover:bg-[#202c33] text-left transition-colors cursor-pointer"
                >
                  <div className="relative shrink-0">
                    <Avatar name={u.name} src={getPhotoUrl(u.photoUrl)} size="sm" />
                    <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#111b21] ${u.isOnline ? 'bg-[#00a884]' : 'bg-[#8696a0]'}`}></span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-sm text-[#e9edef] truncate">{u.name}</h4>
                    <span className="text-[10px] text-[#00a884] font-extrabold uppercase tracking-wider block mt-0.5">
                      {u.role}
                    </span>
                  </div>
                </button>
              ))}
              {usersList.length === 0 && (
                <p className="text-center py-6 text-xs text-[#8696a0]">No users found.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesPage;
