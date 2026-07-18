import { Loader2, Volume2, VolumeX } from 'lucide-react';
import { renderMarkdown } from '../../shared/lib/parseMarkdown';

export default function ChatBubble({ item, onListen, isPlaying, isLoading }) {
    const isUser = item.role === 'user';
    return <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
        <div className="max-w-[84%]">
            <div className={`whitespace-pre-wrap rounded-2xl px-4 py-3 text-base-sm ${isUser ? 'rounded-br-md bg-primary text-white' : 'rounded-bl-md bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'}`}>
                {renderMarkdown(item.content)}
            </div>
            {!isUser && <button onClick={() => onListen(item.id, item.content)} className="mt-1 ml-1 flex items-center gap-1 text-xs text-gray-400 hover:text-primary">
                {isLoading ? <Loader2 size={12} className="animate-spin" /> : isPlaying ? <VolumeX size={12} /> : <Volume2 size={12} />}
                {isLoading ? 'Generating…' : isPlaying ? 'Stop' : 'Listen'}
            </button>}
        </div>
    </div>;
}
