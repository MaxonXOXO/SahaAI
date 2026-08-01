import { create } from 'zustand';

const DEFAULT_SETTINGS = {
    // Font settings
    fontFamily: 'default', // default, dyslexia, malayalam
    fontWeight: 'normal', // normal, medium, bold
    fontSize: 'medium', // small, medium, large

    // Display settings
    contrastMode: 'light', // light, dark, soft, high

    // Language settings
    displayLanguage: 'en', // en, ml
    ttsLanguage: 'en', // en, ml
    aiLanguage: 'en', // en, ml
    speechLanguage: 'en', // en, ml
};

let currentUserId = null;

// Older installs stored "default" for the light palette. Normalize it once
// during hydration so the visible Light Theme option is correctly selected.
const normalizeSettings = (settings = {}) => ({
    ...DEFAULT_SETTINGS,
    ...settings,
    contrastMode: settings.contrastMode === 'default' ? 'light' : (settings.contrastMode || 'light'),
});

const useSettingsStore = create((set, get) => ({
    ...DEFAULT_SETTINGS,

    updateSettings: (newSettings) => {
        set((state) => {
            const nextState = normalizeSettings({ ...state, ...newSettings });
            
            // Persist settings
            const storageKey = currentUserId 
                ? `saha-settings-storage-${currentUserId}` 
                : 'saha-settings-storage-anonymous';
                
            localStorage.setItem(storageKey, JSON.stringify({
                fontFamily: nextState.fontFamily,
                fontWeight: nextState.fontWeight,
                fontSize: nextState.fontSize,
                contrastMode: nextState.contrastMode,
                displayLanguage: nextState.displayLanguage,
                ttsLanguage: nextState.ttsLanguage,
                aiLanguage: nextState.aiLanguage,
                speechLanguage: nextState.speechLanguage,
            }));
            
            return nextState;
        });
    },

    loadSettings: (userId) => {
        currentUserId = userId;
        
        if (!userId) {
            // Load anonymous settings
            const cachedAnon = localStorage.getItem('saha-settings-storage-anonymous');
            if (cachedAnon) {
                try {
                    const parsed = JSON.parse(cachedAnon);
                    set(normalizeSettings(parsed));
                } catch (e) {
                    set(DEFAULT_SETTINGS);
                }
            } else {
                set(DEFAULT_SETTINGS);
            }
            return;
        }

        const cachedUser = localStorage.getItem(`saha-settings-storage-${userId}`);
        if (cachedUser) {
            try {
                const parsed = JSON.parse(cachedUser);
                set(normalizeSettings(parsed));
            } catch (e) {
                console.error('Failed to parse user settings:', e);
                set(DEFAULT_SETTINGS);
            }
        } else {
            // No user settings yet, check if we have active anonymous/onboarding settings to migrate
            const cachedAnon = localStorage.getItem('saha-settings-storage-anonymous');
            if (cachedAnon) {
                try {
                    const parsed = JSON.parse(cachedAnon);
                    set(normalizeSettings(parsed));
                    // Save it for this user
                    localStorage.setItem(`saha-settings-storage-${userId}`, cachedAnon);
                } catch (e) {
                    set(DEFAULT_SETTINGS);
                }
            } else {
                set(DEFAULT_SETTINGS);
            }
        }
    },

    resetSettings: () => {
        currentUserId = null;
        localStorage.removeItem('saha-settings-storage-anonymous');
        set(DEFAULT_SETTINGS);
    }
}));

export default useSettingsStore;
