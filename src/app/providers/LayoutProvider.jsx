/**
 * LayoutProvider.jsx — Manages viewport scaling, mobile shell layout, and desktop centering.
 *
 * Checks low-vision mode to dynamically widen the display limits for desktop/tablet accessibility.
 */
import { useAccessibility } from './AccessibilityProvider';

export default function LayoutProvider({ children }) {
    const { needs } = useAccessibility();

    // Responsive scaling boundaries
    // Low-vision users get wider desktops/tablets (up to 3xl) to comfortably view text
    const maxWidth = needs.lowVision ? 'max-w-3xl' : 'max-w-[420px] sm:max-w-[520px]';

    return (
        <div className="h-screen max-h-screen overflow-hidden bg-gray-100 dark:bg-gray-950 flex justify-center transition-colors duration-300">
            <div className={`w-full ${maxWidth} h-full relative flex flex-col shadow-xl overflow-hidden`}>
                {children}
            </div>
        </div>
    );
}
