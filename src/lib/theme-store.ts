"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface ThemeState {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => ({
            theme: 'light',

            toggleTheme: () => {
                const newTheme = get().theme === 'light' ? 'dark' : 'light';
                set({ theme: newTheme });
                // Update document class for Tailwind
                if (typeof document !== 'undefined') {
                    document.documentElement.classList.remove('light', 'dark');
                    document.documentElement.classList.add(newTheme);
                }
            },

            setTheme: (theme) => {
                set({ theme });
                if (typeof document !== 'undefined') {
                    document.documentElement.classList.remove('light', 'dark');
                    document.documentElement.classList.add(theme);
                }
            },
        }),
        {
            name: 'crm-theme',
            onRehydrateStorage: () => (state) => {
                // Apply theme on hydration
                if (state && typeof document !== 'undefined') {
                    document.documentElement.classList.remove('light', 'dark');
                    document.documentElement.classList.add(state.theme);
                }
            },
        }
    )
);
