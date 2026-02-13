import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, type Variants, AnimatePresence } from 'framer-motion';
import { Mail, Lock, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import { setDeviceSession, getDeviceSession } from '../utils/deviceId';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import './LoginPage.css';
import './LoginPageValues.css';

// Animation Variants for the desktop entrance
const containerVariants: Variants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            delayChildren: 0.5,
            staggerChildren: 0.1,
            duration: 0.8
        }
    }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, x: -10 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.5 }
    }
};

const CORE_VALUES = [
    "Our Core Values", // Added as the title/intro
    "Character",
    "Love",
    "Supremacy of The Word",
    "Excellence",
    "Service",
    "Faith",
    "The Anointing"
];

export function LoginPage() {
    const navigate = useNavigate();
    const { login, loading, logout } = useAuthStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Mobile: Cycling values state
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % CORE_VALUES.length);
        }, 3000); // Change every 3 seconds
        return () => clearInterval(timer);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            toast.error('Please fill in all fields');
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

    return (
        <div className="login-page">
            <div className="login-page__background">
                <div className="login-page__gradient login-page__gradient--1" />
                <div className="login-page__gradient login-page__gradient--2" />
                <div className="login-page__gradient login-page__gradient--3" />
            </div>

            {/* Login Card */}
            <motion.div
                className="login-page__card glass-strong"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="login-page__header">

                    {/* Animated Core Value Cycler (Subtle & Beautiful) */}
                    <div className="login-page__core-value-container">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentIndex}
                                initial={{ opacity: 0, y: 10, filter: 'blur(5px)' }}
                                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                exit={{ opacity: 0, y: -10, filter: 'blur(5px)' }}
                                transition={{ duration: 0.5, ease: "easeInOut" }}
                                className="login-page__core-value-text"
                            >
                                {CORE_VALUES[currentIndex]}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <motion.div
                        className="login-page__icon"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        whileHover={{ scale: 1.05, rotate: 5 }}
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