import { create } from 'zustand';
import { fetchRoutines, createRoutine, updateRoutine, deleteRoutine } from './lib/routinesApi';

/**
 * useRoutineStore — Feature-local Zustand store for Routine Builder.
 *
 * Routines themselves live in Supabase (`routine_builder_routines`) since
 * they're durable content the user builds up over time, not throwaway
 * session state. This store just caches the list in memory and tracks
 * which routine is currently selected for "Run" mode.
 */
const useRoutineStore = create((set) => ({
    routines: [],
    loading: false,
    error: null,
    hasLoaded: false,

    activeRoutineId: null,

    loadRoutines: async (userId) => {
        if (!userId) return;
        set({ loading: true, error: null });
        try {
            const routines = await fetchRoutines(userId);
            set({ routines, loading: false, hasLoaded: true });
        } catch (err) {
            set({ error: err.message, loading: false, hasLoaded: true });
        }
    },

    addRoutine: async (userId, routine) => {
        const created = await createRoutine(userId, routine);
        set((state) => ({ routines: [...state.routines, created] }));
        return created;
    },

    editRoutine: async (routineId, updates) => {
        const updated = await updateRoutine(routineId, updates);
        set((state) => ({
            routines: state.routines.map((r) => (r.id === routineId ? updated : r)),
        }));
        return updated;
    },

    removeRoutine: async (routineId) => {
        await deleteRoutine(routineId);
        set((state) => ({
            routines: state.routines.filter((r) => r.id !== routineId),
            activeRoutineId: state.activeRoutineId === routineId ? null : state.activeRoutineId,
        }));
    },

    setActiveRoutineId: (routineId) => set({ activeRoutineId: routineId }),
}));

export default useRoutineStore;
