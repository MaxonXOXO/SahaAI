import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import Button from '../../../shared/components/Button';
import { parseYoutubeUrl } from '../lib/parseYoutubeUrl';
import { fetchYoutubeMetadata } from '../lib/fetchYoutubeMetadata';
import { supabase } from '../../../shared/lib/supabaseClient';
import useProfileStore from '../../../store/useProfileStore';

export default function AddPlaylistModal({ onClose, onSuccess }) {
    const userId = useProfileStore((s) => s.id);
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!url.trim()) return;

        setIsLoading(true);
        setError(null);

        try {
            const parsed = parseYoutubeUrl(url);
            if (!parsed) {
                throw new Error('Please enter a valid YouTube video or playlist URL.');
            }

            const metadata = await fetchYoutubeMetadata(parsed);

            // Insert into Supabase table
            const { error: dbError } = await supabase
                .from('math_helper_playlists')
                .insert({
                    user_id: userId,
                    url: url.trim(),
                    video_id: parsed.videoId,
                    playlist_id: parsed.playlistId,
                    title: metadata.title,
                    thumbnail_url: metadata.thumbnailUrl
                });

            if (dbError) {
                throw dbError;
            }

            onSuccess();
        } catch (err) {
            console.error('[AddPlaylistModal] Error:', err);
            setError(err.message || 'An unexpected error occurred while adding the video.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 w-full max-w-[360px] shadow-2xl relative animate-scale-in">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500 transition-colors cursor-pointer"
                >
                    <X size={18} />
                </button>

                <h3 className="text-base-md font-bold text-gray-800 dark:text-gray-100 mb-2">
                    Add YouTube Link
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 leading-normal">
                    Save educational videos or playlists. They will remain accessible at the bottom of your dashboard.
                </p>

                {error && (
                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 p-3 rounded-card text-xs font-semibold text-red-700 dark:text-red-400 leading-normal mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Paste Link</label>
                        <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="e.g. https://www.youtube.com/watch?v=..."
                            disabled={isLoading}
                            className="w-full min-h-touch bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-card px-4 text-xs text-gray-900 dark:text-gray-105 focus:outline-none focus:border-primary disabled:opacity-50"
                            required
                        />
                    </div>

                    <div className="flex gap-2.5 mt-2">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={isLoading}
                            className="flex-1 font-bold"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-1.5">
                                    <Loader2 className="animate-spin" size={14} /> Saving...
                                </span>
                            ) : (
                                'Add Link'
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
