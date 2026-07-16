/**
 * useAccessibilityTheme.js
 *
 * Reactive global UI adaptation engine for SahaAI.
 *
 * Rules:
 * 1. If NO disabilities are active → app looks EXACTLY like default (no changes)
 * 2. Each disability ONLY overrides what it specifically needs — nothing more
 * 3. Multiple active disabilities compose cleanly (no conflicts)
 * 4. Changes apply instantly on need toggle (Zustand subscription)
 *
 * What each disability changes:
 *   dyslexia    → font (OpenDyslexic), spacing, warm bg, no italics
 *   adhd        → bold section markers, larger tap targets, bold active states
 *   autism      → zero animations, structured/angular borders, calm palette, icon+label always
 *   lowVision   → large font, ultra-high contrast (yellow on black), thick borders
 *   dyscalculia → minimal: colour-coded number/progress elements only (no layout change)
 *
 * Cross-device persistence:
 *   On login, fetchProfile() loads needs from Supabase into Zustand.
 *   This hook runs reactively whenever needs change — so fresh logins
 *   automatically restore theming from the server without any extra wiring.
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import useProfileStore from '../../store/useProfileStore';

// Default CSS var values — what the app looks like with NO accessibility mode
const DEFAULTS = {
    '--a11y-font-body':        "'Inter', system-ui, sans-serif",
    '--a11y-font-heading':     "'Inter', system-ui, sans-serif",
    '--a11y-font-size-base':   '16px',
    '--a11y-font-size-md':     '18px',
    '--a11y-font-size-lg':     '22px',
    '--a11y-line-height':      '1.55',
    '--a11y-letter-spacing':   'normal',
    '--a11y-word-spacing':     'normal',
    '--a11y-bg':               '',           // empty = let Tailwind/system handle it
    '--a11y-surface':          '',
    '--a11y-text':             '',
    '--a11y-text-muted':       '',
    '--a11y-primary':          '#6D28D9',
    '--a11y-primary-light':    '#8B5CF6',
    '--a11y-border-width':     '2px',
    '--a11y-border-radius':    '16px',
    '--a11y-min-touch':        '48px',
    '--a11y-icon-size':        '20px',
    '--a11y-spacing-section':  '16px',
    '--a11y-transition':       'all 0.2s ease',
    '--a11y-shadow':           '0 1px 3px rgba(0,0,0,0.08)',
};

// Routes where the accessibility theme must NOT be applied (onboarding / auth)
const ONBOARDING_ROUTES = ['/', '/language', '/profile-setup', '/signup', '/login'];

export default function useAccessibilityTheme() {
    const needs = useProfileStore((s) => s.needs);
    const isAuthenticated = useProfileStore((s) => s.isAuthenticated);
    const primaryMode = useProfileStore((s) => s.primaryMode);
    const { pathname } = useLocation();

    useEffect(() => {
        const root = document.documentElement;
        const body = document.body;

        // ── Step 1: Reset body classes and CSS vars to default ───────────────
        body.classList.remove(
            'a11y-dyslexia',
            'a11y-adhd',
            'a11y-autism',
            'a11y-low-vision',
            'a11y-dyscalculia'
        );
        Object.entries(DEFAULTS).forEach(([k, v]) => {
            if (v === '') root.style.removeProperty(k);
            else root.style.setProperty(k, v);
        });

        // ── Step 2: Determine if theme should be active ──────────────────
        // Must only begin once user has created their account (isAuthenticated),
        // selected their mode (primaryMode is set), and is not on onboarding/auth screens.
        const shouldApplyTheme = 
            isAuthenticated && 
            primaryMode !== null && 
            !ONBOARDING_ROUTES.includes(pathname);

        if (!shouldApplyTheme) return;

        // ── Step 3: Check if ANY accessibility mode is active ────────────────
        const anyActive = Object.values(needs).some(Boolean);
        if (!anyActive) return; // ← No disabilities: app stays exactly as default

        // ── Step 4: Apply changes per active disability ───────────────────────

        // LOW VISION — largest footprint: overrides colour, size, contrast
        if (needs.lowVision) {
            body.classList.add('a11y-low-vision');
            root.style.setProperty('--a11y-font-size-base', '20px');
            root.style.setProperty('--a11y-font-size-md', '24px');
            root.style.setProperty('--a11y-font-size-lg', '30px');
            root.style.setProperty('--a11y-line-height', '1.8');
            root.style.setProperty('--a11y-min-touch', '64px');
            root.style.setProperty('--a11y-icon-size', '28px');
            root.style.setProperty('--a11y-border-width', '3px');
            root.style.setProperty('--a11y-transition', 'none');
            root.style.setProperty('--a11y-shadow', 'none');
            root.style.setProperty('--a11y-primary', '#FACC15');       // high-contrast yellow
            root.style.setProperty('--a11y-primary-light', '#FDE68A');
            root.style.setProperty('--a11y-bg', '#0A0A0A');
            root.style.setProperty('--a11y-surface', '#0A0A0A');
            root.style.setProperty('--a11y-text', '#FFFFFF');
            root.style.setProperty('--a11y-text-muted', '#AAAAAA');
        }

        // DYSLEXIA — font + spacing + warm background
        if (needs.dyslexia) {
            body.classList.add('a11y-dyslexia');
            root.style.setProperty('--a11y-font-body', "'OpenDyslexic', 'Comic Sans MS', cursive");
            root.style.setProperty('--a11y-font-heading', "'OpenDyslexic', 'Comic Sans MS', cursive");
            root.style.setProperty('--a11y-letter-spacing', '0.08em');
            root.style.setProperty('--a11y-word-spacing', '0.18em');
            root.style.setProperty('--a11y-line-height', '1.9');
            root.style.setProperty('--a11y-border-radius', '20px');
            // Only set warm colours if low-vision hasn't already claimed colour
            if (!needs.lowVision) {
                root.style.setProperty('--a11y-primary', '#B45309');
                root.style.setProperty('--a11y-primary-light', '#D97706');
            }
        }

        // ADHD — bold structure, larger targets, no colour override
        if (needs.adhd) {
            body.classList.add('a11y-adhd');
            root.style.setProperty('--a11y-min-touch', needs.lowVision ? '64px' : '56px');
            root.style.setProperty('--a11y-icon-size', needs.lowVision ? '28px' : '24px');
            root.style.setProperty('--a11y-spacing-section', '20px');
            if (!needs.lowVision && !needs.dyslexia) {
                root.style.setProperty('--a11y-primary', '#DC2626');
                root.style.setProperty('--a11y-primary-light', '#EF4444');
            }
        }

        // AUTISM — zero animation, angular structure, calm palette
        if (needs.autism) {
            body.classList.add('a11y-autism');
            root.style.setProperty('--a11y-transition', 'none');      // critical: no motion
            root.style.setProperty('--a11y-border-radius', '8px');    // structured/angular
            root.style.setProperty('--a11y-spacing-section', '20px');
            if (!needs.lowVision && !needs.dyslexia && !needs.adhd) {
                root.style.setProperty('--a11y-primary', '#2563EB');  // calm blue
                root.style.setProperty('--a11y-primary-light', '#3B82F6');
            }
        }

        // DYSCALCULIA — minimal UI change, only colour-codes number elements
        // No layout, font, or colour changes — just adds the body class
        // which CSS uses to style [data-type="number"] elements
        if (needs.dyscalculia) {
            body.classList.add('a11y-dyscalculia');
            // No CSS var overrides — dyscalculia is handled at component level
            // by adding data-type="number" to numeric displays
        }

    }, [needs, pathname, isAuthenticated, primaryMode]);
}
