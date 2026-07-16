import { CheckCircle2, Circle, Clock, Check } from 'lucide-react';

/**
 * TaskChecklist - Renders step-by-step AI generated breakdown items with ADHD progress feedback.
 */
export default function TaskChecklist({ steps, completedStepIds, onToggleStep, taskTitle }) {
    if (!steps || steps.length === 0) return null;

    const completedCount = completedStepIds.length;
    const totalCount = steps.length;
    const progressPercent = Math.round((completedCount / totalCount) * 100);

    return (
        <div className="flex flex-col gap-4 w-full">
            {/* Header & Overall Progress Bar */}
            <div className="bg-purple-50 dark:bg-purple-950/30 p-4 rounded-2xl border border-purple-100 dark:border-purple-900/40">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base-sm font-bold text-purple-950 dark:text-purple-100 truncate pr-2">
                        {taskTitle || 'Breakdown Steps'}
                    </h3>
                    <span className="text-xs font-black text-purple-600 dark:text-purple-400 bg-white dark:bg-gray-800 px-2.5 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                        {completedCount}/{totalCount} done ({progressPercent}%)
                    </span>
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
                    return (
                        <button
                            key={step.id}
                            onClick={() => onToggleStep(step)}
                            className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-3.5 ${
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
                                    {step.estMinutes && (
                                        <span className="shrink-0 text-[10px] font-bold text-purple-600 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                                            <Clock size={10} />
                                            {step.estMinutes}m
                                        </span>
                                    )}
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
