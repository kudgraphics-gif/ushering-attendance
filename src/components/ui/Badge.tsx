import type { ReactNode } from 'react';
import clsx from 'clsx';
import type { Role } from '../../types';
import './Badge.css';


interface BadgeProps {
    children: ReactNode;
    variant?: 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'role';
    role?: Role;
    size?: 'sm' | 'md';
    className?: string;
}

export function Badge({ children, variant = 'primary', role, size = 'md', className }: BadgeProps) {
    const roleVariants: Record<Role, string> = {
        Admin: 'badge--admin',
        User: 'badge--user',
        Technical: 'badge--technical',
    };

    return (
        <span
            className={clsx(
                'badge',
                `badge--${size}`,
                role ? roleVariants[role] : `badge--${variant}`,
                className
            )}
        >
            {children}
        </span>
    );
}
