import { motion } from 'framer-motion';
import { User, Bell, Lock, Palette } from 'lucide-react';
import { Card } from '../components/ui/Card';
import './SettingsPage.css';

export function SettingsPage() {
    return (
        <motion.div
            className="settings-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <div className="settings-page__header">
                <h1 className="settings-page__title">Settings</h1>
                <p className="settings-page__subtitle">Manage your preferences and account</p>
            </div>

            <div className="settings-page__grid">
                <Card glass hover className="settings-card">
                    <div className="settings-card__icon settings-card__icon--blue">
                        <User size={24} />
                    </div>
                    <h3 className="settings-card__title">Profile Settings</h3>
                    <p className="settings-card__description">
                        Update your personal information and profile picture
                    </p>
                </Card>

                <Card glass hover className="settings-card">
                    <div className="settings-card__icon settings-card__icon--purple">
                        <Bell size={24} />
                    </div>
                    <h3 className="settings-card__title">Notifications</h3>
                    <p className="settings-card__description">
                        Configure how you receive notifications
                    </p>
                </Card>

                <Card glass hover className="settings-card">
                    <div className="settings-card__icon settings-card__icon--green">
                        <Lock size={24} />
                    </div>
                    <h3 className="settings-card__title">Security</h3>
                    <p className="settings-card__description">
                        Manage password and security preferences
                    </p>
                </Card>

                <Card glass hover className="settings-card">
                    <div className="settings-card__icon settings-card__icon--pink">
                        <Palette size={24} />
                    </div>
                    <h3 className="settings-card__title">Appearance</h3>
                    <p className="settings-card__description">
                        Customize theme and display settings
                    </p>
                </Card>
            </div>
        </motion.div>
    );
}
