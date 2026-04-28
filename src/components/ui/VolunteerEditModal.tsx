import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Mail, Phone, MapPin, Globe, Church, Calendar, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { volunteersAPI } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import type { VolunteerDto } from '../../types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    volunteer: VolunteerDto | null;
    onSuccess: (updated: VolunteerDto) => void;
}

export default function VolunteerEditModal({ isOpen, onClose, volunteer, onSuccess }: Props) {
    const { token } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<VolunteerDto>>({});

    useEffect(() => {
        if (volunteer) {
            let dob = volunteer.dob || '';
            if (dob.includes('T')) dob = dob.split('T')[0];
            setFormData({
                first_name: volunteer.first_name || '',
                last_name: volunteer.last_name || '',
                email: volunteer.email || '',
                phone: volunteer.phone || '',
                gender: volunteer.gender || '',
                dob,
                address: volunteer.address || '',
                city: volunteer.city || '',
                state: volunteer.state || '',
                country: volunteer.country || '',
                local_church: volunteer.local_church || '',
                year_joined: volunteer.year_joined || '',
            });
        }
    }, [volunteer]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token || !volunteer) return;

        setLoading(true);
        try {
            let dob = formData.dob;
            if (dob && !dob.includes('T')) dob = `${dob}T00:00:00.000Z`;

            await volunteersAPI.update(volunteer.id, { ...formData, dob }, token);
            onSuccess({ ...volunteer, ...formData, dob });
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update volunteer');
        } finally {
            setLoading(false);
        }
    };

    if (!volunteer) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    style={{
                        position: 'fixed', inset: 0, zIndex: 1000,
                        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '16px', overflowY: 'auto',
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        style={{
                            width: '100%', maxWidth: '540px',
                            background: 'var(--surface-card)',
                            borderRadius: '20px',
                            border: '1px solid rgba(255,255,255,0.08)',
                            boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
                            maxHeight: '90vh', overflowY: 'auto',
                        }}
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)',
                        }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                                    Edit Volunteer
                                </h2>
                                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                                    {volunteer.first_name} {volunteer.last_name}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                style={{
                                    width: 32, height: 32, borderRadius: '8px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    background: 'rgba(255,255,255,0.05)',
                                    color: 'var(--color-text-secondary)', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* Name row */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div className="volunteer-form__group">
                                    <label className="volunteer-form__label">First Name</label>
                                    <div className="volunteer-form__input-icon-wrap">
                                        <User size={15} className="volunteer-form__input-icon" />
                                        <input name="first_name" value={formData.first_name || ''} onChange={handleChange}
                                            className="volunteer-form__input volunteer-form__input--icon" placeholder="First name" />
                                    </div>
                                </div>
                                <div className="volunteer-form__group">
                                    <label className="volunteer-form__label">Last Name</label>
                                    <div className="volunteer-form__input-icon-wrap">
                                        <User size={15} className="volunteer-form__input-icon" />
                                        <input name="last_name" value={formData.last_name || ''} onChange={handleChange}
                                            className="volunteer-form__input volunteer-form__input--icon" placeholder="Last name" />
                                    </div>
                                </div>
                            </div>

                            <div className="volunteer-form__group">
                                <label className="volunteer-form__label">Email</label>
                                <div className="volunteer-form__input-icon-wrap">
                                    <Mail size={15} className="volunteer-form__input-icon" />
                                    <input name="email" type="email" value={formData.email || ''} onChange={handleChange}
                                        className="volunteer-form__input volunteer-form__input--icon" placeholder="Email" />
                                </div>
                            </div>

                            <div className="volunteer-form__group">
                                <label className="volunteer-form__label">Phone</label>
                                <div className="volunteer-form__input-icon-wrap">
                                    <Phone size={15} className="volunteer-form__input-icon" />
                                    <input name="phone" type="tel" value={formData.phone || ''} onChange={handleChange}
                                        className="volunteer-form__input volunteer-form__input--icon" placeholder="Phone" />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div className="volunteer-form__group">
                                    <label className="volunteer-form__label">Gender</label>
                                    <select name="gender" value={formData.gender || ''} onChange={handleChange}
                                        className="volunteer-form__input">
                                        <option value="">Select</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                </div>
                                <div className="volunteer-form__group">
                                    <label className="volunteer-form__label">Date of Birth</label>
                                    <div className="volunteer-form__input-icon-wrap">
                                        <Calendar size={15} className="volunteer-form__input-icon" />
                                        <input name="dob" type="date" value={formData.dob || ''} onChange={handleChange}
                                            className="volunteer-form__input volunteer-form__input--icon" />
                                    </div>
                                </div>
                            </div>

                            <div className="volunteer-form__group">
                                <label className="volunteer-form__label">Local Church</label>
                                <div className="volunteer-form__input-icon-wrap">
                                    <Church size={15} className="volunteer-form__input-icon" />
                                    <input name="local_church" value={formData.local_church || ''} onChange={handleChange}
                                        className="volunteer-form__input volunteer-form__input--icon" placeholder="Church name" />
                                </div>
                            </div>

                            <div className="volunteer-form__group">
                                <label className="volunteer-form__label">Address</label>
                                <div className="volunteer-form__input-icon-wrap">
                                    <MapPin size={15} className="volunteer-form__input-icon" />
                                    <input name="address" value={formData.address || ''} onChange={handleChange}
                                        className="volunteer-form__input volunteer-form__input--icon" placeholder="Address" />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                                <div className="volunteer-form__group">
                                    <label className="volunteer-form__label">City</label>
                                    <input name="city" value={formData.city || ''} onChange={handleChange}
                                        className="volunteer-form__input" placeholder="City" />
                                </div>
                                <div className="volunteer-form__group">
                                    <label className="volunteer-form__label">State</label>
                                    <input name="state" value={formData.state || ''} onChange={handleChange}
                                        className="volunteer-form__input" placeholder="State" />
                                </div>
                                <div className="volunteer-form__group">
                                    <label className="volunteer-form__label">Country</label>
                                    <div className="volunteer-form__input-icon-wrap">
                                        <Globe size={13} className="volunteer-form__input-icon" />
                                        <input name="country" value={formData.country || ''} onChange={handleChange}
                                            className="volunteer-form__input volunteer-form__input--icon" placeholder="Country" />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="volunteer-form__submit"
                                style={{ marginTop: '8px' }}
                            >
                                <Save size={17} />
                                <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                            </button>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
