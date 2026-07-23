import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { evaluate } from 'mathjs';
import { generateStructuredJSON } from '../../../shared/lib/aiClient';
import { logActivity } from '../../../shared/lib/logActivity';
import useProfileStore from '../../../store/useProfileStore';
import Button from '../../../shared/components/Button';
import StoryReadAloud from './StoryReadAloud';
import MathRenderer from './MathRenderer';

export default function CalculatorView() {
    const userId = useProfileStore((s) => s.id);

    const [expression, setExpression] = useState('');
    const [result, setResult] = useState(null);
    const [steps, setSteps] = useState([]);
    const [summary, setSummary] = useState('');
    const [currentStepIdx, setCurrentStepIdx] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const buttons = [
        { label: 'C', value: 'clear', color: 'bg-red-500 hover:bg-red-600 text-white' },
        { label: '⌫', value: 'backspace', color: 'bg-gray-400 hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-700 text-white' },
        { label: '÷', value: '÷', color: 'bg-primary hover:bg-primary-dark text-white font-black' },
        { label: '×', value: '×', color: 'bg-primary hover:bg-primary-dark text-white font-black' },
        
        { label: '7', value: '7', color: 'bg-gray-100 hover:bg-gray-250 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-800 dark:text-gray-150 font-bold' },
        { label: '8', value: '8', color: 'bg-gray-100 hover:bg-gray-250 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-800 dark:text-gray-150 font-bold' },
        { label: '9', value: '9', color: 'bg-gray-100 hover:bg-gray-250 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-800 dark:text-gray-150 font-bold' },
        { label: '−', value: '−', color: 'bg-primary hover:bg-primary-dark text-white font-black' },
        
        { label: '4', value: '4', color: 'bg-gray-100 hover:bg-gray-250 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-800 dark:text-gray-150 font-bold' },
        { label: '5', value: '5', color: 'bg-gray-100 hover:bg-gray-250 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-800 dark:text-gray-150 font-bold' },
        { label: '6', value: '6', color: 'bg-gray-100 hover:bg-gray-250 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-800 dark:text-gray-150 font-bold' },
        { label: '+', value: '+', color: 'bg-primary hover:bg-primary-dark text-white font-black' },
        
        { label: '1', value: '1', color: 'bg-gray-100 hover:bg-gray-250 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-800 dark:text-gray-150 font-bold' },
        { label: '2', value: '2', color: 'bg-gray-100 hover:bg-gray-250 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-800 dark:text-gray-150 font-bold' },
        { label: '3', value: '3', color: 'bg-gray-100 hover:bg-gray-250 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-800 dark:text-gray-150 font-bold' },
        { label: '.', value: '.', color: 'bg-gray-100 hover:bg-gray-250 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-800 dark:text-gray-150 font-bold' },
        
        { label: '0', value: '0', color: 'bg-gray-100 hover:bg-gray-250 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-800 dark:text-gray-150 font-bold col-span-2' },
        { label: '=', value: '=', color: 'bg-green-500 hover:bg-green-600 text-white font-black col-span-2' }
    ];

    const handleKeypadPress = (val) => {
        setError(null);
        if (val === 'clear') {
            setExpression('');
            setResult(null);
            setSteps([]);
            setSummary('');
            setCurrentStepIdx(0);
        } else if (val === 'backspace') {
            setExpression((prev) => prev.slice(0, -1));
        } else if (val === '=') {
            evaluateExpression();
        } else {
            const isOperator = ['+', '−', '×', '÷'].includes(val);
            const lastChar = expression.slice(-1);
            const isLastOperator = ['+', '−', '×', '÷'].includes(lastChar);
            
            if (expression === '' && ['+', '×', '÷'].includes(val)) {
                return;
            }

            if (isOperator && isLastOperator) {
                setExpression((prev) => prev.slice(0, -1) + val);
            } else {
                setExpression((prev) => prev + val);
            }
        }
    };

    const evaluateExpression = async () => {
        if (!expression) return;
        setIsLoading(true);
        setError(null);
        setSteps([]);
        setSummary('');
        setCurrentStepIdx(0);

        try {
            let cleanExpr = expression
                .replace(/×/g, '*')
                .replace(/÷/g, '/')
                .replace(/−/g, '-');

            const computed = evaluate(cleanExpr);

            if (computed === undefined || computed === null || typeof computed === 'object' || isNaN(computed)) {
                throw new Error('Malformed expression');
            }

            if (computed === Infinity || computed === -Infinity) {
                throw new Error('Division by zero');
            }

            const formattedResult = Number.isInteger(computed) 
                ? computed 
                : Math.round(computed * 10000) / 10000;

            setResult(formattedResult);

            if (userId) {
                await logActivity(userId, 'step_by_step_used', {
                    expression: cleanExpr,
                    result: String(formattedResult)
                });
            }

            const prompt = `For the math expression: "${expression}" (where "×" represents multiplication and "÷" represents division).
The mathematically computed correct final answer is: ${formattedResult}.
Generate a step-by-step breakdown of how to solve this expression for a young student.
IMPORTANT: The final answer is already computed and is exactly ${formattedResult}. Do NOT contradict it, calculate a different value, or state a different final number in any step. Your job is ONLY to write simple descriptions of the intermediate calculations leading up to this final correct result.`;

            const schemaDescription = `Return a JSON object matching this exact shape:
{
  "steps": [
    { "description": "String explaining step 1" },
    { "description": "String explaining step 2" }
  ],
  "summary": "String summarizing the final result."
}`;

            const rawJson = await generateStructuredJSON(prompt, schemaDescription);

            if (rawJson && Array.isArray(rawJson.steps) && rawJson.steps.length > 0) {
                const filteredSteps = rawJson.steps.filter((step) => {
                    const desc = step.description;
                    const numbers = desc.match(/-?\d+(\.\d+)?/g);
                    if (!numbers) return true;

                    const isFinalDeclaration = /\b(final|result|answer|total|equals)\b/i.test(desc);
                    if (isFinalDeclaration) {
                        const containsIncorrectFinal = numbers.some((numStr) => {
                            const val = parseFloat(numStr);
                            return Math.abs(val - formattedResult) > 0.001;
                        });
                        const containsCorrect = numbers.some((numStr) => {
                            const val = parseFloat(numStr);
                            return Math.abs(val - formattedResult) <= 0.001;
                        });
                        if (containsIncorrectFinal && !containsCorrect) {
                            return false;
                        }
                    }
                    return true;
                });

                setSteps(filteredSteps);
                setSummary(rawJson.summary || `The final answer is ${formattedResult}.`);
            } else {
                setSteps([{ description: `Perform calculations step-by-step to arrive at the final answer: ${formattedResult}.` }]);
                setSummary(`Final answer is ${formattedResult}.`);
            }
        } catch (err) {
            console.error('Calculator evaluation error:', err);
            if (err.message === 'Division by zero' || err.message.includes('Infinity')) {
                setError('Error: Cannot divide by zero.');
            } else {
                setError('Error: Malformed expression.');
            }
            setResult(null);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-4 w-full flex-1">
            <div className="flex flex-col gap-1">
                <h3 className="text-base-md font-bold text-gray-800 dark:text-gray-150">
                    Dyscalculia-Friendly Calculator
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Type an expression below. SahaAI will calculate the answer and walk you through it step-by-step.
                </p>
            </div>

            {/* Display screen */}
            <div className="text-right p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-700 min-h-[96px] flex flex-col justify-between shadow-inner">
                <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 tracking-wider break-all select-all">
                    {expression || '0'}
                </div>
                <div className="text-2xl font-black text-gray-800 dark:text-gray-100 break-all mt-1">
                    {error ? (
                        <span className="text-red-500 text-sm font-semibold">{error}</span>
                    ) : result !== null ? (
                        `= ${result}`
                    ) : (
                        expression ? ' ' : '0'
                    )}
                </div>
            </div>

            {/* Keypad Grid */}
            <div className="grid grid-cols-4 gap-2.5">
                {buttons.map((btn, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleKeypadPress(btn.value)}
                        className={`
                            min-h-[56px] rounded-xl flex items-center justify-center text-base-md tracking-wide transition-all select-none cursor-pointer
                            active:scale-95 shadow-sm border border-black/5 dark:border-white/5
                            ${btn.color}
                        `}
                    >
                        {btn.label}
                    </button>
                ))}
            </div>

            {/* Loading AI breakdown */}
            {isLoading && (
                <div className="flex flex-col items-center justify-center py-10 gap-3 animate-pulse">
                    <Loader2 className="animate-spin text-primary" size={32} />
                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500 tracking-wider">
                        AI is writing steps...
                    </span>
                </div>
            )}

            {/* Step-by-Step progressively revealed list */}
            {result !== null && steps.length > 0 && !isLoading && (
                <div className="mt-4 flex flex-col gap-4 border-t border-gray-150 dark:border-gray-800 pt-5 animate-fade-in">
                    <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                        Step-by-Step Explanation
                    </h4>
                    
                    <div className="flex flex-col gap-3">
                        {steps.slice(0, currentStepIdx + 1).map((step, idx) => {
                            const isLatest = idx === currentStepIdx;
                            return (
                                <div 
                                    key={idx} 
                                    className={`p-4 rounded-2xl border transition-all duration-300 ${
                                        isLatest 
                                            ? 'bg-[#1b3024] border-emerald-800 shadow-md scale-[1.01] text-white' 
                                            : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 opacity-60'
                                    }`}
                                >
                                    <div className="flex justify-between items-center gap-2">
                                        <span className={`text-[10px] font-black uppercase tracking-wider ${isLatest ? 'text-[#dcedc8]/80' : 'text-gray-400 dark:text-gray-500'}`}>
                                            Step {idx + 1}
                                        </span>
                                    </div>
                                    <div className="mt-1.5">
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

                    {/* Next step / Summary panel */}
                    {currentStepIdx < steps.length - 1 ? (
                        <Button
                            onClick={() => setCurrentStepIdx((prev) => prev + 1)}
                            variant="primary"
                            className="w-full mt-1 font-bold shadow-md"
                        >
                            Next Step
                        </Button>
                    ) : (
                        <div className="p-4 bg-green-500/10 border border-green-500/25 rounded-2xl text-center text-xs font-bold text-green-700 dark:text-green-400 leading-normal animate-scale-in">
                            🎉 {summary || 'All steps completed!'}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
