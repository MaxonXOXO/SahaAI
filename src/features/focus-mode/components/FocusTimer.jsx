import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, ShieldAlert, Coffee, Flame, Volume2, VolumeX } from 'lucide-react';
import useFocusStore from '../useFocusStore';
import useTone from '../lib/useTone';
import RevealTimer from './RevealTimer';

/**
 * FocusTimer - High contrast, low-distraction circular or picture reveal timer for ADHD Focus Sessions.
 * Features derived drift-proof countdown, ring fill progress, picture reveal mode, 2.5s celebration overlay,
 * ascending arpeggio tones, time-blindness cues, "Just 5 min" preset, and daily session counters.
 */
export default function FocusTimer({ onSessionComplete, onDistractionBlocked }) {
    // Individual primitive selectors from useFocusStore
    const mode = useFocusStore((s) => s.mode);
    const durationMinutes = useFocusStore((s) => s.durationMinutes);
    const endTime = useFocusStore((s) => s.endTime);
    const pausedSecondsLeft = useFocusStore((s) => s.pausedSecondsLeft);
    const isRunning = useFocusStore((s) => s.isRunning);
    const distractionCount = useFocusStore((s) => s.distractionCount);
    const soundEnabled = useFocusStore((s) => s.soundEnabled);
    const currentStepTitle = useFocusStore((s) => s.currentStepTitle);
    const lastSessionDate = useFocusStore((s) => s.lastSessionDate);
    const rawSessionsToday = useFocusStore((s) => s.sessionsToday);

    // Timer Style & Reveal selectors
    const timerStyle = useFocusStore((s) => s.timerStyle);
    const revealSeed = useFocusStore((s) => s.revealSeed);

    const startTimer = useFocusStore((s) => s.startTimer);
    const pauseTimer = useFocusStore((s) => s.pauseTimer);
    const resumeTimer = useFocusStore((s) => s.resumeTimer);
    const resetTimer = useFocusStore((s) => s.resetTimer);
    const finishSession = useFocusStore((s) => s.finishSession);
    const recordSessionCompletion = useFocusStore((s) => s.recordSessionCompletion);
    const setMode = useFocusStore((s) => s.setMode);
    const setTimerStyle = useFocusStore((s) => s.setTimerStyle);
    const logDistraction = useFocusStore((s) => s.logDistraction);
    const toggleSound = useFocusStore((s) => s.toggleSound);

    const { playTone, playSequence } = useTone(soundEnabled);

    const [distractionNotice, setDistractionNotice] = useState(false);
    const [celebrationMsg, setCelebrationMsg] = useState(null);
    const [now, setNow] = useState(Date.now());

    const completedRef = useRef(false);
    const halfwayFiredRef = useRef(false);
    const fiveMinFiredRef = useRef(false);

    // Calculate actual sessions today
    const todayStr = new Date().toISOString().split('T')[0];
    const sessionsToday = lastSessionDate === todayStr ? rawSessionsToday : 0;

    // Mount check: if session expired while page was closed, clear running state without calling completion callback
    useEffect(() => {
        if (isRunning && endTime && endTime <= Date.now()) {
            finishSession();
        }
    }, []); // Run once on mount

    // 1-second interval used ONLY for re-rendering to update derived secondsLeft
    useEffect(() => {
        if (!isRunning) return;

        setNow(Date.now());
        const interval = setInterval(() => {
            setNow(Date.now());
        }, 1000);

        return () => clearInterval(interval);
    }, [isRunning]);

    // Derive remaining seconds dynamically from store state
    let secondsLeft = durationMinutes * 60;
    if (isRunning && endTime) {
        secondsLeft = Math.max(0, Math.round((endTime - now) / 1000));
    } else if (pausedSecondsLeft !== null && pausedSecondsLeft !== undefined) {
        secondsLeft = pausedSecondsLeft;
    } else {
        secondsLeft = durationMinutes * 60;
    }

    // Time-blindness cues for sessions > 10 minutes
    useEffect(() => {
        if (!isRunning || durationMinutes <= 10) return;

        const totalSecs = durationMinutes * 60;
        const halfwaySecs = Math.floor(totalSecs / 2);

        // Halfway point cue
        if (secondsLeft <= halfwaySecs && !halfwayFiredRef.current) {
            halfwayFiredRef.current = true;
            playTone(440, 0.2, 'sine', 0.08); // soft low-volume tone
        }

        // 5-minutes-left point cue
        if (secondsLeft <= 300 && !fiveMinFiredRef.current) {
            fiveMinFiredRef.current = true;
            playTone(587, 0.2, 'sine', 0.08); // soft low-volume tone
        }
    }, [secondsLeft, isRunning, durationMinutes, playTone]);

    // Session completion effect
    useEffect(() => {
        if (isRunning && secondsLeft === 0) {
            if (!completedRef.current) {
                completedRef.current = true;

                // Record daily streak and session count
                recordSessionCompletion(mode === 'focus');

                // Play 3-note ascending arpeggio
                playSequence([
                    { freq: 523, duration: 0.15, delay: 0 },
                    { freq: 659, duration: 0.15, delay: 0.12 },
                    { freq: 784, duration: 0.25, delay: 0.24 },
                ]);

                const msg = mode === 'focus'
                    ? (currentStepTitle ? `🎉 ${currentStepTitle} done — ${durationMinutes} minutes focused!` : `🎉 ${durationMinutes} minutes focused!`)
                    : `☕ Break's over — ready to focus?`;

                setCelebrationMsg(msg);
                finishSession();

                setTimeout(() => {
                    setCelebrationMsg(null);
                    if (onSessionComplete) {
                        onSessionComplete({
                            minutes: durationMinutes,
                            mode,
                            distractionCount,
                            stepTitle: currentStepTitle,
                        });
                    }
                }, 2500);
            }
        } else {
            completedRef.current = false;
        }
    }, [isRunning, secondsLeft, durationMinutes, mode, distractionCount, currentStepTitle, onSessionComplete, playSequence, finishSession, recordSessionCompletion]);

    // Switch timer modes (Focus vs Short Break)
    const handleSetMode = (newMode, mins) => {
        playTone(520, 0.08);
        halfwayFiredRef.current = false;
        fiveMinFiredRef.current = false;
        setMode(newMode, mins);
    };

    const toggleStartPause = () => {
        if (!isRunning) {
            playTone(660, 0.1);
            halfwayFiredRef.current = false;
            fiveMinFiredRef.current = false;
            if (pausedSecondsLeft !== null) {
                resumeTimer();
            } else {
                startTimer(mode, durationMinutes, currentStepTitle);
            }
        } else {
            playTone(330, 0.1);
            pauseTimer();
        }
    };

    const handleReset = () => {
        playTone(300, 0.1);
        halfwayFiredRef.current = false;
        fiveMinFiredRef.current = false;
        resetTimer();
    };

    const handleBlockDistraction = () => {
        playTone(750, 0.12, 'square');
        logDistraction();
        setDistractionNotice(true);
        if (onDistractionBlocked) {
            onDistractionBlocked(distractionCount + 1);
        }
        setTimeout(() => setDistractionNotice(false), 2500);
    };

    // Formatting for display (MM:SS)
    const displayMins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
    const displaySecs = String(secondsLeft % 60).padStart(2, '0');

    // Progress math
    const totalSeconds = durationMinutes * 60;
    const progressFraction = celebrationMsg ? 1 : (totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 0);

    // Circle SVG Math (ring fills up from empty to full)
    const radius = 90;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * (1 - progressFraction);

    const isFocus = mode === 'focus';
    const accentColorClass = isFocus ? 'text-red-500' : 'text-emerald-500';
    const strokeColor = celebrationMsg ? '#10B981' : (isFocus ? '#EF4444' : '#10B981');

    return (
        <div className="flex flex-col items-center gap-5 w-full max-w-sm mx-auto">
            {/* Timer View Switcher (Classic vs Picture Reveal) */}
            <div className="flex items-center p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl w-full max-w-xs text-xs font-bold">
                <button
                    type="button"
                    onClick={() => setTimerStyle('classic')}
                    className={`flex-1 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                        timerStyle === 'classic'
                            ? 'bg-white dark:bg-gray-700 text-purple-700 dark:text-purple-300 shadow-xs border border-purple-200 dark:border-purple-800'
                            : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'
                    }`}
                >
                    ⏱️ Classic
                </button>
                <button
                    type="button"
                    onClick={() => setTimerStyle('reveal')}
                    className={`flex-1 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                        timerStyle === 'reveal'
                            ? 'bg-white dark:bg-gray-700 text-purple-700 dark:text-purple-300 shadow-xs border border-purple-200 dark:border-purple-800'
                            : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'
                    }`}
                >
                    🖼️ Picture Reveal
                </button>
            </div>

            {/* Mode Selectors */}
            <div className="flex items-center p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl w-full">
                <button
                    onClick={() => handleSetMode('focus', 25)}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${isFocus
                            ? 'bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 shadow-sm border border-red-200 dark:border-red-800'
                            : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'
                        }`}
                >
                    <Flame size={16} />
                    Focus (25m)
                </button>
                <button
                    onClick={() => handleSetMode('break', 5)}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${!isFocus
                            ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm border border-emerald-200 dark:border-emerald-800'
                            : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'
                        }`}
                >
                    <Coffee size={16} />
                    Short Break (5m)
                </button>
            </div>

            {/* Duration Presets for Focus */}
            {isFocus && (
                <div className="flex flex-wrap justify-center gap-2">
                    {[5, 15, 25, 45].map((mins) => (
                        <button
                            key={mins}
                            onClick={() => handleSetMode('focus', mins)}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${durationMinutes === mins
                                    ? 'bg-red-500 text-white shadow-xs'
                                    : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
                                }`}
                        >
                            {mins === 5 ? '🌱 Just 5 min' : `${mins} min`}
                        </button>
                    ))}
                </div>
            )}

            {/* Timer Visual: Reveal View (Focus Mode + Reveal Style) vs Classic View */}
            {timerStyle === 'reveal' && isFocus ? (
                <RevealTimer
                    progressFraction={progressFraction}
                    revealSeed={revealSeed}
                    displayMins={displayMins}
                    displaySecs={displaySecs}
                    celebrationMsg={celebrationMsg}
                    isRunning={isRunning}
                />
            ) : (
                /* Circular Timer Visual (Classic) */
                <div className="relative w-64 h-64 flex items-center justify-center my-2">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                        {/* Background track circle */}
                        <circle
                            cx="100"
                            cy="100"
                            r={radius}
                            className="stroke-gray-200 dark:stroke-gray-800"
                            strokeWidth="12"
                            fill="transparent"
                        />
                        {/* Active progress stroke */}
                        <circle
                            cx="100"
                            cy="100"
                            r={radius}
                            stroke={strokeColor}
                            strokeWidth="12"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            fill="transparent"
                            className="transition-all duration-500 ease-linear"
                        />
                    </svg>

                    {/* Inner Content overlay */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                        {celebrationMsg ? (
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 rounded-2xl border border-emerald-300 dark:border-emerald-700 shadow-md animate-pulse">
                                <p className="text-xs font-black leading-snug">{celebrationMsg}</p>
                            </div>
                        ) : (
                            <>
                                <span className={`text-4xl font-black tracking-tight font-mono ${accentColorClass}`}>
                                    {displayMins}:{displaySecs}
                                </span>
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                                    {isRunning ? (isFocus ? '🔥 In Deep Focus' : '☕ Relaxing Break') : 'Paused'}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Active Step Badge directly below circular / reveal timer visual */}
            {isFocus && currentStepTitle && !celebrationMsg && (
                <div className="w-full max-w-xs p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 text-center -mt-2 mb-1">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                        Focusing on:
                    </span>
                    <span className="block text-xs font-bold text-purple-950 dark:text-purple-100 line-clamp-2 leading-tight">
                        {currentStepTitle}
                    </span>
                </div>
            )}

            {/* Sessions Today Counter Badge */}
            {sessionsToday >= 1 && (
                <div className="text-xs font-bold text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/30 px-3 py-1 rounded-full border border-purple-200 dark:border-purple-800 text-center -mt-1">
                    ✨ {sessionsToday} focus session{sessionsToday > 1 ? 's' : ''} today
                </div>
            )}

            {/* Primary Action Controls — Explicit Icon + Text for ADHD low cognitive load */}
            <div className="flex flex-col gap-3 w-full max-w-xs">
                <div className="flex items-center gap-3 w-full">
                    {!isRunning ? (
                        <button
                            onClick={toggleStartPause}
                            aria-label="Start timer"
                            className={`flex-1 py-3.5 px-5 rounded-2xl font-bold text-base-sm text-white shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 ${isFocus
                                    ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
                                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                                }`}
                        >
                            <Play size={20} className="fill-current" />
                            {pausedSecondsLeft !== null ? 'Resume' : `Start ${isFocus ? 'Focus' : 'Break'}`}
                        </button>
                    ) : (
                        <button
                            onClick={toggleStartPause}
                            aria-label="Pause timer"
                            className="flex-1 py-3.5 px-5 rounded-2xl font-bold text-base-sm text-white bg-amber-600 hover:bg-amber-700 shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                        >
                            <Pause size={20} />
                            Pause
                        </button>
                    )}

                    <button
                        onClick={handleReset}
                        aria-label="Reset timer to selected duration"
                        className="py-3.5 px-4 rounded-2xl font-bold text-base-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center gap-2 transition-all active:scale-95 shrink-0"
                    >
                        <RotateCcw size={18} />
                        Reset
                    </button>
                </div>

                {/* Sound Cue Toggle */}
                <button
                    onClick={toggleSound}
                    aria-label={soundEnabled ? 'Mute Audio Cues' : 'Unmute Audio Cues'}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 ${soundEnabled
                            ? 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700'
                        }`}
                >
                    {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                    {soundEnabled ? 'Audio Cues: ON' : 'Audio Cues: OFF'}
                </button>
            </div>

            {/* Distraction Blocker Tool Button */}
            <div className="w-full pt-2 flex flex-col items-center gap-2">
                <button
                    onClick={handleBlockDistraction}
                    className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-red-300 dark:border-red-800/60 bg-red-50/50 dark:bg-red-950/20 text-red-700 dark:text-red-400 font-bold text-xs flex items-center justify-center gap-2 hover:bg-red-100/50 transition-colors"
                >
                    <ShieldAlert size={16} />
                    I got distracted! Log & Refocus 🛡️
                </button>

                {distractionNotice && (
                    <div className="text-xs font-semibold text-red-600 dark:text-red-400 animate-pulse text-center">
                        💪 Great catch! Back to focus. Blocked ({distractionCount})
                    </div>
                )}
            </div>
        </div>
    );
}
