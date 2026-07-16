/**
 * useSessionRestore.js — Boots the user session on first mount.
 *
 * Calls checkSession() once so the profile store hydrates from Supabase.
 * Returns the current authentication state for other hooks to depend on.
 */
import { useEffect } from 'react';
import useProfileStore from '../../store/useProfileStore';

export function useSessionRestore() {
    const checkSession    = useProfileStore((s) => s.checkSession);
    const isAuthenticated = useProfileStore((s) => s.isAuthenticated);

    useEffect(() => {
        checkSession();
    }, [checkSession]);

    return { isAuthenticated };
}
