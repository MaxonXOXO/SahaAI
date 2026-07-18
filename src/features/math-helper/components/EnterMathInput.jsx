import { useState } from 'react';
import Button from '../../../shared/components/Button';

export default function EnterMathInput({ onSubmit }) {
    const [operandA, setOperandA] = useState('');
    const [operandB, setOperandB] = useState('');
    const [operation, setOperation] = useState('+');
    const [error, setError] = useState(null);

    const operations = [
        { id: '+', label: '+' },
        { id: '-', label: '−' },
        { id: '*', label: '×' },
        { id: '/', label: '÷' }
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        setError(null);

        const a = parseFloat(operandA);
        const b = parseFloat(operandB);

        if (isNaN(a) || isNaN(b)) {
            setError('Please enter valid numbers for both spaces.');
            return;
        }

        if (operation === '/' && b === 0) {
            setError('Division by zero is not allowed.');
            return;
        }

        onSubmit({
            operandA: a,
            operandB: b,
            operation
        });
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
            <div className="flex flex-col gap-1">
                <h3 className="text-base-md font-bold text-gray-800 dark:text-gray-150">
                    Custom Math Problem
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Input your own numbers and select an operation. SahaAI will build a visual story problem for you!
                </p>
            </div>

            {/* Error banner */}
            {error && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 p-3 rounded-card text-xs font-semibold text-red-700 dark:text-red-400 leading-normal">
                    {error}
                </div>
            )}

            {/* Operands Inputs */}
            <div className="flex gap-3">
                {/* Operand A */}
                <div className="flex-1 flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">First Number</label>
                    <input
                        type="number"
                        step="any"
                        value={operandA}
                        onChange={(e) => setOperandA(e.target.value)}
                        placeholder="e.g. 5"
                        className="w-full min-h-touch bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-card px-4 text-base-md text-gray-900 dark:text-gray-105 focus:outline-none focus:border-primary"
                        required
                    />
                </div>

                {/* Operand B */}
                <div className="flex-1 flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Second Number</label>
                    <input
                        type="number"
                        step="any"
                        value={operandB}
                        onChange={(e) => setOperandB(e.target.value)}
                        placeholder="e.g. 3"
                        className="w-full min-h-touch bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-card px-4 text-base-md text-gray-900 dark:text-gray-105 focus:outline-none focus:border-primary"
                        required
                    />
                </div>
            </div>

            {/* Operation Toggle Row */}
            <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Operation</label>
                <div className="flex gap-2">
                    {operations.map((op) => {
                        const isSelected = operation === op.id;
                        return (
                            <button
                                key={op.id}
                                type="button"
                                onClick={() => {
                                    setOperation(op.id);
                                    setError(null);
                                }}
                                className={`
                                    flex-1 min-h-touch rounded-xl text-base-md font-extrabold transition-all border-2 select-none cursor-pointer
                                    ${isSelected 
                                        ? 'bg-primary border-primary text-white shadow-sm' 
                                        : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-200'}
                                `}
                            >
                                {op.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Submit Button */}
            <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-2"
            >
                Generate Visual Story
            </Button>
        </form>
    );
}
