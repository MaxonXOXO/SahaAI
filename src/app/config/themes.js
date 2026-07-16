/**
 * themes.js — Configuration-driven theme registry.
 *
 * Instead of if/else chains, every contrast mode is a plain object.
 * Disability profiles apply incremental patches on top of the base.
 * Add new modes or disability overrides here — no logic changes needed elsewhere.
 */

// ── Base contrast presets ────────────────────────────────────────────────────

export const CONTRAST_PRESETS = {
    light: {
        primary:      '#6D28D9',
        primaryLight: '#8B5CF6',
        bg:           '#FFFFFF',
        surface:      '#FFFFFF',
        text:         '#1F2937',
        textMuted:    '#6B7280',
        borderWidth:  '2px',
        isDarkMode:   false,
    },
    dark: {
        primary:      '#6D28D9',
        primaryLight: '#8B5CF6',
        bg:           '#111827',
        surface:      '#1F2937',
        text:         '#F3F4F6',
        textMuted:    '#9CA3AF',
        borderWidth:  '2px',
        isDarkMode:   true,
    },
    soft: {
        primary:      '#FCD34D',
        primaryLight: '#FDE68A',
        bg:           '#171717',
        surface:      '#1F2937',
        text:         '#F3F4F6',
        textMuted:    '#9CA3AF',
        borderWidth:  '2px',
        isDarkMode:   true,
    },
    high: {
        primary:      '#FACC15',
        primaryLight: '#FDE68A',
        bg:           '#0A0A0A',
        surface:      '#0A0A0A',
        text:         '#FFFFFF',
        textMuted:    '#AAAAAA',
        borderWidth:  '3px',
        isDarkMode:   true,
    },
    // alias — "default" maps to light
    default: null, // resolved at runtime to 'light'
};

// ── Disability structure patches ─────────────────────────────────────────────
// Each entry is a function (currentColors, allNeeds) → partial override object.
// They are applied in priority order (lowVision first, then others).
// Return ONLY the keys you want to change — the rest are preserved.

export const DISABILITY_PATCHES = [
    {
        key: 'lowVision',
        // Low-vision forces high contrast when user hasn't already picked one
        resolveContrast: (contrastMode) =>
            contrastMode === 'default' || contrastMode === 'light' ? 'high' : contrastMode,
        structurePatch: () => ({
            lineHeight: '1.8',
        }),
    },
    {
        key: 'dyslexia',
        colorPatch: (isLightContrast) =>
            isLightContrast
                ? { primary: '#B45309', primaryLight: '#D97706' }
                : null,
        structurePatch: () => ({
            borderRadius: '20px',
        }),
    },
    {
        key: 'adhd',
        colorPatch: (isLightContrast, alreadyClaimed) =>
            isLightContrast && !alreadyClaimed
                ? { primary: '#DC2626', primaryLight: '#EF4444' }
                : null,
        structurePatch: () => ({
            spacingSection: '20px',
        }),
    },
    {
        key: 'autism',
        colorPatch: (isLightContrast, alreadyClaimed) =>
            isLightContrast && !alreadyClaimed
                ? { primary: '#2563EB', primaryLight: '#3B82F6' }
                : null,
        structurePatch: () => ({
            borderRadius: '8px',
            spacingSection: '20px',
        }),
    },
];

// ── Default structure values ─────────────────────────────────────────────────

export const DEFAULT_STRUCTURE = {
    borderRadius:   '16px',
    spacingSection: '16px',
    lineHeight:     '1.55',
};

// ── Resolved theme builder ───────────────────────────────────────────────────

/**
 * buildTheme({ needs, contrastMode }) → { colors, structure, isDarkMode, activeContrast }
 *
 * Pure function — no side effects, fully testable.
 */
export function buildTheme({ needs = {}, contrastMode = 'default' }) {
    // 1. Resolve contrast key (handle alias + lowVision auto-upgrade)
    let activeContrast = contrastMode === 'default' ? 'light' : contrastMode;

    // lowVision auto-upgrade before anything else
    const lowVisionPatch = DISABILITY_PATCHES.find((p) => p.key === 'lowVision');
    if (needs.lowVision && lowVisionPatch?.resolveContrast) {
        activeContrast = lowVisionPatch.resolveContrast(activeContrast);
    }

    // 2. Start from base color preset
    const basePreset = CONTRAST_PRESETS[activeContrast] ?? CONTRAST_PRESETS.light;
    let colors = { ...basePreset };

    // 3. Determine if we are in a "light-contrast" scenario (so disability color patches apply)
    const isLightContrast = activeContrast === 'light';

    // 4. Apply disability color patches in priority order
    // Track whether primary color has been claimed by a higher-priority disability
    let colorClaimed = false;

    for (const patch of DISABILITY_PATCHES) {
        if (patch.key === 'lowVision') continue; // already handled
        if (!needs[patch.key]) continue;
        if (patch.colorPatch) {
            const override = patch.colorPatch(isLightContrast, colorClaimed);
            if (override) {
                colors = { ...colors, ...override };
                colorClaimed = true;
            }
        }
    }

    // 5. Build structure (borderRadius, lineHeight, spacingSection)
    let structure = { ...DEFAULT_STRUCTURE };

    for (const patch of DISABILITY_PATCHES) {
        if (!needs[patch.key]) continue;
        if (patch.structurePatch) {
            structure = { ...structure, ...patch.structurePatch() };
        }
    }

    return {
        colors,
        structure,
        isDarkMode:     colors.isDarkMode ?? false,
        activeContrast,
    };
}
