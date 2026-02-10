import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    Calendar, 
    Clock, 
    MapPin, 
    Plus, 
    Edit2, 
    Trash2, 
    AlertCircle, 
    CheckCircle2, 
    Hourglass, 
    BarChart2 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EventFormModal } from '../components/ui/EventFormModal';
import { EventStatsModal } from '../components/ui/EventStatsModal';
import { eventsAPI } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import type { Event, CreateEventRequest, UpdateEventRequest } from '../types';
import { format, isSameDay } from 'date-fns';
import './EventsPage.css';

export function EventsPage() {
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'all'>('upcoming');
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Form Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<Event | undefined>();
    const [formLoading, setFormLoading] = useState(false);
    
    // Stats Modal State
    const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
    const [statsEventId, setStatsEventId] = useState<string | null>(null);
    const [statsEventTitle, setStatsEventTitle] = useState('');

    // Check-in State
    const [checkInLoading, setCheckInLoading] = useState<string | null>(null);
    
    const { token, user } = useAuthStore();
    const isAdmin = user?.role === 'Admin';

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        if (!token) {
            toast.error('Not authenticated');
            return;
        }

        setLoading(true);
        try {
            // Non-admins can only see upcoming events
            const data = isAdmin ? await eventsAPI.getAll(token) : await eventsAPI.getUpcoming(token);
            setEvents(data);
        } catch (error) {
            if (error instanceof Error && error.message.includes('403')) {
                // Handle 403 Forbidden - user doesn't have permission
                setEvents([]);
                if (isAdmin) {
                    toast.error('You do not have permission to view all events');
                }
            } else {
                toast.error('Failed to load events');
            }
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const now = new Date();
    const filteredEvents = events.filter(event => {
        const eventDate = new Date(event.date);
        // Normalize times for comparison
        eventDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (activeTab === 'upcoming') return eventDate >= today;
        if (activeTab === 'past') return eventDate < today;
        return true;
    });

    const handleCreateClick = () => {
        setSelectedEvent(undefined);
        setIsModalOpen(true);
    };

    const handleEditClick = (event: Event) => {
        setSelectedEvent(event);
        setIsModalOpen(true);
    };

    const handleDeleteClick = async (event: Event) => {
        if (!token || !window.confirm('Are you sure you want to delete this event?')) return;

        try {
            await eventsAPI.delete(event.id, token);
            toast.success('Event deleted successfully');
            setEvents(events.filter(e => e.id !== event.id));
        } catch (error) {
            toast.error('Failed to delete event');
        }
    };

    const handleStatsClick = (event: Event) => {
        setStatsEventId(event.id);
        setStatsEventTitle(event.title);
        setIsStatsModalOpen(true);
    };

    const handleCheckIn = async (event: Event) => {
        if (!token || !user) return;
        
        setCheckInLoading(event.id);

        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            setCheckInLoading(null);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const payload = {
                        event_id: event.id,
                        user_id: user.id,
                        attendance_type: 'Onsite',
                        location: {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        }
                    };

                    await eventsAPI.checkIn(payload, token);
                    toast.success(`Checked in to ${event.title} successfully!`);
                } catch (error) {
                    console.error(error);
                    toast.error(error instanceof Error ? error.message : "Failed to check in");
                } finally {
                    setCheckInLoading(null);
                }
            },
            (error) => {
                console.error(error);
                toast.error("Unable to retrieve location. Location access is required for check-in.");
                setCheckInLoading(null);
            }
        );
    };

    const handleFormSubmit = async (data: CreateEventRequest | UpdateEventRequest) => {
        if (!token) {
            toast.error('Not authenticated');
            return;
        }

        setFormLoading(true);
        try {
            if ('event_id' in data) {
                // Update
                const updated = await eventsAPI.update(data, token);
                setEvents(events.map(e => e.id === updated.id ? updated : e));
                toast.success('Event updated successfully');
            } else {
                // Create
                const created = await eventsAPI.create(data, token);
                setEvents([...events, created]);
                toast.success('Event created successfully');
            }
            setIsModalOpen(false); // Close modal on success
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Operation failed');
        } finally {
            setFormLoading(false);
        }
    };

    return (
        <motion.div
            className="events-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <div className="events-page__header">
                <div>
                    <h1 className="events-page__title">Events</h1>
                    <p className="events-page__subtitle">{isAdmin ? 'Manage and view all events' : 'View upcoming events'}</p>
                </div>
                {isAdmin && (
                    <Button
                        icon={<Plus size={20} />}
                        variant="primary"
                        onClick={handleCreateClick}
                    >
                        Create Event
                    </Button>
                )}
            </div>

            <div className="events-page__tabs">
                <button
                    className={`events-page__tab ${activeTab === 'upcoming' ? 'events-page__tab--active' : ''}`}
                    onClick={() => setActiveTab('upcoming')}
                >
                    Upcoming
                </button>
                <button
                    className={`events-page__tab ${activeTab === 'past' ? 'events-page__tab--active' : ''}`}
                    onClick={() => setActiveTab('past')}
                >
                    Past
                </button>
                <button
                    className={`events-page__tab ${activeTab === 'all' ? 'events-page__tab--active' : ''}`}
                    onClick={() => setActiveTab('all')}
                >
                    All Events
                </button>
            </div>

            {loading ? (
                <div className="events-page__loading">
                    <p>Loading events...</p>
                </div>
            ) : filteredEvents.length === 0 ? (
                <div className="events-page__empty">
                    <AlertCircle size={48} />
                    <p>No events to display</p>
                </div>
            ) : (
                <div className="events-page__grid">
                    {filteredEvents.map((event, index) => (
                        <EventCard
                            key={event.id}
                            event={event}
                            index={index}
                            onEdit={handleEditClick}
                            onDelete={handleDeleteClick}
                            onCheckIn={handleCheckIn}
                            onViewStats={handleStatsClick}
                            checkInLoading={checkInLoading === event.id}
                            isAdmin={isAdmin}
                        />
                    ))}
                </div>
            )}

            <EventFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleFormSubmit}
                event={selectedEvent}
                loading={formLoading}
            />

            <EventStatsModal 
                isOpen={isStatsModalOpen}
                onClose={() => setIsStatsModalOpen(false)}
                eventId={statsEventId}
                eventTitle={statsEventTitle}
            />
        </motion.div>
    );
}

function EventCard({
    event,
    index,
    onEdit,
    onDelete,
    onCheckIn,
    onViewStats,
    checkInLoading,
    isAdmin = false,
}: {
    event: Event;
    index: number;
    onEdit: (event: Event) => void;
    onDelete: (event: Event) => void;
    onCheckIn: (event: Event) => void;
    onViewStats: (event: Event) => void;
    checkInLoading: boolean;
    isAdmin?: boolean;
}) {
    // --- Time & Logic ---
    const now = new Date();
    
    // Parse Event Date (e.g. "2026-02-14")
    const eventDate = new Date(event.date); 
    const isToday = isSameDay(eventDate, now);

    // Parse Event Time (e.g. "08:00:00")
    // Note: 'date-fns' or manual parsing ensures local time consistency
    const [hours, minutes] = event.time.split(':').map(Number);
    const eventDateTime = new Date(eventDate);
    eventDateTime.setHours(hours, minutes, 0, 0);

    // Allow check-in 1 hour before event start
    const checkInOpenTime = new Date(eventDateTime.getTime() - 60 * 60 * 1000); // 1 hour buffer

    // Button Logic:
    // 1. Must be the correct day
    // 2. Current time must be past the (start time - 1 hour)
    const canCheckIn = isToday && now >= checkInOpenTime;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
        >
            <Card glass hover className="event-card">
                <div className="event-card__header">
                    <div className="event-card__icon">
                        <Calendar size={24} />
                    </div>
                    <Badge variant={event.attendance_type === 'Mandatory' ? 'danger' : 'primary'} size="sm">
                        {event.attendance_type}
                    </Badge>
                </div>

                <h3 className="event-card__title">{event.title}</h3>
                <p className="event-card__description">{event.description}</p>

                <div className="event-card__details">
                    <div className="event-card__detail">
                        <Calendar size={16} />
                        <span>{format(new Date(event.date), 'MMM dd, yyyy')}</span>
                    </div>
                    <div className="event-card__detail">
                        <Clock size={16} />
                        <span>{event.time.slice(0, 5)}</span>
                    </div>
                    <div className="event-card__detail">
                        <MapPin size={16} />
                        <span>{event.location}</span>
                    </div>
                    {event.grace_period_in_minutes > 0 && (
                        <div className="event-card__detail" title="Grace Period">
                            <Hourglass size={16} />
                            <span>{event.grace_period_in_minutes} mins grace</span>
                        </div>
                    )}
                </div>

                <div className="event-card__actions" style={{ marginTop: 'var(--space-md)' }}>
                    {/* Check In Button Logic */}
                    {canCheckIn ? (
                        <Button
                            variant="primary"
                            size="sm"
                            icon={<CheckCircle2 size={16} />}
                            onClick={() => onCheckIn(event)}
                            loading={checkInLoading}
                            className="w-full"
                            style={{ flex: 1 }}
                        >
                            Check In
                        </Button>
                    ) : isToday ? (
                        // Show disabled state if it's today but too early
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled
                            className="w-full"
                            style={{ flex: 1, opacity: 0.6, cursor: 'not-allowed' }}
                        >
                            Opens at {format(checkInOpenTime, 'h:mm a')}
                        </Button>
                    ) : null}

                    {/* Admin Actions */}
                    {isAdmin && (
                        <>
                            <Button
                                variant="secondary"
                                size="sm"
                                icon={<BarChart2 size={16} />}
                                onClick={() => onViewStats(event)}
                                title="View Stats"
                            >
                                Stats
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                icon={<Edit2 size={16} />}
                                onClick={() => onEdit(event)}
                            >
                                Edit
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                icon={<Trash2 size={16} />}
                                onClick={() => onDelete(event)}
                            >
                                Delete
                            </Button>
                        </>
                    )}
                </div>
            </Card>
        </motion.div>
    );
}