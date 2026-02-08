import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Modal } from './Modal';
import { Input } from './Input';
import { Button } from './Button';
import type { Event, CreateEventRequest, UpdateEventRequest } from '../../types';
import '../../styles/forms.css';

interface EventFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateEventRequest | UpdateEventRequest) => Promise<void>;
    event?: Event;
    loading?: boolean;
}

export function EventFormModal({
    isOpen,
    onClose,
    onSubmit,
    event,
    loading = false,
}: EventFormModalProps) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        time: '',
        location: 'CHIDA' as 'DOA' | 'CHIDA' | 'OTHER',
        attendance_type: 'Onsite',
        grace_period_in_minutes: 15,
    });

    useEffect(() => {
        if (event) {
            setFormData({
                title: event.title,
                description: event.description,
                date: event.date,
                time: event.time,
                location: event.location,
                attendance_type: event.attendance_type,
                grace_period_in_minutes: event.grace_period_in_minutes,
            });
        } else {
            setFormData({
                title: '',
                description: '',
                date: '',
                time: '',
                location: 'CHIDA',
                attendance_type: 'Onsite',
                grace_period_in_minutes: 15,
            });
        }
    }, [event, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'grace_period_in_minutes' ? parseInt(value) : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (event) {
                const updateData: UpdateEventRequest = {
                    event_id: event.id,
                    ...formData,
                };
                await onSubmit(updateData);
            } else {
                await onSubmit(formData as CreateEventRequest);
            }
            onClose();
        } catch (error) {
            console.error('Form submission error:', error);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <motion.div
                className="form-modal"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
            >
                <div className="form-modal__header">
                    <h2 className="form-modal__title">
                        {event ? 'Edit Event' : 'Create Event'}
                    </h2>
                    <button
                        className="form-modal__close"
                        onClick={onClose}
                        disabled={loading}
                    >
                        <X size={24} />
                    </button>
                </div>

                <form className="form-modal__form" onSubmit={handleSubmit}>
                    <Input
                        type="text"
                        label="Event Title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        disabled={loading}
                    />

                    <div className="form-modal__field">
                        <label className="form-modal__label">Description</label>
                        <textarea
                            name="description"
                            className="form-modal__textarea"
                            value={formData.description}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            rows={3}
                        />
                    </div>

                    <div className="form-modal__row">
                        <Input
                            type="date"
                            label="Date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            required
                            disabled={loading}
                        />
                        <Input
                            type="time"
                            label="Time"
                            name="time"
                            value={formData.time}
                            onChange={handleChange}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-modal__row">
                        <div className="form-modal__field">
                            <label className="form-modal__label">Location</label>
                            <select
                                name="location"
                                className="form-modal__select"
                                value={formData.location}
                                onChange={handleChange}
                                disabled={loading}
                            >
                                <option value="DOA">DOA</option>
                                <option value="CHIDA">CHIDA</option>
                                <option value="OTHER">OTHER</option>
                            </select>
                        </div>
                        <div className="form-modal__field">
                            <label className="form-modal__label">Attendance Type</label>
                            <select
                                name="attendance_type"
                                className="form-modal__select"
                                value={formData.attendance_type}
                                onChange={handleChange}
                                disabled={loading}
                            >
                                <option value="Onsite">Onsite</option>
                                <option value="Remote">Remote</option>
                                <option value="Mandatory">Mandatory</option>
                            </select>
                        </div>
                    </div>

                    <Input
                        type="number"
                        label="Grace Period (minutes)"
                        name="grace_period_in_minutes"
                        value={formData.grace_period_in_minutes.toString()}
                        onChange={handleChange}
                        required
                        disabled={loading}
                    />

                    <div className="form-modal__actions">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            loading={loading}
                        >
                            {event ? 'Update Event' : 'Create Event'}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </Modal>
    );
}
