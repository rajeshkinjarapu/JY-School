import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';
import { Avatar } from '../../components/UI/Avatar';
import { io, Socket } from 'socket.io-client';
import { Send, MessageSquare, Plus, Search } from 'lucide-react';
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

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

  useEffect(() => {
    // 1. Init Socket.io
    const socket = io(SOCKET_URL, {
      withCredentials: true,
    });
    socketRef.current = socket;

    if (user) {
      socket.emit('join', user.id);
    }

    socket.on('new_message', (data) => {
      // If message is from current active conversation partner, append it
      if (activePartner && (data.senderId === activePartner.id || data.receiverId === activePartner.id)) {
        setMessages((prev) => [...prev, data]);
      }
      // Refresh list
      fetchConversations();
    });

    return () => {
      socket.disconnect();
    };
  }, [user, activePartner]);

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

    try {
      const res: any = await api.post('/api/messages', {
        receiverId: activePartner.id,
        content: newMessage,
      });

      const savedMessage = res.data;
      setMessages((prev) => [...prev, savedMessage]);

      // Emit through socket
      socketRef.current?.emit('send_message', {
        senderId: user!.id,
        senderName: user!.name,
        receiverId: activePartner.id,
        content: newMessage,
      });

      setNewMessage('');
      fetchConversations();
    } catch (e) {
      toast.error('Message failed to send');
    }
  };

  const fetchUsers = async () => {
    try {
      const res: any = await api.get('/api/users', { params: { search: userSearch } });
      // Exclude self from list
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

  return (
    <div className="card h-[80vh] flex overflow-hidden">
      {/* Left panel (conversations) */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full bg-white dark:bg-gray-900">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h3 className="font-bold text-lg">Chats</h3>
          <button
            onClick={() => setShowNewChatModal(true)}
            className="p-1.5 rounded-lg bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400 hover:bg-primary-100 transition-colors cursor-pointer"
            title="New Chat"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800/50">
          {conversations.map((c) => {
            const partner = c.partner;
            const isSelected = activePartner?.id === partner.id;
            return (
              <button
                key={partner.id}
                onClick={() => handleSelectPartner(partner)}
                className={`w-full flex items-center gap-3 p-4 text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-primary-50/50 dark:bg-primary-950/10 border-l-4 border-primary-500'
                    : 'hover:bg-gray-50/50 dark:hover:bg-gray-800/20'
                }`}
              >
                <div className="relative shrink-0">
                  <Avatar name={partner.name} src={getPhotoUrl(partner.photoUrl)} size="sm" />
                  <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${partner.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                      {partner.name}
                    </h4>
                    <span className="text-[10px] text-gray-400">
                      {c.lastMessage && new Date(c.lastMessage.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 truncate leading-normal">
                    {c.lastMessage?.content || 'Click to start chatting...'}
                  </p>
                </div>
              </button>
            );
          })}
          {conversations.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-400">No active conversations.</div>
          )}
        </div>
      </div>

      {/* Right panel (chat room) */}
      <div className="flex-1 flex flex-col h-full bg-gray-50 dark:bg-gray-950/20">
        {activePartner ? (
          <>
            {/* Active partner bar */}
            <div className="px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
              <div className="relative shrink-0">
                <Avatar name={activePartner.name} src={getPhotoUrl(activePartner.photoUrl)} size="sm" />
                <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${activePartner.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
              </div>
              <div>
                <h4 className="font-bold text-sm text-gray-900 dark:text-white leading-tight">
                  {activePartner.name}
                </h4>
                <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold uppercase tracking-wider">
                  {activePartner.role}
                </span>
              </div>
            </div>

            {/* Messages thread */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((m, index) => {
                const isSelf = m.senderId === user!.id;
                return (
                  <div
                    key={index}
                    className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] p-3.5 rounded-2xl text-sm leading-relaxed ${
                        isSelf
                          ? 'bg-primary-600 text-white rounded-tr-none'
                          : 'bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 border border-gray-150 dark:border-gray-800 rounded-tl-none'
                      }`}
                    >
                      <p>{m.content}</p>
                      <span
                        className={`block text-[10px] text-right mt-1.5 font-medium ${
                          isSelf ? 'text-white/60' : 'text-gray-400'
                        }`}
                      >
                        {new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex gap-3">
              <input
                type="text"
                placeholder="Type your message details here..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="input flex-1"
              />
              <button type="submit" className="btn-primary !p-3 flex items-center justify-center">
                <Send className="w-5 h-5" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <MessageSquare className="w-16 h-16 text-gray-300 mb-3" />
            <p className="text-sm font-semibold">Start real-time chat conversations.</p>
            <p className="text-xs">Select or search users on Springfield campus to connect.</p>
          </div>
        )}
      </div>

      {/* New chat modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="card w-full max-w-md p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">Start Conversation</h3>
              <button onClick={() => setShowNewChatModal(false)} className="text-gray-400 hover:text-black">
                Cancel
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search staff, students, parents..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="input pl-9"
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {usersList.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleStartChat(u)}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 hover:bg-gray-50/50 text-left transition-colors cursor-pointer"
                >
                  <div className="relative shrink-0">
                    <Avatar name={u.name} src={getPhotoUrl(u.photoUrl)} size="sm" />
                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${u.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 leading-none">{u.name}</h4>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mt-1">
                      {u.role}
                    </span>
                  </div>
                </button>
              ))}
              {usersList.length === 0 && (
                <p className="text-center py-6 text-xs text-gray-400">No users found.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default MessagesPage;
