import { ROUTINE_ICONS } from '../lib/routineIcons';

/**
 * IconPickerGrid — small scrollable grid of Lucide icons to pick from.
 * No image API involved; every icon is bundled with the app already.
 */
export default function IconPickerGrid({ value, onChange, colorClass = 'bg-primary' }) {
    return (
        <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto p-1">
            {ROUTINE_ICONS.map(({ name, label, Icon }) => {
                const isSelected = value === name;
                return (
                    <button
                        key={name}
                        type="button"
                        onClick={() => onChange(name)}
                        aria-label={label}
                        aria-pressed={isSelected}
                        className={`min-h-touch aspect-square flex items-center justify-center rounded-xl border-2 transition-colors ${
                            isSelected
                                ? `${colorClass} border-transparent text-white`
                                : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-primary/40'
                        }`}
                    >
                        <Icon size={18} />
                    </button>
                );
            })}
        </div>
    );
}
