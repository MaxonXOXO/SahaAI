import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sliders, ToggleLeft, ToggleRight, Info } from 'lucide-react';

// Custom CSS styling (OpenDyslexic font-face & spacings)
import './reading-mode.css';

// Feature components and hooks
import ScreenHeader from '../../shared/components/ScreenHeader';
import useReadingSettings from './hooks/useReadingSettings';
import useTextToSpeech from './hooks/useTextToSpeech';
import TopToolbar from './components/TopToolbar';
import FontControls from './components/FontControls';
import ReadingPane from './components/ReadingPane';
import PlaybackBar from './components/PlaybackBar';
import ScanBar from './components/ScanBar';

// Default document text for initial mount testing
const DEFAULT_DOC_TEXT = `SahaAI Reading Assistant is ready.

This is a sample document designed to demonstrate synchronized word-by-word text-to-speech highlighting.

You can click on any word directly to start listening from that point, adjust the speed rate in the playback bar, or customize font spacing options above.`;

export default function ReadingModeScreen() {
    const navigate = useNavigate();

    // 1. Reading config state (single source of truth)
    const {
        fontFamily,
        setFontFamily,
        fontSize,
        setFontSize,
        spacing,
        setSpacing,
        overlayOn,
        setOverlayOn,
        overlayColor,
        setOverlayColor,
    } = useReadingSettings();

    // Local screen visual states
    const [activeTab, setActiveTab] = useState(null); // 'fonts' | 'spacing' | 'overlay' | 'more' | null
    const [documentText, setDocumentText] = useState(DEFAULT_DOC_TEXT);
    const [statusMessage, setStatusMessage] = useState('');

    // 2. Tokenize text into words with absolute offsets
    const words = useMemo(() => {
        const list = [];
        const regex = /\S+/g;
        let match;
        while ((match = regex.exec(documentText)) !== null) {
            list.push({
                word: match[0],
                start: match.index,
                end: match.index + match[0].length,
                index: list.length
            });
        }
        return list;
    }, [documentText]);

    // 3. Audio Playback engine hook
    const {
        isPlaying,
        currentWordIndex,
        speechRate,
        play,
        pause,
        stop,
        setSpeechRate
    } = useTextToSpeech({ text: documentText, words });

    // Scroll active word span into center focus
    useEffect(() => {
        if (currentWordIndex >= 0) {
            const wordElement = document.getElementById(`word-span-${currentWordIndex}`);
            if (wordElement) {
                wordElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }, [currentWordIndex]);

    // Calculate audio progress percentage
    const progressPercent = useMemo(() => {
        if (words.length === 0 || currentWordIndex < 0) return 0;
        return Math.round(((currentWordIndex + 1) / words.length) * 100);
    }, [currentWordIndex, words]);

    // Swatches definitions
    const swatches = [
        { name: 'Yellow Shade', value: 'rgba(254, 240, 138, 0.15)', hexBg: 'bg-yellow-250' },
        { name: 'Blue Shade', value: 'rgba(147, 197, 253, 0.15)', hexBg: 'bg-blue-200' },
        { name: 'Green Shade', value: 'rgba(134, 239, 172, 0.15)', hexBg: 'bg-green-200' },
        { name: 'Orange Shade', value: 'rgba(253, 186, 116, 0.15)', hexBg: 'bg-orange-200' },
        { name: 'Pink Shade', value: 'rgba(244, 114, 182, 0.15)', hexBg: 'bg-pink-200' }
    ];

    const handleToggleTab = (tab) => {
        setActiveTab(activeTab === tab ? null : tab);
    };

    // Font size scaling list steps
    const fontSizesList = ['text-base-sm', 'text-base-md', 'text-base-lg', 'text-base-xl'];

    const handleIncreaseFontSize = () => {
        const index = fontSizesList.indexOf(fontSize);
        if (index < fontSizesList.length - 1) {
            setFontSize(fontSizesList[index + 1]);
        }
    };

    const handleDecreaseFontSize = () => {
        const index = fontSizesList.indexOf(fontSize);
        if (index > 0) {
            setFontSize(fontSizesList[index - 1]);
        }
    };

    // Spacing categories mapping
    const spacingOptions = [
        { id: 'spacing-normal', label: 'Normal' },
        { id: 'spacing-relaxed', label: 'Relaxed' },
        { id: 'spacing-wide', label: 'Wide' }
    ];


    // Simulated Scanners Triggers
    const handleScanDoc = () => {
        stop();
        setStatusMessage('Starting camera overlay tracking...');
        setTimeout(() => {
            setDocumentText(
                'Camera Scanned Worksheet:\n\nThe Solar system contains eight planetary orbits surrounding the central Sun.\n\nEarth is situated in the habitable zone, sustaining deep liquid oceans and complex biology.'
            );
            setStatusMessage('OCR character scanning successfully parsed!');
            setTimeout(() => setStatusMessage(''), 2500);
        }, 1200);
    };

    const handleOcrProcess = () => {
        stop();
        setStatusMessage('Segmenting layout structures and cleaning document blocks (OCR)...');
        setTimeout(() => {
            setDocumentText(
                'Scanned Textbook Section:\n\nGravity pulls objects toward center vectors proportional to their mass.\n\nThis basic law structures tides, keeps moons linked to planetary targets, and regulates stellar cluster dynamics.'
            );
            setStatusMessage('Character recognition resolved!');
            setTimeout(() => setStatusMessage(''), 2500);
        }, 1500);
    };

    const handlePlayPauseToggle = () => {
        if (isPlaying) {
            pause();
        } else {
            // resume or play from active pointer index
            play(currentWordIndex >= 0 ? currentWordIndex : 0);
        }
    };

    const handleWordClick = (index) => {
        play(index);
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-gray-50 dark:bg-gray-950 overflow-hidden relative select-none">
            {/* Screen Header */}
            <ScreenHeader
                title="Dyslexia Reading Mode"
                showBack={true}
                onBack={() => {
                    stop();
                    navigate('/dashboard');
                }}
            />

            {/* Top Toolbar buttons */}
            <TopToolbar
                activeTab={activeTab}
                onToggleFonts={() => handleToggleTab('fonts')}
                onToggleSpacing={() => handleToggleTab('spacing')}
                onToggleOverlay={() => handleToggleTab('overlay')}
                onToggleMore={() => handleToggleTab('more')}
            />

            {/* Dropdown sheets animated with Framer Motion */}
            <div className="px-4 py-1 z-20">
                <AnimatePresence mode="wait">
                    {activeTab === 'fonts' && (
                        <motion.div
                            key="fonts-panel"
                            initial={{ height: 0, opacity: 0, y: -10 }}
                            animate={{ height: 'auto', opacity: 1, y: 0 }}
                            exit={{ height: 0, opacity: 0, y: -10 }}
                            transition={{ duration: 0.18 }}
                            className="overflow-hidden mt-1"
                        >
                            <FontControls
                                fontFamily={fontFamily}
                                onChangeFontFamily={setFontFamily}
                                fontSize={fontSize}
                                onIncreaseFontSize={handleIncreaseFontSize}
                                onDecreaseFontSize={handleDecreaseFontSize}
                            />
                        </motion.div>
                    )}

                    {activeTab === 'spacing' && (
                        <motion.div
                            key="spacing-panel"
                            initial={{ height: 0, opacity: 0, y: -10 }}
                            animate={{ height: 'auto', opacity: 1, y: 0 }}
                            exit={{ height: 0, opacity: 0, y: -10 }}
                            transition={{ duration: 0.18 }}
                            className="overflow-hidden mt-1"
                        >
                            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-card p-4 shadow-lg flex flex-col gap-3">
                                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    <Sliders size={14} className="text-primary" />
                                    <span>Spacing and Line Height</span>
                                </div>
                                <div className="flex bg-gray-50 dark:bg-gray-800 p-1 rounded-card justify-between gap-1 border border-gray-100 dark:border-gray-700">
                                    {spacingOptions.map((opt) => (
                                        <button
                                            key={opt.id}
                                            onClick={() => setSpacing(opt.id)}
                                            className={`flex-1 py-2 text-center rounded-card text-base-sm font-semibold transition-all ${
                                                spacing === opt.id
                                                    ? 'bg-primary text-white shadow-sm'
                                                    : 'text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'overlay' && (
                        <motion.div
                            key="overlay-panel"
                            initial={{ height: 0, opacity: 0, y: -10 }}
                            animate={{ height: 'auto', opacity: 1, y: 0 }}
                            exit={{ height: 0, opacity: 0, y: -10 }}
                            transition={{ duration: 0.18 }}
                            className="overflow-hidden mt-1"
                        >
                            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-card p-4 shadow-lg flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Subtle Overlay Tint
                                    </span>
                                    <button
                                        onClick={() => setOverlayOn(!overlayOn)}
                                        aria-label="Toggle Overlay Tint"
                                        className="text-primary focus:outline-none transition-colors"
                                    >
                                        {overlayOn ? (
                                            <ToggleRight size={38} className="text-primary" />
                                        ) : (
                                            <ToggleLeft size={38} className="text-gray-400" />
                                        )}
                                    </button>
                                </div>

                                {overlayOn && (
                                    <div className="flex flex-col gap-1.5 border-t border-gray-100 dark:border-gray-850 pt-2">
                                        <span className="text-[11px] font-bold text-gray-400">
                                            Select Tint Color
                                        </span>
                                        <div className="flex items-center gap-2 justify-between py-1">
                                            {swatches.map((sw) => {
                                                const isActive = overlayColor === sw.value;
                                                return (
                                                    <button
                                                        key={sw.value}
                                                        onClick={() => setOverlayColor(sw.value)}
                                                        title={sw.name}
                                                        className={`w-9 h-9 rounded-full ${sw.hexBg} relative transition-transform hover:scale-110 active:scale-95 flex items-center justify-center border ${
                                                            isActive
                                                                ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-gray-900 scale-105 border-primary'
                                                                : 'border-gray-200 dark:border-gray-700'
                                                        }`}
                                                    >
                                                        {isActive && (
                                                            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'more' && (
                        <motion.div
                            key="more-panel"
                            initial={{ height: 0, opacity: 0, y: -10 }}
                            animate={{ height: 'auto', opacity: 1, y: 0 }}
                            exit={{ height: 0, opacity: 0, y: -10 }}
                            transition={{ duration: 0.18 }}
                            className="overflow-hidden mt-1"
                        >
                            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-card p-4 shadow-lg text-left flex flex-col gap-2">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wide">
                                    <Info size={14} className="text-primary" />
                                    <span>Settings Shell</span>
                                </div>
                                <p className="text-xs text-gray-400 leading-normal">
                                    Additional accessibility settings such as visual rulers, speech voice filters, and baseline profiles will be structured here in future iterations.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Quick status alerts */}
            {statusMessage && (
                <div className="mx-4 mt-2 px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary text-xs rounded-card font-semibold text-center animate-pulse z-10">
                    {statusMessage}
                </div>
            )}

            {/* Central styled Reading Pane */}
            <div className="flex-1 px-4 py-2 overflow-hidden flex flex-col min-h-0">
                <ReadingPane
                    text={documentText}
                    words={words}
                    currentWordIndex={currentWordIndex}
                    onWordClick={handleWordClick}
                    fontFamily={fontFamily}
                    fontSize={fontSize}
                    spacing={spacing}
                    overlayOn={overlayOn}
                    overlayColor={overlayColor}
                />
            </div>

            {/* TTS Audio controls bar */}
            <div className="px-4 py-2 z-10">
                <PlaybackBar
                    isPlaying={isPlaying}
                    onPlayPause={handlePlayPauseToggle}
                    onStop={stop}
                    progress={progressPercent}
                    speed={speechRate}
                    onChangeSpeed={(rate) => setSpeechRate(rate)}
                />
            </div>

            {/* Bottom Scan entry bar */}
            <ScanBar
                onScan={handleScanDoc}
                onOcr={handleOcrProcess}
                onListen={handlePlayPauseToggle}
            />
        </div>
    );
}
