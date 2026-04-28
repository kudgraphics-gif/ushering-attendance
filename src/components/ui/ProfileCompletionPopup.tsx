import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, ArrowRight, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import type { UserDto } from '../../types';
import './ProfileCompletionPopup.css';

/**
 * Blocking profile completion popup for User and Leader roles.
 * The popup cannot be dismissed — it redirects to /profile and blocks
 * all interaction until the close-family contact fields are fully filled.
 * Admins are excluded.
 */
export function ProfileCompletionPopup() {
    const user = useAuthStore((state) => state.user);
    const navigate = useNavigate();
    const location = useLocation();

    // Fields that MUST be filled for User/Leader roles
    const requiredFields: { key: keyof UserDto; label: string }[] = [
        { key: 'patreon_name', label: 'Close contact name' },
        { key: 'patreon_phone', label: 'Close contact phone' },
        { key: 'patreon_address', label: 'Close contact address' },
        { key: 'patreon_relationship', label: 'Close contact relationship' },
        { key: 'phone', label: 'Your phone number' },
        { key: 'gender', label: 'Your gender' },
    ];

    // Only show for User / Leader roles
    if (!user || user.role === 'Admin') return null;

    const missingFields = requiredFields.filter(f => !user[f.key as keyof typeof user]);
    const isIncomplete = missingFields.length > 0;

    // Already on profile page — don't show popup (let them fill the form)
    const isOnProfilePage = location.pathname === '/profile';

    // Auto-navigate to profile if incomplete and not already there
    useEffect(() => {
        if (isIncomplete && !isOnProfilePage) {
            const timer = setTimeout(() => {
                navigate('/profile');
            }, 1200);
            return () => clearTimeout(timer);
        }
    }, [isIncomplete, isOnProfilePage, navigate]);

    if (!isIncomplete || isOnProfilePage) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="profile-block-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div
                    className="profile-block-modal"
                    initial={{ opacity: 0, scale: 0.9, y: 24 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.4, type: 'spring', stiffness: 180 }}
                >
                    {/* Icon */}
                    <div className="profile-block-modal__icon">
                        <User size={32} />
                    </div>

                    {/* Text */}
                    <div className="profile-block-modal__body">
                        <h2 className="profile-block-modal__title">Complete Your Profile</h2>
                        <p className="profile-block-modal__message">
                            To continue using the app, please fill in the required information.
                            This helps us keep everyone safe and connected.
                        </p>

                        {/* Missing fields list */}
                        <div className="profile-block-modal__missing">
                            <div className="profile-block-modal__missing-label">
                                <AlertCircle size={14} />
                                Missing information:
                            </div>
                            <ul className="profile-block-modal__missing-list">
                                {missingFields.map(f => (
                                    <li key={f.key}>{f.label}</li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* CTA */}
                    <button
                        className="profile-block-modal__btn"
                        onClick={() => navigate('/profile')}
                    >
                        <span>Go to Profile</span>
                        <ArrowRight size={18} />
                    </button>

                    <p className="profile-block-modal__note">
                        You will be redirected automatically…
                    </p>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
