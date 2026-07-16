import FocusTimer from './components/FocusTimer';
import { logActivity } from '../../shared/lib/logActivity';
import useProfileStore from '../../store/useProfileStore';

export default function FocusSessionTab({ onNavigateToCheckin }) {
    const userId = useProfileStore((s) => s.id);

    const handleSessionComplete = async (sessionData) => {
        await logActivity(userId, 'focus_session_completed', {
            duration: sessionData.minutes,
            mode: sessionData.mode,
            distractionCount: sessionData.distractionCount,
        });

        if (onNavigateToCheckin) {
            onNavigateToCheckin();
        }
    };

    const handleDistractionBlocked = async (count) => {
        await logActivity(userId, 'distraction_blocked', { count });
    };

    return (
        <div className="flex flex-col gap-6 w-full items-center">
            <div className="text-center max-w-xs">
                <h2 className="text-base-md font-bold text-gray-800 dark:text-gray-100">
                    ADHD Focus Timer
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                    Structured time blocks with low-distraction audio and visual feedback.
                </p>
            </div>

            <FocusTimer
                onSessionComplete={handleSessionComplete}
                onDistractionBlocked={handleDistractionBlocked}
            />
        </div>
    );
}
