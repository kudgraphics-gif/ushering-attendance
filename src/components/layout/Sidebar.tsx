import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Calendar,
    Users,
    ClipboardCheck,
    Settings,
    LogOut,
    DollarSign,
    Music
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import clsx from 'clsx';
import './Sidebar.css';

const adminNavItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Calendar, label: 'Events', path: '/events' },
    { icon: Users, label: 'Users', path: '/users' },
    { icon: ClipboardCheck, label: 'Attendance', path: '/attendance' },
    { icon: DollarSign, label: 'Payments', path: '/payments' },
    { icon: Music, label: 'Koinonia', path: '/koinonia' },
    { icon: Settings, label: 'Settings', path: '/settings' },
];

const userNavItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Calendar, label: 'Events', path: '/events' },
    { icon: DollarSign, label: 'Payments', path: '/payments' },
    { icon: Music, label: 'Koinonia', path: '/koinonia' },
];

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const navigate = useNavigate();
    const logout = useAuthStore((state) => state.logout);
    const user = useAuthStore((state) => state.user);

    // Select nav items based on user role
    const navItems = user?.role === 'Admin' ? adminNavItems : userNavItems;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside className={clsx('sidebar glass', isOpen && 'sidebar--open')}>
            {isOpen && (
                <div className="sidebar__close-overlay" onClick={onClose} />
            )}

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
        </aside>
    );
}
