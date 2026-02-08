import type { ReactNode } from 'react';
import { useAuthStore } from '../../stores/authStore';
import type { Role } from '../../types';

interface RoleGateProps {
    children: ReactNode;
    allowedRoles: Role[];
    fallback?: ReactNode;
}

export function RoleGate({ children, allowedRoles, fallback = null }: RoleGateProps) {
    const user = useAuthStore((state: any) => state.user);

    if (!user || !allowedRoles.includes(user.role)) {
        return fallback;
    }

    return <>{children}</>;
}
