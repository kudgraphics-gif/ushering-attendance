import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Heart, History } from 'lucide-react';
import type { UserDto } from '../../types';
import { rosterAPI } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import './UserDetailsModal.css';

interface UserDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: UserDto | null;
}

export function UserDetailsModal({ isOpen, onClose, user }: UserDetailsModalProps) {
    const { token } = useAuthStore();
    const [rosterHistory, setRosterHistory] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Fetch user roster history
    useEffect(() => {
        if (isOpen && user?.id && token) {
            setHistoryLoading(true);
            rosterAPI.getUserHistory(user.id, token)
                .then((data) => {
                    setRosterHistory(data || []);
                })
                .catch((err) => {
                    console.error('Failed to load user roster history:', err);
                })
                .finally(() => {
                    setHistoryLoading(false);
                });
        } else {
            setRosterHistory([]);
        }
    }, [isOpen, user?.id, token]);

    if (!user) return null;

    const getDobYear = (dob?: string) => {
        if (!dob) return 'not filled yet';
        try {
            return new Date(dob).getFullYear().toString();
        } catch {
            return 'not filled yet';
        }
    };

    const getValue = (val?: string | null) => (val ? val : 'not filled yet');

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="user-details-modal__overlay">
                    <motion.div
                        className="user-details-modal__backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    <motion.div
                        className="user-details-modal__content"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        style={{ maxHeight: '90vh', overflowY: 'auto' }}
                    >
                        <div className="user-details-modal__header">
                            <div>
                                <h2 className="user-details-modal__title">User Profile</h2>
                                <p className="user-details-modal__subtitle">Details for {user.first_name} {user.last_name}</p>
                            </div>
                            <button className="user-details-modal__close" onClick={onClose}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="user-details-modal__body">
                            <section className="user-details-modal__section">
                                <h3 className="user-details-modal__section-title">
                                    <User size={18} /> Personal Details
                                </h3>
                                <div className="user-details-modal__grid">
                                    <DetailItem label="First Name" value={getValue(user.first_name)} />
                                    <DetailItem label="Last Name" value={getValue(user.last_name)} />
                                    <DetailItem label="Email" value={getValue(user.email)} />
                                    <DetailItem label="Year of Birth" value={getDobYear(user.dob)} />
                                    <DetailItem label="Roster Hall" value={getValue(user.current_roster_hall)} />
                                    {user.role && (user.role as string) !== 'Ksom' && (user.role as string) !== 'ksom' && (
                                        <DetailItem label="Role" value={getValue(user.role)} />
                                    )}
                                    <DetailItem label="Gender" value={getValue(user.gender)} />
                                    <DetailItem label="Phone Number" value={getValue(user.phone)} />
                                    <DetailItem label="Address" value={getValue(user.address)} />
                                    <DetailItem label="City" value={getValue(user.city)} />
                                    <DetailItem label="State" value={getValue(user.state)} />
                                    <DetailItem label="Country" value={getValue(user.country)} />
                                    <DetailItem label="Local Church" value={getValue(user.local_church)} />
                                </div>
                            </section>

                            <section className="user-details-modal__section">
                                <h3 className="user-details-modal__section-title">
                                    <Heart size={18} /> Close Relative Details
                                </h3>
                                <div className="user-details-modal__grid">
                                    <DetailItem label="Name" value={getValue(user.patreon_name)} />
                                    <DetailItem label="Phone" value={getValue(user.patreon_phone)} />
                                    <DetailItem label="Residence" value={getValue(user.patreon_address)} />
                                    <DetailItem label="Relationship" value={getValue(user.patreon_relationship)} />
                                </div>
                            </section>

                            <section className="user-details-modal__section" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px' }}>
                                <h3 className="user-details-modal__section-title">
                                    <History size={18} /> Roster Assignment History
                                </h3>
                                {historyLoading ? (
                                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '13px', padding: '10px 0' }}>
                                        Loading history...
                                    </div>
                                ) : rosterHistory.length === 0 ? (
                                    <div style={{ color: 'var(--color-text-tertiary)', fontSize: '13px', fontStyle: 'italic', padding: '10px 0' }}>
                                        No previous roster assignments found
                                    </div>
                                ) : (
                                    <div className="user-roster-history-timeline" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                                        {rosterHistory.map((item, idx) => (
                                            <div 
                                                key={item.id || idx} 
                                                style={{ 
                                                    display: 'flex', 
                                                    flexDirection: 'column', 
                                                    gap: '6px', 
                                                    background: 'rgba(255, 255, 255, 0.02)', 
                                                    border: '1px solid rgba(255, 255, 255, 0.04)', 
                                                    borderLeft: '3px solid var(--color-primary)',
                                                    borderRadius: 'var(--radius-md)', 
                                                    padding: '12px',
                                                    position: 'relative'
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontWeight: 600, color: '#fff', fontSize: '13px' }}>
                                                        {item.roster_name}
                                                    </span>
                                                    <span style={{ 
                                                        fontSize: '11px', 
                                                        fontWeight: 700, 
                                                        color: 'var(--color-primary)', 
                                                        background: 'rgba(212, 175, 55, 0.12)', 
                                                        border: '1px solid rgba(212, 175, 55, 0.25)',
                                                        borderRadius: '4px',
                                                        padding: '2px 8px'
                                                    }}>
                                                        {item.hall}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                                                    <span>Start: {new Date(item.start_date).toLocaleDateString()}</span>
                                                    <span>End: {new Date(item.end_date).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

function DetailItem({ label, value }: { label: string; value: string }) {
    const isNotFilled = value.toLowerCase() === 'not filled yet';
    return (
        <div className="user-details-modal__item">
            <span className="user-details-modal__label">{label}</span>
            <span className={`user-details-modal__value ${isNotFilled ? 'user-details-modal__value--empty' : ''}`}>
                {value}
            </span>
        </div>
    );
}
