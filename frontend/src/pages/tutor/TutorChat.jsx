
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Search, Send, Video, Check, CheckCheck, Phone, MoreVertical } from 'lucide-react';
import { SOCKET_EVENTS } from '../../utils/constants';
import { chatAPI } from '../../api/chatAPI';
import { useSocketContext } from '../../context/SocketContext';
import VideoCallModal from '../../components/chat/VideoCallModal';
import CallRequestModal from '../../components/chat/CallRequestModal';
import toast from 'react-hot-toast';

export default function TutorChat() {
    const { user } = useSelector(state => state.auth);
    const socket = useSocketContext();

    const [chats, setChats] = useState([]);
    const [contacts, setContacts] = useState([]);      
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingContacts, setLoadingContacts] = useState(true);
    const [startingChat, setStartingChat] = useState(null); 
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const [typingUsers, setTypingUsers] = useState({}); 
    const [searchQuery, setSearchQuery] = useState('');
    const [callSession, setCallSession] = useState(null);       
    const [callRequest, setCallRequest] = useState(null);       
    const bottomRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const activeChatRef = useRef(null);     

    useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);

        useEffect(() => { loadData(); }, []);

        useEffect(() => {
        if (activeChat) {
            loadMessages(activeChat._id);
            markConversationRead(activeChat._id);
        }
    }, [activeChat]);

        useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [messages]);

        useEffect(() => {
        if (!socket) return;

        socket.on(SOCKET_EVENTS.USER_ONLINE, ({ userId }) => {
            setOnlineUsers(prev => new Set([...prev, userId]));
        });
        socket.on(SOCKET_EVENTS.USER_OFFLINE, ({ userId }) => {
            setOnlineUsers(prev => {
                const next = new Set(prev);
                next.delete(userId);
                return next;
            });
        });

        socket.on(SOCKET_EVENTS.NEW_MESSAGE, ({ chatId, message }) => {
            if (activeChatRef.current?._id === chatId) {
                setMessages(prev => {
                    if (prev.some(m => m._id === message._id)) return prev;
                    return [...prev, message];
                });
                socket.emit(SOCKET_EVENTS.MESSAGE_DELIVERED, {
                    chatId,
                    messageId: message._id,
                    senderId: message.sender._id || message.sender
                });
                socket.emit(SOCKET_EVENTS.MESSAGES_READ, {
                    chatId,
                    senderId: message.sender._id || message.sender
                });
            } else {
                toast(`New message from ${message.sender?.name || 'someone'}`, { icon: '💬' });
            }
            setChats(prev => prev.map(c =>
                c._id === chatId
                    ? { 
                        ...c, 
                        lastMessage: message.text, 
                        lastMessageAt: message.createdAt,
                        unreadCount: activeChatRef.current?._id === chatId ? 0 : (c.unreadCount || 0) + 1
                      }
                    : c
            ));
        });

        socket.on(SOCKET_EVENTS.MESSAGE_SAVED, ({ chatId, message, tempId }) => {
            setMessages(prev => prev.map(m => m._tempId === tempId ? message : m));
        });
        socket.on(SOCKET_EVENTS.MESSAGE_STATUS_UPDATE, ({ chatId, messageId, status }) => {
            if (activeChatRef.current?._id === chatId) {
                setMessages(prev => prev.map(m =>
                    m._id === messageId ? { ...m, status } : m
                ));
            }
        });

        socket.on(SOCKET_EVENTS.MESSAGES_READ_ACK, ({ chatId }) => {
            if (activeChatRef.current?._id === chatId) {
                const myId = user?._id || user?.id;
                setMessages(prev => prev.map(m => {
                    const senderId = m.sender?._id || m.sender;
                    const isMe = senderId?.toString() === myId?.toString();
                    return isMe ? { ...m, status: 'read' } : m;
                }));
            }
        });

        socket.on(SOCKET_EVENTS.USER_TYPING, ({ chatId }) => {
            setTypingUsers(prev => ({ ...prev, [chatId]: true }));
        });
        socket.on(SOCKET_EVENTS.USER_STOPPED_TYPING, ({ chatId }) => {
            setTypingUsers(prev => ({ ...prev, [chatId]: false }));
        });

        socket.on(SOCKET_EVENTS.CALL_REQUESTED, (data) => {
            setCallRequest(data);
        });
        socket.on(SOCKET_EVENTS.CALL_ENDED, () => {
            setCallSession(null);
        });

        return () => {
            socket.off(SOCKET_EVENTS.USER_ONLINE);
            socket.off(SOCKET_EVENTS.USER_OFFLINE);
            socket.off(SOCKET_EVENTS.NEW_MESSAGE);
            socket.off(SOCKET_EVENTS.MESSAGE_SAVED);
            socket.off(SOCKET_EVENTS.MESSAGE_STATUS_UPDATE);
            socket.off(SOCKET_EVENTS.MESSAGES_READ_ACK);
            socket.off(SOCKET_EVENTS.USER_TYPING);
            socket.off(SOCKET_EVENTS.USER_STOPPED_TYPING);
            socket.off(SOCKET_EVENTS.CALL_REQUESTED);
            socket.off(SOCKET_EVENTS.CALL_ENDED);
        };
    }, [socket]);

        const loadData = async () => {
        setLoadingContacts(true);
        try {
            const [chatsRes, contactsRes] = await Promise.all([
                chatAPI.getUserChats(),
                chatAPI.getEligibleContacts()
            ]);
            const existingChats = chatsRes.data || [];
            const eligibleContacts = contactsRes.data || [];
            setChats(existingChats);
            setContacts(eligibleContacts);
        } catch {
            toast.error('Failed to load conversations', { id: 'load-error' });
        } finally {
            setLoadingContacts(false);
        }
    };

    const loadMessages = async (chatId) => {
        setLoading(true);
        try {
            const res = await chatAPI.getChatMessages(chatId);
            setMessages(res.data?.messages || []);
        } catch {
            toast.error('Failed to load messages', { id: 'messages-error' });
        } finally {
            setLoading(false);
        }
    };

    const markConversationRead = (chatId) => {
        if (!socket || !activeChat) return;
        const other = getOtherParticipant(activeChat);
        if (other) {
            socket.emit(SOCKET_EVENTS.MESSAGES_READ, { chatId, senderId: other._id });
        }
    };

        const handleSend = useCallback(() => {
        if (!text.trim() || !activeChat || !socket) return;

        const other = getOtherParticipant(activeChat);
        if (!other) return;

        const tempMessage = {
            _tempId: Date.now().toString(),
            _id: null,
            sender: { _id: user?._id || user?.id, name: user?.name },
            text: text.trim(),
            status: 'sent',
            createdAt: new Date().toISOString()
        };
        setMessages(prev => [...prev, tempMessage]);
        setText('');

        socket.emit(SOCKET_EVENTS.SEND_MESSAGE, {
            chatId: activeChat._id,
            text: tempMessage.text,
            recipientId: other._id,
            tempId: tempMessage._tempId
        });

        socket.emit(SOCKET_EVENTS.TYPING_STOP, { chatId: activeChat._id, recipientId: other._id });

    }, [text, activeChat, socket, user]);

        const handleTyping = (e) => {
        setText(e.target.value);
        if (!activeChat || !socket) return;
        const other = getOtherParticipant(activeChat);
        if (!other) return;

        socket.emit(SOCKET_EVENTS.TYPING_START, { chatId: activeChat._id, recipientId: other._id });

        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit(SOCKET_EVENTS.TYPING_STOP, { chatId: activeChat._id, recipientId: other._id });
        }, 2000);
    };

    const handleSelectStudent = async (student) => {
        const existing = chats.find(c =>
            c.participants?.some(p => (p._id || p.id) === (student._id || student.id))
        );
        if (existing) {
            setActiveChat(existing);
            setChats(prev => prev.map(c => c._id === existing._id ? { ...c, unreadCount: 0 } : c));
            return;
        }
        setStartingChat(student._id || student.id);
        try {
            const res = await chatAPI.createOrGetChat(student._id || student.id);
            const newChat = res.data;
            if (newChat) { setChats(prev => [newChat, ...prev]); setActiveChat(newChat); }
        } catch (err) {
            toast.error(err.response?.message || err.message || 'Could not start chat');
        } finally { setStartingChat(null); }
    };

        const handleStartCall = async (overrideChatId = null) => {
        const chatId = overrideChatId || activeChat?._id;
        if (!chatId || !socket) return;

        try {
            const res = await chatAPI.getVideoToken(chatId);
            console.log('[TutorChat] getVideoToken response:', res.data);
            const { roomId, serverSecret, appId } = res.data;

            setCallSession({ roomId, serverSecret, appId });

            setCallRequest(null);

            const chat = chats.find(c => c._id === chatId) || activeChat;
            const other = getOtherParticipant(chat);

            socket.emit(SOCKET_EVENTS.INITIATE_CALL, {
                targetUserId: other._id,
                roomId,
                callerName: user?.name,
                callerAvatar: user?.profileImage || null,
            });

            toast.success('Starting call...', { icon: '📹' });
        } catch (err) {
            toast.error(err.response?.message || err.message || 'Failed to start call');
        }
    };

        const getOtherParticipant = (chat) => {
        const myId = (user?._id || user?.id)?.toString();
        return chat?.participants?.find(p => (p._id || p.id)?.toString() !== myId);
    };

    const isOnline = (userId) => onlineUsers.has(userId?.toString());

    const StatusTick = ({ status, isMe }) => {
        if (!isMe) return null;
        if (status === 'read') return <CheckCheck className="w-3.5 h-3.5 text-blue-300 flex-shrink-0" />;
        if (status === 'delivered') return <CheckCheck className="w-3.5 h-3.5 text-purple-300 flex-shrink-0" />;
        return <Check className="w-3.5 h-3.5 text-purple-300 flex-shrink-0" />;
    };

    const buildSidebarItems = () => {
        const myId = (user?._id || user?.id)?.toString();
        const items = [];
        const seenIds = new Set();
        chats.forEach(chat => {
            const other = chat.participants?.find(p => (p._id || p.id)?.toString() !== myId);
            if (!other) return;
            const otherId = (other._id || other.id)?.toString();
            seenIds.add(otherId);
            items.push({ key: chat._id, studentId: otherId, studentObj: other, name: other.name || 'Student', avatar: other.profileImage, lastMessage: chat.lastMessage, lastMessageAt: chat.lastMessageAt, unreadCount: chat.unreadCount || 0, isExistingChat: true, chatData: chat });
        });
        contacts.forEach(student => {
            const sid = (student._id || student.id)?.toString();
            if (seenIds.has(sid)) return;
            items.push({ key: sid, studentId: sid, studentObj: student, name: student.name || 'Student', avatar: student.profileImage, lastMessage: null, lastMessageAt: null, unreadCount: 0, isExistingChat: false, chatData: null });
        });
        return items;
    };

    const sidebarItems = buildSidebarItems().filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const myId = user?._id || user?.id;
    const activePeer = activeChat ? getOtherParticipant(activeChat) : null;

    return (
        <div className="flex h-[calc(100vh-120px)] m-5 rounded-2xl border-2 border-purple-600 overflow-hidden">
            {/* ── Modals */}
            {callSession && (
                <VideoCallModal
                    roomId={callSession.roomId}
                    serverSecret={callSession.serverSecret}
                    appId={callSession.appId}
                    userId={myId}
                    userName={user?.name}
                    onClose={() => setCallSession(null)}
                />
            )}
            {callRequest && (
                <CallRequestModal
                    requestData={callRequest}
                    onStartCall={() => handleStartCall(callRequest.chatId)}
                    onDismiss={() => setCallRequest(null)}
                />
            )}

            {/* LEFT SIDEBAR */}
            <div className="w-80 flex flex-col flex-shrink-0 bg-purple-600">

                {/* Search bar */}
                <div className="p-4">
                    <div className="flex items-center gap-2 bg-purple-500/60 rounded-xl px-3 py-2.5">
                        <Search className="w-4 h-4 text-purple-200 flex-shrink-0" />
                        <input
                            placeholder="Search students..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="flex-1 text-sm text-white placeholder-purple-300 bg-transparent outline-none"
                        />
                    </div>
                    {/* Chat tab underline */}
                    <div className="mt-3 flex gap-4">
                        <div>
                            <span className="text-sm font-semibold text-white">Chat</span>
                            <div className="h-0.5 bg-white rounded-full mt-1 w-full" />
                        </div>
                    </div>
                </div>

                {/* Contact / Chat list */}
                <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
                    {loadingContacts ? (
                        <div className="flex justify-center mt-8">
                            <div className="w-6 h-6 border-2 border-purple-300 border-t-white rounded-full animate-spin" />
                        </div>
                    ) : sidebarItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center mt-12 px-4 text-center gap-2">
                            <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center mb-2">
                                <Phone className="w-5 h-5 text-purple-200" />
                            </div>
                            <p className="text-sm font-medium text-white">No students yet</p>
                            <p className="text-xs text-purple-300 leading-relaxed">
                                Students enrolled in your courses will appear here
                            </p>
                        </div>
                    ) : (
                        sidebarItems.map(item => {
                            const isActive = activeChat && (
                                (item.isExistingChat && activeChat._id === item.chatData?._id) ||
                                (!item.isExistingChat && false)
                            );
                            const online = isOnline(item.studentId);
                            const isLoading = startingChat === item.studentId;

                            return (
                                <button
                                    key={item.key}
                                    onClick={() => {
                                        if (item.isExistingChat) {
                                            setActiveChat(item.chatData);
                                            setChats(prev => prev.map(c => c._id === item.chatData._id ? { ...c, unreadCount: 0 } : c));
                                        } else {
                                            handleSelectStudent(item.studentObj);
                                        }
                                    }}
                                    disabled={isLoading}
                                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left
                                        ${isActive
                                            ? 'bg-white/20'
                                            : 'hover:bg-white/10'
                                        }`}
                                >
                                    {/* Avatar */}
                                    <div className="relative flex-shrink-0">
                                        {item.avatar ? (
                                            <img
                                                src={item.avatar}
                                                alt={item.name}
                                                className="w-11 h-11 rounded-full object-cover border-2 border-white/30"
                                            />
                                        ) : (
                                            <div className="w-11 h-11 rounded-full bg-white/30 flex items-center justify-center text-white font-bold text-base border-2 border-white/30">
                                                {item.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-semibold text-white truncate">{item.name}</p>
                                            {item.lastMessageAt && (
                                                <span className="text-xs text-purple-300 flex-shrink-0">
                                                    {new Date(item.lastMessageAt).toLocaleDateString([], { day: '2-digit', month: 'short' })}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-purple-200 truncate mt-0.5">
                                            {isLoading ? 'Starting chat...' :
                                             item.isExistingChat && typingUsers[item.chatData?._id] ? <span className="italic">typing...</span> :
                                             item.lastMessage || (item.isExistingChat ? 'No messages yet' : 'Tap to start chatting')}
                                        </p>
                                    </div>

                                    {/* Unread badge */}
                                    {item.unreadCount > 0 && (
                                        <span className="bg-white text-purple-600 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold flex-shrink-0">
                                            {item.unreadCount}
                                        </span>
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/*  Main chat area  */}
            {activeChat && activePeer ? (
                <div className="flex-1 flex flex-col bg-purple-50 rounded-r-2xl overflow-hidden">

                    {/* Chat header */}
                    <div className="bg-white border-b border-purple-100 px-5 py-3.5 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                            {activePeer.profileImage ? (
                                <img src={activePeer.profileImage} alt={activePeer.name}
                                    className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                    {activePeer.name?.charAt(0)?.toUpperCase()}
                                </div>
                            )}
                            <div>
                                <p className="font-semibold text-gray-800 text-sm leading-tight">{activePeer.name}</p>
                                <p className="text-xs mt-0.5">
                                    {typingUsers[activeChat._id]
                                        ? <span className="text-purple-500 italic">typing...</span>
                                        : null
                                    }
                                </p>
                            </div>
                        </div>

                        {/* Start call button — tutor only */}
                        <div className="flex items-center gap-2">
                            <button onClick={() => handleStartCall()} title="Start video call"
                                className="p-2 rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200 transition-all">
                                <Video className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-4">
                        {loading ? (
                            <div className="flex justify-center mt-8">
                                <div className="w-6 h-6 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
                            </div>
                        ) : (
                            messages.map((msg, i) => {
                                const senderId = msg.sender?._id || msg.sender;
                                const isMe = senderId?.toString() === myId?.toString();
                                return (
                                    <div key={msg._id || msg._tempId || i}
                                        className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                                    >
                                        {!isMe && (
                                            activePeer.profileImage ? (
                                                <img src={activePeer.profileImage} alt={activePeer.name}
                                                    className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-purple-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                    {activePeer.name?.charAt(0)?.toUpperCase()}
                                                </div>
                                            )
                                        )}
                                        <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                                            isMe
                                                ? 'bg-purple-600 text-white rounded-br-sm'
                                                : 'bg-white text-gray-800 rounded-bl-sm'
                                        }`}>
                                            <p className="leading-relaxed">{msg.text}</p>
                                            <div className={`flex items-center gap-1 mt-0.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <span className={`text-[10px] ${isMe ? 'text-purple-200' : 'text-gray-400'}`}>
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <StatusTick status={msg.status} isMe={isMe} />
                                            </div>
                                        </div>
                                        {isMe && (
                                            user?.profileImage ? (
                                                <img src={user.profileImage} alt={user.name}
                                                    className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                    {user?.name?.charAt(0)?.toUpperCase()}
                                                </div>
                                            )
                                        )}
                                    </div>
                                );
                            })
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 bg-white border-t border-purple-100 flex items-center gap-3">
                        <input
                            value={text}
                            onChange={handleTyping}
                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                            placeholder="Type Your Message"
                            className="flex-1 bg-purple-50 border border-purple-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 placeholder-gray-400"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!text.trim()}
                            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5"
                        >
                            <Send className="w-3.5 h-3.5" />
                            Send
                        </button>
                    </div>
                </div>
            ) : (
                /* Empty state when nothing is selected */
                <div className="flex-1 flex flex-col items-center justify-center bg-purple-50 rounded-r-2xl gap-3">
                    <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                        <Phone className="w-7 h-7 text-purple-400" />
                    </div>
                    <p className="text-base font-semibold text-gray-600">Select a student to chat</p>
                    <p className="text-sm text-gray-400">
                        {contacts.length === 0 && !loadingContacts
                            ? 'Students enrolled in your courses will appear here'
                            : 'Choose a conversation from the left panel'
                        }
                    </p>
                </div>
            )}
        </div>
    );
}
