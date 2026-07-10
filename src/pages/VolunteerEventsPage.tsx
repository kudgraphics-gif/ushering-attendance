import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, MapPin, Plus, Edit2, Trash2, CheckCircle2, Info, X, AlertCircle, RefreshCw } from 'lucide-react';
import { useVolunteerAuthStore } from '../stores/volunteerAuthStore';
import { useAuthStore } from '../stores/authStore';
import { volunteerEventsAPI } from '../services/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import toast from 'react-hot-toast';
import './VolunteerEventsPage.css';

interface VolunteerEvent {
    id: string;
    title: string;
    description: string;
    date: string;
    time: string;
    location: string;
    attendance_type: string;
    grace_period_in_minutes: number;
}

interface VolunteerEventsPageProps {
    adminMode?: boolean;
}

export function VolunteerEventsPage({ adminMode = false }: VolunteerEventsPageProps) {
    const { token: adminToken, user } = useAuthStore();
    const { token: volunteerToken, volunteer, isAuthenticated: isVolunteerAuthenticated } = useVolunteerAuthStore();

    const token = adminMode ? adminToken : (volunteerToken || adminToken);
    const isAdmin = user?.role === 'Admin';
    const isVolunteer = isVolunteerAuthenticated;

    const [events, setEvents] = useState<VolunteerEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'all'>(adminMode ? 'all' : 'upcoming');

    // CRUD Modal State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<VolunteerEvent | null>(null);
    const [formLoading, setFormLoading] = useState(false);

    // Form inputs
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [location, setLocation] = useState('DOA');
    const [attendanceType, setAttendanceType] = useState('Remote');
    const [gracePeriod, setGracePeriod] = useState(15);

    // Details Modal State
    const [detailsEvent, setDetailsEvent] = useState<VolunteerEvent | null>(null);

    // Identifier Check-in Modal State
    const [pendingCheckInEvent, setPendingCheckInEvent] = useState<VolunteerEvent | null>(null);
    const [identifierModalOpen, setIdentifierModalOpen] = useState(false);
    const [identifierValue, setIdentifierValue] = useState('');
    const [checkingIn, setCheckingIn] = useState(false);

    useEffect(() => {
        fetchEvents();
    }, [activeTab, adminMode]);

    const fetchEvents = async () => {
        if (!token) return;
        setLoading(true);
        try {
            let data: VolunteerEvent[] = [];
            if (adminMode || activeTab === 'all') {
                data = await volunteerEventsAPI.getAll(token);
            } else if (activeTab === 'upcoming') {
                data = await volunteerEventsAPI.getUpcoming(token);
            } else {
                data = await volunteerEventsAPI.getPast(token);
            }
            setEvents(data || []);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load volunteer events');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreate = () => {
        setSelectedEvent(null);
        setTitle('');
        setDescription('');
        setDate('');
        setTime('');
        setLocation('DOA');
        setAttendanceType('Remote');
        setGracePeriod(15);
        setIsFormOpen(true);
    };

    const handleOpenEdit = (event: VolunteerEvent) => {
        setSelectedEvent(event);
        setTitle(event.title);
        setDescription(event.description);
        setDate(event.date.split('T')[0]);
        setTime(event.time.slice(0, 5));
        setLocation(event.location);
        setAttendanceType(event.attendance_type);
        setGracePeriod(event.grace_period_in_minutes);
        setIsFormOpen(true);
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;

        setFormLoading(true);
        const payload = {
            title,
            description,
            date,
            time: time.includes(':') && time.split(':').length === 2 ? `${time}:00` : time,
            location,
            attendance_type: attendanceType,
            grace_period_in_minutes: Number(gracePeriod)
        };

        try {
            if (selectedEvent) {
                // Update
                await volunteerEventsAPI.update({
                    event_id: selectedEvent.id,
                    ...payload
                }, token);
                toast.success('Event updated successfully');
            } else {
                // Create
                await volunteerEventsAPI.create(payload, token);
                toast.success('Event created successfully');
            }
            setIsFormOpen(false);
            fetchEvents();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Operation failed');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (eventId: string) => {
        if (!token) return;
        if (!window.confirm('Are you sure you want to delete this event?')) return;

        try {
            await volunteerEventsAPI.delete(eventId, token);
            toast.success('Event deleted successfully');
            fetchEvents();
        } catch (error) {
            toast.error('Failed to delete event');
        }
    };

    const handleCardClick = async (eventId: string) => {
        if (!token) return;
        try {
            const data = await volunteerEventsAPI.getById(eventId, token);
            setDetailsEvent(data);
        } catch (error) {
            toast.error('Failed to fetch event details');
        }
    };

    const triggerCheckIn = async (event: VolunteerEvent) => {
        if (!token) {
            toast.error('Not authenticated');
            return;
        }

        if (isVolunteer && volunteer) {
            setCheckingIn(true);
            let locationPayload: { lat: number; lng: number } | null = null;
            
            if (navigator.geolocation) {
                try {
                    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 6000 });
                    });
                    locationPayload = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                } catch (err) {
                    console.warn('Geolocation unavailable');
                }
            }

            try {
                await volunteerEventsAPI.checkIn({
                    event_id: event.id,
                    volunteer_id: volunteer.id,
                    attendance_type: event.attendance_type,
                    token: volunteerToken || '',
                    location: locationPayload
                }, token);
                toast.success('Attendance recorded!');
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Check-in failed');
            } finally {
                setCheckingIn(false);
            }
        } else {
            setPendingCheckInEvent(event);
            setIdentifierValue('');
            setIdentifierModalOpen(true);
        }
    };

    const handleIdentifierCheckIn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pendingCheckInEvent || !identifierValue || !token) return;

        setCheckingIn(true);
        let locationPayload: { lat: number; lng: number } | null = null;

        if (navigator.geolocation) {
            try {
                const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 6000 });
                });
                locationPayload = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
            } catch (err) {
                // ignore
            }
        }

        try {
            await volunteerEventsAPI.checkInIdentifier({
                event_id: pendingCheckInEvent.id,
                identifier: identifierValue,
                attendance_type: pendingCheckInEvent.attendance_type,
                location: locationPayload
            }, token);
            toast.success(`Check-in recorded for ${identifierValue}`);
            setIdentifierModalOpen(false);
            setIdentifierValue('');
            setPendingCheckInEvent(null);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Identifier check-in failed');
        } finally {
            setCheckingIn(false);
        }
    };

    return (
        <div className="vol-events">
            <div className="vol-events__header">
                <div>
                    <h1 className="vol-events__title">Volunteer Events</h1>
                    <p className="vol-events__subtitle">
                        {adminMode ? 'Manage rosters, locations and schedules' : 'View your schedule and sign-in'}
                    </p>
                </div>

                <div className="vol-events__actions">
                    {adminMode && isAdmin && (
                        <Button variant="primary" icon={<Plus size={18} />} onClick={handleOpenCreate}>
                            Create Event
                        </Button>
                    )}
                    <button onClick={fetchEvents} className="vol-events__refresh" title="Reload data">
                        <RefreshCw size={16} />
                    </button>
                </div>
            </div>

            {/* Filter Tabs for standard volunteer mode */}
            {!adminMode && (
                <div className="vol-events__tabs">
                    <button
                        className={`vol-events__tab ${activeTab === 'upcoming' ? 'active' : ''}`}
                        onClick={() => setActiveTab('upcoming')}
                    >
                        Upcoming
                    </button>
                    <button
                        className={`vol-events__tab ${activeTab === 'past' ? 'active' : ''}`}
                        onClick={() => setActiveTab('past')}
                    >
                        Past History
                    </button>
                </div>
            )}

            {loading ? (
                <div className="vol-events__loading">Loading events...</div>
            ) : events.length === 0 ? (
                <div className="vol-events__empty">
                    <AlertCircle size={40} className="vol-events__empty-icon" />
                    <p>No volunteer events found</p>
                </div>
            ) : (
                <>
                    {/* Desktop View Table (only shown in admin mode on desktop) */}
                    {adminMode && (
                        <div className="vol-events__table-container glass desktop-only">
                            <table className="vol-events__table">
                                <thead>
                                    <tr>
                                        <th>Event Title</th>
                                        <th>Date</th>
                                        <th>Time</th>
                                        <th>Location</th>
                                        <th>Attendance Type</th>
                                        <th>Grace Period</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {events.map((event) => (
                                        <tr key={event.id}>
                                            <td style={{ fontWeight: 600 }}>{event.title}</td>
                                            <td>{new Date(event.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</td>
                                            <td>{event.time.slice(0, 5)}</td>
                                            <td>{event.location}</td>
                                            <td>
                                                <Badge variant={event.attendance_type === 'Mandatory' ? 'danger' : 'primary'} size="sm">
                                                    {event.attendance_type}
                                                </Badge>
                                            </td>
                                            <td>{event.grace_period_in_minutes} mins</td>
                                            <td>
                                                <div className="vol-events__table-actions">
                                                    {isAdmin && (
                                                        <>
                                                            <button onClick={() => handleOpenEdit(event)} className="vol-events__icon-btn" title="Edit">
                                                                <Edit2 size={15} />
                                                            </button>
                                                            <button onClick={() => handleDelete(event.id)} className="vol-events__icon-btn delete" title="Delete">
                                                                <Trash2 size={15} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Grid/Card View (always shown on mobile; shown for volunteers on all viewports) */}
                    <div className={`vol-events__grid ${adminMode ? 'mobile-only' : ''}`}>
                        {events.map((event) => {
                            const eventDate = new Date(event.date);
                            const isToday = eventDate.toDateString() === new Date().toDateString();
                            
                            return (
                                <Card key={event.id} glass hover className="vol-events__card">
                                    <div className="vol-events__card-header">
                                        <Badge variant={event.attendance_type === 'Mandatory' ? 'danger' : 'primary'} size="sm">
                                            {event.attendance_type}
                                        </Badge>
                                        {isToday && <span className="vol-events__live-dot">Today</span>}
                                    </div>

                                    <h3 className="vol-events__card-title">{event.title}</h3>
                                    <p className="vol-events__card-desc">{event.description}</p>

                                    <div className="vol-events__card-meta">
                                        <div className="vol-events__meta-item">
                                            <Calendar size={14} />
                                            <span>{new Date(event.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                                        </div>
                                        <div className="vol-events__meta-item">
                                            <Clock size={14} />
                                            <span>{event.time.slice(0, 5)}</span>
                                        </div>
                                        <div className="vol-events__meta-item">
                                            <MapPin size={14} />
                                            <span>{event.location}</span>
                                        </div>
                                    </div>

                                    <div className="vol-events__card-actions">
                                        {adminMode ? (
                                            <>
                                                {isAdmin && (
                                                    <>
                                                        <Button variant="secondary" size="sm" icon={<Edit2 size={14} />} onClick={() => handleOpenEdit(event)}>
                                                            Edit
                                                        </Button>
                                                        <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => handleDelete(event.id)} style={{ color: '#ff3b30' }}>
                                                            Delete
                                                        </Button>
                                                    </>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <Button variant="ghost" size="sm" icon={<Info size={14} />} onClick={() => handleCardClick(event.id)}>
                                                    Details
                                                </Button>

                                                {activeTab === 'upcoming' && (
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        icon={<CheckCircle2 size={14} />}
                                                        onClick={() => triggerCheckIn(event)}
                                                        disabled={checkingIn}
                                                    >
                                                        Check In
                                                    </Button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </>
            )}

            {/* Admin Create/Edit Modal */}
            <AnimatePresence>
                {isFormOpen && (
                    <div className="vol-events__modal-overlay">
                        <motion.div
                            className="vol-events__modal glass-strong"
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                        >
                            <div className="vol-events__modal-header">
                                <h3>{selectedEvent ? 'Edit Volunteer Event' : 'Create Volunteer Event'}</h3>
                                <button className="vol-events__close-btn" onClick={() => setIsFormOpen(false)}>
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleFormSubmit} className="vol-events__form">
                                <div className="vol-events__form-group">
                                    <label>Event Title</label>
                                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Sunday Service Usher Roster" />
                                </div>

                                <div className="vol-events__form-group">
                                    <label>Description</label>
                                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} required placeholder="Describe event instructions..." />
                                </div>

                                <div className="vol-events__form-row">
                                    <div className="vol-events__form-group">
                                        <label>Date</label>
                                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                                    </div>
                                    <div className="vol-events__form-group">
                                        <label>Time</label>
                                        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
                                    </div>
                                </div>

                                <div className="vol-events__form-row">
                                    <div className="vol-events__form-group">
                                        <label>Location</label>
                                        <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} required placeholder="e.g. DOA Main Hall" />
                                    </div>
                                    <div className="vol-events__form-group">
                                        <label>Attendance Type</label>
                                        <select value={attendanceType} onChange={(e) => setAttendanceType(e.target.value)}>
                                            <option value="Remote">Remote</option>
                                            <option value="Physical">Physical</option>
                                            <option value="Mandatory">Mandatory</option>
                                            <option value="Optional">Optional</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="vol-events__form-group">
                                    <label>Grace Period (minutes)</label>
                                    <input type="number" min="0" value={gracePeriod} onChange={(e) => setGracePeriod(Number(e.target.value))} required />
                                </div>

                                <div className="vol-events__form-actions">
                                    <Button variant="secondary" onClick={() => setIsFormOpen(false)} disabled={formLoading}>
                                        Cancel
                                    </Button>
                                    <Button variant="primary" type="submit" loading={formLoading}>
                                        {selectedEvent ? 'Save Changes' : 'Create Event'}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* View Details Modal */}
            <AnimatePresence>
                {detailsEvent && (
                    <div className="vol-events__modal-overlay">
                        <motion.div
                            className="vol-events__modal glass-strong"
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            style={{ maxWidth: '480px' }}
                        >
                            <div className="vol-events__modal-header">
                                <h3>Event details</h3>
                                <button className="vol-events__close-btn" onClick={() => setDetailsEvent(null)}>
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="vol-events__details-content">
                                <h2 style={{ fontSize: '20px', fontWeight: 600, margin: '0 0 12px', color: '#fff' }}>
                                    {detailsEvent.title}
                                </h2>
                                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, margin: '0 0 20px' }}>
                                    {detailsEvent.description}
                                </p>

                                <div className="vol-events__details-grid">
                                    <div className="vol-events__details-item">
                                        <span className="lbl">Date</span>
                                        <span className="val">{new Date(detailsEvent.date).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                                    </div>
                                    <div className="vol-events__details-item">
                                        <span className="lbl">Time</span>
                                        <span className="val">{detailsEvent.time.slice(0, 5)}</span>
                                    </div>
                                    <div className="vol-events__details-item">
                                        <span className="lbl">Location</span>
                                        <span className="val">{detailsEvent.location}</span>
                                    </div>
                                    <div className="vol-events__details-item">
                                        <span className="lbl">Attendance Category</span>
                                        <span className="val">{detailsEvent.attendance_type}</span>
                                    </div>
                                    <div className="vol-events__details-item">
                                        <span className="lbl">Grace Allowed</span>
                                        <span className="val">{detailsEvent.grace_period_in_minutes} minutes</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Identifier-Based Check-in Modal */}
            <AnimatePresence>
                {identifierModalOpen && pendingCheckInEvent && (
                    <div className="vol-events__modal-overlay">
                        <motion.div
                            className="vol-events__modal glass-strong"
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            style={{ maxWidth: '400px' }}
                        >
                            <div className="vol-events__modal-header">
                                <h3>Check-In Verification</h3>
                                <button className="vol-events__close-btn" onClick={() => setIdentifierModalOpen(false)}>
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleIdentifierCheckIn} className="vol-events__form">
                                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', margin: '0 0 16px', lineHeight: 1.5 }}>
                                    Enter your volunteer identifier (email, phone, or registration number) to record attendance for <strong>{pendingCheckInEvent.title}</strong>.
                                </p>

                                <div className="vol-events__form-group">
                                    <label>Volunteer Identifier</label>
                                    <input
                                        type="text"
                                        value={identifierValue}
                                        onChange={(e) => setIdentifierValue(e.target.value)}
                                        required
                                        placeholder="e.g. user@email.com or reg number"
                                    />
                                </div>

                                <div className="vol-events__form-actions" style={{ marginTop: '20px' }}>
                                    <Button variant="secondary" onClick={() => setIdentifierModalOpen(false)} disabled={checkingIn}>
                                        Cancel
                                    </Button>
                                    <Button variant="primary" type="submit" loading={checkingIn}>
                                        Check In
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
