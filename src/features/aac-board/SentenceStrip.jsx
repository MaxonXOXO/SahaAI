import React, { useRef, useEffect } from 'react';
import * as Icons from 'lucide-react';

// Dynamic icon helper
export function DynamicIcon({ name, size = 24, className = "" }) {
    const IconComponent = Icons[name] || Icons.MessageSquare;
    return <IconComponent size={size} className={className} />;
}

export default function SentenceStrip({
    items = [],
    onRemoveItem,
    onClear,
    onSpeak,
    isSpeaking = false,
    displayLanguage = 'en',
    isLowVision = false
}) {
    const scrollContainerRef = useRef(null);

    // Auto scroll when tiles added
    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
        }
    }, [items.length]);

    const getLabel = (item) => {
        return displayLanguage === 'ml' ? item.labelMl : item.labelEn;
    };

    return (
        <div className="w-full flex flex-col gap-2">
            {/* Section Title */}
            <h2 className="text-base font-extrabold text-gray-900 dark:text-white px-1">
                {displayLanguage === 'ml' ? 'എന്റെ വാക്യം' : 'My Sentence'}
            </h2>

            {/* Sentence Builder Box & Actions */}
            <div className="flex flex-row items-stretch gap-3">
                {/* Left Area: Selected Sentence Box */}
                <div
                    ref={scrollContainerRef}
                    className={`flex-1 rounded-2xl border p-4 min-h-[110px] flex items-center overflow-x-auto transition-all ${
                        isLowVision
                            ? 'bg-black border-yellow-400 text-yellow-400'
                            : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-xs'
                    }`}
                >
                    {items.length === 0 ? (
                        <div className="w-full flex flex-col items-center justify-center text-center gap-2 py-2 select-none">
                            {/* Speech bubble icon */}
                            <div className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500">
                                <Icons.MessageSquare className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                            </div>
                            <span className="text-sm font-medium text-gray-400 dark:text-gray-500">
                                {displayLanguage === 'ml'
                                    ? 'വാക്യം ഉണ്ടാക്കാൻ താഴെയുള്ള ടൈലുകളിൽ അമർത്തുക'
                                    : 'Tap symbols to build your sentence'}
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 flex-wrap py-1">
                            {items.map((item, index) => (
                                <div
                                    key={`${item.id}-${index}`}
                                    className={`relative flex items-center gap-2 px-3 py-2 rounded-xl border shadow-xs transition-all ${
                                        isLowVision
                                            ? 'bg-black border-yellow-400 text-yellow-400'
                                            : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
                                    }`}
                                >
                                    <DynamicIcon
                                        name={item.iconName}
                                        size={18}
                                        className={isLowVision ? 'text-yellow-400' : 'text-emerald-700 dark:text-emerald-300'}
                                    />
                                    <span className="text-sm font-bold select-none">{getLabel(item)}</span>

                                    {/* Remove word badge */}
                                    <button
                                        onClick={() => onRemoveItem(index)}
                                        className="w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] ml-1 hover:bg-red-600 transition-transform active:scale-95"
                                        aria-label={displayLanguage === 'ml' ? 'വാക്ക് നീക്കുക' : 'Remove word'}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Area: Speak & Clear Action Buttons */}
                <div className="flex flex-col gap-2.5 shrink-0 w-28 sm:w-32 justify-between">
                    {/* Speak Button (Soft Blue) */}
                    <button
                        onClick={onSpeak}
                        disabled={items.length === 0}
                        className={`flex-1 flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-2xl border font-bold text-xs sm:text-sm transition-all active:scale-95 shadow-xs ${
                            items.length === 0
                                ? 'opacity-50 cursor-not-allowed bg-blue-50/50 dark:bg-gray-800 border-blue-100 text-blue-300 dark:text-gray-600'
                                : isSpeaking
                                ? 'bg-blue-600 text-white animate-pulse border-blue-600'
                                : isLowVision
                                ? 'bg-yellow-400 text-black border-yellow-400 font-extrabold'
                                : 'bg-[#E8F0FE] hover:bg-[#D4E4FD] text-[#1967D2] dark:bg-blue-950/60 dark:text-blue-300 border-[#D2E3FC] dark:border-blue-800'
                        }`}
                        aria-label={displayLanguage === 'ml' ? 'വായിക്കുക' : 'Speak'}
                    >
                        <Icons.Volume2 className="w-5 h-5 shrink-0" />
                        <span>{displayLanguage === 'ml' ? 'വായിക്കുക' : 'Speak'}</span>
                    </button>

                    {/* Clear Button (Soft Red) */}
                    <button
                        onClick={onClear}
                        disabled={items.length === 0}
                        className={`flex-1 flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-2xl border font-bold text-xs sm:text-sm transition-all active:scale-95 shadow-xs ${
                            items.length === 0
                                ? 'opacity-50 cursor-not-allowed bg-red-50/50 dark:bg-gray-800 border-red-100 text-red-300 dark:text-gray-600'
                                : isLowVision
                                ? 'bg-black text-yellow-400 border-yellow-400'
                                : 'bg-[#FCE8E6] hover:bg-[#FAD2CF] text-[#D93025] dark:bg-red-950/60 dark:text-red-300 border-[#FAD2CF] dark:border-red-800'
                        }`}
                        aria-label={displayLanguage === 'ml' ? 'ഒഴിവാക്കുക' : 'Clear'}
                    >
                        <Icons.Trash2 className="w-5 h-5 shrink-0" />
                        <span>{displayLanguage === 'ml' ? 'ഒഴിവാക്കുക' : 'Clear'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
