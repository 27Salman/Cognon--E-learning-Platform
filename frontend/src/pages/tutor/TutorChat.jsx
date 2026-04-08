import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Search, Send } from 'lucide-react';
import { chatAPI } from '../../api/chatAPI';
import toast from 'react-hot-toast';

export default function TutorChat() {
    const { user } = useSelector(state => state.auth);
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef(null);

    useEffect(() => {
        loadChats();
    }, []);

    useEffect(() => {
        if (activeChat) loadMessages(activeChat._id);
    }, [activeChat]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const loadChats = async () => {
        try {
            const res = await chatAPI.getUserChats();
            setChats(res.data?.data || []);
        } catch {
            toast.error('Failed to load chats');
        }
    };

    const loadMessages = async (chatId) => {
        setLoading(true);
        try {
            const res = await chatAPI.getChatMessages(chatId);
            setMessages(res.data?.data?.messages || []);
        } catch {
            toast.error('Failed to load messages');
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!text.trim() || !activeChat) return;
        try {
            const res = await chatAPI.sendMessage(activeChat._id, text.trim());
            setMessages(prev => [...prev, res.data?.data]);
            setText('');
        } catch {
            toast.error('Failed to send message');
        }
    };

    const getOtherParticipant = (chat) =>
        chat.participants?.find(p => p._id !== user?._id);

    return (
        <div className="flex h-[calc(100vh-130px)]">
            {/* Chat list */}
            <div className="w-72 bg-purple-50 border-r border-purple-200 flex flex-col flex-shrink-0">
                <div className="p-3 border-b border-purple-200">
                    <div className="flex items-center gap-2 bg-white border border-purple-200 rounded-lg px-3 py-2">
                        <Search className="w-4 h-4 text-gray-400" />
                        <input placeholder="Search" className="flex-1 text-sm outline-none bg-transparent" />
                    </div>
                    <div className="mt-2 border-b-2 border-purple-600 pb-1 w-fit">
                        <span className="text-sm font-semibold text-purple-600">Chat</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {chats.length === 0 ? (
                        <p className="text-center text-sm text-gray-400 mt-8">No conversations yet</p>
                    ) : (
                        chats.map(chat => {
                            const other = getOtherParticipant(chat);
                            return (
                                <button key={chat._id} onClick={() => setActiveChat(chat)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-100 transition-colors text-left ${activeChat?._id === chat._id ? 'bg-purple-100' : ''}`}>
                                    <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                        {other?.name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-800 truncate">{other?.name || 'User'}</p>
                                        <p className="text-xs text-gray-500 truncate">{chat.lastMessage || 'No messages yet'}</p>
                                    </div>
                                    <span className="text-xs text-gray-400 flex-shrink-0">1d</span>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Message area */}
            {activeChat ? (
                <div className="flex-1 flex flex-col bg-purple-50">
                    {/* Header */}
                    <div className="bg-purple-50 border-b border-purple-200 px-4 py-3 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm">
                            {getOtherParticipant(activeChat)?.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                            <p className="font-semibold text-gray-800 text-sm">{getOtherParticipant(activeChat)?.name}</p>
                            <p className="text-xs text-green-500">Online</p>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {loading ? (
                            <p className="text-center text-gray-400 text-sm">Loading...</p>
                        ) : (
                            messages.map((msg, i) => {
                                const isMe = msg.sender?._id === user?._id || msg.sender === user?._id;
                                return (
                                    <div key={i} className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        {!isMe && (
                                            <div className="w-8 h-8 rounded-full bg-purple-300 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                {getOtherParticipant(activeChat)?.name?.charAt(0)?.toUpperCase()}
                                            </div>
                                        )}
                                        <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${
                                            isMe
                                                ? 'bg-purple-600 text-white rounded-br-sm'
                                                : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
                                        }`}>
                                            {msg.text}
                                        </div>
                                        {isMe && (
                                            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                {user?.name?.charAt(0)?.toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t border-purple-200 bg-white flex items-center gap-2">
                        <input
                            value={text}
                            onChange={e => setText(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                            placeholder="Type Your Message"
                            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                        />
                        <button onClick={handleSend}
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors flex items-center gap-1">
                            <Send className="w-4 h-4" /> Send
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center bg-purple-50 text-gray-400 text-sm">
                    Select a conversation to start chatting
                </div>
            )}
        </div>
    );
}
