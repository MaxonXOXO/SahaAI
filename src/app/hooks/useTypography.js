/**
 * useTypography.js — Derives the active typography token set from user settings.
 *
 * Wraps buildTypography() with Zustand store subscriptions.
 * Also applies the root font size to document.documentElement as a side effect.
 *
 * Returns: { fontFamilyValue, letterSpacing, wordSpacing, lineHeight,
 *            fontWeightBase, fontWeightBold, scale }
 */
import { useEffect, useMemo } from 'react';
import useProfileStore   from '../../store/useProfileStore';
import useSettingsStore  from '../../store/useSettingsStore';
import { buildTypography } from '../config/typography';

const DEFAULT_ROOT_PX = '16px';

export function useTypography({ active }) {
    const needs           = useProfileStore((s) => s.needs) || {};
    const fontFamily      = useSettingsStore((s) => s.fontFamily);
    const fontWeight      = useSettingsStore((s) => s.fontWeight);
    const fontSize        = useSettingsStore((s) => s.fontSize);
    const displayLanguage = useSettingsStore((s) => s.displayLanguage);

    const typography = useMemo(
        () => buildTypography({ fontFamily, fontWeight, fontSize, displayLanguage, needs }),
        [fontFamily, fontWeight, fontSize, displayLanguage, needs]
    );

    // Side effect: drive the root font size so rem-based scaling works everywhere
    useEffect(() => {
        document.documentElement.style.fontSize = active
            ? typography.rootPx
            : DEFAULT_ROOT_PX;

        return () => {
            document.documentElement.style.fontSize = DEFAULT_ROOT_PX;
        };
    }, [active, typography.rootPx]);

    return typography;
}
