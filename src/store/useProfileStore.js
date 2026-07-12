import { create } from 'zustand';
import { supabase } from '../shared/lib/supabaseClient';

/**
 * useProfileStore — single source of truth for auth + accessibility profile.
 * Mirrors the `profiles` table in Supabase, plus auth actions.
 */
const useProfileStore = create((set, get) => ({
    // --- state (mirrors `profiles` table) ---
    id: null,
    username: '',
    name: '',
    role: 'student',
    language: 'en',

    needs: {
        dyslexia: false,
        adhd: false,
        autism: false,
        dyscalculia: false,
        lowVision: false,
    },

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

        set({
            id: data.id,
            username: data.username ?? '',
            name: data.name ?? '',
            role: data.role ?? 'student',
            language: data.language ?? 'en',
            needs: {
                dyslexia: data.has_dyslexia,
                adhd: data.has_adhd,
                autism: data.has_autism,
                dyscalculia: data.has_dyscalculia,
                lowVision: data.has_low_vision,
            },
            progress: {
                readingStreak: data.reading_streak,
                focusSessionsWeek: data.focus_sessions_week,
                mathAccuracy: data.math_accuracy,
                dailyStreak: data.daily_streak,
            },
            isAuthenticated: true,
            loading: false,
        });
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
            role: state.role,
            language: state.language,
            has_dyslexia: state.needs.dyslexia,
            has_adhd: state.needs.adhd,
            has_autism: state.needs.autism,
            has_dyscalculia: state.needs.dyscalculia,
            has_low_vision: state.needs.lowVision,
        }).eq('id', state.id);

        if (error) set({ error: error.message });
    },

    reset: () => set({
        id: null, username: '', name: '', role: 'student', language: 'en',
        needs: { dyslexia: false, adhd: false, autism: false, dyscalculia: false, lowVision: false },
        progress: { readingStreak: 0, focusSessionsWeek: 0, mathAccuracy: 0, dailyStreak: 0 },
        isAuthenticated: false, loading: false, error: null,
    }),
}));

export default useProfileStore;