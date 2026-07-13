import { Camera, FileSearch, Volume2 } from 'lucide-react';

/**
 * ScanBar Component
 * Renders entry actions for Document Scanning, OCR processing, and audio listening.
 * Conforms to min-h-touch target sizes.
 */
export default function ScanBar({
    onScan,
    onOcr,
    onListen
}) {
    return (
        <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-3 w-full flex items-center justify-around gap-2 shadow-inner">
            <button
                onClick={onScan}
                className="flex-1 min-h-touch flex items-center justify-center gap-2 rounded-card bg-primary text-white font-semibold text-base-sm px-4 py-2 hover:bg-primary-dark transition-all active:scale-[0.98]"
            >
                <Camera size={18} />
                <span>Scan</span>
            </button>

            <button
                onClick={onOcr}
                className="flex-1 min-h-touch flex items-center justify-center gap-2 rounded-card border-2 border-primary text-primary font-semibold text-base-sm px-4 py-2 hover:bg-primary/5 transition-all active:scale-[0.98]"
            >
                <FileSearch size={18} />
                <span>OCR</span>
            </button>

            <button
                onClick={onListen}
                className="flex-1 min-h-touch flex items-center justify-center gap-2 rounded-card bg-accent-dyslexia hover:bg-amber-600 text-white font-semibold text-base-sm px-4 py-2 transition-all active:scale-[0.98]"
            >
                <Volume2 size={18} />
                <span>Listen</span>
            </button>
        </div>
    );
}
