import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Globe } from 'lucide-react';
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
        patreon_address: '',
        patreon_name: '',
        patreon_phone: '',
        patreon_relationship: '',
        local_church: '',
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
                patreon_address: currentUser.patreon_address || '',
                patreon_name: currentUser.patreon_name || '',
                patreon_phone: currentUser.patreon_phone || '',
                patreon_relationship: currentUser.patreon_relationship || '',
                local_church: currentUser.local_church || '',
            });
        }
    }, [currentUser]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
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

                        <div className="update-profile-form__grid">
                            <div className="update-profile-form__field">
                                <label className="update-profile-form__label">Local Church</label>
                                <Input
                                    type="text"
                                    name="local_church"
                                    value={formData.local_church || ''}
                                    onChange={handleChange}
                                    placeholder="Local Church Name"
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
                        <h2 className="update-profile-form__section-title">Close Family/Friend Contact Information</h2>

                        <div className="update-profile-form__grid">
                            <div className="update-profile-form__field">
                                <label className="update-profile-form__label">Name</label>
                                <Input
                                    type="text"
                                    name="patreon_name"
                                    value={formData.patreon_name || ''}
                                    onChange={handleChange}
                                    placeholder="Full name"
                                />
                            </div>

                            <div className="update-profile-form__field">
                                <label className="update-profile-form__label">Phone</label>
                                <Input
                                    type="tel"
                                    name="patreon_phone"
                                    value={formData.patreon_phone || ''}
                                    onChange={handleChange}
                                    placeholder="Phone number"
                                    icon={<Phone size={18} />}
                                />
                            </div>
                        </div>

                        <div className="update-profile-form__grid">
                            <div className="update-profile-form__field">
                                <label className="update-profile-form__label">Residence</label>
                                <Input
                                    type="text"
                                    name="patreon_address"
                                    value={formData.patreon_address || ''}
                                    onChange={handleChange}
                                    placeholder="Residence address"
                                    icon={<MapPin size={18} />}
                                />
                            </div>

                            <div className="update-profile-form__field">
                                <label className="update-profile-form__label">Relationship</label>
                                <select
                                    name="patreon_relationship"
                                    value={formData.patreon_relationship || ''}
                                    onChange={handleChange}
                                    className="update-profile-form__select"
                                >
                                    <option value="">Select relationship</option>
                                    <option value="brother">Brother</option>
                                    <option value="sister">Sister</option>
                                    <option value="uncle">Uncle</option>
                                    <option value="husband">Husband</option>
                                    <option value="wife">Wife</option>
                                    <option value="father">Father</option>
                                    <option value="mother">Mother</option>
                                    <option value="nephew">Nephew</option>
                                    <option value="niece">Niece</option>
                                    <option value="grandma">Grandma</option>
                                    <option value="grandpa">Grandpa</option>
                                    <option value="friend">Friend</option>
                                    <option value="aunt">Aunt</option>
                                </select>
                            </div>
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
