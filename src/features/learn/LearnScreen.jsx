import { useEffect, useRef, useState } from 'react';
import { Bot, Loader2, Sparkles } from 'lucide-react';
import ScreenHeader from '../../shared/components/ScreenHeader';
import useProfileStore from '../../store/useProfileStore';
import { buildSystemPrompt, generateSpeech, sendMessage } from '../../shared/lib/aiClient';
import { logActivity } from '../../shared/lib/logActivity';
import FeedCard from './FeedCard';
import ChatBubble from './ChatBubble';
import InputBar from './InputBar';
import useFeed from './useFeed';
import useIntentClassifier from './useIntentClassifier';

export default function LearnScreen() {
    const profile = useProfileStore();
    const { cards, loading, error, addUserExplainer } = useFeed(profile);
    const { classify } = useIntentClassifier(profile);
    const [chatItems, setChatItems] = useState([]);
    const [processing, setProcessing] = useState(false);
    const [playingId, setPlayingId] = useState(null);
    const [loadingSpeechId, setLoadingSpeechId] = useState(null);
    const feedRef = useRef(null);
    const audioRef = useRef(null);

    const items = [...cards.map((card) => ({ ...card, kind: 'card' })), ...chatItems]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    useEffect(() => () => audioRef.current?.pause(), []);
    useEffect(() => { feedRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); }, [chatItems.length, cards.length]);

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
            const intent = await classify(question);
            if (intent === 'explain') {
                await addUserExplainer(question);
                await logActivity(profile.id, 'explainer_viewed', { topic: question });
            } else {
                const reply = await sendMessage(buildSystemPrompt(profile), [{ role: 'user', content: question }]);
                setChatItems((current) => [...current, { id: crypto.randomUUID(), kind: 'chat', role: 'assistant', content: reply, created_at: new Date().toISOString() }]);
            }
        } catch (requestError) {
            console.error('Learn request failed:', requestError);
            setChatItems((current) => [...current, { id: crypto.randomUUID(), kind: 'chat', role: 'assistant', content: 'Sorry, I had trouble with that. Please try again.', created_at: new Date().toISOString() }]);
        } finally {
            setProcessing(false);
        }
    };

    return <div className="flex min-h-0 flex-1 flex-col bg-gray-50 dark:bg-gray-950">
        <ScreenHeader title="Learn" showBack={false} />
        <div className="border-b border-gray-200 bg-primary/5 px-4 py-3 dark:border-gray-800">
            <div className="flex items-center gap-2"><Sparkles size={18} className="text-primary" /><p className="text-base-sm font-semibold text-gray-800 dark:text-gray-100">Learn something new, or talk it through.</p></div>
            <p className="mt-1 text-xs text-gray-500">SahaAI automatically turns explainer questions into saved learning cards.</p>
        </div>
        <main ref={feedRef} className="flex-1 overflow-y-auto px-4 py-4">
            {error && <p role="status" className="mb-3 rounded-card border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">{error}</p>}
            {loading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div> : items.length === 0 ? <div className="flex flex-col items-center px-8 py-12 text-center"><div className="mb-4 rounded-full bg-primary/10 p-4"><Bot className="text-primary" /></div><h1 className="font-bold text-gray-800 dark:text-gray-100">Your learning feed starts here</h1><p className="mt-2 text-base-sm text-gray-500">Ask how something works, or simply tell me what is on your mind.</p></div> : <div className="flex flex-col gap-4">{items.map((item) => item.kind === 'card' ? <FeedCard key={item.id} card={item} onListen={listen} isPlaying={playingId === item.id} /> : <ChatBubble key={item.id} item={item} onListen={listen} isPlaying={playingId === item.id} isLoading={loadingSpeechId === item.id} />)}</div>}
            {processing && <div className="mt-4 flex items-center gap-2 text-base-sm text-gray-500"><Loader2 size={16} className="animate-spin text-primary" /> Thinking…</div>}
        </main>
        <InputBar onSubmit={handleSubmit} isProcessing={processing} />
    </div>;
}
