import { create } from 'zustand';
import { supabase } from '../shared/lib/supabaseClient';
import useSettingsStore from './useSettingsStore';

/**
 * useProfileStore — single source of truth for auth + accessibility profile.
 * Mirrors the `profiles` table in Supabase, plus auth actions.
 */
const useProfileStore = create((set, get) => ({
    // --- state (mirrors `profiles` table) ---
    id: null,
    email: '',
    username: '',
    name: '',
    bio: '',
    pronouns: '',
    gender: '',
    avatar_base64: '',
    role: 'student',
    language: 'en',

    needs: {
        dyslexia: false,
        adhd: false,
        autism: false,
        dyscalculia: false,
        lowVision: false,
    },
    primaryMode: null,

    progress: {
        readingStreak: 0,
        focusSessionsWeek: 0,
        mathAccuracy: 0,
        dailyStreak: 0,
    },

    isAuthenticated: false,
    loading: false,
    error: null,

    // --- auth actions ---

    signup: async ({ email, password, username }) => {
        set({ loading: true, error: null });
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { username } },
        });

        if (error) {
            set({ error: error.message, loading: false });
            return { success: false, error: error.message };
        }

        if (data.user) {
            set({ id: data.user.id, username, isAuthenticated: true, loading: false });
        }
        return { success: true };
    },

    login: async ({ email, password }) => {
        set({ loading: true, error: null });
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            set({ error: error.message, loading: false });
            return { success: false, error: error.message };
        }

        set({ isAuthenticated: true });
        await get().fetchProfile();
        return { success: true };
    },

    logout: async () => {
        await supabase.auth.signOut();
        get().reset();
    },

    checkSession: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            set({ isAuthenticated: true });
            await get().fetchProfile();
        } else {
            useSettingsStore.getState().loadSettings(null);
        }
    },

    // --- profile actions ---

    fetchProfile: async () => {
        set({ loading: true, error: null });
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            set({ loading: false });
            return;
        }

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error) {
            set({ error: error.message, loading: false });
            return;
        }

        // Also grab email from auth user
        const email = user.email ?? '';

        set({
            id: data.id,
            email,
            username: data.username ?? '',
            name: data.name ?? '',
            bio: data.bio ?? '',
            pronouns: data.pronouns ?? '',
            gender: data.gender ?? '',
            avatar_base64: data.avatar_base64 ?? '',
            role: data.role ?? 'student',
            language: data.language ?? 'en',
            needs: {
                dyslexia: data.has_dyslexia ?? false,
                adhd: data.has_adhd ?? false,
                autism: data.has_autism ?? false,
                dyscalculia: data.has_dyscalculia ?? false,
                lowVision: data.has_low_vision ?? false,
            },
            primaryMode: data.primary_mode ?? null,
            progress: {
                readingStreak: data.reading_streak ?? 0,
                focusSessionsWeek: data.focus_sessions_week ?? 0,
                mathAccuracy: data.math_accuracy ?? 0,
                dailyStreak: data.daily_streak ?? 0,
            },
            isAuthenticated: true,
            loading: false,
        });
        useSettingsStore.getState().loadSettings(data.id);
    },

    updateProfile: async (updates) => {
        set((state) => ({ ...state, ...updates }));
        await get().syncProfile();
    },

    toggleNeed: async (needKey) => {
        set((state) => ({
            needs: { ...state.needs, [needKey]: !state.needs[needKey] },
        }));
        await get().syncProfile();
    },

    syncProfile: async () => {
        const state = get();
        if (!state.id) return;

        const { error } = await supabase.from('profiles').update({
            name: state.name,
            username: state.username,
            bio: state.bio,
            pronouns: state.pronouns,
            gender: state.gender,
            avatar_base64: state.avatar_base64,
            role: state.role,
            language: state.language,
            has_dyslexia: state.needs.dyslexia,
            has_adhd: state.needs.adhd,
            has_autism: state.needs.autism,
            has_dyscalculia: state.needs.dyscalculia,
            has_low_vision: state.needs.lowVision,
            primary_mode: state.primaryMode,
        }).eq('id', state.id);

        if (error) set({ error: error.message });
    },

    reset: () => {
        set({
            id: null, email: '', username: '', name: '', bio: '', pronouns: '', gender: '', avatar_base64: '',
            role: 'student', language: 'en', primaryMode: null,
            needs: { dyslexia: false, adhd: false, autism: false, dyscalculia: false, lowVision: false },
            progress: { readingStreak: 0, focusSessionsWeek: 0, mathAccuracy: 0, dailyStreak: 0 },
            isAuthenticated: false, loading: false, error: null,
        });
        useSettingsStore.getState().resetSettings();
    },
}));

export default useProfileStore;