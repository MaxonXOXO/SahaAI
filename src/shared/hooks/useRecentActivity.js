import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import useProfileStore from '../../store/useProfileStore';

/**
 * useRecentActivity — fetches the user's most recent tool usage
 * from the `activity_log` table to power Dashboard's "Recently Used" section.
 *
 * Returns: { recentItems, loading }
 *   recentItems: Array of { event_type, metadata, created_at } (deduplicated by event_type)
 *   loading: boolean
 *
 * Deduplication: If a user opened "Text Simplifier" 5 times, we only show
 * the most recent occurrence so the chip row stays useful.
 */
export default function useRecentActivity(limit = 5) {
    const userId = useProfileStore((s) => s.id);
    const [recentItems, setRecentItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setRecentItems([]);
            setLoading(false);
            return;
        }

        let cancelled = false;

        async function fetchRecent() {
            setLoading(true);
            // Fetch last 20 rows so we have enough to deduplicate
            const { data, error } = await supabase
                .from('activity_log')
                .select('event_type, metadata, created_at')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(20);

            if (cancelled) return;

            if (error) {
                console.error('useRecentActivity fetch failed:', error);
                setRecentItems([]);
            } else {
                // Deduplicate: keep only the first (most recent) occurrence per event_type
                const seen = new Set();
                const deduped = [];
                for (const row of data) {
                    if (!seen.has(row.event_type) && deduped.length < limit) {
                        seen.add(row.event_type);
                        deduped.push(row);
                    }
                }
                setRecentItems(deduped);
            }
            setLoading(false);
        }

        fetchRecent();
        return () => { cancelled = true; };
    }, [userId, limit]);

    return { recentItems, loading };
}
