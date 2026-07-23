import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Loader2, Info, LogOut, CheckCircle2 } from 'lucide-react';
import Button from '../../../shared/components/Button';
import StoryReadAloud from './StoryReadAloud';
import { solveProblem } from '../lib/solveProblem';
import MathRenderer from './MathRenderer';

export default function ScannedSolutionsView({ problems, onExit }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [solution, setSolution] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentStepIdx, setCurrentStepIdx] = useState(0);

    const currentProb = problems[currentIndex];

    // Fetch solution when index changes
    useEffect(() => {
        if (!currentProb) return;

        let cancelled = false;
        (async () => {
            setIsLoading(true);
            setError(null);
            setSolution(null);
            setCurrentStepIdx(0);

            try {
                // Run the upgraded solver on the problem expression
                const data = await solveProblem(currentProb.expression, currentProb.category || 'auto-detect');
                if (!cancelled) {
                    if (data.error) {
                        setError(data.error);
                    } else {
                        setSolution(data);
                    }
                }
            } catch (err) {
                console.error('[ScannedSolutionsView] Solver error:', err);
                if (!cancelled) {
                    setError("Couldn't confidently solve this worksheet question. Try rephrasing or scanning again.");
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [currentIndex, currentProb]);

    const handleNextQuestion = () => {
        if (currentIndex < problems.length - 1) {
            setCurrentIndex((prev) => prev + 1);
        }
    };

    const handlePrevQuestion = () => {
        if (currentIndex > 0) {
            setCurrentIndex((prev) => prev - 1);
        }
    };

    return (
        <div className="flex flex-col gap-5 w-full flex-grow pb-16 animate-fade-in">
            {/* Blackboard display for the active question */}
            {currentProb && (
                <div className="bg-[#1b3024] border-8 border-amber-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 items-center justify-center min-h-[140px] relative overflow-hidden select-none text-center">
                    <div className="absolute inset-0 bg-chalkboard opacity-[0.03] pointer-events-none" />
                    <span className="text-[10px] font-black text-[#dcedc8]/60 uppercase tracking-widest relative z-10">
                        Question {currentIndex + 1} of {problems.length}
                    </span>
                    <div className="text-sm font-bold text-white leading-relaxed relative z-10 max-w-[320px]">
                        <MathRenderer text={currentProb.expression} />
                    </div>
                </div>
            )}

            {/* Computation loader */}
            {isLoading && (
                <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                    <Loader2 className="animate-spin text-primary" size={36} />
                    <div>
                        <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">AI Solver Active...</p>
                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-widest">
                            Calculating steps & explanations
                        </p>
                    </div>
                </div>
            )}

            {/* Error fallback card */}
            {error && !isLoading && (
                <div className="p-4 bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-900/50 rounded-2xl flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-sm">
                        <Info size={16} />
                        <span>⚠️ Solving Failed</span>
                    </div>
                    <p className="text-xs text-red-650 dark:text-red-300 leading-normal">{error}</p>
                </div>
            )}

            {/* Solved content layout */}
            {solution && !isLoading && (
                <div className="flex flex-col gap-4 animate-fade-in">
                    {/* Primary answer badge */}
                    <div className="p-4 bg-green-500/10 border border-green-500/25 rounded-2xl text-center flex flex-col justify-center gap-1 shadow-inner">
                        <span className="text-[9px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest">
                            Calculated Answer
                        </span>
                        <div className="text-xl font-black text-green-700 dark:text-green-400 font-mono tracking-wide break-all">
                            <MathRenderer text={solution.answer} />
                        </div>
                    </div>

                    {/* Progressive step cards */}
                    {solution.steps && solution.steps.length > 0 && (
                        <div className="flex flex-col gap-3">
                            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                Step-by-Step Breakdown
                            </span>

                            <div className="flex flex-col gap-3.5">
                                {solution.steps.slice(0, currentStepIdx + 1).map((step, idx) => {
                                    const isLatest = idx === currentStepIdx;
                                    return (
                                        <div
                                            key={idx}
                                            className={`p-4 rounded-2xl border transition-all duration-300 ${
                                                isLatest
                                                    ? 'bg-[#1b3024] border-emerald-800 shadow-md scale-[1.01] text-white'
                                                    : 'bg-gray-55 dark:bg-gray-800 border-gray-100 dark:border-gray-900 opacity-60'
                                            }`}
                                        >
                                            <span className={`text-[10px] font-black uppercase tracking-wider ${isLatest ? 'text-[#dcedc8]/80' : 'text-gray-400 dark:text-gray-500'}`}>
                                                Step {idx + 1}
                                            </span>
                                            <div className="mt-1">
                                                {isLatest ? (
                                                    <StoryReadAloud text={step.description} />
                                                ) : (
                                                    <div className="text-xs font-semibold text-gray-700 dark:text-gray-200 leading-relaxed">
                                                        <MathRenderer text={step.description} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Progressive disclosure triggers */}
                            {currentStepIdx < solution.steps.length - 1 ? (
                                <Button
                                    onClick={() => setCurrentStepIdx((prev) => prev + 1)}
                                    variant="primary"
                                    className="w-full font-bold shadow-md mt-1"
                                >
                                    Next Step
                                </Button>
                            ) : (
                                <div className="mt-2 p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold shadow-sm">
                                    <CheckCircle2 size={16} />
                                    <span>All steps completed!</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Bottom sticky navigation bar */}
            <div className="flex flex-col gap-3 mt-auto pt-4 border-t border-gray-100 dark:border-gray-800/80">
                <div className="grid grid-cols-2 gap-3.5">
                    <Button
                        variant="secondary"
                        onClick={handlePrevQuestion}
                        disabled={currentIndex === 0 || isLoading}
                        icon={ArrowLeft}
                        className="font-bold text-xs"
                    >
                        Previous
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={handleNextQuestion}
                        disabled={currentIndex === problems.length - 1 || isLoading}
                        icon={ArrowRight}
                        iconPosition="right"
                        className="font-bold text-xs"
                    >
                        Next
                    </Button>
                </div>

                <Button
                    variant="secondary"
                    onClick={onExit}
                    icon={LogOut}
                    className="w-full font-bold text-xs border border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/10 active:scale-[0.99]"
                >
                    Exit to Topics
                </Button>
            </div>
        </div>
    );
}
