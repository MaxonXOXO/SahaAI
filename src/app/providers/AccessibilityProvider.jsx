/**
 * AccessibilityProvider.jsx — Exposes accessibility context only.
 *
 * Sits inside BrowserRouter so it can read path info from useLocation.
 * Computes active states and exposes them via React Context.
 */
import { createContext, useContext, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import useProfileStore from '../../store/useProfileStore';
import { getRouteMeta } from '../config/routeMeta';

const AccessibilityContext = createContext(null);

export default function AccessibilityProvider({ children }) {
    const { pathname } = useLocation();
    const isAuthenticated = useProfileStore((s) => s.isAuthenticated);
    const needs = useProfileStore((s) => s.needs) || {};

    const { onboarding } = getRouteMeta(pathname);
    const active = isAuthenticated && !onboarding;

    const value = useMemo(() => ({
        needs,
        active,
        onboarding,
        isAuthenticated,
    }), [needs, active, onboarding, isAuthenticated]);

    return (
        <AccessibilityContext.Provider value={value}>
            {children}
        </AccessibilityContext.Provider>
    );
}

export function useAccessibility() {
    const context = useContext(AccessibilityContext);
    if (!context) {
        throw new Error('useAccessibility must be used within an AccessibilityProvider');
    }
    return context;
}
