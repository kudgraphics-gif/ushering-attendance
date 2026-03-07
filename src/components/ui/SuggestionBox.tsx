import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquarePlus, X, Send, User, ChevronLeft, MoreVertical, Search, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { suggestionsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import './SuggestionBox.css';

interface ChatMessage {
    id: string;
    text: string;
    sender: 'system' | 'user';
    timestamp: Date;
    status?: 'sending' | 'sent';
}

export function SuggestionBox() {
    const [isOpen, setIsOpen] = useState(false);
    const { user } = useAuthStore();
    const isAdmin = user?.role === 'Admin';

    // User State
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'welcome',
            text: 'Hi there! 👋\nHave an idea to improve the Ushering department? Let us know below. Your feedback goes directly to the admins.',
            sender: 'system',
            timestamp: new Date()
        }
    ]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Admin State
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [selectedSuggestion, setSelectedSuggestion] = useState<any | null>(null);
    const [loadingList, setLoadingList] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const toggleOpen = () => setIsOpen(!isOpen);

    // Scroll to bottom of chat
    useEffect(() => {
        if (!isAdmin && isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen, isAdmin]);

    useEffect(() => {
        if (isAdmin && isOpen) {
            fetchSuggestions();
        }
    }, [isAdmin, isOpen]);

    const fetchSuggestions = async () => {
        setLoadingList(true);
        try {
            const resp = await suggestionsAPI.getAll();
            // @ts-ignore - The response object structure might be nested
            const list = resp.items || resp.data || resp || [];
            if (Array.isArray(list)) {
                const sorted = list.sort((a: any, b: any) => new Date(b.createdAt || b.created_at).getTime() - new Date(a.createdAt || a.created_at).getTime());
                setSuggestions(sorted);
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to load suggestions');
        } finally {
            setLoadingList(false);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        const textToSend = message.trim();
        const newMsgId = Date.now().toString();

        // Add user message to UI immediately
        const newUserMsg: ChatMessage = {
            id: newMsgId,
            text: textToSend,
            sender: 'user',
            timestamp: new Date(),
            status: 'sending'
        };

        setMessages(prev => [...prev, newUserMsg]);
        setMessage('');

        try {
            await suggestionsAPI.submit({ message: textToSend, category: 'General' });

            // Mark as sent
            setMessages(prev => prev.map(m => m.id === newMsgId ? { ...m, status: 'sent' } : m));

            // Auto reply after a short delay
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    text: 'Thank you! We have received your suggestion.',
                    sender: 'system',
                    timestamp: new Date()
                }]);
            }, 800);

        } catch (err) {
            console.error(err);
            toast.error('Failed to send suggestion');
            // Remove the failed message or show as failed (simplifying by removing here)
            setMessages(prev => prev.filter(m => m.id !== newMsgId));
        }
    };

    const formatTime = (date: string | Date) => {
        return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (date: string | Date) => {
        const d = new Date(date);
        if (d.toDateString() === new Date().toDateString()) return 'Today';
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    return (
        <>
            {/* Floating Action Button */}
            <motion.button
                className="suggestion-box__fab"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleOpen}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
                {isOpen ? <X size={24} /> : <MessageSquarePlus size={24} />}
            </motion.button>

            {/* Popup Container */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="suggestion-box__popup"
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                        {/* ── Admin View ── */}
                        {isAdmin ? (
                            selectedSuggestion ? (
                                // Admin: Suggestion Detail View (Chat looking)
                                <div className="sb-admin-detail">
                                    <div className="sb-header">
                                        <button className="sb-back-btn" onClick={() => setSelectedSuggestion(null)}>
                                            <ChevronLeft size={24} />
                                        </button>
                                        <div className="sb-header-info">
                                            <div className="sb-avatar"><User size={20} /></div>
                                            <div className="sb-header-text">
                                                <div className="sb-title">Anonymous #{selectedSuggestion.id || 'User'}</div>
                                                <div className="sb-subtitle">{selectedSuggestion.category || 'General Suggestion'}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="sb-chat-body">
                                        <div className="sb-date-divider">
                                            <span>{formatDate(selectedSuggestion.createdAt || selectedSuggestion.created_at || new Date())}</span>
                                        </div>
                                        <div className="sb-bubble sb-bubble--user">
                                            <div className="sb-bubble-text">{selectedSuggestion.message}</div>
                                            <div className="sb-bubble-time">{formatTime(selectedSuggestion.createdAt || selectedSuggestion.created_at || new Date())}</div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                // Admin: Chats List View
                                <div className="sb-admin-list">
                                    <div className="sb-header">
                                        <div className="sb-header-info">
                                            <div className="sb-header-text">
                                                <div className="sb-title">Suggestions Inbox</div>
                                                <div className="sb-subtitle">Admin View</div>
                                            </div>
                                        </div>
                                        <div className="sb-header-actions">
                                            <button className="sb-icon-btn" onClick={fetchSuggestions}><MoreVertical size={20} /></button>
                                        </div>
                                    </div>
                                    <div className="sb-search-bar">
                                        <div className="sb-search-inner">
                                            <Search size={16} />
                                            <input
                                                type="text"
                                                placeholder="Search or start new chat"
                                                value={searchTerm}
                                                onChange={e => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="sb-chats">
                                        {loadingList ? (
                                            <div className="sb-loading">Loading suggestions...</div>
                                        ) : (
                                            suggestions
                                                .filter(s => `${s.message} ${s.category}`.toLowerCase().includes(searchTerm.toLowerCase()))
                                                .map(s => (
                                                    <div className="sb-chat-item" key={s.id} onClick={() => setSelectedSuggestion(s)}>
                                                        <div className="sb-chat-avatar"><User size={20} /></div>
                                                        <div className="sb-chat-content">
                                                            <div className="sb-chat-top">
                                                                <span className="sb-chat-name">Anonymous #{s.id || 'User'}</span>
                                                                <span className="sb-chat-time">{formatDate(s.createdAt || s.created_at || new Date())}</span>
                                                            </div>
                                                            <div className="sb-chat-bottom">
                                                                <span className="sb-chat-preview">{s.message}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                        )}
                                        {!loadingList && suggestions.length === 0 && (
                                            <div className="sb-empty">No suggestions yet.</div>
                                        )}
                                    </div>
                                </div>
                            )
                        ) : (
                            // ── User View (WhatsApp like chat) ──
                            <div className="sb-user-chat">
                                <div className="sb-header">
                                    <div className="sb-header-info">
                                        <div className="sb-avatar">
                                            <img src="/logo.png" alt="Admin" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                            <div className="sb-avatar-fallback"><User size={20} /></div>
                                        </div>
                                        <div className="sb-header-text">
                                            <div className="sb-title">Koinonia Admin</div>
                                            <div className="sb-subtitle" style={{ color: '#10B981' }}>Available</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="sb-chat-body">
                                    <div className="sb-date-divider">
                                        <span>Today</span>
                                    </div>
                                    {messages.map(msg => (
                                        <motion.div
                                            key={msg.id}
                                            className={`sb-bubble sb-bubble--${msg.sender}`}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                        >
                                            <div className="sb-bubble-text">{msg.text}</div>
                                            <div className="sb-bubble-meta">
                                                <span className="sb-bubble-time">{formatTime(msg.timestamp)}</span>
                                                {msg.sender === 'user' && (
                                                    <span className={`sb-bubble-status sb-bubble-status--${msg.status}`}>
                                                        <CheckCircle2 size={12} />
                                                    </span>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                                <div className="sb-chat-input-area">
                                    <form onSubmit={handleSend} className="sb-input-form">
                                        <input
                                            type="text"
                                            value={message}
                                            onChange={e => setMessage(e.target.value)}
                                            placeholder="Type a suggestion..."
                                            className="sb-input"
                                            autoComplete="off"
                                        />
                                        <button
                                            type="submit"
                                            className={`sb-send-btn ${message.trim() ? 'active' : ''}`}
                                            disabled={!message.trim()}
                                        >
                                            <Send size={18} />
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
