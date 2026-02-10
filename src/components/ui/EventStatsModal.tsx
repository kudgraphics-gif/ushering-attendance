import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, CheckCircle2, AlertCircle, Search } from 'lucide-react';
import DataTable from 'react-data-table-component';
import { analyticsAPI } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { Card } from './Card';
import '../../pages/AttendancePage.css'; 
import '../../pages/EventsPage.css';     

interface EventStatsModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventId: string | null;
    eventTitle: string;
}

export function EventStatsModal({ isOpen, onClose, eventId, eventTitle }: EventStatsModalProps) {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'attendees' | 'absentees'>('attendees');
    const [filterText, setFilterText] = useState('');
    const { token } = useAuthStore();

    useEffect(() => {
        if (isOpen && eventId && token) {
            fetchStats();
            setFilterText(''); 
        } else {
            setStats(null);
        }
    }, [isOpen, eventId]);

    const fetchStats = async () => {
        if (!eventId || !token) return;
        setLoading(true);
        try {
            const response = await analyticsAPI.getEventReport(eventId, token);
            setStats(response.data);
            
            if (response.data.attendees.length === 0 && response.data.absentees.length > 0) {
                setActiveTab('absentees');
            } else {
                setActiveTab('attendees');
            }
        } catch (error) {
            console.error("Failed to fetch event stats", error);
        } finally {
            setLoading(false);
        }
    };

    const getData = () => {
        if (!stats) return [];
        const source = activeTab === 'attendees' ? stats.attendees : stats.absentees;
        
        if (!filterText) return source;

        return source.filter((item: any) => 
            (item.first_name && item.first_name.toLowerCase().includes(filterText.toLowerCase())) ||
            (item.last_name && item.last_name.toLowerCase().includes(filterText.toLowerCase())) ||
            (item.reg_no && item.reg_no.toLowerCase().includes(filterText.toLowerCase()))
        );
    };

    const columns = [
        {
            name: 'Name',
            selector: (row: any) => `${row.first_name} ${row.last_name}`,
            sortable: true,
            cell: (row: any) => (
                <div style={{ padding: '8px 0' }}>
                    <div style={{ fontWeight: 600 }}>{row.first_name} {row.last_name}</div>
                    <div style={{ fontSize: '12px', opacity: 0.7 }}>{row.email}</div>
                </div>
            )
        },
        {
            name: 'Reg No',
            selector: (row: any) => row.reg_no,
            sortable: true,
            width: '140px'
        },
        {
            name: 'Phone',
            selector: (row: any) => row.phone || 'N/A',
            width: '130px'
        }
    ];

    const customTableStyles = {
        table: { style: { backgroundColor: 'transparent' } },
        headRow: {
            style: {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--color-text-secondary)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                fontSize: '13px',
                fontWeight: '600',
                textTransform: 'uppercase' as const,
            },
        },
        rows: {
            style: {
                backgroundColor: 'transparent',
                color: 'var(--color-text-primary)',
                minHeight: '60px',
                '&:not(:last-of-type)': { borderBottom: '1px solid rgba(255, 255, 255, 0.05)' },
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.02)' },
            },
        },
        pagination: {
            style: {
                backgroundColor: 'transparent',
                color: 'var(--color-text-secondary)',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                minHeight: '56px', // Ensure footer has height
            },
            pageButtonsStyle: {
                color: 'var(--color-text-primary)',
                fill: 'var(--color-text-primary)',
            },
        },
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="modal-backdrop" onClick={onClose}>
                <motion.div
                    className="form-modal"
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    // INCREASED WIDTH HERE: 1200px
                    style={{ maxWidth: '1200px', margin: 'auto', width: '95%', padding: '20px' }}
                >
                    <Card glass className="w-full stats-modal-card">
                        
                        {/* Header - Fixed */}
                        <div className="form-modal__header" style={{ flexShrink: 0 }}>
                            <div>
                                <h2 className="form-modal__title">Event Report</h2>
                                <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                                    {eventTitle}
                                </p>
                            </div>
                            <button className="form-modal__close" onClick={onClose}>
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content Body */}
                        <div 
                            className="p-6 custom-scrollbar" 
                            style={{ 
                                flex: 1,
                                overflowY: 'auto',
                                minHeight: 0, 
                                display: 'flex', 
                                flexDirection: 'column' 
                            }}
                        >
                            {loading ? (
                                <div className="flex justify-center items-center h-full text-gray-400">Loading report data...</div>
                            ) : stats ? (
                                <>
                                    {/* Summary Stats Cards */}
                                    <div style={{ 
                                        display: 'grid', 
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
                                        gap: '16px', 
                                        marginBottom: '24px',
                                        flexShrink: 0 
                                    }}>
                                        <div className="stat-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}>
                                            <div className="stat-label"><Users size={16} /> Total Eligible</div>
                                            <div className="stat-value">{stats.eligible_attendees_count}</div>
                                        </div>
                                        <div className="stat-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}>
                                            <div className="stat-label"><CheckCircle2 size={16} /> Present</div>
                                            <div className="stat-value" style={{ color: '#10B981' }}>{stats.total_attendees}</div>
                                        </div>
                                        <div className="stat-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}>
                                            <div className="stat-label"><AlertCircle size={16} /> Absent</div>
                                            <div className="stat-value" style={{ color: '#EF4444' }}>
                                                {stats.eligible_attendees_count - stats.total_attendees}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tabs & Search */}
                                    <div style={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center', 
                                        marginBottom: '16px', 
                                        flexWrap: 'wrap', 
                                        gap: '12px',
                                        flexShrink: 0
                                    }}>
                                        <div className="attendance-tabs">
                                            <button
                                                className={`attendance-tab ${activeTab === 'attendees' ? 'attendance-tab--active' : ''}`}
                                                onClick={() => setActiveTab('attendees')}
                                            >
                                                <CheckCircle2 size={16} />
                                                <span>Attendees ({stats.attendees.length})</span>
                                            </button>
                                            <button
                                                className={`attendance-tab ${activeTab === 'absentees' ? 'attendance-tab--active' : ''}`}
                                                onClick={() => setActiveTab('absentees')}
                                            >
                                                <AlertCircle size={16} />
                                                <span>Absentees ({stats.absentees.length})</span>
                                            </button>
                                        </div>

                                        <div style={{ position: 'relative', width: '250px' }}>
                                            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                                            <input 
                                                type="text" 
                                                placeholder="Search name, reg no..." 
                                                value={filterText}
                                                onChange={(e) => setFilterText(e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '8px 12px 8px 34px',
                                                    background: 'rgba(255,255,255,0.05)',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    borderRadius: '8px',
                                                    color: 'white',
                                                    fontSize: '14px',
                                                    outline: 'none'
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Data Table Wrapper */}
                                    <div style={{ 
                                        border: '1px solid rgba(255,255,255,0.1)', 
                                        borderRadius: '8px', 
                                        overflow: 'hidden',
                                        flex: 1, 
                                        minHeight: '350px', // Ensure enough space for table
                                        display: 'flex',      // Flex to make table fill space
                                        flexDirection: 'column'
                                    }}>
                                        <DataTable
                                            columns={columns}
                                            data={getData()}
                                            pagination
                                            paginationPerPage={10}
                                            paginationRowsPerPageOptions={[10, 20, 50, 100]}
                                            customStyles={customTableStyles}
                                            theme="dark"
                                            fixedHeader
                                            fixedHeaderScrollHeight="100%"
                                            // Ensure pagination is always shown even if data is less than page size
                                            paginationComponentOptions={{
                                                noRowsPerPage: false,
                                                selectAllRowsItem: true,
                                                selectAllRowsItemText: 'All',
                                            }}
                                            noDataComponent={
                                                <div className="p-8 text-center text-gray-500">
                                                    No records found matching your search.
                                                </div>
                                            }
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-8">Failed to load data.</div>
                            )}
                        </div>
                    </Card>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}