import { useState, useEffect } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { logActivity } from '../../../shared/lib/logActivity';
import useProfileStore from '../../../store/useProfileStore';
import StoryReadAloud from './StoryReadAloud';

export default function MathQuizEngine({
    generateProblem,
    renderQuestion,
    topic
}) {
    const userId = useProfileStore((s) => s.id);
    
    const [problem, setProblem] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [shuffledChoices, setShuffledChoices] = useState([]);
    const [selectedChoice, setSelectedChoice] = useState(null);
    const [isChoiceCorrect, setIsChoiceCorrect] = useState(null);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [error, setError] = useState(null);

    const fetchProblem = async () => {
        setIsLoading(true);
        setError(null);
        setSelectedChoice(null);
        setIsChoiceCorrect(null);
        try {
            const data = await generateProblem();
            if (!data || data.answer === undefined || !Array.isArray(data.wrongChoices)) {
                throw new Error("Invalid problem format received");
            }
            setProblem(data);
            const choices = [data.answer, ...data.wrongChoices];
            // Shuffle choices
            const shuffled = [...choices].sort(() => Math.random() - 0.5);
            setShuffledChoices(shuffled);
        } catch (err) {
            console.error('Failed to load problem:', err);
            setError(err.message || 'Failed to load problem');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProblem();
        return () => {
            // cleanup if needed
        };
    }, [generateProblem]);

    const handleAnswerClick = async (choice) => {
        if (isTransitioning || selectedChoice !== null) return;
        
        setSelectedChoice(choice);
        const correct = choice === problem.answer;
        setIsChoiceCorrect(correct);
        setIsTransitioning(true);

        try {
            if (userId) {
                await logActivity(userId, 'math_problem_solved', {
                    correct,
                    topic,
                    operation: problem.operationEquivalent || topic
                });
            }
        } catch (err) {
            console.error('Failed to log math activity:', err);
        }

        // Auto-advance to next problem
        setTimeout(() => {
            fetchProblem();
            setIsTransitioning(false);
        }, 1800);
    };

    // Button colors matching original math helper choices
    const buttonColors = [
        'bg-purple-600 hover:bg-purple-700 text-white border-purple-800',
        'bg-red-500 hover:bg-red-600 text-white border-red-700',
        'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-700',
        'bg-pink-500 hover:bg-pink-600 text-white border-pink-700'
    ];

    return (
        <div className="flex flex-col gap-5 w-full flex-1 animate-fade-in">
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
                        {/* Question Text with Read Aloud */}
                        {problem.story && <StoryReadAloud text={problem.story} />}

                        {/* Custom Question Rendering (coefficients, equations, triangles) */}
                        <div className="w-full flex justify-center">
                            {renderQuestion(problem)}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2 text-red-350">
                        <AlertTriangle size={32} />
                        <span className="text-xs font-bold">{error || "Failed to load problem."}</span>
                    </div>
                )}
            </div>

            {/* Gentle Answer Feedback Banner */}
            {selectedChoice !== null && (
                <div className={`p-3 rounded-card text-center text-xs font-bold shadow-md animate-fade-in ${
                    isChoiceCorrect 
                        ? 'bg-green-500 text-white' 
                        : 'bg-red-500 text-white'
                }`}>
                    {isChoiceCorrect ? '🎉 Nice work!' : `💡 Close! The answer is ${problem?.answer}.`}
                </div>
            )}

            {/* Choices Grid */}
            {problem && (
                <div className="grid grid-cols-2 gap-3.5 animate-fade-in">
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
            )}
        </div>
    );
}
