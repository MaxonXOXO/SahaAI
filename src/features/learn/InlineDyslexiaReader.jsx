import { useMemo, useEffect } from 'react';
import { X } from 'lucide-react';
import useReadingSettings from '../reading-mode/hooks/useReadingSettings';
import useTextToSpeech from '../../shared/hooks/useTextToSpeech';
import ReadingPane from '../reading-mode/components/ReadingPane';
import PlaybackBar from '../reading-mode/components/PlaybackBar';

// Lightweight wrapper that auto-plays text and provides a streamlined reading UI
export default function InlineDyslexiaReader({ text, onClose }) {
    const { fontFamily, fontSize, spacing, overlayOn, overlayColor, voiceEngine } = useReadingSettings();
    
    const words = useMemo(() => {
        const list = [];
        const regex = /\S+/g;
        let match;
        const cleanText = text.replace(/[*#_`~]/g, '');
        while ((match = regex.exec(cleanText)) !== null) {
            list.push({
                word: match[0],
                start: match.index,
                end: match.index + match[0].length,
                index: list.length
            });
        }
        return { list, cleanText };
    }, [text]);

    const {
        isPlaying,
        currentWordIndex,
        speechRate,
        play,
        pause,
        stop,
        setSpeechRate,
    } = useTextToSpeech({ text: words.cleanText, words: words.list, voiceEngine });

    // Auto-play on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            play(0);
        }, 150);
        return () => {
            clearTimeout(timer);
            stop();
        };
    }, []);

    const handleClose = () => {
        stop();
        onClose();
    };

    return (
        <div className="flex flex-col mt-2 bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-md border border-gray-200 dark:border-gray-700 relative">
            <button 
                onClick={handleClose}
                className="absolute top-2 right-2 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-gray-700 dark:text-gray-200 transition-colors"
                aria-label="Close Reader"
            >
                <X size={16} strokeWidth={3} />
            </button>
            <div className="max-h-72 overflow-y-auto">
                <ReadingPane 
                    text={words.cleanText} 
                    words={words.list} 
                    currentWordIndex={currentWordIndex}
                    onWordClick={play}
                    fontFamily={fontFamily}
                    fontSize={fontSize}
                    spacing={spacing}
                    overlayOn={overlayOn}
                    overlayColor={overlayColor}
                />
            </div>
            <div className="p-1 sm:p-2 bg-gray-50 dark:bg-gray-850 border-t border-gray-200 dark:border-gray-700">
                <PlaybackBar
                    isPlaying={isPlaying}
                    onPlayPause={() => { isPlaying ? pause() : play(currentWordIndex >= 0 ? currentWordIndex : 0) }}
                    onStop={stop}
                    progress={words.list.length ? Math.round(((currentWordIndex + 1) / words.list.length) * 100) : 0}
                    speed={speechRate}
                    onChangeSpeed={setSpeechRate}
                />
            </div>
        </div>
    );
}
