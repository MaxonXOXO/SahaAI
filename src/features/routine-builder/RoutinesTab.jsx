import { useState } from 'react';
import { Plus, ListChecks, Loader2 } from 'lucide-react';
import Button from '../../shared/components/Button';
import RoutineCard from './components/RoutineCard';
import RoutineFormModal from './components/RoutineFormModal';
import ConfirmDeleteModal from './components/ConfirmDeleteModal';
import useRoutineStore from './useRoutineStore';

export default function RoutinesTab({ onRun }) {
    const routines = useRoutineStore((s) => s.routines);
    const loading = useRoutineStore((s) => s.loading);
    const hasLoaded = useRoutineStore((s) => s.hasLoaded);
    const removeRoutine = useRoutineStore((s) => s.removeRoutine);

    const [editingRoutine, setEditingRoutine] = useState(null); // null = closed, {} = new, object = edit
    const [deletingRoutine, setDeletingRoutine] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const handleDeleteConfirm = async () => {
        setDeleting(true);
        try {
            await removeRoutine(deletingRoutine.id);
            setDeletingRoutine(null);
        } catch (err) {
            console.error('Failed to delete routine:', err);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="flex flex-col gap-3">
            <Button variant="primary" size="lg" icon={Plus} onClick={() => setEditingRoutine({})}>
                New Routine
            </Button>

            {loading && !hasLoaded && (
                <div className="flex items-center justify-center gap-2 text-gray-400 py-10">
                    <Loader2 className="animate-spin" size={18} /> Loading your routines...
                </div>
            )}

            {hasLoaded && routines.length === 0 && (
                <div className="flex flex-col items-center text-center gap-2 py-10 text-gray-400">
                    <ListChecks size={32} />
                    <p className="text-sm font-medium">No routines yet</p>
                    <p className="text-xs max-w-[240px]">
                        Build your first one above, or grab a ready-made routine from the Templates tab.
                    </p>
                </div>
            )}

            {routines.map((routine) => (
                <RoutineCard
                    key={routine.id}
                    routine={routine}
                    onRun={onRun}
                    onEdit={setEditingRoutine}
                    onDelete={setDeletingRoutine}
                />
            ))}

            {editingRoutine !== null && (
                <RoutineFormModal
                    routine={editingRoutine.id ? editingRoutine : null}
                    onClose={() => setEditingRoutine(null)}
                    onSaved={() => setEditingRoutine(null)}
                />
            )}

            <ConfirmDeleteModal
                routine={deletingRoutine}
                onCancel={() => setDeletingRoutine(null)}
                onConfirm={handleDeleteConfirm}
                deleting={deleting}
            />
        </div>
    );
}
