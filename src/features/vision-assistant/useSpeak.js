import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Splits full text into sentence chunks and sub-splits long sentences (>90 chars) at commas.
 * Records the start character index of each chunk within fullText for onboundary tracking.
 */
function createCaptionChunks(fullText) {
    if (!fullText || typeof fullText !== 'string') return [];

    const text = fullText.trim();
    if (!text) return [];

    // 1. Split into sentences while tracking start character offset in text
    const sentences = [];
    const sentenceRegex = /[^.!?]+[.!?]+|\S+/g;
    let match;
    while ((match = sentenceRegex.exec(text)) !== null) {
        const str = match[0].trim();
        if (str) {
            sentences.push({
                text: str,
                startIndex: match.index + match[0].indexOf(str),
            });
        }
    }
    if (sentences.length === 0) {
        sentences.push({ text, startIndex: 0 });
    }

    // 2. Sub-split any sentence chunk longer than 90 characters at commas
    const finalChunks = [];
    for (const item of sentences) {
        if (item.text.length <= 90 || !item.text.includes(',')) {
            finalChunks.push(item);
        } else {
            const parts = item.text.split(/,\s*/);
            let currentOffset = item.startIndex;
            for (let i = 0; i < parts.length; i++) {
                const part = parts[i].trim();
                if (!part) continue;
                const idx = text.indexOf(part, currentOffset);
                const actualIndex = idx !== -1 ? idx : currentOffset;
                finalChunks.push({
                    text: part + (i < parts.length - 1 ? ',' : ''),
                    startIndex: actualIndex,
                });
                currentOffset = actualIndex + part.length;
            }
        }
    }

    return finalChunks;
}

/**
 * useSpeak - Custom Hook for Speech Synthesis and Accessibility Audio Feedback
 * Exposes methods to speak, stop, and play audio beeps.
 * Uses Web Speech API onboundary event to lock live captions to real spoken progress,
 * with a 1.5s fallback timer for synthesis engines that omit boundary events.
 */
export default function useSpeak() {
    const [speaking, setSpeaking] = useState(false);
    const synthRef = useRef(window.speechSynthesis);

    const currentUtteranceRef = useRef(null);
    const fallbackTimerRef = useRef(null);
    const fallbackTimeoutRef = useRef(null);
    const onSentenceChangeRef = useRef(null);

    const clearTimers = () => {
        if (fallbackTimerRef.current) {
            clearTimeout(fallbackTimerRef.current);
            fallbackTimerRef.current = null;
        }
        if (fallbackTimeoutRef.current) {
            clearTimeout(fallbackTimeoutRef.current);
            fallbackTimeoutRef.current = null;
        }
    };

    useEffect(() => {
        return () => {
            clearTimers();
            if (synthRef.current) {
                synthRef.current.cancel();
            }
        };
    }, []);

    // Safety interval: Poll once per second while speaking to reset state if speech ends without onend event
    useEffect(() => {
        if (!speaking) return;

        const safetyInterval = setInterval(() => {
            if (!synthRef.current || synthRef.current.speaking === false) {
                setSpeaking(false);
                if (onSentenceChangeRef.current) {
                    onSentenceChangeRef.current('');
                }
            }
        }, 1000);

        return () => clearInterval(safetyInterval);
    }, [speaking]);

    /** Stops current speech output, cancels synthesis, and resets active speech state */
    const stop = useCallback(() => {
        clearTimers();
        if (synthRef.current) {
            synthRef.current.cancel();
        }
        currentUtteranceRef.current = null;
        setSpeaking(false);

        if (onSentenceChangeRef.current) {
            onSentenceChangeRef.current('');
            onSentenceChangeRef.current = null;
        }
    }, []);

    /**
     * Speaks the full text as a single utterance and updates captions in real-time via onboundary events.
     * @param {string} text - Text to speak
     * @param {number} rate - Speech rate multiplier (0.5 to 2)
     * @param {function} onEnd - Callback function when speech finishes
     * @param {function} onSentenceChange - Subtitle callback function receiving active caption chunk
     */
    const speak = useCallback((text, rate = 1.0, onEnd = null, onSentenceChange = null) => {
        if (!synthRef.current) return;

        // Stop any current reading and reset timers
        stop();
        onSentenceChangeRef.current = onSentenceChange;

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

        // Split text into caption chunks with recorded start character indices
        const chunks = createCaptionChunks(cleanText);
        if (chunks.length === 0) return;

        // Speak full text as ONE single utterance
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = rate;
        currentUtteranceRef.current = utterance;

        let boundaryReceived = false;

        // Show initial caption chunk
        if (onSentenceChange) {
            onSentenceChange(chunks[0].text);
        }

        // Real-time speech progress tracking via onboundary
        utterance.onboundary = (e) => {
            if (currentUtteranceRef.current !== utterance) return;

            boundaryReceived = true;
            clearTimers(); // Cancel fallback timer since boundary events are flowing

            const charIndex = e.charIndex !== undefined ? e.charIndex : 0;
            let activeChunk = chunks[0];
            for (let i = 0; i < chunks.length; i++) {
                if (chunks[i].startIndex <= charIndex) {
                    activeChunk = chunks[i];
                } else {
                    break;
                }
            }

            if (activeChunk && onSentenceChangeRef.current) {
                onSentenceChangeRef.current(activeChunk.text);
            }
        };

        utterance.onstart = () => {
            if (currentUtteranceRef.current !== utterance) return;
            setSpeaking(true);

            // Fallback timer: If no onboundary event arrives within 1.5s, fall back to duration estimates
            fallbackTimerRef.current = setTimeout(() => {
                if (boundaryReceived || currentUtteranceRef.current !== utterance) return;

                let chunkIdx = 0;
                const advanceFallback = () => {
                    if (boundaryReceived || currentUtteranceRef.current !== utterance) return;
                    if (chunkIdx >= chunks.length) return;

                    const currentChunk = chunks[chunkIdx];
                    if (onSentenceChangeRef.current) {
                        onSentenceChangeRef.current(currentChunk.text);
                    }

                    const estDurationMs = Math.max(800, Math.min(6000, Math.round((currentChunk.text.length / (15 * rate)) * 1000)));
                    chunkIdx++;
                    fallbackTimeoutRef.current = setTimeout(advanceFallback, estDurationMs);
                };

                advanceFallback();
            }, 1500);
        };

        utterance.onend = () => {
            if (currentUtteranceRef.current !== utterance) return;
            clearTimers();
            currentUtteranceRef.current = null;
            setSpeaking(false);

            if (onSentenceChangeRef.current) {
                onSentenceChangeRef.current('');
                onSentenceChangeRef.current = null;
            }
            if (onEnd) onEnd();
        };

        utterance.onerror = (e) => {
            if (currentUtteranceRef.current !== utterance) return;
            clearTimers();
            if (e.error === 'interrupted' || e.error === 'canceled') {
                setSpeaking(false);
                if (onSentenceChangeRef.current) {
                    onSentenceChangeRef.current('');
                    onSentenceChangeRef.current = null;
                }
                return;
            }
            console.error('SpeechSynthesisUtterance error:', e);
            setSpeaking(false);
            if (onSentenceChangeRef.current) {
                onSentenceChangeRef.current('');
                onSentenceChangeRef.current = null;
            }
        };

        setSpeaking(true);
        synthRef.current.speak(utterance);
    }, [stop]);

    /** Plays high-contrast audio tone feedback */
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
        speaking,
        playBeep,
    };
}
