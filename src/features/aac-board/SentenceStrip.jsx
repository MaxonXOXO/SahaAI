import React, { useRef, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { translate } from '../../shared/lib/translations';

// Dynamic icon helper to resolve Lucide icons by name
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

    // Auto-scroll to the end when a new tile is added
    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
        }
    }, [items.length]);

    const getLabel = (item) => {
        return displayLanguage === 'ml' ? item.labelMl : item.labelEn;
    };

    return (
        <div className={`sticky top-0 z-20 border-b shadow-sm backdrop-blur-md transition-all duration-300 ${
            isLowVision 
                ? 'bg-black border-yellow-400 text-yellow-400' 
                : 'bg-white/95 dark:bg-gray-900/95 border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-100'
        }`}>
            <div className="max-w-4xl mx-auto px-4 py-3 flex flex-col gap-3">
                {/* Header label */}
                <div className="flex justify-between items-center">
                    <span className={`text-xs font-bold uppercase tracking-wider ${isLowVision ? 'text-yellow-400' : 'text-gray-400 dark:text-gray-500'}`}>
                        {displayLanguage === 'ml' ? 'വാക്യ നിർമ്മാണം' : 'Sentence Builder'}
                    </span>
                    {items.length > 0 && (
                        <button
                            onClick={onClear}
                            className={`flex items-center gap-1 text-xs font-bold uppercase tracking-wider transition-all px-2.5 py-1 rounded-lg ${
                                isLowVision 
                                    ? 'border border-yellow-400 hover:bg-yellow-400 hover:text-black' 
                                    : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'
                            }`}
                            aria-label={displayLanguage === 'ml' ? 'മുഴുവൻ ഒഴിവാക്കുക' : 'Clear all'}
                        >
                            <Icons.Trash2 size={14} />
                            {displayLanguage === 'ml' ? 'ഒഴിവാക്കുക' : 'Clear'}
                        </button>
                    )}
                </div>

                {/* Main Strip Area */}
                <div className="flex items-center gap-3">
                    {/* Horizontal scroll list of selected tiles */}
                    <div 
                        ref={scrollContainerRef}
                        className={`flex-1 flex items-center gap-2 overflow-x-auto py-2 px-1 scroll-smooth min-h-[72px] rounded-2xl border ${
                            isLowVision 
                                ? 'border-yellow-400 bg-gray-950' 
                                : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950'
                        }`}
                    >
                        {items.length === 0 ? (
                            <span className={`text-base-sm italic px-3 select-none ${
                                isLowVision ? 'text-yellow-400/50' : 'text-gray-400 dark:text-gray-600'
                            }`}>
                                {displayLanguage === 'ml' ? 'തുടങ്ങാൻ താഴെയുള്ള ടൈലുകളിൽ അമർത്തുക...' : 'Tap tiles below to build your sentence...'}
                            </span>
                        ) : (
                            items.map((item, index) => (
                                <div
                                    key={`${item.id}-${index}`}
                                    className={`relative flex items-center gap-2 shrink-0 px-3 py-2 rounded-xl shadow-xs border transition-all ${
                                        isLowVision
                                            ? 'bg-black border-yellow-400 text-yellow-400'
                                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100'
                                    }`}
                                >
                                    <DynamicIcon name={item.iconName} size={18} className={isLowVision ? 'text-yellow-400' : 'text-primary dark:text-accent-autism'} />
                                    <span className="text-base-md font-bold select-none">{getLabel(item)}</span>
                                    
                                    {/* Small delete badge */}
                                    <button
                                        onClick={() => onRemoveItem(index)}
                                        className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center border shadow-xs transition-transform hover:scale-110 active:scale-95 ${
                                            isLowVision
                                                ? 'bg-black border-yellow-400 text-yellow-400'
                                                : 'bg-red-500 border-white dark:border-gray-900 text-white'
                                        }`}
                                        aria-label={displayLanguage === 'ml' ? 'ഈ വാക്ക് നീക്കം ചെയ്യുക' : 'Remove word'}
                                    >
                                        <Icons.X size={10} strokeWidth={3} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Action buttons: Backspace & Speak */}
                    <div className="flex flex-col gap-1.5 shrink-0">
                        {/* Delete/Backspace button */}
                        <button
                            onClick={() => onRemoveItem(items.length - 1)}
                            disabled={items.length === 0}
                            className={`w-12 h-12 flex items-center justify-center rounded-xl border transition-all active:scale-95 ${
                                items.length === 0
                                    ? 'opacity-40 cursor-not-allowed border-gray-200 dark:border-gray-800 text-gray-300 dark:text-gray-700'
                                    : isLowVision
                                        ? 'border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black'
                                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                            }`}
                            title={displayLanguage === 'ml' ? 'അവസാന വാക്ക് നീക്കുക' : 'Backspace'}
                            aria-label={displayLanguage === 'ml' ? 'അവസാന വാക്ക് നീക്കുക' : 'Backspace'}
                        >
                            <Icons.Delete size={20} />
                        </button>

                        {/* Speak Button */}
                        <button
                            onClick={onSpeak}
                            disabled={items.length === 0}
                            className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all active:scale-95 ${
                                items.length === 0
                                    ? 'opacity-40 cursor-not-allowed bg-gray-300 dark:bg-gray-800 text-gray-400 dark:text-gray-600'
                                    : isSpeaking
                                        ? 'bg-amber-500 text-white animate-pulse'
                                        : isLowVision
                                            ? 'bg-yellow-400 text-black hover:bg-yellow-500 font-bold'
                                            : 'bg-primary dark:bg-accent-autism text-white hover:bg-primary-dark'
                            }`}
                            title={displayLanguage === 'ml' ? 'ശബ്ദത്തിൽ വായിക്കുക' : 'Speak phrase'}
                            aria-label={displayLanguage === 'ml' ? 'ശബ്ദത്തിൽ വായിക്കുക' : 'Speak phrase'}
                        >
                            {isSpeaking ? (
                                <Icons.VolumeX size={22} />
                            ) : (
                                <Icons.Volume2 size={22} />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
