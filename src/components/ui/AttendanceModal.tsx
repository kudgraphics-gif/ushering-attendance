import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, LogIn, TrendingUp } from 'lucide-react';
import { Modal } from './Modal';
import { analyticsAPI } from '../../services/api';
import { format } from 'date-fns';
import './attendance/AttendanceModal.css';

interface AttendanceRecord {
    id: string;
    user_id: string;
    date: string;
    week_day: string;
    time_in: string;
    time_out: string | null;
    marked_by: string | null;
    event_id: string;
    attendance_type: string;
    created_at: string;
    updated_at: string;
}

interface AttendanceSummary {
    total_days: number;
    days_present: number;
    rate: number;
}

interface UserAttendanceData {
    user: any;
    history: AttendanceRecord[];
    summary: AttendanceSummary;
}

interface AttendanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    userName: string;
    token: string;
}

export function AttendanceModal({ isOpen, onClose, userId, userName, token }: AttendanceModalProps) {
    const [loading, setLoading] = useState(false);
    const [attendanceData, setAttendanceData] = useState<UserAttendanceData | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && userId) {
            fetchAttendanceData();
        }
    }, [isOpen, userId]);

    const fetchAttendanceData = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await analyticsAPI.getUserAttendance(userId, token);
            setAttendanceData(data.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load attendance data');
            console.error('Error fetching attendance:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Attendance Record - ${userName}`}>
            <div className="attendance-modal">
                {loading ? (
                    <div className="attendance-modal__loading">
                        <p>Loading attendance data...</p>
                    </div>
                ) : error ? (
                    <div className="attendance-modal__error">
                        <p>{error}</p>
                    </div>
                ) : attendanceData ? (
                    <div className="attendance-modal__content">
                        {/* Summary Cards */}
                        <div className="attendance-modal__summary">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0 }}
                                className="attendance-modal__summary-card"
                            >
                                <div className="attendance-modal__summary-icon">
                                    <Calendar size={24} />
                                </div>
                                <div className="attendance-modal__summary-content">
                                    <p className="attendance-modal__summary-label">Total Days</p>
                                    <h3 className="attendance-modal__summary-value">
                                        {attendanceData.summary.total_days}
                                    </h3>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="attendance-modal__summary-card"
                            >
                                <div className="attendance-modal__summary-icon">
                                    <LogIn size={24} />
                                </div>
                                <div className="attendance-modal__summary-content">
                                    <p className="attendance-modal__summary-label">Days Present</p>
                                    <h3 className="attendance-modal__summary-value">
                                        {attendanceData.summary.days_present}
                                    </h3>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="attendance-modal__summary-card"
                            >
                                <div className="attendance-modal__summary-icon">
                                    <TrendingUp size={24} />
                                </div>
                                <div className="attendance-modal__summary-content">
                                    <p className="attendance-modal__summary-label">Attendance Rate</p>
                                    <h3 className="attendance-modal__summary-value">
                                        {attendanceData.summary.rate.toFixed(1)}%
                                    </h3>
                                </div>
                            </motion.div>
                        </div>

                        {/* Attendance History */}
                        <div className="attendance-modal__history">
                            <h4 className="attendance-modal__history-title">Attendance History</h4>
                            {attendanceData.history.length === 0 ? (
                                <p className="attendance-modal__history-empty">No attendance records found</p>
                            ) : (
                                <div className="attendance-modal__records">
                                    {attendanceData.history.map((record, index) => (
                                        <motion.div
                                            key={record.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="attendance-modal__record"
                                        >
                                            <div className="attendance-modal__record-date">
                                                <p className="attendance-modal__record-day">
                                                    {format(new Date(record.date), 'MMM dd')}
                                                </p>
                                                <p className="attendance-modal__record-dayname">
                                                    {record.week_day}
                                                </p>
                                            </div>
                                            <div className="attendance-modal__record-times">
                                                <div className="attendance-modal__record-time">
                                                    <span className="attendance-modal__time-label">In:</span>
                                                    <span className="attendance-modal__time-value">
                                                        {format(new Date(record.time_in), 'HH:mm:ss')}
                                                    </span>
                                                </div>
                                                {record.time_out ? (
                                                    <div className="attendance-modal__record-time">
                                                        <span className="attendance-modal__time-label">Out:</span>
                                                        <span className="attendance-modal__time-value">
                                                            {format(new Date(record.time_out), 'HH:mm:ss')}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="attendance-modal__record-time">
                                                        <span className="attendance-modal__time-label">Out:</span>
                                                        <span className="attendance-modal__time-value attendance-modal__time-value--pending">
                                                            Pending
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <span className="attendance-modal__attendance-type">
                                                {record.attendance_type}
                                            </span>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ) : null}
            </div>
        </Modal>
    );
}
