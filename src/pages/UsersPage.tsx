import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Download, Upload, AlertCircle, Grid3x3, List, LogIn, Eye, Trash2, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { UsersTable } from '../components/ui/DataTable';
import { UserFormModal } from '../components/ui/UserFormModal';
import { AttendanceModal } from '../components/ui/AttendanceModal';
import { usersAPI, attendanceAPI, usersExportAPI } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import type { UserDto } from '../types';
import './UsersPage.css';

export function UsersPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState<UserDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserDto | undefined>();
    const [formLoading, setFormLoading] = useState(false);
    const [checkingInUser, setCheckingInUser] = useState<string | null>(null);
    const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
    const [selectedUserForAttendance, setSelectedUserForAttendance] = useState<UserDto | null>(null);
    const [exporting, setExporting] = useState(false);
    const [importing, setImporting] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const { token, user: currentUser } = useAuthStore();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        if (!token) {
            toast.error('Not authenticated');
            return;
        }

        setLoading(true);
        try {
            const data = await usersAPI.getAll(token);
            setUsers(data);
        } catch (error) {
            toast.error('Failed to load users');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckInUser = async (userId: string, userName: string) => {
        if (!token) {
            toast.error('Not authenticated');
            return;
        }

        setCheckingInUser(userId);
        try {
            await attendanceAPI.adminSign(userId, token);
            toast.success(`${userName} checked in successfully`);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Check-in failed');
            console.error(error);
        } finally {
            setCheckingInUser(null);
        }
    };

    const handleExport = async () => {
        if (!token) {
            toast.error('Not authenticated');
            return;
        }

        setExporting(true);
        try {
            const blob = await usersExportAPI.exportUsers(token);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `users_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success('Users exported successfully');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Export failed');
            console.error(error);
        } finally {
            setExporting(false);
        }
    };

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !token) {
            toast.error('Please select a file');
            return;
        }

        // Validate file type
        if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
            toast.error('Please select a CSV or Excel file');
            return;
        }

        setImporting(true);
        try {
            await usersExportAPI.importUsers(file, token);
            toast.success('Users imported successfully');
            await fetchUsers(); // Refresh the user list
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Import failed');
            console.error(error);
        } finally {
            setImporting(false);
            // Reset file input
            event.target.value = '';
        }
    };

    const filteredUsers = users.filter(user =>
        `${user.first_name} ${user.last_name} ${user.email}`.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleAddUser = () => {
        setSelectedUser(undefined);
        setIsModalOpen(true);
    };

    const handleEditUser = (user: UserDto) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const handleViewAttendance = (user: UserDto) => {
        setSelectedUserForAttendance(user);
        setAttendanceModalOpen(true);
    };

    const handleFormSubmit = async (data: Partial<UserDto> & { password?: string }) => {
        if (!token) {
            toast.error('Not authenticated');
            return;
        }

        setFormLoading(true);
        try {
            if (selectedUser) {
                // Update existing user using the new admin update endpoint
                await usersAPI.adminUpdate(selectedUser.id, data, token);
                setUsers(users.map(u => u.id === selectedUser.id ? { ...u, ...data } : u));
                toast.success('User updated successfully');
            } else {
                // Create new user
                await usersAPI.register(data as any, token);
                // Refresh the user list
                await fetchUsers();
                toast.success('User registered successfully');
            }
            setIsModalOpen(false);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Operation failed');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeleteUser = async (userId: string, userName: string) => {
        if (!token) {
            toast.error('Not authenticated');
            return;
        }

        // Confirm deletion
        const confirmDelete = window.confirm(
            `Are you sure you want to delete ${userName}? This action cannot be undone.`
        );

        if (!confirmDelete) return;

        try {
            await usersAPI.delete(userId, token);
            setUsers(users.filter(u => u.id !== userId));
            toast.success(`${userName} deleted successfully`);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Deletion failed');
            console.error(error);
        }
    };

    const handleResetDeviceId = async (userId: string, userName: string) => {
        if (!token) {
            toast.error('Not authenticated');
            return;
        }

        // Confirm reset
        const confirmReset = window.confirm(
            `Are you sure you want to reset the device ID for ${userName}? They will need to log in again.`
        );

        if (!confirmReset) return;

        try {
            await usersAPI.resetDeviceId(userId, token);
            toast.success(`Device ID reset successfully for ${userName}`);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Device ID reset failed');
            console.error(error);
        }
    };

    return (
        <motion.div
            className="users-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <div className="users-page__header">
                <div>
                    <h1 className="users-page__title">Users</h1>
                    <p className="users-page__subtitle">Manage system users</p>
                </div>
                <div className="users-page__actions">
                    <div className="users-page__view-toggle">
                        <button
                            className={`users-page__view-btn ${viewMode === 'grid' ? 'users-page__view-btn--active' : ''}`}
                            onClick={() => setViewMode('grid')}
                            title="Grid view"
                        >
                            <Grid3x3 size={20} />
                        </button>
                        <button
                            className={`users-page__view-btn ${viewMode === 'list' ? 'users-page__view-btn--active' : ''}`}
                            onClick={() => setViewMode('list')}
                            title="List view"
                        >
                            <List size={20} />
                        </button>
                    </div>
                    <div className="file-input-wrapper">
                        <input
                            type="file"
                            id="import-file"
                            accept=".csv,.xlsx"
                            onChange={handleImport}
                            disabled={importing}
                            style={{ display: 'none' }}
                        />
                        <Button
                            variant="secondary"
                            icon={<Upload size={20} />}
                            onClick={() => document.getElementById('import-file')?.click()}
                            loading={importing}
                        >
                            Import
                        </Button>
                    </div>
                    <Button
                        variant="secondary"
                        icon={<Download size={20} />}
                        onClick={handleExport}
                        loading={exporting}
                    >
                        Export
                    </Button>
                    <Button
                        variant="primary"
                        icon={<Plus size={20} />}
                        onClick={handleAddUser}
                    >
                        Add User
                    </Button>
                </div>
            </div>

            <Card glass className="users-page__search-card">
                <div className="users-page__search">
                    <Search size={20} className="users-page__search-icon" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="users-page__search-input"
                    />
                </div>
            </Card>

            {loading ? (
                <div className="users-page__loading">
                    <p>Loading users...</p>
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="users-page__empty">
                    <AlertCircle size={48} />
                    <p>No users found</p>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="users-page__grid">
                    {filteredUsers.map((user, index) => (
                        <UserCard
                            key={user.id}
                            user={user}
                            index={index}
                            onCheckIn={handleCheckInUser}
                            onViewAttendance={handleViewAttendance}
                            onEdit={handleEditUser} // Passed down here
                            onDelete={handleDeleteUser}
                            isCheckingIn={checkingInUser === user.id}
                            isAdmin={currentUser?.role === 'Admin'}
                        />
                    ))}
                </div>
            ) : (
                <Card glass className="users-page__table-card">
                    <UsersTable
                        users={filteredUsers}
                        onCheckIn={handleCheckInUser}
                        onViewAttendance={handleViewAttendance}
                        onEdit={handleEditUser} // Passed down here
                        onDelete={handleDeleteUser}
                        onResetDeviceId={handleResetDeviceId}
                        isAdmin={currentUser?.role === 'Admin'}
                        isCheckingIn={checkingInUser}
                    />
                </Card>
            )}

            <UserFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleFormSubmit}
                user={selectedUser}
                loading={formLoading}
                mode={selectedUser ? 'edit' : 'create'}
            />

            {selectedUserForAttendance && token && (
                <AttendanceModal
                    isOpen={attendanceModalOpen}
                    onClose={() => setAttendanceModalOpen(false)}
                    userId={selectedUserForAttendance.id}
                    userName={`${selectedUserForAttendance.first_name} ${selectedUserForAttendance.last_name}`}
                    token={token}
                />
            )}
        </motion.div>
    );
}

function UserCard({
    user,
    index,
    onCheckIn,
    onViewAttendance,
    onEdit,
    onDelete,
    isCheckingIn,
    isAdmin,
}: {
    user: UserDto;
    index: number;
    onCheckIn: (userId: string, userName: string) => Promise<void>;
    onViewAttendance: (user: UserDto) => void;
    onEdit: (user: UserDto) => void;
    onDelete: (userId: string, userName: string) => Promise<void>;
    isCheckingIn: boolean;
    isAdmin: boolean;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
        >
            <Card glass hover className="user-card">
                <div className="user-card__header">
                    <Avatar src={user.avatar_url} alt={user.first_name} size="lg" />
                    <Badge role={user.role} size="sm">{user.role}</Badge>
                </div>

                <div className="user-card__content">
                    <h3 className="user-card__name">
                        {user.first_name} {user.last_name}
                    </h3>
                    <p className="user-card__email">{user.email}</p>
                    <p className="user-card__reg">REG: {user.reg_no}</p>
                </div>

                <div className="user-card__details">
                    {user.phone && (
                        <div className="user-card__detail">
                            <span className="user-card__detail-label">Phone:</span>
                            <span className="user-card__detail-value">{user.phone}</span>
                        </div>
                    )}
                    <div className="user-card__detail">
                        <span className="user-card__detail-label">Joined:</span>
                        <span className="user-card__detail-value">{user.year_joined}</span>
                    </div>
                    <div className="user-card__detail">
                        <span className="user-card__detail-label">Status:</span>
                        <span className={`user-card__status ${user.is_active ? 'user-card__status--active' : 'user-card__status--inactive'}`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                </div>

                <div className="user-card__actions">
                    {isAdmin && (
                        <button
                            className="user-card__action-btn"
                            title="Check-in User"
                            onClick={() => onCheckIn(user.id, `${user.first_name} ${user.last_name}`)}
                            disabled={isCheckingIn}
                        >
                            <LogIn size={20} />
                        </button>
                    )}
                    {isAdmin && (
                        <button
                            className="user-card__action-btn"
                            title="View Attendance"
                            onClick={() => onViewAttendance(user)}
                        >
                            <Eye size={20} />
                        </button>
                    )}
                    {isAdmin && (
                        <button
                            className="user-card__action-btn"
                            title="Edit User"
                            onClick={() => onEdit(user)}
                        >
                            <Edit2 size={20} />
                        </button>
                    )}
                    {isAdmin && (
                        <button
                            className="user-card__action-btn user-card__action-btn--delete"
                            title="Delete User"
                            onClick={() => onDelete(user.id, `${user.first_name} ${user.last_name}`)}
                        >
                            <Trash2 size={20} />
                        </button>
                    )}
                </div>
            </Card>
        </motion.div>
    );
}