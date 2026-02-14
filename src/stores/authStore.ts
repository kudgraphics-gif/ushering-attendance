import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware'; // <--- 1. Import persist
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
    lastActivity: number; // Timestamp of last user activity
    updateActivity: () => void;
    checkInactivity: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist( // <--- 2. Wrap your store in persist
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            loading: false,
            error: null,
            token: null,
            lastActivity: Date.now(),

            updateActivity: () => {
                set({ lastActivity: Date.now() });
            },

            checkInactivity: () => {
                const { lastActivity, isAuthenticated, logout } = get();
                if (!isAuthenticated) return;

                const EIGHT_HOURS = 8 * 60 * 60 * 1000;
                const timeSinceLastActivity = Date.now() - lastActivity;

                if (timeSinceLastActivity > EIGHT_HOURS) {
                    logout();
                    // Optionally triggers a toast or redirect logic in the component observing this
                }
            },

            login: async (email: string, password: string) => {
                set({ loading: true, error: null });
                try {
                    const payload: LoginPayload = { user: email, password };
                    const userData = await authAPI.login(payload);

                    // Generate a token (in a real app, this comes from the backend)
                    const token = `token_${userData.id}`;

                    // Check for locally persisted avatar
                    try {
                        const localAvatarKey = `avatar_${userData.email}`;
                        const localAvatar = localStorage.getItem(localAvatarKey);

                        if (localAvatar) {
                            userData.avatar_url = localAvatar;
                        }
                    } catch (storageError) {
                        // If localStorage has issues, just skip avatar loading
                        console.warn('Failed to load avatar from localStorage:', storageError);

                        // If quota exceeded, clear old avatars
                        if (storageError instanceof Error && storageError.name === 'QuotaExceededError') {
                            try {
                                const { clearAllAvatars } = await import('../utils/imageCompression');
                                clearAllAvatars();
                                console.log('Cleared avatars due to quota exceeded');
                            } catch (clearError) {
                                console.error('Failed to clear avatars:', clearError);
                            }
                        }
                    }

                    set({
                        user: userData,
                        isAuthenticated: true,
                        token,
                        loading: false,
                    });
                    // Note: No need to manually localStorage.setItem, persist does it for you!
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
                set({ user: null, isAuthenticated: false, token: null, error: null });
                // Note: No need to manually localStorage.removeItem
            },

            setUser: (user: UserDto) => {
                set({ user, isAuthenticated: true });
            },

            refresh: async () => {
                const { token, user } = get();

                if (!token || !user) {
                    return;
                }

                set({ loading: true, error: null });
                try {
                    // Re-validate against the backend using the stored user data
                    // (Adjust this call based on your actual API needs)
                    const userData = await authAPI.login({ user: user.email, password: user.email }); // Assuming simple refresh

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
                    // Optional: If refresh fails (e.g. token expired), you might want to logout
                    // set({ user: null, isAuthenticated: false, token: null });
                }
            },
        }),
        {
            name: 'auth-storage', // <--- 3. Unique name for localStorage key
            storage: createJSONStorage(() => localStorage), // (Optional) Explicitly use localStorage

            // 4. (Optional) Only persist specific fields to avoid saving loading/error states
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
                lastActivity: state.lastActivity
            }),
        }
    )
);