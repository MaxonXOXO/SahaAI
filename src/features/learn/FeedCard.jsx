import { useRef, useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, ListOrdered, Play, Pause, Square, Volume2, VolumeX, Loader2, Sparkles } from 'lucide-react';
import { renderMarkdown } from '../../shared/lib/parseMarkdown';
import { generateLearnImage } from '../../shared/lib/aiClient';

function StepItem({ step, index, topic }) {
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    const generateImage = async () => {
        if (loading || image) return;
        setLoading(true);
        setError(false);
        try {
            // Include the overarching topic so the AI has context (e.g. doesn't generate junk food for a healthy snack step)
            const url = await generateLearnImage(`${topic} - Step: ${step}`);
            setImage(url);
        } catch (err) {
            console.error('Failed to generate step image:', err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <li className="flex flex-col gap-3 bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden">
            <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold shrink-0">
                    {index + 1}
                </div>
                <div className="flex-1 mt-1 text-base-sm font-semibold text-gray-800 dark:text-gray-100 leading-relaxed">
                    {renderMarkdown(step)}
                </div>
            </div>
            
            {image ? (
                <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <img src={image} alt={`Visual for step ${index + 1}`} className="w-full h-auto object-cover max-h-56" />
                </div>
            ) : (
                <div className="pl-11 mt-1">
                    <button 
                        onClick={generateImage} 
                        disabled={loading}
                        className="flex items-center gap-2 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-4 py-2 rounded-full transition-colors disabled:opacity-50"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                        {loading ? 'Generating...' : 'Generate Step Visual (Cloudflare AI)'}
                    </button>
                    {error && <p className="text-xs text-red-500 mt-2 font-semibold">Failed to generate image. Try again.</p>}
                </div>
            )}
        </li>
    );
}

export default function FeedCard({ card, onListen, isPlaying, onExpand, isGridItem }) {
    const [showSteps, setShowSteps] = useState(false);
    const [videoStarted, setVideoStarted] = useState(false);
    const [isExpanding, setIsExpanding] = useState(false);
    const videoRef = useRef(null);
    const steps = Array.isArray(card.diagram_steps) ? card.diagram_steps : [];

    let isStub = false;
    let stubSummary = card.explanation;
    let fullExplanation = card.explanation;
    
    try {
        if (card.explanation && card.explanation.trim().startsWith('{')) {
            const parsed = JSON.parse(card.explanation);
            if (parsed.stub !== undefined) {
                isStub = parsed.stub;
                stubSummary = parsed.summary || stubSummary;
                if (!isStub && parsed.full) {
                    fullExplanation = parsed.full;
                }
            }
        }
    } catch (e) {
        // Fallback to normal rendering if not JSON
    }

    const shouldRenderAsStub = isGridItem || isStub;
    const displaySummary = stubSummary.length > 150 && shouldRenderAsStub && !isStub ? stubSummary.substring(0, 150) + '...' : stubSummary;

    const handleExpand = async () => {
        if (!onExpand) return;
        setIsExpanding(true);
        try {
            await onExpand(card.id, card.topic);
        } finally {
            setIsExpanding(false);
        }
    };

    const postYoutubeCommand = (command) => {
        if (videoRef.current?.contentWindow) {
            videoRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: command, args: '' }), '*');
            if (command === 'playVideo') setVideoStarted(true);
        }
    };

    return <article className="saha-card overflow-hidden flex flex-col h-full rounded-card border-2 border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-wide text-primary">{card.source === 'daily_batch' ? 'Suggested for you' : 'You asked'}</p>
                <time className="text-xs text-gray-400">{new Date(card.created_at).toLocaleDateString()}</time>
            </div>
            <h2 className="text-base-md font-bold text-gray-800 dark:text-gray-100">{card.topic}</h2>
            
            {shouldRenderAsStub ? (
                <div className="mt-2">
                    <div className="text-base-sm leading-relaxed text-gray-700 dark:text-gray-200">{renderMarkdown(displaySummary)}</div>
                    <button 
                        onClick={handleExpand} 
                        disabled={isExpanding}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-card bg-primary px-4 py-3 text-sm font-bold text-white shadow-md disabled:opacity-70"
                    >
                        {isExpanding ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                        {isExpanding ? 'Loading...' : 'Learn More & Watch Video'}
                    </button>
                </div>
            ) : (
                <>
                    <div className="mt-2 text-base-sm leading-relaxed text-gray-700 dark:text-gray-200">{renderMarkdown(fullExplanation)}</div>
                    <div className="mt-4 flex flex-wrap gap-2">
                        <button onClick={() => onListen(card.id, `${card.topic}. ${fullExplanation}`)} className="saha-btn flex min-h-touch items-center gap-2 rounded-card bg-primary/10 px-3 text-xs font-semibold text-primary">
                            {isPlaying ? <VolumeX size={15} /> : <Volume2 size={15} />}{isPlaying ? 'Stop' : 'Listen'}
                        </button>
                        {steps.length > 0 && <button onClick={() => setShowSteps((value) => !value)} className="saha-btn flex min-h-touch items-center gap-2 rounded-card border border-gray-200 px-3 text-xs font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-200">
                            <ListOrdered size={15} /> Steps {showSteps ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>}
                    </div>
                    {showSteps && <ol className="mt-4 space-y-4">
                        {steps.map((step, index) => <StepItem key={`${card.id}-${index}`} step={step} index={index} topic={card.topic} />)}
                    </ol>}
                    {card.video_id && <div className="relative mt-4 overflow-hidden rounded-card bg-black">
                        {/* disablekb=1 & controls=0 hides native YouTube controls */}
                        <iframe ref={videoRef} className="pointer-events-none aspect-video w-full" src={`https://www.youtube-nocookie.com/embed/${card.video_id}?rel=0&controls=0&enablejsapi=1&disablekb=1&modestbranding=1&showinfo=0&iv_load_policy=3`} title={`Video about ${card.topic}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                        {!videoStarted && <button onClick={() => postYoutubeCommand('playVideo')} className="absolute inset-0 flex items-center justify-center bg-black/30 text-white" aria-label={`Play video about ${card.topic}`}><span className="flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-bold shadow-lg"><Play size={18} fill="currentColor" /> Play video</span></button>}
                        
                        {/* Native SahaAI Player Controls */}
                        {videoStarted && (
                            <div className="flex items-center justify-center gap-6 bg-gray-900 px-4 py-3 border-t border-gray-800">
                                <button onClick={() => postYoutubeCommand('playVideo')} aria-label="Play" className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white hover:bg-primary-dark active:scale-95"><Play size={20} fill="currentColor" /></button>
                                <button onClick={() => postYoutubeCommand('pauseVideo')} aria-label="Pause" className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-700 text-white hover:bg-gray-600 active:scale-95"><Pause size={20} fill="currentColor" /></button>
                                <button onClick={() => postYoutubeCommand('stopVideo')} aria-label="Stop" className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-700 text-white hover:bg-gray-600 active:scale-95"><Square size={20} fill="currentColor" /></button>
                            </div>
                        )}
                        <a href={`https://www.youtube.com/watch?v=${card.video_id}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1 bg-black px-3 py-2 text-xs font-semibold text-gray-400 hover:text-white"><ExternalLink size={13} /> Open in YouTube App</a>
                    </div>}
                </>
            )}
        </div>
    </article>;
}
