import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Send, Loader2 } from 'lucide-react';
import ScreenHeader from '../../shared/components/ScreenHeader';
import useProfileStore from '../../store/useProfileStore';
import { supabase } from '../../shared/lib/supabaseClient';
import { buildSystemPrompt, sendMessage } from '../../shared/lib/aiClient';
import { renderMarkdown } from '../../shared/lib/parseMarkdown';

export default function ChatScreen() {
    const { chatId } = useParams();
    const profile = useProfileStore();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [chatTitle, setChatTitle] = useState('Chat');
    const bottomRef = useRef(null);

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
        };

        load();
    }, [chatId]);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        const text = input.trim();
        if (!text || sending) return;

        setInput('');
        setSending(true);

        // 1. Add user message to UI + DB
        const userMsg = { role: 'user', content: text, chat_id: chatId };
        setMessages((prev) => [...prev, { ...userMsg, id: 'temp-user', created_at: new Date().toISOString() }]);

        await supabase.from('messages').insert(userMsg);

        // 2. Build system prompt from current profile
        const systemPrompt = buildSystemPrompt(profile);

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
                    content: 'Sorry, I had trouble responding. Please try again.',
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
                        <div
                            className={`
                                max-w-[80%] px-4 py-3 rounded-2xl text-base-sm whitespace-pre-wrap
                                ${msg.role === 'user'
                                    ? 'bg-primary text-white rounded-br-md'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-md'}
                            `}
                        >
                            {renderMarkdown(msg.content)}
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
                        placeholder="Type your message..."
                        rows={1}
                        className="flex-1 resize-none bg-gray-100 dark:bg-gray-800 rounded-card px-4 py-3 text-base-sm text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || sending}
                        className={`
                            w-12 h-12 rounded-full flex items-center justify-center transition-colors
                            ${input.trim() && !sending
                                ? 'bg-primary text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-400'}
                        `}
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
