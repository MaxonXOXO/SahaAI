import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import useProfileStore from '../../store/useProfileStore';
import { getEventLabel } from '../lib/eventRegistry';

/**
 * useProgressStats — computes real progress metrics from activity_log.
 *
 * Queries the user's activity history and derives:
 *   dailyStreak      — consecutive calendar days (up to today) with ≥1 logged event
 *   focusSessionsWeek — count of 'focus_session_completed' events in the last 7 days
 *   mathAccuracy      — average `metadata.accuracy` from 'math_problem_solved' (last 30 days)
 *   readingStreak     — consecutive days with any reading-related event
 *   totalSessions     — total activity count (all time)
 *   activeDays        — Set of ISO date strings with activity (last 7 days, for calendar)
 *
 * Falls back to zeros gracefully when offline or when the table is empty.
 */
export default function useProgressStats() {
    const userId = useProfileStore((s) => s.id);
    const [stats, setStats] = useState({
        dailyStreak: 0,
        focusSessionsWeek: 0,
        mathAccuracy: 0,
        readingStreak: 0,
        totalSessions: 0,
        toolsUsed: 0,
        recentActivity: [],
        activeDays: new Set(),
        loading: true,
    });

    useEffect(() => {
        if (!userId) {
            setStats((prev) => ({ ...prev, loading: false }));
            return;
        }

        let cancelled = false;

        async function compute() {
            // ── 1. Fetch all activity from last 30 days ─────────────────────
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { data, error } = await supabase
                .from('activity_log')
                .select('event_type, metadata, created_at')
                .eq('user_id', userId)
                .gte('created_at', thirtyDaysAgo.toISOString())
                .order('created_at', { ascending: false });

            if (cancelled) return;

            if (error) {
                console.error('useProgressStats fetch failed:', error);
                setStats((prev) => ({ ...prev, loading: false }));
                return;
            }

            const rows = data || [];

            // ── 2. Build a set of active dates (YYYY-MM-DD) ────────────────
            const dateSet = new Set();
            rows.forEach((r) => {
                const d = new Date(r.created_at);
                dateSet.add(d.toISOString().split('T')[0]);
            });

            // ── 3. Daily streak: consecutive days ending today ─────────────
            let dailyStreak = 0;
            const today = new Date();
            for (let i = 0; i < 30; i++) {
                const check = new Date(today);
                check.setDate(today.getDate() - i);
                const key = check.toISOString().split('T')[0];
                if (dateSet.has(key)) {
                    dailyStreak++;
                } else {
                    break; // streak broken
                }
            }

            // ── 4. Focus sessions this week ────────────────────────────────
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const focusSessionsWeek = rows.filter(
                (r) => r.event_type === 'focus_session_completed' &&
                       new Date(r.created_at) >= sevenDaysAgo
            ).length;

            // ── 5. Math accuracy (avg of metadata.accuracy, last 30 days) ─
            const mathRows = rows.filter(
                (r) => r.event_type === 'math_problem_solved' && typeof r.metadata?.correct === 'boolean'
            );
            const mathAccuracy = mathRows.length > 0
                ? Math.round((mathRows.filter((r) => r.metadata.correct).length / mathRows.length) * 100)
                : 0;

            // ── 6. Reading streak: consecutive days with reading events ────
            const readingEvents = new Set([
                'text_simplified', 'read_aloud_used', 'reading_minutes_logged',
                'spell_check_used', 'document_read', 'ocr_scan_used'
            ]);
            const readingDates = new Set();
            rows.forEach((r) => {
                if (readingEvents.has(r.event_type)) {
                    const d = new Date(r.created_at);
                    readingDates.add(d.toISOString().split('T')[0]);
                }
            });
            let readingStreak = 0;
            for (let i = 0; i < 30; i++) {
                const check = new Date(today);
                check.setDate(today.getDate() - i);
                const key = check.toISOString().split('T')[0];
                if (readingDates.has(key)) {
                    readingStreak++;
                } else {
                    break;
                }
            }

            // ── 7. Last 7 days active set (for calendar widget) ───────────
            const last7 = new Set();
            for (let i = 0; i < 7; i++) {
                const check = new Date(today);
                check.setDate(today.getDate() - i);
                const key = check.toISOString().split('T')[0];
                if (dateSet.has(key)) last7.add(key);
            }

            const grouped = new Map();
            rows.forEach((row) => {
                const current = grouped.get(row.event_type) || { eventType: row.event_type, count: 0, lastUsed: row.created_at };
                current.count += 1;
                if (new Date(row.created_at) > new Date(current.lastUsed)) current.lastUsed = row.created_at;
                grouped.set(row.event_type, current);
            });
            const recentActivity = [...grouped.values()]
                .map((item) => ({ ...item, label: getEventLabel(item.eventType) }))
                .sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed))
                .slice(0, 6);

            if (!cancelled) {
                setStats({
                    dailyStreak,
                    focusSessionsWeek,
                    mathAccuracy,
                    readingStreak,
                    totalSessions: rows.length,
                    toolsUsed: grouped.size,
                    recentActivity,
                    activeDays: last7,
                    loading: false,
                });
            }
        }

        compute();
        return () => { cancelled = true; };
    }, [userId]);

    return stats;
}
