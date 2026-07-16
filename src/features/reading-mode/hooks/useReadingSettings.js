import { useState } from 'react';
import useProfileStore from '../../../store/useProfileStore';

/**
 * useReadingSettings
 * Custom hook to manage local reading options for dyslexia accessibility profile.
 * Integrates with global useProfileStore for need defaults.
 */
export default function useReadingSettings() {
    // Read from useProfileStore for global user defaults
    const isProfileDyslexic = useProfileStore((s) => s.needs?.dyslexia ?? false);

    // Initial default layout depending on profile needs
    const defaultFont = isProfileDyslexic ? 'font-opendyslexic' : 'font-sans-default';
    const defaultSpacing = isProfileDyslexic ? 'spacing-relaxed' : 'spacing-normal';
    const defaultSize = isProfileDyslexic ? 'text-base-lg' : 'text-base-md';

    const [fontFamily, setFontFamily] = useState(defaultFont);
    const [fontSize, setFontSize] = useState(defaultSize); // text-base-sm | text-base-md | text-base-lg | text-base-xl
    const [spacing, setSpacing] = useState(defaultSpacing); // spacing-normal | spacing-relaxed | spacing-wide
    const [overlayOn, setOverlayOn] = useState(false);
    const [overlayColor, setOverlayColor] = useState('rgba(254, 240, 138, 0.12)'); // default low-opacity yellow swatch
    const [voiceEngine, setVoiceEngine] = useState('browser'); // browser | openai

    return {
        fontFamily,
        setFontFamily,
        fontSize,
        setFontSize,
        spacing,
        setSpacing,
        overlayOn,
        setOverlayOn,
        overlayColor,
        setOverlayColor,
        voiceEngine,
        setVoiceEngine,
    };
}
