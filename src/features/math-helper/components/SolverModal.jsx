import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { solveProblem } from '../lib/solveProblem';
import { logActivity } from '../../../shared/lib/logActivity';
import useProfileStore from '../../../store/useProfileStore';
import Button from '../../../shared/components/Button';
import IconButton from '../../../shared/components/IconButton';
import StoryReadAloud from './StoryReadAloud';
import MathRenderer from './MathRenderer';

export default function SolverModal({ isOpen, onClose }) {
    const userId = useProfileStore((s) => s.id);

    const [inputText, setInputText] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('auto-detect');
    
    // Status states
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    // Step progression state
    const [currentStepIdx, setCurrentStepIdx] = useState(0);

    if (!isOpen) return null;

    const handleSolve = async () => {
        if (!inputText.trim()) return;
        setIsLoading(true);
        setError(null);
        setResult(null);
        setCurrentStepIdx(0);

        try {
            const data = await solveProblem(inputText, selectedCategory);
            if (data.error) {
                setError(data.error);
            } else {
                setResult(data);
                
                // Log activity per user requirements
                try {
                    if (userId) {
                        await logActivity(userId, 'math_problem_solved', {
                            source: 'solver',
                            category: data.category
                        });
                    }
                } catch (logErr) {
                    console.error('Failed to log math solver activity:', logErr);
                }
            }
        } catch (err) {
            console.error('Solver error:', err);
            setError("Couldn't confidently solve this — try rephrasing or selecting a category.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSolveAnother = () => {
        setInputText('');
        setResult(null);
        setError(null);
        setCurrentStepIdx(0);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto select-none">
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-150 dark:border-gray-800 shadow-2xl p-6 w-full max-w-lg flex flex-col gap-5 relative animate-scale-in max-h-[90vh] overflow-y-auto">
                
                {/* Header */}
                <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-800">
                    <h3 className="text-base-lg font-black text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        ✨ Math Solver
                    </h3>
                    <IconButton 
                        icon={X} 
                        label="Close Solver" 
                        onClick={onClose}
                        className="!bg-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    />
                </div>

                {/* Form Input View */}
                {result === null && !isLoading && (
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-gray-450 dark:text-gray-500 uppercase tracking-widest">
                                Your Problem
                            </label>
                            <textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Type your math problem here... (e.g. Solve 3x + 5 = 11, or 2 * 15 - 4)"
                                className="w-full min-h-[100px] p-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-850 text-xs font-semibold text-gray-800 dark:text-gray-100 outline-none focus:border-primary transition-all"
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-gray-450 dark:text-gray-500 uppercase tracking-widest">
                                Topic Category
                            </label>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full p-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-850 text-xs font-bold text-gray-800 dark:text-gray-100 outline-none cursor-pointer focus:border-primary transition-all"
                            >
                                <option value="auto-detect">🔍 Not sure — auto-detect</option>
                                <option value="basic-math">➕ Basic Math</option>
                                <option value="algebra">📐 Algebra (ax + b = c)</option>
                                <option value="polynomial">📈 Polynomial f(x)</option>
                                <option value="trigonometry">🔺 Trigonometry (Pythagorean theorem)</option>
                            </select>
                        </div>

                        {error && (
                            <div className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl text-center text-xs font-bold text-red-655 dark:text-red-400 leading-relaxed">
                                ⚠️ {error}
                            </div>
                        )}

                        <Button
                            onClick={handleSolve}
                            disabled={!inputText.trim()}
                            variant="primary"
                            size="lg"
                            className="w-full font-black shadow-md mt-2"
                        >
                            Solve Problem
                        </Button>
                    </div>
                )}

                {/* Loading State */}
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                        <Loader2 className="animate-spin text-primary" size={40} />
                        <div>
                            <p className="font-black text-gray-800 dark:text-gray-100">Solving Problem...</p>
                            <p className="text-[10px] font-bold text-gray-450 dark:text-gray-500 mt-1 uppercase tracking-widest">Calculating locally & writing steps</p>
                        </div>
                    </div>
                )}

                {/* Solver Result View */}
                {result !== null && !isLoading && (
                    <div className="flex flex-col gap-4 animate-fade-in">
                        {/* Prominent Answer display */}
                        <div className="p-5 bg-green-500/10 border border-green-500/25 rounded-2xl text-center flex flex-col justify-center gap-1 shadow-inner">
                            <span className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest">
                                Final Answer
                            </span>
                            <div className="text-3xl font-black text-green-700 dark:text-green-400 font-mono tracking-wide break-all">
                                <MathRenderer text={result.answer} />
                            </div>
                        </div>

                        {/* Step progression with StoryReadAloud audio */}
                        {result.steps && result.steps.length > 0 && (
                            <div className="flex flex-col gap-3">
                                <h4 className="text-[10px] font-black text-gray-450 dark:text-gray-500 uppercase tracking-widest">
                                    Step-by-Step Explanation
                                </h4>
                                <div className="flex flex-col gap-2.5">
                                    {result.steps.slice(0, currentStepIdx + 1).map((step, idx) => {
                                        const isLatest = idx === currentStepIdx;
                                        return (
                                            <div 
                                                key={idx} 
                                                className={`p-4 rounded-2xl border transition-all duration-300 ${
                                                    isLatest 
                                                        ? 'bg-[#1b3024] border-emerald-800 shadow-md scale-[1.01] text-white' 
                                                        : 'bg-gray-50 dark:bg-gray-850 border-gray-100 dark:border-gray-800 opacity-60'
                                                }`}
                                            >
                                                <span className={`text-[10px] font-black uppercase tracking-wider ${isLatest ? 'text-[#dcedc8]/80' : 'text-gray-450 dark:text-gray-500'}`}>
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

                                {/* Next Step or Completed Summary */}
                                {currentStepIdx < result.steps.length - 1 ? (
                                    <Button
                                        onClick={() => setCurrentStepIdx((prev) => prev + 1)}
                                        variant="primary"
                                        className="w-full font-bold shadow-md mt-1"
                                    >
                                        Next Step
                                    </Button>
                                ) : (
                                    <div className="p-3 bg-black/10 rounded-2xl border border-white/5 text-center text-xs font-bold text-gray-650 dark:text-gray-400 mt-1">
                                        🎉 {result.summary}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Reset Solver button */}
                        <Button
                            onClick={handleSolveAnother}
                            variant="secondary"
                            className="w-full font-bold shadow-sm border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-250 mt-2"
                        >
                            ✏️ Solve Another
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
