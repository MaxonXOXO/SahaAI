import { useState, useEffect, useRef } from 'react';

/**
 * useSpeak - Custom Hook for Speech Synthesis and Accessibility Audio Feedback
 * Exposes methods to speak, pause, resume, and cancel TTS.
 * Also plays subtle haptic/beep audio tones using Web Audio API for screen interactions.
 */
export default function useSpeak() {
    const [speaking, setSpeaking] = useState(false);
    const [paused, setPaused] = useState(false);
    const synthRef = useRef(window.speechSynthesis);

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
     * Speaks the given text with customization
     * @param {string} text - Text to speak
     * @param {number} rate - Speech rate multiplier (0.5 to 2)
     * @param {function} onEnd - Callback function when speech finishes
     */
    const speak = (text, rate = 1.0, onEnd = null) => {
        if (!synthRef.current) return;

        // Stop any current reading
        synthRef.current.cancel();

        if (!text || typeof text !== 'string') return;

        const cleanText = text.trim();
        if (cleanText === '') return;

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = rate;

        utterance.onend = () => {
            setSpeaking(false);
            setPaused(false);
            if (onEnd) onEnd();
        };

        utterance.onerror = (e) => {
            console.error('SpeechSynthesisUtterance error:', e);
            setSpeaking(false);
            setPaused(false);
        };

        synthRef.current.speak(utterance);
        setSpeaking(true);
        setPaused(false);
    };

    /** Stops current speech output */
    const stop = () => {
        if (!synthRef.current) return;
        synthRef.current.cancel();
        setSpeaking(false);
        setPaused(false);
    };

    /** Pauses speech output */
    const pause = () => {
        if (!synthRef.current) return;
        synthRef.current.pause();
        setPaused(true);
    };

    /** Resumes speech output */
    const resume = () => {
        if (!synthRef.current) return;
        synthRef.current.resume();
        setPaused(false);
    };

    /**
     * Plays a high contrast beep sound to help low-vision users confirm buttons actions
     * @param {number} freq - Sound frequency in Hz (e.g. 440, 880)
     * @param {number} duration - Sound duration in seconds
     */
    const playBeep = (freq = 440, duration = 0.08) => {
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
    };

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
