import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { analyticsAPI, eventsAPI, attendanceAPI } from '../services/api';
import type { Event, UserDto } from '../types';
import toast from 'react-hot-toast';
import { MapPin, Calendar, CheckCircle2, User, Info, Crown } from 'lucide-react';
import { getDeviceId, recordDeviceCheckIn, hasDeviceCheckedInToday } from '../utils/deviceId';
import { SuggestionBox } from '../components/ui/SuggestionBox';
import './UserDashboard.css';

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

export function UserDashboardPage() {
    const { user, token } = useAuthStore();
    const [attendanceData, setAttendanceData] = useState<UserAttendance | null>(null);
    const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [checkingIn, setCheckingIn] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            if (!user || !token) return;

            setLoading(true);

            try {
                // Try to load user attendance data
                try {
                    const attendanceResponse = await analyticsAPI.getUserAttendance(user.id, token);
                    setAttendanceData(attendanceResponse.data);
                } catch {
                    // If attendance endpoint fails, create mock data structure
                    setAttendanceData({
                        user,
                        history: [],
                        summary: {
                            total_days: 0,
                            days_present: 0,
                            rate: 0,
                        },
                    });
                }

                // Load upcoming events
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

        // Check if device already checked in today
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
                            location: {
                                lat: latitude,
                                lng: longitude,
                            },
                            device_id: deviceId,
                        },
                        token
                    );

                    recordDeviceCheckIn(user.id);
                    toast.success('Checked in successfully');

                    // Reload attendance data
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
                timeout: 30000,       // Give the laptop 30 seconds to find WiFi networks
                maximumAge: Infinity  // Accept a cached location if available
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

    // Strip quotes
    if (rosterHall) rosterHall = rosterHall.replace(/^"|"$/g, '');
    if (rosterAllocation) rosterAllocation = rosterAllocation.replace(/^"|"$/g, '');
    const isRosterActive = !!rosterHall;

    return (
        <div className="user-dashboard">
            {/* Header */}
            <div className="user-dashboard__header">
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

            {/* Attendance Stats - Simple */}
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

            {/* NEW SECTION: Roster Information */}
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