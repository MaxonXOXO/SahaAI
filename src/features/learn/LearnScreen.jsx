import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, ExternalLink, Loader2, Newspaper, RefreshCw, Sparkles } from 'lucide-react';
import ScreenHeader from '../../shared/components/ScreenHeader';
import useProfileStore from '../../store/useProfileStore';
import { buildSystemPrompt, sendMessage } from '../../shared/lib/aiClient';
import { logActivity } from '../../shared/lib/logActivity';
import FeedCard from './FeedCard';
import ChatBubble from './ChatBubble';
import InputBar from './InputBar';
import useFeed from './useFeed';
import useIntentClassifier from './useIntentClassifier';
import useNewsFeed from './useNewsFeed';

export default function LearnScreen() {
    const profile = useProfileStore();
    const navigate = useNavigate();
    const { cards, loading, error, addUserExplainer } = useFeed(profile);
    const { classify } = useIntentClassifier(profile);
    const [feedMode, setFeedMode] = useState('learn');
    const { articles, loading: newsLoading, error: newsError, refresh: refreshNews } = useNewsFeed(profile, feedMode === 'news');
    const [chatItems, setChatItems] = useState([]);
    const [processing, setProcessing] = useState(false);
    const [playingId, setPlayingId] = useState(null);
    const [loadingSpeechId, setLoadingSpeechId] = useState(null);
    const feedRef = useRef(null);
    const items = [...cards.map((card) => ({ ...card, kind: 'card' })), ...chatItems]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    useEffect(() => () => window.speechSynthesis.cancel(), []);
    useEffect(() => { feedRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); }, [chatItems.length, cards.length, feedMode]);

    const listen = async (id, text) => {
        if (playingId === id) {
            window.speechSynthesis.cancel();
            setPlayingId(null);
            return;
        }
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text.replace(/\*+/g, ''));
        utterance.lang = /[\u0D00-\u0D7F]/.test(text) ? 'ml-IN' : 'en-US';
        
        utterance.onstart = () => setPlayingId(id);
        utterance.onend = () => setPlayingId(null);
        utterance.onerror = () => setPlayingId(null);
        
        window.speechSynthesis.speak(utterance);
    };

    const handleSubmit = async (question) => {
        if (processing) return;
        setProcessing(true);
        try {
            const intent = await classify(question);
            if (intent === 'explain') {
                const newCard = await addUserExplainer(question);
                await logActivity(profile.id, 'explainer_viewed', { topic: question });
                if (newCard?.id) {
                    navigate(`/learn/${newCard.id}`);
                }
            } else {
                const createdAt = new Date().toISOString();
                const userItem = { id: crypto.randomUUID(), kind: 'chat', role: 'user', content: question, created_at: createdAt };
                setChatItems((current) => [...current, userItem]);

                const reply = await sendMessage(buildSystemPrompt(profile), [{ role: 'user', content: question }]);
                setChatItems((current) => [...current, { id: crypto.randomUUID(), kind: 'chat', role: 'assistant', content: reply, created_at: new Date().toISOString() }]);
            }
        } catch (requestError) {
            console.error('Learn request failed:', requestError);
            const createdAt = new Date().toISOString();
            const userItem = { id: crypto.randomUUID(), kind: 'chat', role: 'user', content: question, created_at: createdAt };
            setChatItems((current) => [
                ...current, 
                userItem,
                { id: crypto.randomUUID(), kind: 'chat', role: 'assistant', content: 'Sorry, I had trouble with that. Please try again.', created_at: new Date().toISOString() }
            ]);
        } finally {
            setProcessing(false);
        }
    };

    return <div className="flex min-h-0 flex-1 flex-col bg-gray-50 dark:bg-gray-950">
        <ScreenHeader title="Learn" showBack={false} />
        <div className="border-b border-gray-200 bg-primary/5 px-4 pt-3 dark:border-gray-800">
            <div className="flex items-center gap-2">{feedMode === 'learn' ? <Sparkles size={18} className="text-primary" /> : <Newspaper size={18} className="text-primary" />}<p className="text-base-sm font-semibold text-gray-800 dark:text-gray-100">{feedMode === 'learn' ? 'Learn something new, or talk it through.' : 'Relevant news, selected for your region.'}</p></div>
            <p className="mt-1 text-xs text-gray-500">{feedMode === 'learn' ? 'SahaAI automatically turns explainer questions into saved learning cards.' : 'Age-aware local, science, education, technology, and community headlines.'}</p>
            <div className="mt-3 flex rounded-t-2xl bg-white/70 p-1 dark:bg-gray-900/70">
                <button onClick={() => setFeedMode('learn')} className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold transition-colors ${feedMode === 'learn' ? 'bg-primary text-white shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}><Sparkles size={15} className="mr-1 inline" />For You</button>
                <button onClick={() => setFeedMode('news')} className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold transition-colors ${feedMode === 'news' ? 'bg-primary text-white shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}><Newspaper size={15} className="mr-1 inline" />Local News</button>
            </div>
        </div>
        <main ref={feedRef} className="flex-1 overflow-y-auto px-4 py-4">
            {feedMode === 'news' ? <>
                <div className="mb-3 flex justify-end"><button onClick={refreshNews} disabled={newsLoading} className="rounded-xl border border-primary/30 px-3 py-2 text-xs font-bold text-primary disabled:opacity-50"><RefreshCw size={14} className={`mr-1 inline ${newsLoading ? 'animate-spin' : ''}`} />Refresh</button></div>
                {newsError && <p role="status" className="mb-3 rounded-card border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">{newsError}</p>}
                {newsLoading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div> : articles.length === 0 ? <div className="py-12 text-center text-sm text-gray-500">No suitable news is available right now.</div> : <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>{articles.map((article) => <article key={article.url} className="saha-card flex flex-col rounded-card border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"><div className="flex items-center justify-between gap-3"><span className="text-xs font-bold uppercase text-primary">{article.source}</span><time className="text-xs text-gray-400">{article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : ''}</time></div><h2 className="mt-3 text-base-md font-bold text-gray-800 dark:text-gray-100">{article.title}</h2><a href={article.url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">Read article <ExternalLink size={15} /></a></article>)}</div>}
            </> : <>
            {error && <p role="status" className="mb-3 rounded-card border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">{error}</p>}
            {loading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div> : items.length === 0 ? <div className="flex flex-col items-center px-8 py-12 text-center"><div className="mb-4 rounded-full bg-primary/10 p-4"><Bot className="text-primary" /></div><h1 className="font-bold text-gray-800 dark:text-gray-100">Your learning feed starts here</h1><p className="mt-2 text-base-sm text-gray-500">Ask how something works, or simply tell me what is on your mind.</p></div> : <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>{items.map((item) => item.kind === 'card' ? <div key={item.id} className="flex h-full flex-col"><FeedCard card={item} onListen={listen} isPlaying={playingId === item.id} isGridItem={true} onExpand={() => navigate(`/learn/${item.id}`)} /></div> : <div key={item.id} className="col-span-full"><ChatBubble item={item} onListen={listen} isPlaying={playingId === item.id} isLoading={loadingSpeechId === item.id} /></div>)}</div>}
            {processing && <div className="mt-4 flex items-center gap-2 text-base-sm text-gray-500"><Loader2 size={16} className="animate-spin text-primary" /> Thinking…</div>}
            </>}
        </main>
        {feedMode === 'learn' && <InputBar onSubmit={handleSubmit} isProcessing={processing} />}
    </div>;
}
