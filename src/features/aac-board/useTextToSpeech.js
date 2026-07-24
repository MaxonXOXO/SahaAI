import { useEffect, useRef, useState } from 'react';
import { generateSpeech } from '../../shared/lib/aiClient';

/**
 * useTextToSpeech hook isolates text-to-speech operations.
 * Uses native window.speechSynthesis API, dynamically handles voices,
 * and falls back gracefully if specific language voices (like Malayalam ml-IN) are missing.
 */
export default function useTextToSpeech() {
    const [voices, setVoices] = useState([]);
    const audioRef = useRef(null);
    const activeRequestRef = useRef(0);

    useEffect(() => {
        if (typeof window === 'undefined' || !window.speechSynthesis) return;

        const loadVoices = () => {
            setVoices(window.speechSynthesis.getVoices() || []);
        };

        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;

        return () => {
            window.speechSynthesis.onvoiceschanged = null;
            activeRequestRef.current += 1;
            audioRef.current?.pause();
            if (audioRef.current?.src) URL.revokeObjectURL(audioRef.current.src);
        };
    }, []);

    const speakText = async (text, lang = 'en-US', onStart = null, onEnd = null) => {
        if (typeof window === 'undefined' || !window.speechSynthesis) {
            console.warn('Speech synthesis not supported in this browser.');
            return;
        }

        if (!text || text.trim() === '') return;

        const requestId = ++activeRequestRef.current;
        audioRef.current?.pause();
        if (audioRef.current?.src) URL.revokeObjectURL(audioRef.current.src);
        const utterance = new SpeechSynthesisUtterance(text);

        // Callbacks
        if (onStart) utterance.onstart = onStart;
        if (onEnd) {
            utterance.onend = onEnd;
            utterance.onerror = onEnd;
        }

        // Refresh here as mobile browsers commonly populate voices only after
        // the first user gesture. Never change Malayalam text to English: that
        // fallback can leave Malayalam completely silent on some devices.
        const availableVoices = window.speechSynthesis.getVoices() || voices;
        const targetLang = lang.startsWith('ml') ? 'ml-IN' : lang;

        // Find matching voice
        const matchedVoice = availableVoices.find(v => v.lang.toLowerCase() === targetLang.toLowerCase()) ||
                            availableVoices.find(v => v.lang.toLowerCase().startsWith(targetLang.split('-')[0]));

        if (matchedVoice) {
            utterance.voice = matchedVoice;
        }
        utterance.lang = targetLang;
        
        // Adjust rates/pitch slightly for clearer/more deliberate speech for accessibility
        utterance.rate = 0.95; 
        utterance.pitch = 1.0;

        // Android and desktop Chromium frequently ship without an Malayalam
        // system voice. Use the secured multilingual Gemini TTS fallback in
        // that case; the browser engine remains the fast path when available.
        if (targetLang.startsWith('ml') && !matchedVoice) {
            try {
                const audioBlob = await generateSpeech(text, { provider: 'gemini', voice: 'Puck' });
                if (requestId !== activeRequestRef.current) return;
                const audio = new Audio(URL.createObjectURL(audioBlob));
                audioRef.current = audio;
                audio.onplay = () => onStart?.();
                audio.onended = audio.onerror = () => {
                    if (audioRef.current === audio) audioRef.current = null;
                    URL.revokeObjectURL(audio.src);
                    onEnd?.();
                };
                await audio.play();
                return;
            } catch (error) {
                console.warn('Malayalam cloud TTS unavailable; trying the device voice.', error);
            }
        }

        // Cancelling and speaking in the same task is unreliable in Chrome on
        // Android. A short retry keeps AAC taps responsive and audible.
        window.speechSynthesis.cancel();
        window.setTimeout(() => window.speechSynthesis.speak(utterance), 40);
    };

    const stopSpeaking = () => {
        activeRequestRef.current += 1;
        if (audioRef.current) {
            audioRef.current.pause();
            if (audioRef.current.src) URL.revokeObjectURL(audioRef.current.src);
            audioRef.current = null;
        }
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
