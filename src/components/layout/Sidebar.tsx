import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Calendar,
    Users,
    ClipboardCheck,
    User,
    LogOut,
    DollarSign,
    Music,
    Eye,
    List,
    Users2,
    MessageSquare,
    MapPin,
    BarChart2,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useSidebarStore } from '../../stores/sidebarStore';
import clsx from 'clsx';
import './Sidebar.css';

const adminNavItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Calendar, label: 'Events', path: '/events' },
    { icon: Users, label: 'Users', path: '/users' },
    { icon: ClipboardCheck, label: 'Attendance', path: '/attendance' },
    { icon: DollarSign, label: 'Payments', path: '/payments' },
    { icon: Music, label: 'Koinonia', path: '/koinonia' },
    { icon: Music, label: 'KUD Sermons', path: '/kud-sermons' },
    { icon: Eye, label: 'Activity Logs', path: '/activity-logs' },
    { icon: List, label: 'Roster Management', path: '/roster-management' },
    { icon: MapPin, label: 'Hall Manager', path: '/hall-manager' },
    { icon: Users2, label: 'Groups', path: '/groups' },
    { icon: MessageSquare, label: 'Suggestion Box', path: '/suggestion-box' },
    { icon: BarChart2, label: 'Reports & Analytics', path: '/reports' },
    { icon: User, label: 'Profile', path: '/profile' },
];

const leaderNavItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Calendar, label: 'Events', path: '/events' },
    { icon: MapPin, label: 'Hall Manager', path: '/hall-manager' },
    { icon: Users2, label: 'Groups', path: '/groups' },
    { icon: DollarSign, label: 'Payments', path: '/payments' },
    { icon: Music, label: 'Koinonia', path: '/koinonia' },
    { icon: Music, label: 'KUD Sermons', path: '/kud-sermons' },
    { icon: MessageSquare, label: 'Suggestion Box', path: '/suggestion-box' },
    { icon: User, label: 'Profile', path: '/profile' },
];

const userNavItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Calendar, label: 'Events', path: '/events' },
    { icon: DollarSign, label: 'Payments', path: '/payments' },
    { icon: Music, label: 'Koinonia', path: '/koinonia' },
    { icon: Music, label: 'KUD Sermons', path: '/kud-sermons' },
    { icon: MessageSquare, label: 'Suggestion Box', path: '/suggestion-box' },
    { icon: User, label: 'Profile', path: '/profile' },
];

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const navigate = useNavigate();
    const logout = useAuthStore((state) => state.logout);
    const user = useAuthStore((state) => state.user);
    const setOpen = useSidebarStore((state) => state.setOpen);

    const navItems = user?.role === 'Admin' ? adminNavItems : user?.role === 'Leader' ? leaderNavItems : userNavItems;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleClose = () => {
        setOpen(false);
        onClose?.();
    };

    return (
        <>
            {/* Overlay: Sits BEHIND the sidebar but ABOVE the page content */}
            {/* It is now a sibling, not a child, of the aside */}
            {isOpen && (
                <div className="sidebar-overlay" onClick={handleClose} />
            )}

            <aside className={clsx('sidebar glass', isOpen && 'sidebar--open')}>
                <div className="sidebar__logo">
                    <div className="sidebar__logo-icon">
                        <ClipboardCheck size={28} />
                    </div>
                    <div className="sidebar__logo-wrapper">
                        <h1 className="sidebar__logo-text">Koinonia</h1>
                        <span className="sidebar__logo-subtext">Ushering Abuja</span>
                    </div>
                </div>

                <nav className="sidebar__nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link'
                            }
                            onClick={handleClose} // Optional: Close sidebar when a link is clicked on mobile
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <button className="sidebar__logout" onClick={handleLogout}>
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>

                <div style={{
                    marginTop: 'auto',
                    padding: 'var(--space-xl) var(--space-md) var(--space-md)',
                    textAlign: 'center',
                    fontSize: '10px',
                    color: 'var(--color-text-tertiary)',
                    opacity: 0.6
                }}>
                    &copy; {new Date().getFullYear()} Koinonia Ushering Department Abuja
                </div>
            </aside>
        </>
    );
}