import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Mail, MapPin, Church, Award, Clock, BookOpen,
  UserCheck, UserX, RotateCcw, Trash2, ShieldCheck, ShieldAlert 
} from 'lucide-react';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { Modal } from './Modal';
import { Button } from './Button';
import type { VolunteerDto } from '../../types';
import { volunteersAPI } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';
import './VolunteerDetailsModal.css';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    volunteer: VolunteerDto | null;
    onActionSuccess?: () => void;
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

export default function VolunteerDetailsModal({ isOpen, onClose, volunteer, onActionSuccess }: Props) {
    const { token } = useAuthStore();
    const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    // Fetch historical attendance check-ins
    useEffect(() => {
        if (isOpen && volunteer?.id && token) {
            setHistoryLoading(true);
            volunteersAPI.getAttendance(volunteer.id, token)
                .then(data => {
                    setAttendanceHistory(data || []);
                })
                .catch(err => {
                    console.error('Failed to load volunteer attendance:', err);
                })
                .finally(() => {
                    setHistoryLoading(false);
                });
        } else {
            setAttendanceHistory([]);
        }
    }, [isOpen, volunteer?.id, token]);

    if (!volunteer) return null;

    const formatDate = (d?: string | null) => {
        if (!d) return null;
        try { 
            return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); 
        } catch { 
            return d; 
        }
    };

    const formatTime = (timeStr?: string) => {
        if (!timeStr) return '';
        try {
            // If it's a full ISO timestamp
            if (timeStr.includes('T')) {
                return new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
            return timeStr;
        } catch {
            return timeStr;
        }
    };

    // Admin Action Handlers
    const handleToggleActive = async () => {
        if (!token) return;
        const newActiveState = !volunteer.is_active;
        const actionText = newActiveState ? 'activate' : 'deactivate';
        if (!window.confirm(`Are you sure you want to ${actionText} this volunteer?`)) return;

        setActionLoading(true);
        try {
            if (newActiveState) {
                await volunteersAPI.activate(volunteer.id, token);
            } else {
                await volunteersAPI.deactivate(volunteer.id, token);
            }
            toast.success(`Volunteer ${newActiveState ? 'activated' : 'deactivated'} successfully`);
            onActionSuccess?.();
            onClose();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : `Failed to ${actionText} volunteer`);
        } finally {
            setActionLoading(false);
        }
    };

    const handleChangeState = async (status: 'Accepted' | 'Rejected' | 'Unprocessed') => {
        if (!token) return;
        setActionLoading(true);
        try {
            await volunteersAPI.changeState(volunteer.id, status, token);
            toast.success(`Volunteer status updated to ${status}`);
            onActionSuccess?.();
            onClose();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update status');
        } finally {
            setActionLoading(false);
        }
    };

    const handleResetDevice = async () => {
        if (!token) return;
        if (!window.confirm('Reset the bound device ID for this volunteer?')) return;
        
        setActionLoading(true);
        try {
            await volunteersAPI.resetDevice(volunteer.id, token);
            toast.success('Device ID reset successfully');
            onActionSuccess?.();
            onClose();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to reset device');
        } finally {
            setActionLoading(false);
        }
    };

    const confirmDeleteAction = async () => {
        if (!token) return;
        setActionLoading(true);
        try {
            await volunteersAPI.delete(volunteer.id, token);
            toast.success('Volunteer record deleted successfully');
            onActionSuccess?.();
            onClose();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to delete volunteer');
        } finally {
            setActionLoading(false);
            setDeleteConfirmOpen(false);
        }
    };

    const getStatusText = (status?: string) => {
        return status ? status : 'Unprocessed';
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
                    style={{ zIndex: 999 }}
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
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'center' }}>
                                        <span className={`vol-detail-modal__status ${volunteer.is_active ? 'active' : 'inactive'}`}>
                                            {volunteer.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                        <span className={`vol-detail-modal__status-state ${volunteer.status?.toLowerCase() || 'unprocessed'}`}>
                                            {getStatusText(volunteer.status)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button className="vol-detail-modal__close" onClick={onClose}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="vol-detail-modal__body">
                            {/* Full-width Testimony / Letter */}
                            {volunteer.spiritual_journey && (
                                <div className="vol-detail-section vol-detail-section--full-width" style={{ gridColumn: '1 / -1', marginBottom: '12px' }}>
                                    <h3 className="vol-detail-section__title">
                                        <BookOpen size={15} /> Spiritual Journey / Testimony (Application Letter)
                                    </h3>
                                    <div 
                                        className="vol-detail-journey-text rich-text-content"
                                        style={{ fontStyle: 'normal', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}
                                        dangerouslySetInnerHTML={{ __html: volunteer.spiritual_journey }}
                                    />
                                </div>
                            )}

                            {/* Details Grid */}
                            <div className="vol-detail-grid" style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--space-xl)' }}>
                                {/* Left Column - Details */}
                                <div className="vol-detail-modal__info-col">
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
                                            <MapPin size={15} /> Location
                                        </h3>
                                        <InfoRow label="Address" value={volunteer.address} />
                                        <InfoRow label="City" value={volunteer.city} />
                                        <InfoRow label="State" value={volunteer.state} />
                                        <InfoRow label="Country" value={volunteer.country} />
                                    </div>

                                    <div className="vol-detail-section">
                                        <h3 className="vol-detail-section__title">
                                            <Church size={15} /> Ministry Details
                                        </h3>
                                        <InfoRow label="Local Church" value={volunteer.local_church} />
                                        <InfoRow label="Gender" value={volunteer.gender} />
                                        <InfoRow label="Date of Birth" value={formatDate(volunteer.dob)} />
                                        <InfoRow label="Roster Allocation" value={volunteer.current_roster_allocation} />
                                    </div>

                                    <div className="vol-detail-section">
                                        <h3 className="vol-detail-section__title">
                                            <Clock size={15} /> Activity Timestamps
                                        </h3>
                                        <InfoRow label="Last Attendance" value={formatDate(volunteer.last_attendance)} />
                                        <InfoRow label="Last Seen" value={formatDate(volunteer.last_seen)} />
                                        <InfoRow label="Member Since" value={formatDate(volunteer.created_at)} />
                                        {volunteer.device_id && <InfoRow label="Device ID" value={volunteer.device_id} />}
                                    </div>
                                </div>

                                {/* Right Column - Attendance History only */}
                                <div className="vol-detail-modal__actions-col">
                                    {/* Historical Attendance list */}
                                    <div className="vol-detail-attendance-card glass-strong" style={{ height: '100%', maxHeight: '420px', display: 'flex', flexDirection: 'column' }}>
                                        <h4>Historical Check-ins</h4>
                                        
                                        {historyLoading ? (
                                            <div className="vol-detail-history-loading">
                                                <div className="history-spinner" />
                                                <span>Loading history...</span>
                                            </div>
                                        ) : attendanceHistory.length === 0 ? (
                                            <div className="vol-detail-history-empty">
                                                <span>No historical check-ins found</span>
                                            </div>
                                        ) : (
                                            <div className="vol-detail-history-list">
                                                {attendanceHistory.map((item, idx) => (
                                                    <div key={item.id || idx} className="vol-detail-history-item">
                                                        <div className="vol-detail-history-item__left">
                                                            <span className="vol-detail-history-date">{formatDate(item.date || item.created_at)}</span>
                                                            <span className="vol-detail-history-time">
                                                                {formatTime(item.time_in)}
                                                                {item.time_out ? ` - ${formatTime(item.time_out)}` : ''}
                                                            </span>
                                                        </div>
                                                        <div className="vol-detail-history-item__right">
                                                            <Badge variant={item.attendance_type === 'Late' ? 'warning' : 'success'} size="sm">
                                                                {item.attendance_type || 'Present'}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Full-width Administrative Operations Section */}
                            <div className="vol-detail-admin-card glass-strong" style={{ gridColumn: '1 / -1', marginTop: '16px' }}>
                                <h4>Administrative Operations</h4>
                                <div className="vol-detail-admin-actions">
                                    <button 
                                        className="btn-admin-action" 
                                        onClick={() => handleChangeState('Accepted')}
                                        disabled={actionLoading || volunteer.status === 'Accepted'}
                                    >
                                        <ShieldCheck size={16} className="text-success" />
                                        <span>Accept Application</span>
                                    </button>
                                    <button 
                                        className="btn-admin-action" 
                                        onClick={() => handleChangeState('Rejected')}
                                        disabled={actionLoading || volunteer.status === 'Rejected'}
                                    >
                                        <ShieldAlert size={16} className="text-danger" />
                                        <span>Reject Application</span>
                                    </button>
                                    <button 
                                        className="btn-admin-action" 
                                        onClick={() => handleChangeState('Unprocessed')}
                                        disabled={actionLoading || volunteer.status === 'Unprocessed'}
                                    >
                                        <RotateCcw size={16} className="text-warning" />
                                        <span>Reset Status</span>
                                    </button>
                                    <button 
                                        className="btn-admin-action" 
                                        onClick={handleToggleActive}
                                        disabled={actionLoading}
                                    >
                                        {volunteer.is_active ? (
                                            <>
                                                <UserX size={16} className="text-danger" />
                                                <span>Deactivate Account</span>
                                            </>
                                        ) : (
                                            <>
                                                <UserCheck size={16} className="text-success" />
                                                <span>Activate Account</span>
                                            </>
                                        )}
                                    </button>
                                    <button 
                                        className="btn-admin-action" 
                                        onClick={handleResetDevice}
                                        disabled={actionLoading || !volunteer.device_id}
                                    >
                                        <RotateCcw size={16} />
                                        <span>Reset Bound Device</span>
                                    </button>
                                    <button 
                                        className="btn-admin-action btn-admin-action--delete" 
                                        onClick={() => setDeleteConfirmOpen(true)}
                                        disabled={actionLoading}
                                    >
                                        <Trash2 size={16} />
                                        <span>Delete Record</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
            {/* Deletion Confirmation Modal */}
            <Modal
                isOpen={deleteConfirmOpen}
                onClose={() => {
                    if (!actionLoading) {
                        setDeleteConfirmOpen(false);
                    }
                }}
                title="Confirm Deletion"
                size="sm"
            >
                <div className="delete-confirm-modal" style={{ textAlign: 'center', padding: '10px' }}>
                    <div className="delete-confirm-modal__icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', color: 'var(--color-error, #EF4444)' }}>
                        <Trash2 size={48} />
                    </div>
                    <h3 className="delete-confirm-modal__title" style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text-primary)' }}>
                        Delete Volunteer?
                    </h3>
                    <p className="delete-confirm-modal__text" style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '24px' }}>
                        Are you sure you want to delete the record of <strong>{volunteer.first_name} {volunteer.last_name}</strong>? This action is permanent and cannot be undone.
                    </p>
                    <div className="delete-confirm-modal__actions" style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                        <Button
                            variant="secondary"
                            onClick={() => setDeleteConfirmOpen(false)}
                            disabled={actionLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            onClick={confirmDeleteAction}
                            loading={actionLoading}
                            style={{ backgroundColor: 'var(--color-error, #EF4444)', borderColor: 'var(--color-error, #EF4444)', color: '#fff' }}
                        >
                            Delete Record
                        </Button>
                    </div>
                </div>
            </Modal>
        </AnimatePresence>
    );
}
