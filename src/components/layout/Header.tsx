import { useState, useRef, useEffect } from 'react';
import { Search, Menu, MapPin, X, LogOut, Settings } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { Avatar } from '../ui/Avatar';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import './Header.css';
import './HeaderProfile.css';

interface HeaderProps {
    onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const [searchQuery, setSearchQuery] = useState('');
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);


    // Helper to get the display string
    const getRosterDisplay = () => {
        if (!user) return '';
        // Access properties directly (assuming they exist on the user object based on API response)
        let hall = (user as any).current_roster_hall;
        let allocation = (user as any).current_roster_allocation;

        // Strip quotes if present
        if (hall) hall = hall.replace(/^"|"$/g, '');
        if (allocation) allocation = allocation.replace(/^"|"$/g, '');

        if (!hall) return 'Pending';
        if (allocation) return `${hall} - ${allocation}`;
        return hall;
    };

    const rosterStatus = getRosterDisplay();
    const isPending = rosterStatus === 'Pending';

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="header glass-md">
            <button className="header__menu-btn" onClick={onMenuClick}>
                <Menu size={24} />
            </button>

            <div className="header__search">
                <Search size={20} className="header__search-icon" />
                <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="header__search-input"
                />
            </div>

            <div className="header__actions">
                <ThemeToggle />


                {user && (
                    <>
                        {/* Roster Status Badge */}
                        <div
                            className={`header__roster-status ${isPending ? 'header__roster-status--pending' : 'header__roster-status--active'}`}
                            title="Current Roster Allocation"
                        >
                            <MapPin size={14} />
                            <span>{rosterStatus}</span>
                        </div>

                        <div className="header__profile-container" ref={profileRef}>
                            <button
                                className="header__user"
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                            >
                                <Avatar src={user.avatar_url} alt={user.first_name} size="md" />
                                <div className="header__user-info">
                                    <span className="header__user-name">
                                        {user.first_name} {user.last_name}
                                    </span>
                                    <span className="header__user-role">{user.role}</span>
                                </div>
                            </button>

                            <AnimatePresence>
                                {isProfileOpen && (
                                    <motion.div
                                        className="header__profile-modal"
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <div className="header__profile-header">
                                            <h3 className="header__profile-title">Profile</h3>
                                            <button
                                                className="header__profile-close"
                                                onClick={() => setIsProfileOpen(false)}
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>

                                        <div className="header__profile-content">
                                            <div className="header__profile-avatar-large">
                                                <Avatar src={user.avatar_url} alt={user.first_name} size="xl" />
                                            </div>
                                            <div className="header__profile-details">
                                                <h4 className="header__profile-name">{user.first_name} {user.last_name}</h4>
                                                <span className="header__profile-badge">{user.role}</span>

                                                <div className="header__profile-info-grid">
                                                    {/* Phone */}
                                                    <div className="header__profile-info-item">
                                                        <span className="header__profile-label">Phone</span>
                                                        <span className="header__profile-value">{user.phone || 'N/A'}</span>
                                                    </div>

                                                    {/* Gender/Other info */}
                                                    <div className="header__profile-info-item">
                                                        <span className="header__profile-label">Gender</span>
                                                        <span className="header__profile-value" style={{ textTransform: 'capitalize' }}>
                                                            {user.gender || 'N/A'}
                                                        </span>
                                                    </div>

                                                    <div className="header__profile-info-item">
                                                        <span className="header__profile-label">DOB</span>
                                                        <span className="header__profile-value">
                                                            {user.dob ? new Date(user.dob).toLocaleDateString() : 'N/A'}
                                                        </span>
                                                    </div>

                                                    <div className="header__profile-info-item">
                                                        <span className="header__profile-label">Country</span>
                                                        <span className="header__profile-value">{user.country || 'N/A'}</span>
                                                    </div>

                                                    <div className="header__profile-info-item header__profile-info-item--full">
                                                        <span className="header__profile-label">Address</span>
                                                        <span className="header__profile-value">
                                                            {[user.address, user.city, user.state].filter(Boolean).join(', ') || 'N/A'}
                                                        </span>
                                                    </div>

                                                    {/* Email (Full Width) */}
                                                    <div className="header__profile-info-item header__profile-info-item--full">
                                                        <span className="header__profile-label">Email</span>
                                                        <span className="header__profile-value">{user.email}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="header__profile-actions">
                                            <button
                                                className="header__profile-action-btn"
                                                onClick={() => {
                                                    navigate('/profile');
                                                    setIsProfileOpen(false);
                                                }}
                                            >
                                                <Settings size={16} />
                                                Settings
                                            </button>
                                            <button
                                                className="header__profile-action-btn header__profile-action-btn--danger"
                                                onClick={handleLogout}
                                            >
                                                <LogOut size={16} />
                                                Log Out
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </>
                )}
            </div>
        </header>
    );
}