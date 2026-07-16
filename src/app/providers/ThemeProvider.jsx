/**
 * ThemeProvider.jsx — Computes and applies CSS variables and theme/contrast classes.
 *
 * Consumes accessibility context to determine active state.
 * Employs useAccessibilityTheme to retrieve and inject custom variables and class lists.
 */
import { useAccessibility } from './AccessibilityProvider';
import { useAccessibilityTheme } from '../hooks/useAccessibilityTheme';

export default function ThemeProvider({ children }) {
    const { active } = useAccessibility();
    const { styles, containerClass } = useAccessibilityTheme({ active });

    return (
        <div 
            className={`w-full flex-1 flex flex-col transition-all duration-200 ${containerClass}`}
            style={styles}
        >
            {children}
        </div>
    );
}
