import { useEffect } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import AppRoutes from './routes';
import useProfileStore from '../store/useProfileStore';
import useSettingsStore from '../store/useSettingsStore';
import { logActivity } from '../shared/lib/logActivity';

const ONBOARDING_ROUTES = ['/', '/language', '/profile-setup', '/signup', '/login'];

/**
 * AccessibilityShell
 *
 * Sits INSIDE BrowserRouter so it has router context.
 * Applies the adaptive theme globally on every needs change.
 */
function AccessibilityShell() {
    const { pathname } = useLocation();

    // Expose for testing in browser console
    useEffect(() => {
        window.logActivity = logActivity;
        window.useProfileStore = useProfileStore;
    }, []);

    // Boot: restore session on app load
    const checkSession = useProfileStore((s) => s.checkSession);
    useEffect(() => { checkSession(); }, [checkSession]);

    const needs = useProfileStore((s) => s.needs) || {};
    const isAuthenticated = useProfileStore((s) => s.isAuthenticated);
    const primaryMode = useProfileStore((s) => s.primaryMode);

    const {
        fontFamily,
        fontSize,
        fontWeight,
        contrastMode,
        displayLanguage
    } = useSettingsStore();

    const shouldApplyTheme = 
        isAuthenticated && 
        !ONBOARDING_ROUTES.includes(pathname);

    const isDyslexicFont = fontFamily === 'dyslexia' || (needs.dyslexia && fontFamily === 'default');

    // Dynamic Root Font Size Scaling (rem base)
    useEffect(() => {
        if (shouldApplyTheme) {
            if (fontSize === 'small') {
                document.documentElement.style.fontSize = '14px';
            } else if (fontSize === 'large') {
                document.documentElement.style.fontSize = '20px';
            } else {
                document.documentElement.style.fontSize = '16px';
            }
        } else {
            document.documentElement.style.fontSize = '16px';
        }
        return () => {
            document.documentElement.style.fontSize = '16px';
        };
    }, [fontSize, shouldApplyTheme]);

    // 1. Content scale (controlled via --a11y-scale CSS variable for dynamic typography scaling)
    let scaleValue = '1.0';
    if (shouldApplyTheme) {
        if (fontSize === 'small') scaleValue = '0.85';
        else if (fontSize === 'large') scaleValue = '1.25';
    }

    // 2. Font family & typography spacing overrides
    let fontFamilyValue = "'Inter', system-ui, sans-serif";
    let letterSpacing = 'normal';
    let wordSpacing = 'normal';
    let lineHeight = '1.55';

    if (shouldApplyTheme) {
        if (displayLanguage === 'ml') {
            if (isDyslexicFont) {
                fontFamilyValue = "'Baloo Chettan 2', system-ui, sans-serif";
            } else {
                fontFamilyValue = "'Noto Sans Malayalam', 'Inter', system-ui, sans-serif";
            }
        } else {
            if (isDyslexicFont) {
                fontFamilyValue = "'OpenDyslexic', 'Comic Sans MS', cursive";
                letterSpacing = '0.08em';
                wordSpacing = '0.18em';
                lineHeight = '1.9';
            }
        }
    }

    // 3. Font weight mappings
    let fontWeightBase = '400';
    let fontWeightBold = '700';
    if (shouldApplyTheme) {
        if (fontWeight === 'medium') {
            fontWeightBase = '500';
            fontWeightBold = '800';
        } else if (fontWeight === 'bold') {
            fontWeightBase = '700';
            fontWeightBold = '900';
        }
    }

    // 4. Contrast & Theme Colors
    let activeContrast = contrastMode;
    if (shouldApplyTheme && needs.lowVision && (contrastMode === 'default' || contrastMode === 'light')) {
        activeContrast = 'high';
    }

    // Defaults (Light theme)
    let primary = '#6D28D9';
    let primaryLight = '#8B5CF6';
    let bg = '#FFFFFF';
    let surface = '#FFFFFF';
    let text = '#1F2937';
    let textMuted = '#6B7280';
    let borderWidth = '2px';
    let isDarkMode = false;

    if (shouldApplyTheme) {
        if (activeContrast === 'high') {
            primary = '#FACC15';
            primaryLight = '#FDE68A';
            bg = '#0A0A0A';
            surface = '#0A0A0A';
            text = '#FFFFFF';
            textMuted = '#AAAAAA';
            borderWidth = '3px';
            isDarkMode = true;
        } else if (activeContrast === 'soft') {
            primary = '#FCD34D';
            primaryLight = '#FDE68A';
            bg = '#171717';
            surface = '#1F2937';
            text = '#F3F4F6';
            textMuted = '#9CA3AF';
            isDarkMode = true;
        } else if (activeContrast === 'dark') {
            primary = '#6D28D9';
            primaryLight = '#8B5CF6';
            bg = '#111827';
            surface = '#1F2937';
            text = '#F3F4F6';
            textMuted = '#9CA3AF';
            isDarkMode = true;
        }
    }

    // 5. Disability specific structure updates
    let borderRadius = '16px';
    let spacingSection = '16px';

    if (shouldApplyTheme) {
        if (needs.lowVision) {
            lineHeight = '1.8';
        }
        if (needs.dyslexia) {
            borderRadius = '20px';
            if (activeContrast === 'light' || activeContrast === 'default') {
                primary = '#B45309';
                primaryLight = '#D97706';
            }
        }
        if (needs.adhd) {
            spacingSection = '20px';
            if ((activeContrast === 'light' || activeContrast === 'default') && !needs.dyslexia) {
                primary = '#DC2626';
                primaryLight = '#EF4444';
            }
        }
        if (needs.autism) {
            borderRadius = '8px';
            spacingSection = '20px';
            if ((activeContrast === 'light' || activeContrast === 'default') && !needs.dyslexia && !needs.adhd) {
                primary = '#2563EB';
                primaryLight = '#3B82F6';
            }
        }
    }

    // Build the list of active need classes for style hooks
    const needClasses = shouldApplyTheme
        ? Object.entries(needs)
              .filter(([_, active]) => active)
              .map(([key]) => `a11y-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`)
              .join(' ')
        : '';

    // Construct style variable overrides for inheritance inside the shell container
    const styles = {
        '--a11y-scale': scaleValue,
        fontFamily: fontFamilyValue,
        fontWeight: fontWeightBase,
        letterSpacing,
        wordSpacing,
        lineHeight,
        '--a11y-font-body': fontFamilyValue,
        '--a11y-font-heading': fontFamilyValue,
        '--a11y-font-weight-base': fontWeightBase,
        '--a11y-font-weight-bold': fontWeightBold,
        '--a11y-line-height': lineHeight,
        '--a11y-letter-spacing': letterSpacing,
        '--a11y-word-spacing': wordSpacing,
        '--a11y-bg': bg,
        '--a11y-surface': surface,
        '--a11y-text': text,
        '--a11y-text-muted': textMuted,
        '--a11y-primary': primary,
        '--a11y-primary-light': primaryLight,
        '--a11y-border-width': borderWidth,
        '--a11y-border-radius': borderRadius,
        '--a11y-spacing-section': spacingSection,
        backgroundColor: bg,
        color: text,
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex justify-center transition-colors duration-300">
            <div 
                className={`w-full max-w-[420px] min-h-screen relative flex flex-col shadow-xl transition-all duration-200 ${isDarkMode ? 'dark' : ''} theme-${activeContrast === 'default' ? 'light' : activeContrast} ${needClasses}`}
                style={styles}
            >
                <AppRoutes />
            </div>
        </div>
    );
}

/**
 * App shell — mobile-only viewport.
 */
export default function App() {
    return (
        <BrowserRouter>
            <AccessibilityShell />
        </BrowserRouter>
    );
}