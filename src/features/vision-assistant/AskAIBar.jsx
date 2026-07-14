import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * AskAIBar - Question input bar with Speech-to-Text (SpeechRecognition) support
 * and large touch-friendly buttons for low vision accessibility.
 */
export default function AskAIBar({ onSubmit, isProcessing, speakFeedback, playBeep, stopSpeaking }) {
    const [query, setQuery] = useState('');
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const rec = new SpeechRecognition();
            rec.continuous = false;
            rec.interimResults = false;
            rec.lang = 'en-US';

            rec.onstart = () => {
                setIsListening(true);
                if (window.speechSynthesis) {
                    window.speechSynthesis.cancel();
                }
            };

            rec.onspeechstart = () => {
                if (window.speechSynthesis) {
                    window.speechSynthesis.cancel();
                }
            };

            rec.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setQuery(transcript);
                speakFeedback(`Heard question: ${transcript}`);
                onSubmit(transcript);
            };

            rec.onerror = (err) => {
                console.error('Speech recognition error:', err);
                setIsListening(false);
                speakFeedback("Speech recognition failed. Try typing your question instead.");
            };

            rec.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = rec;
            window.sahaSpeechRecognition = rec;
        }

        return () => {
            window.sahaSpeechRecognition = null;
        };
    }, [onSubmit, speakFeedback]);

    const toggleListening = () => {
        playBeep(600, 0.08);
        if (!recognitionRef.current) {
            speakFeedback("Voice input is not supported in this browser. Please type your query.");
            return;
        }

        if (isListening) {
            try {
                recognitionRef.current.abort();
            } catch (err) {
                // Ignore
            }
            setIsListening(false);
        } else {
            // Cancel any current TTS speaking so it doesn't overlap or interfere.
            if (stopSpeaking) {
                stopSpeaking();
            }

            // Speak feedback, and in the onEnd callback, start recognition
            speakFeedback("Microphone active. Ask a question.", () => {
                try {
                    recognitionRef.current.start();
                    setIsListening(true);
                } catch (error) {
                    console.warn('Speech recognition start failed:', error);
                    setIsListening(false);
                }
            });
        }
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        playBeep(700, 0.08);
        if (query.trim() && !isProcessing) {
            onSubmit(query.trim());
            setQuery(''); // clear query on submit
        }
    };

    return (
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-2">
            <label
                htmlFor="ai-question"
                className="text-base-md font-bold text-gray-800 dark:text-gray-100"
            >
                Voice Q&A: Ask AI about the view
            </label>
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <input
                        id="ai-question"
                        type="text"
                        placeholder={isListening ? "Listening..." : "e.g., What currency bill is this?"}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        disabled={isProcessing || isListening}
                        className="w-full min-h-touch px-4 py-3 rounded-card text-base-md border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:border-primary focus:outline-none disabled:bg-gray-100 dark:disabled:bg-gray-900"
                    />

                    {/* Microphone Activation Toggle */}
                    <button
                        type="button"
                        onClick={toggleListening}
                        disabled={isProcessing}
                        aria-label={isListening ? "Stop voice transcription" : "Start voice transcription"}
                        className={`absolute right-2 top-1.5 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                            isListening
                                ? 'bg-red-500 text-white animate-pulse'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                        }`}
                    >
                        {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>
                </div>

                {/* Send Button */}
                <button
                    type="submit"
                    disabled={isProcessing || isListening || !query.trim()}
                    aria-label="Submit question to AI"
                    className="min-h-touch min-w-touch px-4 bg-primary hover:bg-primary-dark disabled:bg-gray-300 text-white rounded-card flex items-center justify-center transition-colors border-2 border-white focus:outline-none"
                >
                    <Send size={20} />
                </button>
            </div>

            {/* Listening Wave Visualizer */}
            <AnimatePresence>
                {isListening && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-1.5 justify-center py-2"
                    >
                        {[...Array(5)].map((_, i) => (
                            <motion.span
                                key={i}
                                animate={{ scaleY: [1, 2.5, 1] }}
                                transition={{
                                    repeat: Infinity,
                                    duration: 0.6,
                                    delay: i * 0.1,
                                }}
                                className="w-1.5 h-4 bg-primary rounded-full origin-center"
                            />
                        ))}
                        <span className="text-base-sm font-semibold text-primary ml-2 animate-pulse">
                            Listening...
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>
        </form>
    );
}
