import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader2 } from 'lucide-react';
import ScreenHeader from '../../shared/components/ScreenHeader';
import useProfileStore from '../../store/useProfileStore';
import { supabase } from '../../shared/lib/supabaseClient';
import { buildSystemPrompt, generateLearnExplainer, generateLearnImage, findLearnVideo, generateSpeech, sendMessage } from '../../shared/lib/aiClient';
import FeedCard from './FeedCard';
import ChatBubble from './ChatBubble';
import InputBar from './InputBar';

export default function LearnDetailScreen() {
    const { cardId } = useParams();
    const navigate = useNavigate();
    const profile = useProfileStore();
    const [card, setCard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [chatItems, setChatItems] = useState([]);
    const [processing, setProcessing] = useState(false);
    const [playingId, setPlayingId] = useState(null);
    const [loadingSpeechId, setLoadingSpeechId] = useState(null);
    const feedRef = useRef(null);
    const audioRef = useRef(null);
    const hasExpanded = useRef(false);

    useEffect(() => () => audioRef.current?.pause(), []);
    useEffect(() => { feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: 'smooth' }); }, [chatItems.length]);

    useEffect(() => {
        if (!cardId || hasExpanded.current) return;
        
        let cancelled = false;
        (async () => {
            setLoading(true);
            const { data, error: fetchErr } = await supabase.from('learn_cards').select('*').eq('id', cardId).single();
            if (fetchErr) {
                if (!cancelled) setError('Could not load this topic.');
                if (!cancelled) setLoading(false);
                return;
            }
            
            let isStub = false;
            try {
                if (data.explanation && data.explanation.startsWith('{"stub":true')) {
                    isStub = JSON.parse(data.explanation).stub;
                }
            } catch(e) {}

            if (isStub) {
                hasExpanded.current = true; // Prevent double trigger
                try {
                    const explainer = await generateLearnExplainer(profile, data.topic);
                    const [imageResult, videoResult] = await Promise.allSettled([
                        generateLearnImage(explainer.topic),
                        findLearnVideo(explainer.videoQuery, profile.language || 'en'),
                    ]);
                    const updates = {
                        explanation: JSON.stringify({
                            stub: false,
                            summary: JSON.parse(data.explanation).summary,
                            full: explainer.explanation
                        }),
                        diagram_steps: explainer.diagramSteps.length ? explainer.diagramSteps : null,
                        image_url: imageResult.status === 'fulfilled' ? imageResult.value : null,
                        video_id: videoResult.status === 'fulfilled' ? videoResult.value : null,
                    };
                    const { data: updatedCard } = await supabase.from('learn_cards').update(updates).eq('id', cardId).select().single();
                    if (!cancelled) setCard(updatedCard || { ...data, ...updates });
                } catch(expErr) {
                    console.error('Failed to expand topic:', expErr);
                    if (!cancelled) setError('Failed to generate the full explainer. Please try again.');
                    if (!cancelled) setCard(data);
                }
            } else {
                if (!cancelled) setCard(data);
            }
            if (!cancelled) setLoading(false);
        })();
        return () => { cancelled = true; };
    }, [cardId, profile]);

    const listen = async (id, text) => {
        if (playingId === id) {
            audioRef.current?.pause();
            setPlayingId(null);
            return;
        }
        audioRef.current?.pause();
        setLoadingSpeechId(id);
        try {
            const blob = await generateSpeech(text.replace(/\*+/g, ''));
            const audio = new Audio(URL.createObjectURL(blob));
            audioRef.current = audio;
            audio.onended = () => setPlayingId(null);
            audio.onerror = () => setPlayingId(null);
            await audio.play();
            setPlayingId(id);
        } catch (speechError) {
            console.error('Learn TTS failed:', speechError);
        } finally {
            setLoadingSpeechId(null);
        }
    };

    const handleSubmit = async (question) => {
        if (processing) return;
        setProcessing(true);
        const createdAt = new Date().toISOString();
        const userItem = { id: crypto.randomUUID(), kind: 'chat', role: 'user', content: question, created_at: createdAt };
        setChatItems((current) => [...current, userItem]);
        try {
            const contextPrompt = `${buildSystemPrompt(profile)}\n\nThe user is currently looking at a learning card about: "${card?.topic}".\nCard explanation: ${card?.explanation}\n\nPlease answer their follow-up questions directly and keep it conversational.`;
            const reply = await sendMessage(contextPrompt, [{ role: 'user', content: question }]);
            setChatItems((current) => [...current, { id: crypto.randomUUID(), kind: 'chat', role: 'assistant', content: reply, created_at: new Date().toISOString() }]);
        } catch (requestError) {
            console.error('Learn request failed:', requestError);
            setChatItems((current) => [...current, { id: crypto.randomUUID(), kind: 'chat', role: 'assistant', content: 'Sorry, I had trouble with that. Please try again.', created_at: new Date().toISOString() }]);
        } finally {
            setProcessing(false);
        }
    };

    return <div className="flex min-h-0 flex-1 flex-col bg-gray-50 dark:bg-gray-950">
        <header className="flex items-center gap-3 border-b border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <button onClick={() => navigate(-1)} className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200" aria-label="Go back">
                <ChevronLeft size={24} />
            </button>
            <h1 className="text-base-lg font-bold text-gray-900 dark:text-white">Learn Detail</h1>
        </header>

        <main ref={feedRef} className="flex-1 overflow-y-auto px-4 py-4">
            {error && <p role="status" className="mb-3 rounded-card border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">{error}</p>}
            
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                    <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />
                    <p className="font-semibold text-primary">Generating full explainer and fetching video...</p>
                    <p className="mt-1 text-xs text-gray-400">This usually takes about 5 seconds.</p>
                </div>
            ) : card ? (
                <div className="mx-auto max-w-3xl flex flex-col gap-4">
                    <FeedCard card={card} onListen={listen} isPlaying={playingId === card.id} />
                    {chatItems.length > 0 && <hr className="my-4 border-gray-200 dark:border-gray-800" />}
                    {chatItems.map((item) => (
                        <ChatBubble key={item.id} item={item} onListen={listen} isPlaying={playingId === item.id} isLoading={loadingSpeechId === item.id} />
                    ))}
                    {processing && <div className="mt-2 flex items-center gap-2 text-base-sm text-gray-500"><Loader2 size={16} className="animate-spin text-primary" /> Thinking…</div>}
                </div>
            ) : null}
        </main>
        <InputBar onSubmit={handleSubmit} isProcessing={processing} />
    </div>;
}
