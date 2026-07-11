import { motion } from 'framer-motion';
import { Shield, User } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';
import './ViewModeToggle.css';

export function ViewModeToggle() {
    const isAdminView = useAuthStore((state) => state.isAdminView);
    const toggleAdminView = useAuthStore((state) => state.toggleAdminView);

    const handleToggle = () => {
        toggleAdminView();
        toast.success(`Switched to ${!isAdminView ? 'Admin' : 'User'} view`);
    };

    return (
        <button
            className="view-toggle"
            onClick={handleToggle}
            aria-label="Toggle admin/user view"
            title={isAdminView ? "Switch to User View" : "Switch to Admin View"}
        >
            <motion.div
                className="view-toggle__track"
                animate={{
                    backgroundColor: isAdminView ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255, 255, 255, 0.1)'
                }}
            >
                <motion.div
                    className="view-toggle__thumb"
                    animate={{
                        x: isAdminView ? 28 : 2,
                        backgroundColor: isAdminView ? '#D4AF37' : '#FFFFFF'
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                    <div className="view-toggle__icon">
                        {isAdminView ? (
                            <Shield size={14} color="#FFFFFF" />
                        ) : (
                            <User size={14} color="#000000" />
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </button>
    );
}
