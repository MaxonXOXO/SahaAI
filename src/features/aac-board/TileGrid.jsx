import React from 'react';
import { DynamicIcon } from './SentenceStrip';

// Color themes matching the pastel UI cards in the AAC Board mockup
const COLOR_STYLES = {
    green: {
        bg: 'bg-[#EBF8F2] dark:bg-emerald-950/40 hover:bg-[#DCF3E8]',
        border: 'border-[#C3EAD5] dark:border-emerald-800/60',
        text: 'text-[#064E3B] dark:text-emerald-100',
        icon: 'text-[#047857] dark:text-emerald-400',
    },
    blue: {
        bg: 'bg-[#EBF3FE] dark:bg-sky-950/40 hover:bg-[#DCE8FC]',
        border: 'border-[#C7DDFD] dark:border-sky-800/60',
        text: 'text-[#1E3A8A] dark:text-sky-100',
        icon: 'text-[#1D4ED8] dark:text-sky-400',
    },
    yellow: {
        bg: 'bg-[#FEF7E6] dark:bg-amber-950/40 hover:bg-[#FDEFC9]',
        border: 'border-[#FBE4A0] dark:border-amber-800/60',
        text: 'text-[#78350F] dark:text-amber-100',
        icon: 'text-[#D97706] dark:text-amber-400',
    },
    red: {
        bg: 'bg-[#FCE8E6] dark:bg-rose-950/40 hover:bg-[#FAD2CF]',
        border: 'border-[#F7C1BD] dark:border-rose-800/60',
        text: 'text-[#881337] dark:text-rose-100',
        icon: 'text-[#E11D48] dark:text-rose-400',
    },
    purple: {
        bg: 'bg-[#F3E8FF] dark:bg-purple-950/40 hover:bg-[#E9D5FF]',
        border: 'border-[#DDD6FE] dark:border-purple-800/60',
        text: 'text-[#4C1D95] dark:text-purple-100',
        icon: 'text-[#7C3AED] dark:text-purple-400',
    },
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 p-1">
            {tiles.map((tile) => {
                const colorConfig = COLOR_STYLES[tile.tileColor || 'green'] || COLOR_STYLES.green;

                const cardClasses = isLowVision
                    ? 'bg-black border-2 border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black'
                    : `${colorConfig.bg} ${colorConfig.border} ${colorConfig.text} border shadow-xs`;

                const iconClass = isLowVision
                    ? 'text-yellow-400'
                    : colorConfig.icon;

                return (
                    <button
                        key={tile.id}
                        onClick={() => onTileTap(tile)}
                        className={`
                            group relative flex flex-col items-center justify-center gap-3 p-4 sm:p-5 rounded-2xl sm:rounded-3xl text-center
                            min-h-[120px] sm:min-h-[135px] cursor-pointer transition-all duration-200 active:scale-[0.96] hover:-translate-y-0.5
                            ${cardClasses}
                        `}
                        aria-label={getLabel(tile)}
                    >
                        {/* Tile Icon / Illustration representation */}
                        <div className="p-1 transition-transform duration-200 group-hover:scale-110">
                            <DynamicIcon
                                name={tile.iconName}
                                size={isLowVision ? 40 : 36}
                                className={`shrink-0 ${iconClass}`}
                            />
                        </div>

                        {/* Bold Tile Label */}
                        <span className={`font-extrabold leading-tight break-words select-none tracking-tight ${
                            isLowVision ? 'text-lg text-yellow-400' : 'text-base sm:text-lg text-gray-900 dark:text-white'
                        }`}>
                            {getLabel(tile)}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
