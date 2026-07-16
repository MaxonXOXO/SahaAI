import SessionSummary from './components/SessionSummary';
import { logActivity } from '../../shared/lib/logActivity';
import useProfileStore from '../../store/useProfileStore';

export default function CheckInTab() {
    const userId = useProfileStore((s) => s.id);

    const handleSubmitCheckIn = async (reflectionData) => {
        await logActivity(userId, 'focus_session_completed', {
            status: reflectionData.status,
            notes: reflectionData.notes,
        });
    };

    return (
        <div className="flex flex-col gap-6 w-full">
            <SessionSummary onSubmitCheckIn={handleSubmitCheckIn} />
        </div>
    );
}
