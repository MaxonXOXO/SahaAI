/**
 * routeMeta.js — Centralized route metadata registry.
 *
 * Each route entry declares:
 *   path        — URL path string
 *   onboarding  — true  → theme/nav disabled on this route
 *   hideNav     — true  → BottomNav is not shown (implies onboarding routes too)
 *   exactMatch  — false → use startsWith matching instead of exact
 *
 * AccessibilityProvider and AppRoutes derive their behavior from this registry
 * instead of hardcoded string arrays.
 */

export const ROUTE_META = [
    // ── Onboarding / Auth ──────────────────────────────────────────────────
    { path: '/', onboarding: true, hideNav: true },
    { path: '/language', onboarding: true, hideNav: true },
    { path: '/age-range', onboarding: true, hideNav: true },
    { path: '/region', onboarding: true, hideNav: true },
    { path: '/signup', onboarding: true, hideNav: true },
    { path: '/login', onboarding: true, hideNav: true },
    { path: '/profile-setup', onboarding: true, hideNav: true },

    // ── Full-screen feature flows (nav hidden but theme active) ────────────
    { path: '/ai-chat/', onboarding: false, hideNav: true, exactMatch: false },
    { path: '/edit-profile', onboarding: false, hideNav: true },

    // ── Main tab routes ────────────────────────────────────────────────────
    { path: '/home', onboarding: false, hideNav: false },
    { path: '/dashboard', onboarding: false, hideNav: false },
    { path: '/ai-chat', onboarding: false, hideNav: false },
    { path: '/learn', onboarding: false, hideNav: false },
    { path: '/tools', onboarding: false, hideNav: false },
    { path: '/progress', onboarding: false, hideNav: false },
    { path: '/profile', onboarding: false, hideNav: false },

    // ── Feature screens ────────────────────────────────────────────────────
    { path: '/reading-mode', onboarding: false, hideNav: false },
    { path: '/text-simplifier', onboarding: false, hideNav: false },
    { path: '/math-helper', onboarding: false, hideNav: false },
    { path: '/focus-mode', onboarding: false, hideNav: false },
    { path: '/routine-builder', onboarding: false, hideNav: false },
    { path: '/social-story', onboarding: false, hideNav: false },
    { path: '/conversation-practice', onboarding: false, hideNav: false },
    { path: '/vision-assistant', onboarding: false, hideNav: false },
    { path: '/document-reader', onboarding: false, hideNav: false },
    { path: '/settings', onboarding: false, hideNav: false },
    { path: '/aac-board', onboarding: false, hideNav: false },
    { path: '/speech-therapy', onboarding: false, hideNav: false },
];

/**
 * getRouteMeta(pathname) → { onboarding, hideNav }
 * Returns default { onboarding: false, hideNav: false } for unknown paths.
 */
export function getRouteMeta(pathname) {
    // Try exact match first, then prefix match for non-exact routes
    const match =
        ROUTE_META.find((r) =>
            r.exactMatch === false
                ? pathname.startsWith(r.path)
                : pathname === r.path
        );

    return match ?? { onboarding: false, hideNav: false };
}
