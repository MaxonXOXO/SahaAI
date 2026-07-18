import { useCallback, useState } from 'react';
import { Mic, MicOff, Send } from 'lucide-react';
import useSettingsStore from '../../store/useSettingsStore';
import useSpeechRecognition from '../../shared/hooks/useSpeechRecognition';

export default function InputBar({ onSubmit, isProcessing }) {
    const [value, setValue] = useState('');
    const speechLanguage = useSettingsStore((s) => s.speechLanguage);
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
        <form onSubmit={(event) => { event.preventDefault(); submit(value); }} className="border-t-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3">
            <div className="flex items-end gap-2">
                <textarea value={value} onChange={(event) => setValue(event.target.value)} disabled={isProcessing || isListening}
                    rows={1} placeholder={isListening ? 'Listening…' : 'Ask or tell SahaAI anything…'}
                    className="saha-input flex-1 resize-none rounded-card bg-gray-100 dark:bg-gray-800 px-4 py-3 text-base-sm text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary/30" />
                <button type="button" onClick={isListening ? stop : start} disabled={isProcessing || !supported}
                    aria-label={isListening ? 'Stop voice input' : 'Start voice input'} title={supported ? 'Voice input' : 'Voice input is not supported by this browser'}
                    className={`min-h-touch min-w-touch rounded-card ${isListening ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-200'} disabled:opacity-50`}>
                    {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
                <button type="submit" disabled={isProcessing || !value.trim()} aria-label="Send to SahaAI"
                    className="min-h-touch min-w-touch rounded-card bg-primary text-white disabled:bg-gray-300">
                    <Send size={20} />
                </button>
            </div>
            {isListening && <p className="mt-2 text-center text-xs font-semibold text-primary">Listening… speak when ready.</p>}
        </form>
    );
}
