import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import toast from 'react-hot-toast';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { rosterAPI, type RosterAssignment, type RosterStats } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import {
    CheckCircle2,
    Mars,
    Venus,
    PieChart as PieIcon,
    ArrowLeft,
    Upload,
    ChevronDown,
    MapPin,
    Edit3
} from 'lucide-react';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import './RosterManagementPage.css'; // Reusing styles

const ALL_HALLS = ['Gallery', 'Outside', 'MainHall', 'Basement', 'HallOne'];

export function RosterAssignmentsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { token } = useAuthStore();

    const [assignments, setAssignments] = useState<RosterAssignment[]>([]);
    const [allStats, setAllStats] = useState<RosterStats[]>([]);
    const [selectedHall, setSelectedHall] = useState<string>('All');
    const [loading, setLoading] = useState(false);
    const [statsLoading, setStatsLoading] = useState(false);
    const [filterText, setFilterText] = useState('');
    const [exportMenuOpen, setExportMenuOpen] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);
    const [updatingHall, setUpdatingHall] = useState(false);

    useEffect(() => {
        if (id && token) {
            fetchAssignments(id);
            fetchStats(id);
        }
    }, [id, token]);

    const fetchStats = async (rosterId: string) => {
        setStatsLoading(true);
        try {
            const data = await rosterAPI.getStats(rosterId, token!);
            if (Array.isArray(data)) {
                setAllStats(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setStatsLoading(false);
        }
    };

    // Derived stats for the selected tab
    const currentStats: RosterStats | null = useMemo(() => {
        if (!allStats.length) return null;

        if (selectedHall === 'All') {
            return allStats.reduce((acc, curr) => ({
                ...curr,
                total_expected: acc.total_expected + curr.total_expected,
                total_assigned: acc.total_assigned + curr.total_assigned,
                total_unassigned: acc.total_unassigned + curr.total_unassigned,
                number_of_male: acc.number_of_male + curr.number_of_male,
                number_of_female: acc.number_of_female + curr.number_of_female,
                hall: 'All',
            }), {
                hall: 'All',
                roster_id: id || '',
                total_expected: 0,
                total_assigned: 0,
                total_unassigned: 0,
                percentage_assigned: 0,
                percentage_unassigned: 0,
                number_of_male: 0,
                number_of_female: 0,
            } as RosterStats);
        }

        return allStats.find(s => s.hall === selectedHall) || null;
    }, [allStats, selectedHall, id]);

    const fetchAssignments = async (rosterId: string) => {
        setLoading(true);
        try {
            const data = await rosterAPI.getAssignments(rosterId, token!);
            setAssignments(data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load assignments');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (type: string) => {
        if (!id || !token) return;
        setExportLoading(true);
        setExportMenuOpen(false);

        try {
            let blob: Blob;
            let filename = `roster_assignments_${type}_${new Date().toISOString().split('T')[0]}.csv`;

            if (type === 'Combined') {
                blob = await rosterAPI.exportCombined(id, token);
            } else {
                const hallParam = type.replace(/\s/g, '');
                blob = await rosterAPI.exportHall(id, hallParam, token);
            }

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success(`Exported ${type} successfully`);
        } catch (error) {
            console.error(error);
            toast.error('Failed to export data');
        } finally {
            setExportLoading(false);
        }
    };

    const handleUpdateHall = async (assignment: RosterAssignment, newHall: string) => {
        if (!token || !id) return;

        setUpdatingHall(true);

        try {
            await rosterAPI.updateUserHall(
                {
                    user_id: assignment.user_id,
                    user_roster_id: assignment.id,
                    hall: newHall,
                },
                token
            );

            toast.success(`Updated ${assignment.first_name}'s hall to ${newHall}`);
            await fetchAssignments(id);
        } catch (error) {
            console.error(error);
            toast.error('Failed to update hall assignment');
        } finally {
            setUpdatingHall(false);
        }
    };

    const filteredItems = assignments.filter(
        item => item.first_name.toLowerCase().includes(filterText.toLowerCase()) ||
            item.last_name.toLowerCase().includes(filterText.toLowerCase()) ||
            item.reg_no.toLowerCase().includes(filterText.toLowerCase()) ||
            item.hall.toLowerCase().includes(filterText.toLowerCase())
    );

    const columns = [
        {
            name: 'User',
            selector: (row: RosterAssignment) => `${row.first_name} ${row.last_name}`,
            cell: (row: RosterAssignment) => (
                <div style={{ display: 'flex', flexDirection: 'column', padding: '8px 0' }}>
                    <span style={{ fontWeight: 600 }}>{row.first_name} {row.last_name}</span>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{row.reg_no}</span>
                </div>
            ),
            sortable: true,
            grow: 2,
        },
        {
            name: 'Reg No',
            selector: (row: RosterAssignment) => row.reg_no,
            sortable: true,
        },
        {
            name: 'Hall',
            selector: (row: RosterAssignment) => row.hall,
            cell: (row: RosterAssignment) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} className="text-secondary" />
                    <span>{row.hall}</span>
                </div>
            ),
            sortable: true,
        },
        {
            name: 'Actions',
            cell: (row: RosterAssignment) => {
                const availableHalls = ALL_HALLS.filter(hall => hall !== row.hall);

                return (
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                        {/* Native Select disguised as a button to fix mobile and table clipping */}
                        <select
                            value=""
                            onChange={(e) => {
                                if (e.target.value) handleUpdateHall(row, e.target.value);
                            }}
                            disabled={updatingHall}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '5px 24px 5px 10px',
                                background: 'rgba(10, 132, 255, 0.1)',
                                color: 'var(--color-accent-blue)',
                                border: '1px solid rgba(10, 132, 255, 0.2)',
                                borderRadius: 'var(--radius-md)',
                                cursor: updatingHall ? 'not-allowed' : 'pointer',
                                fontSize: '12px',
                                fontWeight: 600,
                                opacity: updatingHall ? 0.6 : 1,
                                appearance: 'none',
                                WebkitAppearance: 'none',
                                width: '90px',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(10, 132, 255, 0.2)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(10, 132, 255, 0.1)';
                            }}
                        >
                            <option value="" disabled>Edit</option>
                            {availableHalls.map((hall) => (
                                <option key={hall} value={hall} style={{ color: '#000' }}>
                                    {hall}
                                </option>
                            ))}
                        </select>
                        <Edit3
                            size={12}
                            style={{
                                position: 'absolute',
                                right: '8px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--color-accent-blue)',
                                pointerEvents: 'none'
                            }}
                        />
                    </div>
                );
            },
            right: true,
        },
    ];

    const customTableStyles = {
        table: { style: { backgroundColor: 'transparent' } },
        headRow: {
            style: {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--color-text-secondary)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            },
        },
        rows: {
            style: {
                backgroundColor: 'transparent',
                color: 'var(--color-text-primary)',
                '&:not(:last-of-type)': { borderBottom: '1px solid rgba(255, 255, 255, 0.05)' },
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.02)' },
            },
        },
        pagination: {
            style: {
                backgroundColor: 'transparent',
                color: 'var(--color-text-secondary)',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            },
        },
    };

    const chartData = currentStats ? [
        { name: 'Male', value: currentStats.number_of_male, color: '#0a84ff' },
        { name: 'Female', value: currentStats.number_of_female, color: '#ff375f' },
    ] : [];

    return (
        <motion.div
            className="roster-management-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <div className="roster-management-page__header">
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <Button variant="ghost" onClick={() => navigate('/roster-management')}>
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <h1 className="roster-management-page__title">Roster Assignments</h1>
                        <p className="roster-management-page__subtitle">View and manage hall allocations</p>
                    </div>
                </div>

                <div style={{ position: 'relative' }}>
                    <Button
                        variant="primary"
                        icon={<Upload size={18} />}
                        onClick={() => setExportMenuOpen(!exportMenuOpen)}
                        loading={exportLoading}
                    >
                        Export <ChevronDown size={16} style={{ marginLeft: '4px' }} />
                    </Button>

                    {exportMenuOpen && (
                        <>
                            <div
                                style={{
                                    position: 'fixed',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    zIndex: 99,
                                    cursor: 'default'
                                }}
                                onClick={() => setExportMenuOpen(false)}
                            />
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                marginTop: '8px',
                                background: 'var(--color-bg-elevated)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 'var(--radius-md)',
                                boxShadow: 'var(--shadow-lg)',
                                zIndex: 100,
                                minWidth: '180px',
                                overflow: 'hidden'
                            }}>
                                {['Combined', 'MainHall', 'HallOne', 'Gallery', 'Basement', 'Outside'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => handleExport(type)}
                                        style={{
                                            display: 'block',
                                            width: '100%',
                                            padding: '12px 16px',
                                            textAlign: 'left',
                                            background: 'transparent',
                                            border: 'none',
                                            color: 'var(--color-text-primary)',
                                            cursor: 'pointer',
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        Export {type === 'Combined' ? 'All' : type}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Metrics Section */}
            <div className="roster-stats">
                <div className="roster-stats__hall-tabs">
                    {['All', ...ALL_HALLS].map((hall) => (
                        <button
                            key={hall}
                            className={`roster-stats__tab ${selectedHall === hall ? 'roster-stats__tab--active' : ''}`}
                            onClick={() => setSelectedHall(hall)}
                        >
                            {hall}
                        </button>
                    ))}
                </div>

                <div className="roster-stats__grid">
                    <Card glass className="roster-stats__chart-card">
                        <h3 className="roster-stat-card__label" style={{ marginBottom: '20px' }}>Gender Distribution</h3>
                        {statsLoading ? (
                            <div className="p-8 text-secondary">Loading chart...</div>
                        ) : currentStats && (currentStats.number_of_male > 0 || currentStats.number_of_female > 0) ? (
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            background: 'var(--color-bg-elevated)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '12px',
                                            color: 'var(--color-text-primary)'
                                        }}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="p-8 text-secondary text-center">
                                <PieIcon size={48} style={{ opacity: 0.2, marginBottom: '12px' }} />
                                <p>No distribution data available</p>
                            </div>
                        )}
                    </Card>

                    <div className="roster-stats__cards">
                        <Card glass padding="lg" className="roster-stat-card">
                            <div className="roster-stat-card__label">Total Assigned</div>
                            <div className="roster-stat-card__value">{statsLoading ? '...' : currentStats?.total_assigned || 0}</div>
                            <div className="roster-stat-card__footer">
                                Members currently assigned
                            </div>
                            <div className="roster-stat-card__icon"><CheckCircle2 size={64} color="var(--color-success)" /></div>
                        </Card>

                        <Card glass padding="lg" className="roster-stat-card">
                            <div className="roster-stat-card__label">Male Ratio</div>
                            <div className="roster-stat-card__value">{statsLoading ? '...' : currentStats?.number_of_male || 0}</div>
                            <div className="roster-stat-card__footer">
                                Total male members
                            </div>
                            <div className="roster-stat-card__icon"><Mars size={64} color="#0a84ff" /></div>
                        </Card>

                        <Card glass padding="lg" className="roster-stat-card">
                            <div className="roster-stat-card__label">Female Ratio</div>
                            <div className="roster-stat-card__value">{statsLoading ? '...' : currentStats?.number_of_female || 0}</div>
                            <div className="roster-stat-card__footer">
                                Total female members
                            </div>
                            <div className="roster-stat-card__icon"><Venus size={64} color="#ff375f" /></div>
                        </Card>
                    </div>
                </div>
            </div>

            <Card glass className="p-0 overflow-hidden">
                <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <input
                        type="text"
                        placeholder="Filter assignments..."
                        value={filterText}
                        onChange={e => setFilterText(e.target.value)}
                        style={{
                            padding: '10px 16px',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(255,255,255,0.05)',
                            color: 'var(--color-text-primary)',
                            width: '100%',
                            maxWidth: '400px',
                            outline: 'none'
                        }}
                    />
                </div>

                {loading ? (
                    <div className="roster-management-page__loading">Loading...</div>
                ) : (
                    <div style={{ overflowX: 'auto', minHeight: '300px' }}>
                        <DataTable
                            columns={columns}
                            data={filteredItems}
                            pagination
                            paginationPerPage={20}
                            customStyles={customTableStyles}
                            theme="dark"
                            noDataComponent={<div className="p-8 text-center text-gray-500">No assignments found for this roster.</div>}
                        />
                    </div>
                )}
            </Card>
        </motion.div>
    );
}