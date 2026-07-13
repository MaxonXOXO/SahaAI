import { useEffect } from 'react';
import { Volume2, VolumeX, List, HelpCircle } from 'lucide-react';
import Card from '../../shared/components/Card';

/**
 * ObjectDetectionPanel - Displays detected objects/obstacles/currency
 * Automatically speaks out the objects on render, with custom audio play/stop toggle.
 */
export default function ObjectDetectionPanel({ result, isSpeaking, speakResult, stopSpeaking }) {
    // Speak automatically when a new result arrives
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
                    Ready to Detect Objects
                </p>
                <p className="text-base-sm text-gray-400 mt-1 leading-relaxed">
                    Select "Object & Currency" mode, aim your camera, and tap "Capture & Read Aloud" to identify objects, money, and verify clear paths.
                </p>
            </Card>
        );
    }

    // Filter out simulator notices and parse individual items
    const lines = result.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    const simulatorNotice = lines.find((l) => l.includes('(Note: Simulator'));
    const items = lines.filter((l) => !l.includes('(Note: Simulator'));

    return (
        <Card
            title="Objects & Obstacles Found"
            icon={List}
            iconColor="bg-primary"
            className="border-2 border-primary/20 bg-white dark:bg-gray-900"
        >
            {/* Playback Controls */}
            <div className="flex justify-between items-center mb-4 mt-2">
                <button
                    onClick={isSpeaking ? stopSpeaking : speakResult}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-card font-bold text-base-md min-h-touch transition-colors border-2 border-white focus:outline-none ${
                        isSpeaking
                            ? 'bg-red-500 hover:bg-red-600 text-white'
                            : 'bg-primary hover:bg-primary-dark text-white'
                    }`}
                >
                    {isSpeaking ? <VolumeX size={22} /> : <Volume2 size={22} />}
                    {isSpeaking ? 'Stop Voice Output' : 'Speak Results'}
                </button>
            </div>

            {/* List of Objects */}
            <div className="flex flex-col gap-3">
                {items.map((item, idx) => {
                    // Strip markdown list prefix chars
                    const cleanText = item.replace(/^[-*•]\s*/, '').trim();
                    return (
                        <div
                            key={idx}
                            className="bg-gray-50 dark:bg-gray-800 p-4 rounded-card border border-gray-200 dark:border-gray-700 shadow-sm"
                        >
                            <p className="text-base-md font-bold text-gray-800 dark:text-gray-100 leading-relaxed">
                                {cleanText}
                            </p>
                        </div>
                    );
                })}
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
