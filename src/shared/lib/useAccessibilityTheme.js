/**
 * useAccessibilityTheme.js
 *
 * The SINGLE source of truth for all adaptive UI changes in SahaAI.
 *
 * How it works:
 *   - Reads active disability needs from useProfileStore
 *   - Computes a set of CSS custom property overrides and body class tokens
 *   - Applied once in App.jsx via the <AccessibilityProvider> wrapper
 *   - All shared components (Button, Card, ScreenHeader, BottomNav etc.)
 *     automatically respond — no per-screen changes required
 *
 * For teammates building features:
 *   - Use the Tailwind tokens already in tailwind.config.js (text-base-sm,
 *     text-base-md, bg-surface, text-primary, etc.)
 *   - The hook will override these tokens' underlying CSS vars at runtime
 *   - Never hardcode font sizes or colours in feature screens; always use tokens
 *
 * Disability mappings:
 *   dyslexia   → OpenDyslexic font, warm cream bg, wide spacing, no italics
 *   adhd       → High contrast, bold section markers, large tap targets
 *   autism     → Muted palette, strong borders, zero surprise animations
 *   lowVision  → Max font, ultra-high contrast, thick borders, huge targets
 *   dyscalculia → Distinct color-coded surfaces, progress as bars
 */

import { useEffect } from 'react';
import useProfileStore from '../../store/useProfileStore';

// Priority order when multiple needs are active (highest wins for conflicting rules)
const PRIORITY = ['lowVision', 'dyslexia', 'adhd', 'autism', 'dyscalculia'];

export default function useAccessibilityTheme() {
    const needs = useProfileStore((s) => s.needs);

    useEffect(() => {
        const root = document.documentElement;
        const body = document.body;

        // ── Clear all previous a11y classes ──────────────────────────────────
        body.classList.remove(
            'a11y-dyslexia',
            'a11y-adhd',
            'a11y-autism',
            'a11y-low-vision',
            'a11y-dyscalculia'
        );

        // ── Reset all CSS vars to defaults ───────────────────────────────────
        const defaults = {
            '--a11y-font-body': "'Inter', system-ui, sans-serif",
            '--a11y-font-heading': "'Inter', system-ui, sans-serif",
            '--a11y-font-size-base': '16px',
            '--a11y-font-size-md': '18px',
            '--a11y-font-size-lg': '22px',
            '--a11y-line-height': '1.55',
            '--a11y-letter-spacing': '0.01em',
            '--a11y-word-spacing': 'normal',
            '--a11y-bg': '#FFFFFF',
            '--a11y-bg-dark': '#1F2937',
            '--a11y-surface': '#FFFFFF',
            '--a11y-surface-dark': '#1F2937',
            '--a11y-text': '#1F2937',
            '--a11y-text-muted': '#6B7280',
            '--a11y-primary': '#6D28D9',
            '--a11y-primary-light': '#8B5CF6',
            '--a11y-border-width': '2px',
            '--a11y-border-radius': '16px',
            '--a11y-min-touch': '48px',
            '--a11y-icon-size': '20px',
            '--a11y-spacing-section': '16px',
            '--a11y-transition': 'all 0.2s ease',
            '--a11y-shadow': '0 1px 3px rgba(0,0,0,0.08)',
        };
        Object.entries(defaults).forEach(([k, v]) => root.style.setProperty(k, v));

        // ── Apply per-disability overrides (in priority order) ───────────────

        // LOW VISION — highest priority: maximum size, ultra-high contrast
        if (needs.lowVision) {
            body.classList.add('a11y-low-vision');
            root.style.setProperty('--a11y-font-size-base', '20px');
            root.style.setProperty('--a11y-font-size-md', '24px');
            root.style.setProperty('--a11y-font-size-lg', '30px');
            root.style.setProperty('--a11y-line-height', '1.8');
            root.style.setProperty('--a11y-letter-spacing', '0.03em');
            root.style.setProperty('--a11y-min-touch', '64px');
            root.style.setProperty('--a11y-icon-size', '28px');
            root.style.setProperty('--a11y-border-width', '3px');
            root.style.setProperty('--a11y-border-radius', '12px');
            // Force dark-mode-like ultra contrast regardless of system pref
            root.style.setProperty('--a11y-bg', '#000000');
            root.style.setProperty('--a11y-surface', '#111111');
            root.style.setProperty('--a11y-text', '#FFFFFF');
            root.style.setProperty('--a11y-text-muted', '#D1D5DB');
            root.style.setProperty('--a11y-primary', '#FACC15'); // bright yellow for max contrast
            root.style.setProperty('--a11y-primary-light', '#FDE68A');
            root.style.setProperty('--a11y-shadow', 'none');
            root.style.setProperty('--a11y-transition', 'none');
        }

        // DYSLEXIA — warm bg, OpenDyslexic font, wide spacing
        if (needs.dyslexia) {
            body.classList.add('a11y-dyslexia');
            root.style.setProperty('--a11y-font-body', "'OpenDyslexic', 'Comic Sans MS', cursive");
            root.style.setProperty('--a11y-font-heading', "'OpenDyslexic', 'Comic Sans MS', cursive");
            root.style.setProperty('--a11y-letter-spacing', '0.08em');
            root.style.setProperty('--a11y-word-spacing', '0.18em');
            root.style.setProperty('--a11y-line-height', '1.9');
            root.style.setProperty('--a11y-font-size-base', '17px');
            root.style.setProperty('--a11y-font-size-md', '19px');
            // Cream warm background reduces visual stress
            if (!needs.lowVision) {
                root.style.setProperty('--a11y-bg', '#FFFBF0');
                root.style.setProperty('--a11y-surface', '#FFF8E7');
                root.style.setProperty('--a11y-text', '#2D1B00');
                root.style.setProperty('--a11y-primary', '#B45309'); // warm amber
                root.style.setProperty('--a11y-primary-light', '#D97706');
            }
            root.style.setProperty('--a11y-border-radius', '20px'); // softer corners
        }

        // ADHD — vibrant, high contrast, larger targets, bold markers
        if (needs.adhd) {
            body.classList.add('a11y-adhd');
            root.style.setProperty('--a11y-font-size-base', '17px');
            root.style.setProperty('--a11y-line-height', '1.65');
            root.style.setProperty('--a11y-min-touch', '56px');
            root.style.setProperty('--a11y-icon-size', '24px');
            root.style.setProperty('--a11y-spacing-section', '20px');
            if (!needs.lowVision && !needs.dyslexia) {
                root.style.setProperty('--a11y-primary', '#DC2626'); // bold red-orange
                root.style.setProperty('--a11y-primary-light', '#EF4444');
            }
            root.style.setProperty('--a11y-border-width', '2.5px');
        }

        // AUTISM — muted calm palette, strong structure, zero surprise animations
        if (needs.autism) {
            body.classList.add('a11y-autism');
            root.style.setProperty('--a11y-transition', 'none'); // no animations = no sensory overload
            root.style.setProperty('--a11y-border-radius', '8px'); // angular = structured, predictable
            root.style.setProperty('--a11y-border-width', '2px');
            root.style.setProperty('--a11y-spacing-section', '20px');
            if (!needs.lowVision && !needs.dyslexia && !needs.adhd) {
                root.style.setProperty('--a11y-primary', '#2563EB'); // calm blue
                root.style.setProperty('--a11y-primary-light', '#3B82F6');
                root.style.setProperty('--a11y-bg', '#F8FAFC');
                root.style.setProperty('--a11y-surface', '#F1F5F9');
            }
        }

        // DYSCALCULIA — color-coded sections, warm accents
        if (needs.dyscalculia) {
            body.classList.add('a11y-dyscalculia');
            if (!needs.lowVision && !needs.dyslexia && !needs.adhd && !needs.autism) {
                root.style.setProperty('--a11y-primary', '#059669'); // green = go / correct
                root.style.setProperty('--a11y-primary-light', '#10B981');
            }
        }
    }, [needs]);
}
