import { motion } from 'framer-motion';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { LogIn, Trash2, Eye, RotateCcw } from 'lucide-react';
import type { UserDto, ActivityLogResponse } from '../../types';
import './DataTable.css';

interface DataTableColumn<T> {
    header: string;
    accessor: keyof T;
    render?: (value: any, row: T) => React.ReactNode;
    width?: string;
}

interface DataTableProps<T> {
    data: T[];
    columns: DataTableColumn<T>[];
    actions?: (row: T) => React.ReactNode;
    rowKey: keyof T;
}

export function DataTable<T>({ data, columns, actions, rowKey }: DataTableProps<T>) {
    return (
        <div className="data-table-wrapper">
            <table className="data-table">
                <thead className="data-table__head">
                    <tr className="data-table__header-row">
                        {columns.map((col, idx) => (
                            <th
                                key={idx}
                                className="data-table__header-cell"
                                style={{ width: col.width }}
                            >
                                {col.header}
                            </th>
                        ))}
                        {actions && <th className="data-table__header-cell">Actions</th>}
                    </tr>
                </thead>
                <tbody className="data-table__body">
                    {data.map((row, idx) => (
                        <motion.tr
                            key={String(row[rowKey])}
                            className="data-table__row"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: idx * 0.05 }}
                        >
                            {columns.map((col, colIdx) => (
                                <td
                                    key={colIdx}
                                    className="data-table__cell"
                                    style={{ width: col.width }}
                                >
                                    {col.render ? col.render(row[col.accessor], row) : String(row[col.accessor])}
                                </td>
                            ))}
                            {actions && (
                                <td className="data-table__cell data-table__cell--actions">
                                    {actions(row)}
                                </td>
                            )}
                        </motion.tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

interface UsersTableProps {
    users: UserDto[];
    onCheckIn?: (userId: string, userName: string) => void;
    onViewAttendance?: (user: UserDto) => void;
    onDelete?: (userId: string, userName: string) => void;
    onResetDeviceId?: (userId: string, userName: string) => void;
    isAdmin: boolean;
    isCheckingIn?: string | null;
}

export function UsersTable({
    users,
    onCheckIn,
    onViewAttendance,
    onDelete,
    onResetDeviceId,
    isAdmin,
    isCheckingIn,
}: UsersTableProps) {
    const columns = [
        {
            header: 'Name',
            accessor: 'first_name' as const,
            width: '200px',
            render: (_value: string, user: UserDto) => (
                <div className="users-table__name-cell">
                    <Avatar src={user.avatar_url} alt={user.first_name} size="sm" />
                    <div>
                        <div className="users-table__name">{user.first_name} {user.last_name}</div>
                        <div className="users-table__email">{user.email}</div>
                    </div>
                </div>
            ),
        },
        {
            header: 'Registration',
            accessor: 'reg_no' as const,
            width: '120px',
        },
        {
            header: 'Role',
            accessor: 'role' as const,
            width: '100px',
            render: (value: string) => <Badge role={value as any}>{value}</Badge>,
        },
        {
            header: 'Phone',
            accessor: 'phone' as const,
            width: '140px',
            render: (value: string) => value || 'N/A',
        },
        {
            header: 'Status',
            accessor: 'is_active' as const,
            width: '100px',
            render: (value: boolean) => (
                <span className={`users-table__status ${value ? 'users-table__status--active' : 'users-table__status--inactive'}`}>
                    {value ? 'Active' : 'Inactive'}
                </span>
            ),
        },
    ];

    return (
        <DataTable
            data={users}
            columns={columns}
            rowKey="id"
            actions={(user) => (
                <div className="users-table__actions">
                    {isAdmin && (
                        <>
                            <button
                                className="users-table__action-btn"
                                title="Check-in User"
                                onClick={() => onCheckIn?.(user.id, `${user.first_name} ${user.last_name}`)}
                                disabled={isCheckingIn === user.id}
                            >
                                <LogIn size={18} />
                            </button>
                            <button
                                className="users-table__action-btn"
                                title="View Attendance"
                                onClick={() => onViewAttendance?.(user)}
                            >
                                <Eye size={18} />
                            </button>
                            <button
                                className="users-table__action-btn"
                                title="Reset Device ID"
                                onClick={() => onResetDeviceId?.(user.id, `${user.first_name} ${user.last_name}`)}
                            >
                                <RotateCcw size={18} />
                            </button>
                            <button
                                className="users-table__action-btn users-table__action-btn--delete"
                                title="Delete User"
                                onClick={() => onDelete?.(user.id, `${user.first_name} ${user.last_name}`)}
                            >
                                <Trash2 size={18} />
                            </button>
                        </>
                    )}
                </div>
            )}
        />
    );
}

interface ActivityLogsTableProps {
    logs: ActivityLogResponse[];
    onViewUserLogs?: (userId: string) => void;
}

export function ActivityLogsTable({ logs, onViewUserLogs }: ActivityLogsTableProps) {
    const getActivityColor = (activityType: string) => {
        const colorMap: { [key: string]: string } = {
            'UserLogin': '#10B981',
            'UserLogout': '#8B5CF6',
            'UserCreated': '#3B82F6',
            'UserUpdated': '#D4AF37',
            'UserActivation': '#10B981',
            'UserDeactivation': '#EF4444',
            'UserMarkedAttendance': '#10B981',
            'AdminMarkedAttendanceForUser': '#3B82F6',
            'UserImported': '#F59E0B',
            'PasswordChanged': '#D4AF37',
            'DeviceReset': '#F59E0B',
            'EventCreated': '#3B82F6',
            'EventUpdated': '#D4AF37',
            'EventDeleted': '#EF4444',
            'EventCheckIn': '#10B981',
            'RosterCreated': '#3B82F6',
            'RosterUpdated': '#D4AF37',
            'RosterDeleted': '#EF4444',
            'AttendanceRevoked': '#EF4444',
        };
        return colorMap[activityType] || '#8B5CF6';
    };

    const columns = [
        {
            header: 'User',
            accessor: 'user_name' as const,
            width: '200px',
            render: (_value: string, log: ActivityLogResponse) => (
                <div className="activity-logs-table__user-cell">
                    <div className="activity-logs-table__user-name">{log.user_name}</div>
                    <div className="activity-logs-table__user-role">{log.user_role}</div>
                </div>
            ),
        },
        {
            header: 'Activity',
            accessor: 'activity_type' as const,
            width: '200px',
            render: (value: string) => (
                <div className="activity-logs-table__activity">
                    <div
                        className="activity-logs-table__indicator"
                        style={{ backgroundColor: getActivityColor(value) }}
                    />
                    <span>{value}</span>
                </div>
            ),
        },
        {
            header: 'Timestamp',
            accessor: 'created_at' as const,
            width: '200px',
            render: (value: string) => (
                new Date(value).toLocaleString()
            ),
        },
    ];

    return (
        <DataTable
            data={logs}
            columns={columns}
            rowKey="id"
            actions={(log) => (
                <div className="activity-logs-table__actions">
                    <button
                        className="activity-logs-table__action-btn"
                        title="View this user's activity logs"
                        onClick={() => onViewUserLogs?.(log.user_id)}
                    >
                        <Eye size={18} />
                    </button>
                </div>
            )}
        />
    );
}
