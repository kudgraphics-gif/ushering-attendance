import { useState, useEffect, useRef } from 'react';
import DataTable from 'react-data-table-component';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    CheckCircle2,
    AlertCircle,
    Trash2,
    MapPin,
    Upload,
    Clock,
    Calendar,
    Activity,
    LogOut,
    ChevronDown,
    UserCheck,
    UserX
} from 'lucide-react';
import { format, isValid } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import toast from 'react-hot-toast';

import { analyticsAPI, usersAPI, attendanceRevokeAPI, attendanceAPI } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { getDeviceId, recordDeviceCheckIn, hasDeviceCheckedInToday } from '../utils/deviceId';
import './AttendancePage.css';

export function AttendancePage() {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [presentees, setPresentees] = useState<any[]>([]);
    const [absentees, setAbsentees] = useState<any[]>([]);
    const [attendanceRates, setAttendanceRates] = useState<any>(null);
    const [loadingData, setLoadingData] = useState(false);
    const [checkInLoading, setCheckInLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'presentees' | 'absentees'>('presentees');
    const [filterText, setFilterText] = useState('');
    const [rowsPerPage] = useState(10);
    const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
    const exportDropdownRef = useRef<HTMLDivElement>(null);
    const { token, user } = useAuthStore();

    useEffect(() => {
        if (token && (user?.role === 'Admin' || user?.role === 'Technical')) {
            fetchAttendanceData();
        }
    }, [selectedDate, token]);

    // Close export dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target as Node)) {
                setExportDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const fetchAttendanceData = async () => {
        if (!token) return;
        setLoadingData(true);
        try {
            // First get the overview stats
            try {
                const stats = await analyticsAPI.getAttendanceRates(token);
                setAttendanceRates(stats.data);
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            }

            // Then get the list of users for the selected day
            const [attendanceResponse, usersResponse] = await Promise.all([
                analyticsAPI.getUsersOnDay(selectedDate, token),
                usersAPI.getAll(token)
            ]);

            const attendees = attendanceResponse.data || [];
            const allUsers = usersResponse;

            // Map attendees to a more usable format including the new fields
            const presenteesList = attendees.map((record: any) => ({
                ...record.user,
                attendance_id: record.attendance?.id,
                attendance_time_in: record.attendance?.time_in,
                attendance_date: record.attendance?.date,
                attendance_weekday: record.attendance?.week_day,
                attendance_type: record.attendance?.attendance_type
            })).filter((u: any) => u.is_active !== false);

            // Calculate absentees
            const presentUserIds = new Set(attendees.map((a: any) => a.user?.id));
            const absenteesList = allUsers
                .filter((u: any) => u.is_active !== false)
                .filter((u: any) => !presentUserIds.has(u.id));

            setPresentees(presenteesList);
            setAbsentees(absenteesList);
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch attendance data');
        } finally {
            setLoadingData(false);
        }
    };

    const handleRevokeAttendance = async (attendanceId: string, userName: string) => {
        if (!token || !attendanceId) return;

        if (!window.confirm(`Are you sure you want to revoke attendance for ${userName}?`)) {
            return;
        }

        try {
            await attendanceRevokeAPI.revoke(attendanceId, token);
            setPresentees(prev => prev.filter(p => p.attendance_id !== attendanceId));
            // Trigger a refresh to ensure consistency
            fetchAttendanceData();
            toast.success(`Attendance revoked for ${userName}`);
        } catch (error) {
            console.error(error);
            toast.error('Failed to revoke attendance');
        }
    };

    const handleLocationCheckIn = async () => {
        if (!token || !user) {
            toast.error('You must be logged in to check in');
            return;
        }

        // Check if device already checked in today
        if (hasDeviceCheckedInToday()) {
            toast.error("You've already checked in today");
            return;
        }

        // Wednesday restriction: Regular users cannot checkin after 6PM  
        const now = new Date();
        if (now.getDay() === 3 && user.role !== 'Leader') { // Wednesday is day 3
            if (now.getHours() >= 18) { // After or at 6PM
                toast.error('Attendance has ended');
                return;
            }
        }

        if (!navigator.geolocation) {
            toast.error('Location not supported on your device');
            return;
        }

        setCheckInLoading(true);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                try {
                    const deviceId = getDeviceId();

                    await attendanceAPI.checkIn(
                        {
                            location: {
                                lat: latitude,
                                lng: longitude,
                            },
                            device_id: deviceId,
                        },
                        token
                    );

                    recordDeviceCheckIn(user.id);
                    toast.success('Admin Check-in successful');

                    // Refresh data
                    fetchAttendanceData();

                } catch (error) {
                    toast.error(
                        error instanceof Error ? error.message : 'Check-in failed, please try again'
                    );
                } finally {
                    setCheckInLoading(false);
                }
            },
            (error) => {
                setCheckInLoading(false);

                let message = 'Unable to retrieve location. ';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        message += 'Please enable location permissions.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message += 'Location unavailable.';
                        break;
                    case error.TIMEOUT:
                        message += 'Request timed out.';
                        break;
                    default:
                        message += 'Ensure location services are enabled.';
                }
                toast.error(message);
            },
            {
                enableHighAccuracy: false,
                timeout: 30000,
                maximumAge: Infinity
            }
        );
    };

    const isCheckoutAvailable = () => {
        const now = new Date();
        const minutes = now.getHours() * 60 + now.getMinutes();
        return minutes >= 690 && minutes < 720; // 11:30 AM to 12:00 PM
    };

    const handleCheckOut = async () => {
        if (!token || !user) {
            toast.error('You must be logged in to check out');
            return;
        }

        if (!isCheckoutAvailable()) {
            toast.error('Check out is only available between 11:30 AM - 12:00 PM');
            return;
        }

        if (!navigator.geolocation) {
            toast.error('Location not supported on your device');
            return;
        }

        setCheckInLoading(true);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const deviceId = getDeviceId();
                    await attendanceAPI.signOut(
                        {
                            location: { lat: latitude, lng: longitude },
                            device_id: deviceId,
                        },
                        token
                    );
                    toast.success('Check-out successful');
                    fetchAttendanceData();
                } catch (error) {
                    toast.error(
                        error instanceof Error ? error.message : 'Check-out failed, please try again'
                    );
                } finally {
                    setCheckInLoading(false);
                }
            },
            () => {
                setCheckInLoading(false);
                toast.error('Unable to retrieve location');
            },
            {
                enableHighAccuracy: false,
                timeout: 30000,
                maximumAge: Infinity
            }
        );
    };

    const exportToCSV = (type: 'presentees' | 'absentees') => {
        const data = type === 'presentees' ? presentees : absentees;
        const label = type === 'presentees' ? 'Presentees' : 'Absentees';

        if (data.length === 0) {
            toast.error(`No ${label.toLowerCase()} to export for ${selectedDate}`);
            return;
        }

        // Build CSV rows
        const headers =
            type === 'presentees'
                ? ['S/N', 'First Name', 'Last Name', 'Reg No', 'Email', 'Phone', 'Time In', 'Date', 'Day', 'Attendance Type']
                : ['S/N', 'First Name', 'Last Name', 'Reg No', 'Email', 'Phone'];

        const rows = data.map((row: any, index: number) => {
            const timeIn = row.attendance_time_in
                ? format(new Date(row.attendance_time_in), 'h:mm a')
                : '';
            const dateFormatted = row.attendance_date
                ? format(new Date(row.attendance_date), 'yyyy-MM-dd')
                : selectedDate;

            if (type === 'presentees') {
                return [
                    index + 1,
                    row.first_name || '',
                    row.last_name || '',
                    row.reg_no || '',
                    row.email || '',
                    row.phone || '',
                    timeIn,
                    dateFormatted,
                    row.attendance_weekday || '',
                    row.attendance_type || '',
                ];
            } else {
                return [
                    index + 1,
                    row.first_name || '',
                    row.last_name || '',
                    row.reg_no || '',
                    row.email || '',
                    row.phone || '',
                ];
            }
        });

        const csvContent = [
            // Title row
            [`${label} — ${format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}`],
            [],
            headers,
            ...rows,
        ]
            .map(row => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}_${selectedDate}.csv`;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast.success(`${label} exported successfully (${data.length} records)`);
        setExportDropdownOpen(false);
    };

    // Filter logic
    const filteredPresentees = presentees.filter(item =>
        (item.first_name && item.first_name.toLowerCase().includes(filterText.toLowerCase())) ||
        (item.last_name && item.last_name.toLowerCase().includes(filterText.toLowerCase())) ||
        (item.email && item.email.toLowerCase().includes(filterText.toLowerCase())) ||
        (item.reg_no && item.reg_no.toLowerCase().includes(filterText.toLowerCase()))
    );

    const filteredAbsentees = absentees.filter(item =>
        (item.first_name && item.first_name.toLowerCase().includes(filterText.toLowerCase())) ||
        (item.last_name && item.last_name.toLowerCase().includes(filterText.toLowerCase())) ||
        (item.email && item.email.toLowerCase().includes(filterText.toLowerCase())) ||
        (item.reg_no && item.reg_no.toLowerCase().includes(filterText.toLowerCase()))
    );

    // Sort by most recent time_in for the Activity Feed with safety check
    const recentActivities = [...filteredPresentees].sort((a, b) => {
        const timeA = a.attendance_time_in ? new Date(a.attendance_time_in).getTime() : 0;
        const timeB = b.attendance_time_in ? new Date(b.attendance_time_in).getTime() : 0;
        return timeB - timeA;
    });

    const pieData = attendanceRates ? [
        { name: 'Present', value: presentees.length, color: '#10B981' }, // Green
        { name: 'Absent', value: absentees.length, color: '#EF4444' },   // Red
    ] : [];

    const customTableStyles = {
        table: {
            style: {
                backgroundColor: 'transparent',
            },
        },
        headRow: {
            style: {
                backgroundColor: 'var(--surface-hover)',
                color: 'var(--text-secondary)',
                borderBottom: '1px solid var(--border-color)',
                fontSize: '13px',
                fontWeight: '600',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.5px',
            },
        },
        rows: {
            style: {
                backgroundColor: 'transparent',
                color: 'var(--text-primary)',
                minHeight: '60px',
                '&:not(:last-of-type)': {
                    borderBottom: '1px solid var(--border-color)',
                },
                '&:hover': {
                    backgroundColor: 'var(--surface-hover)',
                },
            },
        },
        pagination: {
            style: {
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                borderTop: '1px solid var(--border-color)',
            },
        },
    };

    // Columns for the new Recent Activity Table
    const recentActivityColumns = [
        {
            name: 'User Details',
            selector: (row: any) => row.last_name,
            cell: (row: any) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '8px 0' }}>
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>{row.first_name} {row.last_name}</span>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{row.reg_no}</span>
                </div>
            ),
            width: '250px',
        },
        {
            name: 'Check-in Time',
            selector: (row: any) => row.attendance_time_in,
            cell: (row: any) => {
                const dateObj = row.attendance_time_in ? new Date(row.attendance_time_in) : null;
                const formattedTime = dateObj && isValid(dateObj) ? format(dateObj, 'h:mm a') : 'N/A';

                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={16} className="text-secondary" />
                        <span>{formattedTime}</span>
                    </div>
                );
            },
            sortable: true,
            width: '180px',
        },
        {
            name: 'Day',
            selector: (row: any) => row.attendance_date,
            cell: (row: any) => {
                const dateObj = row.attendance_date ? new Date(row.attendance_date) : null;
                const formattedDate = dateObj && isValid(dateObj) ? format(dateObj, 'MMM d') : 'N/A';

                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)' }}>
                        <Calendar size={16} />
                        <span>{row.attendance_weekday || 'N/A'}, {formattedDate}</span>
                    </div>
                );
            },
            width: '200px',
        },
        {
            name: 'Type',
            selector: (row: any) => row.attendance_type,
            cell: (row: any) => (
                <span style={{
                    padding: '4px 12px',
                    borderRadius: '99px',
                    fontSize: '12px',
                    fontWeight: 500,
                    backgroundColor: row.attendance_type === 'Onsite' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                    color: row.attendance_type === 'Onsite' ? '#10B981' : '#3B82F6',
                    border: row.attendance_type === 'Onsite' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(59, 130, 246, 0.2)'
                }}>
                    {row.attendance_type || 'N/A'}
                </span>
            ),
            width: '150px',
        }
    ];

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
                    {/* Export dropdown */}
                    <div style={{ position: 'relative' }} ref={exportDropdownRef}>
                        <Button
                            variant="secondary"
                            icon={<Upload size={20} />}
                            onClick={() => setExportDropdownOpen(prev => !prev)}
                        >
                            Export <ChevronDown size={16} style={{ marginLeft: '4px', transition: 'transform 0.2s', transform: exportDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                        </Button>
                        <AnimatePresence>
                            {exportDropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                                    transition={{ duration: 0.15 }}
                                    style={{
                                        position: 'absolute',
                                        top: 'calc(100% + 8px)',
                                        right: 0,
                                        minWidth: '220px',
                                        background: 'var(--surface-card, #1a1f2e)',
                                        border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
                                        borderRadius: '12px',
                                        boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
                                        backdropFilter: 'blur(20px)',
                                        overflow: 'hidden',
                                        zIndex: 999,
                                    }}
                                >
                                    <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))' }}>
                                        <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>
                                            Export for {format(new Date(selectedDate), 'MMM d, yyyy')}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => exportToCSV('presentees')}
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            padding: '12px 16px',
                                            background: 'none',
                                            border: 'none',
                                            color: 'var(--text-primary, #fff)',
                                            fontSize: '14px',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            transition: 'background 0.15s',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                                    >
                                        <UserCheck size={16} style={{ color: '#10B981', flexShrink: 0 }} />
                                        <div>
                                            <div style={{ fontWeight: 600 }}>Presentees</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{presentees.length} members present</div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => exportToCSV('absentees')}
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            padding: '12px 16px',
                                            background: 'none',
                                            border: 'none',
                                            color: 'var(--text-primary, #fff)',
                                            fontSize: '14px',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            transition: 'background 0.15s',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                                    >
                                        <UserX size={16} style={{ color: '#EF4444', flexShrink: 0 }} />
                                        <div>
                                            <div style={{ fontWeight: 600 }}>Absentees</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{absentees.length} members absent</div>
                                        </div>
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    {user?.is_cleaning_day && isCheckoutAvailable() && (
                        <Button
                            variant="secondary"
                            icon={<LogOut size={20} />}
                            onClick={handleCheckOut}
                            loading={checkInLoading}
                        >
                            Check Out
                        </Button>
                    )}
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
            {(user?.role === 'Admin' || user?.role === 'Technical') && (
                <>
                    {/* Attendance Rates - Pie Charts */}
                    <div className="attendance-page__stats-grid">
                        <Card glass className="attendance-chart-card">
                            <div className="attendance-chart-card__header">
                                <h2 className="attendance-chart-card__title">Attendance Overview</h2>
                                <p className="attendance-chart-card__subtitle">Present vs Absent for {format(new Date(selectedDate), 'MMMM dd, yyyy')}</p>
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
                                            contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                                            formatter={(value: any) => [`${value} users`, 'Count']}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)' }}>
                                    <p>Loading chart data...</p>
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
                                            <div className="stat-value">{presentees.length + absentees.length}</div>
                                        </div>
                                        <div className="stat-row">
                                            <div className="stat-label">
                                                <CheckCircle2 size={20} />
                                                <span>Present</span>
                                            </div>
                                            <div className="stat-value" style={{ color: '#10B981' }}>
                                                {presentees.length}
                                            </div>
                                        </div>
                                        <div className="stat-row">
                                            <div className="stat-label">
                                                <AlertCircle size={20} />
                                                <span>Absent</span>
                                            </div>
                                            <div className="stat-value" style={{ color: '#EF4444' }}>
                                                {absentees.length}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <p>Loading statistics...</p>
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* NEW SECTION: Recent Activity Feed */}
                    <div style={{ marginBottom: 'var(--space-2xl)' }}>
                        <Card glass className="attendance-by-date-card">
                            <div className="attendance-by-date-card__header" style={{ borderBottom: 'none', paddingBottom: '0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ padding: '10px', backgroundColor: 'rgba(212, 175, 55, 0.1)', borderRadius: '12px', color: 'var(--color-primary)' }}>
                                        <Activity size={24} />
                                    </div>
                                    <div>
                                        <h2 className="attendance-by-date-card__title" style={{ margin: 0, fontSize: '20px' }}>Recent Activity</h2>
                                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                                            Live check-in feed for {format(new Date(selectedDate), 'EEEE, MMMM do, yyyy')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: '20px' }}>
                                {loadingData ? (
                                    <div className="attendance-page__loading">
                                        <p>Loading activity feed...</p>
                                    </div>
                                ) : recentActivities.length === 0 ? (
                                    <div className="attendance-page__empty">
                                        <Clock size={48} />
                                        <p>No activity recorded yet for this date.</p>
                                    </div>
                                ) : (
                                    <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                                        <DataTable
                                            columns={recentActivityColumns}
                                            data={recentActivities}
                                            pagination
                                            paginationPerPage={5}
                                            paginationRowsPerPageOptions={[5, 10, 20]}
                                            customStyles={customTableStyles}
                                            theme="dark"
                                        />
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* Check Attendance by Date (Management) */}
                    <Card glass className="attendance-by-date-card">
                        <div className="attendance-by-date-card__header">
                            <div>
                                <h2 className="attendance-by-date-card__title">Attendance Management</h2>
                                <div className="attendance-tabs">
                                    <button
                                        className={`attendance-tab ${activeTab === 'presentees' ? 'attendance-tab--active' : ''}`}
                                        onClick={() => setActiveTab('presentees')}
                                    >
                                        <CheckCircle2 size={18} />
                                        <span>Presentees ({presentees.length})</span>
                                    </button>
                                    <button
                                        className={`attendance-tab ${activeTab === 'absentees' ? 'attendance-tab--active' : ''}`}
                                        onClick={() => setActiveTab('absentees')}
                                    >
                                        <AlertCircle size={18} />
                                        <span>Absentees ({absentees.length})</span>
                                    </button>
                                </div>
                            </div>
                            <div className="attendance-by-date-card__controls">
                                <input
                                    type="text"
                                    placeholder="Search by name, email, reg no..."
                                    value={filterText}
                                    onChange={(e) => setFilterText(e.target.value)}
                                    className="attendance-by-date-card__search"
                                />
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="attendance-by-date-card__input"
                                />
                            </div>
                        </div>

                        {loadingData ? (
                            <div className="attendance-page__loading">
                                <p>Loading attendance data for {selectedDate}...</p>
                            </div>
                        ) : activeTab === 'presentees' ? (
                            filteredPresentees.length === 0 ? (
                                <div className="attendance-page__empty">
                                    <AlertCircle size={48} />
                                    <p>No presentees found for {selectedDate}</p>
                                </div>
                            ) : (
                                <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                                    <DataTable
                                        columns={[
                                            {
                                                name: 'Name',
                                                selector: (row: any) => `${row.first_name} ${row.last_name}`,
                                                width: '200px',
                                            },
                                            {
                                                name: 'Reg No',
                                                selector: (row: any) => row.reg_no,
                                                sortable: true,
                                                width: '120px',
                                            },
                                            {
                                                name: 'Time In',
                                                selector: (row: any) => row.attendance_time_in,
                                                cell: (row: any) => {
                                                    const dateObj = row.attendance_time_in ? new Date(row.attendance_time_in) : null;
                                                    return dateObj && isValid(dateObj) ? format(dateObj, 'h:mm a') : 'N/A';
                                                },
                                                sortable: true,
                                                width: '120px',
                                            },
                                            {
                                                name: 'Email',
                                                selector: (row: any) => row.email,
                                                width: '220px',
                                            },
                                            {
                                                name: 'Action',
                                                cell: (row: any) => (
                                                    <button
                                                        className="attendance-table__revoke-btn"
                                                        onClick={() => handleRevokeAttendance(row.attendance_id, `${row.first_name} ${row.last_name}`)}
                                                        title="Revoke attendance"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                ),
                                                width: '100px',
                                            },
                                        ]}
                                        data={filteredPresentees}
                                        pagination
                                        paginationPerPage={rowsPerPage}
                                        customStyles={customTableStyles}
                                        theme="dark"
                                    />
                                </div>
                            )
                        ) : filteredAbsentees.length === 0 ? (
                            <div className="attendance-page__empty">
                                <CheckCircle2 size={48} />
                                <p>No absentees found for {selectedDate} - All users attended!</p>
                            </div>
                        ) : (
                            <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                                <DataTable
                                    columns={[
                                        {
                                            name: 'Name',
                                            selector: (row: any) => `${row.first_name} ${row.last_name}`,
                                            width: '200px',
                                        },
                                        {
                                            name: 'Reg No',
                                            selector: (row: any) => row.reg_no,
                                            sortable: true,
                                            width: '120px',
                                        },
                                        {
                                            name: 'Email',
                                            selector: (row: any) => row.email,
                                            width: '220px',
                                        },
                                        {
                                            name: 'Phone',
                                            selector: (row: any) => row.phone || 'N/A',
                                            width: '140px',
                                        },
                                    ]}
                                    data={filteredAbsentees}
                                    pagination
                                    paginationPerPage={rowsPerPage}
                                    customStyles={customTableStyles}
                                    theme="dark"
                                />
                            </div>
                        )}
                    </Card>
                </>
            )}
        </motion.div>
    );
}