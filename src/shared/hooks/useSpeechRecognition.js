import { useEffect, useRef, useState } from 'react';

/** Shared browser speech-to-text adapter used by accessible input surfaces. */
export default function useSpeechRecognition({ language = 'en-US', onResult, onError } = {}) {
    const recognitionRef = useRef(null);
    const [isListening, setIsListening] = useState(false);
    const [supported, setSupported] = useState(false);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return undefined;

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = language;
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event) => {
            setIsListening(false);
            onError?.(event);
        };
        recognition.onresult = (event) => onResult?.(event.results[0][0].transcript.trim());
        recognitionRef.current = recognition;
        setSupported(true);

        return () => {
            recognition.abort();
            recognitionRef.current = null;
        };
    }, [language, onError, onResult]);

    const start = () => {
        if (!recognitionRef.current || isListening) return false;
        try {
            recognitionRef.current.start();
            return true;
        } catch {
            return false;
        }
    };

    const stop = () => recognitionRef.current?.abort();
    return { isListening, supported, start, stop };
}
