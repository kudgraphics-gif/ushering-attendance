import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, LogIn, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import { useVolunteerAuthStore } from '../stores/volunteerAuthStore';
import { setDeviceSession, getDeviceSession } from '../utils/deviceId';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import './LoginPage.css';
import './LoginPageValues.css';

type LoginMode = 'member' | 'volunteer';

export function LoginPage() {
    const navigate = useNavigate();
    const { login, loading, logout } = useAuthStore();
    const { loginVolunteer, loading: volLoading } = useVolunteerAuthStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mode, setMode] = useState<LoginMode>('member');

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
        <div className="login-page">
            <div className="login-page__background">
                <div className="login-page__gradient login-page__gradient--1" />
                <div className="login-page__gradient login-page__gradient--2" />
                <div className="login-page__gradient login-page__gradient--3" />
            </div>

            <motion.div
                className="login-page__card glass-strong"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {/* Mode tabs */}
                <div className="login-page__tabs">
                    <button
                        id="tab-member"
                        className={`login-page__tab ${mode === 'member' ? 'login-page__tab--active' : ''}`}
                        onClick={() => { setMode('member'); setEmail(''); setPassword(''); }}
                        type="button"
                    >
                        <LogIn size={16} />
                        Member Login
                    </button>
                    <button
                        id="tab-volunteer"
                        className={`login-page__tab ${mode === 'volunteer' ? 'login-page__tab--active' : ''}`}
                        onClick={() => { setMode('volunteer'); setEmail(''); setPassword(''); }}
                        type="button"
                    >
                        <Users size={16} />
                        Volunteer Login
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={mode}
                        initial={{ opacity: 0, x: mode === 'volunteer' ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: mode === 'volunteer' ? -20 : 20 }}
                        transition={{ duration: 0.25 }}
                    >
                        <div className="login-page__header">
                            <motion.div
                                className="login-page__icon"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                whileHover={{ scale: 1.05, rotate: 5 }}
                                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                            >
                                {mode === 'volunteer' ? <Users size={32} /> : <LogIn size={32} />}
                            </motion.div>
                            <h1 className="login-page__title">Koinonia Ushering</h1>
                            <p className="login-page__subtitle">
                                {mode === 'volunteer' ? 'Volunteer Portal' : 'Department Abuja'}
                            </p>
                            {mode === 'volunteer' && (
                                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '6px', textAlign: 'center' }}>
                                    Sign in to your KSOM volunteer account
                                </p>
                            )}
                        </div>

                        <form className="login-page__form" onSubmit={handleSubmit}>
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
                                <div style={{ textAlign: 'center' }}>
                                    <Link
                                        to="/register-volunteer"
                                        style={{
                                            color: 'var(--color-primary)',
                                            fontSize: '13px',
                                            textDecoration: 'none',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                        }}
                                    >
                                        Not registered yet? <strong>Register as Volunteer →</strong>
                                    </Link>
                                </div>
                            )}

                            <div style={{
                                textAlign: 'center',
                                marginTop: '4px',
                                fontSize: '12px',
                                color: 'var(--text-tertiary)'
                            }}>
                                Having storage issues?{' '}
                                <button
                                    type="button"
                                    onClick={handleClearStorage}
                                    style={{
                                        background: 'none', border: 'none',
                                        color: 'var(--color-primary)', textDecoration: 'underline',
                                        cursor: 'pointer', fontSize: '12px', padding: 0
                                    }}
                                >
                                    Clear Storage
                                </button>
                            </div>

                            <div style={{
                                textAlign: 'center',
                                fontSize: '11px',
                                color: 'var(--text-tertiary)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px'
                            }}>
                                <Link to="/privacy-policy" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                                    Privacy Policy
                                </Link>
                                <span>&copy; {new Date().getFullYear()} Koinonia Ushering Department Abuja</span>
                            </div>
                        </form>
                    </motion.div>
                </AnimatePresence>
            </motion.div>
        </div>
    );
}