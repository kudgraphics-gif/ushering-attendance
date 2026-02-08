import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EventFormModal } from '../components/ui/EventFormModal';
import { eventsAPI } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import type { Event, CreateEventRequest, UpdateEventRequest } from '../types';
import { format } from 'date-fns';
import './EventsPage.css';

export function EventsPage() {
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'all'>('upcoming');
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<Event | undefined>();
    const [formLoading, setFormLoading] = useState(false);
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
        if (activeTab === 'upcoming') return eventDate >= now;
        if (activeTab === 'past') return eventDate < now;
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
        </motion.div>
    );
}

function EventCard({
    event,
    index,
    onEdit,
    onDelete,
    isAdmin = false,
}: {
    event: Event;
    index: number;
    onEdit: (event: Event) => void;
    onDelete: (event: Event) => void;
    isAdmin?: boolean;
}) {
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
                </div>

                {isAdmin && (
                    <div className="event-card__actions">
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
                    </div>
                )}
            </Card>
        </motion.div>
    );
}
