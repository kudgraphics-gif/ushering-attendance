import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import { setDeviceSession, getDeviceSession } from '../utils/deviceId';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import './LoginPage.css';

export function LoginPage() {
    const navigate = useNavigate();
    const { login, loading, logout } = useAuthStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            toast.error('Please fill in all fields');
            return;
        }

        try {
            // 1. Login first to verify credentials & get role
            await login(email.toLowerCase(), password);
            
            // Get fresh user data
            const currentUser = useAuthStore.getState().user;
            const isAdmin = currentUser?.role === 'Admin';
            const currentEmail = email.toLowerCase();
            
            // 2. Check Device Session
            const deviceSession = getDeviceSession();

            // --- STRICT CHECK ---
            // If device is used by someone else AND current user is NOT Admin
            if (deviceSession && deviceSession.userId !== currentEmail && !isAdmin) {
                
                // Security: Log them out immediately
                logout();
                
                // Alert the user simply
                toast.error(`Access Denied: This device is linked to ${deviceSession.userId}`);
                
                console.warn(`Login blocked. Device locked to ${deviceSession.userId}`);
                return; // STOP. Do not navigate.
            }

            // 3. If allowed, update session and proceed
            setDeviceSession(currentEmail, `token_${Math.random()}`);
            toast.success('Login successful!');
            navigate('/dashboard');

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Invalid email or password';
            toast.error(errorMessage);
            // Ensure clean state on error
            logout();
        }
    };

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
                <div className="login-page__header">
                    <motion.div
                        className="login-page__icon"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    >
                        <LogIn size={32} />
                    </motion.div>
                    <h1 className="login-page__title">Koinonia Ushering</h1>
                    <p className="login-page__subtitle">Department Abuja</p>
                </div>

                <form className="login-page__form" onSubmit={handleSubmit}>
                    <Input
                        type="email"
                        label="Email"
                        icon={<Mail size={20} />}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                    />

                    <Input
                        type="password"
                        label="Password"
                        icon={<Lock size={20} />}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                    />

                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        fullWidth
                        loading={loading}
                    >
                        Sign In
                    </Button>
                </form>
            </motion.div>
        </div>
    );
}