import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeState {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

// Helper to apply theme class to html element
const updateDomTheme = (theme: Theme) => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    document.documentElement.setAttribute('data-theme', theme);
};

// Check local storage or system preference
const getInitialTheme = (): Theme => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) return savedTheme;

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// Initialize theme immediately on app load (before React renders)
const initialTheme = getInitialTheme();
updateDomTheme(initialTheme);

export const useThemeStore = create<ThemeState>((set) => {
    return {
        theme: initialTheme,

        toggleTheme: () => set((state) => {
            const newTheme = state.theme === 'dark' ? 'light' : 'dark';
            localStorage.setItem('theme', newTheme);
            updateDomTheme(newTheme);
            return { theme: newTheme };
        }),

        setTheme: (theme) => set(() => {
            localStorage.setItem('theme', theme);
            updateDomTheme(theme);
            return { theme };
        }),
    };
});
