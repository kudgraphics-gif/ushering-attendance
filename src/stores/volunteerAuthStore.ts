import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { VolunteerDto } from '../types';
import { volunteersAPI } from '../services/api';

interface VolunteerAuthState {
    volunteer: VolunteerDto | null;
    token: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
    loginVolunteer: (email: string, password: string) => Promise<void>;
    logoutVolunteer: () => void;
    setVolunteer: (v: VolunteerDto) => void;
}

export const useVolunteerAuthStore = create<VolunteerAuthState>()(
    persist(
        (set) => ({
            volunteer: null,
            token: null,
            isAuthenticated: false,
            loading: false,
            error: null,

            loginVolunteer: async (email: string, password: string) => {
                set({ loading: true, error: null });
                try {
                    const res = await volunteersAPI.login({ email, password });
                    set({
                        volunteer: res.volunteer,
                        token: res.token,
                        isAuthenticated: true,
                        loading: false,
                    });
                } catch (error) {
                    const msg = error instanceof Error ? error.message : 'Login failed';
                    set({ error: msg, loading: false, isAuthenticated: false });
                    throw error;
                }
            },

            logoutVolunteer: () => {
                set({ volunteer: null, token: null, isAuthenticated: false, error: null });
            },

            setVolunteer: (v: VolunteerDto) => {
                set({ volunteer: v });
            },
        }),
        {
            name: 'volunteer-auth-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                volunteer: state.volunteer,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
