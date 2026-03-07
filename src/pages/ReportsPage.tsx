import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart2,
    TrendingUp,
    Users,
    Award,
    AlertTriangle,
    Search,
    Filter,
    ChevronDown,
    ChevronUp,
    Download,
    RefreshCw,
    Calendar,
    Target,
    Activity,
    Star,
    X,
    CheckCircle,
    XCircle,
    ChevronsUpDown,
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
    LineChart,
    Line,
    RadialBarChart,
    RadialBar,
} from 'recharts';
import { useAuthStore } from '../stores/authStore';
import { RoleGate } from '../components/auth/RoleGate';
import { analyticsAPI } from '../services/api';
import './ReportsPage.css';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AttendanceRow {
    user: {
        id: string;
        first_name: string;
        last_name: string;
        email: string;
        role: string;
        gender?: string;
        reg_no: string;
        current_roster_hall?: string;
        avatar_url?: string | null;
        is_active?: boolean;
    };
    total_weekly_possible_attendance: number;
    total_hall_possible_attendance: number;
    total_event_possible_attendance: number;
    total_weekly_attendance_present: number;
    total_hall_attendance_present: number;
    total_event_attendance_present: number;
    total_weekly_attendance_absent: number;
    total_hall_attendance_absent: number;
    total_event_attendance_absent: number;
    attendance_rate: number;
}

interface ReportData {
    period_label: string;
    start_date: string;
    end_date: string;
    rows: AttendanceRow[];
}

type PeriodType = 'weekly' | 'monthly' | 'yearly' | 'custom';
type SortKey = keyof AttendanceRow | 'full_name' | 'role' | 'hall';
type SortDir = 'asc' | 'desc';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PIE_COLORS = ['#D4AF37', '#2E8B57', '#3B82F6', '#8B5CF6', '#EF4444', '#F59E0B'];
const RATE_COLORS = ['#EF4444', '#F59E0B', '#3B82F6', '#10B981', '#D4AF37'];

function getRateBadgeClass(rate: number): string {
    if (rate >= 90) return 'badge--gold';
    if (rate >= 75) return 'badge--green';
    if (rate >= 50) return 'badge--blue';
    if (rate >= 25) return 'badge--orange';
    return 'badge--red';
}

function getRateBucketLabel(rate: number): string {
    if (rate >= 90) return '90–100%';
    if (rate >= 75) return '75–89%';
    if (rate >= 50) return '50–74%';
    if (rate >= 25) return '25–49%';
    return '0–24%';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface MetricCardProps {
    label: string;
    value: string | number;
    sub?: string;
    icon: React.ElementType;
    accent: string;
    delay?: number;
}
function MetricCard({ label, value, sub, icon: Icon, accent, delay = 0 }: MetricCardProps) {
    return (
        <motion.div
            className={`rp-metric-card rp-metric-card--${accent}`}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
        >
            <div className="rp-metric-card__icon-wrap">
                <Icon size={22} />
            </div>
            <div className="rp-metric-card__body">
                <span className="rp-metric-card__value">{value}</span>
                <span className="rp-metric-card__label">{label}</span>
                {sub && <span className="rp-metric-card__sub">{sub}</span>}
            </div>
        </motion.div>
    );
}

// Custom tooltip for recharts
interface TooltipEntry {
    name?: string;
    value?: number | string;
    color?: string;
    fill?: string;
}
interface CustomTooltipProps {
    active?: boolean;
    payload?: TooltipEntry[];
    label?: string;
}
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
        return (
            <div className="rp-tooltip">
                {label && <p className="rp-tooltip__label">{label}</p>}
                {payload.map((entry, i: number) => (
                    <p key={i} className="rp-tooltip__item" style={{ color: entry.color || entry.fill }}>
                        {entry.name}: <strong>{typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}</strong>
                        {entry.name?.toLowerCase().includes('rate') ? '%' : ''}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

// ─── Main Component ───────────────────────────────────────────────────────────

function ReportsPageContent() {
    const { token } = useAuthStore();

    // ── Period state ──
    const [period, setPeriod] = useState<PeriodType>('monthly');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [periodOpen, setPeriodOpen] = useState(false);
    const periodRef = useRef<HTMLDivElement>(null);

    // ── Data state ──
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ── Table state ──
    const [search, setSearch] = useState('');
    const [filterOpen, setFilterOpen] = useState(false);
    const [filterRole, setFilterRole] = useState<string>('');
    const [filterGender, setFilterGender] = useState<string>('');
    const [filterRateMin, setFilterRateMin] = useState<number>(0);
    const [filterRateMax, setFilterRateMax] = useState<number>(100);
    const [filterHall, setFilterHall] = useState<string>('');
    const [sortKey, setSortKey] = useState<SortKey>('attendance_rate');
    const [sortDir, setSortDir] = useState<SortDir>('desc');
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 15;

    // ── Fetch data ──
    const fetchReport = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (period === 'custom') {
                if (customStart) params.append('start_date', customStart);
                if (customEnd) params.append('end_date', customEnd);
            } else {
                params.append('period', period);
            }
            const data = await analyticsAPI.getAttendanceReport(token, params.toString());
            setReportData(data.data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to load report');
        } finally {
            setLoading(false);
        }
    }, [token, period, customStart, customEnd]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    // Close dropdowns on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (periodRef.current && !periodRef.current.contains(e.target as Node)) {
                setPeriodOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // ── Derived metrics (memoized) ──
    const metrics = useMemo(() => {
        if (!reportData?.rows.length) return null;
        const rows = reportData.rows;
        const total = rows.length;
        const avgRate = rows.reduce((s, r) => s + r.attendance_rate, 0) / total;
        const sorted = [...rows].sort((a, b) => b.attendance_rate - a.attendance_rate);
        const top = sorted[0];
        const bottom = sorted[sorted.length - 1];

        const totalPresent = rows.reduce((s, r) =>
            s + r.total_weekly_attendance_present + r.total_hall_attendance_present + r.total_event_attendance_present, 0);
        const totalPossible = rows.reduce((s, r) =>
            s + r.total_weekly_possible_attendance + r.total_hall_possible_attendance + r.total_event_possible_attendance, 0);

        return { total, avgRate, top, bottom, totalPresent, totalPossible };
    }, [reportData]);

    // ── Chart data (memoized) ──
    const distributionData = useMemo(() => {
        if (!reportData?.rows.length) return [];
        const buckets: Record<string, number> = {
            '90–100%': 0, '75–89%': 0, '50–74%': 0, '25–49%': 0, '0–24%': 0,
        };
        reportData.rows.forEach(r => {
            buckets[getRateBucketLabel(r.attendance_rate)]++;
        });
        return Object.entries(buckets).map(([name, count]) => ({ name, count }));
    }, [reportData]);

    const categoryData = useMemo(() => {
        if (!reportData?.rows.length) return [];
        const rows = reportData.rows;
        return [
            {
                name: 'Main Service',
                Present: rows.reduce((s, r) => s + r.total_weekly_attendance_present, 0),
                Absent: rows.reduce((s, r) => s + r.total_weekly_attendance_absent, 0),
            },
            {
                name: 'Hall',
                Present: rows.reduce((s, r) => s + r.total_hall_attendance_present, 0),
                Absent: rows.reduce((s, r) => s + r.total_hall_attendance_absent, 0),
            },
            {
                name: 'Event',
                Present: rows.reduce((s, r) => s + r.total_event_attendance_present, 0),
                Absent: rows.reduce((s, r) => s + r.total_event_attendance_absent, 0),
            },
        ];
    }, [reportData]);

    const pieData = useMemo(() => {
        if (!reportData?.rows.length) return [];
        const hallMap: Record<string, number> = {};
        reportData.rows.forEach(r => {
            const hall = r.user.current_roster_hall || 'Unassigned';
            hallMap[hall] = (hallMap[hall] || 0) + 1;
        });
        return Object.entries(hallMap).map(([name, value]) => ({ name, value }));
    }, [reportData]);

    const roleDistData = useMemo(() => {
        if (!reportData?.rows.length) return [];
        const roleMap: Record<string, { count: number; totalRate: number }> = {};
        reportData.rows.forEach(r => {
            const role = r.user.role || 'Unknown';
            if (!roleMap[role]) roleMap[role] = { count: 0, totalRate: 0 };
            roleMap[role].count++;
            roleMap[role].totalRate += r.attendance_rate;
        });
        return Object.entries(roleMap).map(([role, d]) => ({
            name: role,
            avgRate: d.totalRate / d.count,
            count: d.count,
        }));
    }, [reportData]);

    const topPerformers = useMemo(() => {
        if (!reportData?.rows.length) return [];
        return [...reportData.rows]
            .sort((a, b) => b.attendance_rate - a.attendance_rate)
            .slice(0, 5);
    }, [reportData]);

    const bottomPerformers = useMemo(() => {
        if (!reportData?.rows.length) return [];
        return [...reportData.rows]
            .sort((a, b) => a.attendance_rate - b.attendance_rate)
            .slice(0, 5);
    }, [reportData]);

    // ── Unique filter options ──
    const filterOptions = useMemo(() => {
        if (!reportData?.rows.length) return { roles: [], genders: [], halls: [] };
        const roles = [...new Set(reportData.rows.map(r => r.user.role))];
        const genders = [...new Set(reportData.rows.map(r => r.user.gender || 'N/A'))];
        const halls = [...new Set(reportData.rows.map(r => r.user.current_roster_hall || 'Unassigned'))];
        return { roles, genders, halls };
    }, [reportData]);

    // ── Filtered & sorted rows ──
    const filteredRows = useMemo(() => {
        if (!reportData?.rows.length) return [];
        let rows = reportData.rows;

        // Search
        if (search.trim()) {
            const q = search.toLowerCase();
            rows = rows.filter(r =>
                `${r.user.first_name} ${r.user.last_name}`.toLowerCase().includes(q) ||
                r.user.reg_no.toLowerCase().includes(q) ||
                r.user.email.toLowerCase().includes(q) ||
                r.user.role.toLowerCase().includes(q)
            );
        }

        // Filters
        if (filterRole) rows = rows.filter(r => r.user.role === filterRole);
        if (filterGender) rows = rows.filter(r => (r.user.gender || 'N/A') === filterGender);
        if (filterHall) rows = rows.filter(r => (r.user.current_roster_hall || 'Unassigned') === filterHall);
        rows = rows.filter(r => r.attendance_rate >= filterRateMin && r.attendance_rate <= filterRateMax);

        // Sort
        rows = [...rows].sort((a, b) => {
            let valA: string | number;
            let valB: string | number;

            if (sortKey === 'full_name') {
                valA = `${a.user.first_name} ${a.user.last_name}`;
                valB = `${b.user.first_name} ${b.user.last_name}`;
            } else if (sortKey === 'role') {
                valA = a.user.role;
                valB = b.user.role;
            } else if (sortKey === 'hall') {
                valA = a.user.current_roster_hall || '';
                valB = b.user.current_roster_hall || '';
            } else {
                const key = sortKey as keyof AttendanceRow;
                valA = a[key] as string | number;
                valB = b[key] as string | number;
            }

            if (typeof valA === 'string' && typeof valB === 'string') {
                return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            }
            const numA = typeof valA === 'number' ? valA : 0;
            const numB = typeof valB === 'number' ? valB : 0;
            return sortDir === 'asc' ? numA - numB : numB - numA;
        });

        return rows;
    }, [reportData, search, filterRole, filterGender, filterHall, filterRateMin, filterRateMax, sortKey, sortDir]);

    const totalPages = Math.ceil(filteredRows.length / PAGE_SIZE);
    const pagedRows = useMemo(() => {
        return filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    }, [filteredRows, page]);

    const handleSort = useCallback((key: SortKey) => {
        setSortKey(prev => {
            if (prev === key) {
                setSortDir(d => d === 'asc' ? 'desc' : 'asc');
                return prev;
            }
            setSortDir('desc');
            return key;
        });
        setPage(1);
    }, []);

    const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(1);
    }, []);

    const clearFilters = useCallback(() => {
        setFilterRole('');
        setFilterGender('');
        setFilterHall('');
        setFilterRateMin(0);
        setFilterRateMax(100);
        setSearch('');
        setPage(1);
    }, []);

    const activeFilterCount = useMemo(() => {
        let n = 0;
        if (filterRole) n++;
        if (filterGender) n++;
        if (filterHall) n++;
        if (filterRateMin > 0 || filterRateMax < 100) n++;
        return n;
    }, [filterRole, filterGender, filterHall, filterRateMin, filterRateMax]);

    const SortIcon = ({ col }: { col: SortKey }) => {
        if (sortKey !== col) return <ChevronsUpDown size={14} className="rp-th-sort-icon rp-th-sort-icon--inactive" />;
        return sortDir === 'asc'
            ? <ChevronUp size={14} className="rp-th-sort-icon rp-th-sort-icon--active" />
            : <ChevronDown size={14} className="rp-th-sort-icon rp-th-sort-icon--active" />;
    };

    const exportCSV = useCallback(() => {
        if (!filteredRows.length) return;
        const headers = [
            'Full Name', 'Reg No', 'Role', 'Gender', 'Hall',
            'Weekly Possible', 'Hall Possible', 'Event Possible',
            'Weekly Present', 'Hall Present', 'Event Present',
            'Weekly Absent', 'Hall Absent', 'Event Absent',
            'Attendance Rate (%)',
        ];
        const rows = filteredRows.map(r => [
            `${r.user.first_name} ${r.user.last_name}`,
            r.user.reg_no,
            r.user.role,
            r.user.gender || 'N/A',
            r.user.current_roster_hall || 'Unassigned',
            r.total_weekly_possible_attendance,
            r.total_hall_possible_attendance,
            r.total_event_possible_attendance,
            r.total_weekly_attendance_present,
            r.total_hall_attendance_present,
            r.total_event_attendance_present,
            r.total_weekly_attendance_absent,
            r.total_hall_attendance_absent,
            r.total_event_attendance_absent,
            r.attendance_rate.toFixed(1),
        ]);
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance-report-${reportData?.period_label || 'export'}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }, [filteredRows, reportData]);

    // ── Period picker ──
    const PERIOD_OPTIONS: { label: string; value: PeriodType }[] = [
        { label: 'This Week', value: 'weekly' },
        { label: 'This Month', value: 'monthly' },
        { label: 'This Year', value: 'yearly' },
        { label: 'Custom Range', value: 'custom' },
    ];

    // ── Radial data for avg rate ──
    const radialData = useMemo(() => {
        if (!metrics) return [];
        return [{ name: 'Avg Rate', value: metrics.avgRate, fill: '#D4AF37' }];
    }, [metrics]);

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <motion.div
            className="rp"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35 }}
        >
            {/* ── Header ── */}
            <div className="rp__header">
                <div className="rp__header-left">
                    <div className="rp__header-icon">
                        <BarChart2 size={26} />
                    </div>
                    <div>
                        <h1 className="rp__title">Reports &amp; Analytics</h1>
                        <p className="rp__subtitle">
                            {reportData
                                ? `${reportData.period_label} · ${reportData.start_date} → ${reportData.end_date}`
                                : 'Comprehensive attendance intelligence'}
                        </p>
                    </div>
                </div>

                <div className="rp__header-actions">
                    {/* Period Picker */}
                    <div className="rp-period-picker" ref={periodRef}>
                        <button
                            className="rp-period-picker__btn"
                            onClick={() => setPeriodOpen(o => !o)}
                        >
                            <Calendar size={16} />
                            <span>{PERIOD_OPTIONS.find(p => p.value === period)?.label}</span>
                            <ChevronDown size={14} className={periodOpen ? 'rp-chevron--open' : ''} />
                        </button>
                        <AnimatePresence>
                            {periodOpen && (
                                <motion.div
                                    className="rp-period-picker__dropdown"
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.18 }}
                                >
                                    {PERIOD_OPTIONS.map(opt => (
                                        <button
                                            key={opt.value}
                                            className={`rp-period-picker__option ${period === opt.value ? 'rp-period-picker__option--active' : ''}`}
                                            onClick={() => {
                                                setPeriod(opt.value);
                                                setPeriodOpen(false);
                                            }}
                                        >
                                            {opt.label}
                                            {period === opt.value && <CheckCircle size={14} />}
                                        </button>
                                    ))}
                                    {period === 'custom' && (
                                        <div className="rp-period-picker__custom">
                                            <input
                                                type="date"
                                                value={customStart}
                                                onChange={e => setCustomStart(e.target.value)}
                                                className="rp-date-input"
                                            />
                                            <span className="rp-period-picker__range-sep">→</span>
                                            <input
                                                type="date"
                                                value={customEnd}
                                                onChange={e => setCustomEnd(e.target.value)}
                                                className="rp-date-input"
                                            />
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button
                        className="rp-icon-btn"
                        onClick={fetchReport}
                        disabled={loading}
                        title="Refresh"
                    >
                        <RefreshCw size={16} className={loading ? 'rp-spin' : ''} />
                    </button>
                    <button className="rp-icon-btn rp-icon-btn--gold" onClick={exportCSV} title="Export CSV">
                        <Download size={16} />
                        <span>Export</span>
                    </button>
                </div>
            </div>

            {/* ── Loading / Error ── */}
            {loading && (
                <div className="rp__loading">
                    <div className="rp__loading-spinner" />
                    <p>Generating report…</p>
                </div>
            )}
            {error && !loading && (
                <div className="rp__error">
                    <AlertTriangle size={20} />
                    <p>{error}</p>
                    <button onClick={fetchReport}>Retry</button>
                </div>
            )}

            {!loading && !error && reportData && (
                <>
                    {/* ── Metric Cards ── */}
                    <div className="rp__metrics">
                        <MetricCard
                            label="Total Members"
                            value={metrics?.total ?? 0}
                            sub="in this period"
                            icon={Users}
                            accent="blue"
                            delay={0}
                        />
                        <MetricCard
                            label="Avg Attendance Rate"
                            value={`${(metrics?.avgRate ?? 0).toFixed(1)}%`}
                            sub="across all members"
                            icon={TrendingUp}
                            accent="gold"
                            delay={0.05}
                        />
                        <MetricCard
                            label="Top Performer"
                            value={metrics?.top ? `${metrics.top.user.first_name} ${metrics.top.user.last_name}` : '—'}
                            sub={metrics?.top ? `${metrics.top.attendance_rate.toFixed(1)}% rate` : ''}
                            icon={Award}
                            accent="green"
                            delay={0.1}
                        />
                        <MetricCard
                            label="Needs Attention"
                            value={metrics?.bottom ? `${metrics.bottom.user.first_name} ${metrics.bottom.user.last_name}` : '—'}
                            sub={metrics?.bottom ? `${metrics.bottom.attendance_rate.toFixed(1)}% rate` : ''}
                            icon={AlertTriangle}
                            accent="red"
                            delay={0.15}
                        />
                        <MetricCard
                            label="Total Present"
                            value={metrics?.totalPresent ?? 0}
                            sub={`of ${metrics?.totalPossible ?? 0} possible`}
                            icon={CheckCircle}
                            accent="teal"
                            delay={0.2}
                        />
                        <MetricCard
                            label="Total Absent"
                            value={(metrics?.totalPossible ?? 0) - (metrics?.totalPresent ?? 0)}
                            sub="sessions missed"
                            icon={XCircle}
                            accent="pink"
                            delay={0.25}
                        />
                    </div>

                    {/* ── Charts Row 1 ── */}
                    <div className="rp__charts-row">
                        {/* Category Bar Chart */}
                        <motion.div
                            className="rp-chart-card rp-chart-card--wide"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.45, delay: 0.1 }}
                        >
                            <div className="rp-chart-card__header">
                                <div>
                                    <h3 className="rp-chart-card__title">Attendance by Category</h3>
                                    <p className="rp-chart-card__sub">Weekly · Hall · Event breakdown</p>
                                </div>
                                <Activity size={18} className="rp-chart-card__icon" />
                            </div>
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={categoryData} barCategoryGap="30%">
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                    <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fontSize: 13 }} />
                                    <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 12 }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: 13 }} />
                                    <Bar dataKey="Present" fill="#2E8B57" radius={[6, 6, 0, 0]} />
                                    <Bar dataKey="Absent" fill="#B22222" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </motion.div>

                        {/* Distribution PieChart */}
                        <motion.div
                            className="rp-chart-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.45, delay: 0.15 }}
                        >
                            <div className="rp-chart-card__header">
                                <div>
                                    <h3 className="rp-chart-card__title">Hall Distribution</h3>
                                    <p className="rp-chart-card__sub">Members per hall</p>
                                </div>
                                <Target size={18} className="rp-chart-card__icon" />
                            </div>
                            <ResponsiveContainer width="100%" height={260}>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={90}
                                        innerRadius={48}
                                        paddingAngle={3}
                                        label={(entry: any) => {
                                            const percent = entry.percent;
                                            return percent && percent > 0.05 ? `${entry.name} (${(percent * 100).toFixed(0)}%)` : '';
                                        }}
                                        labelLine={false}
                                    >
                                        {pieData.map((_, i) => (
                                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </motion.div>
                    </div>

                    {/* ── Charts Row 2 ── */}
                    <div className="rp__charts-row">
                        {/* Rate Distribution Bar */}
                        <motion.div
                            className="rp-chart-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.45, delay: 0.2 }}
                        >
                            <div className="rp-chart-card__header">
                                <div>
                                    <h3 className="rp-chart-card__title">Rate Distribution</h3>
                                    <p className="rp-chart-card__sub">Members per rate bucket</p>
                                </div>
                                <BarChart2 size={18} className="rp-chart-card__icon" />
                            </div>
                            <ResponsiveContainer width="100%" height={240}>
                                <BarChart data={distributionData} layout="vertical" barCategoryGap="20%">
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                                    <XAxis type="number" stroke="var(--text-secondary)" tick={{ fontSize: 12 }} />
                                    <YAxis dataKey="name" type="category" stroke="var(--text-secondary)" tick={{ fontSize: 12 }} width={60} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="count" radius={[0, 6, 6, 0]} label={{ position: 'right', fontSize: 12, fill: 'var(--text-secondary)' }}>
                                        {distributionData.map((_, i) => (
                                            <Cell key={i} fill={RATE_COLORS[i % RATE_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </motion.div>

                        {/* Role avg rate line */}
                        <motion.div
                            className="rp-chart-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.45, delay: 0.25 }}
                        >
                            <div className="rp-chart-card__header">
                                <div>
                                    <h3 className="rp-chart-card__title">Rate by Role</h3>
                                    <p className="rp-chart-card__sub">Avg attendance per role</p>
                                </div>
                                <Star size={18} className="rp-chart-card__icon" />
                            </div>
                            <ResponsiveContainer width="100%" height={240}>
                                <LineChart data={roleDistData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                    <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fontSize: 13 }} />
                                    <YAxis domain={[0, 100]} stroke="var(--text-secondary)" tick={{ fontSize: 12 }} unit="%" />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Line
                                        type="monotone"
                                        dataKey="avgRate"
                                        name="Avg Rate"
                                        stroke="#D4AF37"
                                        strokeWidth={3}
                                        dot={{ fill: '#D4AF37', r: 5 }}
                                        activeDot={{ r: 7 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </motion.div>

                        {/* Radial gauge */}
                        <motion.div
                            className="rp-chart-card rp-chart-card--gauge"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.45, delay: 0.3 }}
                        >
                            <div className="rp-chart-card__header">
                                <div>
                                    <h3 className="rp-chart-card__title">Overall Rate</h3>
                                    <p className="rp-chart-card__sub">Aggregate attendance</p>
                                </div>
                                <Target size={18} className="rp-chart-card__icon" />
                            </div>
                            <div className="rp-gauge-wrap">
                                <ResponsiveContainer width="100%" height={200}>
                                    <RadialBarChart
                                        cx="50%"
                                        cy="55%"
                                        innerRadius="60%"
                                        outerRadius="90%"
                                        barSize={14}
                                        data={radialData}
                                        startAngle={180}
                                        endAngle={0}
                                    >
                                        <RadialBar
                                            background={{ fill: 'rgba(255,255,255,0.06)' }}
                                            dataKey="value"
                                            cornerRadius={8}
                                            max={100}
                                        />
                                    </RadialBarChart>
                                </ResponsiveContainer>
                                <div className="rp-gauge-label">
                                    <span className="rp-gauge-value">{(metrics?.avgRate ?? 0).toFixed(1)}%</span>
                                    <span className="rp-gauge-sub">Average Rate</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* ── Top / Bottom Performers ── */}
                    <div className="rp__performer-row">
                        <motion.div
                            className="rp-performer-card"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.45, delay: 0.3 }}
                        >
                            <div className="rp-performer-card__header">
                                <Award size={18} className="rp-performer-card__icon rp-performer-card__icon--gold" />
                                <h3 className="rp-performer-card__title">Top Performers</h3>
                            </div>
                            <div className="rp-performer-list">
                                {topPerformers.map((r, i) => (
                                    <div key={r.user.id} className="rp-performer-item">
                                        <span className={`rp-performer-rank rp-performer-rank--${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : 'default'}`}>
                                            #{i + 1}
                                        </span>
                                        <div className="rp-performer-avatar">
                                            {r.user.avatar_url ? (
                                                <img src={r.user.avatar_url} alt={r.user.first_name} />
                                            ) : (
                                                <span>{r.user.first_name[0]}{r.user.last_name[0]}</span>
                                            )}
                                        </div>
                                        <div className="rp-performer-info">
                                            <span className="rp-performer-name">{r.user.first_name} {r.user.last_name}</span>
                                            <span className="rp-performer-sub">{r.user.reg_no} · {r.user.role}</span>
                                        </div>
                                        <span className={`rp-rate-badge ${getRateBadgeClass(r.attendance_rate)}`}>
                                            {r.attendance_rate.toFixed(1)}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div
                            className="rp-performer-card"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.45, delay: 0.35 }}
                        >
                            <div className="rp-performer-card__header">
                                <AlertTriangle size={18} className="rp-performer-card__icon rp-performer-card__icon--red" />
                                <h3 className="rp-performer-card__title">Needs Attention</h3>
                            </div>
                            <div className="rp-performer-list">
                                {bottomPerformers.map((r, i) => (
                                    <div key={r.user.id} className="rp-performer-item">
                                        <span className="rp-performer-rank rp-performer-rank--default">#{i + 1}</span>
                                        <div className="rp-performer-avatar rp-performer-avatar--red">
                                            {r.user.avatar_url ? (
                                                <img src={r.user.avatar_url} alt={r.user.first_name} />
                                            ) : (
                                                <span>{r.user.first_name[0]}{r.user.last_name[0]}</span>
                                            )}
                                        </div>
                                        <div className="rp-performer-info">
                                            <span className="rp-performer-name">{r.user.first_name} {r.user.last_name}</span>
                                            <span className="rp-performer-sub">{r.user.reg_no} · {r.user.role}</span>
                                        </div>
                                        <span className={`rp-rate-badge ${getRateBadgeClass(r.attendance_rate)}`}>
                                            {r.attendance_rate.toFixed(1)}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    {/* ── Table Section ── */}
                    <motion.div
                        className="rp-table-section"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        {/* Table toolbar */}
                        <div className="rp-table-toolbar">
                            <div className="rp-table-toolbar__left">
                                <h3 className="rp-table-toolbar__title">Member Records</h3>
                                <span className="rp-table-toolbar__count">{filteredRows.length} results</span>
                            </div>
                            <div className="rp-table-toolbar__right">
                                {/* Search */}
                                <div className="rp-search-wrap">
                                    <Search size={15} className="rp-search-icon" />
                                    <input
                                        type="text"
                                        placeholder="Search name, reg no, email…"
                                        value={search}
                                        onChange={handleSearch}
                                        className="rp-search-input"
                                    />
                                    {search && (
                                        <button className="rp-search-clear" onClick={() => { setSearch(''); setPage(1); }}>
                                            <X size={13} />
                                        </button>
                                    )}
                                </div>

                                {/* Filter button */}
                                <div className="rp-filter-wrap">
                                    <button
                                        className={`rp-filter-btn ${filterOpen ? 'rp-filter-btn--open' : ''} ${activeFilterCount > 0 ? 'rp-filter-btn--active' : ''}`}
                                        onClick={() => setFilterOpen(o => !o)}
                                    >
                                        <Filter size={15} />
                                        <span>Filters</span>
                                        {activeFilterCount > 0 && (
                                            <span className="rp-filter-badge">{activeFilterCount}</span>
                                        )}
                                    </button>

                                    <AnimatePresence>
                                        {filterOpen && (
                                            <motion.div
                                                className="rp-filter-panel"
                                                initial={{ opacity: 0, y: -10, scale: 0.97 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: -10, scale: 0.97 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <div className="rp-filter-panel__header">
                                                    <span>Filter Options</span>
                                                    <button onClick={clearFilters} className="rp-filter-panel__clear">Clear all</button>
                                                </div>

                                                <div className="rp-filter-grid">
                                                    <div className="rp-filter-group">
                                                        <label>Role</label>
                                                        <select value={filterRole} onChange={e => { setFilterRole(e.target.value); setPage(1); }}>
                                                            <option value="">All Roles</option>
                                                            {filterOptions.roles.map(r => (
                                                                <option key={r} value={r}>{r}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="rp-filter-group">
                                                        <label>Gender</label>
                                                        <select value={filterGender} onChange={e => { setFilterGender(e.target.value); setPage(1); }}>
                                                            <option value="">All Genders</option>
                                                            {filterOptions.genders.map(g => (
                                                                <option key={g} value={g}>{g}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="rp-filter-group">
                                                        <label>Hall</label>
                                                        <select value={filterHall} onChange={e => { setFilterHall(e.target.value); setPage(1); }}>
                                                            <option value="">All Halls</option>
                                                            {filterOptions.halls.map(h => (
                                                                <option key={h} value={h}>{h}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="rp-filter-group rp-filter-group--range">
                                                        <label>Attendance Rate: {filterRateMin}% – {filterRateMax}%</label>
                                                        <div className="rp-range-row">
                                                            <input
                                                                type="range" min={0} max={100} step={5}
                                                                value={filterRateMin}
                                                                onChange={e => { setFilterRateMin(Number(e.target.value)); setPage(1); }}
                                                            />
                                                            <input
                                                                type="range" min={0} max={100} step={5}
                                                                value={filterRateMax}
                                                                onChange={e => { setFilterRateMax(Number(e.target.value)); setPage(1); }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="rp-table-wrap">
                            <table className="rp-table">
                                <thead>
                                    {/* Group header row */}
                                    <tr className="rp-thead-group">
                                        <th className="rp-th rp-th--group" colSpan={4}></th>
                                        <th className="rp-th rp-th--group rp-th--group-weekly" colSpan={3}>Main Services</th>
                                        <th className="rp-th rp-th--group rp-th--group-hall" colSpan={3}>Hall Cleaning</th>
                                        <th className="rp-th rp-th--group rp-th--group-event" colSpan={3}>Events</th>
                                        <th className="rp-th rp-th--group" colSpan={1}></th>
                                    </tr>
                                    {/* Column header row */}
                                    <tr>
                                        <th className="rp-th rp-th--sortable" onClick={() => handleSort('full_name')}>
                                            Full Name <SortIcon col="full_name" />
                                        </th>
                                        <th className="rp-th">Reg No</th>
                                        <th className="rp-th rp-th--sortable" onClick={() => handleSort('role')}>
                                            Role <SortIcon col="role" />
                                        </th>
                                        <th className="rp-th rp-th--sortable" onClick={() => handleSort('hall')}>
                                            Hall <SortIcon col="hall" />
                                        </th>
                                        <th className="rp-th rp-th--num rp-th--sortable" onClick={() => handleSort('total_weekly_possible_attendance')} title="Total main services possible">
                                            Possible <SortIcon col="total_weekly_possible_attendance" />
                                        </th>
                                        <th className="rp-th rp-th--num rp-th--sortable rp-th--present" onClick={() => handleSort('total_weekly_attendance_present')} title="Main services attended">
                                            Present <SortIcon col="total_weekly_attendance_present" />
                                        </th>
                                        <th className="rp-th rp-th--num rp-th--sortable rp-th--absent" onClick={() => handleSort('total_weekly_attendance_absent')} title="Main services missed">
                                            Absent <SortIcon col="total_weekly_attendance_absent" />
                                        </th>
                                        <th className="rp-th rp-th--num rp-th--sortable" onClick={() => handleSort('total_hall_possible_attendance')} title="Total hall cleaning sessions possible">
                                            Possible <SortIcon col="total_hall_possible_attendance" />
                                        </th>
                                        <th className="rp-th rp-th--num rp-th--sortable rp-th--present" onClick={() => handleSort('total_hall_attendance_present')} title="Hall cleaning sessions attended">
                                            Present <SortIcon col="total_hall_attendance_present" />
                                        </th>
                                        <th className="rp-th rp-th--num rp-th--sortable rp-th--absent" onClick={() => handleSort('total_hall_attendance_absent')} title="Hall cleaning sessions missed">
                                            Absent <SortIcon col="total_hall_attendance_absent" />
                                        </th>
                                        <th className="rp-th rp-th--num rp-th--sortable" onClick={() => handleSort('total_event_possible_attendance')} title="Total events possible">
                                            Possible <SortIcon col="total_event_possible_attendance" />
                                        </th>
                                        <th className="rp-th rp-th--num rp-th--sortable rp-th--present" onClick={() => handleSort('total_event_attendance_present')} title="Events attended">
                                            Present <SortIcon col="total_event_attendance_present" />
                                        </th>
                                        <th className="rp-th rp-th--num rp-th--sortable rp-th--absent" onClick={() => handleSort('total_event_attendance_absent')} title="Events missed">
                                            Absent <SortIcon col="total_event_attendance_absent" />
                                        </th>
                                        <th className="rp-th rp-th--num rp-th--sortable rp-th--rate" onClick={() => handleSort('attendance_rate')}>
                                            Overall Rate <SortIcon col="attendance_rate" />
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pagedRows.length === 0 ? (
                                        <tr>
                                            <td colSpan={14} className="rp-td-empty">
                                                <div className="rp-empty-state">
                                                    <Search size={32} />
                                                    <p>No records match your filters.</p>
                                                    <button onClick={clearFilters}>Clear filters</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        pagedRows.map((row, idx) => (
                                            <motion.tr
                                                key={row.user.id}
                                                className="rp-tr"
                                                initial={{ opacity: 0, x: -8 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.2, delay: idx * 0.02 }}
                                            >
                                                <td className="rp-td rp-td--name">
                                                    <div className="rp-user-cell">
                                                        <div className="rp-user-cell__avatar">
                                                            {row.user.avatar_url ? (
                                                                <img src={row.user.avatar_url} alt={row.user.first_name} />
                                                            ) : (
                                                                <span>{row.user.first_name[0]}{row.user.last_name[0]}</span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <span className="rp-user-cell__name">{row.user.first_name} {row.user.last_name}</span>
                                                            <span className="rp-user-cell__email">{row.user.email}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="rp-td"><span className="rp-mono">{row.user.reg_no}</span></td>
                                                <td className="rp-td">
                                                    <span className={`rp-role-badge rp-role-badge--${row.user.role.toLowerCase()}`}>
                                                        {row.user.role}
                                                    </span>
                                                </td>
                                                <td className="rp-td rp-td--hall">{row.user.current_roster_hall || 'Unassigned'}</td>
                                                <td className="rp-td rp-td--num">{row.total_weekly_possible_attendance}</td>
                                                <td className="rp-td rp-td--num rp-td--present">{row.total_weekly_attendance_present}</td>
                                                <td className="rp-td rp-td--num rp-td--absent">{row.total_weekly_attendance_absent}</td>
                                                <td className="rp-td rp-td--num">{row.total_hall_possible_attendance}</td>
                                                <td className="rp-td rp-td--num rp-td--present">{row.total_hall_attendance_present}</td>
                                                <td className="rp-td rp-td--num rp-td--absent">{row.total_hall_attendance_absent}</td>
                                                <td className="rp-td rp-td--num">{row.total_event_possible_attendance}</td>
                                                <td className="rp-td rp-td--num rp-td--present">{row.total_event_attendance_present}</td>
                                                <td className="rp-td rp-td--num rp-td--absent">{row.total_event_attendance_absent}</td>
                                                <td className="rp-td rp-td--num">
                                                    <div className="rp-rate-cell">
                                                        <span className={`rp-rate-badge ${getRateBadgeClass(row.attendance_rate)}`}>
                                                            {row.attendance_rate.toFixed(1)}%
                                                        </span>
                                                        <div className="rp-rate-bar">
                                                            <div
                                                                className="rp-rate-bar__fill"
                                                                style={{ width: `${row.attendance_rate}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="rp-pagination">
                                <span className="rp-pagination__info">
                                    Page {page} of {totalPages} ({filteredRows.length} records)
                                </span>
                                <div className="rp-pagination__controls">
                                    <button
                                        className="rp-pagination__btn"
                                        onClick={() => setPage(1)}
                                        disabled={page === 1}
                                    >«</button>
                                    <button
                                        className="rp-pagination__btn"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                    >‹</button>
                                    {(() => {
                                        // Build a window of up to 5 unique page numbers centred on current page
                                        const half = 2;
                                        let start = Math.max(1, page - half);
                                        let end = Math.min(totalPages, page + half);
                                        // Slide window so it always fills 5 slots where possible
                                        if (end - start < 4) {
                                            if (start === 1) end = Math.min(totalPages, start + 4);
                                            else start = Math.max(1, end - 4);
                                        }
                                        const pages: number[] = [];
                                        for (let p = start; p <= end; p++) pages.push(p);
                                        return pages.map(p => (
                                            <button
                                                key={p}
                                                className={`rp-pagination__btn ${p === page ? 'rp-pagination__btn--active' : ''}`}
                                                onClick={() => setPage(p)}
                                            >{p}</button>
                                        ));
                                    })()}
                                    <button
                                        className="rp-pagination__btn"
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                    >›</button>
                                    <button
                                        className="rp-pagination__btn"
                                        onClick={() => setPage(totalPages)}
                                        disabled={page === totalPages}
                                    >»</button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </>
            )}

            {!loading && !error && !reportData && (
                <div className="rp__empty-page">
                    <BarChart2 size={48} />
                    <h2>No Report Data</h2>
                    <p>Select a period and refresh to load analytics.</p>
                    <button onClick={fetchReport}>Load Report</button>
                </div>
            )}
        </motion.div>
    );
}

export function ReportsPage() {
    return (
        <RoleGate allowedRoles={['Admin']}>
            <ReportsPageContent />
        </RoleGate>
    );
}
