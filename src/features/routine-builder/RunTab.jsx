import { useEffect, useMemo, useState } from 'react';
import { Check, PartyPopper, RotateCcw, ListChecks } from 'lucide-react';
import Card from '../../shared/components/Card';
import Button from '../../shared/components/Button';
import useProfileStore from '../../store/useProfileStore';
import useRoutineStore from './useRoutineStore';
import { getRoutineIcon, getRoutineColor } from './lib/routineIcons';
import { logActivity } from '../../shared/lib/logActivity';

export default function RunTab({ onNeedRoutines }) {
    const userId = useProfileStore((s) => s.id);
    const routines = useRoutineStore((s) => s.routines);
    const activeRoutineId = useRoutineStore((s) => s.activeRoutineId);
    const setActiveRoutineId = useRoutineStore((s) => s.setActiveRoutineId);

    const routine = useMemo(
        () => routines.find((r) => r.id === activeRoutineId) || null,
        [routines, activeRoutineId]
    );

    const [stepIndex, setStepIndex] = useState(0);
    const [finished, setFinished] = useState(false);

    // Reset run progress whenever the selected routine changes.
    useEffect(() => {
        setStepIndex(0);
        setFinished(false);
    }, [activeRoutineId]);

    if (routines.length === 0) {
        return (
            <div className="flex flex-col items-center text-center gap-3 py-10 text-gray-400">
                <ListChecks size={32} />
                <p className="text-sm font-medium">No routines to run yet</p>
                <Button variant="secondary" onClick={onNeedRoutines}>
                    Build a routine first
                </Button>
            </div>
        );
    }

    if (!routine) {
        return (
            <div className="flex flex-col gap-2">
                <p className="text-xs text-gray-400 px-1 mb-1">Pick a routine to run:</p>
                {routines.map((r) => {
                    const Icon = getRoutineIcon(r.icon_name);
                    const color = getRoutineColor(r.color_key);
                    return (
                        <button
                            key={r.id}
                            onClick={() => setActiveRoutineId(r.id)}
                            className="flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-card p-3 min-h-touch text-left hover:border-primary/40"
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${color.bg}`}>
                                <Icon className="text-white" size={18} />
                            </div>
                            <span className="font-semibold text-base-sm text-gray-800 dark:text-gray-100">
                                {r.title}
                            </span>
                        </button>
                    );
                })}
            </div>
        );
    }

    const steps = routine.steps || [];
    const color = getRoutineColor(routine.color_key);
    const currentStep = steps[stepIndex];

    const handleDone = async () => {
        if (!currentStep) return;
        await logActivity(userId, 'routine_step_completed', {
            routine_id: routine.id,
            step_id: currentStep.id,
            step_index: stepIndex,
        });

        if (stepIndex + 1 >= steps.length) {
            setFinished(true);
            await logActivity(userId, 'routine_followed', {
                routine_id: routine.id,
                total_steps: steps.length,
            });
        } else {
            setStepIndex((i) => i + 1);
        }
    };

    const handleRestart = () => {
        setStepIndex(0);
        setFinished(false);
    };

    const handleSwitchRoutine = () => {
        setActiveRoutineId(null);
    };

    if (finished) {
        return (
            <Card className="text-center">
                <div className="flex flex-col items-center gap-3 py-4">
                    <PartyPopper size={40} className={color.text} />
                    <h3 className="font-bold text-base-md text-gray-800 dark:text-gray-100">Nice work!</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        You finished "{routine.title}".
                    </p>
                    <div className="flex gap-2 mt-2 w-full">
                        <Button variant="secondary" onClick={handleSwitchRoutine} className="flex-1">
                            Choose another
                        </Button>
                        <Button variant="primary" onClick={handleRestart} icon={RotateCcw} className="flex-1">
                            Run again
                        </Button>
                    </div>
                </div>
            </Card>
        );
    }

    const StepIcon = getRoutineIcon(currentStep?.iconName);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-1">
                <button onClick={handleSwitchRoutine} className="text-xs font-semibold text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                    ← Switch routine
                </button>
                <span className="text-xs font-bold text-gray-400">
                    Step {stepIndex + 1} of {steps.length}
                </span>
            </div>

            {/* Progress dots */}
            <div className="flex gap-1.5 justify-center">
                {steps.map((s, i) => (
                    <div
                        key={s.id || i}
                        className={`h-2 rounded-full transition-all ${
                            i === stepIndex ? `w-6 ${color.bg}` : i < stepIndex ? `w-2 ${color.bg} opacity-50` : 'w-2 bg-gray-200 dark:bg-gray-700'
                        }`}
                    />
                ))}
            </div>

            <Card className="flex flex-col items-center gap-5 py-10 text-center">
                <div className={`w-28 h-28 rounded-full flex items-center justify-center ${color.bg}`}>
                    <StepIcon className="text-white" size={52} />
                </div>
                <h2 className="text-base-lg font-bold text-gray-800 dark:text-gray-100 px-4">
                    {currentStep?.label}
                </h2>
            </Card>

            <Button variant="primary" size="lg" icon={Check} onClick={handleDone}>
                Done — Next step
            </Button>
        </div>
    );
}
