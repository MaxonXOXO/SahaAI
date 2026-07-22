import { Play, Pencil, Trash2 } from 'lucide-react';
import Card from '../../../shared/components/Card';
import IconButton from '../../../shared/components/IconButton';
import { getRoutineIcon, getRoutineColor } from '../lib/routineIcons';

export default function RoutineCard({ routine, onRun, onEdit, onDelete }) {
    const Icon = getRoutineIcon(routine.icon_name);
    const color = getRoutineColor(routine.color_key);
    const stepCount = Array.isArray(routine.steps) ? routine.steps.length : 0;

    return (
        <Card className={`border-l-4 ${color.border}`}>
            <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${color.bg}`}>
                    <Icon className="text-white" size={22} />
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base-sm text-gray-800 dark:text-gray-100 truncate">
                        {routine.title}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                        {stepCount} {stepCount === 1 ? 'step' : 'steps'}
                    </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    <IconButton icon={Pencil} label={`Edit ${routine.title}`} onClick={() => onEdit(routine)} size={16} />
                    <IconButton icon={Trash2} label={`Delete ${routine.title}`} onClick={() => onDelete(routine)} size={16} />
                    <IconButton
                        icon={Play}
                        label={`Run ${routine.title}`}
                        variant="primary"
                        onClick={() => onRun(routine.id)}
                        size={18}
                    />
                </div>
            </div>
        </Card>
    );
}
