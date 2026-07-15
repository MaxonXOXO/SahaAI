import { useState, useEffect, useRef } from 'react';
import { fetchSpeechAudio, buildSpeechChunks, estimateWordTimings } from '../lib/openai-tts';

/**
 * useTextToSpeech Hook
 * Integrates Web SpeechSynthesis API with a text tokenized word list,
 * alongside OpenAI TTS premium engine with text chunking, prefetching, and estimated highlight mapping.
 */
export default function useTextToSpeech({ text, words, voiceEngine = 'browser' }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentWordIndex, setCurrentWordIndex] = useState(-1);
    const [speechRate, setSpeechRate] = useState(1.0);
    const [isGenerating, setIsGenerating] = useState(false);

    const utteranceRef = useRef(null);
    const fallbackTimerRef = useRef(null);
    const activePlaybackOffset = useRef(0);
    const boundaryFiredRef = useRef(false);

    // OpenAI TTS specific refs
    const audioRef = useRef(null);
    const audioCacheRef = useRef(new Map());
    const prefetchingRef = useRef(new Set());
    const animationRef = useRef(null);
    const currentChunkIndexRef = useRef(-1);
    const timingsRef = useRef([]);

    // Keep refs of settings to avoid state closure pitfalls in async callbacks
    const refs = useRef({
        isPlaying,
        currentWordIndex,
        speechRate,
        words,
        text,
        voiceEngine
    });

    useEffect(() => {
        refs.current = { isPlaying, currentWordIndex, speechRate, words, text, voiceEngine };
    }, [isPlaying, currentWordIndex, speechRate, words, text, voiceEngine]);

    // Clean up timers
    const clearTimers = () => {
        if (fallbackTimerRef.current) {
            clearTimeout(fallbackTimerRef.current);
            fallbackTimerRef.current = null;
        }
    };

    // OpenAI TTS highlight loop
    const startHighlightLoop = (audio, timings) => {
        stopHighlightLoop();
        const updateHighlight = () => {
            if (!audio || audio.paused || audio.ended) return;
            const currentTime = audio.currentTime;

            // Find the word that spans across currentTime
            const activeWord = timings.find(
                (w) => currentTime >= w.startTime && currentTime <= w.endTime
            );
            if (activeWord) {
                setCurrentWordIndex(activeWord.index);
            }
            animationRef.current = requestAnimationFrame(updateHighlight);
        };
        animationRef.current = requestAnimationFrame(updateHighlight);
    };

    const stopHighlightLoop = () => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }
    };

    // OpenAI TTS prefetching
    const prefetchChunk = async (chunkIndex, chunks) => {
        if (chunkIndex < 0 || chunkIndex >= chunks.length) return;
        if (audioCacheRef.current.has(chunkIndex)) return;
        if (prefetchingRef.current.has(chunkIndex)) return;

        prefetchingRef.current.add(chunkIndex);
        try {
            const chunk = chunks[chunkIndex];
            const blob = await fetchSpeechAudio(chunk.text, { voice: 'alloy' });
            const url = URL.createObjectURL(blob);
            audioCacheRef.current.set(chunkIndex, url);
        } catch (err) {
            console.warn(`[TTS Prefetch] Failed to prefetch chunk ${chunkIndex}:`, err);
        } finally {
            prefetchingRef.current.delete(chunkIndex);
        }
    };

    // OpenAI TTS playback logic
    const playOpenAIChunk = async (chunkIndex, chunks) => {
        if (chunkIndex < 0 || chunkIndex >= chunks.length) {
            stop();
            return;
        }

        currentChunkIndexRef.current = chunkIndex;
        stopHighlightLoop();

        const audio = audioRef.current;
        if (!audio) return;

        let url = audioCacheRef.current.get(chunkIndex);
        if (!url) {
            setIsGenerating(true);
            try {
                const chunk = chunks[chunkIndex];
                const blob = await fetchSpeechAudio(chunk.text, { voice: 'alloy' });
                url = URL.createObjectURL(blob);
                audioCacheRef.current.set(chunkIndex, url);
            } catch (err) {
                console.error('[TTS] Failed to play OpenAI chunk:', err);
                setIsGenerating(false);
                setIsPlaying(false);
                return;
            } finally {
                setIsGenerating(false);
            }
        }

        audio.src = url;
        audio.playbackRate = refs.current.speechRate;
        
        try {
            await audio.play();
            setIsPlaying(true);
        } catch (err) {
            console.error('[TTS] Audio play failed:', err);
            setIsPlaying(false);
            return;
        }

        // Prefetch next chunk
        prefetchChunk(chunkIndex + 1, chunks);
    };

    const playNextChunk = () => {
        const activeChunks = buildSpeechChunks(refs.current.words, refs.current.text);
        const nextIdx = currentChunkIndexRef.current + 1;
        if (nextIdx < activeChunks.length) {
            playOpenAIChunk(nextIdx, activeChunks);
        } else {
            stop();
        }
    };

    const pauseOpenAI = () => {
        if (audioRef.current) {
            audioRef.current.pause();
        }
        stopHighlightLoop();
        setIsPlaying(false);
    };

    const stopOpenAI = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
        }
        stopHighlightLoop();
        setIsPlaying(false);
        setCurrentWordIndex(-1);
        currentChunkIndexRef.current = -1;
    };

    // Setup Audio events and cleanup
    useEffect(() => {
        audioRef.current = new Audio();
        const audio = audioRef.current;

        const handleEnded = () => {
            playNextChunk();
        };

        const handleCanPlayThrough = () => {
            const duration = audio.duration;
            const currentIdx = currentChunkIndexRef.current;
            const activeChunks = buildSpeechChunks(refs.current.words, refs.current.text);
            const chunk = activeChunks[currentIdx];
            
            if (chunk) {
                const timings = estimateWordTimings(chunk.words, duration);
                timingsRef.current = timings;
                startHighlightLoop(audio, timings);
            }
        };

        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('canplaythrough', handleCanPlayThrough);

        return () => {
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('canplaythrough', handleCanPlayThrough);
            audio.pause();
            audioRef.current = null;

            audioCacheRef.current.forEach((url) => URL.revokeObjectURL(url));
            audioCacheRef.current.clear();
        };
    }, []);

    // Clear cache when text changes
    useEffect(() => {
        audioCacheRef.current.forEach((url) => URL.revokeObjectURL(url));
        audioCacheRef.current.clear();
        prefetchingRef.current.clear();
        currentChunkIndexRef.current = -1;
    }, [text]);

    // Sync speech rate change
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.playbackRate = speechRate;
        }
    }, [speechRate]);

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

        // Route to OpenAI Speech path
        if (refs.current.voiceEngine === 'openai') {
            const activeChunks = buildSpeechChunks(activeWords, activeText);
            let chunkIndex = activeChunks.findIndex(
                (c) => startIndex >= c.startIndex && startIndex <= c.endIndex
            );
            if (chunkIndex === -1) chunkIndex = 0;

            setCurrentWordIndex(startIndex);
            playOpenAIChunk(chunkIndex, activeChunks);
            return;
        }

        // Standard Web Speech API logic
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
            setIsPlaying(true);
            startTimerFallback(startIndex);
            return;
        }

        window.speechSynthesis.cancel();
        clearTimers();

        const startWord = activeWords[startIndex] || activeWords[0];
        const startCharOffset = startWord.start;
        activePlaybackOffset.current = startCharOffset;
        boundaryFiredRef.current = false;

        const textToSpeak = activeText.substring(startCharOffset);
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.rate = refs.current.speechRate;

        const allVoices = window.speechSynthesis.getVoices();
        const englishVoice = allVoices.find(
            (v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha'))
        ) || allVoices.find((v) => v.lang.startsWith('en')) || allVoices[0];

        if (englishVoice) {
            utterance.voice = englishVoice;
        }

        utterance.onboundary = (event) => {
            if (event.name === 'word') {
                boundaryFiredRef.current = true;
                clearTimers();

                const absoluteCharIndex = event.charIndex + activePlaybackOffset.current;
                
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
            if (err.error !== 'interrupted') {
                console.warn("Speech synthesis boundary warning:", err.error);
                setIsPlaying(false);
                setCurrentWordIndex(-1);
            }
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);

        setTimeout(() => {
            if (refs.current.isPlaying && !boundaryFiredRef.current) {
                console.log("Boundary callbacks inactive. Starting fallback speaking simulation...");
                const latestIdx = refs.current.currentWordIndex >= 0 ? refs.current.currentWordIndex : startIndex;
                startTimerFallback(latestIdx);
            }
        }, 600);
    };

    const pause = () => {
        if (refs.current.voiceEngine === 'openai') {
            pauseOpenAI();
            return;
        }

        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
                window.speechSynthesis.pause();
                clearTimers();
                setIsPlaying(false);
                return;
            }
        }
        clearTimers();
        setIsPlaying(false);
    };

    const stop = () => {
        if (refs.current.voiceEngine === 'openai') {
            stopOpenAI();
            return;
        }

        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        clearTimers();
        setIsPlaying(false);
        setCurrentWordIndex(-1);
    };

    const changeRate = (rate) => {
        setSpeechRate(rate);
        if (refs.current.isPlaying || refs.current.currentWordIndex >= 0) {
            const index = refs.current.currentWordIndex >= 0 ? refs.current.currentWordIndex : 0;
            play(index);
        }
    };

    // Clean up SpeechSynthesis on unmount
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
        setSpeechRate: changeRate,
        isGenerating
    };
}
