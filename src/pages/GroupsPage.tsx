import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users2,
    Plus,
    ArrowLeft,
    Calendar,
    UserPlus,
    Upload,
    Trash2,
    CheckCircle2,
    AlertCircle,
    History,
    Activity,
    X,
    Search,
    ChevronRight,
    Zap,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { format, isValid, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

import { groupsAPI, usersAPI } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import type { Group, GroupDetail, GroupHistoryItem, GroupAttendanceResponse, UserDto } from '../types';
import './GroupsPage.css';

// ─── Helper ────────────────────────────────────────────────────────────────

function fmtDate(d?: string | null) {
    if (!d) return '—';
    const parsed = parseISO(d);
    return isValid(parsed) ? format(parsed, 'MMM d, yyyy') : d;
}

function fmtTime(d: string | null | undefined) {
    if (!d) return '—';
    const parsed = new Date(d);
    return isValid(parsed) ? format(parsed, 'h:mm a') : '—';
}

function initials(first: string, last: string) {
    return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase();
}

// ─── User Picker Modal ──────────────────────────────────────────────────────

interface UserPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    onSelect: (user: UserDto) => void;
    users: UserDto[];
    disabled?: boolean;
}

function UserPickerModal({ isOpen, onClose, title, onSelect, users, disabled }: UserPickerModalProps) {
    const [search, setSearch] = useState('');
    const filtered = users.filter(u =>
        `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="groups-modal">
                <div className="groups-modal__header">
                    <h2 className="groups-modal__title">{title}</h2>
                    <button className="groups-modal__close" onClick={onClose} disabled={disabled}><X size={20} /></button>
                </div>
                <div className="groups-modal__field">
                    <div className="groups-modal__search-wrapper">
                        <Search size={16} className="groups-modal__search-icon" />
                        <input
                            autoFocus
                            className="groups-modal__search-input"
                            placeholder="Search by name or email..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            disabled={disabled}
                        />
                    </div>
                    <div className="groups-modal__user-list">
                        {filtered.length === 0 ? (
                            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                No users found
                            </div>
                        ) : filtered.map(u => (
                            <div
                                key={u.id}
                                className="groups-modal__user-item"
                                onClick={() => { if (!disabled) { onSelect(u); onClose(); setSearch(''); } }}
                                style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
                            >
                                <div className="member-avatar" style={{ width: 28, height: 28, fontSize: '0.7rem' }}>
                                    {u.avatar_url ? <img src={u.avatar_url} alt="" /> : initials(u.first_name, u.last_name)}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600 }}>{u.first_name} {u.last_name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{u.email}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Modal>
    );
}

// ─── Create Group Modal ─────────────────────────────────────────────────────

interface CreateGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    users: UserDto[];
    onCreated: (g: Group) => void;
    token: string;
}

function CreateGroupModal({ isOpen, onClose, users, onCreated, token }: CreateGroupModalProps) {
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');
    const [leaderSearch, setLeaderSearch] = useState('');
    const [selectedLeader, setSelectedLeader] = useState<UserDto | null>(null);
    const [loading, setLoading] = useState(false);

    const filteredLeaders = users.filter(u =>
        `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(leaderSearch.toLowerCase())
    );

    const reset = () => { setName(''); setDesc(''); setLeaderSearch(''); setSelectedLeader(null); };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLeader) { toast.error('Please select a group leader'); return; }
        if (!name.trim()) { toast.error('Group name is required'); return; }
        setLoading(true);
        try {
            const group = await groupsAPI.create({ name: name.trim(), description: desc.trim(), group_leader: selectedLeader.id }, token);
            toast.success('Group created successfully');
            onCreated(group);
            reset();
            onClose();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to create group');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="groups-modal">
                <div className="groups-modal__header">
                    <h2 className="groups-modal__title">Create Group</h2>
                    <button className="groups-modal__close" onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="groups-modal__field">
                        <label className="groups-modal__label">Group Name</label>
                        <input className="groups-modal__input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Group One" required />
                    </div>
                    <div className="groups-modal__field">
                        <label className="groups-modal__label">Description</label>
                        <textarea className="groups-modal__textarea" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Brief description..." />
                    </div>
                    <div className="groups-modal__field">
                        <label className="groups-modal__label">Group Leader</label>
                        {selectedLeader ? (
                            <div className="groups-modal__selected-user">
                                <CheckCircle2 size={14} />
                                {selectedLeader.first_name} {selectedLeader.last_name}
                                <button type="button" style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex' }} onClick={() => setSelectedLeader(null)}><X size={14} /></button>
                            </div>
                        ) : (
                            <>
                                <div className="groups-modal__search-wrapper">
                                    <Search size={16} className="groups-modal__search-icon" />
                                    <input
                                        className="groups-modal__search-input"
                                        placeholder="Search users..."
                                        value={leaderSearch}
                                        onChange={e => setLeaderSearch(e.target.value)}
                                    />
                                </div>
                                {leaderSearch && (
                                    <div className="groups-modal__user-list">
                                        {filteredLeaders.map(u => (
                                            <div key={u.id} className="groups-modal__user-item" onClick={() => { setSelectedLeader(u); setLeaderSearch(''); }}>
                                                <div className="member-avatar" style={{ width: 28, height: 28, fontSize: '0.7rem' }}>
                                                    {initials(u.first_name, u.last_name)}
                                                </div>
                                                {u.first_name} {u.last_name}
                                                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{u.email}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    <div className="groups-modal__footer">
                        <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
                        <Button type="submit" variant="primary" loading={loading} icon={<Plus size={16} />}>Create Group</Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}

// ─── Activate Group Modal ───────────────────────────────────────────────────

interface ActivateModalProps {
    isOpen: boolean;
    onClose: () => void;
    group: Group;
    token: string;
    onActivated: (id: string) => void;
}

function ActivateModal({ isOpen, onClose, group, token, onActivated }: ActivateModalProps) {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await groupsAPI.activate(group.id, date, token);
            toast.success(`${group.name} activated`);
            onActivated(group.id);
            onClose();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to activate group');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="groups-modal">
                <div className="groups-modal__header">
                    <h2 className="groups-modal__title">Activate Group</h2>
                    <button className="groups-modal__close" onClick={onClose}><X size={20} /></button>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
                    Select the activation date for <strong style={{ color: 'var(--text-primary)' }}>{group.name}</strong>.
                </p>
                <form onSubmit={handleSubmit}>
                    <div className="groups-modal__field">
                        <label className="groups-modal__label">Activation Date</label>
                        <input type="date" className="groups-modal__input" value={date} onChange={e => setDate(e.target.value)} required />
                    </div>
                    <div className="groups-modal__footer">
                        <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
                        <Button type="submit" variant="primary" loading={loading} icon={<Zap size={16} />}>Activate</Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}

// ─── Add User Modal ─────────────────────────────────────────────────────────

interface AddUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    group: Group;
    token: string;
    users: UserDto[];
    onAdded: () => void;
}

function AddUserModal({ isOpen, onClose, group, token, users, onAdded }: AddUserModalProps) {
    const [loading, setLoading] = useState(false);

    const handleSelect = async (user: UserDto) => {
        setLoading(true);
        try {
            await groupsAPI.addUser({ group_name: group.name, user_id: user.id }, token);
            toast.success(`${user.first_name} added to ${group.name}`);
            onAdded();
            onClose();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to add user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <UserPickerModal
            isOpen={isOpen}
            onClose={onClose}
            title={`Add Member to ${group.name}`}
            onSelect={handleSelect}
            users={users}
            disabled={loading}
        />
    );
}

// ─── Attendance View ────────────────────────────────────────────────────────

interface AttendanceViewProps {
    token: string;
    initialDate?: string;
    onBack: () => void;
}

function AttendanceView({ token, initialDate, onBack }: AttendanceViewProps) {
    const [date, setDate] = useState(initialDate ?? new Date().toISOString().split('T')[0]);
    const [attendance, setAttendance] = useState<GroupAttendanceResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [tab, setTab] = useState<'present' | 'absent'>('present');

    useEffect(() => { fetchAttendance(); }, [date]);

    const fetchAttendance = async () => {
        setLoading(true);
        try {
            const data = await groupsAPI.getAttendance(date, token);
            setAttendance(data);
        } catch (err) {
            toast.error('Failed to load group attendance');
        } finally {
            setLoading(false);
        }
    };

    const pieData = attendance ? [
        { name: 'Present', value: attendance.present.length, color: '#10B981' },
        { name: 'Absent', value: attendance.absent.length, color: '#EF4444' },
    ] : [];


    const renderRows = (records: GroupAttendanceResponse['present'] | GroupAttendanceResponse['absent']) => (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '10px 16px', borderBottom: '1px solid var(--border-color)', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <span>Name</span><span>Time In</span><span>Time Out</span>
            </div>
            {records.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>No records found</div>
            ) : records.map((r, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '12px 16px', borderBottom: i < records.length - 1 ? '1px solid var(--border-color)' : 'none', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.user.first_name} {r.user.last_name}</div>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{fmtTime(r.time_in)}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{fmtTime(r.time_out)}</div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="group-detail">
            <button className="group-detail__back" onClick={onBack}>
                <ArrowLeft size={16} /> Back to Group
            </button>
            <div className="group-detail__header">
                <div>
                    <h1 className="group-detail__title">Group Attendance</h1>
                    <p className="group-detail__desc">Showing attendance for {fmtDate(date)}</p>
                </div>
                <input type="date" className="groups-modal__input" style={{ width: 'auto' }} value={date} onChange={e => setDate(e.target.value)} />
            </div>

            {loading ? (
                <div className="groups-page__loading"><p>Loading attendance...</p></div>
            ) : attendance ? (
                <>
                    <div className="group-attendance__stats">
                        <Card glass className="group-attendance__chart-card">
                            <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Overview</h3>
                            {pieData.some(d => d.value > 0) ? (
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                                            {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: 'var(--surface-glass)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No attendance data for this date</div>}
                        </Card>
                        <Card glass style={{ padding: 'var(--space-xl)' }}>
                            <h3 style={{ margin: '0 0 20px', fontSize: '1rem', fontWeight: 700 }}>Statistics</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {[{ label: 'Total', value: (attendance.present.length + attendance.absent.length), color: 'var(--text-primary)' },
                                { label: 'Present', value: attendance.present.length, color: '#10B981' },
                                { label: 'Absent', value: attendance.absent.length, color: '#EF4444' }].map(s => (
                                    <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: 12, background: 'var(--surface-hover)' }}>
                                        <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{s.label}</span>
                                        <span style={{ fontWeight: 700, fontSize: '1.2rem', color: s.color }}>{s.value}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    <Card glass>
                        <div style={{ padding: 'var(--space-lg) var(--space-xl)', borderBottom: '1px solid var(--border-color)' }}>
                            <div className="attendance-tab-row">
                                <button className={`attendance-tab-btn ${tab === 'present' ? 'attendance-tab-btn--active' : ''}`} onClick={() => setTab('present')}>
                                    <CheckCircle2 size={16} /> Present ({attendance.present.length})
                                </button>
                                <button className={`attendance-tab-btn ${tab === 'absent' ? 'attendance-tab-btn--active' : ''}`} onClick={() => setTab('absent')}>
                                    <AlertCircle size={16} /> Absent ({attendance.absent.length})
                                </button>
                            </div>
                        </div>
                        {renderRows(tab === 'present' ? attendance.present : attendance.absent)}
                    </Card>
                </>
            ) : null}
        </div>
    );
}

// ─── Group Detail View ──────────────────────────────────────────────────────

interface GroupDetailViewProps {
    groupId: string;
    token: string;
    users: UserDto[];
    onBack: () => void;
}

function GroupDetailView({ groupId, token, users, onBack }: GroupDetailViewProps) {
    const [detail, setDetail] = useState<GroupDetail | null>(null);
    const [history, setHistory] = useState<GroupHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'members' | 'history'>('members');
    const [attendanceDate, setAttendanceDate] = useState<string | null>(null);
    const [addUserOpen, setAddUserOpen] = useState(false);
    const [importingId, setImportingId] = useState<string | null>(null);

    useEffect(() => { fetchDetail(); fetchHistory(); }, [groupId]);

    const fetchDetail = async () => {
        setLoading(true);
        try {
            const data = await groupsAPI.getById(groupId, token);
            setDetail(data);
        } catch (err) {
            toast.error('Failed to load group details');
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        try {
            const h = await groupsAPI.getHistory(groupId, token);
            setHistory(h);
        } catch { /* silent */ }
    };

    const handleRemoveUser = async (userId: string, userName: string) => {
        if (!detail) return;
        if (!window.confirm(`Remove ${userName} from ${detail.name}?`)) return;
        try {
            await groupsAPI.removeUser({ group_id: detail.id, user_id: userId }, token);
            toast.success(`${userName} removed`);
            setDetail(prev => prev ? { ...prev, members: prev.members.filter(m => m.id !== userId) } : prev);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to remove user');
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !detail) return;
        setImportingId(detail.id);
        try {
            await groupsAPI.importUsers(detail.id, file, token);
            toast.success('Users imported successfully');
            fetchDetail();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Import failed');
        } finally {
            setImportingId(null);
            e.target.value = '';
        }
    };

    if (attendanceDate !== null) {
        return <AttendanceView token={token} initialDate={attendanceDate} onBack={() => setAttendanceDate(null)} />;
    }

    if (loading || !detail) {
        return <div className="groups-page__loading"><p>Loading group details...</p></div>;
    }

    return (
        <div className="group-detail">
            <button className="group-detail__back" onClick={onBack}>
                <ArrowLeft size={16} /> Back to Groups
            </button>
            <div className="group-detail__header">
                <div>
                    <div className="group-detail__title-row">
                        <h1 className="group-detail__title">{detail.name}</h1>
                        <span className={`group-card__badge ${detail.is_active ? 'group-card__badge--active' : 'group-card__badge--inactive'}`}>
                            {detail.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                    <p className="group-detail__desc">{detail.description || 'No description'}</p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
                    <Button variant="secondary" icon={<UserPlus size={16} />} onClick={() => setAddUserOpen(true)}>
                        Add Member
                    </Button>
                    <>
                        <input type="file" id={`import-group-${detail.id}`} accept=".csv" onChange={handleImport} style={{ display: 'none' }} />
                        <Button
                            variant="secondary"
                            icon={<Upload size={16} />}
                            onClick={() => document.getElementById(`import-group-${detail.id}`)?.click()}
                            loading={importingId === detail.id}
                        >
                            Import CSV
                        </Button>
                    </>
                    <Button variant="primary" icon={<Activity size={16} />} onClick={() => setAttendanceDate(new Date().toISOString().split('T')[0])}>
                        View Attendance
                    </Button>
                </div>
            </div>

            <div className="group-detail__tabs">
                <button className={`group-detail__tab ${tab === 'members' ? 'group-detail__tab--active' : ''}`} onClick={() => setTab('members')}>
                    <Users2 size={16} /> Members ({detail.members.length})
                </button>
                <button className={`group-detail__tab ${tab === 'history' ? 'group-detail__tab--active' : ''}`} onClick={() => setTab('history')}>
                    <History size={16} /> History ({history.length})
                </button>
            </div>

            <AnimatePresence mode="wait">
                {tab === 'members' && (
                    <motion.div key="members" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                        <Card glass>
                            <div style={{ padding: 'var(--space-lg) var(--space-xl)' }}>
                                {detail.members.length === 0 ? (
                                    <div className="groups-page__empty" style={{ padding: 'var(--space-2xl)' }}>
                                        <Users2 size={40} />
                                        <h3>No Members Yet</h3>
                                        <p>Add members using the button above.</p>
                                    </div>
                                ) : detail.members.map(m => (
                                    <div className="member-row" key={m.id}>
                                        <div className="member-row__info">
                                            <div className="member-avatar">
                                                {m.avatar_url ? <img src={m.avatar_url} alt="" /> : initials(m.first_name, m.last_name)}
                                            </div>
                                            <div>
                                                <div className="member-name">{m.first_name} {m.last_name}</div>
                                                <div className="member-email">{m.email}</div>
                                            </div>
                                        </div>
                                        <button className="member-remove-btn" onClick={() => handleRemoveUser(m.id, `${m.first_name} ${m.last_name}`)}>
                                            <Trash2 size={13} /> Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </motion.div>
                )}

                {tab === 'history' && (
                    <motion.div key="history" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                        <Card glass>
                            <div style={{ padding: 'var(--space-lg) var(--space-xl)' }}>
                                {history.length === 0 ? (
                                    <div className="groups-page__empty" style={{ padding: 'var(--space-2xl)' }}>
                                        <History size={40} />
                                        <h3>No History</h3>
                                        <p>Attendance history will appear here.</p>
                                    </div>
                                ) : (
                                    <div className="history-list">
                                        {history.map((h, i) => (
                                            <div key={i} className="history-item" onClick={() => setAttendanceDate(h.date)}>
                                                <div className="history-item__date">
                                                    <Calendar size={16} style={{ color: 'var(--color-primary)' }} />
                                                    {fmtDate(h.date)}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <span className="history-item__group">{h.group_name}</span>
                                                    <ChevronRight size={16} style={{ color: 'var(--text-secondary)' }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {detail && (
                <AddUserModal
                    isOpen={addUserOpen}
                    onClose={() => setAddUserOpen(false)}
                    group={detail}
                    token={token}
                    users={users}
                    onAdded={fetchDetail}
                />
            )}
        </div>
    );
}

// ─── Main Groups Page ────────────────────────────────────────────────────────

export function GroupsPage() {
    const { token } = useAuthStore();
    const [groups, setGroups] = useState<Group[]>([]);
    const [users, setUsers] = useState<UserDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [createOpen, setCreateOpen] = useState(false);

    // Navigation state
    const [view, setView] = useState<'list' | 'detail' | 'attendance'>('list');
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

    // Per-group modal states
    const [activateGroup, setActivateGroup] = useState<Group | null>(null);
    const [addUserGroup, setAddUserGroup] = useState<Group | null>(null);
    const [importingId, setImportingId] = useState<string | null>(null);

    useEffect(() => {
        if (token) { fetchGroups(); fetchUsers(); }
    }, [token]);

    const fetchGroups = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const data = await groupsAPI.getAll(token);
            setGroups(data);
        } catch (err) {
            toast.error('Failed to load groups');
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        if (!token) return;
        try {
            const data = await usersAPI.getAll(token);
            setUsers(data);
        } catch { /* silent */ }
    };

    const handleImport = async (groupId: string, groupName: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !token) return;
        setImportingId(groupId);
        try {
            await groupsAPI.importUsers(groupId, file, token);
            toast.success(`Users imported into ${groupName}`);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Import failed');
        } finally {
            setImportingId(null);
            e.target.value = '';
        }
    };

    // ── Routed sub-views ──
    if (view === 'detail' && selectedGroupId) {
        return (
            <GroupDetailView
                groupId={selectedGroupId}
                token={token!}
                users={users}
                onBack={() => { setView('list'); setSelectedGroupId(null); }}
            />
        );
    }

    if (view === 'attendance') {
        return (
            <AttendanceView
                token={token!}
                onBack={() => setView('list')}
            />
        );
    }

    // ── List view ──
    return (
        <motion.div
            className="groups-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <div className="groups-page__header">
                <div>
                    <h1 className="groups-page__title">Groups</h1>
                    <p className="groups-page__subtitle">Manage and track your ushering groups</p>
                </div>
                <div className="groups-page__actions">
                    <Button variant="secondary" icon={<Activity size={18} />} onClick={() => setView('attendance')}>
                        Group Attendance
                    </Button>
                    <Button variant="primary" icon={<Plus size={18} />} onClick={() => setCreateOpen(true)}>
                        Create Group
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="groups-page__loading"><p>Loading groups...</p></div>
            ) : groups.length === 0 ? (
                <Card glass>
                    <div className="groups-page__empty">
                        <div style={{ padding: 20, borderRadius: 20, background: 'rgba(212,175,55,0.1)', color: 'var(--color-primary)' }}>
                            <Users2 size={48} />
                        </div>
                        <h3>No Groups Yet</h3>
                        <p>Get started by creating your first group.</p>
                        <Button variant="primary" icon={<Plus size={18} />} onClick={() => setCreateOpen(true)}>
                            Create First Group
                        </Button>
                    </div>
                </Card>
            ) : (
                <div className="groups-grid">
                    {groups.map((group, idx) => (
                        <motion.div
                            key={group.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.04 }}
                        >
                            <Card glass hover className="group-card" onClick={() => { setSelectedGroupId(group.id); setView('detail'); }}>
                                <div className="group-card__header">
                                    <div className="group-card__icon"><Users2 size={22} /></div>
                                    <span className={`group-card__badge ${group.is_active ? 'group-card__badge--active' : 'group-card__badge--inactive'}`}>
                                        {group.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <h3 className="group-card__name">{group.name}</h3>
                                <p className="group-card__desc">{group.description || 'No description provided'}</p>
                                <div className="group-card__meta">
                                    <Calendar size={13} />
                                    Created {fmtDate(group.created_at)}
                                </div>

                                {/* Actions — stop propagation so card click doesn't trigger */}
                                <div className="group-card__actions" onClick={e => e.stopPropagation()}>
                                    {!group.is_active && (
                                        <button className="group-card__btn group-card__btn--primary" onClick={() => setActivateGroup(group)}>
                                            <Zap size={18} /> Activate
                                        </button>
                                    )}
                                    <button className="group-card__btn" onClick={() => setAddUserGroup(group)}>
                                        <UserPlus size={18} /> Add User
                                    </button>
                                    <>
                                        <input
                                            type="file"
                                            id={`import-${group.id}`}
                                            accept=".csv"
                                            onChange={e => handleImport(group.id, group.name, e)}
                                            style={{ display: 'none' }}
                                        />
                                        <button
                                            className="group-card__btn"
                                            onClick={() => document.getElementById(`import-${group.id}`)?.click()}
                                            disabled={importingId === group.id}
                                        >
                                            <Upload size={13} /> {importingId === group.id ? 'Importing...' : 'Import'}
                                        </button>
                                    </>
                                    <button className="group-card__btn group-card__btn--primary" onClick={() => { setSelectedGroupId(group.id); setView('detail'); }}>
                                        <ChevronRight size={13} /> Details
                                    </button>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Create Group Modal */}
            {token && (
                <CreateGroupModal
                    isOpen={createOpen}
                    onClose={() => setCreateOpen(false)}
                    users={users}
                    token={token}
                    onCreated={g => setGroups(prev => [g, ...prev])}
                />
            )}

            {/* Activate Modal */}
            {activateGroup && token && (
                <ActivateModal
                    isOpen={!!activateGroup}
                    onClose={() => setActivateGroup(null)}
                    group={activateGroup}
                    token={token}
                    onActivated={id => setGroups(prev => prev.map(g => g.id === id ? { ...g, is_active: true } : g))}
                />
            )}

            {/* Add User Modal */}
            {addUserGroup && token && (
                <AddUserModal
                    isOpen={!!addUserGroup}
                    onClose={() => setAddUserGroup(null)}
                    group={addUserGroup}
                    token={token}
                    users={users}
                    onAdded={fetchGroups}
                />
            )}
        </motion.div>
    );
}
