import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Send, Loader2, Volume2, Play, Pause, Mic } from 'lucide-react';
import ScreenHeader from '../../shared/components/ScreenHeader';
import useProfileStore from '../../store/useProfileStore';
import useSettingsStore from '../../store/useSettingsStore';
import { supabase } from '../../shared/lib/supabaseClient';
import { buildSystemPrompt, sendMessage } from '../../shared/lib/aiClient';
import { queryMemory } from '../../shared/lib/memoryService';
import { renderMarkdown } from '../../shared/lib/parseMarkdown';


export default function ChatScreen() {
    const { chatId } = useParams();
    const location = useLocation();
    const profile = useProfileStore();
    const displayLanguage = useSettingsStore((s) => s.displayLanguage);
    const ui = displayLanguage === 'ml' ? {
        placeholder: 'ഒരു സന്ദേശം ടൈപ്പ് ചെയ്യുക അല്ലെങ്കിൽ പറയുക...', play: 'കേൾക്കുക', resume: 'തുടരുക', pause: 'താൽക്കാലികമായി നിർത്തുക',
        ttsUnsupported: 'ഈ ബ്രൗസറിൽ ടെക്സ്റ്റ്-ടു-സ്പീച്ച് ലഭ്യമല്ല.', voiceUnsupported: 'ഈ ബ്രൗസറിൽ വോയ്‌സ് ഇൻപുട്ട് ലഭ്യമല്ല.',
        error: 'ക്ഷമിക്കണം, മറുപടി നൽകുന്നതിൽ പ്രശ്നമുണ്ടായി. വീണ്ടും ശ്രമിക്കുക.',
    } : {
        placeholder: 'Type or speak a message...', play: 'Play', resume: 'Resume', pause: 'Pause',
        ttsUnsupported: 'Text-to-speech is not supported in this browser.', voiceUnsupported: 'Voice input is not supported in this browser.',
        error: 'Sorry, I had trouble responding. Please try again.',
    };
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [chatTitle, setChatTitle] = useState('Chat');
    const bottomRef = useRef(null);
    const hasInitializedRef = useRef(false);

    // Use the device's immediate, built-in speech engine for chat playback.
    const [playingMessageId, setPlayingMessageId] = useState(null);
    const [isSpeechPaused, setIsSpeechPaused] = useState(false);
    const utteranceRef = useRef(null);

    // Clean up audio on unmount
    useEffect(() => {
        return () => {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    const handlePlaySpeech = (msgId, text) => {
        if (!('speechSynthesis' in window)) {
            alert(ui.ttsUnsupported);
            return;
        }

        const synth = window.speechSynthesis;
        if (playingMessageId === msgId && synth.paused) {
            synth.resume();
            setIsSpeechPaused(false);
            return;
        }
        if (playingMessageId === msgId && synth.speaking) return;

        synth.cancel();
        const cleanText = text.replace(/[*_`#]/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = displayLanguage === 'ml' ? 'ml-IN' : 'en-US';
        utterance.rate = 1;
        utteranceRef.current = utterance;
        setPlayingMessageId(msgId);
        setIsSpeechPaused(false);

        utterance.onend = () => {
            if (utteranceRef.current === utterance) {
                setPlayingMessageId(null);
                setIsSpeechPaused(false);
                utteranceRef.current = null;
            }
        };
        utterance.onerror = utterance.onend;
        synth.speak(utterance);
    };

    const handlePauseSpeech = (msgId) => {
        if (playingMessageId !== msgId || !('speechSynthesis' in window)) return;
        window.speechSynthesis.pause();
        setIsSpeechPaused(true);
    };

    // Load existing messages
    useEffect(() => {
        if (!chatId) return;

        const load = async () => {
            // Fetch chat title
            const { data: chat } = await supabase
                .from('chats')
                .select('title')
                .eq('id', chatId)
                .single();
            if (chat) setChatTitle(chat.title);

            // Fetch messages
            const { data: msgs } = await supabase
                .from('messages')
                .select('*')
                .eq('chat_id', chatId)
                .order('created_at', { ascending: true });
            if (msgs) setMessages(msgs);

            // Handle initial message from HomeScreen Search
            if (msgs && msgs.length === 0 && location.state?.initialMessage && !hasInitializedRef.current) {
                hasInitializedRef.current = true;
                // Wait a tiny bit for state to settle, then send
                setTimeout(() => {
                    handleSend(location.state.initialMessage);
                }, 100);
            }
        };

        load();
    }, [chatId]);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (overrideText = null) => {
        const text = (overrideText || input).trim();
        if (!text || sending) return;

        setInput('');
        setSending(true);

        // 1. Add user message to UI + DB
        const userMsg = { role: 'user', content: text, chat_id: chatId };
        setMessages((prev) => [...prev, { ...userMsg, id: 'temp-user', created_at: new Date().toISOString() }]);

        await supabase.from('messages').insert(userMsg);

        // 2. Build system prompt from current profile
        let systemPrompt = buildSystemPrompt(profile);

        // 2b. Check if query is memory/recall relevant (using lightweight question/recall heuristic)
        const isRecallQuery = /[?]|where|what|when|who|why|how|remember|keys|bag|find|put|left|did i|location|place/i.test(text);
        if (isRecallQuery && profile?.id) {
            try {
                const { data: memoryMatches } = await queryMemory(text, profile.id, 0.65, 3);
                if (memoryMatches && memoryMatches.length > 0) {
                    const memoryContext = `\n\nRelevant memory notes for this user (only use if directly relevant to their question, otherwise ignore):\n` +
                        memoryMatches.map((m) => `- ${m.content}`).join('\n');
                    systemPrompt += memoryContext;
                }
            } catch (memErr) {
                console.warn('Memory search for chat system prompt failed silently:', memErr);
            }
        }

        // 3. Build full history for the API (include the new message)
        const history = [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
        }));


        try {
            // 4. Call Gemini
            const reply = await sendMessage(systemPrompt, history);

            // 5. Save assistant response to DB + UI
            const assistantMsg = { role: 'assistant', content: reply, chat_id: chatId };
            await supabase.from('messages').insert(assistantMsg);
            setMessages((prev) => [
                ...prev.filter((m) => m.id !== 'temp-user'),
                { ...userMsg, id: crypto.randomUUID(), created_at: new Date().toISOString() },
                { ...assistantMsg, id: crypto.randomUUID(), created_at: new Date().toISOString() },
            ]);

            // 6. Auto-title the chat from the first user message
            if (messages.length === 0) {
                const title = text.length > 40 ? text.slice(0, 40) + '...' : text;
                await supabase.from('chats').update({ title }).eq('id', chatId);
                setChatTitle(title);
            }
        } catch (err) {
            console.error('AI error:', err);
            setMessages((prev) => [
                ...prev,
                {
                    id: 'error',
                    role: 'assistant',
                    content: ui.error,
                    created_at: new Date().toISOString(),
                },
            ]);
        }

        setSending(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const startVoiceInput = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert(ui.voiceUnsupported);
            return;
        }
        const recognition = new SpeechRecognition();
        recognition.lang = displayLanguage === 'ml' ? 'ml-IN' : 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setInput(prev => (prev ? prev + ' ' + transcript : transcript));
        };

        recognition.start();
    };

    const hasTypedMessage = input.trim().length > 0;

    return (
        <div className="flex-1 flex flex-col h-full">
            <ScreenHeader title={chatTitle} />

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
                {messages.length === 0 && !sending && (
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-base-sm text-gray-400 text-center px-6">
                            Ask me anything — I'll adapt to your learning style!
                        </p>
                    </div>
                )}

                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className="flex flex-col gap-1 max-w-[80%]">
                            <div
                                className={`
                                    px-4 py-3 rounded-2xl text-base-sm whitespace-pre-wrap
                                    ${msg.role === 'user'
                                        ? 'bg-primary text-white rounded-br-md'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-md'}
                                `}
                            >
                                {renderMarkdown(msg.content)}
                            </div>
                            {msg.role === 'assistant' && msg.id !== 'error' && (
                                <div className="self-start mt-1 ml-1 flex items-center gap-2">
                                    <button
                                        onClick={() => handlePlaySpeech(msg.id, msg.content)}
                                        className="min-h-10 rounded-xl bg-primary/10 px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white flex items-center gap-2"
                                        aria-label={playingMessageId === msg.id && isSpeechPaused ? 'Resume message' : 'Play message'}
                                    >
                                        {playingMessageId === msg.id && !isSpeechPaused ? <Volume2 size={18} className="animate-pulse" /> : <Play size={18} />}
                                        {playingMessageId === msg.id && isSpeechPaused ? 'Resume' : 'Play'}
                                    </button>
                                    <button
                                        onClick={() => handlePauseSpeech(msg.id)}
                                        disabled={playingMessageId !== msg.id || isSpeechPaused}
                                        className="min-h-10 rounded-xl border border-gray-300 dark:border-gray-600 px-4 text-sm font-semibold text-gray-600 dark:text-gray-200 transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 flex items-center gap-2"
                                        aria-label="Pause message"
                                    >
                                        <Pause size={18} /> Pause
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {sending && (
                    <div className="flex justify-start">
                        <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-2xl rounded-bl-md">
                            <Loader2 size={18} className="text-primary animate-spin" />
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* Input bar */}
            <div className="border-t-2 border-gray-200 dark:border-gray-700 px-4 py-3">
                <div className="flex items-end gap-2">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type or speak a message..."
                        rows={1}
                        className="flex-1 resize-none bg-gray-100 dark:bg-gray-800 rounded-card px-4 py-3 text-base-sm text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <button
                        onClick={hasTypedMessage ? () => handleSend() : startVoiceInput}
                        disabled={sending}
                        aria-label={hasTypedMessage ? 'Send message' : 'Start voice input'}
                        className={`
                            shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-sm
                            ${hasTypedMessage && !sending
                                ? 'bg-primary text-white hover:bg-primary-light'
                                : isListening
                                ? 'bg-red-500 hover:bg-red-600 animate-pulse text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-primary'}
                        `}
                    >
                        {hasTypedMessage ? <Send size={20} /> : <Mic size={22} />}
                    </button>
                </div>
            </div>
        </div>
    );
}
