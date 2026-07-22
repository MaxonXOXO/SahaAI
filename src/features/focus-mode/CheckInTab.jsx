import SessionSummary from './components/SessionSummary';
import { logActivity } from '../../shared/lib/logActivity';
import useProfileStore from '../../store/useProfileStore';
import useFocusStore from './useFocusStore';

export default function CheckInTab() {
    const userId = useProfileStore((s) => s.id);
    const steps = useFocusStore((s) => s.steps);
    const completedStepIds = useFocusStore((s) => s.completedStepIds);

    // Derive initial reflection outcome from real task breakdown progress
    let initialStatus = 'not_completed';
    if (steps && steps.length > 0) {
        if (completedStepIds.length === steps.length) {
            initialStatus = 'completed';
        } else if (completedStepIds.length > 0) {
            initialStatus = 'partially';
        }
    }

    const handleSubmitCheckIn = async (reflectionData) => {
        await logActivity(userId, 'focus_checkin', {
            status: reflectionData.status,
            notes: reflectionData.notes,
        });
    };

    return (
        <div className="flex flex-col gap-6 w-full">
            <SessionSummary
                initialStatus={initialStatus}
                onSubmitCheckIn={handleSubmitCheckIn}
            />
        </div>
    );
}
