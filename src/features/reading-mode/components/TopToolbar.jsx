import { Type, Sliders, Eye, MoreHorizontal } from 'lucide-react';

/**
 * TopToolbar Component
 * Renders control buttons for adjusting reader configurations.
 * Respects min-h-touch target constraints.
 */
export default function TopToolbar({
    onToggleFonts,
    onToggleSpacing,
    onToggleOverlay,
    onToggleMore,
    activeTab
}) {
    return (
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 w-full">
            <button
                onClick={onToggleFonts}
                aria-label="Font Settings"
                className={`flex-1 min-h-touch flex flex-col items-center justify-center gap-1 rounded-card transition-colors ${
                    activeTab === 'fonts' ? 'text-primary font-bold bg-primary/5' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
            >
                <Type size={20} className={activeTab === 'fonts' ? 'text-primary' : 'text-gray-500'} />
                <span className="text-[11px]">Fonts</span>
            </button>

            <button
                onClick={onToggleSpacing}
                aria-label="Spacing Settings"
                className={`flex-1 min-h-touch flex flex-col items-center justify-center gap-1 rounded-card transition-colors ${
                    activeTab === 'spacing' ? 'text-primary font-bold bg-primary/5' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
            >
                <Sliders size={20} className={activeTab === 'spacing' ? 'text-primary' : 'text-gray-500'} />
                <span className="text-[11px]">Spacing</span>
            </button>

            <button
                onClick={onToggleOverlay}
                aria-label="Overlay Theme Settings"
                className={`flex-1 min-h-touch flex flex-col items-center justify-center gap-1 rounded-card transition-colors ${
                    activeTab === 'overlay' ? 'text-primary font-bold bg-primary/5' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
            >
                <Eye size={20} className={activeTab === 'overlay' ? 'text-primary' : 'text-gray-500'} />
                <span className="text-[11px]">Overlay</span>
            </button>

            <button
                onClick={onToggleMore}
                aria-label="More Settings"
                className={`flex-1 min-h-touch flex flex-col items-center justify-center gap-1 rounded-card transition-colors ${
                    activeTab === 'more' ? 'text-primary font-bold bg-primary/5' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
            >
                <MoreHorizontal size={20} className={activeTab === 'more' ? 'text-primary' : 'text-gray-500'} />
                <span className="text-[11px]">More</span>
            </button>
        </div>
    );
}
