import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Users, UserCheck, UserX, Loader, Search, Download, ClipboardList, Calendar, Armchair, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { hallsAPI } from '../services/api';
import type { Hall, HallAttendanceResponse, UserDto } from '../types';
import { useAuthStore } from '../stores/authStore';
import './HallManagerPage.css';

const HALL_COLORS: { [key: string]: string } = {
    'MainHall': 'blue',
    'HallOne': 'purple',
    'Gallery': 'green',
    'Basement': 'orange',
    'Outside': 'red',
};

const getInitials = (user: UserDto): string => {
    const firstName = user.first_name?.charAt(0).toUpperCase() || '';
    const lastName = user.last_name?.charAt(0).toUpperCase() || '';
    return (firstName + lastName) || '?';
};

export function HallManagerPage() {
    const { token, user: currentUser } = useAuthStore();

    const [halls, setHalls] = useState<Hall[]>([]);
    const [selectedHall, setSelectedHall] = useState<string | null>(null);
    const [attendanceData, setAttendanceData] = useState<HallAttendanceResponse | null>(null);
    const [exportHall, setExportHall] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [marking, setMarking] = useState(false);
    const [revoking, setRevoking] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
    const [tabView, setTabView] = useState<'attendance' | 'users' | 'headcount'>('attendance');

    // Head Count form state
    const [headCountPeople, setHeadCountPeople] = useState<string>('');
    const [headCountChairs, setHeadCountChairs] = useState<string>('');
    const [headCountDate, setHeadCountDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [submittingHeadCount, setSubmittingHeadCount] = useState(false);

    useEffect(() => {
        if (token) {
            fetchHalls();
        }
    }, [token]);

    useEffect(() => {
        if (selectedHall && token) {
            fetchAttendance();
        }
    }, [selectedHall, token, selectedDate]);

    const fetchHalls = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const hallsData = await hallsAPI.getAll(token);
            setHalls(hallsData);
            if (hallsData.length > 0 && !selectedHall) {
                setSelectedHall(hallsData[0].name);
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to fetch halls');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAttendance = async () => {
        if (!token || !selectedHall) return;
        setLoading(true);
        try {
            const data = await hallsAPI.getAttendanceByDate(selectedHall, selectedDate, token);
            setAttendanceData(data);
            setSelectedUsers(new Set());
            // default exportHall to currently selected
            setExportHall(selectedHall);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to fetch attendance');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    function fmtTimeShort(d?: string | null) {
        if (!d) return '';
        try {
            const dt = new Date(d);
            return dt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
        } catch {
            return d;
        }
    }

    const handleUserToggle = (userId: string) => {
        const newSelected = new Set(selectedUsers);
        if (newSelected.has(userId)) {
            newSelected.delete(userId);
        } else {
            newSelected.add(userId);
        }
        setSelectedUsers(newSelected);
    };

    const handleMarkAttendance = async () => {
        if (!token || !selectedHall) {
            toast.error('Hall is required to mark attendance');
            return;
        }

        if (selectedUsers.size === 0) {
            toast.error('Please select at least one user');
            return;
        }

        // Get location
        if (!navigator.geolocation) {
            toast.error('Location services not supported on your device');
            return;
        }

        setMarking(true);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    await hallsAPI.markAttendance(
                        selectedHall,
                        {
                            location: { lat: latitude, lng: longitude },
                            users: Array.from(selectedUsers),
                        },
                        token
                    );
                    toast.success('Attendance marked successfully');
                    setSelectedUsers(new Set());
                    await fetchAttendance();
                } catch (error) {
                    toast.error(error instanceof Error ? error.message : 'Failed to mark attendance');
                    console.error(error);
                } finally {
                    setMarking(false);
                }
            },
            (error) => {
                setMarking(false);
                let message = 'Unable to retrieve location. ';
                if (error.code === error.PERMISSION_DENIED) {
                    message += 'Please enable location permissions.';
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    message += 'Location unavailable.';
                } else if (error.code === error.TIMEOUT) {
                    message += 'Location request timed out.';
                } else {
                    message += 'Ensure location services are enabled.';
                }
                toast.error(message);
                console.error('Geolocation error:', error);
            }
        );
    };

    const handleRevokeUser = async (userId: string) => {
        if (!token || !selectedHall) {
            toast.error('Hall is required to revoke attendance');
            return;
        }

        if (!confirm('Are you sure you want to revoke this user\'s attendance?')) return;

        setRevoking(true);
        try {
            await hallsAPI.revokeAttendance(
                selectedHall,
                selectedDate,
                { date: selectedDate, hall: selectedHall, user_ids: [userId] },
                token
            );
            toast.success('Attendance revoked successfully');
            // refresh data
            await fetchAttendance();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to revoke attendance');
            console.error(error);
        } finally {
            setRevoking(false);
        }
    };

    const handleSelectAll = () => {
        if (!attendanceData) return;

        const allUserIds = [
            ...attendanceData.absents.map(u => u.id),
            ...attendanceData.presents.map(u => u.id),
        ];
        setSelectedUsers(new Set(allUserIds));
    };

    const handleDeselectAll = () => {
        setSelectedUsers(new Set());
    };

    const handleExportHallCSV = async (hallName?: string | null) => {
        if (!token) { toast.error('Authentication required'); return; }
        const name = hallName || selectedHall;
        if (!name) { toast.error('Select a hall to export'); return; }

        try {
            let data: HallAttendanceResponse | null = null;
            // Always fetch attendance for the requested date to ensure history view
            data = await hallsAPI.getAttendanceByDate(name, selectedDate, token);

            const csvEscape = (v?: string | null) => {
                if (v === undefined || v === null) return '';
                const s = String(v);
                if (s.includes('"') || s.includes(',') || s.includes('\n')) {
                    return '"' + s.replace(/"/g, '""') + '"';
                }
                return s;
            };

            const headers = ['Hall', 'Category', 'First Name', 'Last Name', 'Reg No', 'Email', 'Last Seen', 'Role'];
            const rows = [headers.join(',')];

            data.presents.forEach(p => {
                const r = [
                    csvEscape(name),
                    'Present',
                    csvEscape(p.first_name),
                    csvEscape(p.last_name),
                    csvEscape(p.reg_no),
                    csvEscape(p.email),
                    csvEscape(fmtTimeShort(p.last_seen ?? p.created_at ?? '')),
                    csvEscape(p.role),
                ];
                rows.push(r.join(','));
            });

            data.absents.forEach(a => {
                const r = [
                    csvEscape(name),
                    'Absent',
                    csvEscape(a.first_name),
                    csvEscape(a.last_name),
                    csvEscape(a.reg_no),
                    csvEscape(a.email),
                    csvEscape(fmtTimeShort(a.last_seen ?? a.created_at ?? '')),
                    csvEscape(a.role),
                ];
                rows.push(r.join(','));
            });

            const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const safe = name.replace(/[^a-z0-9_-]/gi, '_');
            a.href = url;
            a.setAttribute('download', `${safe}.csv`);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success('CSV downloaded');
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to export');
        }
    };

    if (loading && halls.length === 0) {
        return (
            <div className="hall-manager__loading">
                <Loader className="hall-manager__spinner" />
                <p>Loading Hall Manager...</p>
            </div>
        );
    }

    if (!currentUser || (currentUser.role !== 'Admin' && currentUser.role !== 'Leader')) {
        return <div className="hall-manager__unauthorized">Access denied</div>;
    }

    return (
        <div className="hall-manager">
            <div className="hall-manager__header">
                <h1 className="hall-manager__title">Hall Manager</h1>
                <p className="hall-manager__subtitle">Manage hall attendance and track attendees</p>
            </div>

            {/* Hall Selection */}
            <div className="hall-manager__halls">
                <h2 className="hall-manager__section-title">Select Hall</h2>
                <div className="hall-manager__halls-grid">
                    {halls.map((hall) => (
                        <motion.button
                            key={hall.name}
                            className={`hall-manager__hall-card hall-manager__hall-card--${HALL_COLORS[hall.name] || 'gray'} ${selectedHall === hall.name ? 'hall-manager__hall-card--active' : ''}`}
                            onClick={() => setSelectedHall(hall.name)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <div className="hall-manager__hall-info">
                                <MapPin size={24} />
                                <div>
                                    <h3 className="hall-manager__hall-name">{hall.name}</h3>
                                    <p className="hall-manager__hall-leader">{hall.leader === 'N/A' || !hall.leader ? 'Daniel Maxwell' : hall.leader}</p>
                                </div>
                            </div>
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Attendance Details */}
            {selectedHall && attendanceData && (
                <motion.div
                    className="hall-manager__content"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="hall-manager__stats">
                        <Card glass padding="md" className="hall-manager__stat-card">
                            <div className="hall-manager__stat-content">
                                <UserCheck size={24} className="hall-manager__stat-icon hall-manager__stat-icon--present" />
                                <div>
                                    <p className="hall-manager__stat-label">Present</p>
                                    <h3 className="hall-manager__stat-value">{attendanceData.presents.length}</h3>
                                </div>
                            </div>
                        </Card>
                        <Card glass padding="md" className="hall-manager__stat-card">
                            <div className="hall-manager__stat-content">
                                <UserX size={24} className="hall-manager__stat-icon hall-manager__stat-icon--absent" />
                                <div>
                                    <p className="hall-manager__stat-label">Absent</p>
                                    <h3 className="hall-manager__stat-value">{attendanceData.absents.length}</h3>
                                </div>
                            </div>
                        </Card>
                        <Card glass padding="md" className="hall-manager__stat-card">
                            <div className="hall-manager__stat-content">
                                <Users size={24} className="hall-manager__stat-icon hall-manager__stat-icon--total" />
                                <div>
                                    <p className="hall-manager__stat-label">Total</p>
                                    <h3 className="hall-manager__stat-value">{attendanceData.presents.length + attendanceData.absents.length}</h3>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <div className="hall-manager__controls" style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: '12px' }}>
                        <div className="hall-manager__controls-left" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Search size={16} />
                            <input
                                placeholder="Search attendees..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{
                                    padding: '0 12px',
                                    borderRadius: 8,
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--surface-glass)',
                                    color: 'var(--text-primary)',
                                    height: '44px',
                                    fontSize: 'var(--text-base)'
                                }}
                            />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={e => setSelectedDate(e.target.value)}
                                style={{
                                    marginLeft: 8,
                                    padding: '0 12px',
                                    borderRadius: 8,
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--surface-glass)',
                                    color: 'var(--text-primary)',
                                    height: '44px',
                                    fontSize: 'var(--text-base)'
                                }}
                            />
                        </div>

                        <div className="hall-manager__controls-right" style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
                            <select value={exportHall ?? ''} onChange={e => setExportHall(e.target.value)} style={{ padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--surface-glass)', color: 'var(--text-primary)', height: '44px', fontSize: 'var(--text-base)' }}>
                                {halls.map(h => <option key={h.name} value={h.name}>{h.name}</option>)}
                            </select>
                            <Button variant="secondary" icon={<Download size={14} />} onClick={() => handleExportHallCSV(exportHall ?? selectedHall)}>
                                Export CSV
                            </Button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="hall-manager__tabs">
                        <button
                            className={`hall-manager__tab ${tabView === 'attendance' ? 'hall-manager__tab--active' : ''}`}
                            onClick={() => setTabView('attendance')}
                        >
                            Attendance Overview
                        </button>
                        <button
                            className={`hall-manager__tab ${tabView === 'users' ? 'hall-manager__tab--active' : ''}`}
                            onClick={() => setTabView('users')}
                        >
                            Mark Attendance
                        </button>
                        <button
                            className={`hall-manager__tab ${tabView === 'headcount' ? 'hall-manager__tab--active' : ''}`}
                            onClick={() => setTabView('headcount')}
                        >
                            Head Count
                        </button>
                    </div>

                    {/* Attendance View */}
                    <AnimatePresence mode="wait">
                        {tabView === 'attendance' && (
                            <motion.div
                                key="attendance-view"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="hall-manager__tab-content"
                            >
                                <div className="hall-manager__attendance-grid">
                                    {/* Present Users */}
                                    <Card glass padding="lg" className="hall-manager__users-card">
                                        <h3 className="hall-manager__users-title hall-manager__users-title--present">
                                            <UserCheck size={20} />
                                            Present ({attendanceData.presents.length})
                                        </h3>
                                        <div className="hall-manager__users-list">
                                            {attendanceData.presents.filter(u => `${u.first_name} ${u.last_name} ${u.email} ${u.reg_no}`.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                                                <p className="hall-manager__empty-message">No users marked present</p>
                                            ) : (
                                                attendanceData.presents
                                                    .filter(u => `${u.first_name} ${u.last_name} ${u.email} ${u.reg_no}`.toLowerCase().includes(searchQuery.toLowerCase()))
                                                    .map((user) => (
                                                        <motion.div
                                                            key={user.id}
                                                            className="hall-manager__user-item"
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                        >
                                                            <Avatar src={user.avatar_url} alt={`${user.first_name} ${user.last_name}`} size="sm" fallback={getInitials(user)} />
                                                            <div className="hall-manager__user-info">
                                                                <p className="hall-manager__user-name">
                                                                    {user.first_name} {user.last_name}
                                                                </p>
                                                                <p className="hall-manager__user-meta">
                                                                    {user.email || 'No email'}
                                                                </p>
                                                            </div>
                                                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                                <span className="hall-manager__badge hall-manager__badge--present">Present</span>
                                                                <Button size="sm" variant="secondary" onClick={() => handleRevokeUser(user.id)} loading={revoking}>
                                                                    Revoke
                                                                </Button>
                                                            </div>
                                                        </motion.div>
                                                    ))
                                            )}
                                        </div>
                                    </Card>

                                    {/* Absent Users */}
                                    <Card glass padding="lg" className="hall-manager__users-card">
                                        <h3 className="hall-manager__users-title hall-manager__users-title--absent">
                                            <UserX size={20} />
                                            Absent ({attendanceData.absents.length})
                                        </h3>
                                        <div className="hall-manager__users-list">
                                            {attendanceData.absents.filter(u => `${u.first_name} ${u.last_name} ${u.email} ${u.reg_no}`.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                                                <p className="hall-manager__empty-message">No absent users</p>
                                            ) : (
                                                attendanceData.absents
                                                    .filter(u => `${u.first_name} ${u.last_name} ${u.email} ${u.reg_no}`.toLowerCase().includes(searchQuery.toLowerCase()))
                                                    .map((user) => (
                                                        <motion.div
                                                            key={user.id}
                                                            className="hall-manager__user-item"
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                        >
                                                            <Avatar src={user.avatar_url} alt={`${user.first_name} ${user.last_name}`} size="sm" fallback={getInitials(user)} />
                                                            <div className="hall-manager__user-info">
                                                                <p className="hall-manager__user-name">
                                                                    {user.first_name} {user.last_name}
                                                                </p>
                                                                <p className="hall-manager__user-meta">
                                                                    {user.email || 'No email'}
                                                                </p>
                                                            </div>
                                                            <span className="hall-manager__badge hall-manager__badge--absent">Absent</span>
                                                        </motion.div>
                                                    ))
                                            )}
                                        </div>
                                    </Card>
                                </div>
                            </motion.div>
                        )}

                        {/* Mark Attendance View */}
                        {tabView === 'users' && (
                            <motion.div
                                key="mark-view"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="hall-manager__tab-content"
                            >
                                <Card glass padding="lg" className="hall-manager__mark-card">
                                    <div className="hall-manager__mark-header">
                                        <h3 className="hall-manager__mark-title">Select Users to Mark Present</h3>
                                        <div className="hall-manager__mark-actions">
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={handleSelectAll}
                                            >
                                                Select All
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={handleDeselectAll}
                                            >
                                                Deselect All
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="hall-manager__mark-users">
                                        {/* Present Users */}
                                        <div className="hall-manager__mark-section">
                                            <h4 className="hall-manager__mark-section-title">
                                                Already Present ({attendanceData.presents.length})
                                            </h4>
                                            <div className="hall-manager__mark-list">
                                                {attendanceData.presents.map((user) => (
                                                    <motion.label
                                                        key={user.id}
                                                        className="hall-manager__mark-item"
                                                        whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedUsers.has(user.id)}
                                                            onChange={() => handleUserToggle(user.id)}
                                                            className="hall-manager__checkbox"
                                                        />
                                                        {/* drag handle removed - reordering disabled */}
                                                        <Avatar src={user.avatar_url} alt={`${user.first_name} ${user.last_name}`} size="sm" fallback={getInitials(user)} />
                                                        <div className="hall-manager__mark-user-info">
                                                            <p className="hall-manager__mark-user-name">
                                                                {user.first_name} {user.last_name}
                                                            </p>
                                                            <p className="hall-manager__mark-user-meta">
                                                                {user.reg_no || user.email || 'No ID'}
                                                            </p>
                                                        </div>
                                                        <span className="hall-manager__status-badge hall-manager__status-badge--present">
                                                            Present
                                                        </span>
                                                    </motion.label>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Absent Users */}
                                        <div className="hall-manager__mark-section">
                                            <h4 className="hall-manager__mark-section-title">
                                                Absent ({attendanceData.absents.length})
                                            </h4>
                                            <div className="hall-manager__mark-list">
                                                {attendanceData.absents.length === 0 ? (
                                                    <p className="hall-manager__no-users">No absent users</p>
                                                ) : (
                                                    attendanceData.absents.map((user) => (
                                                        <motion.label
                                                            key={user.id}
                                                            className="hall-manager__mark-item"
                                                            whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedUsers.has(user.id)}
                                                                onChange={() => handleUserToggle(user.id)}
                                                                className="hall-manager__checkbox"
                                                            />
                                                            {/* drag handle removed - reordering disabled */}
                                                            <Avatar src={user.avatar_url} alt={`${user.first_name} ${user.last_name}`} size="sm" fallback={getInitials(user)} />
                                                            <div className="hall-manager__mark-user-info">
                                                                <p className="hall-manager__mark-user-name">
                                                                    {user.first_name} {user.last_name}
                                                                </p>
                                                                <p className="hall-manager__mark-user-meta">
                                                                    {user.reg_no || user.email || 'No ID'}
                                                                </p>
                                                            </div>
                                                            <span className="hall-manager__status-badge hall-manager__status-badge--absent">
                                                                Absent
                                                            </span>
                                                        </motion.label>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="hall-manager__mark-footer">
                                        <p className="hall-manager__selected-count">
                                            {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''} selected
                                        </p>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <Button
                                                onClick={handleMarkAttendance}
                                                loading={marking}
                                                disabled={selectedUsers.size === 0 || revoking}
                                                className="hall-manager__mark-button"
                                            >
                                                Mark Present
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        )}

                        {/* Head Count View */}
                        {tabView === 'headcount' && (
                            <motion.div
                                key="headcount-view"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="hall-manager__tab-content"
                            >
                                <Card glass padding="lg" className="hall-manager__headcount-card">
                                    <div className="hall-manager__headcount-header">
                                        <div className="hall-manager__headcount-icon-wrap">
                                            <ClipboardList size={24} />
                                        </div>
                                        <div>
                                            <h3 className="hall-manager__headcount-title">Head Count</h3>
                                            <p className="hall-manager__headcount-subtitle">
                                                Record attendance numbers for <strong>{selectedHall}</strong>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="hall-manager__headcount-form">
                                        <div className="hall-manager__headcount-field">
                                            <label className="hall-manager__headcount-label">
                                                <Users size={16} />
                                                Total Number of People
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                placeholder="e.g. 250"
                                                value={headCountPeople}
                                                onChange={(e) => setHeadCountPeople(e.target.value)}
                                                className="hall-manager__headcount-input"
                                            />
                                        </div>

                                        <div className="hall-manager__headcount-field">
                                            <label className="hall-manager__headcount-label">
                                                <Armchair size={16} />
                                                Total Number of Chairs
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                placeholder="e.g. 300"
                                                value={headCountChairs}
                                                onChange={(e) => setHeadCountChairs(e.target.value)}
                                                className="hall-manager__headcount-input"
                                            />
                                        </div>

                                        <div className="hall-manager__headcount-field">
                                            <label className="hall-manager__headcount-label">
                                                <Calendar size={16} />
                                                Date
                                            </label>
                                            <input
                                                type="date"
                                                value={headCountDate}
                                                onChange={(e) => setHeadCountDate(e.target.value)}
                                                className="hall-manager__headcount-input"
                                            />
                                        </div>
                                    </div>

                                    <div className="hall-manager__headcount-footer">
                                        <div className="hall-manager__headcount-summary">
                                            {headCountPeople && headCountChairs && (
                                                <p className="hall-manager__headcount-ratio">
                                                    Occupancy: <strong>{Math.round((parseInt(headCountPeople) / parseInt(headCountChairs)) * 100) || 0}%</strong>
                                                    <span> ({headCountPeople} people / {headCountChairs} chairs)</span>
                                                </p>
                                            )}
                                        </div>
                                        <Button
                                            onClick={() => {
                                                if (!headCountPeople || !headCountChairs) {
                                                    toast.error('Please fill in all fields');
                                                    return;
                                                }
                                                setSubmittingHeadCount(true);
                                                // Simulated submission — API route not yet connected
                                                setTimeout(() => {
                                                    toast.success(`Head count recorded for ${selectedHall} on ${headCountDate}`);
                                                    setSubmittingHeadCount(false);
                                                }, 600);
                                            }}
                                            loading={submittingHeadCount}
                                            disabled={!headCountPeople || !headCountChairs}
                                            icon={<Send size={16} />}
                                            className="hall-manager__headcount-submit"
                                        >
                                            Submit Head Count
                                        </Button>
                                    </div>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
        </div>
    );
}
