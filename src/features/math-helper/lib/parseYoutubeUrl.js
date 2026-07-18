/**
 * Parses a YouTube URL to extract the videoId and/or playlistId.
 * Supports standard watch links, shortened share links, embed links, and playlist links.
 * 
 * @param {string} url - the YouTube URL
 * @returns {Object|null} - { videoId: string|null, playlistId: string|null } or null if invalid
 */
export function parseYoutubeUrl(url) {
    if (!url || typeof url !== 'string') return null;

    try {
        const parsedUrl = new URL(url.trim());
        let videoId = null;
        let playlistId = null;

        // check standard subdomains
        const hostname = parsedUrl.hostname.toLowerCase();
        
        if (hostname.includes('youtu.be')) {
            // Short URL format: https://youtu.be/VIDEO_ID?list=PLAYLIST_ID
            videoId = parsedUrl.pathname.slice(1);
            playlistId = parsedUrl.searchParams.get('list');
        } else if (hostname.includes('youtube.com')) {
            if (parsedUrl.pathname.includes('/watch')) {
                // Watch format: https://www.youtube.com/watch?v=VIDEO_ID&list=PLAYLIST_ID
                videoId = parsedUrl.searchParams.get('v');
                playlistId = parsedUrl.searchParams.get('list');
            } else if (parsedUrl.pathname.includes('/embed/')) {
                // Embed format: https://www.youtube.com/embed/VIDEO_ID?list=PLAYLIST_ID
                videoId = parsedUrl.pathname.split('/embed/')[1].split('?')[0];
                playlistId = parsedUrl.searchParams.get('list');
            } else if (parsedUrl.pathname.includes('/playlist')) {
                // Playlist format: https://www.youtube.com/playlist?list=PLAYLIST_ID
                playlistId = parsedUrl.searchParams.get('list');
            }
        }

        // Clean up empty strings or undefined
        videoId = videoId || null;
        playlistId = playlistId || null;

        if (!videoId && !playlistId) {
            return null; // neither could be extracted
        }

        return { videoId, playlistId };
    } catch (e) {
        return null;
    }
}
