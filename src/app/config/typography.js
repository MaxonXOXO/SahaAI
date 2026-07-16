/**
 * typography.js — Configuration-driven typography registry.
 *
 * Maps (language × dyslexicFont) → font-family string.
 * Maps fontWeight key → base/bold numeric values.
 * Maps fontSize key → root px value and CSS scale factor.
 */

// ── Font family resolution ───────────────────────────────────────────────────

export const FONT_FAMILIES = {
    /** language=en, dyslexia OFF */
    en_standard:  "'Inter', system-ui, sans-serif",
    /** language=en, dyslexia ON */
    en_dyslexia:  "'OpenDyslexic', 'Comic Sans MS', cursive",
    /** language=ml, dyslexia OFF */
    ml_standard:  "'Noto Sans Malayalam', 'Inter', system-ui, sans-serif",
    /** language=ml, dyslexia ON → use Baloo Chettan 2 */
    ml_dyslexia:  "'Baloo Chettan 2', system-ui, sans-serif",
};

/** Dyslexic-font extra spacing overrides */
export const DYSLEXIA_SPACING = {
    letterSpacing: '0.08em',
    wordSpacing:   '0.18em',
    lineHeight:    '1.9',
};

// ── Font weight mappings ─────────────────────────────────────────────────────

export const FONT_WEIGHT_MAP = {
    normal: { base: '400', bold: '700' },
    medium: { base: '500', bold: '800' },
    bold:   { base: '700', bold: '900' },
};

// ── Font size → root px + CSS scale ─────────────────────────────────────────

export const FONT_SIZE_MAP = {
    small:  { rootPx: '14px', scale: '0.85' },
    medium: { rootPx: '16px', scale: '1.0'  },
    large:  { rootPx: '20px', scale: '1.25' },
};

// ── Builder function ─────────────────────────────────────────────────────────

/**
 * buildTypography({ fontFamily, fontWeight, fontSize, displayLanguage, needs })
 * → { fontFamilyValue, letterSpacing, wordSpacing, lineHeight,
 *     fontWeightBase, fontWeightBold, rootPx, scale }
 *
 * Pure function — no DOM side effects.
 */
export function buildTypography({
    fontFamily      = 'default',
    fontWeight      = 'normal',
    fontSize        = 'medium',
    displayLanguage = 'en',
    needs           = {},
}) {
    const isDyslexicFont =
        fontFamily === 'dyslexia' || (needs.dyslexia && fontFamily === 'default');

    const lang = displayLanguage === 'ml' ? 'ml' : 'en';
    const variant = isDyslexicFont ? 'dyslexia' : 'standard';

    const fontFamilyValue = FONT_FAMILIES[`${lang}_${variant}`] ?? FONT_FAMILIES.en_standard;

    let letterSpacing = 'normal';
    let wordSpacing   = 'normal';
    let lineHeight    = '1.55';

    // Only English dyslexia gets extra spacing (Malayalam fonts handle it natively)
    if (isDyslexicFont && lang === 'en') {
        ({ letterSpacing, wordSpacing, lineHeight } = DYSLEXIA_SPACING);
    }

    const { base: fontWeightBase, bold: fontWeightBold } =
        FONT_WEIGHT_MAP[fontWeight] ?? FONT_WEIGHT_MAP.normal;

    const { rootPx, scale } = FONT_SIZE_MAP[fontSize] ?? FONT_SIZE_MAP.medium;

    return {
        fontFamilyValue,
        letterSpacing,
        wordSpacing,
        lineHeight,
        fontWeightBase,
        fontWeightBold,
        rootPx,
        scale,
    };
}
