import { useCallback, useState } from 'react';
import { Mic, MicOff, Send } from 'lucide-react';
import useSettingsStore from '../../store/useSettingsStore';
import useProfileStore from '../../store/useProfileStore';
import useSpeechRecognition from '../../shared/hooks/useSpeechRecognition';

export default function InputBar({ onSubmit, isProcessing }) {
    const [value, setValue] = useState('');
    const speechLanguage = useSettingsStore((s) => s.speechLanguage);
    const primaryMode = useProfileStore((s) => s.primaryMode);
    const isLowVision = primaryMode === 'lowVision';

    const submit = useCallback((text) => {
        const question = text.trim();
        if (!question || isProcessing) return;
        setValue('');
        onSubmit(question);
    }, [isProcessing, onSubmit]);

    const { isListening, supported, start, stop } = useSpeechRecognition({
        language: speechLanguage === 'ml' ? 'ml-IN' : 'en-US',
        onResult: submit,
    });

    return (
        <form 
            onSubmit={(event) => { event.preventDefault(); submit(value); }} 
            className="bg-white dark:bg-gray-900 px-4 py-3 border-t border-gray-100 dark:border-gray-800 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]"
        >
            <div className="flex items-center gap-2 max-w-3xl mx-auto">
                <div 
                    className="flex-1 flex items-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20 transition-all"
                    style={{
                        borderRadius: isLowVision ? '2.5rem' : '2rem',
                    }}
                >
                    <input 
                        type="text"
                        value={value} 
                        onChange={(event) => setValue(event.target.value)} 
                        disabled={isProcessing || isListening}
                        placeholder={isListening ? 'Listening…' : 'Ask or tell SahaAI anything…'}
                        className="flex-1 bg-transparent border-none outline-none py-1.5 text-base-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 w-full" 
                    />
                </div>
                
                <button 
                    type="button" 
                    onClick={isListening ? stop : start} 
                    disabled={isProcessing || !supported}
                    aria-label={isListening ? 'Stop voice input' : 'Start voice input'} 
                    title={supported ? 'Voice input' : 'Voice input is not supported by this browser'}
                    className={`shrink-0 flex items-center justify-center rounded-full transition-colors ${
                        isListening 
                            ? 'bg-red-500 text-white animate-pulse' 
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                    } disabled:opacity-50`}
                    style={{
                        width: isLowVision ? '52px' : '44px',
                        height: isLowVision ? '52px' : '44px',
                    }}
                >
                    {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
                
                <button 
                    type="submit" 
                    disabled={isProcessing || !value.trim()} 
                    aria-label="Send to SahaAI"
                    className="shrink-0 flex items-center justify-center rounded-full bg-primary text-white disabled:bg-gray-200 dark:disabled:bg-gray-800 dark:disabled:text-gray-600 transition-colors hover:bg-primary/95"
                    style={{
                        width: isLowVision ? '52px' : '44px',
                        height: isLowVision ? '52px' : '44px',
                        backgroundColor: value.trim() ? 'var(--a11y-primary)' : undefined,
                    }}
                >
                    <Send size={20} />
                </button>
            </div>
            {isListening && (
                <p className="mt-2 text-center text-xs font-semibold text-primary animate-pulse" style={{ color: 'var(--a11y-primary)' }}>
                    Listening… speak when ready.
                </p>
            )}
        </form>
    );
}
