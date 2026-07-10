import { useState, useRef, useEffect } from 'react';
import { Search, Menu, MapPin, X, LogOut, Settings } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useVolunteerAuthStore } from '../../stores/volunteerAuthStore';
import { Avatar } from '../ui/Avatar';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { attendanceAPI } from '../../services/api';
import { getDeviceId } from '../../utils/deviceId';
import './Header.css';
import './HeaderProfile.css';

interface HeaderProps {
    onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const token = useAuthStore((state) => state.token);

    const volunteer = useVolunteerAuthStore((state) => state.volunteer);
    const logoutVolunteer = useVolunteerAuthStore((state) => state.logoutVolunteer);
    const volunteerToken = useVolunteerAuthStore((state) => state.token);
    const isVolunteerAuthenticated = useVolunteerAuthStore((state) => state.isAuthenticated);

    const currentUser = isVolunteerAuthenticated ? volunteer : user;
    const currentToken = isVolunteerAuthenticated ? volunteerToken : token;

    const [searchQuery, setSearchQuery] = useState('');
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [checkInLoading, setCheckInLoading] = useState(false);
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
        if (!currentUser) return '';
        // Access properties directly
        let hall = (currentUser as any).current_roster_hall;
        let allocation = (currentUser as any).current_roster_allocation;

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
        if (isVolunteerAuthenticated) {
            logoutVolunteer();
        } else {
            logout();
        }
        navigate('/login');
    };

    const handleAdminCheckIn = async () => {
        if (!currentToken || !currentUser) {
            toast.error('You must be logged in to check in');
            return;
        }

        if (currentUser.role !== 'Admin') {
            toast.error('Only admins can check in from header');
            return;
        }

        if (!navigator.geolocation) {
            toast.error('Location not supported on your device');
            return;
        }

        setCheckInLoading(true);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const deviceId = getDeviceId();
                    await attendanceAPI.checkIn(
                        {
                            location: { lat: latitude, lng: longitude },
                            device_id: deviceId,
                        },
                        currentToken
                    );
                    toast.success('Check-in successful');
                } catch (error) {
                    toast.error(
                        error instanceof Error ? error.message : 'Check-in failed, please try again'
                    );
                } finally {
                    setCheckInLoading(false);
                }
            },
            () => {
                setCheckInLoading(false);
                toast.error('Unable to retrieve location');
            },
            {
                enableHighAccuracy: false,
                timeout: 30000,
                maximumAge: Infinity
            }
        );
    };

    return (
        <header className="header glass-md">
            <button className="header__menu-btn" onClick={onMenuClick}>
                <Menu size={24} />
            </button>

            {currentUser?.role === 'Admin' ? (
                <button
                    className="header__checkin-btn"
                    onClick={handleAdminCheckIn}
                    disabled={checkInLoading}
                >
                    <MapPin size={18} />
                    <span>{checkInLoading ? 'Checking in...' : 'Check In'}</span>
                </button>
            ) : (
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
            )}

            <div className="header__actions">
                <ThemeToggle />


                {currentUser && (
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
                                <Avatar src={currentUser.avatar_url} alt={currentUser.first_name} size="md" />
                                <div className="header__user-info">
                                    <span className="header__user-name">
                                        {currentUser.first_name} {currentUser.last_name}
                                    </span>
                                    {currentUser.role && (currentUser.role as string) !== 'Ksom' && (currentUser.role as string) !== 'ksom' && (
                                        <span className="header__user-role">{currentUser.role}</span>
                                    )}
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
                                                <Avatar src={currentUser.avatar_url} alt={currentUser.first_name} size="xl" />
                                            </div>
                                            <div className="header__profile-details">
                                                <h4 className="header__profile-name">{currentUser.first_name} {currentUser.last_name}</h4>
                                                {currentUser.role && (currentUser.role as string) !== 'Ksom' && (currentUser.role as string) !== 'ksom' && (
                                                    <span className="header__profile-badge">{currentUser.role}</span>
                                                )}

                                                <div className="header__profile-info-grid">
                                                    {/* Phone */}
                                                    <div className="header__profile-info-item">
                                                        <span className="header__profile-label">Phone</span>
                                                        <span className="header__profile-value">{currentUser.phone || 'N/A'}</span>
                                                    </div>

                                                    {/* Gender/Other info */}
                                                    <div className="header__profile-info-item">
                                                        <span className="header__profile-label">Gender</span>
                                                        <span className="header__profile-value" style={{ textTransform: 'capitalize' }}>
                                                            {currentUser.gender || 'N/A'}
                                                        </span>
                                                    </div>

                                                    <div className="header__profile-info-item">
                                                        <span className="header__profile-label">DOB</span>
                                                        <span className="header__profile-value">
                                                            {currentUser.dob ? new Date(currentUser.dob).toLocaleDateString() : 'N/A'}
                                                        </span>
                                                    </div>

                                                    <div className="header__profile-info-item">
                                                        <span className="header__profile-label">Country</span>
                                                        <span className="header__profile-value">{currentUser.country || 'N/A'}</span>
                                                    </div>

                                                    <div className="header__profile-info-item header__profile-info-item--full">
                                                        <span className="header__profile-label">Address</span>
                                                        <span className="header__profile-value">
                                                            {[currentUser.address, currentUser.city, currentUser.state].filter(Boolean).join(', ') || 'N/A'}
                                                        </span>
                                                    </div>

                                                    {/* Email (Full Width) */}
                                                    <div className="header__profile-info-item header__profile-info-item--full">
                                                        <span className="header__profile-label">Email</span>
                                                        <span className="header__profile-value">{currentUser.email}</span>
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