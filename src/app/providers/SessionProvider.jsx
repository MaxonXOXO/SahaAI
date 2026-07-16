/**
 * SessionProvider.jsx — Restores the Supabase session on mount.
 *
 * Also installs dev-only debug utilities so they are never present
 * in production builds (Vite tree-shakes import.meta.env.DEV blocks).
 */
import { useEffect } from 'react';
import { useSessionRestore } from '../hooks/useSessionRestore';
import { logActivity }       from '../../shared/lib/logActivity';
import useProfileStore       from '../../store/useProfileStore';

export default function SessionProvider({ children }) {
    // Restore Supabase session
    useSessionRestore();

    // Dev-only debug globals — stripped by Vite in production
    useEffect(() => {
        if (import.meta.env.DEV) {
            window.__sahaDebug = {
                logActivity,
                store: useProfileStore,
            };
            // eslint-disable-next-line no-console
            console.info('[SahaAI dev] Debug tools available at window.__sahaDebug');
        }
        return () => {
            if (import.meta.env.DEV) {
                delete window.__sahaDebug;
            }
        };
    }, []);

    return children;
}
