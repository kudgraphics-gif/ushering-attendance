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
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        if (token && currentUser?.role === 'Admin') {
            fetchLogs();
        }
    }, [token, currentPage]);

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
            const userActivities = await activityLogsAPI.getByUserId(userId, token);
            setUserLogs(userActivities);
            setFilteredByUser(true);
            setSelectedUserId(userId);
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
    };

    const displayLogs = filteredByUser ? userLogs : logs;
    const filteredLogs = displayLogs.filter(log =>
        log.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.activity_type.toLowerCase().includes(searchQuery.toLowerCase())
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
                        <span>Showing logs for user: <strong>{selectedUserId}</strong></span>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleClearFilter}
                        >
                            Clear Filter
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

                        {!filteredByUser && totalPages > 1 && (
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
