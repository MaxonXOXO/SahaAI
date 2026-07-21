import { useState, useEffect } from 'react';
import { Sparkles, CheckCircle, Clock, XCircle, Send, Check } from 'lucide-react';
import useFocusStore from '../useFocusStore';

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

const HELPED_CHIPS = ['Quiet room', 'Music', 'Timer pressure', 'Deadline', 'Body doubling'];
const HINDERED_CHIPS = ['Phone', 'Noise', 'Wandering thoughts', 'People', 'Tiredness'];
const MOOD_OPTIONS = ['😤', '😐', '🙂', '😄'];

/**
 * SessionSummary - Low-effort, tap-only ADHD self-compassion check-in ritual.
 * Pre-selects outcome based on real task breakdown progress, auto-saves on outcome tap,
 * and collects optional tap chips (helped, hindered, mood).
 */
export default function SessionSummary({ onSubmitCheckIn, initialStatus = 'not_completed' }) {
    const lastSessionDate = useFocusStore((s) => s.lastSessionDate);
    const rawSessionsToday = useFocusStore((s) => s.sessionsToday);

    const todayStr = new Date().toISOString().split('T')[0];
    const sessionsToday = lastSessionDate === todayStr ? rawSessionsToday : 0;

    const [selectedStatus, setSelectedStatus] = useState(initialStatus);
    const [savedStatus, setSavedStatus] = useState(null);
    const [hasInteracted, setHasInteracted] = useState(false);

    // Tap-chip states
    const [helped, setHelped] = useState([]);
    const [showHelpedOther, setShowHelpedOther] = useState(false);
    const [helpedOtherText, setHelpedOtherText] = useState('');

    const [hindered, setHindered] = useState([]);
    const [showHinderedOther, setShowHinderedOther] = useState(false);
    const [hinderedOtherText, setHinderedOtherText] = useState('');

    const [selectedMood, setSelectedMood] = useState(null);
    const [notes, setNotes] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

    useEffect(() => {
        if (!hasInteracted) {
            setSelectedStatus(initialStatus);
        }
    }, [initialStatus, hasInteracted]);

    const activeOption = REFLECTION_OPTIONS.find((opt) => opt.id === selectedStatus) || REFLECTION_OPTIONS[1];

    const getFinalHelped = () => {
        const list = [...helped];
        if (showHelpedOther && helpedOtherText.trim()) {
            list.push(helpedOtherText.trim());
        }
        return list;
    };

    const getFinalHindered = () => {
        const list = [...hindered];
        if (showHinderedOther && hinderedOtherText.trim()) {
            list.push(hinderedOtherText.trim());
        }
        return list;
    };

    const handleSelectStatus = (statusId) => {
        setHasInteracted(true);
        setSelectedStatus(statusId);
        setSavedStatus(statusId);

        if (onSubmitCheckIn) {
            onSubmitCheckIn({
                status: statusId,
                helped: getFinalHelped(),
                hindered: getFinalHindered(),
                mood: selectedMood,
                notes: notes,
                isFullFinished: false,
            });
        }
    };

    const toggleHelpedChip = (chip) => {
        setHelped((prev) =>
            prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
        );
    };

    const toggleHinderedChip = (chip) => {
        setHindered((prev) =>
            prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitted(true);
        if (onSubmitCheckIn) {
            onSubmitCheckIn({
                status: selectedStatus,
                helped: getFinalHelped(),
                hindered: getFinalHindered(),
                mood: selectedMood,
                notes: notes,
                isFullFinished: true,
            });
        }
    };

    return (
        <div className="flex flex-col gap-4 w-full">
            {/* Header: One Line Only */}
            <div className="bg-slate-900/80 border border-slate-700/60 shadow-xl shadow-indigo-950/50 backdrop-blur-md p-4 rounded-2xl">
                <h2 className="text-base-md font-bold text-slate-100">
                    How did it go? 💛
                </h2>
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
                        const isSaved = savedStatus === opt.id;

                        return (
                            <button
                                key={opt.id}
                                type="button"
                                onClick={() => handleSelectStatus(opt.id)}
                                className={`w-full p-3.5 rounded-2xl border-[1.5px] font-bold text-xs sm:text-base-sm flex items-center justify-between transition-all ${
                                    isSelected
                                        ? 'border-amber-500 bg-amber-950/40 text-amber-200 shadow-lg shadow-amber-950/50'
                                        : 'bg-slate-900/80 border-slate-700/80 text-slate-300 hover:border-slate-500'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Icon size={18} className={isSelected ? 'text-amber-400' : 'text-slate-400'} />
                                    <span>{opt.label}</span>
                                </div>
                                {isSaved ? (
                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 flex items-center gap-1">
                                        <Check size={10} /> Saved
                                    </span>
                                ) : isSelected && !hasInteracted ? (
                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-500/50">
                                        Auto-detected
                                    </span>
                                ) : null}
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
                <div className="text-xs font-semibold text-slate-400 text-center pt-1 border-t border-amber-800/40 mt-1">
                    ✨ {sessionsToday} session{sessionsToday !== 1 ? 's' : ''} today
                </div>
            </div>

            {/* Optional Tap Ritual Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Mood Selection Row */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-300">
                        How do you feel now?
                    </label>
                    <div className="flex items-center justify-between gap-2">
                        {MOOD_OPTIONS.map((emoji) => {
                            const isMoodSelected = selectedMood === emoji;
                            return (
                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => setSelectedMood(isMoodSelected ? null : emoji)}
                                    className={`flex-1 py-2 text-xl rounded-xl transition-all border ${
                                        isMoodSelected
                                            ? 'border-amber-400 bg-amber-950/60 shadow-md shadow-amber-950/50 scale-105'
                                            : 'border-slate-800 bg-slate-950/60 opacity-60 hover:opacity-100'
                                    }`}
                                >
                                    {emoji}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* What Helped? Chip Group */}
                <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold text-slate-300">
                        What helped?
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                        {HELPED_CHIPS.map((chip) => {
                            const isSelected = helped.includes(chip);
                            return (
                                <button
                                    key={chip}
                                    type="button"
                                    onClick={() => toggleHelpedChip(chip)}
                                    className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
                                        isSelected
                                            ? 'bg-indigo-600/90 border-indigo-500 text-white shadow-md shadow-indigo-600/30'
                                            : 'bg-slate-950/80 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                                    }`}
                                >
                                    {chip}
                                </button>
                            );
                        })}
                        <button
                            type="button"
                            onClick={() => setShowHelpedOther((prev) => !prev)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
                                showHelpedOther
                                    ? 'bg-indigo-600/90 border-indigo-500 text-white shadow-md shadow-indigo-600/30'
                                    : 'bg-slate-950/80 border-slate-700/80 text-slate-400 hover:bg-slate-800'
                            }`}
                        >
                            ✎ Other
                        </button>
                    </div>
                    {showHelpedOther && (
                        <input
                            type="text"
                            placeholder="What else helped?"
                            value={helpedOtherText}
                            onChange={(e) => setHelpedOtherText(e.target.value)}
                            className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 mt-1"
                        />
                    )}
                </div>

                {/* What Got in the Way? Chip Group */}
                <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold text-slate-300">
                        What got in the way?
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                        {HINDERED_CHIPS.map((chip) => {
                            const isSelected = hindered.includes(chip);
                            return (
                                <button
                                    key={chip}
                                    type="button"
                                    onClick={() => toggleHinderedChip(chip)}
                                    className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
                                        isSelected
                                            ? 'bg-amber-600/90 border-amber-500 text-white shadow-md shadow-amber-600/30'
                                            : 'bg-slate-950/80 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                                    }`}
                                >
                                    {chip}
                                </button>
                            );
                        })}
                        <button
                            type="button"
                            onClick={() => setShowHinderedOther((prev) => !prev)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
                                showHinderedOther
                                    ? 'bg-amber-600/90 border-amber-500 text-white shadow-md shadow-amber-600/30'
                                    : 'bg-slate-950/80 border-slate-700/80 text-slate-400 hover:bg-slate-800'
                            }`}
                        >
                            ✎ Other
                        </button>
                    </div>
                    {showHinderedOther && (
                        <input
                            type="text"
                            placeholder="What else got in the way?"
                            value={hinderedOtherText}
                            onChange={(e) => setHinderedOtherText(e.target.value)}
                            className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 mt-1"
                        />
                    )}
                </div>

                {/* Optional Freeform Reflection */}
                <div className="flex flex-col gap-1">
                    <label htmlFor="checkin-notes" className="text-xs font-bold text-slate-300">
                        Quick Note (Optional):
                    </label>
                    <textarea
                        id="checkin-notes"
                        rows={2}
                        placeholder="Any extra thoughts..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-700 bg-slate-950/90 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
                    />
                </div>

                {/* Finish Button */}
                <button
                    type="submit"
                    className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-98 cursor-pointer"
                >
                    <Send size={16} />
                    {isSubmitted ? 'Finished ✓' : 'Add reflection & finish'}
                </button>
            </form>
        </div>
    );
}
