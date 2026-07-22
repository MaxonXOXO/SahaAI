/**
 * Fetches title and thumbnail for a YouTube video (via oEmbed) or playlist (via YouTube Data API v3).
 * 
 * @param {Object} ids - { videoId: string|null, playlistId: string|null }
 * @returns {Promise<Object>} - { title: string, thumbnailUrl: string }
 */
export async function fetchYoutubeMetadata({ videoId, playlistId }) {
    if (videoId) {
        // If a video ID is present, fetch the title using oEmbed (no API Key required)
        try {
            const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
            const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`;
            
            const res = await fetch(oembedUrl);
            if (!res.ok) {
                throw new Error('Video is private, deleted, or invalid');
            }
            
            const data = await res.json();
            
            return {
                title: data.title || 'YouTube Video',
                thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
            };
        } catch (err) {
            console.error('[YouTube Metadata] Video fetch error:', err);
            throw new Error('Failed to retrieve video details. The video may be private or deleted.');
        }
    } else if (playlistId) {
        // If only a playlist ID is present, we must query the YouTube Data API v3
        const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
        if (!apiKey) {
            console.error('[YouTube Metadata] VITE_YOUTUBE_API_KEY is not defined in the environment.');
            throw new Error('System configuration error: YouTube API key is missing.');
        }

        try {
            const playlistApiUrl = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${apiKey}`;
            const res = await fetch(playlistApiUrl);
            
            if (!res.ok) {
                throw new Error('Failed to fetch playlist details');
            }

            const data = await res.json();
            if (!data.items || data.items.length === 0) {
                throw new Error('Playlist not found, private, or deleted');
            }

            const snippet = data.items[0].snippet;
            const title = snippet.title || 'YouTube Playlist';
            
            // Try to extract the highest resolution thumbnail available
            const thumbnails = snippet.thumbnails || {};
            const thumbnailUrl = thumbnails.maxres?.url || 
                                 thumbnails.high?.url || 
                                 thumbnails.medium?.url || 
                                 thumbnails.default?.url || 
                                 '';

            return {
                title,
                thumbnailUrl
            };
        } catch (err) {
            console.error('[YouTube Metadata] Playlist fetch error:', err);
            throw new Error('Failed to retrieve playlist details. Check if it is a public playlist.');
        }
    }

    throw new Error('No valid YouTube video or playlist ID detected.');
}
