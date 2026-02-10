import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ActivityLogsTable } from '../components/ui/DataTable';
import { activityLogsAPI } from '../services/api';
import type { ActivityLogResponse } from '../types';
import { useAuthStore } from '../stores/authStore';
import './ActivityLogsPage.css';

export function ActivityLogsPage() {
    const { token, user: currentUser } = useAuthStore();
    const [logs, setLogs] = useState<ActivityLogResponse[]>([]);
    const [userLogs, setUserLogs] = useState<ActivityLogResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [filteredByUser, setFilteredByUser] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    // Fetch main logs only when NOT filtered by user
    useEffect(() => {
        if (token && currentUser?.role === 'Admin' && !filteredByUser) {
            fetchLogs();
        }
    }, [token, currentPage, filteredByUser]);

    const fetchLogs = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const response = await activityLogsAPI.getAll(currentPage, pageSize, token);
            setLogs(response.items);
            setTotalPages(response.metadata.num_pages);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to fetch activity logs');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleUserSearch = async (userId: string) => {
        if (!userId || !token) return;

        setLoading(true);
        try {
            const rawUserActivities = await activityLogsAPI.getByUserId(userId, token);
            
            // 1. FIX CRASH: Find user details from the current logs to populate missing fields
            // The API for single user logs often omits user_name/role, causing the UI to break.
            const userInfo = logs.find(l => l.user_id === userId);
            
            const enrichedActivities = rawUserActivities.map((activity: any) => ({
                ...activity,
                user_name: userInfo?.user_name || 'Unknown User',
                first_name: userInfo?.first_name || '',
                last_name: userInfo?.last_name || '',
                user_role: userInfo?.user_role || 'User',
                user_email: userInfo?.user_email || ''
            }));

            setUserLogs(enrichedActivities);
            setFilteredByUser(true);
            setSelectedUserId(userId);
            
            // 2. SETUP CLIENT-SIDE PAGINATION
            // User API returns all logs at once, so we calculate pages locally
            setCurrentPage(1);
            setTotalPages(Math.ceil(enrichedActivities.length / pageSize));
            
            toast.success('User activity logs loaded');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to fetch user logs');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleClearFilter = () => {
        setFilteredByUser(false);
        setSelectedUserId(null);
        setUserLogs([]);
        setSearchQuery('');
        setCurrentPage(1); // Reset to page 1 for main list
        // Effect will trigger fetchLogs automatically since filteredByUser becomes false
    };

    // Determine which logs to show
    let displayLogs = [];
    if (filteredByUser) {
        // Apply Client-Side Pagination for User Logs
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        displayLogs = userLogs.slice(startIndex, endIndex);
    } else {
        // Server-Side Pagination is already handled by fetchLogs
        displayLogs = logs;
    }

    // Apply local search filter (works on the current page view)
    const filteredLogs = displayLogs.filter(log =>
        (log.user_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.activity_type || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <motion.div
            className="activity-logs-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <div className="activity-logs-page__header">
                <h1 className="activity-logs-page__title">Activity Logs</h1>
                <p className="activity-logs-page__subtitle">Monitor system activity and user actions</p>
            </div>

            {filteredByUser && (
                <Card glass className="activity-logs-page__filter-info">
                    <div className="activity-logs-page__filter-content">
                        <span>Showing logs for User ID: <strong>{selectedUserId}</strong></span>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleClearFilter}
                        >
                            Back to All Logs
                        </Button>
                    </div>
                </Card>
            )}

            <Card glass className="activity-logs-page__search-card">
                <div className="activity-logs-page__search">
                    <Search className="activity-logs-page__search-icon" size={20} />
                    <input
                        type="text"
                        placeholder="Search by user name or activity type..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="activity-logs-page__search-input"
                    />
                </div>
            </Card>

            <div className="activity-logs-page__content">
                {loading ? (
                    <div className="activity-logs-page__loading">
                        <p>Loading activity logs...</p>
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="activity-logs-page__empty">
                        <AlertCircle size={48} />
                        <p>{filteredByUser ? 'No activities found for this user' : 'No activity logs found'}</p>
                    </div>
                ) : (
                    <>
                        <ActivityLogsTable
                            logs={filteredLogs}
                            onViewUserLogs={handleUserSearch}
                        />

                        {/* Pagination Controls - Works for both Server & Client side */}
                        {totalPages > 1 && (
                            <div className="activity-logs-page__pagination">
                                <button
                                    className="activity-logs-page__pagination-btn"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <span className="activity-logs-page__pagination-info">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    className="activity-logs-page__pagination-btn"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </motion.div>
    );
}