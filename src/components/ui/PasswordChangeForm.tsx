import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from './Card';
import { Button } from './Button';
import { usersAPI } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import '../../pages/SettingsPage.css';

interface PasswordChangeFormProps {
    onSuccess?: () => void;
}

export function PasswordChangeForm({ onSuccess }: PasswordChangeFormProps) {
    const { token } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    });
    const [formData, setFormData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field],
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate inputs
        if (!formData.current_password) {
            toast.error('Please enter your current password');
            return;
        }

        if (!formData.new_password) {
            toast.error('Please enter a new password');
            return;
        }

        if (formData.new_password.length < 6) {
            toast.error('New password must be at least 6 characters');
            return;
        }

        if (formData.new_password !== formData.confirm_password) {
            toast.error('Passwords do not match');
            return;
        }

        if (formData.current_password === formData.new_password) {
            toast.error('New password must be different from current password');
            return;
        }

        if (!token) {
            toast.error('Not authenticated');
            return;
        }

        setLoading(true);
        try {
            await usersAPI.update({
                password: formData.new_password,
            }, token);
            
            toast.success('Password changed successfully');
            
            // Clear form
            setFormData({
                current_password: '',
                new_password: '',
                confirm_password: '',
            });
            
            onSuccess?.();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <Card glass className="password-change-card">
                <form onSubmit={handleSubmit} className="password-change-form">
                    <div className="password-change-form__section">
                        <h2 className="password-change-form__section-title">Change Your Password</h2>
                        <p className="password-change-form__section-description">
                            For your security, please enter your current password and choose a new one.
                        </p>
                    </div>

                    <div className="password-change-form__section">
                        <div className="password-change-form__field">
                            <label className="password-change-form__label">Current Password</label>
                            <div className="password-change-form__input-wrapper">
                                <input
                                    type={showPasswords.current ? 'text' : 'password'}
                                    name="current_password"
                                    value={formData.current_password}
                                    onChange={handleChange}
                                    placeholder="Enter current password"
                                    className="password-change-form__input"
                                />
                                <button
                                    type="button"
                                    className="password-change-form__toggle"
                                    onClick={() => togglePasswordVisibility('current')}
                                >
                                    {showPasswords.current ? (
                                        <EyeOff size={18} />
                                    ) : (
                                        <Eye size={18} />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="password-change-form__field">
                            <label className="password-change-form__label">New Password</label>
                            <div className="password-change-form__input-wrapper">
                                <input
                                    type={showPasswords.new ? 'text' : 'password'}
                                    name="new_password"
                                    value={formData.new_password}
                                    onChange={handleChange}
                                    placeholder="Enter new password"
                                    className="password-change-form__input"
                                />
                                <button
                                    type="button"
                                    className="password-change-form__toggle"
                                    onClick={() => togglePasswordVisibility('new')}
                                >
                                    {showPasswords.new ? (
                                        <EyeOff size={18} />
                                    ) : (
                                        <Eye size={18} />
                                    )}
                                </button>
                            </div>
                            <p className="password-change-form__hint">
                                At least 6 characters recommended
                            </p>
                        </div>

                        <div className="password-change-form__field">
                            <label className="password-change-form__label">Confirm New Password</label>
                            <div className="password-change-form__input-wrapper">
                                <input
                                    type={showPasswords.confirm ? 'text' : 'password'}
                                    name="confirm_password"
                                    value={formData.confirm_password}
                                    onChange={handleChange}
                                    placeholder="Confirm new password"
                                    className="password-change-form__input"
                                />
                                <button
                                    type="button"
                                    className="password-change-form__toggle"
                                    onClick={() => togglePasswordVisibility('confirm')}
                                >
                                    {showPasswords.confirm ? (
                                        <EyeOff size={18} />
                                    ) : (
                                        <Eye size={18} />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="password-change-form__actions">
                        <Button
                            type="submit"
                            variant="primary"
                            fullWidth
                            loading={loading}
                        >
                            Change Password
                        </Button>
                    </div>
                </form>
            </Card>
        </motion.div>
    );
}
