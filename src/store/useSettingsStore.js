import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useSettingsStore = create(
    persist(
        (set) => ({
            // Font settings
            fontFamily: 'default', // default, dyslexia, malayalam
            fontWeight: 'normal', // normal, medium, bold
            fontSize: 'medium', // small, medium, large

            // Display settings
            contrastMode: 'default', // default, soft, high

            // Language settings
            displayLanguage: 'en', // en, ml
            ttsLanguage: 'en', // en, ml
            aiLanguage: 'en', // en, ml
            speechLanguage: 'en', // en, ml

            updateSettings: (newSettings) => set((state) => ({ ...state, ...newSettings })),
        }),
        {
            name: 'saha-settings-storage', // key in localStorage
        }
    )
);

export default useSettingsStore;
