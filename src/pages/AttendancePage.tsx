import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ClipboardCheck, MapPin, Download, AlertCircle, Users, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { attendanceAPI, analyticsAPI, usersExportAPI } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { mockAttendance, mockUsers, mockEvents } from '../mock/data';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import './AttendancePage.css';

export function AttendancePage() {
    const [checkInLoading, setCheckInLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [absentees, setAbsentees] = useState<any[]>([]);
    const [attendanceRates, setAttendanceRates] = useState<any>(null);
    const [loadingData, setLoadingData] = useState(false);
    const { token, user } = useAuthStore();

    // Fetch attendance data for selected date and rates
    useEffect(() => {
        if (user?.role === 'Admin' && token) {
            fetchAttendanceData();
            fetchAttendanceRates();
        }
    }, [selectedDate, token, user?.role]);

    const fetchAttendanceData = async () => {
        if (!token) return;
        
        setLoadingData(true);
        try {
            const response = await analyticsAPI.getUsersOnDay(selectedDate, token);
            if (response.data?.absentees) {
                setAbsentees(response.data.absentees);
            } else {
                setAbsentees([]);
            }
        } catch (error) {
            console.error('Failed to fetch attendance data:', error);
            setAbsentees([]);
        } finally {
            setLoadingData(false);
        }
    };

    const fetchAttendanceRates = async () => {
        if (!token) return;
        
        try {
            const response = await analyticsAPI.getAttendanceRates(token);
            setAttendanceRates(response.data);
        } catch (error) {
            console.error('Failed to fetch attendance rates:', error);
        }
    };

    const attendanceWithDetails = mockAttendance.map(record => {
        const attendanceUser = mockUsers.find(u => u.id === record.user_id);
        const event = record.event_id ? mockEvents.find(e => e.id === record.event_id) : null;
        return { ...record, user: attendanceUser, event };
    });

    // Prepare pie chart data
    const pieData = attendanceRates ? [
        { name: 'Active Users', value: attendanceRates.active_users, color: '#00d9ff' },
        { name: 'Inactive Users', value: attendanceRates.total_users - attendanceRates.active_users, color: '#ff6b6b' }
    ] : [];

    const handleLocationCheckIn = async () => {
        if (!token || !user) {
            toast.error('You must be logged in to check in');
            return;
        }

        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser');
            return;
        }

        setCheckInLoading(true);
        try {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        const { latitude, longitude } = position.coords;
                        const deviceId = `device_${user.id}`;

                        await attendanceAPI.checkIn(
                            {
                                location: { lat: latitude, lng: longitude },
                                device_id: deviceId,
                            },
                            token
                        );

                        toast.success('Check-in successful!');
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : 'Check-in failed';
                        toast.error(errorMessage);
                    } finally {
                        setCheckInLoading(false);
                    }
                },
                (error) => {
                    setCheckInLoading(false);
                    if (error.code === error.PERMISSION_DENIED) {
                        toast.error('Location permission denied. Please enable location access.');
                    } else {
                        toast.error('Unable to get your location. Please try again.');
                    }
                }
            );
        } catch (error) {
            setCheckInLoading(false);
            toast.error('Check-in failed');
        }
    };

    const handleManualSign = () => {
        if (!token || !user) {
            toast.error('You must be logged in');
            return;
        }

        setCheckInLoading(true);
        attendanceAPI.adminSign(user.id, token)
            .then(() => {
                toast.success('User signed in successfully');
            })
            .catch((error) => {
                toast.error(error instanceof Error ? error.message : 'Failed to sign in user');
            })
            .finally(() => {
                setCheckInLoading(false);
            });
    };

    const handleExport = async () => {
        if (!token) {
            toast.error('Not authenticated');
            return;
        }

        try {
            const blob = await usersExportAPI.exportUsers(token);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `attendance_${format(new Date(), 'yyyy-MM-dd')}.csv`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            toast.success('Attendance data exported successfully');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Export failed');
        }
    };

    return (
        <motion.div
            className="attendance-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <div className="attendance-page__header">
                <div>
                    <h1 className="attendance-page__title">Attendance</h1>
                    <p className="attendance-page__subtitle">Track and manage attendance records</p>
                </div>
                <div className="attendance-page__actions">
                    <Button variant="secondary" icon={<Download size={20} />} onClick={handleExport}>
                        Export
                    </Button>
                    <Button
                        variant="primary"
                        icon={<MapPin size={20} />}
                        onClick={handleLocationCheckIn}
                        loading={checkInLoading}
                    >
                        Check In
                    </Button>
                </div>
            </div>

            {/* Admin Section - Attendance Analytics */}
            {user?.role === 'Admin' && (
                <>
                    {/* Attendance Rates - Pie Charts */}
                    <div className="attendance-page__stats-grid">
                        <Card glass className="attendance-chart-card">
                            <div className="attendance-chart-card__header">
                                <h2 className="attendance-chart-card__title">User Attendance Status</h2>
                                <p className="attendance-chart-card__subtitle">Active vs Inactive</p>
                            </div>
                            {attendanceRates && pieData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, value }) => `${name}: ${value}`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            formatter={(value) => `${value} users`}
                                            labelFormatter={(label) => label}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <p>Loading attendance data...</p>
                                </div>
                            )}
                        </Card>

                        <Card glass className="attendance-stats-card">
                            <div className="attendance-stats-card__header">
                                <h2 className="attendance-stats-card__title">Attendance Statistics</h2>
                            </div>
                            <div className="attendance-stats-card__content">
                                {attendanceRates ? (
                                    <>
                                        <div className="stat-row">
                                            <div className="stat-label">
                                                <Users size={20} />
                                                <span>Total Users</span>
                                            </div>
                                            <div className="stat-value">{attendanceRates.total_users}</div>
                                        </div>
                                        <div className="stat-row">
                                            <div className="stat-label">
                                                <TrendingUp size={20} />
                                                <span>Active Users</span>
                                            </div>
                                            <div className="stat-value" style={{ color: '#00d9ff' }}>
                                                {attendanceRates.active_users}
                                            </div>
                                        </div>
                                        <div className="stat-row">
                                            <div className="stat-label">
                                                <AlertCircle size={20} />
                                                <span>Inactive Users</span>
                                            </div>
                                            <div className="stat-value" style={{ color: '#ff6b6b' }}>
                                                {attendanceRates.total_users - attendanceRates.active_users}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <p>Loading statistics...</p>
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* Check Attendance by Date */}
                    <Card glass className="attendance-by-date-card">
                        <div className="attendance-by-date-card__header">
                            <h2 className="attendance-by-date-card__title">Check Attendance by Date</h2>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="attendance-by-date-card__input"
                            />
                        </div>

                        {loadingData ? (
                            <div className="attendance-page__loading">
                                <p>Loading attendance data for {selectedDate}...</p>
                            </div>
                        ) : absentees.length === 0 ? (
                            <div className="attendance-page__empty">
                                <AlertCircle size={48} />
                                <p>No absentees found for {selectedDate} - All users attended!</p>
                            </div>
                        ) : (
                            <div className="absentees-list">
                                <p className="absentees-count">{absentees.length} absentee(s) on {format(new Date(selectedDate), 'MMMM dd, yyyy')}</p>
                                <div className="absentees-grid">
                                    {absentees.map((absentee) => (
                                        <div key={absentee.id} className="absentee-card">
                                            <div className="absentee-card__header">
                                                <h4 className="absentee-card__name">
                                                    {absentee.first_name} {absentee.last_name}
                                                </h4>
                                                <span className="absentee-card__reg-no">{absentee.reg_no}</span>
                                            </div>
                                            <div className="absentee-card__details">
                                                <p><strong>Email:</strong> {absentee.email}</p>
                                                <p><strong>Phone:</strong> {absentee.phone || 'N/A'}</p>
                                                <p><strong>Year Joined:</strong> {absentee.year_joined}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </Card>
                </>
            )}



            <div className="attendance-page__quick-actions">
                <Card glass hover className="quick-action-card">
                    <div className="quick-action-card__icon quick-action-card__icon--green">
                        <MapPin size={32} />
                    </div>
                    <h3 className="quick-action-card__title">Location Check-In</h3>
                    <p className="quick-action-card__description">Check in using your location</p>
                    <Button
                        variant="success"
                        size="sm"
                        fullWidth
                        onClick={handleLocationCheckIn}
                        loading={checkInLoading}
                    >
                        Use Location
                    </Button>
                </Card>

                {user?.role === 'Admin' && (
                    <Card glass hover className="quick-action-card">
                        <div className="quick-action-card__icon quick-action-card__icon--purple">
                            <ClipboardCheck size={32} />
                        </div>
                        <h3 className="quick-action-card__title">Manual Sign</h3>
                        <p className="quick-action-card__description">Manually mark attendance (Admin)</p>
                        <Button
                            variant="secondary"
                            size="sm"
                            fullWidth
                            onClick={handleManualSign}
                            loading={checkInLoading}
                        >
                            Sign In
                        </Button>
                    </Card>
                )}
            </div>

            <Card glass className="attendance-page__records">
                <div className="attendance-page__records-header">
                    <h2 className="attendance-page__records-title">Recent Records</h2>
                    <p className="attendance-page__records-subtitle">{attendanceWithDetails.length} records</p>
                </div>

                {attendanceWithDetails.length === 0 ? (
                    <div className="attendance-page__empty">
                        <AlertCircle size={48} />
                        <p>No attendance records found</p>
                    </div>
                ) : (
                    <div className="attendance-page__table">
                        <div className="attendance-table__header">
                            <div>User</div>
                            <div>Event</div>
                            <div>Type</div>
                            <div>Timestamp</div>
                            <div>Status</div>
                        </div>

                        {attendanceWithDetails.map((record) => (
                            <div key={record.id} className="attendance-table__row">
                                <div className="attendance-table__user">
                                    <img
                                        src={record.user?.avatar_url}
                                        alt={record.user?.first_name}
                                        className="attendance-table__avatar"
                                    />
                                    <div>
                                        <div className="attendance-table__user-name">
                                            {record.user?.first_name} {record.user?.last_name}
                                        </div>
                                        <div className="attendance-table__user-email">
                                            {record.user?.email}
                                        </div>
                                    </div>
                                </div>

                                <div className="attendance-table__event">
                                    {record.event?.title || 'Daily Attendance'}
                                </div>

                                <div className="attendance-table__type">
                                    <span className={`attendance-badge attendance-badge--${record.attendance_type.toLowerCase()}`}>
                                        {record.attendance_type}
                                    </span>
                                </div>

                                <div className="attendance-table__timestamp">
                                    {format(new Date(record.timestamp), 'MMM dd, yyyy HH:mm')}
                                </div>

                                <div className="attendance-table__status">
                                    <span className={`status-badge status-badge--${record.status}`}>
                                        {record.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </motion.div>
    );
}
