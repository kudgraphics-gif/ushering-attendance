import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, MapPin, Globe, Calendar, Church, Award, Clock } from 'lucide-react';
import { Avatar } from './Avatar';
import type { VolunteerDto } from '../../types';
import './VolunteerDetailsModal.css';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    volunteer: VolunteerDto | null;
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
    if (!value && value !== 0) return null;
    return (
        <div className="vol-detail-row">
            <span className="vol-detail-row__label">{label}</span>
            <span className="vol-detail-row__value">{String(value)}</span>
        </div>
    );
}

export default function VolunteerDetailsModal({ isOpen, onClose, volunteer }: Props) {
    if (!volunteer) return null;

    const formatDate = (d?: string | null) => {
        if (!d) return null;
        try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
        catch { return d; }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="vol-detail-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="vol-detail-modal glass-strong"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.25 }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="vol-detail-modal__header">
                            <div className="vol-detail-modal__profile">
                                <Avatar src={volunteer.avatar_url} alt={volunteer.first_name} size="xl" />
                                <div>
                                    <h2 className="vol-detail-modal__name">
                                        {volunteer.first_name} {volunteer.last_name}
                                    </h2>
                                    <p className="vol-detail-modal__email">{volunteer.email}</p>
                                    {volunteer.reg_no && (
                                        <p className="vol-detail-modal__reg">REG: {volunteer.reg_no}</p>
                                    )}
                                    <span className={`vol-detail-modal__status ${volunteer.is_active ? 'active' : 'inactive'}`}>
                                        {volunteer.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                            <button className="vol-detail-modal__close" onClick={onClose}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="vol-detail-modal__body">
                            {/* Stats row */}
                            <div className="vol-detail-stats">
                                <div className="vol-detail-stat">
                                    <Award size={18} />
                                    <div>
                                        <span className="vol-detail-stat__val">{volunteer.attendance_count ?? 0}</span>
                                        <span className="vol-detail-stat__label">Attendance</span>
                                    </div>
                                </div>
                                {volunteer.current_roster_hall && (
                                    <div className="vol-detail-stat">
                                        <MapPin size={18} />
                                        <div>
                                            <span className="vol-detail-stat__val">
                                                {volunteer.current_roster_hall.replace(/^"|"$/g, '')}
                                            </span>
                                            <span className="vol-detail-stat__label">Hall</span>
                                        </div>
                                    </div>
                                )}
                                {volunteer.year_joined && (
                                    <div className="vol-detail-stat">
                                        <Calendar size={18} />
                                        <div>
                                            <span className="vol-detail-stat__val">{volunteer.year_joined}</span>
                                            <span className="vol-detail-stat__label">Year Joined</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Sections */}
                            <div className="vol-detail-section">
                                <h3 className="vol-detail-section__title">
                                    <Mail size={15} /> Contact
                                </h3>
                                <InfoRow label="Phone" value={volunteer.phone} />
                                <InfoRow label="Email" value={volunteer.email} />
                            </div>

                            <div className="vol-detail-section">
                                <h3 className="vol-detail-section__title">
                                    <Globe size={15} /> Location
                                </h3>
                                <InfoRow label="Address" value={volunteer.address} />
                                <InfoRow label="City" value={volunteer.city} />
                                <InfoRow label="State" value={volunteer.state} />
                                <InfoRow label="Country" value={volunteer.country} />
                            </div>

                            <div className="vol-detail-section">
                                <h3 className="vol-detail-section__title">
                                    <Church size={15} /> Ministry
                                </h3>
                                <InfoRow label="Local Church" value={volunteer.local_church} />
                                <InfoRow label="Role" value={volunteer.role} />
                                <InfoRow label="Gender" value={volunteer.gender} />
                                <InfoRow label="Date of Birth" value={formatDate(volunteer.dob)} />
                                <InfoRow label="Roster Allocation" value={volunteer.current_roster_allocation} />
                            </div>

                            <div className="vol-detail-section">
                                <h3 className="vol-detail-section__title">
                                    <Clock size={15} /> Activity
                                </h3>
                                <InfoRow label="Last Attendance" value={formatDate(volunteer.last_attendance)} />
                                <InfoRow label="Last Seen" value={formatDate(volunteer.last_seen)} />
                                <InfoRow label="Member Since" value={formatDate(volunteer.created_at)} />
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
