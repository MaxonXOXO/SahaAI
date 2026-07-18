import { useEffect } from 'react';
import { Play, Pause, Square, FileText, HelpCircle } from 'lucide-react';
import Card from '../../shared/components/Card';
import { renderMarkdown } from '../../shared/lib/parseMarkdown';

/**
 * TextRecognitionPanel - Renders extracted text from OCR mode
 * Provides full playback controls: Read, Pause/Resume, and Stop.
 */
export default function TextRecognitionPanel({
    result,
    isSpeaking,
    isPaused,
    speakResult,
    stopSpeaking,
    pauseSpeaking,
    resumeSpeaking,
    playBeep,
}) {
    // Automatically read results when a new scan completes
    useEffect(() => {
        if (result) {
            speakResult();
        }
    }, [result, speakResult]);

    if (!result) {
        return (
            <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700 p-6 flex flex-col items-center justify-center text-center">
                <HelpCircle size={40} className="text-gray-400 mb-2" />
                <p className="text-base-md font-bold text-gray-700 dark:text-gray-300">
                    Ready to Read Text
                </p>
                <p className="text-base-sm text-gray-400 mt-1 leading-relaxed">
                    Select "Text Reader (OCR)" mode, align your camera with written text (books, letters, labels), and tap "Capture & Read Aloud" to hear it.
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
            title="Extracted Document Text"
            icon={FileText}
            iconColor="bg-primary"
            className="border-2 border-primary/20 bg-white dark:bg-gray-900"
        >
            {/* Playback Control Bar */}
            <div className="flex gap-2 mb-4 mt-2">
                {!isSpeaking ? (
                    <button
                        onClick={() => {
                            if (playBeep) playBeep(440, 0.08);
                            speakResult();
                        }}
                        className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white py-3 rounded-card font-bold text-base-md min-h-touch border-2 border-white focus:outline-none"
                        aria-label="Read document text out loud"
                    >
                        <Play size={22} />
                        Read Out Loud
                    </button>
                ) : (
                    <>
                        <button
                            onClick={() => {
                                if (isPaused) {
                                    if (playBeep) playBeep(440, 0.08);
                                    resumeSpeaking();
                                } else {
                                    if (playBeep) playBeep(350, 0.08);
                                    pauseSpeaking();
                                }
                            }}
                            className="flex-1 flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-card font-bold text-base-md min-h-touch border-2 border-white focus:outline-none"
                            aria-label={isPaused ? "Resume reading text" : "Pause reading text"}
                        >
                            {isPaused ? <Play size={20} /> : <Pause size={20} />}
                            {isPaused ? 'Resume' : 'Pause'}
                        </button>
                        <button
                            onClick={() => {
                                if (playBeep) playBeep(300, 0.15);
                                stopSpeaking();
                            }}
                            className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-3 rounded-card font-bold text-base-md min-h-touch border-2 border-white focus:outline-none"
                            aria-label="Stop reading text"
                        >
                            <Square size={20} />
                            Stop
                        </button>
                    </>
                )}
            </div>

            {/* Document Text Area */}
            <div className="bg-gray-50 dark:bg-gray-800 p-5 rounded-card border border-gray-200 dark:border-gray-700 shadow-inner">
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
