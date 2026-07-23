import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Square, Settings, Volume2, Sparkles, BookOpen, Map, History, Trash2, Check, Camera, MessageSquare, ArrowLeft, Banknote, Lightbulb, RotateCcw, X, Receipt, Wallet, MinusCircle, PlusCircle, Loader2 } from 'lucide-react';
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
import { useWalletStore } from './lib/useWalletStore';

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
    const [currencySession, setCurrencySession] = useState({ notes: [], total: 0, verifyTarget: null, price: null, amountGiven: null });
    const [isMoneyTipsOpen, setIsMoneyTipsOpen] = useState(false);
    const [isVerifyFormOpen, setIsVerifyFormOpen] = useState(false);
    const [verifyPrice, setVerifyPrice] = useState('');
    const [verifyAmountGiven, setVerifyAmountGiven] = useState('');
    const [verifyError, setVerifyError] = useState('');

    const moneyTipsBtnRef = useRef(null);
    const moneyTipsModalRef = useRef(null);
    const verifyBtnRef = useRef(null);
    const verifyModalRef = useRef(null);

    // Focus trap handler for modal overlays
    const handleTrapFocus = (e, modalRef) => {
        if (e.key !== 'Tab' || !modalRef.current) return;

        const focusableSelector = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
        const focusables = modalRef.current.querySelectorAll(focusableSelector);
        const focusableElements = Array.from(focusables).filter(
            (el) => el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (!focusableElements.includes(document.activeElement)) {
            e.preventDefault();
            if (e.shiftKey) {
                lastElement.focus();
            } else {
                firstElement.focus();
            }
            return;
        }

        if (e.shiftKey) {
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            }
        } else {
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    };

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

    // Focus management for Verify Change dialog
    useEffect(() => {
        if (isVerifyFormOpen && verifyModalRef.current) {
            verifyModalRef.current.focus();
        }
    }, [isVerifyFormOpen]);

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

    // Verify Change Handlers
    const openVerifyForm = () => {
        playBeep(440, 0.08);
        setVerifyPrice('');
        setVerifyAmountGiven('');
        setVerifyError('');
        setIsVerifyFormOpen(true);
    };

    const closeVerifyForm = () => {
        playBeep(350, 0.08);
        setIsVerifyFormOpen(false);
        setVerifyError('');
        setTimeout(() => {
            verifyBtnRef.current?.focus();
        }, 50);
    };

    const handleStartVerification = () => {
        playBeep(440, 0.08);
        setVerifyError('');

        const numPrice = parseFloat(verifyPrice);
        const numAmount = parseFloat(verifyAmountGiven);

        if (isNaN(numPrice) || numPrice <= 0 || isNaN(numAmount) || numAmount <= 0) {
            setVerifyError("Please enter valid positive numbers for price and amount given.");
            return;
        }

        if (numAmount < numPrice) {
            setVerifyError("That's less than the price — check the amounts.");
            return;
        }

        const expectedChange = numAmount - numPrice;
        const announcement = `Expected change: ₹${expectedChange}.`;
        speak(announcement, speechRate);

        setCurrencySession({
            notes: [],
            total: 0,
            verifyTarget: expectedChange,
            price: numPrice,
            amountGiven: numAmount,
        });

        setIsVerifyFormOpen(false);
    };

    const handleCancelVerifyTarget = () => {
        playBeep(350, 0.08);
        speak("Returned to normal currency counting.", speechRate);
        setCurrencySession((prev) => ({
            ...prev,
            verifyTarget: null,
            price: null,
            amountGiven: null,
        }));
    };

    // Wallet Store Selectors (Individual property selectors)
    const walletBalance = useWalletStore((s) => s.balance);
    const walletEntries = useWalletStore((s) => s.recentEntries);
    const walletLoading = useWalletStore((s) => s.isLoading);
    const walletError = useWalletStore((s) => s.error);
    const fetchWalletData = useWalletStore((s) => s.fetchWalletData);
    const addToBalance = useWalletStore((s) => s.addToBalance);
    const subtractFromBalance = useWalletStore((s) => s.subtractFromBalance);
    const removeHistoryEntry = useWalletStore((s) => s.removeHistoryEntry);

    // Wallet Tracker UI State
    const [pendingWalletAdd, setPendingWalletAdd] = useState(null); // { total, breakdownText }
    const [isSavingToWallet, setIsSavingToWallet] = useState(false);
    const [walletAddError, setWalletAddError] = useState(null);

    const [isWalletOpen, setIsWalletOpen] = useState(false);
    const [isSpendInputOpen, setIsSpendInputOpen] = useState(false);
    const [spendAmount, setSpendAmount] = useState('');
    const [spendNote, setSpendNote] = useState('');
    const [spendError, setSpendError] = useState(null);
    const [isSubmittingSpend, setIsSubmittingSpend] = useState(false);
    const [removingEntryId, setRemovingEntryId] = useState(null);

    const walletBtnRef = useRef(null);
    const walletModalRef = useRef(null);

    // Wallet Handlers
    const handleConfirmAddToWallet = async () => {
        if (!pendingWalletAdd) return;
        playBeep(440, 0.08);
        setIsSavingToWallet(true);
        setWalletAddError(null);

        const summaryNote = `Counted: ${pendingWalletAdd.breakdownText}`;
        const result = await addToBalance(userId, pendingWalletAdd.total, summaryNote);
        setIsSavingToWallet(false);

        if (result.success) {
            const newBal = useWalletStore.getState().balance;
            speak(`Added. Your wallet balance is now ₹${newBal}.`, speechRate);
            setPendingWalletAdd(null);
            setCurrencySession({ notes: [], total: 0, verifyTarget: null, price: null, amountGiven: null });
        } else {
            const errMsg = "Couldn't save that to your wallet — check your connection and try again";
            setWalletAddError(errMsg);
            speak(errMsg, speechRate);
        }
    };

    const handleDismissAddToWallet = () => {
        playBeep(350, 0.08);
        setPendingWalletAdd(null);
        setWalletAddError(null);
        setCurrencySession({ notes: [], total: 0, verifyTarget: null, price: null, amountGiven: null });
    };

    const openWalletPanel = () => {
        playBeep(440, 0.08);
        setIsWalletOpen(true);
        setIsSpendInputOpen(false);
        setSpendAmount('');
        setSpendNote('');
        setSpendError(null);
        fetchWalletData(userId);
    };

    const closeWalletPanel = () => {
        playBeep(350, 0.08);
        setIsWalletOpen(false);
        setIsSpendInputOpen(false);
        stop();
        setTimeout(() => {
            walletBtnRef.current?.focus();
        }, 50);
    };

    const prevWalletLoadingRef = useRef(false);
    useEffect(() => {
        if (isWalletOpen) {
            if (prevWalletLoadingRef.current && !walletLoading && !walletError) {
                speak(`Your wallet balance is ₹${walletBalance}.`, speechRate);
            }
            prevWalletLoadingRef.current = walletLoading;
        }
    }, [isWalletOpen, walletLoading, walletError, walletBalance, speak, speechRate]);

    useEffect(() => {
        if (isWalletOpen && walletModalRef.current) {
            walletModalRef.current.focus();
        }
    }, [isWalletOpen]);

    const handleConfirmSpend = async () => {
        playBeep(440, 0.08);
        setSpendError(null);

        const numAmount = parseFloat(spendAmount);
        if (isNaN(numAmount) || numAmount <= 0) {
            const err = "Please enter a valid positive amount.";
            setSpendError(err);
            speak(err, speechRate);
            return;
        }

        setIsSubmittingSpend(true);
        const noteText = spendNote.trim() || 'Spent money';

        const result = await subtractFromBalance(userId, numAmount, noteText);
        setIsSubmittingSpend(false);

        if (result.success) {
            const newBal = useWalletStore.getState().balance;
            if (result.wasCapped) {
                speak(`You only had ₹${result.available}, so that's what was subtracted. Your wallet balance is now ₹${newBal}.`, speechRate);
            } else {
                speak(`Subtracted. Your wallet balance is now ₹${newBal}.`, speechRate);
            }
            setIsSpendInputOpen(false);
            setSpendAmount('');
            setSpendNote('');
        } else {
            const err = "Couldn't save that to your wallet — check your connection and try again";
            setSpendError(err);
            speak(err, speechRate);
        }
    };

    const handleRemoveEntry = async (entryId) => {
        playBeep(350, 0.08);
        setRemovingEntryId(null);
        const result = await removeHistoryEntry(userId, entryId);
        if (result.success) {
            speak("Entry removed from wallet.", speechRate);
        } else {
            speak("Couldn't remove entry — check your connection and try again.", speechRate);
        }
    };

    // Currency Session Controls
    const handleFinishCurrencySession = () => {
        playBeep(520, 0.08);
        const breakdownText = formatCurrencyBreakdown(currencySession.notes);
        const counted = currencySession.total;

        if (currencySession.verifyTarget !== null) {
            const expected = currencySession.verifyTarget;
            const diff = Math.abs(counted - expected);

            let verdictText = '';
            if (counted === expected) {
                verdictText = `Correct! You received exactly ₹${counted} change, as expected.`;
            } else if (counted < expected) {
                verdictText = `You should have received ₹${expected} but counted ₹${counted} — that's ₹${diff} less. You may want to ask for a recount.`;
            } else {
                verdictText = `You counted ₹${counted}, which is ₹${diff} more than the expected ₹${expected}. You may want to double check.`;
            }

            const fullResultText = `${verdictText} ${breakdownText}`;
            speak(fullResultText, speechRate);

            const newScan = {
                id: Date.now(),
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                mode: 'currency-verify',
                result: fullResultText,
                price: currencySession.price,
                amountGiven: currencySession.amountGiven,
                expectedChange: expected,
                counted: counted,
                verdict: verdictText,
                image: capturedImage || reviewScan?.image || null,
            };
            setScanHistory((prev) => [newScan, ...prev.slice(0, 9)]);
            setCurrencySession({ notes: [], total: 0, verifyTarget: null, price: null, amountGiven: null });
        } else {
            speak(breakdownText, speechRate);

            const newScan = {
                id: Date.now(),
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                mode: 'currency',
                result: breakdownText,
                image: capturedImage || reviewScan?.image || null,
            };
            setScanHistory((prev) => [newScan, ...prev.slice(0, 9)]);

            if (counted > 0) {
                setPendingWalletAdd({ total: counted, breakdownText });
            } else {
                setCurrencySession({ notes: [], total: 0, verifyTarget: null, price: null, amountGiven: null });
            }
        }
    };

    const handleUndoLastNote = () => {
        playBeep(350, 0.08);
        setCurrencySession((prev) => {
            if (prev.notes.length === 0) return prev;
            const updatedNotes = prev.notes.slice(0, -1);
            const updatedTotal = updatedNotes.reduce((sum, n) => sum + n.denomination, 0);
            speak(`Removed. Total is now ${updatedTotal}.`, speechRate);
            return { ...prev, notes: updatedNotes, total: updatedTotal };
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
        try {
            localStorage.setItem('saha_vision_contrast', contrastMode);
        } catch (e) {
            console.warn('[VisionAssistant] Failed to save contrast setting:', e);
        }
    }, [contrastMode]);

    useEffect(() => {
        try {
            localStorage.setItem('saha_vision_font_scale', fontScale.toString());
        } catch (e) {
            console.warn('[VisionAssistant] Failed to save font scale setting:', e);
        }
    }, [fontScale]);

    useEffect(() => {
        try {
            localStorage.setItem('saha_vision_speech_rate', speechRate.toString());
        } catch (e) {
            console.warn('[VisionAssistant] Failed to save speech rate setting:', e);
        }
    }, [speechRate]);

    useEffect(() => {
        try {
            localStorage.setItem('saha_vision_history', JSON.stringify(scanHistory));
        } catch (err) {
            console.warn('[VisionAssistant] Quota exceeded or error saving scan history, degrading gracefully:', err);
            try {
                const fallbackHistory = scanHistory.map((item, idx) => {
                    if (idx < 2) return item;
                    return { ...item, image: null };
                });
                localStorage.setItem('saha_vision_history', JSON.stringify(fallbackHistory));
            } catch (retryErr) {
                console.warn('[VisionAssistant] Failed to persist scan history after stripping thumbnails:', retryErr);
            }
        }
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
            setCurrencySession({ notes: [], total: 0, verifyTarget: null, price: null, amountGiven: null });
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
                        if (prev.verifyTarget !== null) {
                            speak(`${prefix}${denomination} rupees. Total: ${updatedTotal} of ${prev.verifyTarget} expected.`, speechRate);
                        } else {
                            speak(`${prefix}${denomination} rupees. Total: ${updatedTotal}.`, speechRate);
                        }
                        return { ...prev, notes: updatedNotes, total: updatedTotal };
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

    const isAnyModalOpen = isWalletOpen || isMoneyTipsOpen || isVerifyFormOpen;

    return (
        <div className={getThemeClasses()} style={{ fontSize: `${fontScale}rem` }}>
            {/* Main background container hidden from accessibility tree when any modal is open */}
            <div
                inert={isAnyModalOpen ? true : undefined}
                aria-hidden={isAnyModalOpen ? 'true' : undefined}
                className="flex-1 flex flex-col min-h-0"
            >
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
                    {/* --- MODE SELECTION TABS (SEGMENTED PILL CONTAINER) --- */}
                    <div className="flex items-center p-1 bg-gray-100 dark:bg-gray-800/80 rounded-2xl shrink-0 gap-1 w-full border border-gray-200/50 dark:border-gray-700/50">
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
                                    className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs transition-all min-h-touch ${
                                        isSelected
                                            ? contrastMode === 'high-dark'
                                                ? 'bg-yellow-400 text-black font-black shadow-sm'
                                                : contrastMode === 'high-light'
                                                ? 'bg-black text-white font-black shadow-sm'
                                                : 'bg-white dark:bg-gray-900 text-primary dark:text-primary-light font-bold shadow-sm'
                                            : contrastMode === 'high-dark'
                                            ? 'bg-transparent text-yellow-400 font-bold hover:bg-yellow-400/10'
                                            : contrastMode === 'high-light'
                                            ? 'bg-transparent text-black font-bold hover:bg-black/10'
                                            : 'bg-transparent text-gray-600 dark:text-gray-400 font-medium hover:text-gray-900 dark:hover:text-gray-100'
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
                                    {currencySession.verifyTarget !== null
                                        ? `Total: ₹${currencySession.total} of ₹${currencySession.verifyTarget} expected · ${currencySession.notes.length} note${currencySession.notes.length !== 1 ? 's' : ''}`
                                        : `Total: ₹${currencySession.total} · ${currencySession.notes.length} note${currencySession.notes.length !== 1 ? 's' : ''}`}
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
                    {(effectiveMode === 'currency' || effectiveMode === 'currency-verify') && (reviewScan || currencySession.notes.length > 0) && (
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
                            {currencySession.verifyTarget !== null && (
                                <div className="flex items-center justify-between p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold">
                                    <span>Target: ₹{currencySession.verifyTarget} (Price: ₹{currencySession.price}, Gave: ₹{currencySession.amountGiven})</span>
                                    <button
                                        onClick={handleCancelVerifyTarget}
                                        className="text-[11px] underline font-bold px-1 py-0.5 text-gray-600 dark:text-gray-300 hover:text-red-500"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}

                            <div className="flex items-center justify-between gap-1 flex-wrap">
                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                    {currencySession.verifyTarget !== null
                                        ? `Total: ₹${currencySession.total} of ₹${currencySession.verifyTarget} expected`
                                        : `Session: ₹${currencySession.total} (${currencySession.notes.length} item${currencySession.notes.length !== 1 ? 's' : ''})`}
                                </span>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <button
                                        ref={walletBtnRef}
                                        onClick={openWalletPanel}
                                        aria-label="Open Wallet Tracker"
                                        className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs border border-emerald-500/30 transition-colors"
                                    >
                                        <Wallet size={14} />
                                        💰 Wallet
                                    </button>
                                    <button
                                        ref={verifyBtnRef}
                                        onClick={openVerifyForm}
                                        aria-label="Verify change amount"
                                        className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-xs border border-blue-500/30 transition-colors"
                                    >
                                        <Receipt size={14} />
                                        🧾 Verify Change
                                    </button>
                                    <button
                                        ref={moneyTipsBtnRef}
                                        onClick={openMoneyTips}
                                        aria-label="Open Money Tips and Fold Guide"
                                        className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs border border-amber-500/30 transition-colors"
                                    >
                                        <Lightbulb size={14} />
                                        💡 Money Tips
                                    </button>
                                </div>
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

                    {/* --- WALLET ADD CONFIRMATION STEP (AFTER COUNTING DONE) --- */}
                    {pendingWalletAdd && (
                        <div className="p-3 bg-emerald-500/10 border-2 border-emerald-500/40 rounded-card shadow-md flex flex-col gap-2 shrink-0 my-1" role="dialog" aria-label="Wallet add confirmation">
                            <p className="text-base-sm font-bold text-gray-800 dark:text-gray-100">
                                Add ₹{pendingWalletAdd.total} to your Wallet balance?
                            </p>

                            {walletAddError && (
                                <p className="text-xs font-bold text-red-500 dark:text-red-400" role="alert">
                                    {walletAddError}
                                </p>
                            )}

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleConfirmAddToWallet}
                                    disabled={isSavingToWallet}
                                    className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold text-xs shadow-md transition-colors min-h-touch flex items-center justify-center gap-2"
                                >
                                    {isSavingToWallet ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Saving…
                                        </>
                                    ) : (
                                        'Yes'
                                    )}
                                </button>
                                <button
                                    onClick={handleDismissAddToWallet}
                                    disabled={isSavingToWallet}
                                    className="flex-1 py-2.5 px-3 rounded-xl bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold text-xs transition-colors min-h-touch"
                                >
                                    No
                                </button>
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

            {/* --- VERIFY CHANGE ENTRY STEP MODAL --- */}
            {isVerifyFormOpen && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="verify-change-title"
                    onKeyDown={(e) => handleTrapFocus(e, verifyModalRef)}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
                >
                    <div
                        ref={verifyModalRef}
                        tabIndex={-1}
                        className={`${getCardClasses()} border-amber-500 max-w-[420px] w-full shadow-2xl outline-none flex flex-col gap-4 p-5`}
                    >
                        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
                            <h2 id="verify-change-title" className="text-base-lg font-bold flex items-center gap-2 text-amber-500">
                                <Receipt size={22} />
                                Verify Change
                            </h2>
                            <button
                                onClick={closeVerifyForm}
                                aria-label="Close Verify Change form"
                                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex flex-col gap-3">
                            <div className="flex flex-col gap-1">
                                <label htmlFor="verify-price" className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                    Price of item (₹)
                                </label>
                                <input
                                    id="verify-price"
                                    type="number"
                                    min="0"
                                    step="any"
                                    placeholder="e.g. 320"
                                    value={verifyPrice}
                                    onChange={(e) => setVerifyPrice(e.target.value)}
                                    className="w-full px-4 py-3 rounded-card bg-gray-50 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 font-bold text-base-md text-gray-800 dark:text-gray-100 focus:outline-none focus:border-amber-500 min-h-touch"
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label htmlFor="verify-amount-given" className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                    Amount you gave (₹)
                                </label>
                                <input
                                    id="verify-amount-given"
                                    type="number"
                                    min="0"
                                    step="any"
                                    placeholder="e.g. 500"
                                    value={verifyAmountGiven}
                                    onChange={(e) => setVerifyAmountGiven(e.target.value)}
                                    className="w-full px-4 py-3 rounded-card bg-gray-50 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 font-bold text-base-md text-gray-800 dark:text-gray-100 focus:outline-none focus:border-amber-500 min-h-touch"
                                />
                            </div>

                            {verifyError && (
                                <p className="text-xs font-bold text-red-500 dark:text-red-400 p-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900" role="alert">
                                    {verifyError}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                            <button
                                onClick={closeVerifyForm}
                                className="flex-1 py-3 px-4 rounded-card bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold text-base-sm min-h-touch transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleStartVerification}
                                className="flex-1 py-3 px-4 rounded-card bg-amber-500 hover:bg-amber-600 text-white font-bold text-base-sm min-h-touch shadow-md transition-colors"
                            >
                                Start counting
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MONEY TIPS MODAL / SHEET --- */}
            {isMoneyTipsOpen && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="money-tips-title"
                    onKeyDown={(e) => handleTrapFocus(e, moneyTipsModalRef)}
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

            {/* --- WALLET PANEL MODAL --- */}
            {isWalletOpen && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="wallet-panel-title"
                    onKeyDown={(e) => handleTrapFocus(e, walletModalRef)}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
                >
                    <div
                        ref={walletModalRef}
                        tabIndex={-1}
                        className={`${getCardClasses()} border-emerald-500 max-w-[420px] w-full max-h-[90vh] overflow-y-auto shadow-2xl outline-none flex flex-col gap-4 p-5`}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
                            <h2 id="wallet-panel-title" className="text-base-lg font-bold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                <Wallet size={22} />
                                Wallet Tracker
                            </h2>
                            <button
                                onClick={closeWalletPanel}
                                aria-label="Close Wallet panel"
                                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Loading State */}
                        {walletLoading && walletEntries.length === 0 ? (
                            <div className="py-8 flex flex-col items-center justify-center gap-2 text-gray-500">
                                <Loader2 size={32} className="animate-spin text-emerald-500" />
                                <p className="text-base-sm font-semibold">Loading your wallet…</p>
                            </div>
                        ) : walletError ? (
                            /* Error State */
                            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 flex flex-col items-center gap-3 text-center">
                                <p className="text-xs font-bold text-red-600 dark:text-red-400 leading-relaxed">
                                    {walletError}
                                </p>
                                <button
                                    onClick={() => fetchWalletData(userId)}
                                    className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition-colors"
                                >
                                    Retry
                                </button>
                            </div>
                        ) : (
                            /* Main Wallet Content */
                            <>
                                {/* Balance Header */}
                                <div className="p-4 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 flex flex-col items-center justify-center text-center gap-1">
                                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                                        Current Balance
                                    </span>
                                    <span className="text-3xl font-black text-gray-800 dark:text-gray-100 tracking-tight" aria-live="polite">
                                        Your wallet: ₹{walletBalance}
                                    </span>
                                </div>

                                {/* Spend Money Toggle Button & Form */}
                                {!isSpendInputOpen ? (
                                    <button
                                        onClick={() => {
                                            playBeep(440, 0.08);
                                            setSpendAmount('');
                                            setSpendNote('');
                                            setSpendError(null);
                                            setIsSpendInputOpen(true);
                                        }}
                                        className="w-full py-3 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold text-base-sm flex items-center justify-center gap-2 transition-colors min-h-touch"
                                    >
                                        <MinusCircle size={18} />
                                        − I spent money
                                    </button>
                                ) : (
                                    <div className="p-4 rounded-xl bg-gray-100 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 flex flex-col gap-3">
                                        <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                                            Record Spending
                                        </h3>
                                        <div className="flex flex-col gap-1">
                                            <label htmlFor="spend-amount" className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                                                How much did you spend? (₹)
                                            </label>
                                            <input
                                                id="spend-amount"
                                                type="number"
                                                min="0"
                                                step="any"
                                                placeholder="e.g. 50"
                                                value={spendAmount}
                                                onChange={(e) => setSpendAmount(e.target.value)}
                                                className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 font-bold text-base-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:border-amber-500 min-h-touch"
                                            />
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            <label htmlFor="spend-note" className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                                                What for? (optional)
                                            </label>
                                            <input
                                                id="spend-note"
                                                type="text"
                                                placeholder="e.g. lunch"
                                                value={spendNote}
                                                onChange={(e) => setSpendNote(e.target.value)}
                                                className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 font-bold text-base-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:border-amber-500 min-h-touch"
                                            />
                                        </div>

                                        {spendError && (
                                            <p className="text-xs font-bold text-red-500 dark:text-red-400" role="alert">
                                                {spendError}
                                            </p>
                                        )}

                                        <div className="flex items-center gap-2 mt-1">
                                            <button
                                                onClick={() => setIsSpendInputOpen(false)}
                                                disabled={isSubmittingSpend}
                                                className="flex-1 py-2.5 rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 text-gray-800 dark:text-gray-200 font-bold text-xs min-h-touch"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleConfirmSpend}
                                                disabled={isSubmittingSpend}
                                                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs min-h-touch flex items-center justify-center gap-1.5 shadow-sm"
                                            >
                                                {isSubmittingSpend ? <Loader2 size={16} className="animate-spin" /> : 'Confirm'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Recent Entries List */}
                                <div className="flex flex-col gap-2 pt-2 border-t border-gray-200 dark:border-gray-800">
                                    <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        Recent Wallet Activity ({walletEntries.length})
                                    </h3>

                                    {walletEntries.length === 0 ? (
                                        <p className="text-xs text-gray-400 py-4 text-center">
                                            No wallet activity recorded yet.
                                        </p>
                                    ) : (
                                        <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                                            {walletEntries.map((entry) => {
                                                const isPositive = Number(entry.amount) > 0;
                                                const absAmt = Math.abs(Number(entry.amount));
                                                const isRemoving = removingEntryId === entry.id;

                                                return (
                                                    <div
                                                        key={entry.id}
                                                        className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 flex items-center justify-between gap-2"
                                                    >
                                                        <div className="flex flex-col min-w-0 flex-1">
                                                            <div className="flex items-center gap-1.5 font-bold text-xs">
                                                                <span className={isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}>
                                                                    {isPositive ? '+' : '−'} ₹{absAmt}
                                                                </span>
                                                                <span className="text-gray-600 dark:text-gray-300 truncate font-semibold">
                                                                    — {entry.note || (isPositive ? 'Added money' : 'Spent money')}
                                                                </span>
                                                            </div>
                                                            {entry.created_at && (
                                                                <span className="text-[10px] text-gray-400">
                                                                    {new Date(entry.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Delete path */}
                                                        {isRemoving ? (
                                                            <div className="flex items-center gap-1 shrink-0">
                                                                <span className="text-[10px] font-bold text-gray-500">Remove?</span>
                                                                <button
                                                                    onClick={() => handleRemoveEntry(entry.id)}
                                                                    className="px-2 py-1 rounded bg-red-500 text-white font-bold text-[11px]"
                                                                >
                                                                    Yes
                                                                </button>
                                                                <button
                                                                    onClick={() => setRemovingEntryId(null)}
                                                                    className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-[11px]"
                                                                >
                                                                    No
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => setRemovingEntryId(entry.id)}
                                                                aria-label={`Remove wallet entry for ${isPositive ? '+' : '-'}${absAmt} rupees`}
                                                                className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-gray-200 dark:hover:bg-gray-700 shrink-0 transition-colors"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                <Button variant="secondary" className="w-full mt-2" onClick={closeWalletPanel}>
                                    Close Wallet
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
