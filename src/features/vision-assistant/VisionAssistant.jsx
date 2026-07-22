import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Square, Settings, Volume2, Sparkles, BookOpen, Map, History, Trash2, Check, Camera, MessageSquare, ArrowLeft, Banknote, Lightbulb, RotateCcw, X } from 'lucide-react';
import ScreenHeader from '../../shared/components/ScreenHeader';
import Button from '../../shared/components/Button';
import CameraCapture from './CameraCapture';
import AskAIBar from './AskAIBar';
import TextRecognitionPanel from './TextRecognitionPanel';
import useSpeak from './useSpeak';
import useVisionAI from './useVisionAI';
import { renderMarkdown } from '../../shared/lib/parseMarkdown';
import { logActivity } from '../../shared/lib/logActivity';
import useProfileStore from '../../store/useProfileStore';
import { FOLD_GUIDE, GENERAL_TIPS } from './lib/currencyTips';

/**
 * VisionAssistant - Main container for Low Vision Mode
 * Orchestrates local high-contrast theme overrides, speech speed rate,
 * font scaling, AI camera capture, voice Q&A, live YouTube-style subtitles,
 * persistent scan history, and scan review mode.
 */
export default function VisionAssistant() {
    const userId = useProfileStore((s) => s.id);
    // Accessibility Settings State
    const [contrastMode, setContrastMode] = useState(() => localStorage.getItem('saha_vision_contrast') || 'standard');
    const [fontScale, setFontScale] = useState(() => parseFloat(localStorage.getItem('saha_vision_font_scale')) || 1.0);
    const [speechRate, setSpeechRate] = useState(() => parseFloat(localStorage.getItem('saha_vision_speech_rate')) || 1.0);

    // Helper to format grouped breakdown sentence for Currency mode
    const formatCurrencyBreakdown = (notes) => {
        if (!notes || notes.length === 0) {
            return 'No notes counted. Total: 0 rupees.';
        }

        const counts = {};
        for (const note of notes) {
            const denom = note.denomination;
            counts[denom] = (counts[denom] || 0) + 1;
        }

        const denoms = Object.keys(counts).map(Number).sort((a, b) => b - a);

        const NUMBER_WORDS = {
            1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five',
            6: 'six', 7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten',
        };
        const numToWord = (n) => NUMBER_WORDS[n] || String(n);

        const parts = denoms.map((d) => {
            const cnt = counts[d];
            if (cnt === 1) {
                return `one ${d}`;
            }
            return `${numToWord(cnt)} ${d}s`;
        });

        const totalNotes = notes.length;
        const totalAmount = notes.reduce((sum, n) => sum + n.denomination, 0);

        const noteWord = totalNotes === 1 ? 'note' : 'notes';
        const notesCountStr = `${numToWord(totalNotes)} ${noteWord}`;
        const capitalizedNotesCount = notesCountStr.charAt(0).toUpperCase() + notesCountStr.slice(1);

        return `${capitalizedNotesCount}: ${parts.join(', ')}. Total: ${totalAmount} rupees.`;
    };

    // Deep-link tab support: /vision-assistant?tab=identify|read|describe|currency
    const [searchParams] = useSearchParams();
    const TAB_PARAM_MAP = { identify: 'object', read: 'ocr', describe: 'scene', currency: 'currency' };
    const initialTab = TAB_PARAM_MAP[searchParams.get('tab')] || 'object';

    // Feature Mode & View State
    const [activeMode, setActiveMode] = useState(initialTab); // 'object' | 'ocr' | 'scene' | 'currency'
    const [capturedImage, setCapturedImage] = useState(null);
    const [analysisResult, setAnalysisResult] = useState('');
    const [currentSubtitle, setCurrentSubtitle] = useState('');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showAskBar, setShowAskBar] = useState(false);
    const [reviewScan, setReviewScan] = useState(null);
    const [currencySession, setCurrencySession] = useState({ notes: [], total: 0 });
    const [isMoneyTipsOpen, setIsMoneyTipsOpen] = useState(false);
    const moneyTipsBtnRef = useRef(null);
    const moneyTipsModalRef = useRef(null);

    const [scanHistory, setScanHistory] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('saha_vision_history')) || [];
        } catch {
            return [];
        }
    });

    // Custom Speech & AI Hooks
    const resultRef = useRef(null);
    const cameraContainerRef = useRef(null);
    const { speak, stop, speaking, playBeep } = useSpeak();
    const { analyzeImage, loading, stripMarkdown } = useVisionAI();

    // Focus management for Money Tips dialog
    useEffect(() => {
        if (isMoneyTipsOpen && moneyTipsModalRef.current) {
            moneyTipsModalRef.current.focus();
        }
    }, [isMoneyTipsOpen]);

    const openMoneyTips = () => {
        playBeep(440, 0.08);
        setIsMoneyTipsOpen(true);
    };

    const closeMoneyTips = () => {
        playBeep(350, 0.08);
        setIsMoneyTipsOpen(false);
        stop();
        setTimeout(() => {
            moneyTipsBtnRef.current?.focus();
        }, 50);
    };

    // Currency Session Controls
    const handleFinishCurrencySession = () => {
        playBeep(520, 0.08);
        const breakdownText = formatCurrencyBreakdown(currencySession.notes);
        speak(breakdownText, speechRate);

        const newScan = {
            id: Date.now(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            mode: 'currency',
            result: breakdownText,
            image: capturedImage || reviewScan?.image || null,
        };
        setScanHistory((prev) => [newScan, ...prev.slice(0, 9)]);
        setCurrencySession({ notes: [], total: 0 });
    };

    const handleUndoLastNote = () => {
        playBeep(350, 0.08);
        setCurrencySession((prev) => {
            if (prev.notes.length === 0) return prev;
            const updatedNotes = prev.notes.slice(0, -1);
            const updatedTotal = updatedNotes.reduce((sum, n) => sum + n.denomination, 0);
            speak(`Removed. Total is now ${updatedTotal}.`, speechRate);
            return { notes: updatedNotes, total: updatedTotal };
        });
    };

    // Automatically shift screen reader focus to new results
    useEffect(() => {
        if (analysisResult && resultRef.current) {
            resultRef.current.focus();
        }
    }, [analysisResult]);

    const speakFeedback = useCallback((text, onEnd = null) => {
        speak(text, speechRate, onEnd);
    }, [speak, speechRate]);

    const handleStopSpeaking = useCallback(() => {
        stop();
        setCurrentSubtitle('');
    }, [stop]);

    // Persist accessibility configurations
    useEffect(() => {
        localStorage.setItem('saha_vision_contrast', contrastMode);
    }, [contrastMode]);

    useEffect(() => {
        localStorage.setItem('saha_vision_font_scale', fontScale.toString());
    }, [fontScale]);

    useEffect(() => {
        localStorage.setItem('saha_vision_speech_rate', speechRate.toString());
    }, [speechRate]);

    useEffect(() => {
        localStorage.setItem('saha_vision_history', JSON.stringify(scanHistory));
    }, [scanHistory]);

    // Initial greeting voice announcement
    const hasGreetedRef = useRef(false);
    useEffect(() => {
        if (!hasGreetedRef.current) {
            speak("Vision Assistant loaded. Use the top menu to customize high contrast and speed. Camera is ready.", speechRate);
            hasGreetedRef.current = true;
        }
        return () => handleStopSpeaking();
    }, [speak, speechRate, handleStopSpeaking]);

    // Mode changer
    const selectMode = (mode) => {
        playBeep(440, 0.08);
        if (reviewScan) {
            setReviewScan(null);
        }
        setActiveMode(mode);
        setCapturedImage(null);
        setAnalysisResult('');
        setCurrentSubtitle('');
        setShowAskBar(false);
        stop();

        if (mode === 'currency') {
            setCurrencySession({ notes: [], total: 0 });
        }

        let announcement = '';
        if (mode === 'object') announcement = 'Object Detection active. Focus on an item and tap Capture.';
        if (mode === 'ocr') announcement = 'Text Recognition OCR active. Focus on pages or labels and tap Capture.';
        if (mode === 'scene') announcement = 'Scene Description active. Point camera at the room and tap Capture.';
        if (mode === 'currency') announcement = 'Currency Detection active. Focus on a note or coin and tap Capture.';

        speak(announcement, speechRate);
    };

    // Effective mode & caption gating: captions are ONLY for Identify (object) & Describe (scene) modes
    const effectiveMode = reviewScan ? reviewScan.mode : activeMode;
    const isCaptionMode = effectiveMode === 'object' || effectiveMode === 'scene';

    // Review Mode Handlers
    const handleOpenReview = (scan) => {
        playBeep(520, 0.08);
        setReviewScan(scan);
        setShowHistory(false);
        setAnalysisResult(scan.result);
        setShowAskBar(false);
        stop();

        const isScanCaption = scan.mode === 'object' || scan.mode === 'scene';
        const msg = `Reviewing scan from ${scan.timestamp}`;
        speak(msg, speechRate, () => {
            speak(stripMarkdown(scan.result), speechRate, null, isScanCaption ? setCurrentSubtitle : null);
        }, isScanCaption ? setCurrentSubtitle : null);
    };

    const handleExitReview = () => {
        playBeep(440, 0.08);
        setReviewScan(null);
        setAnalysisResult('');
        setCurrentSubtitle('');
        setShowAskBar(false);
        stop();
        speak("Back to camera", speechRate);
    };

    // Frame Capture Handler
    const handleCapture = async (base64Image) => {
        setCapturedImage(base64Image);
        stop();
        if (isCaptionMode) {
            setCurrentSubtitle("Analyzing image, please wait...");
        }

        try {
            const resultText = await analyzeImage(base64Image, activeMode);
            setAnalysisResult(resultText);

            if (activeMode === 'currency') {
                let json = null;
                try {
                    const cleanJsonText = resultText
                        .replace(/```json/gi, '')
                        .replace(/```/g, '')
                        .trim();
                    json = JSON.parse(cleanJsonText);
                } catch (e) {
                    json = { status: 'unclear', reason: 'invalid response format' };
                }

                if (json.status === 'ok') {
                    const denomination = typeof json.denomination === 'number' ? json.denomination : parseInt(json.denomination, 10) || 0;
                    const confidence = json.confidence === 'medium' ? 'medium' : 'high';

                    setCurrencySession((prev) => {
                        const updatedNotes = [...prev.notes, { denomination, confidence }];
                        const updatedTotal = prev.total + denomination;
                        const prefix = confidence === 'medium' ? 'I think this is ' : '';
                        speak(`${prefix}${denomination} rupees. Total: ${updatedTotal}.`, speechRate);
                        return { notes: updatedNotes, total: updatedTotal };
                    });
                } else if (json.status === 'unclear') {
                    const reason = json.reason || 'unclear image';
                    speak(`Couldn't read that clearly — ${reason}. Try again.`, speechRate);
                } else {
                    speak('No money detected in frame.', speechRate);
                }
            } else {
                // Add to scan history
                const newScan = {
                    id: Date.now(),
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    mode: activeMode,
                    result: resultText,
                    image: base64Image,
                };
                setScanHistory((prev) => [newScan, ...prev.slice(0, 9)]); // Cap at 10 items

                // Activity logging
                if (activeMode === 'ocr') {
                    logActivity(userId, 'ocr_scan_used', { chars: resultText.length });
                } else {
                    logActivity(userId, 'document_read', { mode: activeMode });
                }

                // Speak result (driving captions ONLY if in Identify or Describe mode)
                speak(stripMarkdown(resultText), speechRate, null, isCaptionMode ? setCurrentSubtitle : null);
            }
        } catch (err) {
            console.error('[VisionAI] Vision analysis failure:', err);
            setCurrentSubtitle('');
            speak("Analysis failed. Please check your internet connection and try again.", speechRate);
        }
    };

    // Custom voice question handler
    const handleAskAI = async (questionText) => {
        const targetImage = reviewScan ? reviewScan.image : capturedImage;

        if (!targetImage) {
            speak("Please capture an image first before asking questions.", speechRate);
            return;
        }

        stop();
        if (isCaptionMode) {
            setCurrentSubtitle("Thinking, please wait...");
        }

        try {
            const resultText = await analyzeImage(targetImage, 'qa', questionText);
            setAnalysisResult(resultText);

            // Update scan history entry if answering in review mode
            if (reviewScan) {
                setReviewScan((prev) => (prev ? { ...prev, result: resultText } : null));
                setScanHistory((prevHistory) =>
                    prevHistory.map((s) => (s.id === reviewScan.id ? { ...s, result: resultText } : s))
                );
            }

            speak(stripMarkdown(resultText), speechRate, null, isCaptionMode ? setCurrentSubtitle : null);
        } catch (err) {
            console.error('[VisionAI] Q&A analysis failure:', err);
            setCurrentSubtitle('');
            speak("Failed to answer. Please check your API key in Settings and try again.", speechRate);
        }
    };

    const triggerCapture = () => {
        if (loading || reviewScan) return;
        const btn = cameraContainerRef.current?.querySelector('button[data-capture-btn="true"], button[class*="min-h-touch"], button:has(svg.lucide-camera)');
        if (btn) {
            btn.click();
        }
    };

    const handleAskClick = () => {
        playBeep(440, 0.08);
        const targetImage = reviewScan ? reviewScan.image : capturedImage;
        if (!targetImage) {
            speak("Please capture an image first before asking questions.", speechRate);
            return;
        }
        setShowAskBar((prev) => !prev);
    };

    const clearHistory = () => {
        playBeep(330, 0.15);
        setScanHistory([]);
        speak("Scan history cleared.", speechRate);
    };

    const toggleSettings = () => {
        playBeep(580, 0.08);
        setIsSettingsOpen((prev) => !prev);
        if (!isSettingsOpen) {
            speak("Settings menu opened. Adjust high contrast, sizes, or speech speed.", speechRate);
        } else {
            speak("Back to camera", speechRate);
        }
    };

    // Theme tokens based on active contrast mode
    const getThemeClasses = () => {
        const base = 'flex-1 flex flex-col h-[calc(100dvh-5rem)] min-h-[calc(100vh-5rem)] pb-20 selection:bg-yellow-400 selection:text-black overflow-y-auto';
        if (contrastMode === 'high-dark') {
            return `${base} bg-black text-yellow-400`;
        }
        if (contrastMode === 'high-light') {
            return `${base} bg-white text-black`;
        }
        return `${base} bg-gray-50 text-gray-800 dark:bg-gray-950 dark:text-gray-100`;
    };

    const getCardClasses = () => {
        if (contrastMode === 'high-dark') {
            return 'bg-black border-2 border-yellow-400 text-yellow-400 rounded-card p-4 shadow-none';
        }
        if (contrastMode === 'high-light') {
            return 'bg-white border-2 border-black text-black rounded-card p-4 shadow-none';
        }
        return 'bg-surface dark:bg-surface-dark border border-gray-200 dark:border-gray-800 rounded-card p-4 shadow-sm';
    };

    // Full Screen Scan History View
    if (showHistory) {
        return (
            <div className={getThemeClasses()} style={{ fontSize: `${fontScale}rem` }}>
                <ScreenHeader
                    title="Recent Scans"
                    showBack={true}
                    onBack={() => setShowHistory(false)}
                />
                <div className="p-4 flex flex-col gap-4 max-w-[420px] mx-auto">
                    {scanHistory.length === 0 ? (
                        <div className="text-center py-12">
                            <History size={48} className="text-gray-400 mx-auto mb-3" />
                            <p className="text-base-md font-bold text-gray-700 dark:text-gray-300">
                                No Recent Scans
                            </p>
                            <p className="text-base-sm text-gray-400 mt-1">
                                Scanned items and scene descriptions will appear here.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-base-md font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                    <History size={20} className="text-primary" />
                                    <span>History ({scanHistory.length})</span>
                                </span>
                                <button
                                    onClick={clearHistory}
                                    aria-label="Clear all scan history"
                                    className="flex items-center gap-1.5 text-base-sm text-red-500 hover:underline min-h-touch px-2 font-bold"
                                >
                                    <Trash2 size={16} />
                                    Clear All
                                </button>
                            </div>

                            <div className="flex flex-col gap-3">
                                {scanHistory.map((scan) => (
                                    <div
                                        key={scan.id}
                                        onClick={() => handleOpenReview(scan)}
                                        className={`${getCardClasses()} flex items-center gap-4 transition-all cursor-pointer hover:border-primary/50`}
                                    >
                                        {scan.image && (
                                            <img
                                                src={scan.image}
                                                alt="Scan Snapshot Thumbnail"
                                                className="w-14 h-14 object-cover rounded-md border border-gray-300 dark:border-gray-700"
                                            />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <span className="text-[12px] font-bold text-primary uppercase">
                                                    {scan.mode} Mode
                                                </span>
                                                <span className="text-[11px] text-gray-400">{scan.timestamp}</span>
                                            </div>
                                            <p className="text-base-sm font-semibold truncate text-gray-800 dark:text-gray-200">
                                                {renderMarkdown(scan.result.replace(/\(Note: Simulator.*\)/g, '').trim())}
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                playBeep(440, 0.08);
                                                const isScanCaption = scan.mode === 'object' || scan.mode === 'scene';
                                                speak(stripMarkdown(scan.result), speechRate, null, isScanCaption ? setCurrentSubtitle : null);
                                            }}
                                            aria-label={`Play audio description for this ${scan.mode} scan`}
                                            className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20"
                                        >
                                            <Volume2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={getThemeClasses()} style={{ fontSize: `${fontScale}rem` }}>
            <ScreenHeader
                title={reviewScan ? "Reviewing Scan" : "Vision Assistant"}
                showBack={true}
                onBack={reviewScan ? handleExitReview : undefined}
                rightAction={
                    <button
                        onClick={toggleSettings}
                        aria-label="Vision Assistant Settings"
                        className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                            contrastMode === 'high-dark'
                                ? 'border-yellow-400 bg-black text-yellow-400'
                                : contrastMode === 'high-light'
                                ? 'border-black bg-white text-black'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:bg-gray-200'
                        }`}
                    >
                        <Settings size={22} className={isSettingsOpen ? 'animate-spin' : ''} />
                    </button>
                }
            />

            <div className="flex-1 flex flex-col min-h-0 p-2 gap-2 max-w-[420px] w-full mx-auto">
                {/* --- SETTINGS DRAWER OVERLAY MODAL --- */}
                {isSettingsOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
                        <div className={`${getCardClasses()} border-primary max-w-[420px] w-full max-h-[90vh] overflow-y-auto shadow-2xl`}>
                            <h2 className="text-base-lg font-bold mb-4 flex items-center gap-2">
                                <Settings size={22} />
                                Assistant Controls
                            </h2>

                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col gap-2">
                                    <span className="text-base-sm font-bold">Contrast Mode</span>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { key: 'standard', label: 'Standard' },
                                            { key: 'high-dark', label: 'Yellow/Black' },
                                            { key: 'high-light', label: 'Black/White' },
                                        ].map((mode) => (
                                            <button
                                                key={mode.key}
                                                onClick={() => {
                                                    playBeep(440, 0.05);
                                                    setContrastMode(mode.key);
                                                }}
                                                aria-label={`Set contrast mode to ${mode.label}`}
                                                className={`py-2 px-1 rounded-card text-base-sm font-bold border-2 transition-colors flex items-center justify-center gap-1 ${
                                                    contrastMode === mode.key
                                                        ? 'border-primary bg-primary/10 text-primary'
                                                        : 'border-gray-300 dark:border-gray-700'
                                                }`}
                                            >
                                                {contrastMode === mode.key && <Check size={14} />}
                                                {mode.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <span className="text-base-sm font-bold">Text Zoom Multiplier</span>
                                    <div className="grid grid-cols-4 gap-2">
                                        {[1.0, 1.25, 1.5, 2.0].map((scale) => (
                                            <button
                                                key={scale}
                                                onClick={() => {
                                                    playBeep(500, 0.05);
                                                    setFontScale(scale);
                                                }}
                                                aria-label={`Set text zoom to ${scale}x`}
                                                className={`py-2 rounded-card text-base-sm font-bold border-2 transition-colors ${
                                                    fontScale === scale
                                                        ? 'border-primary bg-primary/10 text-primary'
                                                        : 'border-gray-300 dark:border-gray-700'
                                                }`}
                                            >
                                                {scale}x
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <span className="text-base-sm font-bold">Speech Rate Speed</span>
                                    <div className="grid grid-cols-4 gap-2">
                                        {[0.8, 1.0, 1.2, 1.5].map((rate) => (
                                            <button
                                                key={rate}
                                                onClick={() => {
                                                    playBeep(550, 0.05);
                                                    setSpeechRate(rate);
                                                }}
                                                aria-label={`Set speech rate speed to ${rate}x`}
                                                className={`py-2 rounded-card text-base-sm font-bold border-2 transition-colors ${
                                                    speechRate === rate
                                                        ? 'border-primary bg-primary/10 text-primary'
                                                        : 'border-gray-300 dark:border-gray-700'
                                                }`}
                                            >
                                                {rate}x
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <Button variant="secondary" className="w-full mt-4" onClick={toggleSettings}>
                                Close Settings
                            </Button>
                        </div>
                    </div>
                )}

                {/* --- MODE SELECTION TABS (FIXED HEIGHT) --- */}
                <div className="grid grid-cols-4 gap-1.5 shrink-0">
                    {[
                        { key: 'object', label: 'Identify', icon: Map },
                        { key: 'ocr', label: 'Read Text', icon: BookOpen },
                        { key: 'scene', label: 'Describe', icon: Sparkles },
                        { key: 'currency', label: 'Currency', icon: Banknote },
                    ].map((mode) => {
                        const isSelected = activeMode === mode.key;
                        const Icon = mode.icon;
                        return (
                            <button
                                key={mode.key}
                                onClick={() => selectMode(mode.key)}
                                aria-label={`Select ${mode.label} mode`}
                                className={`flex flex-col items-center justify-center py-2 px-1 rounded-card border-2 font-bold text-xs transition-colors min-h-touch ${
                                    isSelected
                                        ? contrastMode === 'high-dark'
                                            ? 'border-yellow-400 bg-yellow-400/20 text-yellow-400'
                                            : contrastMode === 'high-light'
                                            ? 'border-black bg-white/10 text-black'
                                            : 'border-primary bg-primary/10 text-primary'
                                        : 'border-gray-200 dark:border-gray-800'
                                }`}
                            >
                                <Icon size={18} className="mb-0.5" />
                                <span className="truncate max-w-full">{mode.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* --- CAMERA & CAPTION OVERLAY CONTAINER (EXPLICIT VIEWPORT HEIGHT) --- */}
                <div ref={cameraContainerRef} className="relative h-[48dvh] min-h-[300px] w-full rounded-card overflow-hidden border-4 border-gray-800 dark:border-gray-900 shadow-lg bg-black">
                    {reviewScan ? (
                        <img
                            src={reviewScan.image}
                            alt={`Reviewing scan from ${reviewScan.timestamp}`}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <CameraCapture
                            onCapture={handleCapture}
                            isProcessing={loading}
                            speakFeedback={speakFeedback}
                            playBeep={playBeep}
                        />
                    )}

                    {/* CURRENCY MODE OVERLAY ON CAMERA */}
                    {effectiveMode === 'currency' && !reviewScan && (
                        <div
                            aria-live="polite"
                            className="absolute top-3 left-3 right-3 z-20 flex flex-col items-center justify-center p-3 rounded-2xl bg-black/80 backdrop-blur-md text-white border border-amber-400/50 shadow-2xl pointer-events-none text-center"
                        >
                            <span className="text-2xl sm:text-3xl font-black text-amber-300 tracking-tight">
                                {currencySession.notes.length > 0
                                    ? `₹${currencySession.notes[currencySession.notes.length - 1].denomination}`
                                    : '₹0'}
                            </span>
                            <span className="text-xs sm:text-base-sm font-bold text-slate-300 mt-0.5">
                                Total: ₹{currencySession.total} · {currencySession.notes.length} note{currencySession.notes.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                    )}

                    {/* YOUTUBE-STYLE LIVE SUBTITLE CAPTION STRIP */}
                    {/* Read Text = text panel, Identify/Describe = captions — do not remove this gate */}
                    {isCaptionMode && (speaking || loading || currentSubtitle) && (
                        <div className="absolute bottom-2 left-2 right-2 z-20 flex justify-center pointer-events-none">
                            <div aria-live="polite" className="bg-black/75 backdrop-blur-sm text-white text-base-md font-semibold px-4 py-2 rounded-lg text-center max-w-[95%] shadow-lg border border-white/15 line-clamp-2 overflow-hidden leading-snug">
                                {renderMarkdown(currentSubtitle || (loading ? "Analyzing image, please wait..." : ""))}
                            </div>
                        </div>
                    )}
                </div>

                {/* --- READ TEXT OCR RESULT PANEL --- */}
                {effectiveMode === 'ocr' && (analysisResult || (reviewScan && reviewScan.result)) && (
                    <div className="shrink-0 my-2">
                        <TextRecognitionPanel
                            result={analysisResult || (reviewScan ? reviewScan.result : '')}
                            isSpeaking={speaking}
                            speakResult={() => speak(stripMarkdown(analysisResult || (reviewScan ? reviewScan.result : '')), speechRate, null, null)}
                            playBeep={playBeep}
                            resultRef={resultRef}
                        />
                    </div>
                )}

                {/* --- CURRENCY BREAKDOWN RESULT PANEL --- */}
                {effectiveMode === 'currency' && (reviewScan || currencySession.notes.length > 0) && (
                    <div className="shrink-0 my-2">
                        <div className={`${getCardClasses()} border-2 border-amber-500/30 p-4 rounded-card flex flex-col gap-2`}>
                            <div className="flex items-center gap-2 text-amber-500 font-bold text-base-md">
                                <Banknote size={20} />
                                <span>Currency Breakdown</span>
                            </div>
                            <p className="text-base-md font-semibold text-gray-800 dark:text-gray-100 leading-relaxed">
                                {reviewScan ? reviewScan.result : formatCurrencyBreakdown(currencySession.notes)}
                            </p>
                        </div>
                    </div>
                )}

                {/* --- CURRENCY MODE SESSION CONTROLS --- */}
                {activeMode === 'currency' && !reviewScan && (
                    <div className="bg-surface dark:bg-surface-dark border-2 border-amber-500/40 rounded-card p-3 shadow-md flex flex-col gap-2 shrink-0 my-1">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                Session: ₹{currencySession.total} ({currencySession.notes.length} item{currencySession.notes.length !== 1 ? 's' : ''})
                            </span>
                            <button
                                ref={moneyTipsBtnRef}
                                onClick={openMoneyTips}
                                aria-label="Open Money Tips and Fold Guide"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs border border-amber-500/30 transition-colors"
                            >
                                <Lightbulb size={16} />
                                💡 Money Tips
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            {currencySession.notes.length >= 1 && (
                                <button
                                    onClick={handleUndoLastNote}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold text-xs transition-colors"
                                >
                                    <RotateCcw size={16} />
                                    ↩ Undo last
                                </button>
                            )}
                            <button
                                onClick={handleFinishCurrencySession}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-colors"
                            >
                                <Check size={16} />
                                ✓ Done
                            </button>
                        </div>
                    </div>
                )}

                {/* --- MONEY TIPS MODAL / SHEET --- */}
                {isMoneyTipsOpen && (
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="money-tips-title"
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
                    >
                        <div
                            ref={moneyTipsModalRef}
                            tabIndex={-1}
                            className={`${getCardClasses()} border-amber-500 max-w-[420px] w-full max-h-[90vh] overflow-y-auto shadow-2xl outline-none flex flex-col gap-4 p-5`}
                        >
                            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
                                <h2 id="money-tips-title" className="text-base-lg font-bold flex items-center gap-2 text-amber-500">
                                    <Lightbulb size={22} />
                                    Money Tips & Fold Guide
                                </h2>
                                <button
                                    onClick={closeMoneyTips}
                                    aria-label="Close Money Tips"
                                    className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Read Aloud Button */}
                            <button
                                onClick={() => {
                                    playBeep(440, 0.08);
                                    const foldText = FOLD_GUIDE.map((g) => `${g.denomination} rupees: ${g.tip}`).join('. ');
                                    const generalText = GENERAL_TIPS.join('. ');
                                    speak(`Money Tips and Tactile Folding Guide. Tactile Folding Guide: ${foldText}. General Tips: ${generalText}`, speechRate);
                                }}
                                className="w-full py-3 px-4 rounded-card bg-amber-500 hover:bg-amber-600 text-white font-bold text-base-md flex items-center justify-center gap-2 shadow-md transition-colors min-h-touch"
                                aria-label="Read all money tips and folding guide out loud"
                            >
                                <Volume2 size={20} />
                                🔊 Read aloud
                            </button>

                            {/* Fold Guide Section */}
                            <div className="flex flex-col gap-2">
                                <h3 className="text-base-sm font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider">
                                    Tactile Folding Guide (INR)
                                </h3>
                                <div className="grid grid-cols-1 gap-2">
                                    {FOLD_GUIDE.map((item) => (
                                        <div
                                            key={item.denomination}
                                            className="p-3 rounded-xl bg-gray-100 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 flex items-start gap-3"
                                        >
                                            <span className="font-black text-amber-500 text-base-sm min-w-[50px] shrink-0">
                                                ₹{item.denomination}
                                            </span>
                                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 leading-snug">
                                                {item.tip}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* General Tips Section */}
                            <div className="flex flex-col gap-2 pt-2 border-t border-gray-200 dark:border-gray-800">
                                <h3 className="text-base-sm font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider">
                                    General Tips
                                </h3>
                                <ul className="flex flex-col gap-2">
                                    {GENERAL_TIPS.map((tip, idx) => (
                                        <li
                                            key={idx}
                                            className="text-xs font-medium text-gray-600 dark:text-gray-300 flex items-start gap-2 leading-relaxed"
                                        >
                                            <span className="text-amber-500 font-bold select-none">•</span>
                                            <span>{tip}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <Button variant="secondary" className="w-full mt-2" onClick={closeMoneyTips}>
                                Close
                            </Button>
                        </div>
                    </div>
                )}

                {/* --- ASK AI OVERLAY BAR (SHRINK-0) --- */}
                {showAskBar && (capturedImage || reviewScan) && (
                    <div className="p-3 bg-surface dark:bg-surface-dark border-2 border-primary rounded-card shadow-lg shrink-0">
                        <AskAIBar
                            onSubmit={handleAskAI}
                            isProcessing={loading}
                            speakFeedback={speakFeedback}
                            playBeep={playBeep}
                            stopSpeaking={handleStopSpeaking}
                        />
                    </div>
                )}

                {/* --- ACTION BUTTON ROW --- */}
                {reviewScan ? (
                    <div className="flex items-center justify-around gap-2 pt-1 pb-1 shrink-0">
                        {/* BACK TO CAMERA BUTTON */}
                        <button
                            onClick={handleExitReview}
                            aria-label="Return to live camera mode"
                            className="w-16 h-16 rounded-full bg-gray-700 hover:bg-gray-800 active:scale-95 text-white flex flex-col items-center justify-center font-bold text-xs shadow-md transition-all border-2 border-white focus:outline-none"
                        >
                            <ArrowLeft size={22} />
                            <span>Back</span>
                        </button>

                        {/* ASK BUTTON FOR THIS REVIEW IMAGE */}
                        <button
                            onClick={handleAskClick}
                            aria-label="Ask AI question about this reviewed photo"
                            className="w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white flex flex-col items-center justify-center font-bold text-xs shadow-md transition-all border-2 border-white focus:outline-none"
                        >
                            <MessageSquare size={22} />
                            <span>Ask</span>
                        </button>

                        {/* REPEAT RESULT BUTTON */}
                        <button
                            onClick={() => {
                                playBeep(440, 0.08);
                                speak(stripMarkdown(analysisResult || reviewScan.result), speechRate, null, isCaptionMode ? setCurrentSubtitle : null);
                            }}
                            aria-label="Replay audio description for this scan"
                            className="w-16 h-16 rounded-full bg-primary hover:bg-primary-dark active:scale-95 text-white flex flex-col items-center justify-center font-bold text-xs shadow-md transition-all border-2 border-white focus:outline-none"
                        >
                            <Volume2 size={22} />
                            <span>Repeat</span>
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center justify-between gap-2 pt-1 pb-1 shrink-0">
                        {/* STOP BUTTON */}
                        <button
                            onClick={() => {
                                playBeep(300, 0.1);
                                handleStopSpeaking();
                            }}
                            aria-label="Stop audio output"
                            className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 active:scale-95 text-white flex flex-col items-center justify-center font-bold text-[11px] shadow-md transition-all border-2 border-white focus:outline-none"
                        >
                            <Square size={18} />
                            <span>Stop</span>
                        </button>

                        {/* ASK BUTTON */}
                        <button
                            onClick={handleAskClick}
                            aria-label="Ask AI question about photo"
                            className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white flex flex-col items-center justify-center font-bold text-[11px] shadow-md transition-all border-2 border-white focus:outline-none"
                        >
                            <MessageSquare size={18} />
                            <span>Ask</span>
                        </button>

                        {/* CAPTURE BUTTON (VISUALLY LARGEST & MOST PROMINENT) */}
                        <button
                            onClick={triggerCapture}
                            disabled={loading}
                            aria-label="Capture image and analyze"
                            className="w-20 h-20 rounded-full bg-primary hover:bg-primary-dark disabled:bg-gray-400 active:scale-95 text-white flex flex-col items-center justify-center font-bold text-xs shadow-xl transition-all border-4 border-white dark:border-gray-800 focus:outline-none focus:ring-4 focus:ring-primary/50"
                        >
                            <Camera size={28} />
                            <span>Capture</span>
                        </button>

                        {/* RECENTS BUTTON */}
                        <button
                            onClick={() => {
                                playBeep(440, 0.08);
                                setShowHistory(true);
                            }}
                            aria-label="View recent scans history"
                            className="w-14 h-14 rounded-full bg-gray-700 hover:bg-gray-800 active:scale-95 text-white flex flex-col items-center justify-center font-bold text-[11px] shadow-md transition-all border-2 border-white focus:outline-none"
                        >
                            <History size={18} />
                            <span>Recents</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
