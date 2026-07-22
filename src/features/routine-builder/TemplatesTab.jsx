import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import Card from '../../shared/components/Card';
import Button from '../../shared/components/Button';
import { getRoutineIcon, getRoutineColor } from './lib/routineIcons';
import { ROUTINE_TEMPLATES } from './lib/routineTemplates';
import useProfileStore from '../../store/useProfileStore';
import useRoutineStore from './useRoutineStore';

export default function TemplatesTab({ onCreated }) {
    const userId = useProfileStore((s) => s.id);
    const addRoutine = useRoutineStore((s) => s.addRoutine);
    const [addingKey, setAddingKey] = useState(null);
    const [error, setError] = useState(null);

    const handleUse = async (template) => {
        setError(null);
        setAddingKey(template.key);
        try {
            const created = await addRoutine(userId, {
                title: template.title,
                iconName: template.iconName,
                colorKey: template.colorKey,
                steps: template.steps,
            });
            onCreated(created.id);
        } catch (err) {
            setError(err.message || 'Could not add this template. Please try again.');
        } finally {
            setAddingKey(null);
        }
    };

    return (
        <div className="flex flex-col gap-3">
            <p className="text-xs text-gray-400 px-1">
                Quick-start routines, ready to go — tap one to add it to My Routines.
            </p>

            {error && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 p-3 rounded-card text-xs font-semibold text-red-700 dark:text-red-400">
                    {error}
                </div>
            )}

            {ROUTINE_TEMPLATES.map((template) => {
                const Icon = getRoutineIcon(template.iconName);
                const color = getRoutineColor(template.colorKey);
                const isAdding = addingKey === template.key;
                return (
                    <Card key={template.key} className={`border-l-4 ${color.border}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${color.bg}`}>
                                <Icon className="text-white" size={22} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-base-sm text-gray-800 dark:text-gray-100 truncate">
                                    {template.title}
                                </h3>
                                <p className="text-xs text-gray-400 mt-0.5">{template.steps.length} steps</p>
                            </div>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleUse(template)}
                                disabled={isAdding}
                            >
                                {isAdding ? <Loader2 className="animate-spin" size={14} /> : 'Use this'}
                            </Button>
                        </div>
                    </Card>
                );
            })}
        </div>
    );
}
