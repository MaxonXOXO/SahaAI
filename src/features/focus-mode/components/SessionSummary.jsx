import { useState, useEffect } from 'react';
import { Sparkles, CheckCircle, Clock, XCircle, Send } from 'lucide-react';

const REFLECTION_OPTIONS = [
    {
        id: 'completed',
        label: 'Completed Everything',
        icon: CheckCircle,
        badge: '🌟 Super Focus Hero',
        feedback: "Incredible effort! You stayed focused and completed your goals. Give yourself credit for this win!",
    },
    {
        id: 'partially',
        label: 'Partially Completed',
        icon: Clock,
        badge: '🌗 Progress Champion',
        feedback: "Awesome progress! Partial completion is still forward movement. Every step forward counts!",
    },
    {
        id: 'not_completed',
        label: 'Not Completed Yet',
        icon: XCircle,
        badge: '🌱 Resilient Starter',
        feedback: "That's completely okay! Showing up and starting is victory #1. Taking breaks & resetting is part of the process.",
    },
];

/**
 * SessionSummary - End-of-session ADHD self-compassion check-in.
 * Pre-selects outcome based on real task breakdown progress, allowing manual override.
 */
export default function SessionSummary({ onSubmitCheckIn, initialStatus = 'not_completed' }) {
    const [selectedStatus, setSelectedStatus] = useState(initialStatus);
    const [hasInteracted, setHasInteracted] = useState(false);
    const [notes, setNotes] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

    useEffect(() => {
        if (!hasInteracted) {
            setSelectedStatus(initialStatus);
        }
    }, [initialStatus, hasInteracted]);

    const activeOption = REFLECTION_OPTIONS.find((opt) => opt.id === selectedStatus) || REFLECTION_OPTIONS[1];

    const handleSelectStatus = (statusId) => {
        setHasInteracted(true);
        setSelectedStatus(statusId);
    };

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
        <div className="flex flex-col gap-4 w-full">
            {/* Space Floating Hero Card */}
            <div className="bg-slate-900/80 border border-slate-700/60 shadow-2xl shadow-indigo-950/60 backdrop-blur-md p-5 rounded-2xl flex flex-col gap-1">
                <h2 className="text-base-md font-bold text-slate-100">
                    How did it go? 💛
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                    Reflecting builds self-awareness without judgment.
                </p>
            </div>

            {/* Reflection Selection */}
            <div className="flex flex-col gap-2.5">
                <span className="text-xs font-bold text-slate-300">
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
                                onClick={() => handleSelectStatus(opt.id)}
                                className={`w-full p-4 rounded-2xl border-[1.5px] font-bold text-base-sm flex items-center justify-between transition-all ${
                                    isSelected
                                        ? 'border-amber-500 bg-amber-950/40 text-amber-200 shadow-lg shadow-amber-950/50'
                                        : 'bg-slate-900/80 border-slate-700/80 text-slate-300 hover:border-slate-500'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Icon size={20} className={isSelected ? 'text-amber-400' : 'text-slate-400'} />
                                    <span>{opt.label}</span>
                                </div>
                                {isSelected && !hasInteracted && (
                                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-500/50">
                                        Auto-detected
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* AI Encouragement Feedback Card — Soft Amber */}
            <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-800/60 shadow-lg flex flex-col gap-1.5 backdrop-blur-xs">
                <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-amber-400" />
                    <span className="text-xs font-bold text-amber-200 uppercase tracking-wider">
                        {activeOption.badge}
                    </span>
                </div>
                <p className="text-xs text-amber-100 font-medium leading-relaxed">
                    "{activeOption.feedback}"
                </p>
            </div>

            {/* Reflection Notes Input */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                    <label htmlFor="checkin-notes" className="text-xs font-bold text-slate-300">
                        Quick Reflection (Optional):
                    </label>
                    <textarea
                        id="checkin-notes"
                        rows={2}
                        placeholder="What helped you focus? Any distractions to avoid next time?"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-700 bg-slate-900/90 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
                    />
                </div>

                <button
                    type="submit"
                    className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-98"
                >
                    <Send size={16} />
                    {isSubmitted ? 'Check-In Saved! 🎉' : 'Save Session Check-In'}
                </button>
            </form>
        </div>
    );
}
