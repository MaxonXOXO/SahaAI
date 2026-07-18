import { useRef, useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, ListOrdered, Play, Volume2, VolumeX } from 'lucide-react';
import { renderMarkdown } from '../../shared/lib/parseMarkdown';

export default function FeedCard({ card, onListen, isPlaying }) {
    const [showSteps, setShowSteps] = useState(false);
    const [videoStarted, setVideoStarted] = useState(false);
    const videoRef = useRef(null);
    const steps = Array.isArray(card.diagram_steps) ? card.diagram_steps : [];
    return <article className="saha-card overflow-hidden rounded-card border-2 border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        {card.image_url && <img src={card.image_url} alt={`An AI-generated learning illustration for ${card.topic}`} className="h-44 w-full object-cover" />}
        <div className="p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-wide text-primary">{card.source === 'daily_batch' ? 'Suggested for you' : 'You asked'}</p>
                <time className="text-xs text-gray-400">{new Date(card.created_at).toLocaleDateString()}</time>
            </div>
            <h2 className="text-base-md font-bold text-gray-800 dark:text-gray-100">{card.topic}</h2>
            <div className="mt-2 text-base-sm leading-relaxed text-gray-700 dark:text-gray-200">{renderMarkdown(card.explanation)}</div>
            <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => onListen(card.id, `${card.topic}. ${card.explanation}`)} className="saha-btn flex min-h-touch items-center gap-2 rounded-card bg-primary/10 px-3 text-xs font-semibold text-primary">
                    {isPlaying ? <VolumeX size={15} /> : <Volume2 size={15} />}{isPlaying ? 'Stop' : 'Listen'}
                </button>
                {steps.length > 0 && <button onClick={() => setShowSteps((value) => !value)} className="saha-btn flex min-h-touch items-center gap-2 rounded-card border border-gray-200 px-3 text-xs font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-200">
                    <ListOrdered size={15} /> Steps {showSteps ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>}
            </div>
            {showSteps && <ol className="mt-3 space-y-2 border-l-2 border-primary/30 pl-4 text-base-sm text-gray-700 dark:text-gray-200">
                {steps.map((step, index) => <li key={`${card.id}-${index}`}><span className="font-bold text-primary">{index + 1}. </span>{step}</li>)}
            </ol>}
            {card.video_id && <div className="relative mt-4 overflow-hidden rounded-card bg-black">
                <iframe ref={videoRef} className="aspect-video w-full" src={`https://www.youtube-nocookie.com/embed/${card.video_id}?rel=0&controls=0&enablejsapi=1`} title={`Video about ${card.topic}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                {!videoStarted && <button onClick={() => { videoRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: '' }), '*'); setVideoStarted(true); }} className="absolute inset-0 flex items-center justify-center bg-black/30 text-white" aria-label={`Play video about ${card.topic}`}><span className="flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-bold shadow-lg"><Play size={18} fill="currentColor" /> Play video</span></button>}
                <a href={`https://www.youtube.com/watch?v=${card.video_id}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-white"><ExternalLink size={13} /> Open video</a>
            </div>}
        </div>
    </article>;
}
