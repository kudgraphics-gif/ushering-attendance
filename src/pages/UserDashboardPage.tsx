import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import { analyticsAPI, eventsAPI, attendanceAPI } from '../services/api';
import type { Event, UserDto } from '../types';
import toast from 'react-hot-toast';
import { MapPin, Calendar, CheckCircle2, User, Info, Crown } from 'lucide-react';
import { getDeviceId, recordDeviceCheckIn, hasDeviceCheckedInToday } from '../utils/deviceId';
import { getNearestVenue } from '../utils/geoCheck';
import { SuggestionBox } from '../components/ui/SuggestionBox';
import { LocationWarningModal } from '../components/ui/LocationWarningModal';
import { DeviceIdWarningModal } from '../components/ui/DeviceIdWarningModal';
import { motion, AnimatePresence } from 'framer-motion';
import './UserDashboard.css';
import '../pages/LoginPageValues.css'; // Import Core Values CSS

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

interface UserAttendance {
    user: UserDto;
    history: AttendanceRecord[];
    summary: {
        total_days: number;
        days_present: number;
        rate: number;
    };
}

const CORE_VALUES = [
    "Our Core Values", // Added as the title/intro
    "Character",
    "Love",
    "Supremacy of The Word",
    "Excellence",
    "Service",
    "Faith",
    "The Anointing"
];

// ─── Security check session counters (reset on full page reload) ──────────────
const SESSION_KEY = 'security_check_session';

function getSessionCounts(): { locationCount: number; deviceIdCount: number } {
    try {
        const raw = sessionStorage.getItem(SESSION_KEY);
        return raw ? JSON.parse(raw) : { locationCount: 0, deviceIdCount: 0 };
    } catch {
        return { locationCount: 0, deviceIdCount: 0 };
    }
}

function saveSessionCounts(counts: { locationCount: number; deviceIdCount: number }) {
    try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(counts));
    } catch {
        // ignore
    }
}

export function UserDashboardPage() {
    const { user, token } = useAuthStore();
    const [attendanceData, setAttendanceData] = useState<UserAttendance | null>(null);
    const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [checkingIn, setCheckingIn] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    // ── Security check state ──────────────────────────────────────────────────
    const [locationWarning, setLocationWarning] = useState<{
        distanceMeters: number;
        venueName: string;
    } | null>(null);
    const [locationDismissCount, setLocationDismissCount] = useState(0);
    const [rechecking, setRechecking] = useState(false);

    const [showDeviceIdWarning, setShowDeviceIdWarning] = useState(false);
    const [deviceIdDismissCount, setDeviceIdDismissCount] = useState(0);

    const securityChecked = useRef(false);

    // Core values ticker
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % CORE_VALUES.length);
        }, 3000);
        return () => clearInterval(timer);
    }, []);

    // ── Run security checks once on mount ────────────────────────────────────
    useEffect(() => {
        if (!user || securityChecked.current) return;
        securityChecked.current = true;

        const counts = getSessionCounts();

        // 1. Device ID check
        const localDeviceId = getDeviceId();
        const serverDeviceId = (user as any)?.device_id as string | undefined;

        if (
            serverDeviceId &&
            localDeviceId !== serverDeviceId &&
            counts.deviceIdCount < 2
        ) {
            setShowDeviceIdWarning(true);
            setDeviceIdDismissCount(counts.deviceIdCount);
        }

        // 2. Geolocation check
        if (navigator.geolocation && counts.locationCount < 2) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const result = getNearestVenue(pos.coords.latitude, pos.coords.longitude);
                    if (!result.isWithin) {
                        setLocationWarning({
                            distanceMeters: result.distanceMeters,
                            venueName: result.name,
                        });
                        setLocationDismissCount(counts.locationCount);
                    }
                },
                () => {
                    // Silent — we only warn if we know they're out of bounds
                },
                {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 60000,
                }
            );
        }
    }, [user]);

    // ── Location re-check (triggered by modal dismiss button) ────────────────
    const handleLocationRecheck = () => {
        setRechecking(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const result = getNearestVenue(pos.coords.latitude, pos.coords.longitude);
                setRechecking(false);

                if (result.isWithin) {
                    // They're now within bounds — close the modal
                    setLocationWarning(null);
                    const counts = getSessionCounts();
                    saveSessionCounts({ ...counts, locationCount: counts.locationCount + 1 });
                } else {
                    // Still out of bounds: update distance, increment dismiss count
                    setLocationWarning({
                        distanceMeters: result.distanceMeters,
                        venueName: result.name,
                    });
                    const newCount = locationDismissCount + 1;
                    setLocationDismissCount(newCount);
                    const counts = getSessionCounts();
                    saveSessionCounts({ ...counts, locationCount: newCount });
                }
            },
            () => {
                setRechecking(false);
                const newCount = locationDismissCount + 1;
                setLocationDismissCount(newCount);
                const counts = getSessionCounts();
                saveSessionCounts({ ...counts, locationCount: newCount });
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    };

    const handleLocationDismiss = () => {
        setLocationWarning(null);
        const counts = getSessionCounts();
        saveSessionCounts({ ...counts, locationCount: 2 });
    };

    // ── Device ID dismiss ─────────────────────────────────────────────────────
    const handleDeviceIdDismiss = () => {
        const newCount = deviceIdDismissCount + 1;
        if (newCount >= 2) {
            setShowDeviceIdWarning(false);
            const counts = getSessionCounts();
            saveSessionCounts({ ...counts, deviceIdCount: 2 });
        } else {
            setDeviceIdDismissCount(newCount);
            const counts = getSessionCounts();
            saveSessionCounts({ ...counts, deviceIdCount: newCount });
        }
    };

    // ── Dashboard data load ───────────────────────────────────────────────────
    useEffect(() => {
        const loadData = async () => {
            if (!user || !token) return;

            setLoading(true);

            try {
                try {
                    const attendanceResponse = await analyticsAPI.getUserAttendance(user.id, token);
                    setAttendanceData(attendanceResponse.data);
                } catch {
                    setAttendanceData({
                        user,
                        history: [],
                        summary: { total_days: 0, days_present: 0, rate: 0 },
                    });
                }

                try {
                    const eventsResponse = await eventsAPI.getUpcoming(token);
                    setUpcomingEvents(eventsResponse);
                } catch {
                    setUpcomingEvents([]);
                }
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [user, token]);

    const handleCheckIn = async () => {
        if (!token || !user) {
            toast.error('You must be logged in to check in');
            return;
        }

        if (hasDeviceCheckedInToday()) {
            toast.error("You've already checked in today");
            return;
        }

        if (!navigator.geolocation) {
            toast.error('Location not supported on your device');
            return;
        }

        setCheckingIn(true);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                try {
                    const deviceId = getDeviceId();

                    await attendanceAPI.checkIn(
                        {
                            location: { lat: latitude, lng: longitude },
                            device_id: deviceId,
                        },
                        token
                    );

                    recordDeviceCheckIn(user.id);
                    toast.success('Checked in successfully');

                    try {
                        const updatedData = await analyticsAPI.getUserAttendance(user.id, token);
                        setAttendanceData(updatedData.data);
                    } catch {
                        // Check-in succeeded even if attendance fetch fails
                    }
                } catch (error) {
                    toast.error(
                        error instanceof Error ? error.message : 'Check-in failed, please try again'
                    );
                } finally {
                    setCheckingIn(false);
                }
            },
            (error) => {
                setCheckingIn(false);

                let message = 'Unable to access your location. ';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        message += 'Please enable location permissions.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message += 'Location unavailable. Try again.';
                        break;
                    case error.TIMEOUT:
                        message += 'Request timed out. Try again.';
                        break;
                    default:
                        message += 'Please ensure location services are enabled.';
                }
                toast.error(message);
            },
            {
                enableHighAccuracy: false,
                timeout: 30000,
                maximumAge: Infinity,
            }
        );
    };

    if (loading) {
        return (
            <div className="user-dashboard">
                <div className="user-dashboard__loading">
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Loading...</p>
                    </div>
                </div>
            </div>
        );
    }

    const attendanceRate = attendanceData?.summary
        ? Math.round(attendanceData.summary.rate)
        : 0;
    const daysPresent = attendanceData?.summary?.days_present || 0;
    const totalDays = attendanceData?.summary?.total_days || 0;

    // Roster Info Calculation
    let rosterHall = (user as any)?.current_roster_hall;
    let rosterAllocation = (user as any)?.current_roster_allocation;

    if (rosterHall) rosterHall = rosterHall.replace(/^"|"$/g, '');
    if (rosterAllocation) rosterAllocation = rosterAllocation.replace(/^"|"$/g, '');
    const isRosterActive = !!rosterHall;

    return (
        <div className="user-dashboard">
            {/* ── Security Modals ─────────────────────────────────────────── */}
            <AnimatePresence>
                {locationWarning && (
                    <LocationWarningModal
                        key="location-warning"
                        distanceMeters={locationWarning.distanceMeters}
                        venueName={locationWarning.venueName}
                        dismissCount={locationDismissCount}
                        onRecheck={handleLocationRecheck}
                        onDismiss={handleLocationDismiss}
                        rechecking={rechecking}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showDeviceIdWarning && (
                    <DeviceIdWarningModal
                        key="device-id-warning"
                        dismissCount={deviceIdDismissCount}
                        onDismiss={handleDeviceIdDismiss}
                    />
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="user-dashboard__header">
                {/* Core Values Badge */}
                <div className="login-page__core-value-container" style={{ marginBottom: '1rem' }}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, y: 10, filter: 'blur(5px)' }}
                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, y: -10, filter: 'blur(5px)' }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                            className="login-page__core-value-text"
                        >
                            {CORE_VALUES[currentIndex]}
                        </motion.div>
                    </AnimatePresence>
                </div>

                <h1>Hello, {user?.first_name}</h1>
                <div className="usher-badge">
                    <div className="usher-badge__icon">
                        <Crown size={18} fill="#D4AF37" strokeWidth={1.5} />
                    </div>
                    <span>Usher with a Difference</span>
                </div>
            </div>

            {/* Check-in Button - Large and Prominent */}
            <div className="user-dashboard__checkin">
                <button
                    onClick={handleCheckIn}
                    disabled={checkingIn}
                    className="checkin-button"
                >
                    <CheckCircle2 size={32} />
                    <span>{checkingIn ? 'Checking in...' : 'Check In'}</span>
                </button>
                <p className="user-dashboard__checkin-hint">
                    Tap to record your attendance
                </p>
            </div>

            {/* Attendance Stats */}
            {attendanceData?.summary && (
                <div className="user-dashboard__stats">
                    <div className="stat-box">
                        <div className="stat-box__label">Attendance Rate</div>
                        <div className="stat-box__value">{attendanceRate}%</div>
                        <div className="stat-box__detail">
                            {daysPresent} of {totalDays} days
                        </div>
                    </div>

                    <div className="stat-box">
                        <div className="stat-box__label">Days Present</div>
                        <div className="stat-box__value">{daysPresent}</div>
                    </div>

                    <div className="stat-box">
                        <div className="stat-box__label">Total Days</div>
                        <div className="stat-box__value">{totalDays}</div>
                    </div>
                </div>
            )}

            {/* Upcoming Events */}
            {upcomingEvents.length > 0 && (
                <div className="user-dashboard__section">
                    <h2>Upcoming Events</h2>
                    <div className="events-cards">
                        {upcomingEvents.slice(0, 3).map((event) => (
                            <div key={event.id} className="event-card">
                                <div className="event-card__header">
                                    <h3>{event.title}</h3>
                                    <span className="event-card__type">{event.attendance_type}</span>
                                </div>
                                {event.description && (
                                    <p className="event-card__description">{event.description}</p>
                                )}
                                <div className="event-card__meta">
                                    <div className="event-card__item">
                                        <Calendar size={16} />
                                        <span>{new Date(event.date).toLocaleDateString()} · {event.time}</span>
                                    </div>
                                    <div className="event-card__item">
                                        <MapPin size={16} />
                                        <span>{event.location}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Roster Information */}
            <div className="user-dashboard__section">
                <h2>Roster Assignment</h2>
                <div className={`roster-card ${isRosterActive ? 'roster-card--active' : 'roster-card--pending'}`}>
                    <div className="roster-card__header">
                        <div className="roster-card__icon">
                            {isRosterActive ? <MapPin size={24} /> : <Info size={24} />}
                        </div>
                        <div className="roster-card__status">
                            {isRosterActive ? 'Active' : 'Pending'}
                        </div>
                    </div>

                    <div className="roster-card__content">
                        {isRosterActive ? (
                            <>
                                <div className="roster-card__hall">{rosterHall}</div>
                                <div className="roster-card__allocation">
                                    <User size={14} style={{ marginRight: '6px' }} />
                                    {rosterAllocation || 'Member'}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="roster-card__pending-title">No Hall Assigned</div>
                                <div className="roster-card__pending-text">
                                    You have not been assigned to a roster yet. Please check back later.
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Check-ins */}
            {attendanceData?.history && attendanceData.history.length > 0 && (
                <div className="user-dashboard__section">
                    <h2>Recent Check-ins</h2>
                    <div className="checkins-list">
                        {attendanceData.history.slice(0, 5).map((record) => (
                            <div key={record.id} className="checkin-item">
                                <div className="checkin-item__date">
                                    {new Date(record.date).toLocaleDateString('en-US', {
                                        weekday: 'short',
                                        month: 'short',
                                        day: 'numeric',
                                    })}
                                </div>
                                <div className="checkin-item__time">{record.time_in}</div>
                                <div className="checkin-item__status">
                                    {record.marked_by ? 'Verified' : 'Self Check-in'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <SuggestionBox />
        </div>
    );
}