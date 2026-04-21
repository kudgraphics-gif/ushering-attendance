import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Heart } from 'lucide-react';
import type { UserDto } from '../../types';
import './UserDetailsModal.css';

interface UserDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: UserDto | null;
}

export function UserDetailsModal({ isOpen, onClose, user }: UserDetailsModalProps) {
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
                                    <DetailItem label="Year Joined" value={getValue(user.year_joined)} />
                                    <DetailItem label="Roster Hall" value={getValue(user.current_roster_hall)} />
                                    <DetailItem label="Role" value={getValue(user.role)} />
                                    <DetailItem label="Gender" value={getValue(user.gender)} />
                                    <DetailItem label="Phone Number" value={getValue(user.phone)} />
                                    <DetailItem label="Address" value={getValue(user.address)} />
                                    <DetailItem label="City" value={getValue(user.city)} />
                                    <DetailItem label="State" value={getValue(user.state)} />
                                    <DetailItem label="Country" value={getValue(user.country)} />
                                </div>
                            </section>

                            <section className="user-details-modal__section">
                                <h3 className="user-details-modal__section-title">
                                    <Heart size={18} /> Close Relative Details
                                </h3>
                                <div className="user-details-modal__grid">
                                    <DetailItem label="First Name" value={getValue(user.contact_first_name)} />
                                    <DetailItem label="Last Name" value={getValue(user.contact_last_name)} />
                                    <DetailItem label="Phone" value={getValue(user.contact_phone)} />
                                    <DetailItem label="Email" value={getValue(user.contact_email)} />
                                    <DetailItem label="Residence" value={getValue(user.contact_residence)} />
                                    <DetailItem label="Relationship" value={getValue(user.contact_relationship)} />
                                </div>
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
