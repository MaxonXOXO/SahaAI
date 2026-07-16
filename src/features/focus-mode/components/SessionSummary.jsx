import { useState } from 'react';
import { Sparkles, HeartHandshake, CheckCircle, Clock, XCircle, Send } from 'lucide-react';

const REFLECTION_OPTIONS = [
    {
        id: 'completed',
        label: 'Completed Everything',
        icon: CheckCircle,
        color: 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300',
        badge: '🌟 Super Focus Hero',
        feedback: "Incredible effort! You stayed focused and completed your goals. Give yourself credit for this win!",
    },
    {
        id: 'partially',
        label: 'Partially Completed',
        icon: Clock,
        color: 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300',
        badge: '🌗 Progress Champion',
        feedback: "Awesome progress! Partial completion is still forward movement. Every step forward counts!",
    },
    {
        id: 'not_completed',
        label: 'Not Completed Yet',
        icon: XCircle,
        color: 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300',
        badge: '🌱 Resilient Starter',
        feedback: "That's completely okay! Showing up and starting is victory #1. Taking breaks & resetting is part of the process.",
    },
];

/**
 * SessionSummary - End-of-session ADHD self-compassion check-in.
 */
export default function SessionSummary({ onSubmitCheckIn }) {
    const [selectedStatus, setSelectedStatus] = useState('partially');
    const [notes, setNotes] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

    const activeOption = REFLECTION_OPTIONS.find((opt) => opt.id === selectedStatus) || REFLECTION_OPTIONS[1];

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitted(true);
        if (onSubmitCheckIn) {
            onSubmitCheckIn({
                status: selectedStatus,
                notes,
            });
        }
    };

    return (
        <div className="flex flex-col gap-5 w-full">
            {/* Encouraging Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-5 rounded-2xl shadow-md">
                <div className="flex items-center gap-2 mb-1">
                    <HeartHandshake size={24} className="text-amber-300" />
                    <h2 className="text-base-md font-bold">Session Reflection</h2>
                </div>
                <p className="text-xs text-purple-100 leading-relaxed">
                    Reflecting helps build self-awareness without judgment. How did your focus time go?
                </p>
            </div>

            {/* Reflection Selection */}
            <div className="flex flex-col gap-3">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
                    Select your session outcome:
                </span>
                <div className="grid grid-cols-1 gap-2.5">
                    {REFLECTION_OPTIONS.map((opt) => {
                        const Icon = opt.icon;
                        const isSelected = selectedStatus === opt.id;
                        return (
                            <button
                                key={opt.id}
                                type="button"
                                onClick={() => setSelectedStatus(opt.id)}
                                className={`w-full p-4 rounded-2xl border-2 font-bold text-base-sm flex items-center justify-between transition-all ${
                                    isSelected
                                        ? `${opt.color} shadow-sm scale-[1.01]`
                                        : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-750 text-gray-700 dark:text-gray-300'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Icon size={22} />
                                    <span>{opt.label}</span>
                                </div>
                                {isSelected && (
                                    <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-white dark:bg-gray-800 border border-current">
                                        Selected
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* AI Encouragement Feedback Card */}
            <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-amber-500" />
                    <span className="text-xs font-bold text-purple-900 dark:text-purple-200 uppercase tracking-wider">
                        {activeOption.badge}
                    </span>
                </div>
                <p className="text-xs text-purple-950 dark:text-purple-100 font-medium leading-relaxed">
                    "{activeOption.feedback}"
                </p>
            </div>

            {/* Reflection Notes Input */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                    <label htmlFor="checkin-notes" className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        Quick Reflection (Optional):
                    </label>
                    <textarea
                        id="checkin-notes"
                        rows={2}
                        placeholder="What helped you focus? Any distractions to avoid next time?"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                </div>

                <button
                    type="submit"
                    className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-base-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-98"
                >
                    <Send size={16} />
                    {isSubmitted ? 'Check-In Saved! 🎉' : 'Save Session Check-In'}
                </button>
            </form>
        </div>
    );
}
