import { motion } from 'framer-motion';

/**
 * ReadingPane Component
 * Renders document text word-by-word into interactive span elements.
 * Integrates Framer Motion to pop in active speech highlights using scale and opacity.
 */
export default function ReadingPane({
    text,
    words = [],
    currentWordIndex = -1,
    onWordClick,
    fontFamily = 'font-sans-default',
    fontSize = 'text-base-md',
    spacing = 'spacing-normal',
    overlayOn = false,
    overlayColor = 'rgba(254, 240, 138, 0.12)'
}) {
    const themeBg = 'bg-[#FDFBF7] dark:bg-slate-900 border-gray-250 dark:border-gray-800';

    // Renders tokenized words and raw separators to preserve spacing & formatting
    const renderSpannedWords = () => {
        if (!text || words.length === 0) {
            return <p className="text-gray-400 italic">No document loaded. Tap Scan or OCR below to load text.</p>;
        }

        const elements = [];
        let lastChar = 0;

        words.forEach((w) => {
            // Render separators (spaces, newlines, punctuation)
            if (w.start > lastChar) {
                const separatorText = text.substring(lastChar, w.start);
                elements.push(
                    <span key={`sep-${w.index}`} className="whitespace-pre-wrap">
                        {separatorText}
                    </span>
                );
            }

            const isActive = w.index === currentWordIndex;

            elements.push(
                <motion.span
                    key={`word-${w.index}`}
                    id={`word-span-${w.index}`}
                    onClick={() => onWordClick && onWordClick(w.index)}
                    animate={isActive ? { scale: 1.06, opacity: 1 } : { scale: 1 }}
                    transition={{ duration: 0.15 }}
                    className={`inline-block cursor-pointer rounded px-0.5 font-medium transition-colors select-text ${
                        isActive
                            ? 'bg-[#86EFAC] dark:bg-green-600 text-black dark:text-white font-extrabold shadow-sm z-10 ring-2 ring-green-400'
                            : 'hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
                    }`}
                >
                    {w.word}
                </motion.span>
            );

            lastChar = w.end;
        });

        // Add tailing spaces
        if (lastChar < text.length) {
            elements.push(
                <span key="sep-end" className="whitespace-pre-wrap">
                    {text.substring(lastChar)}
                </span>
            );
        }

        return elements;
    };

    return (
        <div className={`flex-1 rounded-card border p-6 relative overflow-hidden shadow-inner flex flex-col ${themeBg}`}>
            {/* Background tint overlay */}
            {overlayOn && (
                <div
                    className="absolute inset-0 pointer-events-none transition-all duration-200 z-0"
                    style={{ backgroundColor: overlayColor, mixBlendMode: 'multiply' }}
                />
            )}

            {/* Structured Word Canvas */}
            <div className={`flex-1 overflow-y-auto text-left text-gray-800 dark:text-gray-150 ${fontFamily} ${fontSize} ${spacing} relative z-10`}>
                <div className="max-w-prose leading-relaxed">
                    {renderSpannedWords()}
                </div>
                {/* Pad end so bottom sheets don't block bottom paragraphs */}
                <div className="h-20" />
            </div>
        </div>
    );
}
