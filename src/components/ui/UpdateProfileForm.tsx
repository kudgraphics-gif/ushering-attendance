import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Globe, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { usersAPI } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import type { UserDto } from '../../types';
import '../../pages/SettingsPage.css';

interface UpdateProfileFormProps {
    onSuccess?: (user: UserDto) => void;
}

export function UpdateProfileForm({ onSuccess }: UpdateProfileFormProps) {
    const { user: currentUser, token, setUser } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<UserDto>>({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        gender: '',
        dob: '',
        address: '',
        city: '',
        state: '',
        country: '',
    });

    useEffect(() => {
        if (currentUser) {
            // Format dob to ISO format without time if it contains time
            let formattedDob = currentUser.dob || '';
            if (formattedDob && formattedDob.includes('T')) {
                formattedDob = formattedDob.split('T')[0];
            }

            setFormData({
                first_name: currentUser.first_name || '',
                last_name: currentUser.last_name || '',
                email: currentUser.email || '',
                phone: currentUser.phone || '',
                gender: currentUser.gender || '',
                dob: formattedDob,
                address: currentUser.address || '',
                city: currentUser.city || '',
                state: currentUser.state || '',
                country: currentUser.country || '',
            });

            // Set initial avatar preview
            const localAvatar = localStorage.getItem(`avatar_${currentUser.email}`);
            if (localAvatar) {
                setAvatarPreview(localAvatar);
                // Optionally update the prompt user state if needed, but for now just form persistence
            } else if (currentUser.avatar_url) {
                setAvatarPreview(currentUser.avatar_url);
            }
        }
    }, [currentUser]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size must be less than 5MB');
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result;
            if (typeof result === 'string') {
                setAvatarPreview(result);
            }
        };
        reader.readAsDataURL(file);

        // Upload immediately
        uploadAvatar(file);
    };

    const uploadAvatar = async (file: File) => {
        if (!token || !currentUser) {
            toast.error('Not authenticated');
            return;
        }

        setUploadingAvatar(true);
        try {
            // Convert to Base64
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64Image = reader.result as string;

                // Persist to local storage for device-level persistence
                localStorage.setItem(`avatar_${currentUser.email}`, base64Image);

                // Update the user with new avatar URL (which is now a data URI)
                const updatedUser: UserDto = {
                    ...currentUser,
                    avatar_url: base64Image,
                };

                // Update Zustand store
                setUser(updatedUser);
                setAvatarPreview(base64Image);

                toast.success('Profile picture updated successfully');
            };

        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to save profile picture');
            // Revert to saved
            const localAvatar = localStorage.getItem(`avatar_${currentUser.email}`);
            setAvatarPreview(localAvatar || currentUser?.avatar_url || null);
        } finally {
            setUploadingAvatar(false);
        }
    };

    const clearAvatar = () => {
        setAvatarPreview(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!token || !currentUser) {
            toast.error('Not authenticated');
            return;
        }

        setLoading(true);
        try {
            // Format dob with time if it's just a date
            let dobWithTime = formData.dob;
            if (dobWithTime && !dobWithTime.includes('T')) {
                dobWithTime = `${dobWithTime}T18:00:00`;
            }

            const updatePayload = {
                ...formData,
                id: currentUser.id,
                dob: dobWithTime,
            };

            await usersAPI.update(updatePayload, token);

            // Update the auth store with new user data
            const updatedUser: UserDto = {
                ...currentUser,
                ...formData,
                dob: dobWithTime,
            };
            setUser(updatedUser);

            toast.success('Profile updated successfully');
            onSuccess?.(updatedUser);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update profile');
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
            <Card glass className="update-profile-card">
                <form onSubmit={handleSubmit} className="update-profile-form">
                    <div className="update-profile-form__section">
                        <h2 className="update-profile-form__section-title">Personal Information</h2>

                        <div className="update-profile-form__grid">
                            <div className="update-profile-form__field">
                                <label className="update-profile-form__label">First Name</label>
                                <Input
                                    type="text"
                                    name="first_name"
                                    value={formData.first_name || ''}
                                    onChange={handleChange}
                                    placeholder="First name"
                                />
                            </div>

                            <div className="update-profile-form__field">
                                <label className="update-profile-form__label">Last Name</label>
                                <Input
                                    type="text"
                                    name="last_name"
                                    value={formData.last_name || ''}
                                    onChange={handleChange}
                                    placeholder="Last name"
                                />
                            </div>
                        </div>

                        <div className="update-profile-form__grid">
                            <div className="update-profile-form__field">
                                <label className="update-profile-form__label">Email</label>
                                <Input
                                    type="email"
                                    name="email"
                                    value={formData.email || ''}
                                    onChange={handleChange}
                                    placeholder="Email address"
                                    icon={<Mail size={18} />}
                                />
                            </div>

                            <div className="update-profile-form__field">
                                <label className="update-profile-form__label">Phone</label>
                                <Input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone || ''}
                                    onChange={handleChange}
                                    placeholder="Phone number"
                                    icon={<Phone size={18} />}
                                />
                            </div>
                        </div>

                        <div className="update-profile-form__grid">
                            <div className="update-profile-form__field">
                                <label className="update-profile-form__label">Gender</label>
                                <select
                                    name="gender"
                                    value={formData.gender || ''}
                                    onChange={handleChange}
                                    className="update-profile-form__select"
                                >
                                    <option value="">Select gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div className="update-profile-form__field">
                                <label className="update-profile-form__label">Date of Birth</label>
                                <Input
                                    type="date"
                                    name="dob"
                                    value={formData.dob || ''}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="update-profile-form__section">
                        <h2 className="update-profile-form__section-title">Location Information</h2>

                        <div className="update-profile-form__grid">
                            <div className="update-profile-form__field">
                                <label className="update-profile-form__label">Address</label>
                                <Input
                                    type="text"
                                    name="address"
                                    value={formData.address || ''}
                                    onChange={handleChange}
                                    placeholder="Street address"
                                    icon={<MapPin size={18} />}
                                />
                            </div>
                        </div>

                        <div className="update-profile-form__grid">
                            <div className="update-profile-form__field">
                                <label className="update-profile-form__label">City</label>
                                <Input
                                    type="text"
                                    name="city"
                                    value={formData.city || ''}
                                    onChange={handleChange}
                                    placeholder="City"
                                />
                            </div>

                            <div className="update-profile-form__field">
                                <label className="update-profile-form__label">State</label>
                                <Input
                                    type="text"
                                    name="state"
                                    value={formData.state || ''}
                                    onChange={handleChange}
                                    placeholder="State/Province"
                                />
                            </div>

                            <div className="update-profile-form__field">
                                <label className="update-profile-form__label">Country</label>
                                <Input
                                    type="text"
                                    name="country"
                                    value={formData.country || ''}
                                    onChange={handleChange}
                                    placeholder="Country"
                                    icon={<Globe size={18} />}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="update-profile-form__section">
                        <h2 className="update-profile-form__section-title">Profile Picture</h2>
                        <div className="update-profile-form__field">
                            {avatarPreview && (
                                <div className="update-profile-form__avatar-preview">
                                    <img src={avatarPreview} alt="Avatar preview" />
                                    <button
                                        type="button"
                                        className="update-profile-form__avatar-remove"
                                        onClick={clearAvatar}
                                        disabled={uploadingAvatar}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            )}
                            <label className="update-profile-form__file-label">
                                <input
                                    type="file"
                                    name="avatar"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                    disabled={uploadingAvatar}
                                    className="update-profile-form__file-input"
                                />
                                <div className="update-profile-form__file-input-display">
                                    <Upload size={20} />
                                    <span>{uploadingAvatar ? 'Uploading...' : 'Click to upload or drag and drop'}</span>
                                    <p className="update-profile-form__hint">PNG, JPG, GIF up to 5MB</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="update-profile-form__actions">
                        <Button
                            type="submit"
                            variant="primary"
                            fullWidth
                            loading={loading}
                        >
                            Save Changes
                        </Button>
                    </div>
                </form>
            </Card>
        </motion.div>
    );
}
