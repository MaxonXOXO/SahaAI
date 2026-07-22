import Button from '../../../shared/components/Button';

export default function ConfirmDeleteModal({ routine, onCancel, onConfirm, deleting }) {
    if (!routine) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 w-full max-w-[340px] shadow-2xl">
                <h3 className="text-base-md font-bold text-gray-800 dark:text-gray-100 mb-2">
                    Delete "{routine.title}"?
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-5 leading-normal">
                    This removes the routine and all its steps. This can't be undone.
                </p>
                <div className="flex gap-2.5">
                    <Button variant="secondary" onClick={onCancel} disabled={deleting} className="flex-1">
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={onConfirm} disabled={deleting} className="flex-1 font-bold">
                        {deleting ? 'Deleting...' : 'Delete'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
