import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, ShieldAlert, Flame, Volume2, VolumeX, Bot } from 'lucide-react';
import useFocusStore from '../useFocusStore';
import useTone from '../lib/useTone';
import RevealTimer from './RevealTimer';

/**
 * FocusTimer - High contrast, low-distraction circular or picture reveal timer for ADHD Focus Sessions.
 * Features hero timer card filling available screen height, scaled timer/reveal area, equal-width duration chips,
 * 52px action icons, and ghost distraction button.
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
    const accentColorClass = isFocus ? 'text-red-400' : 'text-emerald-400';
    const strokeColor = celebrationMsg ? '#10B981' : (isFocus ? '#EF4444' : '#10B981');

    return (
        <div className="w-full h-full flex-1 min-h-0 max-w-sm mx-auto flex flex-col items-center">
            {/* Hero Timer Card — Flex-1 Filling Available Height */}
            <div className="bg-slate-900/80 border border-slate-700/60 shadow-2xl shadow-indigo-950/60 backdrop-blur-md rounded-2xl p-3 sm:p-4 w-full h-full flex-1 min-h-0 flex flex-col justify-between items-center gap-2">
                {/* Top Controls Container */}
                <div className="shrink-0 flex flex-col gap-2 w-full">
                    {/* Top Row: Focus/Break segmented control beside compact Classic/Reveal control */}
                    <div className="flex items-center gap-2 w-full">
                        {/* Mode Selectors */}
                        <div className="flex items-center p-1 bg-slate-950/80 rounded-2xl flex-1 border border-slate-800">
                            <button
                                onClick={() => handleSetMode('focus', 25)}
                                className={`flex-1 py-1.5 sm:py-2 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all ${
                                    isFocus
                                        ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                                        : 'text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                <Flame size={14} />
                                Focus (25m)
                            </button>
                            <button
                                onClick={() => handleSetMode('break', 5)}
                                className={`flex-1 py-1.5 sm:py-2 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all ${
                                    !isFocus
                                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                                        : 'text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                <Bot size={14} className="text-cyan-300 animate-pulse" />
                                Break (5m)
                            </button>
                        </div>

                        {/* Compact Timer Style Switcher (~130px, icon-only ⏱️/🖼️) */}
                        <div className="flex items-center p-1 bg-slate-950/80 rounded-2xl shrink-0 w-[120px] sm:w-[130px] text-xs font-bold border border-slate-800">
                            <button
                                type="button"
                                onClick={() => setTimerStyle('classic')}
                                aria-label="Classic Timer"
                                title="Classic Timer"
                                className={`flex-1 py-1.5 sm:py-2 rounded-xl transition-all flex items-center justify-center ${
                                    timerStyle === 'classic'
                                        ? 'bg-slate-800 text-slate-100 shadow-xs'
                                        : 'text-slate-500 hover:text-slate-300'
                                }`}
                            >
                                ⏱️
                            </button>
                            <button
                                type="button"
                                onClick={() => setTimerStyle('reveal')}
                                aria-label="Picture Reveal Timer"
                                title="Picture Reveal Timer"
                                className={`flex-1 py-1.5 sm:py-2 rounded-xl transition-all flex items-center justify-center ${
                                    timerStyle === 'reveal'
                                        ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                                        : 'text-slate-500 hover:text-slate-300'
                                }`}
                            >
                                🖼️
                            </button>
                        </div>
                    </div>

                    {/* Duration Presets for Focus — Equal-width chips in ONE row */}
                    {isFocus && (
                        <div className="flex items-center gap-1.5 w-full">
                            {[
                                { mins: 5, label: '☄️ 5m' },
                                { mins: 15, label: '15m' },
                                { mins: 25, label: '25m' },
                                { mins: 45, label: '45m' },
                            ].map(({ mins, label }) => (
                                <button
                                    key={mins}
                                    onClick={() => handleSetMode('focus', mins)}
                                    className={`flex-1 whitespace-nowrap py-1.5 rounded-xl text-xs font-bold text-center transition-all ${
                                        durationMinutes === mins
                                            ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                                            : 'bg-slate-800/80 text-slate-300 border border-slate-700/60 hover:bg-slate-700/80'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Growing Timer Visual Area: Reveal View vs Scaled Classic Ring */}
                <div className="flex-1 min-h-0 w-full flex items-center justify-center relative my-1">
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
                        /* Circular Timer Visual (Classic) — Scaled up responsively */
                        <div className="relative w-full h-full max-w-[min(76vw,36dvh)] max-h-[min(76vw,36dvh)] aspect-square flex items-center justify-center shrink-0">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                                {/* Background track circle */}
                                <circle
                                    cx="100"
                                    cy="100"
                                    r={radius}
                                    className="stroke-slate-800/90"
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
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3">
                                {celebrationMsg ? (
                                    <div className="p-3 bg-emerald-950/80 text-emerald-200 rounded-2xl border border-emerald-500/50 shadow-lg animate-pulse">
                                        <p className="text-xs font-black leading-snug">{celebrationMsg}</p>
                                    </div>
                                ) : (
                                    <>
                                        <span className={`text-5xl sm:text-6xl font-black tracking-tight font-mono ${accentColorClass}`}>
                                            {displayMins}:{displaySecs}
                                        </span>
                                        <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                                            {isRunning ? (isFocus ? '🔥 In Deep Focus' : '☕ Relaxing Break') : 'PAUSED'}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom Actions Container */}
                <div className="shrink-0 flex flex-col gap-2 w-full">
                    {/* Active Step Badge */}
                    {isFocus && currentStepTitle && !celebrationMsg && (
                        <div className="w-full p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Focusing on:
                            </span>
                            <span className="block text-xs font-bold text-slate-100 line-clamp-2 leading-tight">
                                {currentStepTitle}
                            </span>
                        </div>
                    )}

                    {/* Actions Row: Start (flex-1 primary) + 52px square Reset & Audio icons */}
                    <div className="flex items-center gap-2.5 w-full">
                        {!isRunning ? (
                            <button
                                onClick={toggleStartPause}
                                aria-label="Start timer"
                                className={`flex-1 py-3 px-4 rounded-2xl font-bold text-sm text-white shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${
                                    isFocus
                                        ? 'bg-red-600 hover:bg-red-700 shadow-red-600/30'
                                        : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                                }`}
                            >
                                <Play size={18} className="fill-current" />
                                {pausedSecondsLeft !== null ? 'Resume' : `Start ${isFocus ? 'Focus' : 'Break'}`}
                            </button>
                        ) : (
                            <button
                                onClick={toggleStartPause}
                                aria-label="Pause timer"
                                className="flex-1 py-3 px-4 rounded-2xl font-bold text-sm text-white bg-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 transition-all active:scale-98"
                            >
                                <Pause size={18} />
                                Pause
                            </button>
                        )}

                        <button
                            onClick={handleReset}
                            aria-label="Reset timer to selected duration"
                            className="w-[50px] h-[50px] shrink-0 rounded-2xl border border-slate-700/80 bg-slate-800/80 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-all active:scale-95"
                        >
                            <RotateCcw size={18} />
                        </button>

                        <button
                            onClick={toggleSound}
                            aria-label={soundEnabled ? 'Mute Audio Cues' : 'Unmute Audio Cues'}
                            className="w-[50px] h-[50px] shrink-0 rounded-2xl border border-slate-700/80 bg-slate-800/80 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-all active:scale-95"
                        >
                            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                        </button>
                    </div>

                    {/* Distraction Blocker Tool Button — Ghost style */}
                    <div className="w-full flex flex-col items-center gap-1">
                        <button
                            onClick={handleBlockDistraction}
                            className="w-full py-2 px-3 rounded-xl border-2 border-dashed border-red-500/40 bg-transparent text-red-400 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-red-950/20 transition-colors"
                        >
                            <ShieldAlert size={14} />
                            I got distracted! Log & Refocus 🛡️
                        </button>

                        {distractionNotice && (
                            <div className="text-[11px] font-semibold text-red-400 animate-pulse text-center">
                                💪 Great catch! Back to focus. Blocked ({distractionCount})
                            </div>
                        )}
                    </div>

                    {/* Sessions Today Counter — Inside Card Bottom */}
                    {sessionsToday >= 1 && (
                        <div className="text-[11px] font-medium text-slate-400 text-center pt-0.5">
                            ✨ {sessionsToday} focus session{sessionsToday > 1 ? 's' : ''} today
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
