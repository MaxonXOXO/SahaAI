import { useRef, useCallback } from 'react';

/**
 * useTone — Lightweight WebAudio helper for ADHD Focus Mode sound cues and celebrations.
 */
export default function useTone(soundEnabled = true) {
    const audioContextRef = useRef(null);

    const getContext = useCallback(() => {
        try {
            const ctx = audioContextRef.current || new (window.AudioContext || window.webkitAudioContext)();
            audioContextRef.current = ctx;
            if (ctx.state === 'suspended') {
                ctx.resume();
            }
            return ctx;
        } catch (e) {
            console.warn('AudioContext initialization error:', e);
            return null;
        }
    }, []);

    const playTone = useCallback((freq = 440, duration = 0.15, type = 'sine', volume = 0.15) => {
        if (!soundEnabled) return;
        const ctx = getContext();
        if (!ctx) return;

        try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(volume, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch (e) {
            console.warn('Audio tone error:', e);
        }
    }, [soundEnabled, getContext]);

    const playSequence = useCallback((notes = [], defaultType = 'sine') => {
        if (!soundEnabled || !notes.length) return;
        const ctx = getContext();
        if (!ctx) return;

        notes.forEach(({ freq, duration = 0.15, delay = 0, type = defaultType, volume = 0.15 }) => {
            setTimeout(() => {
                try {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = type;
                    osc.frequency.setValueAtTime(freq, ctx.currentTime);
                    gain.gain.setValueAtTime(volume, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start();
                    osc.stop(ctx.currentTime + duration);
                } catch (e) {
                    console.warn('Audio sequence error:', e);
                }
            }, delay * 1000);
        });
    }, [soundEnabled, getContext]);

    return { playTone, playSequence };
}
