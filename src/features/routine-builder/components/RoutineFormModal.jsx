import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Trash2, ChevronUp, ChevronDown, Wand2, Loader2 } from 'lucide-react';
import Button from '../../../shared/components/Button';
import IconPickerGrid from './IconPickerGrid';
import { ROUTINE_COLORS, getRoutineIcon } from '../lib/routineIcons';
import { generateRoutineSteps } from '../lib/aiSteps';
import useProfileStore from '../../../store/useProfileStore';
import useRoutineStore from '../useRoutineStore';

const makeStepId = () =>
    crypto.randomUUID ? crypto.randomUUID() : `step-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const emptyStep = () => ({ id: makeStepId(), label: '', iconName: 'Star' });

/**
 * RoutineFormModal — create or edit a routine: name, picture, color tag,
 * and an ordered list of steps (each with its own picture). Includes an
 * optional "AI: Suggest steps" action that fills the list in one tap.
 */
export default function RoutineFormModal({ routine, onClose, onSaved }) {
    const isEditing = !!routine;
    const userId = useProfileStore((s) => s.id);
    const profile = useProfileStore((s) => s);
    const addRoutine = useRoutineStore((s) => s.addRoutine);
    const editRoutine = useRoutineStore((s) => s.editRoutine);

    const [title, setTitle] = useState(routine?.title || '');
    const [iconName, setIconName] = useState(routine?.icon_name || 'Sun');
    const [colorKey, setColorKey] = useState(routine?.color_key || 'primary');
    const [steps, setSteps] = useState(
        routine?.steps?.length
            ? routine.steps.map((s) => ({ ...s, id: s.id || makeStepId() }))
            : [emptyStep(), emptyStep(), emptyStep()]
    );
    const [showRoutineIconPicker, setShowRoutineIconPicker] = useState(false);
    const [stepIconPickerId, setStepIconPickerId] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const color = ROUTINE_COLORS.find((c) => c.key === colorKey) || ROUTINE_COLORS[0];
    const RoutineIcon = getRoutineIcon(iconName);

    const updateStep = (id, updates) => {
        setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    };

    const removeStep = (id) => {
        setSteps((prev) => (prev.length > 1 ? prev.filter((s) => s.id !== id) : prev));
    };

    const addStep = () => setSteps((prev) => [...prev, emptyStep()]);

    const moveStep = (id, direction) => {
        setSteps((prev) => {
            const idx = prev.findIndex((s) => s.id === id);
            const swapWith = idx + direction;
            if (idx < 0 || swapWith < 0 || swapWith >= prev.length) return prev;
            const next = [...prev];
            [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
            return next;
        });
    };

    const handleAiSuggest = async () => {
        if (!title.trim()) {
            setError('Give the routine a title first — then AI can suggest steps for it.');
            return;
        }
        setError(null);
        setAiLoading(true);
        try {
            const suggested = await generateRoutineSteps(title, profile);
            if (suggested.length) {
                setSteps(suggested.map((s) => ({ id: makeStepId(), label: s.label, iconName: s.iconName })));
            } else {
                setError("Couldn't generate steps right now — feel free to add them by hand below.");
            }
        } finally {
            setAiLoading(false);
        }
    };

    const handleSave = async () => {
        const cleanTitle = title.trim();
        const cleanSteps = steps.map((s) => ({ ...s, label: s.label.trim() })).filter((s) => s.label);

        if (!cleanTitle) {
            setError('Give your routine a name.');
            return;
        }
        if (cleanSteps.length === 0) {
            setError('Add at least one step.');
            return;
        }

        setSaving(true);
        setError(null);
        try {
            const payload = { title: cleanTitle, iconName, colorKey, steps: cleanSteps };
            const saved = isEditing
                ? await editRoutine(routine.id, payload)
                : await addRoutine(userId, payload);
            onSaved(saved);
        } catch (err) {
            setError(err.message || 'Could not save this routine. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-t-3xl sm:rounded-3xl p-5 w-full max-w-[420px] max-h-[88vh] overflow-y-auto shadow-2xl relative"
            >
                <button
                    onClick={onClose}
                    aria-label="Close"
                    className="absolute top-4 right-4 min-h-touch min-w-touch flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"
                >
                    <X size={18} />
                </button>

                <h3 className="text-base-md font-bold text-gray-800 dark:text-gray-100 mb-4 pr-8">
                    {isEditing ? 'Edit Routine' : 'New Routine'}
                </h3>

                {error && (
                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 p-3 rounded-card text-xs font-semibold text-red-700 dark:text-red-400 mb-4">
                        {error}
                    </div>
                )}

                {/* Title + picture/color */}
                <div className="flex items-center gap-3 mb-4">
                    <button
                        type="button"
                        onClick={() => setShowRoutineIconPicker((v) => !v)}
                        aria-label="Choose routine picture"
                        className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${color.bg}`}
                    >
                        <RoutineIcon className="text-white" size={26} />
                    </button>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Morning Routine"
                        className="flex-1 min-h-touch bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-card px-4 text-base-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary"
                    />
                </div>

                {showRoutineIconPicker && (
                    <div className="mb-4 flex flex-col gap-3">
                        <IconPickerGrid value={iconName} onChange={setIconName} colorClass={color.bg} />
                        <div className="flex gap-2">
                            {ROUTINE_COLORS.map((c) => (
                                <button
                                    key={c.key}
                                    type="button"
                                    aria-label={c.label}
                                    aria-pressed={colorKey === c.key}
                                    onClick={() => setColorKey(c.key)}
                                    className={`w-8 h-8 rounded-full ${c.bg} ${colorKey === c.key ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* AI Suggest */}
                <Button
                    type="button"
                    variant="secondary"
                    onClick={handleAiSuggest}
                    disabled={aiLoading}
                    className="w-full mb-4"
                    icon={aiLoading ? Loader2 : Wand2}
                >
                    {aiLoading ? 'Thinking of steps...' : 'AI: Suggest steps for me'}
                </Button>

                {/* Steps */}
                <div className="flex flex-col gap-2 mb-3">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Steps</label>
                    {steps.map((step, idx) => {
                        const StepIcon = getRoutineIcon(step.iconName);
                        const pickerOpen = stepIconPickerId === step.id;
                        return (
                            <div key={step.id} className="flex flex-col gap-2 bg-gray-50 dark:bg-gray-800/60 rounded-card p-2">
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setStepIconPickerId(pickerOpen ? null : step.id)}
                                        aria-label="Choose step picture"
                                        className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0"
                                    >
                                        <StepIcon size={18} className="text-gray-600 dark:text-gray-300" />
                                    </button>
                                    <input
                                        type="text"
                                        value={step.label}
                                        onChange={(e) => updateStep(step.id, { label: e.target.value })}
                                        placeholder={`Step ${idx + 1}`}
                                        className="flex-1 min-h-touch bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-card px-3 text-base-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary"
                                    />
                                    <div className="flex flex-col shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => moveStep(step.id, -1)}
                                            disabled={idx === 0}
                                            aria-label="Move step up"
                                            className="text-gray-400 disabled:opacity-30 hover:text-gray-700 dark:hover:text-gray-200"
                                        >
                                            <ChevronUp size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => moveStep(step.id, 1)}
                                            disabled={idx === steps.length - 1}
                                            aria-label="Move step down"
                                            className="text-gray-400 disabled:opacity-30 hover:text-gray-700 dark:hover:text-gray-200"
                                        >
                                            <ChevronDown size={16} />
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeStep(step.id)}
                                        aria-label="Remove step"
                                        disabled={steps.length <= 1}
                                        className="min-h-touch min-w-touch flex items-center justify-center text-gray-400 hover:text-red-500 disabled:opacity-30 shrink-0"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                {pickerOpen && (
                                    <IconPickerGrid
                                        value={step.iconName}
                                        onChange={(name) => updateStep(step.id, { iconName: name })}
                                        colorClass={color.bg}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>

                <button
                    type="button"
                    onClick={addStep}
                    className="w-full flex items-center justify-center gap-1.5 text-primary font-semibold text-sm py-2.5 mb-4 rounded-card border-2 border-dashed border-primary/30 hover:bg-primary/5"
                >
                    <Plus size={16} /> Add step
                </button>

                <div className="flex gap-2.5">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={saving} className="flex-1">
                        Cancel
                    </Button>
                    <Button type="button" variant="primary" onClick={handleSave} disabled={saving} className="flex-1 font-bold">
                        {saving ? (
                            <span className="flex items-center justify-center gap-1.5">
                                <Loader2 className="animate-spin" size={14} /> Saving...
                            </span>
                        ) : isEditing ? (
                            'Save Changes'
                        ) : (
                            'Create Routine'
                        )}
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}
