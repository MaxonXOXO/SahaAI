import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MessageSquare, Trash2 } from 'lucide-react';
import ScreenHeader from '../../shared/components/ScreenHeader';
import Button from '../../shared/components/Button';
import useProfileStore from '../../store/useProfileStore';
import { supabase } from '../../shared/lib/supabaseClient';

export default function ChatListScreen() {
    const navigate = useNavigate();
    const id = useProfileStore((s) => s.id);
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch all chats for this user
    useEffect(() => {
        if (!id) return;

        const fetchChats = async () => {
            const { data, error } = await supabase
                .from('chats')
                .select('*')
                .eq('user_id', id)
                .order('created_at', { ascending: false });

            if (!error && data) setChats(data);
            setLoading(false);
        };

        fetchChats();
    }, [id]);

    const createNewChat = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = id || session?.user?.id;
        if (!userId) return;

        const { data, error } = await supabase
            .from('chats')
            .insert({ user_id: userId, title: 'New Chat' })
            .select()
            .single();

        if (!error && data) {
            navigate(`/ai-chat/${data.id}`);
        }
    };

    const deleteChat = async (e, chatId) => {
        e.stopPropagation();
        await supabase.from('chats').delete().eq('id', chatId);
        setChats((prev) => prev.filter((c) => c.id !== chatId));
    };

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        const now = new Date();
        const diff = now - d;
        if (diff < 86400000) return 'Today';
        if (diff < 172800000) return 'Yesterday';
        return d.toLocaleDateString();
    };

    return (
        <div className="flex-1 flex flex-col">
            <ScreenHeader title="AI Chat" showBack={false} />

            <div className="flex-1 flex flex-col px-4 py-3 overflow-y-auto">
                <Button onClick={createNewChat} className="w-full mb-4 flex items-center justify-center gap-2">
                    <Plus size={18} />
                    New Conversation
                </Button>

                {loading ? (
                    <p className="text-base-sm text-gray-400 text-center mt-8">Loading chats...</p>
                ) : chats.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <MessageSquare size={28} className="text-primary" />
                        </div>
                        <p className="text-base-sm font-semibold text-gray-700 dark:text-gray-200">
                            No conversations yet
                        </p>
                        <p className="text-base-sm text-gray-400 mt-1">
                            Start a new chat — I adapt to your needs!
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {chats.map((chat) => (
                            <button
                                key={chat.id}
                                onClick={() => navigate(`/ai-chat/${chat.id}`)}
                                className="flex items-center gap-3 p-4 rounded-card border-2 border-gray-200 dark:border-gray-700 text-left hover:border-primary/40 transition-colors"
                            >
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <MessageSquare size={18} className="text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-base-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                                        {chat.title}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {formatDate(chat.created_at)}
                                    </p>
                                </div>
                                <div
                                    onClick={(e) => deleteChat(e, chat.id)}
                                    className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                >
                                    <Trash2 size={16} className="text-gray-400 hover:text-red-500" />
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
