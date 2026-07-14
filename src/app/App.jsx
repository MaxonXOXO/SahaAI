import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';
import useProfileStore from '../store/useProfileStore';
import useAccessibilityTheme from '../shared/lib/useAccessibilityTheme';

/**
 * AccessibilityShell
 *
 * Sits INSIDE BrowserRouter so it has router context.
 * Applies the adaptive theme globally on every needs change.
 * Teammates never touch this file — the theme hook handles everything.
 */
function AccessibilityShell() {
    // Boot: restore session on app load
    const checkSession = useProfileStore((s) => s.checkSession);
    useEffect(() => { checkSession(); }, [checkSession]);

    // Apply adaptive UI based on disability profile
    useAccessibilityTheme();

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex justify-center">
            <div className="w-full max-w-[420px] min-h-screen relative flex flex-col shadow-xl"
                 style={{ background: 'var(--a11y-surface)' }}>
                <AppRoutes />
            </div>
        </div>
    );
}

/**
 * App shell — mobile-only viewport.
 * Fixed max-width container simulates a phone screen on desktop browsers
 * during development; on real mobile it just fills the viewport.
 */
export default function App() {
    return (
        <BrowserRouter>
            <AccessibilityShell />
        </BrowserRouter>
    );
}