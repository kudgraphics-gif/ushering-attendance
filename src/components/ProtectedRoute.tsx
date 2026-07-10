import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useVolunteerAuthStore } from '../stores/volunteerAuthStore';
import type { Role } from '../types';

interface ProtectedRouteProps {
    children: ReactNode;
    allowedRoles?: Role[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { isAuthenticated, user } = useAuthStore();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
}

export function SharedProtectedRoute({ children }: { children: ReactNode }) {
    const { isAuthenticated } = useAuthStore();
    const { isAuthenticated: isVolunteerAuthenticated } = useVolunteerAuthStore();
    const location = useLocation();

    if (!isAuthenticated && !isVolunteerAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}
