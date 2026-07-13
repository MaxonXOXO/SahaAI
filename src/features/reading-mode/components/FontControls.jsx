import { Minus, Plus } from 'lucide-react';

/**
 * FontControls Component
 * Provides dropdown / picker for font choices (OpenDyslexic & System Default)
 * and step-sizing controls for reader size settings.
 */
export default function FontControls({
    fontFamily,
    onChangeFontFamily,
    fontSize,
    onIncreaseFontSize,
    onDecreaseFontSize
}) {
    const fonts = [
        { id: 'font-opendyslexic', name: 'OpenDyslexic' },
        { id: 'font-sans-default', name: 'System Default' }
    ];

    // Helper map to display size step labels
    const sizeLabels = {
        'text-base-sm': 'Small',
        'text-base-md': 'Medium',
        'text-base-lg': 'Large',
        'text-base-xl': 'Extra Large'
    };

    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-card p-4 shadow-lg flex flex-col gap-3 w-full">
            {/* Font Dropdown Select */}
            <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Font Family
                </span>
                <div className="relative">
                    <select
                        value={fontFamily}
                        onChange={(e) => onChangeFontFamily(e.target.value)}
                        className="w-full min-h-touch bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-card px-3 text-base-sm font-semibold text-gray-700 dark:text-gray-200 focus:outline-none focus:border-primary appearance-none cursor-pointer"
                    >
                        {fonts.map((f) => (
                            <option key={f.id} value={f.id}>
                                {f.name}
                            </option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                        </svg>
                    </div>
                </div>
            </div>

            {/* Font Size Step controls */}
            <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Font Size
                </span>
                <div className="flex items-center justify-between gap-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-card p-1">
                    <button
                        onClick={onDecreaseFontSize}
                        disabled={fontSize === 'text-base-sm'}
                        aria-label="Decrease Font Size"
                        className="min-h-touch min-w-touch flex items-center justify-center rounded-card text-gray-500 hover:text-primary dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                        <Minus size={16} />
                    </button>
                    <span className="text-base-sm font-extrabold text-gray-700 dark:text-gray-200">
                        {sizeLabels[fontSize] || 'Medium'}
                    </span>
                    <button
                        onClick={onIncreaseFontSize}
                        disabled={fontSize === 'text-base-xl'}
                        aria-label="Increase Font Size"
                        className="min-h-touch min-w-touch flex items-center justify-center rounded-card text-gray-500 hover:text-primary dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                        <Plus size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
