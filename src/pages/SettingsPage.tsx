import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock } from 'lucide-react';
import './SettingsPage.css';
import { UpdateProfileForm } from '../components/ui/UpdateProfileForm';
import { PasswordChangeForm } from '../components/ui/PasswordChangeForm';

export function SettingsPage() {
    const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

    return (
        <motion.div
            className="settings-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <div className="settings-page__header">
                <h1 className="settings-page__title">Settings</h1>
                <p className="settings-page__subtitle">Manage your account and preferences</p>
            </div>

            <div className="settings-page__tabs">
                <button 
                    className={`settings-page__tab ${activeTab === 'profile' ? 'settings-page__tab--active' : ''}`}
                    onClick={() => setActiveTab('profile')}
                >
                    <User size={20} />
                    <span>Profile</span>
                </button>
                <button 
                    className={`settings-page__tab ${activeTab === 'security' ? 'settings-page__tab--active' : ''}`}
                    onClick={() => setActiveTab('security')}
                >
                    <Lock size={20} />
                    <span>Security</span>
                </button>
            </div>

            <div className="settings-page__content">
                {activeTab === 'profile' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                    >
                        <UpdateProfileForm />
                    </motion.div>
                )}

                {activeTab === 'security' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                    >
                        <PasswordChangeForm />
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}
