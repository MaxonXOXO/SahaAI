import { supabase } from './supabaseClient';

/**
 * Logs a meaningful user action for Progress tab stats and
 * Dashboard's "Recently Used" section.
 *
 * @param {string} userId - from useProfileStore(s => s.id)
 * @param {string} eventType - one of the agreed event_type strings
 * @param {object} metadata - optional extra data, e.g. { accuracy: 0.9 }
 */
export async function logActivity(userId, eventType, metadata = {}) {
  if (!userId) {
    console.warn('logActivity called without userId — skipping');
    return;
  }
  const { error } = await supabase.from('activity_log').insert({
    user_id: userId,
    event_type: eventType,
    metadata,
  });
  if (error) console.error('logActivity failed:', error);
}
