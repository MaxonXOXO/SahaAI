import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Mic, BookOpen, Info, Volume2, ArrowRight, Search, MessageSquare } from 'lucide-react';
import useProfileStore from '../../store/useProfileStore';
import useSettingsStore from '../../store/useSettingsStore';
import { useThemeVariables } from '../../app/hooks/useThemeVariables';
import useRecentActivity from '../../shared/hooks/useRecentActivity';
import { TILE_REGISTRY } from '../dashboard/dashboardModes';
import { EVENT_REGISTRY, getEventLabel, getEventLink } from '../../shared/lib/eventRegistry';
import { translate } from '../../shared/lib/translations';
import { supabase } from '../../shared/lib/supabaseClient';

import banner1 from '../../assets/banner1.png';
import banner2 from '../../assets/banner2.png';
import banner3 from '../../assets/banner3.png';
import banner4 from '../../assets/banner4.png';
import banner5 from '../../assets/banner5.png';
import banner1Dark from '../../assets/banner1_dark.png';
import banner2Dark from '../../assets/banner2_dark.png';
import banner3Dark from '../../assets/banner3_dark.png';
import banner4Dark from '../../assets/banner4_dark.png';

// ── Per-profile tile assignments (from spec) ─────────────────────────────────
const PROFILE_TILES = {
    autism:       ['aacBoard', 'social', 'routine', 'speechTherapy', 'focus', 'vision'],
    adhd:         ['focus', 'routine', 'math', 'read', 'social', 'speechTherapy'],
    dyslexia:     ['read', 'vision', 'math', 'focus', 'speechTherapy', 'social'],
    dyscalculia:  ['math', 'focus', 'read', 'routine', 'vision', 'social'],
    lowVision:    ['vision', 'read', 'aacBoard', 'math'],
    default:      ['read', 'math', 'focus', 'routine', 'aacBoard', 'speechTherapy'],
};

// ── Time-based greeting key helper ───────────────────────────────────────────
function getGreetingKey() {
    const hour = new Date().getHours();
    if (hour < 12) return 'homeGreetingMorning';
    if (hour < 17) return 'homeGreetingAfternoon';
    return 'homeGreetingEvening';
}

const getBannerImage = (modeKey, useDarkVariant) => {
    switch (modeKey) {
        case 'adhd': return useDarkVariant ? banner1Dark : banner1;
        case 'autism': return useDarkVariant ? banner2Dark : banner2;
        case 'dyslexia': return useDarkVariant ? banner3Dark : banner3;
        case 'dyscalculia': return useDarkVariant ? banner4Dark : banner4;
        case 'lowVision': return banner5;
        default: return useDarkVariant ? banner1Dark : banner1;
    }
}

export default function HomeScreen() {
    const navigate = useNavigate();
    const name = useProfileStore((s) => s.name);
    const username = useProfileStore((s) => s.username);
    const avatar_base64 = useProfileStore((s) => s.avatar_base64);
    const primaryMode = useProfileStore((s) => s.primaryMode);
    const displayLanguage = useSettingsStore((s) => s.displayLanguage);
    const { activeContrast } = useThemeVariables();
    const { recentItems, loading: recentLoading } = useRecentActivity(1);

    const [searchQuery, setSearchQuery] = useState('');
    const [isListening, setIsListening] = useState(false);

    const displayName = name || username || 'there';
    const isLowVision = primaryMode === 'lowVision';
    const modeKey = primaryMode && PROFILE_TILES[primaryMode] ? primaryMode : 'default';
    const tiles = PROFILE_TILES[modeKey];
    const bannerImage = getBannerImage(modeKey, activeContrast !== 'light');

    // Resolve the most recent activity for the Continue Card
    const continueItem = useMemo(() => {
        if (recentLoading || recentItems.length === 0) return null;
        const item = recentItems[0];
        const entry = EVENT_REGISTRY[item.event_type];
        if (!entry) return null;

        const matchedTile = Object.entries(TILE_REGISTRY).find(
            ([_, t]) => t.path === entry.path
        );

        return {
            label: getEventLabel(item.event_type),
            link: getEventLink(item.event_type),
            icon: matchedTile?.[1]?.icon || BookOpen,
            color: matchedTile?.[1]?.color || 'bg-primary',
            tileKey: matchedTile?.[0],
        };
    }, [recentItems, recentLoading]);

    // Handle search submission — ALWAYS route to AI Chat
    const handleSearchSubmit = async (e, queryOverride = null) => {
        if (e) e.preventDefault();
        const q = (queryOverride || searchQuery).trim();
        if (!q) {
            navigate('/ai-chat');
            return;
        }

        // Create a new chat and route there
        const { data: { session } } = await supabase.auth.getSession();
        const userId = useProfileStore.getState().id || session?.user?.id;
        if (userId) {
            const { data, error } = await supabase
                .from('chats')
                .insert({ user_id: userId, title: q.slice(0, 60) })
                .select()
                .single();
            if (!error && data) {
                navigate(`/ai-chat/${data.id}`, { state: { initialMessage: q } });
                return;
            }
        }
        // Fallback — route to chat list
        navigate('/ai-chat');
    };

    // Simple Voice Search using Web Speech API
    const startVoiceSearch = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Voice search is not supported in this browser.");
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
            setSearchQuery(transcript);
            // Auto submit after voice
            handleSearchSubmit(null, transcript);
        };

        recognition.start();
    };

    return (
        <div
            className="flex-1 flex flex-col min-h-0 overflow-y-auto relative"
            style={{
                // Theme selection, rather than the disability profile, owns
                // the page background. This keeps Dark, Soft, and High modes
                // consistent even when Low Vision is not selected.
                background: 'var(--a11y-bg)',
                color: 'var(--a11y-text)',
                transition: 'var(--a11y-transition)',
            }}
        >
            {/* ── Header Row (SahaAI) ─────────────────────────────────────── */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2 md:px-8">
                {/* Left: Chat History */}
                <div className="flex items-center justify-start w-1/3">
                    {/* Chat History Button */}
                    <button
                        onClick={() => navigate('/ai-chat')}
                        aria-label="Recent AI Chats"
                        className="shrink-0 flex items-center justify-center rounded-full bg-white/80 dark:bg-gray-800/80 shadow-md border-2 transition-transform hover:scale-105 active:scale-95"
                        style={{
                            width: isLowVision ? '56px' : '48px',
                            height: isLowVision ? '56px' : '48px',
                            borderColor: 'var(--a11y-primary)',
                        }}
                    >
                        <MessageSquare size={isLowVision ? 26 : 22} style={{ color: 'var(--a11y-primary)' }} />
                    </button>
                </div>
                
                {/* Center: Logo */}
                <div className="flex-1 flex justify-center">
                    <h1 className="text-xl md:text-2xl font-bold tracking-wide" style={{ color: 'var(--a11y-primary)' }}>
                        SahaAI
                    </h1>
                </div>

                {/* Right: Profile Avatar */}
                <div className="flex items-center justify-end w-1/3">
                    {/* Profile Avatar Button */}
                    <button
                        onClick={() => navigate('/profile')}
                        aria-label={translate('profile', displayLanguage)}
                        className="shrink-0 flex items-center justify-center overflow-hidden rounded-full shadow-md border-2 transition-transform hover:scale-105 active:scale-95"
                        style={{
                            width: isLowVision ? '56px' : '48px',
                            height: isLowVision ? '56px' : '48px',
                            borderColor: 'var(--a11y-primary)',
                            background: 'var(--a11y-primary)',
                            transition: 'var(--a11y-transition)',
                        }}
                    >
                        {avatar_base64 ? (
                            <img src={avatar_base64} alt="Profile Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <span className="font-bold text-white text-base">
                                {(name || username || '?').charAt(0).toUpperCase()}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* ── Greeting & Banner Area ───────────────────────────────────── */}
            {continueItem ? (
                <div className="px-5 pb-6 md:px-8 pt-2">
                    <button
                        onClick={() => continueItem.link && navigate(continueItem.link)}
                        className="w-full text-left relative overflow-hidden rounded-[2.5rem] shadow-md hover:shadow-lg transition-shadow group"
                        style={{ minHeight: '180px' }}
                    >
                        <img src={bannerImage} alt="Banner" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        
                        <div className="relative z-10 p-6 flex flex-col h-full justify-between">
                            <div>
                                <p className="text-gray-800 text-xl font-medium leading-none mb-3">
                                    {translate(getGreetingKey(), displayLanguage)},
                                </p>
                                <h2 className="text-4xl md:text-5xl font-bold text-primary flex items-center gap-2 leading-none">
                                    {displayName} <span className="text-amber-400 text-4xl md:text-5xl">☀️</span>
                                </h2>
                            </div>

                            <div className="flex items-center gap-4 mt-6">
                                <div
                                    className={`shrink-0 flex items-center justify-center rounded-2xl ${continueItem.color} shadow-sm`}
                                    style={{ width: '56px', height: '56px' }}
                                >
                                    <continueItem.icon size={28} className="text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">
                                        {translate('continueActivity', displayLanguage)}
                                    </p>
                                    <p className="text-xl font-bold text-gray-900 truncate">
                                        {continueItem.tileKey
                                            ? translate('tile_' + continueItem.tileKey, displayLanguage)
                                            : continueItem.label}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </button>
                </div>
            ) : (
                <>
                <div className="px-5 pb-6 md:px-8 pt-2">
                    <div 
                        className="w-full relative overflow-hidden rounded-[2.5rem] shadow-sm flex flex-col justify-center px-8"
                        style={{ minHeight: '180px' }}
                    >
                        <img src={bannerImage} alt="Banner" className="absolute inset-0 w-full h-full object-cover" />
                        
                        <div className="relative z-10 py-6">
                            <p className="text-gray-800 text-xl font-medium leading-none mb-3">
                                {translate(getGreetingKey(), displayLanguage)},
                            </p>
                            <h1 className="text-4xl md:text-5xl font-bold text-primary flex items-center gap-2 leading-none">
                                {displayName} <span className="text-amber-400 text-4xl md:text-5xl">☀️</span>
                            </h1>
                        </div>
                    </div>
                </div>
                </>
            )}

            {/* ── Feature Tile Grid ──────────────────────────────────────── */}
            <div className="px-5 mb-8 md:px-8">
                <div
                    className="grid gap-4"
                    style={{ gridTemplateColumns: '1fr 1fr' }}
                >
                    {tiles.map((tileKey) => {
                        const tile = TILE_REGISTRY[tileKey];
                        if (!tile) return null;
                        const Icon = tile.icon;
                        
                        // Split the translation string by space to attempt to put it on two lines if possible
                        const translatedLabel = translate('tile_' + tileKey, displayLanguage) || '';
                        const words = translatedLabel.split(' ');
                        const line1 = words[0];
                        const line2 = words.slice(1).join(' ');

                        return (
                            <button
                                key={tileKey}
                                onClick={() => navigate(tile.path)}
                                className="flex flex-row items-center gap-4 bg-white/80 backdrop-blur-md rounded-[1.75rem] p-5 shadow-sm hover:shadow-md transition-all text-left"
                                style={{
                                    minHeight: isLowVision ? '110px' : '100px',
                                }}
                            >
                                <div
                                    className={`shrink-0 flex items-center justify-center rounded-[1.25rem] ${tile.color}`}
                                    style={{
                                        width: isLowVision ? '64px' : '56px',
                                        height: isLowVision ? '64px' : '56px',
                                    }}
                                >
                                    <Icon
                                        size={isLowVision ? 32 : 28}
                                        className="text-white"
                                    />
                                </div>
                                <span
                                    className="font-bold text-gray-800 leading-tight flex-1 md:text-lg"
                                    style={{
                                        fontFamily: 'var(--a11y-font-heading)',
                                        fontSize: isLowVision ? '1.15rem' : '1.05rem',
                                    }}
                                >
                                    {line1} {line2 && <><br />{line2}</>}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Mode-Transparency Helper Text ──────────────────────────── */}
            <div className="px-5 mb-8 md:px-8">
                <div className="bg-primary/5 rounded-[1.5rem] p-5 flex flex-row items-center gap-5 border border-primary/10">
                    <div className="flex-1 flex items-center gap-3 text-[0.85rem] md:text-base text-gray-700 leading-tight">
                        <Info className="text-primary shrink-0" size={20} />
                        <span>{translate('searchHelperLine1', displayLanguage)}</span>
                    </div>
                    <div className="w-px h-10 bg-primary/20 shrink-0"></div>
                    <div className="flex-1 flex items-center gap-3 text-[0.85rem] md:text-base text-gray-700 leading-tight">
                        <Volume2 className="text-primary shrink-0" size={20} />
                        <span>{translate('searchHelperLine2', displayLanguage)}</span>
                    </div>
                </div>
            </div>

            {/* ── Global Search Bar (White Background merging with Nav) ── */}
            <div className="bg-white rounded-t-[3rem] pt-8 pb-24 md:pb-28 px-5 md:px-8 mt-auto shadow-[0_-12px_30px_rgba(0,0,0,0.03)] relative z-10">
                <form onSubmit={handleSearchSubmit} className="relative">
                    <div className="rounded-[3rem] border border-primary/30 bg-white p-2 flex items-center shadow-md focus-within:border-primary/60 focus-within:shadow-lg transition-all">
                        <div className="w-14 h-14 flex items-center justify-center shrink-0">
                            <Search className="text-primary" size={28} />
                        </div>
                        <div className="flex-1 flex flex-col justify-center ml-2 overflow-hidden">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search or ask anything"
                                className="bg-transparent border-none outline-none text-[1.25rem] md:text-[1.35rem] font-semibold text-gray-800 placeholder-gray-400 w-full truncate"
                            />
                            {displayLanguage === 'ml' && (
                                <span className="text-[0.75rem] md:text-sm text-gray-400 truncate mt-0.5">
                                    എന്തും തിരയുക അല്ലെങ്കിൽ ചോദിക്കുക
                                </span>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={startVoiceSearch}
                            aria-label="Voice input"
                            className={`shrink-0 w-16 h-16 flex items-center justify-center rounded-full transition-colors ml-3 shadow-md ${isListening ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-primary hover:bg-primary-light'}`}
                        >
                            <Mic size={28} className="text-white" />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
