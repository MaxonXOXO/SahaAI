import { useState, useEffect, useRef } from 'react';

/**
 * useTextToSpeech Hook
 * Integrates Web SpeechSynthesis API with a text tokenized word list.
 * Leverages onboundary tracking, charOffsets, and features a weighted fallback timer simulator.
 */
export default function useTextToSpeech({ text, words }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentWordIndex, setCurrentWordIndex] = useState(-1);
    const [speechRate, setSpeechRate] = useState(1.0);

    const utteranceRef = useRef(null);
    const fallbackTimerRef = useRef(null);
    const activePlaybackOffset = useRef(0);
    const boundaryFiredRef = useRef(false);

    // Keep refs of settings to avoid state closure pitfalls in async callbacks
    const refs = useRef({
        isPlaying,
        currentWordIndex,
        speechRate,
        words,
        text
    });

    useEffect(() => {
        refs.current = { isPlaying, currentWordIndex, speechRate, words, text };
    }, [isPlaying, currentWordIndex, speechRate, words, text]);

    const stop = () => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        clearTimers();
        setIsPlaying(false);
        setCurrentWordIndex(-1);
    };

    const clearTimers = () => {
        if (fallbackTimerRef.current) {
            clearTimeout(fallbackTimerRef.current);
            fallbackTimerRef.current = null;
        }
    };

    // Weighted timer simulation fallback if onboundary is not supported/firing
    const startTimerFallback = (startIndex) => {
        clearTimers();
        const activeWords = refs.current.words;
        if (startIndex >= activeWords.length) {
            stop();
            return;
        }

        setCurrentWordIndex(startIndex);

        const currentWord = activeWords[startIndex];
        if (!currentWord) return;

        // Formula: average word duration weighted by character count
        const charWeight = 60; // ms per letter
        const baseDelay = 120; // base offset ms
        const rate = refs.current.speechRate;
        const delay = ((currentWord.word.length * charWeight) + baseDelay) / rate;

        fallbackTimerRef.current = setTimeout(() => {
            startTimerFallback(startIndex + 1);
        }, delay);
    };

    const play = (startIndex = 0) => {
        const activeText = refs.current.text;
        const activeWords = refs.current.words;

        if (!activeText || activeWords.length === 0) return;

        if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
            // Synthesis not supported - go straight to timer
            setIsPlaying(true);
            startTimerFallback(startIndex);
            return;
        }

        // Reset previous speech synthethizer sessions
        window.speechSynthesis.cancel();
        clearTimers();

        const startWord = activeWords[startIndex] || activeWords[0];
        const startCharOffset = startWord.start;
        activePlaybackOffset.current = startCharOffset;
        boundaryFiredRef.current = false;

        const textToSpeak = activeText.substring(startCharOffset);
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.rate = refs.current.speechRate;

        // Pull English voices
        const allVoices = window.speechSynthesis.getVoices();
        const englishVoice = allVoices.find(
            v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha'))
        ) || allVoices.find(v => v.lang.startsWith('en')) || allVoices[0];

        if (englishVoice) {
            utterance.voice = englishVoice;
        }

        utterance.onboundary = (event) => {
            if (event.name === 'word') {
                boundaryFiredRef.current = true;
                clearTimers(); // disable simulated timer fallback

                const absoluteCharIndex = event.charIndex + activePlaybackOffset.current;
                
                // Match absolute character boundaries back to word tokens
                let matchedIndex = 0;
                let minDiff = Infinity;
                const currentWordsList = refs.current.words;

                for (let i = 0; i < currentWordsList.length; i++) {
                    const w = currentWordsList[i];
                    if (absoluteCharIndex >= w.start && absoluteCharIndex < w.end) {
                        matchedIndex = i;
                        break;
                    }
                    const diff = Math.abs(w.start - absoluteCharIndex);
                    if (diff < minDiff) {
                        minDiff = diff;
                        matchedIndex = i;
                    }
                }
                setCurrentWordIndex(matchedIndex);
            }
        };

        utterance.onend = () => {
            setIsPlaying(false);
            setCurrentWordIndex(-1);
        };

        utterance.onerror = (err) => {
            // Avoid flagging errors during speech cancellations
            if (err.error !== 'interrupted') {
                console.warn("Speech synthesis boundary warning:", err.error);
                setIsPlaying(false);
                setCurrentWordIndex(-1);
            }
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);

        // Fallback watchdog:
        // If onboundary fails to fire within 600ms, initialize timer simulation
        setTimeout(() => {
            if (refs.current.isPlaying && !boundaryFiredRef.current) {
                console.log("Boundary callbacks inactive. Starting fallback speaking simulation...");
                const latestIdx = refs.current.currentWordIndex >= 0 ? refs.current.currentWordIndex : startIndex;
                startTimerFallback(latestIdx);
            }
        }, 600);
    };

    const pause = () => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
                window.speechSynthesis.pause();
                clearTimers();
                setIsPlaying(false);
                return;
            }
        }
        // Fallback pause clearing
        clearTimers();
        setIsPlaying(false);
    };

    const changeRate = (rate) => {
        setSpeechRate(rate);
        // If speaking, recreate session under revised speaking rates
        if (refs.current.isPlaying || refs.current.currentWordIndex >= 0) {
            const index = refs.current.currentWordIndex >= 0 ? refs.current.currentWordIndex : 0;
            play(index);
        }
    };

    // Clean up
    useEffect(() => {
        return () => {
            if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
            clearTimers();
        };
    }, []);

    return {
        isPlaying,
        currentWordIndex,
        speechRate,
        play,
        pause,
        stop,
        setSpeechRate: changeRate
    };
}
