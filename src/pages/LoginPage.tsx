import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, LogIn, Users, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import { useVolunteerAuthStore } from '../stores/volunteerAuthStore';
import { setDeviceSession, getDeviceSession } from '../utils/deviceId';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import './LoginPage.css';
import './LoginPageValues.css';

// Import slideshow images
import pic1 from '../assets/pictures/1.jpg';
import pic2 from '../assets/pictures/2.jpg';
import pic3 from '../assets/pictures/3.jpg';
import pic5 from '../assets/pictures/5.jpg';
import pic8 from '../assets/pictures/8.jpg';
import pic17 from '../assets/pictures/17.jpg';
import pic20 from '../assets/pictures/20.jpg';
import pic21 from '../assets/pictures/21.jpg';
import pic22 from '../assets/pictures/22.jpg';
import pic25 from '../assets/pictures/25.jpg';

const loginSlides = [pic1, pic5, pic8, pic17, pic20, pic21, pic22, pic25, pic2, pic3];

const slideQuotes = [
    { text: 'Ushering with a difference.', ref: 'KUDA Vision' },
    { text: 'We don\'t just open doors; we open hearts.', ref: 'KUDA Mission' },
    { text: 'Excellence in service, distinction in worship.', ref: 'KUDA Standard' },
    { text: 'Bridging the gap between the world and the presence of God.', ref: 'KUDA Purpose' },
    { text: 'A family of faith, love, and service.', ref: 'KUDA Identity' },
];

type LoginMode = 'member' | 'volunteer';

export function LoginPage() {
    const navigate = useNavigate();
    const { login, loading, logout } = useAuthStore();
    const { loginVolunteer, loading: volLoading } = useVolunteerAuthStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mode, setMode] = useState<LoginMode>('member');

    // Slideshow state
    const [currentSlide, setCurrentSlide] = useState(0);
    const [direction, setDirection] = useState(1);
    const [quoteIndex, setQuoteIndex] = useState(0);

    const nextSlide = useCallback(() => {
        setDirection(1);
        setCurrentSlide((prev) => (prev + 1) % loginSlides.length);
    }, []);

    const prevSlide = useCallback(() => {
        setDirection(-1);
        setCurrentSlide((prev) => (prev - 1 + loginSlides.length) % loginSlides.length);
    }, []);

    // Auto-advance slideshow
    useEffect(() => {
        const timer = setInterval(nextSlide, 6000);
        return () => clearInterval(timer);
    }, [nextSlide]);

    // Cycle quotes
    useEffect(() => {
        const timer = setInterval(() => {
            setQuoteIndex((prev) => (prev + 1) % slideQuotes.length);
        }, 8000);
        return () => clearInterval(timer);
    }, []);

    // Time-of-day greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const slideVariants = {
        enter: (dir: number) => ({
            x: dir > 0 ? '100%' : '-100%',
            opacity: 0,
            scale: 1.08,
        }),
        center: {
            x: 0,
            opacity: 1,
            scale: 1,
        },
        exit: (dir: number) => ({
            x: dir > 0 ? '-100%' : '100%',
            opacity: 0,
            scale: 0.95,
        }),
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            toast.error('Please fill in all fields');
            return;
        }

        if (mode === 'volunteer') {
            try {
                await loginVolunteer(email.toLowerCase(), password);
                toast.success('Welcome, volunteer!');
                navigate('/volunteer-dashboard');
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Invalid email or password';
                toast.error(errorMessage);
            }
            return;
        }

        try {
            await login(email.toLowerCase(), password);

            const currentUser = useAuthStore.getState().user;
            const isAdmin = currentUser?.role === 'Admin';
            const currentEmail = email.toLowerCase();
            const deviceSession = getDeviceSession();

            if (deviceSession && deviceSession.userId !== currentEmail && !isAdmin) {
                logout();
                toast.error(`Access Denied: This device is linked to ${deviceSession.userId}`);
                return;
            }

            setDeviceSession(currentEmail, `token_${Math.random()}`);
            toast.success('Login successful!');
            navigate('/dashboard');

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Invalid email or password';
            toast.error(errorMessage);
            logout();
        }
    };

    const handleClearStorage = () => {
        if (confirm('⚠️ This will clear all stored data including avatars. Continue?')) {
            try {
                const itemCount = Object.keys(localStorage).length;
                localStorage.clear();
                toast.success(`Cleared ${itemCount} items from storage`);
            } catch (error) {
                toast.error('Failed to clear storage');
            }
        }
    };

    const isLoading = mode === 'member' ? loading : volLoading;

    return (
        <div className="login-split">
            {/* ─── LEFT: Photo Slideshow Panel ─── */}
            <div className="login-split__showcase">
                {/* Slideshow */}
                <div className="login-split__slides">
                    <AnimatePresence custom={direction} initial={false}>
                        <motion.div
                            key={currentSlide}
                            className="login-split__slide"
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
                        >
                            <img
                                src={loginSlides[currentSlide]}
                                alt={`KUDA moment ${currentSlide + 1}`}
                                className="login-split__slide-img"
                            />
                        </motion.div>
                    </AnimatePresence>
                    <div className="login-split__slide-overlay" />
                </div>

                {/* Showcase content overlay */}
                <div className="login-split__showcase-content">
                    <motion.div
                        className="login-split__brand"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                    >
                        <div className="login-split__brand-logo">K</div>
                        <span className="login-split__brand-name">KUDA</span>
                    </motion.div>

                    <div className="login-split__showcase-bottom">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={quoteIndex}
                                className="login-split__quote"
                                initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
                                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                exit={{ opacity: 0, y: -20, filter: 'blur(6px)' }}
                                transition={{ duration: 0.5 }}
                            >
                                <p className="login-split__quote-text">"{slideQuotes[quoteIndex].text}"</p>
                                <span className="login-split__quote-ref">— {slideQuotes[quoteIndex].ref}</span>
                            </motion.div>
                        </AnimatePresence>

                        {/* Slide controls */}
                        <div className="login-split__slide-controls">
                            <button className="login-split__arrow" onClick={prevSlide} aria-label="Previous slide">
                                <ChevronLeft size={18} />
                            </button>
                            <div className="login-split__dots">
                                {loginSlides.map((_, i) => (
                                    <button
                                        key={i}
                                        className={`login-split__dot ${i === currentSlide ? 'login-split__dot--active' : ''}`}
                                        onClick={() => {
                                            setDirection(i > currentSlide ? 1 : -1);
                                            setCurrentSlide(i);
                                        }}
                                        aria-label={`Slide ${i + 1}`}
                                    />
                                ))}
                            </div>
                            <button className="login-split__arrow" onClick={nextSlide} aria-label="Next slide">
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── RIGHT: Login Form Panel ─── */}
            <div className="login-split__form-panel">
                <div className="login-split__form-scroll">
                    {/* Back to home */}
                    <motion.div
                        className="login-split__back-row"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                    >
                        <Link to="/" className="login-split__back-link">
                            <ArrowLeft size={14} />
                            <span>Home Page</span>
                        </Link>
                    </motion.div>

                    {/* Mode tabs */}
                    <motion.div
                        className="login-page__tabs"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25, duration: 0.4 }}
                    >
                        <button
                            id="tab-member"
                            className={`login-page__tab ${mode === 'member' ? 'login-page__tab--active' : ''}`}
                            onClick={() => { setMode('member'); setEmail(''); setPassword(''); }}
                            type="button"
                        >
                            <LogIn size={16} />
                            Member
                        </button>
                        <button
                            id="tab-volunteer"
                            className={`login-page__tab ${mode === 'volunteer' ? 'login-page__tab--active' : ''}`}
                            onClick={() => { setMode('volunteer'); setEmail(''); setPassword(''); }}
                            type="button"
                        >
                            <Users size={16} />
                            Volunteer
                        </button>
                    </motion.div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={mode}
                            initial={{ opacity: 0, x: mode === 'volunteer' ? 20 : -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: mode === 'volunteer' ? -20 : 20 }}
                            transition={{ duration: 0.25 }}
                        >
                            {/* Header */}
                            <div className="login-split__header">
                                <motion.p
                                    className="login-split__greeting"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3, duration: 0.4 }}
                                >
                                    {getGreeting()} 👋
                                </motion.p>
                                <motion.h1
                                    className="login-split__title"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.35, duration: 0.4 }}
                                >
                                    {mode === 'volunteer' ? 'Volunteer Portal' : 'Welcome Back'}
                                </motion.h1>
                                <motion.p
                                    className="login-split__subtitle"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4, duration: 0.4 }}
                                >
                                    {mode === 'volunteer'
                                        ? 'Sign in to your KSOM volunteer account'
                                        : 'Sign in to Koinonia Ushering Department Abuja'
                                    }
                                </motion.p>
                            </div>

                            {/* Form */}
                            <motion.form
                                className="login-split__form"
                                onSubmit={handleSubmit}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.45, duration: 0.4 }}
                            >
                                <Input
                                    type="email"
                                    label="Email"
                                    icon={<Mail size={20} />}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    id={`login-email-${mode}`}
                                />

                                <Input
                                    type="password"
                                    label="Password"
                                    icon={<Lock size={20} />}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    id={`login-password-${mode}`}
                                />

                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="lg"
                                    fullWidth
                                    loading={isLoading}
                                    id={`login-submit-${mode}`}
                                >
                                    {mode === 'volunteer' ? 'Sign In as Volunteer' : 'Sign In'}
                                </Button>

                                {mode === 'volunteer' && (
                                    <div className="login-split__volunteer-links">
                                        <Link to="/register-volunteer" className="login-split__vlink">
                                            Not registered yet? <strong>Register as Volunteer →</strong>
                                        </Link>
                                        <Link to="/volunteer-onboard" className="login-split__vlink login-split__vlink--secondary">
                                            First time setup? <strong>Onboard as Volunteer →</strong>
                                        </Link>
                                    </div>
                                )}
                            </motion.form>
                        </motion.div>
                    </AnimatePresence>

                    {/* Footer links */}
                    <motion.div
                        className="login-split__footer"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6, duration: 0.4 }}
                    >
                        <div className="login-split__footer-row">
                            Having storage issues?{' '}
                            <button
                                type="button"
                                onClick={handleClearStorage}
                                className="login-split__text-btn"
                            >
                                Clear Storage
                            </button>
                        </div>
                        <div className="login-split__footer-row">
                            <Link to="/privacy-policy" className="login-split__privacy-link">
                                Privacy Policy
                            </Link>
                        </div>
                        <div className="login-split__copyright">
                            &copy; {new Date().getFullYear()} Koinonia Ushering Department Abuja
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}