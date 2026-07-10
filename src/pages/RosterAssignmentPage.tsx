import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    Edit3,
    Shuffle,
    X
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
    
    // Outliers state
    const [outliers, setOutliers] = useState<any[]>([]);
    const [outliersLoading, setOutliersLoading] = useState(false);

    // Reassign modal states
    const [reassignModalOpen, setReassignModalOpen] = useState(false);
    const [selectedOutlier, setSelectedOutlier] = useState<any>(null);
    const [selectedReassignHall, setSelectedReassignHall] = useState("");
    const [savingReassignment, setSavingReassignment] = useState(false);

    const handleReassignClick = (outlier: any) => {
        setSelectedOutlier(outlier);
        setSelectedReassignHall(outlier.possible_halls?.[0] || "");
        setReassignModalOpen(true);
    };

    const handleSaveReassignment = async () => {
        if (!token || !selectedOutlier) return;

        setSavingReassignment(true);
        const userRosterId = selectedOutlier.previous_rosters?.[0]?.id || "";
        const rosterId = selectedOutlier.previous_rosters?.[0]?.roster_id || id || "";

        try {
            await rosterAPI.updateUserHall(
                {
                    user_id: selectedOutlier.user_id,
                    user_roster_id: userRosterId,
                    hall: selectedReassignHall,
                    roster_id: rosterId,
                } as any,
                token
            );
            toast.success(`Successfully reassigned to ${selectedReassignHall}`);
            setReassignModalOpen(false);
            // Refresh outliers
            if (id) {
                const data = await rosterAPI.getOutliers(id, token);
                setOutliers(data || []);
                await fetchAssignments(id);
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Reassignment failed');
        } finally {
            setSavingReassignment(false);
        }
    };

    useEffect(() => {
        if (id && token) {
            fetchAssignments(id);
            fetchStats(id);
        }
    }, [id, token]);

    useEffect(() => {
        if (id && token && selectedHall === 'Outliers' && outliers.length === 0) {
            const fetchOutliers = async () => {
                setOutliersLoading(true);
                try {
                    const data = await rosterAPI.getOutliers(id, token);
                    setOutliers(data || []);
                } catch (error) {
                    console.error(error);
                    toast.error('Failed to load roster outliers');
                } finally {
                    setOutliersLoading(false);
                }
            };
            fetchOutliers();
        }
    }, [id, token, selectedHall, outliers.length]);

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
        item => {
            const matchesHall = selectedHall === 'All' || item.hall === selectedHall;
            const matchesSearch = item.first_name.toLowerCase().includes(filterText.toLowerCase()) ||
                item.last_name.toLowerCase().includes(filterText.toLowerCase()) ||
                item.reg_no.toLowerCase().includes(filterText.toLowerCase()) ||
                item.hall.toLowerCase().includes(filterText.toLowerCase());
            return matchesHall && matchesSearch;
        }
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

    const filteredOutliers = useMemo(() => {
        return outliers.filter(item => 
            `${item.first_name} ${item.last_name} ${item.reg_no} ${item.hall}`
                .toLowerCase()
                .includes(filterText.toLowerCase())
        );
    }, [outliers, filterText]);

    const outlierColumns = [
        {
            name: 'User',
            selector: (row: any) => `${row.first_name} ${row.last_name}`,
            cell: (row: any) => (
                <div style={{ display: 'flex', flexDirection: 'column', padding: '8px 0' }}>
                    <span style={{ fontWeight: 600 }}>{row.first_name} {row.last_name}</span>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{row.reg_no}</span>
                </div>
            ),
            sortable: true,
            grow: 2,
        },
        {
            name: 'Assigned Hall',
            selector: (row: any) => row.hall,
            cell: (row: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} className="text-secondary" />
                    <span>{row.hall}</span>
                </div>
            ),
            sortable: true,
        },
        {
            name: 'Roster History Timeline',
            cell: (row: any) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '8px 0', width: '100%' }}>
                    {row.previous_rosters && row.previous_rosters.length > 0 ? (
                        row.previous_rosters.map((prev: any, idx: number) => (
                            <div 
                                key={idx} 
                                style={{ 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    gap: '2px', 
                                    borderLeft: '2px solid var(--color-primary)', 
                                    paddingLeft: '8px',
                                    marginBottom: idx !== row.previous_rosters.length - 1 ? '4px' : '0'
                                }}
                            >
                                <span style={{ fontSize: '11px', fontWeight: 600, color: '#fff' }}>
                                    {prev.roster_name}
                                </span>
                                <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                                    Hall: <strong style={{ color: 'var(--color-primary)' }}>{prev.hall}</strong> | Assigned: {new Date(prev.assigned_at).toLocaleDateString()}
                                </span>
                            </div>
                        ))
                    ) : (
                        <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>
                            No previous assignments found
                        </span>
                    )}
                </div>
            ),
            grow: 3,
        },
        {
            name: 'Actions',
            cell: (row: any) => (
                <button
                    onClick={() => handleReassignClick(row)}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 14px',
                        borderRadius: '100px',
                        border: '1px solid rgba(212,175,55,0.35)',
                        background: 'linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(212,175,55,0.05) 100%)',
                        color: '#D4AF37',
                        fontSize: '12px',
                        fontWeight: 600,
                        fontFamily: 'inherit',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s ease',
                        letterSpacing: '0.3px',
                    }}
                    onMouseEnter={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, rgba(212,175,55,0.22) 0%, rgba(212,175,55,0.1) 100%)';
                        (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 14px rgba(212,175,55,0.18)';
                        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(212,175,55,0.05) 100%)';
                        (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                    }}
                >
                    <Shuffle size={13} />
                    Reassign
                </button>
            ),
            right: true,
            grow: 1,
        }
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
                    {['All', ...ALL_HALLS, 'Outliers'].map((hall) => (
                        <button
                            key={hall}
                            className={`roster-stats__tab ${selectedHall === hall ? 'roster-stats__tab--active' : ''}`}
                            onClick={() => setSelectedHall(hall)}
                            style={hall === 'Outliers' ? { color: '#ff375f', borderBottomColor: selectedHall === 'Outliers' ? '#ff375f' : 'transparent' } : {}}
                        >
                            {hall}
                        </button>
                    ))}
                </div>

                {selectedHall !== 'Outliers' && (
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
                )}
            </div>

            <Card glass className="p-0 overflow-hidden">
                <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <input
                        type="text"
                        placeholder={selectedHall === 'Outliers' ? "Filter outliers..." : "Filter assignments..."}
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

                {selectedHall === 'Outliers' ? (
                    outliersLoading ? (
                        <div className="roster-management-page__loading">Loading outliers...</div>
                    ) : (
                        <div style={{ overflowX: 'auto', minHeight: '300px' }}>
                            <DataTable
                                columns={outlierColumns}
                                data={filteredOutliers}
                                pagination
                                paginationPerPage={20}
                                customStyles={customTableStyles}
                                theme="dark"
                                noDataComponent={<div className="p-8 text-center text-gray-500">No outliers found for this roster.</div>}
                            />
                        </div>
                    )
                ) : (
                    loading ? (
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
                    )
                )}
            </Card>

            <AnimatePresence>
                {reassignModalOpen && selectedOutlier && (
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 999,
                        padding: '16px'
                    }}>
                        <motion.div 
                            initial={{ scale: 0.93, opacity: 0, y: 12 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.93, opacity: 0, y: 12 }}
                            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
                            style={{
                                width: '100%',
                                maxWidth: '420px',
                                background: 'rgba(12, 12, 14, 0.98)',
                                border: '1px solid rgba(212,175,55,0.2)',
                                borderRadius: '24px',
                                overflow: 'hidden',
                                boxShadow: '0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(212,175,55,0.05)',
                                color: '#fff'
                            }}
                        >
                            {/* Gold accent top bar */}
                            <div style={{
                                background: 'linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.04) 100%)',
                                borderBottom: '1px solid rgba(212,175,55,0.12)',
                                padding: '20px 24px 18px',
                                display: 'flex',
                                alignItems: 'flex-start',
                                justifyContent: 'space-between',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '38px', height: '38px',
                                        borderRadius: '10px',
                                        background: 'rgba(212,175,55,0.12)',
                                        border: '1px solid rgba(212,175,55,0.25)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0,
                                        color: '#D4AF37'
                                    }}>
                                        <Shuffle size={18} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, letterSpacing: '-0.2px' }}>
                                            Reassign Hall
                                        </h3>
                                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', margin: '2px 0 0' }}>
                                            Select a new hall assignment
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setReassignModalOpen(false)}
                                    style={{
                                        width: '28px', height: '28px', borderRadius: '50%',
                                        border: 'none',
                                        background: 'rgba(255,255,255,0.06)',
                                        color: 'rgba(255,255,255,0.5)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', flexShrink: 0,
                                    }}
                                >
                                    <X size={14} />
                                </button>
                            </div>

                            {/* Body */}
                            <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {/* Person context card */}
                                <div style={{
                                    padding: '14px 16px',
                                    borderRadius: '14px',
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '6px',
                                }}>
                                    <span style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>
                                        {selectedOutlier.first_name} {selectedOutlier.last_name}
                                    </span>
                                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                                            {selectedOutlier.reg_no}
                                        </span>
                                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <MapPin size={10} />
                                            Currently: <strong style={{ color: '#ff9500', marginLeft: '3px' }}>{selectedOutlier.hall}</strong>
                                        </span>
                                    </div>
                                </div>

                                {/* Hall selector */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        color: 'rgba(255,255,255,0.4)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.8px'
                                    }}>
                                        Target Hall
                                    </label>

                                    {selectedOutlier.possible_halls && selectedOutlier.possible_halls.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {selectedOutlier.possible_halls.map((hallName: string) => {
                                                const isSelected = selectedReassignHall === hallName;
                                                return (
                                                    <button
                                                        key={hallName}
                                                        onClick={() => setSelectedReassignHall(hallName)}
                                                        style={{
                                                            width: '100%',
                                                            padding: '12px 16px',
                                                            borderRadius: '12px',
                                                            border: isSelected
                                                                ? '1px solid rgba(212,175,55,0.5)'
                                                                : '1px solid rgba(255,255,255,0.06)',
                                                            background: isSelected
                                                                ? 'linear-gradient(135deg, rgba(212,175,55,0.14) 0%, rgba(212,175,55,0.06) 100%)'
                                                                : 'rgba(255,255,255,0.02)',
                                                            color: isSelected ? '#D4AF37' : 'rgba(255,255,255,0.75)',
                                                            fontSize: '14px',
                                                            fontWeight: isSelected ? 600 : 400,
                                                            fontFamily: 'inherit',
                                                            cursor: 'pointer',
                                                            textAlign: 'left',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            transition: 'all 0.18s ease',
                                                        }}
                                                    >
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <span style={{
                                                                width: '8px', height: '8px', borderRadius: '50%',
                                                                background: isSelected ? '#D4AF37' : 'rgba(255,255,255,0.15)',
                                                                flexShrink: 0,
                                                            }} />
                                                            {hallName}
                                                        </span>
                                                        {isSelected && (
                                                            <CheckCircle2 size={15} style={{ color: '#D4AF37', flexShrink: 0 }} />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', fontStyle: 'italic', margin: 0 }}>
                                            No possible halls available for this member.
                                        </p>
                                    )}
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
                                    <button
                                        onClick={() => setReassignModalOpen(false)}
                                        disabled={savingReassignment}
                                        style={{
                                            flex: 1,
                                            padding: '11px',
                                            borderRadius: '12px',
                                            border: '1px solid rgba(255,255,255,0.08)',
                                            background: 'rgba(255,255,255,0.04)',
                                            color: 'rgba(255,255,255,0.65)',
                                            fontSize: '14px',
                                            fontWeight: 500,
                                            fontFamily: 'inherit',
                                            cursor: savingReassignment ? 'not-allowed' : 'pointer',
                                            transition: 'all 0.18s ease',
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveReassignment}
                                        disabled={savingReassignment || !selectedReassignHall}
                                        style={{
                                            flex: 1,
                                            padding: '11px',
                                            borderRadius: '12px',
                                            border: 'none',
                                            background: savingReassignment || !selectedReassignHall
                                                ? 'rgba(255,255,255,0.06)'
                                                : 'linear-gradient(135deg, #D4AF37 0%, #f4c430 100%)',
                                            color: savingReassignment || !selectedReassignHall
                                                ? 'rgba(255,255,255,0.25)'
                                                : '#000',
                                            fontSize: '14px',
                                            fontWeight: 600,
                                            fontFamily: 'inherit',
                                            cursor: savingReassignment || !selectedReassignHall ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '7px',
                                            transition: 'all 0.18s ease',
                                            boxShadow: savingReassignment || !selectedReassignHall
                                                ? 'none'
                                                : '0 4px 16px rgba(212,175,55,0.3)',
                                        }}
                                    >
                                        {savingReassignment ? (
                                            <>Saving...</>
                                        ) : (
                                            <><Shuffle size={14} /> Reassign</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}