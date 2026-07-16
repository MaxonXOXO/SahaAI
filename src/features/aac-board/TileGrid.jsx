import React from 'react';
import { DynamicIcon } from './SentenceStrip';

// Category color mappings for standard (non-low-vision) mode
const CATEGORY_STYLES = {
    core: 'bg-emerald-50 dark:bg-emerald-950/25 text-emerald-800 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/50 hover:bg-emerald-100 dark:hover:bg-emerald-950/40',
    feelings: 'bg-sky-50 dark:bg-sky-950/25 text-sky-800 dark:text-sky-300 border-sky-100 dark:border-sky-900/50 hover:bg-sky-100 dark:hover:bg-sky-950/40',
    people_places: 'bg-indigo-50 dark:bg-indigo-950/25 text-indigo-800 dark:text-indigo-300 border-indigo-100 dark:border-indigo-900/50 hover:bg-indigo-100 dark:hover:bg-indigo-950/40',
    actions: 'bg-amber-50 dark:bg-amber-950/25 text-amber-800 dark:text-amber-300 border-amber-100 dark:border-amber-900/50 hover:bg-amber-100 dark:hover:bg-amber-950/40',
    ai: 'bg-purple-50 dark:bg-purple-950/25 text-purple-800 dark:text-purple-300 border-purple-100 dark:border-purple-900/50 hover:bg-purple-100 dark:hover:bg-purple-950/40'
};

export default function TileGrid({
    tiles = [],
    onTileTap,
    displayLanguage = 'en',
    isLowVision = false
}) {
    const getLabel = (tile) => {
        return displayLanguage === 'ml' ? tile.labelMl : tile.labelEn;
    };

    return (
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-3 p-1">
            {tiles.map((tile) => {
                const styleClass = isLowVision
                    ? 'bg-black border-2 border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black'
                    : CATEGORY_STYLES[tile.category] || CATEGORY_STYLES.core;

                return (
                    <button
                        key={tile.id}
                        onClick={() => onTileTap(tile)}
                        className={`
                            flex flex-col items-center justify-center gap-3 p-4 rounded-card border text-center transition-all duration-200
                            min-h-touch active:scale-[0.96] shadow-xs cursor-pointer
                            ${styleClass}
                        `}
                        aria-label={getLabel(tile)}
                    >
                        <DynamicIcon
                            name={tile.iconName}
                            size={isLowVision ? 36 : 28}
                            className="shrink-0"
                        />
                        <span className={`font-bold leading-tight break-words select-none ${
                            isLowVision ? 'text-base-lg' : 'text-base-sm'
                        }`}>
                            {getLabel(tile)}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
