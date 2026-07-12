import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * ScreenHeader — top bar used on nearly every screen (see sketch:
 * Text Simplifier, Math Helper, Focus Mode, Social Story, Vision
 * Assistant, Document Reader, Settings, etc.)
 *
 * Props:
 * - title: string, screen title
 * - onBack: optional custom back handler (defaults to navigate(-1))
 * - showBack: boolean, hide on root screens like Dashboard
 * - rightAction: optional node rendered on the right (icon button, menu, etc.)
 */
export default function ScreenHeader({
    title,
    onBack,
    showBack = true,
    rightAction = null,
}) {
    const navigate = useNavigate();

    const handleBack = () => {
        if (onBack) return onBack();
        navigate(-1);
    };

    return (
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-surface dark:bg-surface-dark sticky top-0 z-10">
            <div className="flex items-center gap-2 min-w-[48px]">
                {showBack && (
                    <button
                        onClick={handleBack}
                        aria-label="Go back"
                        className="min-h-touch min-w-touch flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <ChevronLeft size={24} className="text-gray-700 dark:text-gray-200" />
                    </button>
                )}
            </div>

            <h1 className="text-base-md font-semibold text-gray-800 dark:text-gray-100 text-center flex-1 truncate">
                {title}
            </h1>

            <div className="min-w-[48px] flex justify-end">
                {rightAction}
            </div>
        </div>
    );
}