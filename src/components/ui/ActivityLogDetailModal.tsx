import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import type { ActivityLogResponse } from '../../types';
import './ActivityLogDetailModal.css';

interface ActivityLogDetailModalProps {
    isOpen: boolean;
    log: ActivityLogResponse | null;
    loading?: boolean;
    onClose: () => void;
}

export function ActivityLogDetailModal({ isOpen, log, loading, onClose }: ActivityLogDetailModalProps) {
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        toast.success('Copied to clipboard');
        setTimeout(() => setCopiedField(null), 2000);
    };

    const getActivityColor = (activityType?: string) => {
        const colorMap: { [key: string]: string } = {
            'UserLogin': '#10B981',
            'UserLogout': '#8B5CF6',
            'UserCreated': '#3B82F6',
            'UserUpdated': '#D4AF37',
            'UserActivation': '#10B981',
            'UserDeactivation': '#EF4444',
            'UserMarkedAttendance': '#10B981',
            'AdminMarkedAttendanceForUser': '#3B82F6',
            'UserImported': '#F59E0B',
            'PasswordChanged': '#D4AF37',
            'DeviceReset': '#F59E0B',
            'EventCreated': '#3B82F6',
            'EventUpdated': '#D4AF37',
            'EventDeleted': '#EF4444',
            'EventCheckIn': '#10B981',
            'RosterCreated': '#3B82F6',
            'RosterUpdated': '#D4AF37',
            'RosterDeleted': '#EF4444',
            'RosterActivated': '#10B981',
            'AttendanceRevoked': '#EF4444',
            'RosterImported': '#F59E0B',
            'UserHallUpdated': '#3B82F6',
            'RosterShared': '#3B82F6',
            'GroupCreated': '#3B82F6',
            'GroupActivated': '#10B981',
            'GroupUserAdded': '#10B981',
            'GroupUserRemoved': '#EF4444',
            'GroupUsersImported': '#F59E0B',
            'FailedAttendanceCheckIn': '#EF4444',
            'FailedAttempt': '#EF4444',
        };
        return colorMap[activityType || ''] || '#8B5CF6';
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleString();
        } catch {
            return dateString;
        }
    };

    const DetailField = ({ label, value, copyable = false }: { label: string; value: string | undefined; copyable?: boolean }) => (
        <div className="activity-log-detail__field">
            <label className="activity-log-detail__label">{label}</label>
            <div className="activity-log-detail__value-wrapper">
                <div className="activity-log-detail__value">{value || 'N/A'}</div>
                {copyable && value && (
                    <button
                        className="activity-log-detail__copy-btn"
                        onClick={() => copyToClipboard(value, label)}
                        title="Copy to clipboard"
                    >
                        {copiedField === label ? (
                            <CheckCircle2 size={16} className="activity-log-detail__copied" />
                        ) : (
                            <Copy size={16} />
                        )}
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="activity-log-detail-modal__overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="activity-log-detail-modal__content"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="activity-log-detail-modal__header">
                            <h2 className="activity-log-detail-modal__title">Activity Log Details</h2>
                            <button
                                className="activity-log-detail-modal__close-btn"
                                onClick={onClose}
                                aria-label="Close modal"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Loading State */}
                        {loading ? (
                            <div className="activity-log-detail-modal__loading">
                                <div className="activity-log-detail-modal__spinner" />
                                <p>Loading details...</p>
                            </div>
                        ) : log ? (
                            <div className="activity-log-detail-modal__body">
                                {/* Activity Type Badge */}
                                <div className="activity-log-detail-modal__activity-badge">
                                    <div
                                        className="activity-log-detail-modal__indicator"
                                        style={{ backgroundColor: getActivityColor(log.activity_type) }}
                                    />
                                    <span className="activity-log-detail-modal__activity-type">
                                        {log.activity_type}
                                    </span>
                                </div>

                                {/* User Information */}
                                <div className="activity-log-detail-modal__section">
                                    <h3 className="activity-log-detail-modal__section-title">User Information</h3>
                                    <div className="activity-log-detail-modal__fields-grid">
                                        <DetailField label="User Name" value={log.user_name} copyable />
                                        <DetailField label="User Email" value={log.user_email ?? undefined} copyable />
                                        <DetailField label="User Role" value={log.user_role} />
                                        <DetailField label="User ID" value={log.user_id} copyable />
                                    </div>
                                </div>

                                {/* Activity Details */}
                                <div className="activity-log-detail-modal__section">
                                    <h3 className="activity-log-detail-modal__section-title">Activity Details</h3>
                                    <div className="activity-log-detail-modal__fields-grid">
                                        <DetailField label="Activity Type" value={log.activity_type} />
                                        <DetailField label="Timestamp" value={formatDate(log.created_at)} />
                                        <DetailField label="Details" value={log.details} />
                                    </div>
                                </div>

                                {/* Target Information */}
                                {(log.target_id || log.target || log.target_type) && (
                                    <div className="activity-log-detail-modal__section">
                                        <h3 className="activity-log-detail-modal__section-title">Target Information</h3>
                                        <div className="activity-log-detail-modal__fields-grid">
                                            <DetailField label="Target ID" value={log.target_id} copyable />
                                            <DetailField label="Target Name" value={log.target} />
                                            <DetailField label="Target Type" value={log.target_type} />
                                        </div>
                                    </div>
                                )}

                                {/* Full Details (JSON) */}
                                <div className="activity-log-detail-modal__section">
                                    <h3 className="activity-log-detail-modal__section-title">Raw Data</h3>
                                    <pre className="activity-log-detail-modal__json">
                                        {JSON.stringify(log, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        ) : (
                            <div className="activity-log-detail-modal__empty">
                                <p>No log details available</p>
                            </div>
                        )}
                    </motion.div>
                    </motion.div>
            )}
        </AnimatePresence>
    );
}
