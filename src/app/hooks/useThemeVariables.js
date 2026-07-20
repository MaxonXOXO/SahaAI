/**
 * useThemeVariables.js — Derives the active theme token set from user settings.
 *
 * Wraps the pure buildTheme() config function with Zustand store subscriptions.
 * Returns: { colors, structure, isDarkMode, activeContrast, needClasses }
 */
import { useMemo } from 'react';
import useProfileStore    from '../../store/useProfileStore';
import useSettingsStore   from '../../store/useSettingsStore';
import { buildTheme }     from '../config/themes';

export function useThemeVariables() {
    const needs        = useProfileStore((s) => s.needs) || {};
    const primaryMode  = useProfileStore((s) => s.primaryMode);
    const contrastMode = useSettingsStore((s) => s.contrastMode);

    const theme = useMemo(
        () => buildTheme({ needs, primaryMode, contrastMode }),
        [needs, primaryMode, contrastMode]
    );

    // CSS class list encoding which disability modes are active
    const needClasses = useMemo(
        () =>
            Object.entries(needs)
                .filter(([, active]) => active)
                .map(([key]) => `a11y-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`)
                .join(' '),
        [needs]
    );

    return { ...theme, needClasses };
}
