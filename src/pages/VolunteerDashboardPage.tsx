import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Award, Heart, Shield, Star, Users, BookOpen, ChevronRight } from 'lucide-react';
import { useVolunteerAuthStore } from '../stores/volunteerAuthStore';
import { Avatar } from '../components/ui/Avatar';
import toast from 'react-hot-toast';
import './VolunteerDashboardPage.css';

const CORE_VALUES = [
    { icon: <Heart size={22} />, title: 'Love', body: 'We serve from a heart of genuine love for God and people.' },
    { icon: <Shield size={22} />, title: 'Excellence', body: 'We pursue the highest standards in every aspect of our service.' },
    { icon: <Star size={22} />, title: 'Integrity', body: 'We conduct ourselves with honesty and moral uprightness.' },
    { icon: <Users size={22} />, title: 'Teamwork', body: 'We achieve more together than we ever could alone.' },
    { icon: <BookOpen size={22} />, title: 'Discipline', body: 'We uphold structure, punctuality, and commitment to our calling.' },
];

const LEADERS = [
    { name: 'Bro. Emmanuel Adeyemi', role: 'Head of Ushering Department', initials: 'EA' },
    { name: 'Sis. Blessing Okafor', role: 'Deputy Head, Female Wing', initials: 'BO' },
    { name: 'Bro. Samuel Nwachukwu', role: 'Deputy Head, Male Wing', initials: 'SN' },
    { name: 'Sis. Grace Aliyu', role: 'Training & Development Lead', initials: 'GA' },
];

export function VolunteerDashboardPage() {
    const { volunteer, logoutVolunteer } = useVolunteerAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logoutVolunteer();
        toast.success('Signed out successfully');
        navigate('/login');
    };

    return (
        <div className="vol-dash">
            {/* Background */}
            <div className="vol-dash__bg">
                <div className="vol-dash__orb vol-dash__orb--1" />
                <div className="vol-dash__orb vol-dash__orb--2" />
            </div>

            {/* Navbar */}
            <header className="vol-dash__nav">
                <div className="vol-dash__nav-brand">
                    <span className="vol-dash__nav-logo">KUD</span>
                    <span className="vol-dash__nav-label">Volunteer Portal</span>
                </div>
                <div className="vol-dash__nav-actions">
                    <div className="vol-dash__nav-user">
                        <Avatar src={volunteer?.avatar_url} alt={volunteer?.first_name || 'V'} size="sm" />
                        <span className="vol-dash__nav-name">
                            {volunteer?.first_name} {volunteer?.last_name}
                        </span>
                    </div>
                    <button className="vol-dash__logout-btn" onClick={handleLogout} title="Sign out">
                        <LogOut size={18} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </header>

            <main className="vol-dash__main">
                {/* Welcome Hero */}
                <motion.section
                    className="vol-dash__hero"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="vol-dash__hero-content">
                        <div className="vol-dash__hero-avatar">
                            <Avatar src={volunteer?.avatar_url} alt={volunteer?.first_name || 'V'} size="xl" />
                        </div>
                        <div>
                            <div className="vol-dash__hero-badge">KSOM Volunteer</div>
                            <h1 className="vol-dash__hero-title">
                                Welcome back,<br />
                                <span className="vol-dash__hero-name">
                                    {volunteer?.first_name} {volunteer?.last_name}!
                                </span>
                            </h1>
                            <p className="vol-dash__hero-sub">
                                Thank you for your dedication to serving at Koinonia Ushering Department Abuja. Your service makes an eternal difference.
                            </p>
                        </div>
                    </div>

                    {/* Quick stats */}
                    {volunteer && (
                        <div className="vol-dash__stats">
                            <div className="vol-dash__stat">
                                <Award size={20} />
                                <div>
                                    <span className="vol-dash__stat-val">{volunteer.attendance_count ?? 0}</span>
                                    <span className="vol-dash__stat-label">Attendance</span>
                                </div>
                            </div>
                            <div className="vol-dash__stat">
                                <User size={20} />
                                <div>
                                    <span className="vol-dash__stat-val">{volunteer.year_joined || '—'}</span>
                                    <span className="vol-dash__stat-label">Year Joined</span>
                                </div>
                            </div>
                            {volunteer.current_roster_hall && (
                                <div className="vol-dash__stat">
                                    <Shield size={20} />
                                    <div>
                                        <span className="vol-dash__stat-val">
                                            {volunteer.current_roster_hall.replace(/^"|"$/g, '')}
                                        </span>
                                        <span className="vol-dash__stat-label">Hall</span>
                                    </div>
                                </div>
                            )}
                            <div className="vol-dash__stat">
                                <span className={`vol-dash__stat-dot ${volunteer.is_active ? 'active' : 'inactive'}`} />
                                <div>
                                    <span className="vol-dash__stat-val">{volunteer.is_active ? 'Active' : 'Inactive'}</span>
                                    <span className="vol-dash__stat-label">Status</span>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.section>

                <div className="vol-dash__grid">
                    {/* Core Values */}
                    <motion.section
                        className="vol-dash__card vol-dash__card--values"
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <div className="vol-dash__card-header">
                            <Star size={20} />
                            <h2>Our Core Values</h2>
                        </div>
                        <div className="vol-dash__values">
                            {CORE_VALUES.map((v, i) => (
                                <motion.div
                                    key={v.title}
                                    className="vol-dash__value-item"
                                    initial={{ opacity: 0, x: -16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + i * 0.08 }}
                                >
                                    <div className="vol-dash__value-icon">{v.icon}</div>
                                    <div>
                                        <div className="vol-dash__value-title">{v.title}</div>
                                        <div className="vol-dash__value-body">{v.body}</div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.section>

                    {/* Right column */}
                    <div className="vol-dash__right">
                        {/* Department Leaders */}
                        <motion.section
                            className="vol-dash__card"
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.25 }}
                        >
                            <div className="vol-dash__card-header">
                                <Users size={20} />
                                <h2>Department Leaders</h2>
                            </div>
                            <div className="vol-dash__leaders">
                                {LEADERS.map((l, i) => (
                                    <motion.div
                                        key={l.name}
                                        className="vol-dash__leader"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.35 + i * 0.07 }}
                                    >
                                        <div className="vol-dash__leader-avatar">{l.initials}</div>
                                        <div>
                                            <div className="vol-dash__leader-name">{l.name}</div>
                                            <div className="vol-dash__leader-role">{l.role}</div>
                                        </div>
                                        <ChevronRight size={16} className="vol-dash__leader-arrow" />
                                    </motion.div>
                                ))}
                            </div>
                        </motion.section>

                        {/* About department */}
                        <motion.section
                            className="vol-dash__card vol-dash__card--about"
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.35 }}
                        >
                            <div className="vol-dash__card-header">
                                <Heart size={20} />
                                <h2>About the Department</h2>
                            </div>
                            <p className="vol-dash__about-text">
                                The Koinonia Ushering Department Abuja (KSOM) is dedicated to creating a warm, 
                                orderly, and spiritually charged atmosphere for every service. We are the first 
                                point of contact for every worshipper — ambassadors of God's love, peace, and hospitality.
                            </p>
                            <p className="vol-dash__about-text">
                                Our volunteers serve across multiple halls, providing seating assistance, crowd 
                                management, offering collection, and general welfare support. Together, we ensure 
                                that every service runs smoothly to the glory of God.
                            </p>
                            <div className="vol-dash__about-verse">
                                <span>"Each of you should use whatever gift you have received to serve others."</span>
                                <span className="vol-dash__about-ref">— 1 Peter 4:10</span>
                            </div>
                        </motion.section>
                    </div>
                </div>
            </main>
        </div>
    );
}
