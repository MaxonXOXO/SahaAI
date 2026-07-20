import { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Circle, Clock, Check, Play, Trash2 } from 'lucide-react';
import useFocusStore from '../useFocusStore';
import useTone from '../lib/useTone';

/**
 * TaskChecklist - Renders step-by-step AI generated breakdown items with ADHD progress feedback.
 * Includes a "Focus" button per uncompleted step, pop animations, rising two-note tone on check,
 * and a lightweight CSS confetti burst upon 100% completion.
 */
export default function TaskChecklist({ steps, completedStepIds, onToggleStep, taskTitle, onNavigateToFocus, onClearBreakdown }) {
    const startTimer = useFocusStore((s) => s.startTimer);
    const clearBreakdownStore = useFocusStore((s) => s.clearBreakdown);
    const soundEnabled = useFocusStore((s) => s.soundEnabled);
    const { playSequence } = useTone(soundEnabled);

    const handleClear = onClearBreakdown || clearBreakdownStore;
    const [justCheckedId, setJustCheckedId] = useState(null);
    const [showConfetti, setShowConfetti] = useState(false);

    if (!steps || steps.length === 0) return null;

    const completedCount = completedStepIds.length;
    const totalCount = steps.length;
    const progressPercent = Math.round((completedCount / totalCount) * 100);
    const prevCompletedCountRef = useRef(completedCount);

    useEffect(() => {
        if (completedCount === totalCount && totalCount > 0 && prevCompletedCountRef.current < totalCount) {
            setShowConfetti(true);
            const timer = setTimeout(() => setShowConfetti(false), 1500);
            return () => clearTimeout(timer);
        }
        prevCompletedCountRef.current = completedCount;
    }, [completedCount, totalCount]);

    const handleStepClick = (step) => {
        const isDone = completedStepIds.includes(step.id);
        if (!isDone) {
            // Rising two-note tone for step completion
            playSequence([
                { freq: 520, duration: 0.1, delay: 0 },
                { freq: 660, duration: 0.12, delay: 0.08 },
            ]);
            setJustCheckedId(step.id);
            setTimeout(() => setJustCheckedId(null), 400);
        }
        onToggleStep(step);
    };

    const handleFocusStep = (e, step) => {
        e.stopPropagation(); // Prevent toggling step completion
        const minutes = Math.min(60, Math.max(5, Math.round(step.estMinutes || 25)));
        startTimer('focus', minutes, step.title);
        if (onNavigateToFocus) {
            onNavigateToFocus();
        }
    };

    return (
        <div className="flex flex-col gap-4 w-full relative">
            <style>{`
                @keyframes popScale {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.04); }
                    100% { transform: scale(1); }
                }
                @keyframes confettiFall {
                    0% { transform: translate(0, 0) scale(1); opacity: 1; }
                    100% { transform: translate(var(--dx), var(--dy)) scale(0.3); opacity: 0; }
                }
                .animate-step-pop {
                    animation: popScale 400ms ease-out;
                }
                .animate-confetti-dot {
                    animation: confettiFall 1.4s ease-out forwards;
                }
            `}</style>

            {/* Confetti Burst Container */}
            {showConfetti && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-30 flex items-center justify-center">
                    {Array.from({ length: 22 }).map((_, i) => {
                        const colors = ['#EF4444', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899'];
                        const color = colors[i % colors.length];
                        const angle = (i / 22) * 360;
                        const distance = 90 + (i % 6) * 18;
                        const dx = `${Math.cos((angle * Math.PI) / 180) * distance}px`;
                        const dy = `${Math.sin((angle * Math.PI) / 180) * distance + 35}px`;
                        return (
                            <div
                                key={i}
                                className="absolute w-2.5 h-2.5 rounded-full animate-confetti-dot"
                                style={{
                                    backgroundColor: color,
                                    '--dx': dx,
                                    '--dy': dy,
                                    left: '50%',
                                    top: '30%',
                                }}
                            />
                        );
                    })}
                </div>
            )}

            {/* Header & Overall Progress Bar */}
            <div className="bg-purple-50 dark:bg-purple-950/30 p-4 rounded-2xl border border-purple-100 dark:border-purple-900/40">
                <div className="flex items-center justify-between mb-2 gap-2">
                    <h3 className="text-base-sm font-bold text-purple-950 dark:text-purple-100 truncate pr-1">
                        {taskTitle || 'Breakdown Steps'}
                    </h3>
                    <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-xs font-black text-purple-600 dark:text-purple-400 bg-white dark:bg-gray-800 px-2.5 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                            {completedCount}/{totalCount} done ({progressPercent}%)
                        </span>
                        <button
                            type="button"
                            onClick={handleClear}
                            className="text-[11px] font-bold text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 bg-white dark:bg-gray-800 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700 transition-colors flex items-center gap-1"
                            aria-label="Clear breakdown and start new task"
                            title="Clear breakdown and start new task"
                        >
                            <Trash2 size={11} />
                            Clear
                        </button>
                    </div>
                </div>

                {/* Progress track */}
                <div className="w-full h-2.5 bg-purple-200 dark:bg-purple-900/60 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-purple-600 transition-all duration-300 ease-out rounded-full"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>

                {progressPercent === 100 && (
                    <div className="mt-3 p-2 bg-emerald-500 text-white rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5 animate-bounce">
                        <Check size={16} /> 🎉 Amazing work! You completed every step!
                    </div>
                )}
            </div>

            {/* Step Items */}
            <div className="flex flex-col gap-3">
                {steps.map((step, index) => {
                    const isDone = completedStepIds.includes(step.id);
                    const isJustChecked = justCheckedId === step.id;
                    return (
                        <button
                            key={step.id}
                            onClick={() => handleStepClick(step)}
                            className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-3.5 ${
                                isJustChecked ? 'animate-step-pop' : ''
                            } ${
                                isDone
                                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 opacity-80'
                                    : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-750 hover:border-purple-300 dark:hover:border-purple-700 shadow-xs'
                            }`}
                        >
                            <div className="mt-0.5 shrink-0">
                                {isDone ? (
                                    <CheckCircle2 size={24} className="text-emerald-500" />
                                ) : (
                                    <Circle size={24} className="text-gray-300 dark:text-gray-600" />
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <span className={`text-xs font-bold ${isDone ? 'line-through text-emerald-800 dark:text-emerald-300' : 'text-gray-900 dark:text-gray-100'}`}>
                                        Step {index + 1}: {step.title}
                                    </span>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        {step.estMinutes && (
                                            <span className="shrink-0 text-[10px] font-bold text-purple-600 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                <Clock size={10} />
                                                {step.estMinutes}m
                                            </span>
                                        )}
                                        {!isDone && (
                                            <span
                                                role="button"
                                                tabIndex={0}
                                                onClick={(e) => handleFocusStep(e, step)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        handleFocusStep(e, step);
                                                    }
                                                }}
                                                className="shrink-0 py-1 px-2.5 rounded-lg text-[11px] font-bold bg-purple-600 hover:bg-purple-700 active:scale-95 text-white shadow-xs flex items-center gap-1 transition-all cursor-pointer"
                                                aria-label={`Start focus timer for step: ${step.title}`}
                                            >
                                                <Play size={12} className="fill-current" />
                                                Focus
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {step.description && (
                                    <p className={`text-xs mt-1 leading-relaxed ${isDone ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-300'}`}>
                                        {step.description}
                                    </p>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
