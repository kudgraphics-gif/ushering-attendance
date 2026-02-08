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
}));
