import FocusTimer from './components/FocusTimer';
import { logActivity } from '../../shared/lib/logActivity';
import useProfileStore from '../../store/useProfileStore';

export default function FocusSessionTab({ onNavigateToCheckin }) {
    const userId = useProfileStore((s) => s.id);

    const handleSessionComplete = async (sessionData) => {
        // Candidate for future enhancement: auto-check completed step in checklist upon session completion
        await logActivity(userId, 'focus_session_completed', {
            duration: sessionData.minutes,
            mode: sessionData.mode,
            distractionCount: sessionData.distractionCount,
            stepTitle: sessionData.stepTitle || null,
        });

        // Sessions with a stepTitle stay on timer tab for step-completion flow;
        // sessions without a stepTitle (or when navigateNow is true) navigate to Check-In
        if ((!sessionData.hasStepTitle || sessionData.navigateNow) && onNavigateToCheckin) {
            onNavigateToCheckin();
        }
    };

    const handleDistractionBlocked = async (count) => {
        await logActivity(userId, 'distraction_blocked', { count });
    };

    return (
        <div className="w-full h-full flex-1 min-h-0 flex flex-col justify-stretch items-center">
            <FocusTimer
                onSessionComplete={handleSessionComplete}
                onDistractionBlocked={handleDistractionBlocked}
            />
        </div>
    );
}
