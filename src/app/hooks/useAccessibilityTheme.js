/**
 * useAccessibilityTheme.js — Composes theme + typography into a single CSS variable map.
 *
 * This is the only hook AccessibilityProvider needs to call.
 * It merges results from useThemeVariables and useTypography into a
 * ready-to-spread style object plus className helpers.
 *
 * Returns:
 *   styles        — object to spread onto the app container's style prop
 *   containerClass — className string for the app container div
 */
import { useMemo } from 'react';
import { useThemeVariables } from './useThemeVariables';
import { useTypography }     from './useTypography';

export function useAccessibilityTheme({ active }) {
    const {
        colors,
        structure,
        isDarkMode,
        activeContrast,
        needClasses,
    } = useThemeVariables();

    const {
        fontFamilyValue,
        letterSpacing,
        wordSpacing,
        lineHeight,
        fontWeightBase,
        fontWeightBold,
        scale,
    } = useTypography({ active });

    const styles = useMemo(() => {
        if (!active) {
            return {
                '--a11y-primary': '#6D28D9',
                '--a11y-primary-light': '#8B5CF6',
            };
        }

        return {
            // Scale
            '--a11y-scale': scale,

            // Typography
            fontFamily:              fontFamilyValue,
            fontWeight:              fontWeightBase,
            letterSpacing,
            wordSpacing,
            lineHeight,
            '--a11y-font-body':      fontFamilyValue,
            '--a11y-font-heading':   fontFamilyValue,
            '--a11y-font-weight-base': fontWeightBase,
            '--a11y-font-weight-bold': fontWeightBold,
            '--a11y-line-height':    lineHeight,
            '--a11y-letter-spacing': letterSpacing,
            '--a11y-word-spacing':   wordSpacing,

            // Color tokens
            '--a11y-bg':             colors.bg,
            '--a11y-surface':        colors.surface,
            '--a11y-text':           colors.text,
            '--a11y-text-muted':     colors.textMuted,
            '--a11y-primary':        colors.primary,
            '--a11y-primary-light':  colors.primaryLight,
            '--a11y-border-width':   colors.borderWidth,

            // Structure tokens
            '--a11y-border-radius':  structure.borderRadius,
            '--a11y-spacing-section': structure.spacingSection,

            // Direct color application
            backgroundColor: colors.bg,
            color:           colors.text,
        };
    }, [active, scale, fontFamilyValue, letterSpacing, wordSpacing, lineHeight,
        fontWeightBase, fontWeightBold, colors, structure]);

    const containerClass = useMemo(() => {
        const themeClass = `theme-${activeContrast === 'default' ? 'light' : activeContrast}`;
        const darkClass  = isDarkMode ? 'dark' : '';
        return [darkClass, themeClass, needClasses].filter(Boolean).join(' ');
    }, [activeContrast, isDarkMode, needClasses]);

    return { styles, containerClass, isDarkMode };
}
