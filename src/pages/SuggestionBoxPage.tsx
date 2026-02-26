import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    MessageSquare,
    Send,
    Clock,
    RefreshCw,
    EyeOff,
    ShieldCheck,
} from 'lucide-react';
import { format, isValid, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

import { suggestionsAPI } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import type { Suggestion } from '../types';
import './SuggestionBoxPage.css';

const CATEGORIES = ['General', 'Worship', 'Operations', 'Finance', 'Communication', 'Other'];

function fmtTimestamp(ts: string) {
    const d = parseISO(ts);
    if (!isValid(d)) return ts;
    return format(d, "MMM d, yyyy 'at' h:mm a");
}

// ─── Admin View ──────────────────────────────────────────────────────────────

function AdminSuggestions() {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);

    useEffect(() => { fetchSuggestions(); }, []);

    const fetchSuggestions = async () => {
        setLoading(true);
        try {
            const data = await suggestionsAPI.getAll();
            setSuggestions(data.items);
            setTotalCount(data.totalCount);
        } catch (err) {
            toast.error('Failed to load suggestions');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            className="suggestion-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <div className="suggestion-page__header">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                    <div>
                        <h1 className="suggestion-page__title">Suggestion Box</h1>
                        <p className="suggestion-page__subtitle">
                            {totalCount} anonymous suggestion{totalCount !== 1 ? 's' : ''} received
                        </p>
                    </div>
                    <Button
                        variant="secondary"
                        icon={<RefreshCw size={16} />}
                        onClick={fetchSuggestions}
                        loading={loading}
                    >
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Anonymity notice */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px', borderRadius: 12, background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.2)', color: 'var(--text-secondary)', fontSize: '0.83rem', lineHeight: 1.5, marginBottom: 'var(--space-xl)' }}>
                <EyeOff size={16} style={{ flexShrink: 0, marginTop: 1, color: 'var(--color-primary)' }} />
                <span>All suggestions are <strong style={{ color: 'var(--text-primary)' }}>completely anonymous</strong>. No identity information is linked to any submission.</span>
            </div>

            {loading ? (
                <div className="suggestion-page__loading">
                    <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite' }} />
                    <p>Loading suggestions...</p>
                </div>
            ) : suggestions.length === 0 ? (
                <Card glass>
                    <div className="suggestion-page__empty">
                        <MessageSquare size={48} />
                        <p style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>No suggestions yet</p>
                        <p>Suggestions submitted by members will appear here.</p>
                    </div>
                </Card>
            ) : (
                <div className="suggestion-list">
                    {suggestions.map((s, i) => (
                        <motion.div
                            key={s.id}
                            className="suggestion-item"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                        >
                            <div className="suggestion-item__header">
                                <span className="suggestion-item__category">{s.category}</span>
                                <span className="suggestion-item__time">
                                    <Clock size={12} />
                                    {fmtTimestamp(s.createdAt)}
                                </span>
                            </div>
                            <p className="suggestion-item__message">{s.message}</p>
                            <div className="suggestion-item__anon">
                                <EyeOff size={11} /> Anonymous submission
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </motion.div>
    );
}

// ─── User Submit View ─────────────────────────────────────────────────────────

function UserSubmitForm() {
    const [message, setMessage] = useState('');
    const [category, setCategory] = useState('General');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) { toast.error('Please write your suggestion'); return; }
        setLoading(true);
        try {
            await suggestionsAPI.submit({ message: message.trim(), category });
            setSubmitted(true);
            setMessage('');
            setCategory('General');
            toast.success('Suggestion submitted anonymously!');
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to submit suggestion');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            className="suggestion-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <div className="suggestion-page__header">
                <h1 className="suggestion-page__title">Suggestion Box</h1>
                <p className="suggestion-page__subtitle">Share your thoughts anonymously with leadership</p>
            </div>

            <Card glass className="suggestion-form-card">
                {submitted ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--text-secondary)' }}
                    >
                        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#10B981' }}>
                            <ShieldCheck size={32} />
                        </div>
                        <h3 style={{ color: 'var(--text-primary)', margin: '0 0 8px' }}>Thank you!</h3>
                        <p style={{ fontSize: '0.9rem', marginBottom: '24px' }}>Your suggestion has been submitted anonymously. Leadership will review it.</p>
                        <Button variant="primary" icon={<MessageSquare size={16} />} onClick={() => setSubmitted(false)}>
                            Submit Another
                        </Button>
                    </motion.div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="suggestion-form__anon-note">
                            <EyeOff size={15} />
                            <span>Your submission is <strong>completely anonymous</strong>. No personal information is collected or stored alongside your message.</span>
                        </div>

                        <div className="suggestion-form__field">
                            <label className="suggestion-form__label">Category</label>
                            <select
                                className="suggestion-form__select"
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                            >
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        <div className="suggestion-form__field">
                            <label className="suggestion-form__label">Your Suggestion</label>
                            <textarea
                                className="suggestion-form__textarea"
                                placeholder="Write your suggestion, feedback, or idea here..."
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                required
                                maxLength={1000}
                            />
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'right', marginTop: 4 }}>
                                {message.length}/1000
                            </div>
                        </div>

                        <div className="suggestion-form__footer">
                            <Button
                                type="submit"
                                variant="primary"
                                icon={<Send size={16} />}
                                loading={loading}
                            >
                                Submit Anonymously
                            </Button>
                        </div>
                    </form>
                )}
            </Card>

            {/* Info cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-md)', marginTop: 'var(--space-xl)' }}>
                {[
                    { icon: <EyeOff size={20} />, title: 'Anonymous', desc: 'Your identity is never shared with anyone' },
                    { icon: <ShieldCheck size={20} />, title: 'Safe', desc: 'All submissions are securely handled' },
                    { icon: <MessageSquare size={20} />, title: 'Reviewed', desc: 'Leadership reads every suggestion' },
                ].map(item => (
                    <Card glass key={item.title} style={{ padding: 'var(--space-lg)', display: 'flex', alignItems: 'flex-start', gap: 'var(--space-md)' }}>
                        <div style={{ color: 'var(--color-primary)', marginTop: 2 }}>{item.icon}</div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 4 }}>{item.title}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.desc}</div>
                        </div>
                    </Card>
                ))}
            </div>
        </motion.div>
    );
}

// ─── Page Entry Point ─────────────────────────────────────────────────────────

export function SuggestionBoxPage() {
    const { user } = useAuthStore();
    return user?.role === 'Admin' ? <AdminSuggestions /> : <UserSubmitForm />;
}
