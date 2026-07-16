import { useEffect, useState } from 'react';

/**
 * useTextToSpeech hook isolates text-to-speech operations.
 * Uses native window.speechSynthesis API, dynamically handles voices,
 * and falls back gracefully if specific language voices (like Malayalam ml-IN) are missing.
 */
export default function useTextToSpeech() {
    const [voices, setVoices] = useState([]);

    useEffect(() => {
        if (typeof window === 'undefined' || !window.speechSynthesis) return;

        const loadVoices = () => {
            setVoices(window.speechSynthesis.getVoices() || []);
        };

        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;

        return () => {
            window.speechSynthesis.onvoiceschanged = null;
        };
    }, []);

    const speakText = (text, lang = 'en-US', onStart = null, onEnd = null) => {
        if (typeof window === 'undefined' || !window.speechSynthesis) {
            console.warn('Speech synthesis not supported in this browser.');
            return;
        }

        // Cancel any ongoing speaking immediately
        window.speechSynthesis.cancel();

        if (!text || text.trim() === '') return;

        const utterance = new SpeechSynthesisUtterance(text);

        // Callbacks
        if (onStart) utterance.onstart = onStart;
        if (onEnd) {
            utterance.onend = onEnd;
            utterance.onerror = onEnd;
        }

        // Check language requirement
        let targetLang = lang;
        if (lang.startsWith('ml')) {
            const hasMalayalamVoice = voices.some(v => 
                v.lang.toLowerCase().startsWith('ml') || 
                v.lang.toLowerCase().includes('ml-in')
            );
            if (hasMalayalamVoice) {
                targetLang = 'ml-IN';
            } else {
                // Fall back to English voice, but we still speak the text
                targetLang = 'en-US';
            }
        }

        // Find matching voice
        const matchedVoice = voices.find(v => v.lang.toLowerCase() === targetLang.toLowerCase()) ||
                            voices.find(v => v.lang.toLowerCase().startsWith(targetLang.split('-')[0]));

        if (matchedVoice) {
            utterance.voice = matchedVoice;
        }
        utterance.lang = targetLang;
        
        // Adjust rates/pitch slightly for clearer/more deliberate speech for accessibility
        utterance.rate = 0.95; 
        utterance.pitch = 1.0;

        window.speechSynthesis.speak(utterance);
    };

    const stopSpeaking = () => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
    };

    return {
        speakText,
        stopSpeaking,
        voices
    };
}
