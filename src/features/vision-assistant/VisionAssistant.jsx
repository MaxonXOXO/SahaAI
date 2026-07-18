import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Square, Settings, Volume2, Sparkles, BookOpen, Map, History, Trash2, Check } from 'lucide-react';
import ScreenHeader from '../../shared/components/ScreenHeader';
import Card from '../../shared/components/Card';
import Button from '../../shared/components/Button';
import CameraCapture from './CameraCapture';
import ObjectDetectionPanel from './ObjectDetectionPanel';
import TextRecognitionPanel from './TextRecognitionPanel';
import AskAIBar from './AskAIBar';
import useSpeak from './useSpeak';
import useVisionAI from './useVisionAI';
import { renderMarkdown } from '../../shared/lib/parseMarkdown';
import { logActivity } from '../../shared/lib/logActivity';
import useProfileStore from '../../store/useProfileStore';

/**
 * VisionAssistant - Main container for Low Vision Mode
 * Orchestrates local high-contrast theme overrides, speech speed rate,
 * font scaling, AI camera capture, voice Q&A, and persistent scan history.
 */
export default function VisionAssistant() {
    const userId = useProfileStore((s) => s.id);
    // Accessibility Settings State
    const [contrastMode, setContrastMode] = useState(() => localStorage.getItem('saha_vision_contrast') || 'standard');
    const [fontScale, setFontScale] = useState(() => parseFloat(localStorage.getItem('saha_vision_font_scale')) || 1.0);
    const [speechRate, setSpeechRate] = useState(() => parseFloat(localStorage.getItem('saha_vision_speech_rate')) || 1.0);
    const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('saha_gemini_api_key') || '');

    // Deep-link tab support: /vision-assistant?tab=identify|read|describe
    const [searchParams] = useSearchParams();
    const TAB_PARAM_MAP = { identify: 'object', read: 'ocr', describe: 'scene' };
    const initialTab = TAB_PARAM_MAP[searchParams.get('tab')] || 'object';

    // Feature Mode State
    const [activeMode, setActiveMode] = useState(initialTab); // 'object' | 'ocr' | 'scene'
    const [capturedImage, setCapturedImage] = useState(null);
    const [analysisResult, setAnalysisResult] = useState('');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [scanHistory, setScanHistory] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('saha_vision_history')) || [];
        } catch {
            return [];
        }
    });

    // Custom Speech & AI Hooks
    const { speak, stop, pause, resume, speaking, paused, playBeep } = useSpeak();
    const { analyzeImage, loading, stripMarkdown } = useVisionAI();

    const speakFeedback = useCallback((text, onEnd = null) => {
        speak(text, speechRate, onEnd);
    }, [speak, speechRate]);

    const speakObjectResult = useCallback(() => {
        speak(stripMarkdown(analysisResult), speechRate);
    }, [speak, stripMarkdown, analysisResult, speechRate]);

    const speakOcrResult = useCallback(() => {
        speak(stripMarkdown(analysisResult), speechRate);
    }, [speak, stripMarkdown, analysisResult, speechRate]);

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

    // Processing audio/speech cues during AI loading gap
    useEffect(() => {
        let intervalId;
        if (loading) {
            // First speak a message
            speakFeedback("Analyzing, please wait.");
            
            // Then play a soft repeating tone so they know it is still processing
            intervalId = setInterval(() => {
                playBeep(660, 0.08);
            }, 1200);
        }
        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [loading, speakFeedback, playBeep]);

    // Initial greeting voice announcement
    const hasGreetedRef = useRef(false);
    useEffect(() => {
        if (!hasGreetedRef.current) {
            speak("Vision Assistant loaded. Use the top menu to customize high contrast and speed. Camera is ready.", speechRate);
            hasGreetedRef.current = true;
        }
        return () => stop();
    }, [speak, speechRate, stop]);


    // Mode changer
    const selectMode = (mode) => {
        playBeep(440, 0.08);
        setActiveMode(mode);
        setCapturedImage(null);
        setAnalysisResult('');
        stop();

        let announcement = '';
        if (mode === 'object') announcement = 'Object and Currency Detection active. Focus on an item and tap Capture.';
        if (mode === 'ocr') announcement = 'Text Recognition OCR active. Focus on pages or labels and tap Capture.';
        if (mode === 'scene') announcement = 'Scene Description active. Point camera at the room and tap Capture.';

        speak(announcement, speechRate);
    };

    // Frame Capture Handler
    const handleCapture = async (base64Image) => {
        setCapturedImage(base64Image);
        stop();

        try {
            const resultText = await analyzeImage(base64Image, activeMode);
            setAnalysisResult(resultText);

            // Add to scan history
            const newScan = {
                id: Date.now(),
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                mode: activeMode,
                result: resultText,
                image: base64Image,
            };
            setScanHistory((prev) => [newScan, ...prev.slice(0, 9)]); // Cap at 10 items

            // Activity logging — powers Dashboard "Recently Used" and Progress tab
            if (activeMode === 'ocr') {
                logActivity(userId, 'ocr_scan_used', { chars: resultText.length });
            } else {
                logActivity(userId, 'document_read', { mode: activeMode });
            }
        } catch (err) {
            console.error('[VisionAI] Vision analysis failure:', err);
            const msg = err?.message || '';
            if (msg.includes('401') || msg.includes('403')) {
                speak("API key rejected. Please check your Gemini key in Settings and make sure it is valid.", speechRate);
            } else if (msg.includes('404')) {
                speak("API model not found. The app configuration needs an update — please contact support.", speechRate);
            } else if (msg.includes('429')) {
                speak("Rate limit reached. Please wait a moment, then try again.", speechRate);
            } else {
                speak("Analysis failed. Please check your internet connection and try again.", speechRate);
            }
        }
    };

    // Custom voice question handler
    const handleAskAI = async (questionText) => {
        if (!capturedImage) {
            speak("Please capture an image first before asking questions.", speechRate);
            return;
        }

        stop();
        speak("Thinking, please wait.", speechRate);

        try {
            const resultText = await analyzeImage(capturedImage, 'qa', questionText);
            setAnalysisResult(resultText);
            speak(stripMarkdown(resultText), speechRate);
        } catch (err) {
            console.error('[VisionAI] Q&A analysis failure:', err);
            speak("Failed to answer. Please check your API key in Settings and try again.", speechRate);
        }
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
            speak("Settings menu opened. Adjust high contrast, sizes, speech speed, or add API Key.", speechRate);
        } else {
            speak("Settings closed.", speechRate);
        }
    };

    const handleSaveKey = (e) => {
        const val = e.target.value;
        setGeminiKey(val);
        localStorage.setItem('saha_gemini_api_key', val);
    };

    // Font scale is applied to the root container via CSS style.

    // Theme tokens based on active contrast mode
    const getThemeClasses = () => {
        if (contrastMode === 'high-dark') {
            return 'flex-1 flex flex-col h-full min-h-0 overflow-y-auto bg-black text-yellow-400 pb-24 selection:bg-yellow-400 selection:text-black';
        }
        if (contrastMode === 'high-light') {
            return 'flex-1 flex flex-col h-full min-h-0 overflow-y-auto bg-white text-black pb-24 selection:bg-black selection:text-white';
        }
        return 'flex-1 flex flex-col h-full min-h-0 overflow-y-auto bg-gray-50 text-gray-800 dark:bg-gray-950 dark:text-gray-100 pb-24';
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

    const getInputClasses = () => {
        if (contrastMode === 'high-dark') {
            return 'bg-black border-2 border-yellow-400 text-yellow-400 placeholder:text-yellow-700 rounded-card p-3 w-full outline-none';
        }
        if (contrastMode === 'high-light') {
            return 'bg-white border-2 border-black text-black placeholder:text-gray-400 rounded-card p-3 w-full outline-none';
        }
        return 'bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-card p-3 w-full outline-none';
    };

    return (
        <div className={getThemeClasses()} style={{ fontSize: `${fontScale}rem` }}>
            {/* Header with Settings Toggle */}
            <ScreenHeader
                title="Vision Assistant"
                showBack={true}
                rightAction={
                    <button
                        onClick={toggleSettings}
                        aria-label="Vision Assistant Settings"
                        className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                            contrastMode === 'high-dark'
                                ? 'border-yellow-400 bg-black text-yellow-400'
                                : contrastMode === 'high-light'
                                ? 'border-black bg-white text-black'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200'
                        }`}
                    >
                        <Settings size={22} className={isSettingsOpen ? 'animate-spin' : ''} />
                    </button>
                }
            />

            <div className="p-4 flex flex-col gap-6 max-w-[420px] mx-auto">
                {/* --- SETTINGS DRAWER OVERLAY --- */}
                {isSettingsOpen && (
                    <div className={`${getCardClasses()} border-primary`}>
                        <h2 className="text-base-lg font-bold mb-4 flex items-center gap-2">
                            <Settings size={22} />
                            Assistant Controls
                        </h2>

                        <div className="flex flex-col gap-4">
                            {/* Contrast Setting */}
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

                            {/* Text Scaling */}
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

                            {/* Speech Speed Rate */}
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

                            {/* Gemini API Key */}
                            <div className="flex flex-col gap-1.5">
                                <span className="text-base-sm font-bold">Gemini API Key</span>
                                <input
                                    type="password"
                                    placeholder="Enter your Gemini Key"
                                    value={geminiKey}
                                    onChange={handleSaveKey}
                                    className={getInputClasses()}
                                />
                                <p className="text-[12px] text-gray-400 mt-1">
                                    Enter key to use live vision descriptions. Key is stored securely on your browser.
                                </p>
                            </div>
                        </div>

                        <Button variant="secondary" className="w-full mt-4" onClick={toggleSettings}>
                            Close Settings
                        </Button>
                    </div>
                )}

                {/* --- MODE SELECTION TABS --- */}
                <div className="grid grid-cols-3 gap-2">
                    {[
                        { key: 'object', label: 'Identify', icon: Map },
                        { key: 'ocr', label: 'Read Text', icon: BookOpen },
                        { key: 'scene', label: 'Describe', icon: Sparkles },
                    ].map((mode) => {
                        const isSelected = activeMode === mode.key;
                        const Icon = mode.icon;
                        return (
                            <button
                                key={mode.key}
                                onClick={() => selectMode(mode.key)}
                                aria-label={`Select ${mode.label} mode`}
                                className={`flex flex-col items-center justify-center py-3 rounded-card border-2 font-bold text-base-sm transition-colors min-h-touch ${
                                    isSelected
                                        ? contrastMode === 'high-dark'
                                            ? 'border-yellow-400 bg-yellow-400/20 text-yellow-400'
                                            : contrastMode === 'high-light'
                                            ? 'border-black bg-black/10 text-black'
                                            : 'border-primary bg-primary/10 text-primary'
                                        : 'border-gray-200 dark:border-gray-800'
                                }`}
                            >
                                <Icon size={22} className="mb-1" />
                                {mode.label}
                            </button>
                        );
                    })}
                </div>

                {/* --- LIVE CAMERA COMPONENT --- */}
                <CameraCapture
                    onCapture={handleCapture}
                    isProcessing={loading}
                    speakFeedback={speakFeedback}
                    playBeep={playBeep}
                />

                {/* --- AI SCAN RESULTS DISPLAY --- */}
                {activeMode === 'object' && (
                    <ObjectDetectionPanel
                        result={analysisResult}
                        isSpeaking={speaking}
                        speakResult={speakObjectResult}
                        stopSpeaking={stop}
                        playBeep={playBeep}
                    />
                )}

                {activeMode === 'ocr' && (
                    <TextRecognitionPanel
                        result={analysisResult}
                        isSpeaking={speaking}
                        isPaused={paused}
                        speakResult={speakOcrResult}
                        stopSpeaking={stop}
                        pauseSpeaking={pause}
                        resumeSpeaking={resume}
                        playBeep={playBeep}
                    />
                )}

                {activeMode === 'scene' && analysisResult && (
                    <Card
                        title="Scene Description"
                        icon={Sparkles}
                        iconColor="bg-primary"
                        className="border-2 border-primary/20 bg-white dark:bg-gray-900"
                    >
                        <div className="flex justify-between items-center mb-4 mt-2">
                            <button
                                onClick={() => {
                                    if (speaking) {
                                        playBeep(300, 0.15);
                                        stop();
                                    } else {
                                        playBeep(440, 0.08);
                                        speak(stripMarkdown(analysisResult), speechRate);
                                    }
                                }}
                                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-card font-bold text-base-md min-h-touch transition-colors border-2 border-white focus:outline-none ${
                                    speaking
                                        ? 'bg-red-500 hover:bg-red-600 text-white'
                                        : 'bg-primary hover:bg-primary-dark text-white'
                                }`}
                                aria-label={speaking ? "Stop voice description of scene" : "Describe scene out loud"}
                            >
                                {speaking ? <Square size={20} /> : <Volume2 size={20} />}
                                {speaking ? 'Stop Speech' : 'Describe Scene'}
                            </button>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-card border border-gray-200 dark:border-gray-700">
                            <p className="text-base-md font-bold text-gray-800 dark:text-gray-100 leading-relaxed">
                                {renderMarkdown(analysisResult.replace(/\(Note: Simulator.*\)/g, '').trim())}
                            </p>
                        </div>
                        {analysisResult.includes('(Note: Simulator') && (
                            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-card">
                                <p className="text-base-sm text-yellow-700 dark:text-yellow-400 font-medium">
                                    {analysisResult.match(/\(Note: Simulator.*\)/)[0]}
                                </p>
                            </div>
                        )}
                    </Card>
                )}

                {/* --- QUESTION & ANSWER COMPONENT --- */}
                {capturedImage && (
                    <div className={getCardClasses()}>
                        <AskAIBar
                            onSubmit={handleAskAI}
                            isProcessing={loading}
                            speakFeedback={speakFeedback}
                            playBeep={playBeep}
                            stopSpeaking={stop}
                        />
                    </div>
                )}

                {/* --- RECENT SCANS / HISTORY --- */}
                {scanHistory.length > 0 && (
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <span className="text-base-md font-bold flex items-center gap-2">
                                <History size={20} className="text-primary" />
                                Recent Scans
                            </span>
                            <button
                                onClick={clearHistory}
                                aria-label="Clear all scan history"
                                className="flex items-center gap-1.5 text-base-sm text-red-500 hover:underline min-h-touch px-2"
                            >
                                <Trash2 size={16} />
                                Clear All
                            </button>
                        </div>

                        <div className="flex flex-col gap-3">
                            {scanHistory.map((scan) => (
                                <div
                                    key={scan.id}
                                    className={`${getCardClasses()} flex items-center gap-4 transition-all`}
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
                                        onClick={() => {
                                            playBeep(440, 0.08);
                                            speak(stripMarkdown(scan.result), speechRate);
                                        }}
                                        aria-label={`Play audio description for this ${scan.mode} scan`}
                                        className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20"
                                    >
                                        <Volume2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
