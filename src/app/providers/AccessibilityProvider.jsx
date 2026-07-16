/**
 * AccessibilityProvider.jsx — Applies adaptive theme + typography to the app shell.
 *
 * Sits inside BrowserRouter so it can read the current pathname via useLocation.
 * Uses route metadata to decide whether to activate theming (skips onboarding routes).
 * Delegates all theme/typography calculation to useAccessibilityTheme().
 *
 * Viewport behavior:
 *   mobile    → max-w-[420px]  (phone frame)
 *   tablet    → max-w-[640px]
 *   a11y-desktop (low-vision) → max-w-[768px]
 * All containers remain centered and maintain visual consistency.
 */
import { useLocation }           from 'react-router-dom';
import useProfileStore           from '../../store/useProfileStore';
import { getRouteMeta }          from '../config/routeMeta';
import { useAccessibilityTheme } from '../hooks/useAccessibilityTheme';

export default function AccessibilityProvider({ children }) {
    const { pathname }    = useLocation();
    const isAuthenticated = useProfileStore((s) => s.isAuthenticated);
    const needs           = useProfileStore((s) => s.needs) || {};

    const { onboarding }  = getRouteMeta(pathname);
    const active          = isAuthenticated && !onboarding;

    const { styles, containerClass } = useAccessibilityTheme({ active });

    // Responsive max-width: low-vision users benefit from wider desktop layouts
    const maxWidth = needs.lowVision ? 'max-w-3xl' : 'max-w-[420px] sm:max-w-[520px]';

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex justify-center transition-colors duration-300">
            <div
                className={`w-full ${maxWidth} min-h-screen relative flex flex-col shadow-xl transition-all duration-200 ${containerClass}`}
                style={styles}
            >
                {children}
            </div>
        </div>
    );
}
