import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Modal } from './Modal';
import { Input } from './Input';
import { Button } from './Button';
import type { UserDto } from '../../types';
import '../../styles/forms.css';

interface UserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Partial<UserDto> & { password?: string }) => Promise<void>;
    user?: UserDto;
    loading?: boolean;
    mode: 'create' | 'edit';
}

export function UserFormModal({
    isOpen,
    onClose,
    onSubmit,
    user,
    loading = false,
    mode,
}: UserFormModalProps) {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        dob: '',
        year_joined: new Date().getFullYear().toString(),
        role: 'User' as 'User' | 'Admin',
        gender: '' as 'male' | 'female' | '',
        phone: '',
    });

    useEffect(() => {
        // Only run this logic when the modal is actually open
        if (isOpen) {
            if (mode === 'edit' && user) {
                // Pre-fill fields. Use || '' to prevent 'null' from breaking the inputs
                setFormData({
                    first_name: user.first_name || '',
                    last_name: user.last_name || '',
                    email: user.email || '',
                    password: '', // Always empty on edit, unless they type a new one
                    dob: user.dob ? user.dob.split('T')[0] : '',
                    year_joined: user.year_joined || new Date().getFullYear().toString(),
                    role: (user.role === 'Admin' ? 'Admin' : 'User'),
                    gender: (user.gender as 'male' | 'female' | '') || '',
                    phone: user.phone || '',
                });
            } else {
                // Reset form completely for 'create' mode
                setFormData({
                    first_name: '',
                    last_name: '',
                    email: '',
                    password: '',
                    dob: '',
                    year_joined: new Date().getFullYear().toString(),
                    role: 'User',
                    gender: '',
                    phone: '',
                });
            }
        }
    }, [isOpen, user, mode]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const submitData: Partial<UserDto> & { password?: string } = {
                first_name: formData.first_name,
                last_name: formData.last_name,
                email: formData.email,
                year_joined: formData.year_joined,
                role: formData.role,
                is_active: true,
            };

            // Only append optional fields if they have a value
            if (formData.gender) submitData.gender = formData.gender as any;
            if (formData.phone) submitData.phone = formData.phone;

            // Format DOB as ISO DateTime with default 00:00:00.000 time
            if (formData.dob) {
                submitData.dob = `${formData.dob}T00:00:00.000`;
            }

            // Handle Password safely
            if (formData.password) {
                submitData.password = formData.password;
            }

            if (mode === 'create' && !formData.password) {
                alert('Password is required for new users');
                return;
            }

            await onSubmit(submitData);
            // The parent component should handle closing the modal upon success, 
            // but we leave this here if your flow relies on it.
        } catch (error) {
            console.error('Form submission error:', error);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <motion.div
                className="form-modal"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
            >
                <div className="form-modal__header">
                    <h2 className="form-modal__title">
                        {mode === 'create' ? 'Register User' : 'Edit User'}
                    </h2>
                    <button
                        className="form-modal__close"
                        onClick={onClose}
                        disabled={loading}
                    >
                        <X size={24} />
                    </button>
                </div>

                <form className="form-modal__form" onSubmit={handleSubmit}>
                    <div className="form-modal__row">
                        <Input
                            type="text"
                            label="First Name"
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleChange}
                            required
                            disabled={loading}
                        />
                        <Input
                            type="text"
                            label="Last Name"
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleChange}
                            required
                            disabled={loading}
                        />
                    </div>

                    <Input
                        type="email"
                        label="Email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled={loading}
                    />

                    <Input
                        type="password"
                        label={mode === 'create' ? 'Password' : 'Password (leave blank to keep current)'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required={mode === 'create'}
                        disabled={loading}
                    />

                    <div className="form-modal__row">
                        <Input
                            type="date"
                            label="Date of Birth"
                            name="dob"
                            value={formData.dob}
                            onChange={handleChange}
                            disabled={loading}
                        />
                        <Input
                            type="tel"
                            label="Phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            disabled={loading}
                        />
                    </div>

                    <div className="form-modal__row">
                        <div className="form-modal__field">
                            <label className="form-modal__label">Gender</label>
                            <select
                                name="gender"
                                className="form-modal__select"
                                value={formData.gender}
                                onChange={handleChange}
                                disabled={loading}
                            >
                                <option value="">Not specified</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                        </div>
                        <div className="form-modal__field">
                            <label className="form-modal__label">Role</label>
                            <select
                                name="role"
                                className="form-modal__select"
                                value={formData.role}
                                onChange={handleChange}
                                disabled={loading}
                            >
                                <option value="User">User</option>
                                <option value="Admin">Admin</option>
                            </select>
                        </div>
                    </div>

                    <Input
                        type="number"
                        label="Year Joined"
                        name="year_joined"
                        value={formData.year_joined}
                        onChange={handleChange}
                        required
                        disabled={loading}
                    />

                    <div className="form-modal__actions">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            loading={loading}
                        >
                            {mode === 'create' ? 'Register User' : 'Update User'}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </Modal>
    );
}  