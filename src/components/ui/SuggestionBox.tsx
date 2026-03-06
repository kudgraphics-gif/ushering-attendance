import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquarePlus, X, Send, MessageCircle } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { suggestionsAPI } from '../../services/api';
import { Button } from './Button';
import toast from 'react-hot-toast';
import './SuggestionBox.css';

interface Suggestion {
    id: string;
    user: string;
    message: string;
    date: string;
    avatar?: string;
}

// suggestion list loaded from API for admin

export function SuggestionBox() {
    const [isOpen, setIsOpen] = useState(false);
    const { user } = useAuthStore();
    const isAdmin = user?.role === 'Admin';
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [selectedSuggestion, setSelectedSuggestion] = useState<any | null>(null);
    const [loadingList, setLoadingList] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const toggleOpen = () => setIsOpen(!isOpen);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        setSending(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Simple Toast
        toast.success('Suggestion sent! Thank you for your feedback.', {
            style: {
                background: '#1e1e1e',
                color: '#fff',
                border: '1px solid #333'
            }
        });

        setMessage('');
        setSending(false);
        setIsOpen(false);
    };

    useEffect(() => {
        if (isAdmin) {
            fetchSuggestions();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAdmin]);

    const fetchSuggestions = async () => {
        setLoadingList(true);
        try {
            const resp = await suggestionsAPI.getAll();
            const list = resp.items || [];
            const sorted = list.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setSuggestions(sorted);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load suggestions');
        } finally {
            setLoadingList(false);
        }
    };

    const openSuggestion = async (id: number | string) => {
        try {
            const data = await suggestionsAPI.getById(id);
            setSelectedSuggestion(data);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load suggestion');
        }
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
                        {/* Header */}
                        <div className="suggestion-box__header">
                            <div className="suggestion-box__title">
                                <MessageCircle size={20} />
                                <span>{isAdmin ? 'Suggestion Inbox' : 'Suggestion Box'}</span>
                            </div>
                            {isAdmin && (
                                <span className="suggestion-box__badge">Admin View</span>
                            )}
                        </div>

                        {/* Content */}
                        <div className="suggestion-box__content">
                            {isAdmin ? (
                                // Admin View (Read Only)
                                <div className="suggestion-list">
                                            <div className="suggestion-list__controls" style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                                                <input
                                                    placeholder="Search suggestions..."
                                                    value={searchTerm}
                                                    onChange={e => setSearchTerm(e.target.value)}
                                                    style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-glass)', color: 'var(--text-primary)' }}
                                                />
                                                <Button variant="secondary" size="sm" onClick={fetchSuggestions}>Refresh</Button>
                                            </div>
                                            {loadingList ? (
                                                <div style={{ textAlign: 'center', padding: 16 }}>Loading...</div>
                                            ) : (
                                                suggestions
                                                    .filter(s => `${s.message} ${s.category}`.toLowerCase().includes(searchTerm.toLowerCase()))
                                                    .map((suggestion) => (
                                                        <div key={suggestion.id} className="suggestion-item" onClick={() => openSuggestion(suggestion.id)} style={{ cursor: 'pointer' }}>
                                                            <div className="suggestion-item__header">
                                                                <div className="suggestion-item__avatar" />
                                                                <div className="suggestion-item__info">
                                                                    <div className="suggestion-item__name">Suggestion #{suggestion.id}</div>
                                                                    <div className="suggestion-item__date">{new Date(suggestion.createdAt).toLocaleString()}</div>
                                                                    <p className="suggestion-item__message">{suggestion.message}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                            )}
                                    <div className="suggestion-item--empty" style={{ textAlign: 'center', opacity: 0.5, fontSize: '12px' }}>
                                        End of suggestions
                                    </div>
                                </div>
                            ) : (
                                // User View (Write)
                                <form onSubmit={handleSend} className="suggestion-form">
                                    <p className="suggestion-form__hint">
                                        Have an idea to improve the Ushering department? Let us know!
                                    </p>
                                    <textarea
                                        rows={4}
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Type your suggestion here..."
                                        className="suggestion-form__input"
                                        required
                                    />
                                    <div className="suggestion-form__actions">
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            size="sm"
                                            loading={sending}
                                            icon={<Send size={16} />}
                                        >
                                            Send Suggestion
                                        </Button>
                                    </div>
                                </form>
                            )}
                        {selectedSuggestion && (
                            <div style={{ marginTop: 12 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h4 style={{ margin: 0 }}>Suggestion Details</h4>
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedSuggestion(null)}>Close</Button>
                                </div>
                                <div style={{ marginTop: 8, padding: 12, borderRadius: 8, background: 'var(--surface-glass)' }}>
                                    <p style={{ margin: 0, fontWeight: 700 }}>{selectedSuggestion.category}</p>
                                    <p style={{ marginTop: 8 }}>{selectedSuggestion.message}</p>
                                    <p style={{ marginTop: 8, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{new Date(selectedSuggestion.createdAt).toLocaleString()}</p>
                                </div>
                            </div>
                        )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
