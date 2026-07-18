import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useSpeak - Custom Hook for Speech Synthesis and Accessibility Audio Feedback
 * Exposes methods to speak, pause, resume, and cancel TTS.
 * Also plays subtle haptic/beep audio tones using Web Audio API for screen interactions.
 */
export default function useSpeak() {
    const [speaking, setSpeaking] = useState(false);
    const [paused, setPaused] = useState(false);
    const synthRef = useRef(window.speechSynthesis);
    const currentUtteranceRef = useRef(null);

    useEffect(() => {
        if (!synthRef.current) return;

        // Monitor speech synthesis state
        const checkSpeechState = () => {
            setSpeaking(synthRef.current.speaking);
            setPaused(synthRef.current.paused);
        };

        const timer = setInterval(checkSpeechState, 200);
        return () => clearInterval(timer);
    }, []);

    /**
     * Speaks the given text with customization and sentence-by-sentence subtitle callback
     * @param {string} text - Text to speak
     * @param {number} rate - Speech rate multiplier (0.5 to 2)
     * @param {function} onEnd - Callback function when speech finishes
     * @param {function} onSentenceChange - Callback function called per sentence with current sentence text
     */
    const speak = useCallback((text, rate = 1.0, onEnd = null, onSentenceChange = null) => {
        if (!synthRef.current) return;

        // Stop any current reading
        synthRef.current.cancel();

        // Mutually exclusive: Abort active speech recognition if it is listening
        if (window.sahaSpeechRecognition) {
            try {
                window.sahaSpeechRecognition.abort();
            } catch (e) {
                console.warn('Failed to abort speech recognition during speak:', e);
            }
        }

        if (!text || typeof text !== 'string') return;

        const cleanText = text.trim();
        if (cleanText === '') return;

        // Split text into sentences for live subtitle synchronization
        const sentences = cleanText
            .split(/(?<=[.!?])\s+/)
            .map((s) => s.trim())
            .filter((s) => s.length > 0);

        if (sentences.length === 0) return;

        let index = 0;

        const speakNextSentence = () => {
            if (index >= sentences.length) {
                setSpeaking(false);
                setPaused(false);
                currentUtteranceRef.current = null;
                if (onSentenceChange) onSentenceChange('');
                if (onEnd) onEnd();
                return;
            }

            const sentenceText = sentences[index];
            if (onSentenceChange) onSentenceChange(sentenceText);

            const utterance = new SpeechSynthesisUtterance(sentenceText);
            utterance.rate = rate;
            currentUtteranceRef.current = utterance;

            utterance.onend = () => {
                if (currentUtteranceRef.current !== utterance) return;
                index++;
                speakNextSentence();
            };

            utterance.onerror = (e) => {
                if (currentUtteranceRef.current !== utterance) return;
                if (e.error === 'interrupted' || e.error === 'canceled') {
                    setSpeaking(false);
                    setPaused(false);
                    if (onSentenceChange) onSentenceChange('');
                    return;
                }
                console.error('SpeechSynthesisUtterance error:', e);
                index++;
                speakNextSentence();
            };

            setSpeaking(true);
            setPaused(false);
            synthRef.current.speak(utterance);
        };

        speakNextSentence();
    }, []);

    /** Stops current speech output */
    const stop = useCallback(() => {
        if (!synthRef.current) return;
        synthRef.current.cancel();
        currentUtteranceRef.current = null;
        setSpeaking(false);
        setPaused(false);
    }, []);

    /** Pauses speech output */
    const pause = useCallback(() => {
        if (!synthRef.current) return;
        synthRef.current.pause();
        setPaused(true);
    }, []);

    /** Resumes speech output */
    const resume = useCallback(() => {
        if (!synthRef.current) return;
        synthRef.current.resume();
        setPaused(false);
    }, []);

    /**
     * Plays a high contrast beep sound to help low-vision users confirm buttons actions
     * @param {number} freq - Sound frequency in Hz (e.g. 440, 880)
     * @param {number} duration - Sound duration in seconds
     */
    const playBeep = useCallback((freq = 440, duration = 0.08) => {
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) return;

            const audioCtx = new AudioContextClass();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);

            gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
            // Smoothly ramp down volume to avoid clicks
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.start();
            oscillator.stop(audioCtx.currentTime + duration);
        } catch (error) {
            console.warn('Speech beep feedback audio play failed:', error);
        }
    }, []);

    return {
        speak,
        stop,
        pause,
        resume,
        speaking,
        paused,
        playBeep,
    };
}
