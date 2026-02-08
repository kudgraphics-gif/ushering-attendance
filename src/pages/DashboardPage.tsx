import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    TrendingUp,
    Users,
    Calendar,
    CheckCircle,
    ArrowUp,
    ArrowDown,
    Cake,
    UserX
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { analyticsAPI, eventsAPI } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { mockDashboardStats, mockAttendanceTrends } from '../mock/data';
import type { UserDto, Event } from '../types';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';
import './DashboardPage.css';

interface StatCardProps {
    title: string;
    value: string | number;
    trend?: number;
    icon: React.ElementType;
    color: string;
}

function StatCard({ title, value, trend, icon: Icon, color }: StatCardProps) {
    const isPositive = trend && trend > 0;

    return (
        <Card glass hover padding="lg" className="stat-card">
            <div className="stat-card__header">
                <div className={`stat-card__icon stat-card__icon--${color}`}>
                    <Icon size={24} />
                </div>
                {trend !== undefined && (
                    <div className={`stat-card__trend ${isPositive ? 'stat-card__trend--up' : 'stat-card__trend--down'}`}>
                        {isPositive ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            <div className="stat-card__content">
                <h3 className="stat-card__value">{value}</h3>
                <p className="stat-card__title">{title}</p>
            </div>
        </Card>
    );
}

export function DashboardPage() {
    const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
    const [allUsers, setAllUsers] = useState<UserDto[]>([]);
    const [upcomingBirthdays, setUpcomingBirthdays] = useState<UserDto[]>([]);
    const [attendanceRates, setAttendanceRates] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { token, user } = useAuthStore();

    useEffect(() => {
        fetchData();
    }, [token]);

    const fetchData = async () => {
        if (!token) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            // Fetch events
            try {
                const eventsData = await eventsAPI.getUpcoming(token);
                setUpcomingEvents(eventsData.slice(0, 3));
            } catch (error) {
                console.error('Failed to fetch events:', error);
                setUpcomingEvents([]);
            }

            // Fetch users through analytics
            try {
                const analyticsData = await analyticsAPI.getTotalUsers(token);
                setAllUsers(analyticsData.data);
            } catch (error) {
                console.error('Failed to fetch users:', error);
                setAllUsers([]);
            }

            // Fetch upcoming birthdays
            try {
                const birthdaysData = await analyticsAPI.getUpcomingBirthdays(token);
                setUpcomingBirthdays(birthdaysData.data.slice(0, 5));
            } catch (error) {
                console.error('Failed to fetch birthdays:', error);
                setUpcomingBirthdays([]);
            }

            // Fetch attendance rates (admin only)
            if (user?.role === 'Admin') {
                try {
                    const ratesData = await analyticsAPI.getAttendanceRates(token);
                    setAttendanceRates(ratesData.data);
                } catch (error) {
                    console.error('Failed to fetch attendance rates:', error);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const recentUsers = allUsers.slice(0, 4);

    const chartData = mockAttendanceTrends.map(trend => ({
        date: trend.date ? format(new Date(trend.date), 'MMM dd') : 'N/A',
        rate: trend.rate,
        count: trend.count,
    }));

    const stats = {
        totalEvents: upcomingEvents.length,
        totalUsers: allUsers.length,
        attendanceRate: user?.role === 'Admin' && attendanceRates ? (attendanceRates.user_rate).toFixed(2) : mockDashboardStats.attendanceRate,
        activeUsers: allUsers.filter(u => u.is_active).length,
        inactiveUsers: allUsers.filter(u => !u.is_active).length,
    };

    return (
        <motion.div
            className="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <div className="dashboard__header">
                <div>
                    <h1 className="dashboard__title">Dashboard</h1>
                    <p className="dashboard__subtitle">Welcome back! Here's what's happening today.</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="dashboard__stats">
                <StatCard
                    title="Total Users"
                    value={stats.totalUsers}
                    trend={5}
                    icon={Users}
                    color="blue"
                />
                <StatCard
                    title="Attendance Rate"
                    value={`${stats.attendanceRate}%`}
                    trend={3.2}
                    icon={TrendingUp}
                    color="green"
                />
                <StatCard
                    title="Active Users"
                    value={stats.activeUsers}
                    trend={5}
                    icon={Users}
                    color="purple"
                />
                <StatCard
                    title="Inactive Users"
                    value={stats.inactiveUsers}
                    trend={-2}
                    icon={UserX}
                    color="pink"
                />
            </div>

            {/* Main Grid */}
            <div className="dashboard__grid">
                {/* Attendance Chart */}
                <Card glass className="dashboard__chart-card">
                    <div className="dashboard__card-header">
                        <h2 className="dashboard__card-title">Attendance Trend</h2>
                        <p className="dashboard__card-subtitle">Last 7 days</p>
                    </div>
                    <div className="dashboard__chart">
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0a84ff" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#0a84ff" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis
                                    dataKey="date"
                                    stroke="rgba(255,255,255,0.5)"
                                    style={{ fontSize: '12px' }}
                                />
                                <YAxis
                                    stroke="rgba(255,255,255,0.5)"
                                    style={{ fontSize: '12px' }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: 'rgba(28, 28, 30, 0.9)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        color: '#fff'
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="rate"
                                    stroke="#0a84ff"
                                    strokeWidth={3}
                                    dot={{ fill: '#0a84ff', r: 4 }}
                                    activeDot={{ r: 6 }}
                                    fill="url(#colorRate)"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Upcoming Events */}
                <Card glass className="dashboard__events-card">
                    <div className="dashboard__card-header">
                        <h2 className="dashboard__card-title">Upcoming Events</h2>
                        <p className="dashboard__card-subtitle">{upcomingEvents.length} events</p>
                    </div>
                    <div className="dashboard__events">
                        {loading ? (
                            <p className="dashboard__loading">Loading events...</p>
                        ) : upcomingEvents.length === 0 ? (
                            <p className="dashboard__empty">No upcoming events</p>
                        ) : (
                            upcomingEvents.map((event) => (
                                <div key={event.id} className="dashboard__event">
                                    <div className="dashboard__event-icon">
                                        <Calendar size={20} />
                                    </div>
                                    <div className="dashboard__event-content">
                                        <h4 className="dashboard__event-title">{event.title}</h4>
                                        <p className="dashboard__event-date">
                                            {event.date ? format(new Date(event.date), 'MMM dd, yyyy') : 'Date TBD'} at {event.time ? event.time.slice(0, 5) : 'N/A'}
                                        </p>
                                    </div>
                                    <div className="dashboard__event-badge">{event.attendance_type}</div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                {/* Recent Users */}
                <Card glass className="dashboard__users-card">
                    <div className="dashboard__card-header">
                        <h2 className="dashboard__card-title">Recent Users</h2>
                        <p className="dashboard__card-subtitle">Latest activity</p>
                    </div>
                    <div className="dashboard__users">
                        {loading ? (
                            <p className="dashboard__loading">Loading users...</p>
                        ) : recentUsers.length === 0 ? (
                            <p className="dashboard__empty">No users found</p>
                        ) : (
                            recentUsers.map((user) => (
                                <div key={user.id} className="dashboard__user">
                                    <img
                                        src={user.avatar_url || 'https://i.pravatar.cc/150?img=1'}
                                        alt={user.first_name}
                                        className="dashboard__user-avatar"
                                    />
                                    <div className="dashboard__user-info">
                                        <h4 className="dashboard__user-name">
                                            {user.first_name} {user.last_name}
                                        </h4>
                                        <p className="dashboard__user-email">{user.email}</p>
                                    </div>
                                    <div className={`dashboard__user-status dashboard__user-status--${user.is_active ? 'active' : 'inactive'}`} />
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                {/* Upcoming Birthdays */}
                <Card glass className="dashboard__birthdays-card">
                    <div className="dashboard__card-header">
                        <h2 className="dashboard__card-title">Upcoming Birthdays</h2>
                        <p className="dashboard__card-subtitle">{upcomingBirthdays.length} celebrations</p>
                    </div>
                    <div className="dashboard__birthdays">
                        {loading ? (
                            <p className="dashboard__loading">Loading birthdays...</p>
                        ) : upcomingBirthdays.length === 0 ? (
                            <p className="dashboard__empty">No upcoming birthdays</p>
                        ) : (
                            upcomingBirthdays.map((user) => (
                                <div key={user.id} className="dashboard__birthday">
                                    <div className="dashboard__birthday-icon">
                                        <Cake size={20} />
                                    </div>
                                    <div className="dashboard__birthday-content">
                                        <h4 className="dashboard__birthday-name">
                                            {user.first_name} {user.last_name}
                                        </h4>
                                        <p className="dashboard__birthday-date">
                                            {user.dob ? format(new Date(user.dob), 'MMMM dd') : 'N/A'}
                                        </p>
                                    </div>
                                    <div className="dashboard__birthday-badge">🎂</div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>
            </div>
        </motion.div>
    );
}
