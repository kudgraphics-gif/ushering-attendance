import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, AlertCircle, Play, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
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
    const navigate = useNavigate();
    
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
        const finalValue = type === 'number'
            ? (value === '' ? 0 : parseInt(value, 10))
            : value;
        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) return toast.error('Roster name is required');
        if (!formData.start_date || !formData.end_date) return toast.error('Dates required');
        if (!token) return toast.error('Not authenticated');

        setLoading(true);
        try {
            if (editingRoster) {
                const updatedRoster = await rosterAPI.update({
                    id: editingRoster.id,
                    ...formData,
                    is_active: formData.is_active
                }, token);
                setRosters(rosters.map(r => r.id === editingRoster.id ? updatedRoster.data : r));
                toast.success('Roster updated');
            } else {
                const newRoster = await rosterAPI.create(formData, token);
                setRosters([...rosters, newRoster.data]);
                toast.success('Roster created');
            }
            handleCloseModal();
            fetchRosters();
        } catch (error) {
            toast.error('Failed to save roster');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRoster = async (roster: Roster) => {
        if (!window.confirm(`Delete roster "${roster.name}"?`)) return;
        if (!token) return;

        setLoading(true);
        try {
            // Add the API call here
            await rosterAPI.delete(roster.id, token);
            
            // If successful, remove it from the UI
            setRosters(rosters.filter(r => r.id !== roster.id));
            toast.success('Roster deleted successfully');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to delete roster');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleActivateRoster = async (roster: Roster) => {
        if (!token) return;
        if (roster.is_active) {
            toast.success("Roster is already active");
            return;
        }
        
        try {
            await rosterAPI.activate(roster.id, token);
            toast.success(`Activated ${roster.name}`);
            fetchRosters();
        } catch (error) {
            toast.error("Failed to activate roster");
            console.error(error);
        }
    };

    const handleViewAssignments = (roster: Roster) => {
        navigate(`/roster/${roster.id}`);
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
                {loading && !isModalOpen && rosters.length === 0 ? (
                    <div className="roster-management-page__loading">
                        <p>Loading rosters...</p>
                    </div>
                ) : rosters.length === 0 ? (
                    <div className="roster-management-page__empty">
                        <AlertCircle size={48} />
                        <p>No rosters found</p>
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
                                        <h3 className="roster-card__title" 
                                            style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                            onClick={() => handleViewAssignments(roster)}
                                        >
                                            {roster.name}
                                        </h3>
                                        {/* Actions moved from here */}
                                    </div>

                                    <div className="roster-card__details" onClick={() => handleViewAssignments(roster)} style={{ cursor: 'pointer' }}>
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
                                        <div className="roster-card__detail">
                                            <span className="roster-card__detail-label">Status</span>
                                            <span className="roster-card__detail-value" style={{ 
                                                color: roster.is_active ? 'var(--color-success)' : 'var(--color-text-secondary)' 
                                            }}>
                                                {roster.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="roster-card__footer">
                                        <div className="roster-card__actions">
                                            <button
                                                className={`roster-card__action-btn ${roster.is_active ? 'text-green-500' : ''}`}
                                                title={roster.is_active ? "Active" : "Activate"}
                                                onClick={() => handleActivateRoster(roster)}
                                                disabled={roster.is_active}
                                                style={roster.is_active ? { color: 'var(--color-success)', borderColor: 'var(--color-success)' } : {}}
                                            >
                                                <Play size={18} fill={roster.is_active ? "currentColor" : "none"} />
                                            </button>
                                            
                                            <button
                                                className="roster-card__action-btn"
                                                title="View Assignments"
                                                onClick={() => handleViewAssignments(roster)}
                                            >
                                                <Users size={18} />
                                            </button>

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
                                        <span className="roster-card__created">
                                            {new Date(roster.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
            {/* Modal code remains unchanged */}
            {isModalOpen && (
                 <div className="roster-modal-overlay" onClick={handleCloseModal}>
                 <motion.div className="roster-modal" onClick={(e) => e.stopPropagation()}>
                      <div className="roster-modal__header">
                         <h2 className="roster-modal__title">{editingRoster ? 'Edit Roster' : 'Create New Roster'}</h2>
                         <button className="roster-modal__close" onClick={handleCloseModal}>✕</button>
                     </div>
                     <form onSubmit={handleSubmit} className="roster-modal__form">
                         <div className="roster-modal__field">
                             <label className="roster-modal__label">Roster Name *</label>
                             <Input type="text" name="name" value={formData.name} onChange={handleInputChange} />
                         </div>
                         <div className="roster-modal__field">
                             <label className="roster-modal__label">Year *</label>
                             <Input type="text" name="year" value={formData.year} onChange={handleInputChange} />
                         </div>
                         <div className="roster-modal__checkbox-field">
                             <input type="checkbox" id="is_active" name="is_active" checked={formData.is_active} onChange={handleCheckboxChange} className="roster-modal__checkbox" />
                             <label htmlFor="is_active" className="roster-modal__checkbox-label">Active Roster</label>
                         </div>
                         <div className="roster-modal__date-grid">
                             <div className="roster-modal__field">
                                 <label className="roster-modal__label">Start Date *</label>
                                 <Input type="date" name="start_date" value={formData.start_date} onChange={handleInputChange} />
                             </div>
                             <div className="roster-modal__field">
                                 <label className="roster-modal__label">End Date *</label>
                                 <Input type="date" name="end_date" value={formData.end_date} onChange={handleInputChange} />
                             </div>
                         </div>
                         <div className="roster-modal__section-title">Hall Allocations</div>
                         <div className="roster-modal__grid">
                             <div className="roster-modal__field">
                                 <label className="roster-modal__label">Hall One</label>
                                 <Input type="number" name="num_for_hall_one" value={formData.num_for_hall_one || ''} onChange={handleInputChange} className="roster-modal__input-number" />
                             </div>
                             <div className="roster-modal__field">
                                 <label className="roster-modal__label">Main Hall</label>
                                 <Input type="number" name="num_for_main_hall" value={formData.num_for_main_hall || ''} onChange={handleInputChange} className="roster-modal__input-number" />
                             </div>
                             <div className="roster-modal__field">
                                 <label className="roster-modal__label">Gallery</label>
                                 <Input type="number" name="num_for_gallery" value={formData.num_for_gallery || ''} onChange={handleInputChange} className="roster-modal__input-number" />
                             </div>
                             <div className="roster-modal__field">
                                 <label className="roster-modal__label">Basement</label>
                                 <Input type="number" name="num_for_basement" value={formData.num_for_basement || ''} onChange={handleInputChange} className="roster-modal__input-number" />
                             </div>
                             <div className="roster-modal__field">
                                 <label className="roster-modal__label">Outside</label>
                                 <Input type="number" name="num_for_outside" value={formData.num_for_outside || ''} onChange={handleInputChange} className="roster-modal__input-number" />
                             </div>
                         </div>
                         <div className="roster-modal__actions">
                             <Button type="button" variant="secondary" onClick={handleCloseModal} fullWidth>Cancel</Button>
                             <Button type="submit" variant="primary" loading={loading} fullWidth>{editingRoster ? 'Update Roster' : 'Create Roster'}</Button>
                         </div>
                     </form>
                 </motion.div>
             </div>
            )}
        </motion.div>
    );
}