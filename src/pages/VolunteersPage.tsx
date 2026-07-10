import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, AlertCircle, Eye, ChevronLeft, ChevronRight, RefreshCw, Edit2, 
  UserCheck, UserX, RotateCcw, Trash2, Award, ShieldAlert, ShieldCheck, 
  MoreVertical, Filter 
} from 'lucide-react';
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
    
    // Filters
    const [isActiveFilter, setIsActiveFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    
    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const limit = 15;

    // Metrics State
    const [metrics, setMetrics] = useState({ total: 0, accepted: 0, rejected: 0, unprocessed: 0 });
    const [metricsLoading, setMetricsLoading] = useState(false);

    // Modals & Popovers
    const [selectedVolunteer, setSelectedVolunteer] = useState<VolunteerDto | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [activeRowActionsId, setActiveRowActionsId] = useState<string | null>(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Fetch dashboard metrics
    const fetchMetrics = useCallback(async () => {
        if (!token) return;
        setMetricsLoading(true);
        try {
            const res = await volunteersAPI.getAdminDashboard(token);
            if (res) {
                setMetrics({
                    total: res.num_of_volunteers ?? 0,
                    accepted: res.num_of_volunteers_accepted ?? 0,
                    rejected: res.num_of_volunteers_rejected ?? 0,
                    unprocessed: res.num_of_volunteer_unprocessed ?? 0
                });
            }
        } catch (error) {
            console.error('Failed to load metrics:', error);
        } finally {
            setMetricsLoading(false);
        }
    }, [token]);

    // Fetch paginated volunteers list
    const fetchVolunteers = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const is_active = isActiveFilter === 'active' ? true : isActiveFilter === 'inactive' ? false : undefined;
            const res = await volunteersAPI.getAll(token, page, limit, debouncedSearch || undefined, is_active);
            
            // Apply client-side status filter if statusFilter is active
            let items = res.items || [];
            if (statusFilter !== 'all') {
                items = items.filter(v => v.status?.toLowerCase() === statusFilter.toLowerCase());
            }

            setVolunteers(items);
            setTotalPages(res.metadata?.num_pages || 1);
            setTotalItems(res.metadata?.total_items || items.length);
        } catch (error) {
            toast.error('Failed to load volunteers');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [token, page, limit, debouncedSearch, isActiveFilter, statusFilter]);

    useEffect(() => {
        fetchVolunteers();
    }, [fetchVolunteers]);

    useEffect(() => {
        fetchMetrics();
    }, [fetchMetrics]);

    const handleRefreshAll = () => {
        fetchVolunteers();
        fetchMetrics();
    };

    // Actions
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
        fetchMetrics();
        toast.success('Volunteer updated successfully');
    };

    const handleToggleActive = async (volunteer: VolunteerDto) => {
        if (!token) return;
        const newActiveState = !volunteer.is_active;
        const actionText = newActiveState ? 'activate' : 'deactivate';
        if (!window.confirm(`Are you sure you want to ${actionText} this volunteer?`)) return;

        try {
            if (newActiveState) {
                await volunteersAPI.activate(volunteer.id, token);
                toast.success('Volunteer activated successfully');
            } else {
                await volunteersAPI.deactivate(volunteer.id, token);
                toast.success('Volunteer deactivated successfully');
            }
            setVolunteers(prev => prev.map(v => v.id === volunteer.id ? { ...v, is_active: newActiveState } : v));
            fetchMetrics();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : `Failed to ${actionText} volunteer`);
        }
    };

    const handleChangeState = async (id: string, status: 'Accepted' | 'Rejected' | 'Unprocessed') => {
        if (!token) return;
        try {
            await volunteersAPI.changeState(id, status, token);
            toast.success(`Volunteer status updated to ${status}`);
            setVolunteers(prev => prev.map(v => v.id === id ? { ...v, status } : v));
            fetchMetrics();
            setActiveRowActionsId(null);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update status');
        }
    };

    const handleResetDevice = async (id: string) => {
        if (!token) return;
        if (!window.confirm('Reset the bound device ID for this volunteer?')) return;
        try {
            await volunteersAPI.resetDevice(id, token);
            toast.success('Device ID reset successfully');
            setVolunteers(prev => prev.map(v => v.id === id ? { ...v, device_id: undefined } : v));
            setActiveRowActionsId(null);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to reset device');
        }
    };

    const handleDelete = async (volunteer: VolunteerDto) => {
        if (!token) return;
        if (!window.confirm(`⚠️ DANGER: Are you sure you want to delete volunteer "${volunteer.first_name} ${volunteer.last_name}"? This action is permanent.`)) return;

        try {
            await volunteersAPI.delete(volunteer.id, token);
            toast.success('Volunteer record deleted successfully');
            setVolunteers(prev => prev.filter(v => v.id !== volunteer.id));
            fetchMetrics();
            setActiveRowActionsId(null);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to delete volunteer');
        }
    };

    const getStatusBadgeVariant = (status?: string) => {
        switch (status?.toLowerCase()) {
            case 'accepted': return 'success';
            case 'rejected': return 'danger';
            case 'unprocessed': return 'warning';
            default: return 'info';
        }
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
                    <h1 className="volunteers-page__title">Volunteer Directory</h1>
                    <p className="volunteers-page__subtitle">
                        {totalItems} volunteer{totalItems !== 1 ? 's' : ''} registered | Administrative dashboard for volunteer applications & roster statuses
                    </p>
                </div>
                <div className="volunteers-page__actions">
                    <Button
                        variant="secondary"
                        icon={<RefreshCw size={18} />}
                        onClick={handleRefreshAll}
                        loading={loading || metricsLoading}
                    >
                        Refresh Directory
                    </Button>
                </div>
            </div>

            {/* Metrics Panel */}
            <div className="volunteers-metrics">
                <Card glass className="volunteers-metric-card volunteers-metric-card--total">
                    <div className="volunteers-metric-card__content">
                        <span className="volunteers-metric-card__label">Total Volunteers</span>
                        <h3 className="volunteers-metric-card__value">{metricsLoading ? '...' : metrics.total}</h3>
                    </div>
                    <div className="volunteers-metric-card__icon bg-gold-glass"><Award size={24} /></div>
                </Card>

                <Card glass className="volunteers-metric-card volunteers-metric-card--accepted">
                    <div className="volunteers-metric-card__content">
                        <span className="volunteers-metric-card__label">Accepted</span>
                        <h3 className="volunteers-metric-card__value text-success">{metricsLoading ? '...' : metrics.accepted}</h3>
                    </div>
                    <div className="volunteers-metric-card__icon bg-green-glass"><UserCheck size={24} /></div>
                </Card>

                <Card glass className="volunteers-metric-card volunteers-metric-card--unprocessed">
                    <div className="volunteers-metric-card__content">
                        <span className="volunteers-metric-card__label">Unprocessed</span>
                        <h3 className="volunteers-metric-card__value text-warning">{metricsLoading ? '...' : metrics.unprocessed}</h3>
                    </div>
                    <div className="volunteers-metric-card__icon bg-orange-glass"><RotateCcw size={24} /></div>
                </Card>

                <Card glass className="volunteers-metric-card volunteers-metric-card--rejected">
                    <div className="volunteers-metric-card__content">
                        <span className="volunteers-metric-card__label">Rejected</span>
                        <h3 className="volunteers-metric-card__value text-danger">{metricsLoading ? '...' : metrics.rejected}</h3>
                    </div>
                    <div className="volunteers-metric-card__icon bg-red-glass"><UserX size={24} /></div>
                </Card>
            </div>

            {/* Filter & Search Bar */}
            <Card glass className="volunteers-filter-card">
                <div className="volunteers-filter-bar">
                    <div className="volunteers-search-box">
                        <Search size={18} className="volunteers-search-icon" />
                        <input
                            type="text"
                            placeholder="Search volunteers by name, email..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="volunteers-search-input"
                            id="volunteers-search"
                        />
                    </div>
                    
                    <div className="volunteers-filters">
                        <div className="volunteers-filter-group">
                            <Filter size={14} className="volunteers-filter-icon" />
                            <select
                                value={isActiveFilter}
                                onChange={e => { setIsActiveFilter(e.target.value); setPage(1); }}
                                className="volunteers-select-filter"
                            >
                                <option value="all">All Activities</option>
                                <option value="active">Active Only</option>
                                <option value="inactive">Inactive Only</option>
                            </select>
                        </div>

                        <div className="volunteers-filter-group">
                            <Filter size={14} className="volunteers-filter-icon" />
                            <select
                                value={statusFilter}
                                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                                className="volunteers-select-filter"
                            >
                                <option value="all">All States</option>
                                <option value="accepted">Accepted</option>
                                <option value="unprocessed">Unprocessed</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Directory Table View (Desktop) / Cards Grid (Mobile) */}
            {loading ? (
                <div className="volunteers-page__loading">
                    <div className="volunteers-page__spinner" />
                    <p>Fetching volunteer database...</p>
                </div>
            ) : volunteers.length === 0 ? (
                <div className="volunteers-page__empty">
                    <AlertCircle size={48} className="text-secondary" />
                    <p>No volunteers found matching current criteria</p>
                </div>
            ) : (
                <>
                    {/* Desktop View Table */}
                    <div className="volunteers-table-container glass-strong">
                        <table className="volunteers-table">
                            <thead>
                                <tr>
                                    <th>Volunteer</th>
                                    <th>Status</th>
                                    <th>Activity</th>
                                    <th>Roster Hall</th>
                                    <th>Phone / Church</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {volunteers.map((vol) => (
                                    <tr key={vol.id} className="volunteers-table__row">
                                        <td>
                                            <div className="volunteers-table__user-cell" onClick={() => handleViewDetails(vol)}>
                                                <Avatar src={vol.avatar_url} alt={vol.first_name} size="sm" />
                                                <div className="volunteers-table__user-info">
                                                    <span className="volunteers-table__user-name">{vol.first_name} {vol.last_name}</span>
                                                    <span className="volunteers-table__user-email">{vol.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <Badge variant={getStatusBadgeVariant(vol.status)} size="sm">
                                                {vol.status || 'Unprocessed'}
                                            </Badge>
                                        </td>
                                        <td>
                                            <span className={`volunteers-table__status-dot ${vol.is_active ? 'active' : 'inactive'}`} />
                                            <span className="volunteers-table__status-text">
                                                {vol.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            {vol.current_roster_hall ? (
                                                <span className="volunteers-table__hall-tag">
                                                    {vol.current_roster_hall.replace(/^"|"$/g, '')}
                                                </span>
                                            ) : (
                                                <span className="volunteers-table__hall-empty">Not Assigned</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="volunteers-table__subtext">
                                                <div>{vol.phone || 'N/A'}</div>
                                                <div className="volunteers-table__church">{vol.local_church || 'No Church'}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="volunteers-table__actions">
                                                <button className="volunteers-action-icon" title="View details" onClick={() => handleViewDetails(vol)}>
                                                    <Eye size={16} />
                                                </button>
                                                <button className="volunteers-action-icon" title="Edit Profile" onClick={() => handleEdit(vol)}>
                                                    <Edit2 size={16} />
                                                </button>
                                                <button 
                                                    className={`volunteers-action-icon ${vol.is_active ? 'text-danger' : 'text-success'}`} 
                                                    title={vol.is_active ? 'Deactivate' : 'Activate'}
                                                    onClick={() => handleToggleActive(vol)}
                                                >
                                                    {vol.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                                                </button>
                                                
                                                {/* More administrative operations popover trigger */}
                                                <div className="volunteers-more-actions-wrapper">
                                                    <button 
                                                        className="volunteers-action-icon" 
                                                        title="More options"
                                                        onClick={() => setActiveRowActionsId(activeRowActionsId === vol.id ? null : vol.id)}
                                                    >
                                                        <MoreVertical size={16} />
                                                    </button>
                                                    
                                                    {activeRowActionsId === vol.id && (
                                                        <>
                                                            <div className="volunteers-popover-overlay" onClick={() => setActiveRowActionsId(null)} />
                                                            <div className="volunteers-actions-popover glass-strong">
                                                                <button onClick={() => handleChangeState(vol.id, 'Accepted')}>
                                                                    <ShieldCheck size={14} className="text-success" />
                                                                    Accept Application
                                                                </button>
                                                                <button onClick={() => handleChangeState(vol.id, 'Rejected')}>
                                                                    <ShieldAlert size={14} className="text-danger" />
                                                                    Reject Application
                                                                </button>
                                                                <button onClick={() => handleChangeState(vol.id, 'Unprocessed')}>
                                                                    <RotateCcw size={14} className="text-warning" />
                                                                    Reset status
                                                                </button>
                                                                <button onClick={() => handleResetDevice(vol.id)}>
                                                                    <RotateCcw size={14} />
                                                                    Reset Device Session
                                                                </button>
                                                                <hr />
                                                                <button className="btn-delete-popover" onClick={() => handleDelete(vol)}>
                                                                    <Trash2 size={14} />
                                                                    Delete Volunteer
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Responsive Cards Grid (Mobile view alternative) */}
                    <div className="volunteers-cards-grid">
                        {volunteers.map((vol) => (
                            <Card glass key={vol.id} className="volunteer-responsive-card">
                                <div className="volunteers-responsive-card__header">
                                    <div className="volunteers-responsive-card__profile" onClick={() => handleViewDetails(vol)}>
                                        <Avatar src={vol.avatar_url} alt={vol.first_name} size="md" />
                                        <div>
                                            <h4 className="volunteers-responsive-card__name">{vol.first_name} {vol.last_name}</h4>
                                            <p className="volunteers-responsive-card__email">{vol.email}</p>
                                        </div>
                                    </div>
                                    <Badge variant={getStatusBadgeVariant(vol.status)} size="sm">
                                        {vol.status || 'Unprocessed'}
                                    </Badge>
                                </div>
                                <div className="volunteers-responsive-card__details">
                                    <div className="volunteers-responsive-card__detail-row">
                                        <span>Status:</span>
                                        <span className={`volunteers-responsive-card__status ${vol.is_active ? 'active' : 'inactive'}`}>
                                            {vol.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <div className="volunteers-responsive-card__detail-row">
                                        <span>Roster Hall:</span>
                                        <span>{vol.current_roster_hall ? vol.current_roster_hall.replace(/^"|"$/g, '') : 'Not Assigned'}</span>
                                    </div>
                                    <div className="volunteers-responsive-card__detail-row">
                                        <span>Phone:</span>
                                        <span>{vol.phone || 'N/A'}</span>
                                    </div>
                                    <div className="volunteers-responsive-card__detail-row">
                                        <span>Church:</span>
                                        <span>{vol.local_church || '—'}</span>
                                    </div>
                                </div>
                                <div className="volunteers-responsive-card__actions">
                                    <Button variant="ghost" size="sm" onClick={() => handleViewDetails(vol)}>Details</Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(vol)}>Edit</Button>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => handleToggleActive(vol)}
                                        className={vol.is_active ? 'text-danger' : 'text-success'}
                                    >
                                        {vol.is_active ? 'Deactivate' : 'Activate'}
                                    </Button>
                                    
                                    <div style={{ position: 'relative', width: '100%' }}>
                                        <Button 
                                            variant="ghost" 
                                            size="sm"
                                            onClick={() => setActiveRowActionsId(activeRowActionsId === vol.id ? null : vol.id)}
                                            style={{ width: '100%' }}
                                        >
                                            Admin
                                        </Button>
                                        {activeRowActionsId === vol.id && (
                                            <>
                                                <div className="volunteers-popover-overlay" onClick={() => setActiveRowActionsId(null)} />
                                                <div className="volunteers-actions-popover volunteers-actions-popover--mobile glass-strong">
                                                    <button onClick={() => handleChangeState(vol.id, 'Accepted')}>Accept</button>
                                                    <button onClick={() => handleChangeState(vol.id, 'Rejected')}>Reject</button>
                                                    <button onClick={() => handleChangeState(vol.id, 'Unprocessed')}>Reset Status</button>
                                                    <button onClick={() => handleResetDevice(vol.id)}>Reset Device</button>
                                                    <button className="text-danger" onClick={() => handleDelete(vol)}>Delete</button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </>
            )}

            {/* Pagination Controls */}
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
                onClose={() => {
                    setDetailsOpen(false);
                    setSelectedVolunteer(null);
                }}
                volunteer={selectedVolunteer}
            />
            
            <VolunteerEditModal
                isOpen={editOpen}
                onClose={() => {
                    setEditOpen(false);
                    setSelectedVolunteer(null);
                }}
                volunteer={selectedVolunteer}
                onSuccess={handleEditSuccess}
            />
        </motion.div>
    );
}
