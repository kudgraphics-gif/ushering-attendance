import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, Shield, CheckCircle2, Heart, Sparkles, Star, BookOpen, Calendar, DollarSign, Music, User, ArrowRight } from 'lucide-react';
import { useVolunteerAuthStore } from '../stores/volunteerAuthStore';
import { Avatar } from '../components/ui/Avatar';
import { volunteersAPI } from '../services/api';
import { getDeviceId, hasDeviceCheckedInToday, recordDeviceCheckIn } from '../utils/deviceId';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import './VolunteerDashboardPage.css';

const CORE_VALUES = [
    { icon: <Heart size={18} />, title: 'Love & Service', desc: 'Serving with genuine warmth and empathy.' },
    { icon: <Sparkles size={18} />, title: 'Excellence', desc: 'Striving for exceptional execution in every detail.' },
    { icon: <Star size={18} />, title: 'Character', desc: 'Upholding honesty, integrity, and discipline.' },
    { icon: <BookOpen size={18} />, title: 'Word-Centered', desc: 'Rooted and grounded in biblical foundations.' },
];

export function VolunteerDashboardPage() {
    const { volunteer, token } = useVolunteerAuthStore();
    const [checkingIn, setCheckingIn] = useState(false);
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (volunteer?.id) {
            setIsCheckedIn(!!hasDeviceCheckedInToday());
        }
    }, [volunteer?.id]);

    const handleCheckIn = async () => {
        if (!token || !volunteer) {
            toast.error('Not authenticated');
            return;
        }

        if (isCheckedIn) {
            toast.error("You've already checked in today");
            return;
        }

        if (!navigator.geolocation) {
            toast.error('Location not supported on your device');
            return;
        }

        setCheckingIn(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const deviceId = getDeviceId();
                    await volunteersAPI.markAttendance({
                        device_id: deviceId,
                        location: { lat: latitude, lng: longitude }
                    }, token);
                    
                    recordDeviceCheckIn(volunteer.id);
                    setIsCheckedIn(true);
                    toast.success('Attendance recorded successfully!');
                } catch (error) {
                    toast.error(error instanceof Error ? error.message : 'Check-in failed');
                } finally {
                    setCheckingIn(false);
                }
            },
            () => {
                setCheckingIn(false);
                toast.error('Unable to access location services');
            },
            { enableHighAccuracy: false, timeout: 30000, maximumAge: Infinity }
        );
    };

    return (
        <div className="vol-dash-modern">
            {/* Soft Ambient Orbs */}
            <div className="vol-dash-modern__bg">
                <div className="vol-dash-modern__orb vol-dash-modern__orb--gold" />
                <div className="vol-dash-modern__orb vol-dash-modern__orb--purple" />
            </div>

            <div className="vol-dash-modern__layout">
                {/* Left Column: Hero & Service Desk */}
                <div className="vol-dash-modern__col">
                    {/* Welcome Card */}
                    <motion.section 
                        className="vol-dash-modern__hero glass-strong"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="vol-dash-modern__hero-header">
                            <Avatar src={volunteer?.avatar_url} alt={volunteer?.first_name || 'V'} size="lg" />
                            <div className="vol-dash-modern__hero-meta">
                                <span className="vol-dash-modern__badge">Volunteer Portal</span>
                                <h1 className="vol-dash-modern__title">
                                    Welcome, <span className="vol-dash-modern__title--accent">{volunteer?.first_name}</span>
                                </h1>
                            </div>
                        </div>
                        <p className="vol-dash-modern__hero-desc">
                            "Each of you should use whatever gift you have received to serve others." — 1 Peter 4:10
                        </p>
                    </motion.section>

                    {/* Duty status & Check-in Desk */}
                    <motion.section 
                        className="vol-dash-modern__desk glass"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <div className="vol-dash-modern__desk-status">
                            <div className={`vol-dash-modern__pulse ${isCheckedIn ? 'active' : 'idle'}`} />
                            <div>
                                <h3 className="vol-dash-modern__desk-title">
                                    {isCheckedIn ? 'Active on Duty' : 'Ready for Duty'}
                                </h3>
                                <p className="vol-dash-modern__desk-subtitle">
                                    {isCheckedIn ? 'Attendance logged for today' : 'Tap to sign-in for service'}
                                </p>
                            </div>
                        </div>

                        <button 
                            onClick={handleCheckIn}
                            disabled={checkingIn || isCheckedIn}
                            className={`vol-dash-modern__checkin-btn ${isCheckedIn ? 'checked-in' : ''}`}
                        >
                            <CheckCircle2 size={16} />
                            <span>{checkingIn ? 'Signing in...' : isCheckedIn ? 'Logged' : 'Check In'}</span>
                        </button>
                    </motion.section>

                    {/* Metrics Grid */}
                    <div className="vol-dash-modern__metrics">
                        <motion.div 
                            className="vol-dash-modern__metric-card glass"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4, delay: 0.2 }}
                        >
                            <Award className="vol-dash-modern__metric-icon" size={20} />
                            <div>
                                <span className="vol-dash-modern__metric-val">{volunteer?.attendance_count ?? 0}</span>
                                <span className="vol-dash-modern__metric-lbl">Total Attendances</span>
                            </div>
                        </motion.div>

                        <motion.div 
                            className="vol-dash-modern__metric-card glass"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4, delay: 0.25 }}
                        >
                            <Shield className="vol-dash-modern__metric-icon" size={20} />
                            <div>
                                <span className="vol-dash-modern__metric-val">
                                    {volunteer?.current_roster_hall ? volunteer.current_roster_hall.replace(/^"|"$/g, '') : 'None'}
                                </span>
                                <span className="vol-dash-modern__metric-lbl">Roster Hall</span>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Right Column: Core Values & Navigation */}
                <div className="vol-dash-modern__col">
                    {/* Core Values Showcase */}
                    <motion.section 
                        className="vol-dash-modern__panel glass"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.15 }}
                    >
                        <h2 className="vol-dash-modern__section-title">Core Guidelines</h2>
                        <div className="vol-dash-modern__values">
                            {CORE_VALUES.map((val, idx) => (
                                <motion.div 
                                    key={val.title}
                                    className="vol-dash-modern__value-item"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: 0.2 + idx * 0.05 }}
                                >
                                    <div className="vol-dash-modern__value-icon">{val.icon}</div>
                                    <div>
                                        <h4 className="vol-dash-modern__value-title">{val.title}</h4>
                                        <p className="vol-dash-modern__value-desc">{val.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.section>

                    {/* Quick portal shortcut links */}
                    <motion.section 
                        className="vol-dash-modern__panel glass"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <h2 className="vol-dash-modern__section-title">Portal Quick Links</h2>
                        <div className="vol-dash-modern__shortcuts">
                            <button onClick={() => navigate('/events')} className="vol-dash-modern__shortcut-btn glass-md">
                                <Calendar size={18} />
                                <span>Events Calendar</span>
                                <ArrowRight size={14} className="arrow" />
                            </button>
                            <button onClick={() => navigate('/kud-sermons')} className="vol-dash-modern__shortcut-btn glass-md">
                                <Music size={18} />
                                <span>Sermons & Media</span>
                                <ArrowRight size={14} className="arrow" />
                            </button>
                            <button onClick={() => navigate('/payments')} className="vol-dash-modern__shortcut-btn glass-md">
                                <DollarSign size={18} />
                                <span>Contributions</span>
                                <ArrowRight size={14} className="arrow" />
                            </button>
                            <button onClick={() => navigate('/profile')} className="vol-dash-modern__shortcut-btn glass-md">
                                <User size={18} />
                                <span>Profile Settings</span>
                                <ArrowRight size={14} className="arrow" />
                            </button>
                        </div>
                    </motion.section>
                </div>
            </div>

            {/* Apple standard subtle footer */}
            <footer className="vol-dash-modern__footer">
                <p>&copy; {new Date().getFullYear()} Koinonia Ushering Department Abuja</p>
                <div className="vol-dash-modern__footer-links">
                    <Link to="/privacy-policy" className="vol-dash-modern__footer-link">Privacy Policy</Link>
                </div>
            </footer>
        </div>
    );
}
