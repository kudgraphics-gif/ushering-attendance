import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, AlertCircle, Eye, ChevronLeft, ChevronRight, RefreshCw, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { volunteersAPI } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import type { VolunteerDto } from '../types';
import './VolunteersPage.css';
import VolunteerDetailsModal from '../components/ui/VolunteerDetailsModal';
import VolunteerEditModal from '../components/ui/VolunteerEditModal';

export function VolunteersPage() {
    const { token } = useAuthStore();
    const [volunteers, setVolunteers] = useState<VolunteerDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const limit = 20;

    const [selectedVolunteer, setSelectedVolunteer] = useState<VolunteerDto | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchVolunteers = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await volunteersAPI.getAll(token, page, limit, debouncedSearch || undefined);
            setVolunteers(res.items);
            setTotalPages(res.metadata.num_pages);
            setTotalItems(res.metadata.total_items);
        } catch (error) {
            toast.error('Failed to load volunteers');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [token, page, limit, debouncedSearch]);

    useEffect(() => {
        fetchVolunteers();
    }, [fetchVolunteers]);

    const handleViewDetails = async (volunteer: VolunteerDto) => {
        if (!token) return;
        try {
            const detail = await volunteersAPI.getById(volunteer.id, token);
            setSelectedVolunteer(detail);
            setDetailsOpen(true);
        } catch {
            toast.error('Failed to load volunteer details');
        }
    };

    const handleEdit = (volunteer: VolunteerDto) => {
        setSelectedVolunteer(volunteer);
        setEditOpen(true);
    };

    const handleEditSuccess = (updated: VolunteerDto) => {
        setVolunteers(prev => prev.map(v => v.id === updated.id ? updated : v));
        setEditOpen(false);
        toast.success('Volunteer updated successfully');
    };

    return (
        <motion.div
            className="volunteers-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <div className="volunteers-page__header">
                <div>
                    <h1 className="volunteers-page__title">Volunteers</h1>
                    <p className="volunteers-page__subtitle">
                        {totalItems} volunteer{totalItems !== 1 ? 's' : ''} registered
                    </p>
                </div>
                <div className="volunteers-page__actions">
                    <Button
                        variant="secondary"
                        icon={<RefreshCw size={18} />}
                        onClick={fetchVolunteers}
                        loading={loading}
                    >
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Search */}
            <Card glass className="volunteers-page__search-card">
                <div className="volunteers-page__search">
                    <Search size={20} className="volunteers-page__search-icon" />
                    <input
                        type="text"
                        placeholder="Search volunteers by name, email..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="volunteers-page__search-input"
                        id="volunteers-search"
                    />
                </div>
            </Card>

            {/* Content */}
            {loading ? (
                <div className="volunteers-page__loading">
                    <div className="volunteers-page__spinner" />
                    <p>Loading volunteers...</p>
                </div>
            ) : volunteers.length === 0 ? (
                <div className="volunteers-page__empty">
                    <AlertCircle size={48} />
                    <p>No volunteers found</p>
                </div>
            ) : (
                <div className="volunteers-page__grid">
                    {volunteers.map((volunteer, index) => (
                        <motion.div
                            key={volunteer.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.04 }}
                        >
                            <Card glass hover className="volunteer-card">
                                <div className="volunteer-card__header">
                                    <Avatar
                                        src={volunteer.avatar_url}
                                        alt={volunteer.first_name}
                                        size="lg"
                                    />
                                    <div className="volunteer-card__badges">
                                        <Badge variant={volunteer.is_active ? 'success' : 'warning'} size="sm">
                                            {volunteer.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                        <span className="volunteer-card__role-badge">KSOM</span>
                                    </div>
                                </div>

                                <div className="volunteer-card__content">
                                    <h3 className="volunteer-card__name">
                                        {volunteer.first_name} {volunteer.last_name}
                                    </h3>
                                    <p className="volunteer-card__email" title={volunteer.email}>
                                        {volunteer.email}
                                    </p>
                                    {volunteer.reg_no && (
                                        <p className="volunteer-card__reg">REG: {volunteer.reg_no}</p>
                                    )}
                                </div>

                                <div className="volunteer-card__details">
                                    {volunteer.phone && (
                                        <div className="volunteer-card__detail">
                                            <span className="volunteer-card__detail-label">Phone:</span>
                                            <span className="volunteer-card__detail-value">{volunteer.phone}</span>
                                        </div>
                                    )}
                                    {volunteer.local_church && (
                                        <div className="volunteer-card__detail">
                                            <span className="volunteer-card__detail-label">Church:</span>
                                            <span className="volunteer-card__detail-value">{volunteer.local_church}</span>
                                        </div>
                                    )}
                                    <div className="volunteer-card__detail">
                                        <span className="volunteer-card__detail-label">Attendance:</span>
                                        <span className="volunteer-card__detail-value">
                                            {volunteer.attendance_count ?? 0}
                                        </span>
                                    </div>
                                    {volunteer.current_roster_hall && (
                                        <div className="volunteer-card__detail">
                                            <span className="volunteer-card__detail-label">Hall:</span>
                                            <span className="volunteer-card__detail-value">
                                                {volunteer.current_roster_hall.replace(/^"|"$/g, '')}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="volunteer-card__actions">
                                    <button
                                        className="volunteer-card__action-btn"
                                        title="View Details"
                                        onClick={() => handleViewDetails(volunteer)}
                                    >
                                        <Eye size={18} />
                                    </button>
                                    <button
                                        className="volunteer-card__action-btn"
                                        title="Edit Volunteer"
                                        onClick={() => handleEdit(volunteer)}
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="volunteers-page__pagination">
                    <button
                        className="volunteers-page__page-btn"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page <= 1}
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <span className="volunteers-page__page-info">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        className="volunteers-page__page-btn"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            )}

            {/* Modals */}
            <VolunteerDetailsModal
                isOpen={detailsOpen}
                onClose={() => setDetailsOpen(false)}
                volunteer={selectedVolunteer}
            />
            <VolunteerEditModal
                isOpen={editOpen}
                onClose={() => setEditOpen(false)}
                volunteer={selectedVolunteer}
                onSuccess={handleEditSuccess}
            />
        </motion.div>
    );
}
