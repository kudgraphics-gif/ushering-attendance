import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquarePlus, X, Send, MessageCircle } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
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

const MOCK_SUGGESTIONS: Suggestion[] = [
    {
        id: '1',
        user: 'Sarah Johnson',
        message: 'We need more ushered seating in the overflow section during second service.',
        date: '2 min ago',
        avatar: 'https://i.pravatar.cc/150?u=1'
    },
    {
        id: '2',
        user: 'Michael Chen',
        message: 'The new digital check-in system is working great! elaborate on better optimized routes though.',
        date: '1 hour ago',
        avatar: 'https://i.pravatar.cc/150?u=2'
    },
    {
        id: '3',
        user: 'David Okon',
        message: 'Can we have a debrief meeting after the special service next Sunday?',
        date: 'Yesterday',
        avatar: 'https://i.pravatar.cc/150?u=3'
    }
];

export function SuggestionBox() {
    const [isOpen, setIsOpen] = useState(false);
    const { user } = useAuthStore();
    const isAdmin = user?.role === 'Admin';
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

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
                                    {MOCK_SUGGESTIONS.map((suggestion) => (
                                        <div key={suggestion.id} className="suggestion-item">
                                            <div className="suggestion-item__header">
                                                <img
                                                    src={suggestion.avatar}
                                                    alt={suggestion.user}
                                                    className="suggestion-item__avatar"
                                                />
                                                <div className="suggestion-item__info">
                                                    <div className="suggestion-item__name">{suggestion.user}</div>
                                                    <div className="suggestion-item__date">{suggestion.date}</div>
                                                    <p className="suggestion-item__message">{suggestion.message}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
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
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
