import { useState, useEffect, useCallback } from 'react';
import { Plus, X, Play, ListVideo } from 'lucide-react';
import { supabase } from '../../../shared/lib/supabaseClient';
import useProfileStore from '../../../store/useProfileStore';
import AddPlaylistModal from './AddPlaylistModal';

export default function PlaylistBanner() {
    const userId = useProfileStore((s) => s.id);
    const [playlists, setPlaylists] = useState([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const fetchPlaylists = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        const activeUserId = user?.id || userId;
        if (!activeUserId) return;
        try {
            const { data, error } = await supabase
                .from('math_helper_playlists')
                .select('*')
                .eq('user_id', activeUserId)
                .order('created_at', { ascending: true });

            if (!error && data) {
                setPlaylists(data);
            }
        } catch (err) {
            console.error('[PlaylistBanner] Fetch error:', err);
        }
    }, [userId]);

    useEffect(() => {
        fetchPlaylists();
    }, [fetchPlaylists]);

    const handleChipClick = (url) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation(); // Stop click from triggering card window.open
        try {
            const { error } = await supabase
                .from('math_helper_playlists')
                .delete()
                .eq('id', id);

            if (!error) {
                // Refresh list
                setPlaylists((prev) => prev.filter((p) => p.id !== id));
            }
        } catch (err) {
            console.error('[PlaylistBanner] Delete error:', err);
        }
    };

    return (
        <div className="flex flex-col gap-3 mt-6 border-t border-gray-150 dark:border-gray-800 pt-5 w-full">
            <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                    Study Playlist & Videos
                </span>
            </div>

            {/* Horizontal Scrollable Row */}
            <div className="flex gap-4.5 overflow-x-auto pb-3 w-full scrollbar-hide select-none">
                {playlists.map((item) => {
                    const isPlaylist = !!item.playlist_id && !item.video_id;
                    
                    return (
                        <div
                            key={item.id}
                            onClick={() => handleChipClick(item.url)}
                            className="w-32 flex-shrink-0 cursor-pointer group flex flex-col gap-1.5 transition-transform hover:scale-[1.01] active:scale-[0.99]"
                        >
                            {/* Thumbnail Container */}
                            <div className="w-32 h-[72px] bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden relative shadow-sm border border-gray-250/20 dark:border-white/5">
                                {/* Delete Button */}
                                <button
                                    onClick={(e) => handleDelete(e, item.id)}
                                    aria-label="Remove item"
                                    className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-red-650 text-white rounded-full transition-colors z-20 shadow-md cursor-pointer"
                                >
                                    <X size={10} />
                                </button>

                                {/* Video/Playlist Thumbnail */}
                                {item.thumbnail_url ? (
                                    <img
                                        src={item.thumbnail_url}
                                        alt={item.title}
                                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                        loading="lazy"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-750 text-gray-400">
                                        {isPlaylist ? <ListVideo size={24} /> : <Play size={24} />}
                                    </div>
                                )}

                                {/* Overlay Type Badge */}
                                <div className="absolute inset-0 bg-black/15 group-hover:bg-black/25 transition-colors flex items-center justify-center z-10">
                                    <div className="p-1.5 bg-black/40 rounded-full text-white backdrop-blur-sm opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all">
                                        {isPlaylist ? <ListVideo size={14} /> : <Play size={14} />}
                                    </div>
                                </div>
                            </div>

                            {/* Title text */}
                            <span 
                                title={item.title}
                                className="text-[10px] font-bold text-gray-750 dark:text-gray-300 leading-snug px-1 line-clamp-2 break-all"
                            >
                                {item.title}
                            </span>
                        </div>
                    );
                })}

                {/* Add Card Tile */}
                <div
                    onClick={() => setIsAddModalOpen(true)}
                    className="w-32 h-[72px] flex-shrink-0 border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-primary dark:hover:border-primary/80 hover:bg-primary/5 dark:hover:bg-primary/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all group"
                >
                    <Plus className="text-gray-400 group-hover:text-primary dark:text-gray-500 transition-colors" size={24} />
                    <span className="text-[9px] font-bold text-gray-400 group-hover:text-primary dark:text-gray-500 mt-1 uppercase tracking-wider transition-colors">
                        Add Video
                    </span>
                </div>
            </div>

            {/* Modal Dialog */}
            {isAddModalOpen && (
                <AddPlaylistModal
                    onClose={() => setIsAddModalOpen(false)}
                    onSuccess={() => {
                        setIsAddModalOpen(false);
                        fetchPlaylists();
                    }}
                />
            )}
        </div>
    );
}
