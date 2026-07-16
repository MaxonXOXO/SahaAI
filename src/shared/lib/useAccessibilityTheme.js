/**
 * @deprecated
 * This module has been superseded by src/app/hooks/useAccessibilityTheme.js.
 * It is kept as a re-export shim for any legacy imports.
 *
 * DO NOT add logic here. Import from the canonical location instead:
 *   import { useAccessibilityTheme } from '../../app/hooks/useAccessibilityTheme';
 */
export { useAccessibilityTheme } from '../../app/hooks/useAccessibilityTheme';

// Default export stub for any files that do: import useAccessibilityTheme from '...'
export default function useAccessibilityTheme() {
    return null;
}
