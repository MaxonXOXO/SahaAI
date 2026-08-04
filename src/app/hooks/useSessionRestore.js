/**
 * useSessionRestore.js — Boots the user session on first mount.
 *
 * Calls checkSession() once so the profile store hydrates from Supabase.
 * Returns the current authentication state for other hooks to depend on.
 */
import { useEffect } from 'react';
import useProfileStore from '../../store/useProfileStore';
import { supabase } from '../../shared/lib/supabaseClient';

export function useSessionRestore() {
    const checkSession    = useProfileStore((s) => s.checkSession);
    const isAuthenticated = useProfileStore((s) => s.isAuthenticated);

    useEffect(() => {
        checkSession();

        // Installed apps can be suspended for hours. Listen for token refreshes
        // and sign-outs so Zustand always mirrors the persisted Supabase session.
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_OUT') {
                useProfileStore.getState().reset();
                return;
            }
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                // Defer calls back into Supabase until its auth callback has
                // completed; calling it synchronously can block token refresh.
                window.setTimeout(() => useProfileStore.getState().checkSession(), 0);
            }
        });

        return () => subscription.unsubscribe();
    }, [checkSession]);

    return { isAuthenticated };
}
