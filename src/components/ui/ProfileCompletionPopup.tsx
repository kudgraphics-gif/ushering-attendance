import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import './ProfileCompletionPopup.css';

export function ProfileCompletionPopup() {
    const user = useAuthStore((state) => state.user);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (!user) {
            setIsVisible(false);
            return;
        }

        // Check if user is not admin and has missing profile info
        const hasMissingInfo = 
            user.role !== 'Admin' &&
            (!user.address || !user.state || !user.city);

        // Check if user has already dismissed this popup today
        const dismissedToday = localStorage.getItem('profile-popup-dismissed');
        const today = new Date().toDateString();
        
        if (hasMissingInfo && dismissedToday !== today) {
            setIsVisible(true);
        }
    }, [user]);

    const handleDismiss = () => {
        setIsVisible(false);
        const today = new Date().toDateString();
        localStorage.setItem('profile-popup-dismissed', today);
    };

    const handleNavigateToSettings = () => {
        setIsVisible(false);
        const today = new Date().toDateString();
        localStorage.setItem('profile-popup-dismissed', today);
        window.location.href = '/profile';
    };

    if (!user || user.role === 'Admin') {
        return null;
    }

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="profile-completion-popup"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.9 }}
                >
                    <div className="profile-completion-popup__content">
                        <div className="profile-completion-popup__icon">
                            <AlertCircle size={24} />
                        </div>
                        <div className="profile-completion-popup__text">
                            <h3 className="profile-completion-popup__title">Complete Your Profile</h3>
                            <p className="profile-completion-popup__message">
                                Please complete your profile information to enhance your experience.
                            </p>
                        </div>
                        <div className="profile-completion-popup__actions">
                            <button 
                                className="profile-completion-popup__btn profile-completion-popup__btn--primary"
                                onClick={handleNavigateToSettings}
                            >
                                Complete Now
                            </button>
                            <button 
                                className="profile-completion-popup__btn profile-completion-popup__btn--secondary"
                                onClick={handleDismiss}
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                    <button
                        className="profile-completion-popup__close"
                        onClick={handleDismiss}
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
