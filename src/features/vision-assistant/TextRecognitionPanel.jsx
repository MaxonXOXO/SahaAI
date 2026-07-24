import { useEffect, useRef } from 'react';
import { RotateCcw, FileText, HelpCircle } from 'lucide-react';
import Card from '../../shared/components/Card';
import { renderMarkdown } from '../../shared/lib/parseMarkdown';

/**
 * TextRecognitionPanel - Renders extracted text from OCR mode
 * Provides a single Repeat playback control button.
 */
export default function TextRecognitionPanel({
    result,
    isSpeaking,
    speakResult,
    playBeep,
    resultRef,
    title = "Extracted Document Text",
    emptyTitle = "Ready to Read Text",
    emptyDescription = 'Select "Text Reader (OCR)" mode, align your camera with written text (books, letters, labels), and tap "Capture & Read Aloud" to hear it.',
}) {
    const lastSpokenRef = useRef(null);

    // Automatically read results when a new scan completes (once per new result)
    useEffect(() => {
        if (result && lastSpokenRef.current !== result) {
            lastSpokenRef.current = result;
            speakResult();
        }
    }, [result]);

    if (!result) {
        return (
            <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700 p-6 flex flex-col items-center justify-center text-center">
                <HelpCircle size={40} className="text-gray-400 mb-2" />
                <p className="text-base-md font-bold text-gray-700 dark:text-gray-300">
                    {emptyTitle}
                </p>
                <p className="text-base-sm text-gray-400 mt-1 leading-relaxed">
                    {emptyDescription}
                </p>
            </Card>
        );
    }

    // Isolate simulator warning if present
    const lines = result.split('\n');
    const simulatorNotice = lines.find((l) => l.includes('(Note: Simulator'));
    const textToShow = lines.filter((l) => !l.includes('(Note: Simulator')).join('\n');

    return (
        <Card
            title={title}
            icon={FileText}
            iconColor="bg-primary"
            className="border-2 border-primary/20 bg-white dark:bg-gray-900"
        >
            {/* Playback Control Bar: Single Repeat Button */}
            <div className="flex gap-2 mb-4 mt-2">
                <button
                    onClick={() => {
                        if (playBeep) playBeep(440, 0.08);
                        if (window.speechSynthesis) {
                            window.speechSynthesis.cancel();
                        }
                        speakResult();
                    }}
                    disabled={isSpeaking}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-card font-bold text-base-md min-h-touch border-2 border-white focus:outline-none transition-all ${
                        isSpeaking
                            ? 'bg-primary/60 text-white/80 cursor-not-allowed'
                            : 'bg-primary hover:bg-primary-dark text-white active:scale-98 cursor-pointer'
                    }`}
                    aria-label={isSpeaking ? "Reading document text out loud" : "Repeat reading document text out loud"}
                >
                    <RotateCcw size={20} className={isSpeaking ? 'animate-spin' : ''} />
                    {isSpeaking ? 'Speaking…' : '🔁 Repeat'}
                </button>
            </div>

            {/* Document Text Area */}
            <div
                ref={resultRef}
                tabIndex={-1}
                aria-live="polite"
                role="status"
                className="bg-gray-50 dark:bg-gray-800 p-5 rounded-card border border-gray-200 dark:border-gray-700 shadow-inner outline-none max-h-[260px] overflow-y-auto"
            >
                <p className="text-base-lg font-bold text-gray-800 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">
                    {renderMarkdown(textToShow)}
                </p>
            </div>

            {simulatorNotice && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-card">
                    <p className="text-base-sm text-yellow-700 dark:text-yellow-400 font-medium">
                        {simulatorNotice}
                    </p>
                </div>
            )}
        </Card>
    );
}
