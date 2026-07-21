import { useState } from 'react';
import { Sparkles, ArrowRight, Lightbulb } from 'lucide-react';

const SAMPLE_PROMPTS = [
    'Clean my bedroom and organize my desk',
    'Prepare for upcoming math exam',
    'Write an essay for history class',
    'Cook a healthy dinner from scratch',
];

/**
 * TaskInput - Lets ADHD users type or pick a complex task to break down into actionable steps.
 */
export default function TaskInput({ onGenerateBreakdown, isLoading }) {
    const [taskText, setTaskText] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!taskText.trim() || isLoading) return;
        onGenerateBreakdown(taskText.trim());
    };

    const handleSelectSample = (prompt) => {
        setTaskText(prompt);
        onGenerateBreakdown(prompt);
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full bg-slate-900/80 border border-slate-700/60 shadow-2xl shadow-indigo-950/60 backdrop-blur-md p-4 rounded-2xl">
            <div className="flex flex-col gap-1.5">
                <label htmlFor="task-prompt" className="text-base-sm font-bold text-slate-100 flex items-center gap-2">
                    <Sparkles size={18} className="text-amber-400" />
                    What task do you want to tackle?
                </label>
                <div className="relative">
                    <input
                        id="task-prompt"
                        type="text"
                        placeholder="e.g., Clean my room and study for biology test..."
                        value={taskText}
                        onChange={(e) => setTaskText(e.target.value)}
                        disabled={isLoading}
                        className="w-full pl-4 pr-12 py-3.5 rounded-2xl border border-slate-700 bg-slate-950/90 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all font-medium text-base-sm"
                    />
                    <button
                        type="submit"
                        disabled={!taskText.trim() || isLoading}
                        aria-label="Generate Task Breakdown"
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white flex items-center justify-center transition-all shadow-md shadow-indigo-600/30"
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <ArrowRight size={18} />
                        )}
                    </button>
                </div>
            </div>

            {/* ADHD Friendly Sample Quick Starters */}
            <div className="flex flex-col gap-2 pt-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Lightbulb size={12} className="text-amber-400" />
                    Or pick a quick start prompt:
                </span>
                <div className="flex flex-wrap gap-2">
                    {SAMPLE_PROMPTS.map((prompt) => (
                        <button
                            key={prompt}
                            type="button"
                            onClick={() => handleSelectSample(prompt)}
                            disabled={isLoading}
                            className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-700/80 bg-slate-950/70 text-slate-300 hover:bg-slate-800 transition-all text-left"
                        >
                            + {prompt}
                        </button>
                    ))}
                </div>
            </div>
        </form>
    );
}
