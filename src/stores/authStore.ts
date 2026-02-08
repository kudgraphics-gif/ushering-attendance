import { create } from 'zustand';
import { authAPI } from '../services/api';
import type { UserDto, LoginPayload } from '../types';

interface AuthState {
    user: UserDto | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
    token: string | null;
    login: (user: string, password: string) => Promise<void>;
    logout: () => void;
    setUser: (user: UserDto) => void;
    refresh: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
    token: localStorage.getItem('auth_token'),

    login: async (user: string, password: string) => {
        set({ loading: true, error: null });
        try {
            const payload: LoginPayload = { user, password };
            const userData = await authAPI.login(payload);
            
            // Store token in localStorage (in real app, backend would return it)
            const token = `token_${userData.id}`;
            localStorage.setItem('auth_token', token);
            
            set({
                user: userData,
                isAuthenticated: true,
                token,
                loading: false,
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Login failed';
            set({
                error: errorMessage,
                loading: false,
                isAuthenticated: false,
            });
            throw error;
        }
    },

    logout: () => {
        localStorage.removeItem('auth_token');
        set({ user: null, isAuthenticated: false, token: null, error: null });
    },

    setUser: (user: UserDto) => {
        set({ user, isAuthenticated: true });
    },

    refresh: async () => {
        const state = (useAuthStore as any).getState();
        const token = state.token;
        const user = state.user;

        if (!token || !user) {
            console.warn('No auth token or user available for refresh');
            return;
        }

        set({ loading: true, error: null });
        try {
            // Refresh token by re-validating against the backend
            // This keeps the session alive without requiring login
            const userData = await authAPI.login(user.email, user.email);
            
            // Update user without changing token
            set({
                user: userData,
                isAuthenticated: true,
                loading: false,
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Refresh failed';
            set({
                error: errorMessage,
                loading: false,
            });
            // Don't log out on refresh failure, just report the error
            throw error;
        }
    },
}));
