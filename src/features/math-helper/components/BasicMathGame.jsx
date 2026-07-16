import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Wrench, Loader2, AlertTriangle } from 'lucide-react';
import { generateMathProblem } from '../lib/generateMathProblem';
import { logActivity } from '../../../shared/lib/logActivity';
import useProfileStore from '../../../store/useProfileStore';
import IconButton from '../../../shared/components/IconButton';

export default function BasicMathGame({ 
    operation = '+', 
    operandA, 
    operandB, 
    entryPath = 'operation-tile',
    onRestart
}) {
    const navigate = useNavigate();
    const userId = useProfileStore((s) => s.id);

    const [difficulty, setDifficulty] = useState('easy');
    const [showDifficulty, setShowDifficulty] = useState(false);
    const [problem, setProblem] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [shuffledChoices, setShuffledChoices] = useState([]);
    
    // Tracking first round for custom equation injection
    const [isFirstRound, setIsFirstRound] = useState(true);

    // Interaction states
    const [selectedChoice, setSelectedChoice] = useState(null);
    const [isChoiceCorrect, setIsChoiceCorrect] = useState(null);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const fetchProblem = async (diff = difficulty, resetFirstRound = false) => {
        setIsLoading(true);
        setProblem(null);
        setSelectedChoice(null);
        setIsChoiceCorrect(null);
        
        const checkFirst = resetFirstRound ? true : isFirstRound;
        const isCustomPath = entryPath === 'custom';

        try {
            const data = await generateMathProblem({
                operation,
                difficulty: diff,
                operandA: (isCustomPath && checkFirst) ? operandA : undefined,
                operandB: (isCustomPath && checkFirst) ? operandB : undefined
            });
            
            setProblem(data);
            
            // Mix correct answer and wrong choices, then shuffle
            const choices = [data.answer, ...data.wrongChoices];
            const shuffled = [...choices].sort(() => Math.random() - 0.5);
            setShuffledChoices(shuffled);

            if (isFirstRound) {
                setIsFirstRound(false);
            }
        } catch (err) {
            console.error('Failed to load math problem:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Load initial problem
    useEffect(() => {
        fetchProblem(difficulty, true);
    }, [operation, operandA, operandB, entryPath]);

    const handleAnswerClick = async (choice) => {
        if (isTransitioning || selectedChoice !== null) return;
        
        setSelectedChoice(choice);
        const correct = choice === problem.answer;
        setIsChoiceCorrect(correct);
        setIsTransitioning(true);

        try {
            if (userId) {
                // Log activity including which entry path was used per user request
                await logActivity(userId, 'math_problem_solved', {
                    correct,
                    operation: problem.operation,
                    difficulty,
                    entryPath
                });
            }
        } catch (err) {
            console.error('Failed to log math activity:', err);
        }

        // Delay before transitioning to next problem
        setTimeout(() => {
            fetchProblem();
            setIsTransitioning(false);
        }, 1800);
    };

    const handleDifficultyChange = (newDiff) => {
        setDifficulty(newDiff);
        setShowDifficulty(false);
        setIsFirstRound(false); // Reset custom equation injection once difficulty changes
        fetchProblem(newDiff, false);
    };

    // Define colored class mappings for answer buttons
    const buttonColors = [
        'bg-purple-600 hover:bg-purple-700 text-white border-purple-800',
        'bg-red-500 hover:bg-red-600 text-white border-red-700',
        'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-700',
        'bg-pink-500 hover:bg-pink-600 text-white border-pink-700'
    ];

    return (
        <div className="flex flex-col gap-5 w-full flex-1">
            {/* Top Toolbar */}
            <div className="flex justify-between items-center relative z-20">
                <IconButton 
                    icon={Home} 
                    label="Back to Dashboard" 
                    onClick={() => navigate('/dashboard')}
                />
                
                <IconButton 
                    icon={Wrench} 
                    label="Difficulty Settings" 
                    onClick={() => setShowDifficulty(!showDifficulty)}
                />

                {/* Difficulty toggle overlay */}
                {showDifficulty && (
                    <div className="absolute right-2 top-12 bg-white dark:bg-gray-800 p-3 rounded-card shadow-xl border border-gray-100 dark:border-gray-700 flex flex-col gap-2 z-30 min-w-[150px] animate-scale-in">
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">Difficulty</span>
                        <div className="flex flex-col gap-1.5">
                            <button
                                onClick={() => handleDifficultyChange('easy')}
                                className={`w-full min-h-touch py-2 rounded-lg text-xs font-bold transition-all ${
                                    difficulty === 'easy' 
                                        ? 'bg-primary text-white' 
                                        : 'bg-gray-50 dark:bg-gray-750 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                            >
                                Easy (1 to 5)
                            </button>
                            <button
                                onClick={() => handleDifficultyChange('medium')}
                                className={`w-full min-h-touch py-2 rounded-lg text-xs font-bold transition-all ${
                                    difficulty === 'medium' 
                                        ? 'bg-primary text-white' 
                                        : 'bg-gray-50 dark:bg-gray-750 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                            >
                                Medium (1 to 10)
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Chalkboard Display Area */}
            <div className="bg-[#1b3024] border-8 border-amber-800 rounded-2xl p-5 shadow-2xl flex flex-col gap-5 items-center justify-center min-h-[240px] relative overflow-hidden select-none">
                <div className="absolute inset-0 bg-chalkboard opacity-[0.03] pointer-events-none" />

                {isLoading ? (
                    <div className="flex flex-col items-center gap-2 text-white">
                        <Loader2 className="animate-spin text-[#dcedc8]" size={36} />
                        <span className="text-xs font-bold tracking-widest text-[#dcedc8]/80 uppercase">Writing on board...</span>
                    </div>
                ) : problem ? (
                    <div className="w-full flex flex-col items-center gap-5 relative z-10">
                        {/* Question Text */}
                        <p className="text-center font-bold text-base-md leading-relaxed text-[#f4faf6] max-w-[280px]">
                            {problem.story}
                        </p>

                        {/* Visual Count Display */}
                        <div className="flex flex-wrap items-center justify-center gap-3 p-3 bg-black/10 rounded-xl border border-white/5 min-h-[72px] min-w-[200px]">
                            
                            {/* Addition (+) */}
                            {problem.operation === '+' && (
                                <div className="flex items-center gap-3">
                                    <div className="flex flex-wrap gap-1.5 justify-center max-w-[120px]">
                                        {Array.from({ length: problem.operandA }).map((_, i) => (
                                            <span key={`add-a-${i}`} className="text-3xl filter drop-shadow">
                                                {problem.itemEmoji}
                                            </span>
                                        ))}
                                    </div>
                                    <span className="text-2xl font-black text-[#dcedc8]">+</span>
                                    <div className="flex flex-wrap gap-1.5 justify-center max-w-[120px]">
                                        {Array.from({ length: problem.operandB }).map((_, i) => (
                                            <span key={`add-b-${i}`} className="text-3xl filter drop-shadow">
                                                {problem.itemEmoji}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Subtraction (-) */}
                            {problem.operation === '-' && (
                                <div className="flex flex-wrap gap-1.5 items-center justify-center max-w-[280px]">
                                    {Array.from({ length: problem.operandA }).map((_, idx) => {
                                        const isRemoved = idx >= (problem.operandA - problem.operandB);
                                        return (
                                            <div key={`sub-${idx}`} className="relative">
                                                <span className={`text-3xl filter drop-shadow transition-opacity ${isRemoved ? 'opacity-25' : 'opacity-100'}`}>
                                                    {problem.itemEmoji}
                                                </span>
                                                {isRemoved && (
                                                    <span className="absolute inset-0 flex items-center justify-center text-red-500 font-extrabold text-sm pointer-events-none drop-shadow-md select-none">
                                                        ❌
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Multiplication (*) */}
                            {problem.operation === '*' && (
                                <div className="flex flex-col gap-1.5 items-center justify-center p-1 bg-black/10 rounded-lg">
                                    {Array.from({ length: problem.operandA }).map((_, rIdx) => (
                                        <div key={`mul-row-${rIdx}`} className="flex gap-1.5">
                                            {Array.from({ length: problem.operandB }).map((_, cIdx) => (
                                                <span key={`mul-col-${cIdx}`} className="text-2xl filter drop-shadow">
                                                    {problem.itemEmoji}
                                                </span>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Division (/) */}
                            {problem.operation === '/' && (
                                <div className="flex flex-wrap gap-2 items-center justify-center max-w-[320px]">
                                    {Array.from({ length: problem.operandB }).map((_, gIdx) => {
                                        const itemsInGroup = Math.floor(problem.operandA / problem.operandB);
                                        return (
                                            <div key={`div-group-${gIdx}`} className="flex flex-col items-center p-1.5 bg-black/20 rounded-lg border border-white/5 min-w-[60px]">
                                                <span className="text-[8px] font-bold text-[#dcedc8]/50 uppercase mb-0.5">Group {gIdx + 1}</span>
                                                <div className="flex flex-wrap gap-0.5 justify-center max-w-[50px]">
                                                    {Array.from({ length: itemsInGroup }).map((_, i) => (
                                                        <span key={`div-item-${i}`} className="text-lg filter drop-shadow">
                                                            {problem.itemEmoji}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {problem.operandA % problem.operandB !== 0 && (
                                        <div className="w-full text-center text-[9px] font-bold text-yellow-300/80 mt-1">
                                            (With remainder shared as decimals)
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2 text-red-300">
                        <AlertTriangle size={32} />
                        <span className="text-xs font-bold">Failed to load problem.</span>
                    </div>
                )}
            </div>

            {/* Answer Feedback Alert Banner */}
            {selectedChoice !== null && (
                <div className={`p-3 rounded-card text-center text-xs font-bold shadow-md animate-fade-in ${
                    isChoiceCorrect 
                        ? 'bg-green-500 text-white' 
                        : 'bg-red-500 text-white'
                }`}>
                    {isChoiceCorrect ? '🎉 Nice work!' : `💡 Close! The answer is ${problem?.answer}.`}
                </div>
            )}

            {/* Colored Large-Number Answer Buttons */}
            <div className="grid grid-cols-2 gap-3.5">
                {shuffledChoices.map((choice, index) => {
                    const colorClass = buttonColors[index % buttonColors.length];
                    const isSelected = selectedChoice === choice;
                    
                    let activeBorderClass = 'border-b-4';
                    if (selectedChoice !== null) {
                        if (choice === problem?.answer) {
                            activeBorderClass = 'ring-4 ring-green-400 scale-[1.02] border-b-0';
                        } else if (isSelected) {
                            activeBorderClass = 'ring-4 ring-red-400 opacity-80 border-b-0';
                        } else {
                            activeBorderClass = 'opacity-40 border-b-0';
                        }
                    }

                    return (
                        <button
                            key={`${choice}-${index}`}
                            disabled={isLoading || isTransitioning}
                            onClick={() => handleAnswerClick(choice)}
                            className={`
                                min-h-[64px] rounded-2xl text-base-lg font-black tracking-wide transition-all select-none cursor-pointer
                                active:scale-[0.95] disabled:cursor-not-allowed
                                ${colorClass}
                                ${activeBorderClass}
                            `}
                        >
                            {choice}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
