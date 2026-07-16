import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, ShieldAlert, Coffee, Flame, Volume2, VolumeX } from 'lucide-react';

/**
 * FocusTimer - High contrast, low-distraction circular timer for ADHD Focus Sessions.
 */
export default function FocusTimer({ onSessionComplete, onDistractionBlocked }) {
    const [durationMinutes, setDurationMinutes] = useState(25);
    const [secondsLeft, setSecondsLeft] = useState(25 * 60);
    const [isRunning, setIsRunning] = useState(false);
    const [mode, setMode] = useState('focus'); // 'focus' | 'break'
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [distractionCount, setDistractionCount] = useState(0);
    const [distractionNotice, setDistractionNotice] = useState(false);

    const timerRef = useRef(null);
    const audioContextRef = useRef(null);

    // Play a gentle synth tone for timer start/stop/finish
    const playTone = useCallback((freq = 440, duration = 0.15, type = 'sine') => {
        if (!soundEnabled) return;
        try {
            const ctx = audioContextRef.current || new (window.AudioContext || window.webkitAudioContext)();
            audioContextRef.current = ctx;
            if (ctx.state === 'suspended') {
                ctx.resume();
            }
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch (e) {
            console.warn('Audio feedback error:', e);
        }
    }, [soundEnabled]);

    // Handle timer tick interval
    useEffect(() => {
        if (isRunning) {
            timerRef.current = setInterval(() => {
                setSecondsLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        setIsRunning(false);
                        playTone(880, 0.4, 'triangle');
                        if (onSessionComplete) {
                            onSessionComplete({
                                minutes: durationMinutes,
                                mode,
                                distractionCount,
                            });
                        }
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }

        return () => clearInterval(timerRef.current);
    }, [isRunning, durationMinutes, mode, distractionCount, onSessionComplete, playTone]);

    // Switch timer modes (Focus vs Short Break)
    const handleSetMode = (newMode, mins) => {
        playTone(520, 0.08);
        setMode(newMode);
        setDurationMinutes(mins);
        setSecondsLeft(mins * 60);
        setIsRunning(false);
    };

    const toggleStartPause = () => {
        if (!isRunning) {
            playTone(660, 0.1);
        } else {
            playTone(330, 0.1);
        }
        setIsRunning((prev) => !prev);
    };

    const handleReset = () => {
        playTone(300, 0.1);
        setIsRunning(false);
        setSecondsLeft(durationMinutes * 60);
    };

    const handleBlockDistraction = () => {
        playTone(750, 0.12, 'square');
        setDistractionCount((prev) => prev + 1);
        setDistractionNotice(true);
        if (onDistractionBlocked) {
            onDistractionBlocked(distractionCount + 1);
        }
        setTimeout(() => setDistractionNotice(false), 2500);
    };

    // Formatting for display (MM:SS)
    const displayMins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
    const displaySecs = String(secondsLeft % 60).padStart(2, '0');

    // Circle SVG Math
    const totalSeconds = durationMinutes * 60;
    const progressFraction = totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 0;
    const radius = 90;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * (1 - progressFraction);

    const isFocus = mode === 'focus';
    const accentColorClass = isFocus ? 'text-red-500' : 'text-emerald-500';
    const strokeColor = isFocus ? '#EF4444' : '#10B981';

    return (
        <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto">
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
                <div className="flex gap-2">
                    {[15, 25, 45].map((mins) => (
                        <button
                            key={mins}
                            onClick={() => handleSetMode('focus', mins)}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${durationMinutes === mins
                                    ? 'bg-red-500 text-white shadow-xs'
                                    : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
                                }`}
                        >
                            {mins} min
                        </button>
                    ))}
                </div>
            )}

            {/* Circular Timer Visual */}
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
                    <span className={`text-4xl font-black tracking-tight font-mono ${accentColorClass}`}>
                        {displayMins}:{displaySecs}
                    </span>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                        {isRunning ? (isFocus ? '🔥 In Deep Focus' : '☕ Relaxing Break') : 'Paused'}
                    </span>
                </div>
            </div>

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
                            Start {isFocus ? 'Focus' : 'Break'}
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
                    onClick={() => setSoundEnabled((prev) => !prev)}
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
