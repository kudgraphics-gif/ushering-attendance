import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import { ArrowLeft, Upload, ChevronDown, MapPin, Edit3 } from 'lucide-react';


import toast from 'react-hot-toast';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { rosterAPI, type RosterAssignment } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import './RosterManagementPage.css'; // Reusing styles

const ALL_HALLS = ['Gallery', 'Outside', 'MainHall', 'Basement', 'HallOne'];

export function RosterAssignmentsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { token } = useAuthStore();

    const [assignments, setAssignments] = useState<RosterAssignment[]>([]);
    const [loading, setLoading] = useState(false);
    const [filterText, setFilterText] = useState('');
    const [exportMenuOpen, setExportMenuOpen] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [updatingHall, setUpdatingHall] = useState(false);

    useEffect(() => {
        if (id && token) {
            fetchAssignments(id);
        }
    }, [id, token]);

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
        setExportMenuOpen(false); // Close dropdown

        try {
            let blob: Blob;
            let filename = `roster_assignments_${type}_${new Date().toISOString().split('T')[0]}.csv`;

            if (type === 'Combined') {
                blob = await rosterAPI.exportCombined(id, token);
            } else {
                // Map display name to API param if necessary. 
                // The prompt says halls are MainHall, HallOne, Gallery, Basement, Outside
                // If user selects "Hall One", we pass "HallOne"
                const hallParam = type.replace(/\s/g, ''); // Simple sanitation: "Hall One" -> "HallOne"
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
        setEditingUserId(null);

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
            // Refresh the assignments
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
                const isOpen = editingUserId === row.user_id;

                return (
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setEditingUserId(isOpen ? null : row.user_id)}
                            disabled={updatingHall}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 12px',
                                background: 'var(--color-accent-blue)',
                                color: 'white',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                cursor: updatingHall ? 'not-allowed' : 'pointer',
                                fontSize: '13px',
                                fontWeight: 500,
                                opacity: updatingHall ? 0.6 : 1,
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => !updatingHall && (e.currentTarget.style.background = '#0066cc')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-accent-blue)')}
                        >
                            <Edit3 size={14} />
                            Edit Hall
                        </button>

                        {isOpen && (
                            <>
                                <div
                                    style={{
                                        position: 'fixed',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        zIndex: 99,
                                    }}
                                    onClick={() => setEditingUserId(null)}
                                />
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '100%',
                                        right: 0,
                                        marginTop: '4px',
                                        background: 'var(--surface-card, #1e1e1e)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 'var(--radius-md)',
                                        boxShadow: 'var(--shadow-lg)',
                                        zIndex: 100,
                                        minWidth: '150px',
                                        overflow: 'hidden',
                                    }}
                                >
                                    {availableHalls.map((hall) => (
                                        <button
                                            key={hall}
                                            onClick={() => handleUpdateHall(row, hall)}
                                            style={{
                                                display: 'block',
                                                width: '100%',
                                                padding: '10px 14px',
                                                textAlign: 'left',
                                                background: 'transparent',
                                                border: 'none',
                                                color: 'var(--text-primary)',
                                                cursor: 'pointer',
                                                fontSize: '13px',
                                                transition: 'background 0.2s',
                                            }}
                                            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
                                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                        >
                                            {hall}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
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
                            color: 'white',
                            width: '100%',
                            maxWidth: '400px',
                            outline: 'none'
                        }}
                    />
                </div>

                {loading ? (
                    <div className="roster-management-page__loading">Loading...</div>
                ) : (
                    <DataTable
                        columns={columns}
                        data={filteredItems}
                        pagination
                        paginationPerPage={20}
                        customStyles={customTableStyles}
                        theme="dark"
                        noDataComponent={<div className="p-8 text-center text-gray-500">No assignments found for this roster.</div>}
                    />
                )}
            </Card>
        </motion.div>
    );
}