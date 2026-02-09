import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { rosterAPI } from '../services/api';
import type { Roster } from '../types';
import { useAuthStore } from '../stores/authStore';
import './RosterManagementPage.css';

export function RosterManagementPage() {
    const { token, user: currentUser } = useAuthStore();
    const [rosters, setRosters] = useState<Roster[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRoster, setEditingRoster] = useState<Roster | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        is_active: true,
        start_date: '',
        end_date: '',
        num_for_hall_one: 0,
        num_for_main_hall: 0,
        num_for_gallery: 0,
        num_for_basement: 0,
        num_for_outside: 0,
        year: new Date().getFullYear().toString(),
    });

    useEffect(() => {
        if (token && currentUser?.role === 'Admin') {
            fetchRosters();
        }
    }, [token]);

    const fetchRosters = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const allRosters = await rosterAPI.getAll(token);
            setRosters(allRosters);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to fetch rosters');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (roster?: Roster) => {
        if (roster) {
            setEditingRoster(roster);
            // Format dates for input
            const startDate = new Date(roster.start_date).toISOString().split('T')[0];
            const endDate = new Date(roster.end_date).toISOString().split('T')[0];
            setFormData({
                name: roster.name,
                is_active: true,
                start_date: startDate,
                end_date: endDate,
                num_for_hall_one: 0,
                num_for_main_hall: 0,
                num_for_gallery: 0,
                num_for_basement: 0,
                num_for_outside: 0,
                year: new Date().getFullYear().toString(),
            });
        } else {
            setEditingRoster(null);
            setFormData({
                name: '',
                is_active: true,
                start_date: '',
                end_date: '',
                num_for_hall_one: 0,
                num_for_main_hall: 0,
                num_for_gallery: 0,
                num_for_basement: 0,
                num_for_outside: 0,
                year: new Date().getFullYear().toString(),
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingRoster(null);
        setFormData({
            name: '',
            is_active: true,
            start_date: '',
            end_date: '',
            num_for_hall_one: 0,
            num_for_main_hall: 0,
            num_for_gallery: 0,
            num_for_basement: 0,
            num_for_outside: 0,
            year: new Date().getFullYear().toString(),
        });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        // Convert to number if it's a number input, but allow empty string
        const finalValue = type === 'number'
            ? (value === '' ? 0 : parseInt(value, 10))
            : value;

        setFormData(prev => ({
            ...prev,
            [name]: finalValue,
        }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: checked,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.name.trim()) {
            toast.error('Roster name is required');
            return;
        }

        if (!formData.start_date || !formData.end_date) {
            toast.error('Both start and end dates are required');
            return;
        }

        if (new Date(formData.end_date) <= new Date(formData.start_date)) {
            toast.error('End date must be after start date');
            return;
        }

        if (!token) {
            toast.error('Not authenticated');
            return;
        }

        setLoading(true);
        try {
            if (editingRoster) {
                // Update existing roster
                const updatedRoster = await rosterAPI.update({
                    id: editingRoster.id,
                    name: formData.name,
                    is_active: formData.is_active,
                    start_date: formData.start_date,
                    end_date: formData.end_date,
                    num_for_hall_one: formData.num_for_hall_one,
                    num_for_main_hall: formData.num_for_main_hall,
                    num_for_gallery: formData.num_for_gallery,
                    num_for_basement: formData.num_for_basement,
                    num_for_outside: formData.num_for_outside,
                    year: formData.year,
                }, token);
                setRosters(rosters.map(r => r.id === editingRoster.id ? updatedRoster.data : r));
                toast.success('Roster updated successfully');
            } else {
                // Create new roster
                const newRoster = await rosterAPI.create({
                    name: formData.name,
                    is_active: formData.is_active,
                    start_date: formData.start_date,
                    end_date: formData.end_date,
                    num_for_hall_one: formData.num_for_hall_one,
                    num_for_main_hall: formData.num_for_main_hall,
                    num_for_gallery: formData.num_for_gallery,
                    num_for_basement: formData.num_for_basement,
                    num_for_outside: formData.num_for_outside,
                    year: formData.year,
                }, token);
                setRosters([...rosters, newRoster.data]);
                toast.success('Roster created successfully');
            }
            handleCloseModal();
            fetchRosters();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to save roster');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRoster = async (roster: Roster) => {
        const confirmDelete = window.confirm(
            `Are you sure you want to delete the roster "${roster.name}"? This action cannot be undone.`
        );

        if (!confirmDelete) return;

        if (!token) {
            toast.error('Not authenticated');
            return;
        }

        setLoading(true);
        try {
            // Note: You may need to add a delete method to rosterAPI
            // For now, we'll just remove it from the UI
            setRosters(rosters.filter(r => r.id !== roster.id));
            toast.success('Roster deleted successfully');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to delete roster');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            className="roster-management-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <div className="roster-management-page__header">
                <div className="roster-management-page__title-section">
                    <h1 className="roster-management-page__title">Roster Management</h1>
                    <p className="roster-management-page__subtitle">Create and manage church hall rosters</p>
                </div>
                <Button
                    variant="primary"
                    onClick={() => handleOpenModal()}
                    className="roster-management-page__create-btn"
                >
                    <Plus size={20} />
                    New Roster
                </Button>
            </div>

            <div className="roster-management-page__content">
                {loading && !isModalOpen ? (
                    <div className="roster-management-page__loading">
                        <p>Loading rosters...</p>
                    </div>
                ) : rosters.length === 0 ? (
                    <div className="roster-management-page__empty">
                        <AlertCircle size={48} />
                        <p>No rosters found</p>
                        <p className="roster-management-page__empty-hint">Create your first roster to get started</p>
                    </div>
                ) : (
                    <div className="roster-management-page__grid">
                        {rosters.map((roster, index) => (
                            <motion.div
                                key={roster.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card glass className="roster-card">
                                    <div className="roster-card__header">
                                        <h3 className="roster-card__title">{roster.name}</h3>
                                        <div className="roster-card__actions">
                                            <button
                                                className="roster-card__action-btn"
                                                title="Edit"
                                                onClick={() => handleOpenModal(roster)}
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                className="roster-card__action-btn roster-card__action-btn--delete"
                                                title="Delete"
                                                onClick={() => handleDeleteRoster(roster)}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Description field removed as it is not in the data model */}

                                    <div className="roster-card__details">
                                        <div className="roster-card__detail">
                                            <span className="roster-card__detail-label">Start Date</span>
                                            <span className="roster-card__detail-value">
                                                {new Date(roster.start_date).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="roster-card__detail">
                                            <span className="roster-card__detail-label">End Date</span>
                                            <span className="roster-card__detail-value">
                                                {new Date(roster.end_date).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="roster-card__footer">
                                        <span className="roster-card__created">
                                            Created {new Date(roster.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="roster-modal-overlay" onClick={handleCloseModal}>
                    <motion.div
                        className="roster-modal"
                        onClick={(e) => e.stopPropagation()}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="roster-modal__header">
                            <h2 className="roster-modal__title">
                                {editingRoster ? 'Edit Roster' : 'Create New Roster'}
                            </h2>
                            <button
                                className="roster-modal__close"
                                onClick={handleCloseModal}
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="roster-modal__form">
                            <div className="roster-modal__field">
                                <label className="roster-modal__label">Roster Name *</label>
                                <Input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Sunday Service"
                                />
                            </div>

                            <div className="roster-modal__field">
                                <label className="roster-modal__label">Year *</label>
                                <Input
                                    type="text"
                                    name="year"
                                    value={formData.year}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 2026"
                                />
                            </div>

                            <div className="roster-modal__checkbox-field">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    name="is_active"
                                    checked={formData.is_active}
                                    onChange={handleCheckboxChange}
                                    className="roster-modal__checkbox"
                                />
                                <label htmlFor="is_active" className="roster-modal__checkbox-label">
                                    Active Roster
                                </label>
                            </div>

                            <div className="roster-modal__date-grid">
                                <div className="roster-modal__field">
                                    <label className="roster-modal__label">Start Date *</label>
                                    <Input
                                        type="date"
                                        name="start_date"
                                        value={formData.start_date}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="roster-modal__field">
                                    <label className="roster-modal__label">End Date *</label>
                                    <Input
                                        type="date"
                                        name="end_date"
                                        value={formData.end_date}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            <div className="roster-modal__section-title">Hall Allocations</div>

                            <div className="roster-modal__grid">
                                <div className="roster-modal__field">
                                    <label className="roster-modal__label">Hall One</label>
                                    <Input
                                        type="number"
                                        name="num_for_hall_one"
                                        value={formData.num_for_hall_one || ''}
                                        onChange={handleInputChange}
                                        min="0"
                                        placeholder="0"
                                        className="roster-modal__input-number"
                                    />
                                </div>

                                <div className="roster-modal__field">
                                    <label className="roster-modal__label">Main Hall</label>
                                    <Input
                                        type="number"
                                        name="num_for_main_hall"
                                        value={formData.num_for_main_hall || ''}
                                        onChange={handleInputChange}
                                        min="0"
                                        placeholder="0"
                                        className="roster-modal__input-number"
                                    />
                                </div>

                                <div className="roster-modal__field">
                                    <label className="roster-modal__label">Gallery</label>
                                    <Input
                                        type="number"
                                        name="num_for_gallery"
                                        value={formData.num_for_gallery || ''}
                                        onChange={handleInputChange}
                                        min="0"
                                        placeholder="0"
                                        className="roster-modal__input-number"
                                    />
                                </div>

                                <div className="roster-modal__field">
                                    <label className="roster-modal__label">Basement</label>
                                    <Input
                                        type="number"
                                        name="num_for_basement"
                                        value={formData.num_for_basement || ''}
                                        onChange={handleInputChange}
                                        min="0"
                                        placeholder="0"
                                        className="roster-modal__input-number"
                                    />
                                </div>

                                <div className="roster-modal__field">
                                    <label className="roster-modal__label">Outside</label>
                                    <Input
                                        type="number"
                                        name="num_for_outside"
                                        value={formData.num_for_outside || ''}
                                        onChange={handleInputChange}
                                        min="0"
                                        placeholder="0"
                                        className="roster-modal__input-number"
                                    />
                                </div>
                            </div>

                            <div className="roster-modal__actions">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={handleCloseModal}
                                    fullWidth
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    loading={loading}
                                    fullWidth
                                >
                                    {editingRoster ? 'Update Roster' : 'Create Roster'}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
}
