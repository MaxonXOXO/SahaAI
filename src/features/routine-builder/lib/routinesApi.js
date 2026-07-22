import { supabase } from '../../../shared/lib/supabaseClient';

const TABLE = 'routine_builder_routines';

/** Fetch all routines belonging to a user, oldest first. */
export async function fetchRoutines(userId) {
    if (!userId) return [];
    const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data ?? [];
}

/** Create a new routine. `routine` = { title, iconName, colorKey, steps }. */
export async function createRoutine(userId, routine) {
    const { data, error } = await supabase
        .from(TABLE)
        .insert({
            user_id: userId,
            title: routine.title,
            icon_name: routine.iconName,
            color_key: routine.colorKey,
            steps: routine.steps,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/** Partially update a routine. Only fields present in `updates` are sent. */
export async function updateRoutine(routineId, updates) {
    const payload = { updated_at: new Date().toISOString() };
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.iconName !== undefined) payload.icon_name = updates.iconName;
    if (updates.colorKey !== undefined) payload.color_key = updates.colorKey;
    if (updates.steps !== undefined) payload.steps = updates.steps;

    const { data, error } = await supabase
        .from(TABLE)
        .update(payload)
        .eq('id', routineId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteRoutine(routineId) {
    const { error } = await supabase.from(TABLE).delete().eq('id', routineId);
    if (error) throw error;
}
