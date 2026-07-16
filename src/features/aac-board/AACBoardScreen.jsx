import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useProfileStore from '../../store/useProfileStore';
import useSettingsStore from '../../store/useSettingsStore';
import { logActivity } from '../../shared/lib/logActivity';
import ScreenHeader from '../../shared/components/ScreenHeader';
import SentenceStrip from './SentenceStrip';
import TileGrid from './TileGrid';
import useTextToSpeech from './useTextToSpeech';
import { DEFAULT_TILES } from './defaultTiles';
import { generateAACTiles } from '../../shared/lib/aiClient';
import { translate } from '../../shared/lib/translations';
import * as Icons from 'lucide-react';

const QUICK_SUGGESTIONS_EN = [
    'Mealtime',
    'Playground',
    'At the doctor',
    'School day',
    'Feeling sick',
    'Bedtime'
];

const QUICK_SUGGESTIONS_ML = [
    'ഭക്ഷണസമയം',
    'കളിസ്ഥലം',
    'ഡോക്ടറെ കാണുമ്പോൾ',
    'സ്കൂൾ സമയം',
    'അസുഖമുള്ളപ്പോൾ',
    'ഉറങ്ങുന്ന സമയം'
];

export default function AACBoardScreen() {
    const navigate = useNavigate();
    const profile = useProfileStore();
    const userId = useProfileStore((s) => s.id);
    const primaryMode = useProfileStore((s) => s.primaryMode);
    const displayLanguage = useSettingsStore((s) => s.displayLanguage);

    const isLowVision = primaryMode === 'lowVision';
    const { speakText, stopSpeaking } = useTextToSpeech();

    const [selectedTiles, setSelectedTiles] = useState([]);
    const [activeTab, setActiveTab] = useState('core');
    const [isSpeaking, setIsSpeaking] = useState(false);
    
    // AI Boards State (loaded from localStorage cache)
    const [aiBoards, setAiBoards] = useState(() => {
        const cached = localStorage.getItem('aac_ai_boards');
        return cached ? JSON.parse(cached) : [];
    });
    
    const [aiQuery, setAiQuery] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState(null);

    const getTabName = (tab) => {
        if (displayLanguage === 'ml') {
            switch (tab.id) {
                case 'core': return 'ആവശ്യങ്ങൾ';
                case 'feelings': return 'വികാരങ്ങൾ';
                case 'people_places': return 'സ്ഥലങ്ങൾ';
                case 'actions': return 'പ്രവർത്തനങ്ങൾ';
                default: return tab.labelEn;
            }
        }
        return tab.labelEn;
    };

    // Category Tabs list (static categories + generated AI boards)
    const tabsList = [
        { id: 'core', labelEn: 'Core Needs' },
        { id: 'feelings', labelEn: 'Feelings' },
        { id: 'people_places', labelEn: 'People & Places' },
        { id: 'actions', labelEn: 'Actions' },
        ...aiBoards.map(board => ({
            id: `ai-${board.id}`,
            labelEn: board.name,
            isCustom: true,
            boardId: board.id
        }))
    ];

    // Determine currently displayed tiles
    const activeTabObj = tabsList.find(t => t.id === activeTab);
    let displayedTiles = [];
    if (activeTabObj?.isCustom) {
        const board = aiBoards.find(b => b.id === activeTabObj.boardId);
        displayedTiles = board ? board.tiles : [];
    } else {
        displayedTiles = DEFAULT_TILES.filter(t => t.category === activeTab);
    }

    // Handlers
    const handleTileTap = (tile) => {
        setSelectedTiles(prev => [...prev, tile]);
        // Short local speech feedback for the tapped tile (very helpful for AAC board feedback)
        const label = displayLanguage === 'ml' ? tile.labelMl : tile.labelEn;
        speakText(label, displayLanguage === 'ml' ? 'ml-IN' : 'en-US');
    };

    const handleRemoveItem = (index) => {
        setSelectedTiles(prev => prev.filter((_, idx) => idx !== index));
    };

    const handleClear = () => {
        setSelectedTiles([]);
        stopSpeaking();
        setIsSpeaking(false);
    };

    const handleSpeakPhrase = () => {
        if (selectedTiles.length === 0) return;

        if (isSpeaking) {
            stopSpeaking();
            setIsSpeaking(false);
            return;
        }

        const phrase = selectedTiles.map(tile => 
            displayLanguage === 'ml' ? tile.labelMl : tile.labelEn
        ).join(' ');

        speakText(
            phrase,
            displayLanguage === 'ml' ? 'ml-IN' : 'en-US',
            () => setIsSpeaking(true),
            () => setIsSpeaking(false)
        );

        // Log the event to Supabase
        logActivity(userId, 'aac_phrase_spoken', { wordCount: selectedTiles.length });
    };

    const handleGenerateBoard = async (topic) => {
        if (!topic || topic.trim() === '') return;
        setIsGenerating(true);
        setError(null);
        try {
            const generated = await generateAACTiles(topic, profile);
            
            // Format tiles correctly
            const newTiles = generated.map((t, idx) => ({
                id: `ai-${topic.replace(/\s+/g, '-').toLowerCase()}-${idx}-${Date.now()}`,
                labelEn: t.labelEn,
                labelMl: t.labelMl,
                iconName: t.iconName,
                category: 'ai'
            }));

            const newBoard = {
                id: `board-${Date.now()}`,
                name: topic,
                tiles: newTiles
            };

            const updatedBoards = [newBoard, ...aiBoards].slice(0, 5); // Cache top 5 boards
            setAiBoards(updatedBoards);
            localStorage.setItem('aac_ai_boards', JSON.stringify(updatedBoards));
            
            setActiveTab(`ai-${newBoard.id}`);
            setAiQuery('');
        } catch (err) {
            console.error('Failed to generate AAC tiles:', err);
            setError(displayLanguage === 'ml' ? 'ടൈലുകൾ ഉണ്ടാക്കാൻ പറ്റിയില്ല. ദയവായി വീണ്ടും ശ്രമിക്കുക.' : 'Could not generate tiles. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDeleteBoard = (boardId, e) => {
        e.stopPropagation();
        const updatedBoards = aiBoards.filter(b => b.id !== boardId);
        setAiBoards(updatedBoards);
        localStorage.setItem('aac_ai_boards', JSON.stringify(updatedBoards));
        if (activeTab === `ai-${boardId}`) {
            setActiveTab('core');
        }
    };

    const suggestionChips = displayLanguage === 'ml' ? QUICK_SUGGESTIONS_ML : QUICK_SUGGESTIONS_EN;
    const rawEnglishSuggestions = QUICK_SUGGESTIONS_EN;

    return (
        <div className={`flex-1 flex flex-col min-h-0 overflow-y-auto ${
            isLowVision 
                ? 'bg-black text-yellow-400 font-bold' 
                : 'bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100'
        }`}>
            {/* Header */}
            <ScreenHeader 
                title={displayLanguage === 'ml' ? 'സംഭാഷണ സഹായി (AAC)' : 'AAC Communication Board'} 
                showBack={true} 
            />

            {/* Sentence Strip (Sticky at Top) */}
            <SentenceStrip
                items={selectedTiles}
                onRemoveItem={handleRemoveItem}
                onClear={handleClear}
                onSpeak={handleSpeakPhrase}
                isSpeaking={isSpeaking}
                displayLanguage={displayLanguage}
                isLowVision={isLowVision}
            />

            {/* Scrollable Main Area */}
            <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-4 flex flex-col gap-6 pb-28">
                {/* Horizontal Tabs Scroll */}
                <div className="flex flex-col gap-2">
                    <span className={`text-xs font-bold uppercase tracking-wider ${
                        isLowVision ? 'text-yellow-400' : 'text-gray-400 dark:text-gray-500'
                    }`}>
                        {displayLanguage === 'ml' ? 'വിഭാഗങ്ങൾ' : 'Categories'}
                    </span>
                    
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                        {tabsList.map((tab) => {
                            const isActive = activeTab === tab.id;
                            let btnStyle = '';
                            
                            if (isLowVision) {
                                btnStyle = isActive
                                    ? 'bg-yellow-400 text-black border-yellow-400'
                                    : 'bg-black text-yellow-400 border-yellow-400 hover:bg-yellow-400 hover:text-black';
                            } else {
                                btnStyle = isActive
                                    ? 'bg-primary dark:bg-accent-autism text-white border-transparent'
                                    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800';
                            }

                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-4 py-2.5 rounded-xl border-2 font-bold shrink-0 flex items-center gap-2 transition-all text-base-sm active:scale-95 ${btnStyle}`}
                                >
                                    <span>{getTabName(tab)}</span>
                                    {tab.isCustom && (
                                        <button
                                            onClick={(e) => handleDeleteBoard(tab.boardId, e)}
                                            className={`rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10 shrink-0 ${
                                                isActive ? 'text-white' : 'text-gray-400 hover:text-red-500'
                                            }`}
                                            aria-label={displayLanguage === 'ml' ? 'ബോർഡ് ഡിലീറ്റ് ചെയ്യുക' : 'Delete board'}
                                        >
                                            <Icons.X size={12} strokeWidth={3} />
                                        </button>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Grid of active tiles */}
                <div className={`p-4 rounded-2xl border ${
                    isLowVision 
                        ? 'border-yellow-400 bg-black' 
                        : 'border-gray-150 dark:border-gray-850 bg-white dark:bg-gray-900 shadow-xs'
                }`}>
                    {displayedTiles.length === 0 ? (
                        <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
                            <Icons.AlertCircle className={isLowVision ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-700'} size={36} />
                            <p className={`font-semibold ${isLowVision ? 'text-yellow-400' : 'text-gray-500'}`}>
                                {displayLanguage === 'ml' ? 'ഈ വിഭാഗത്തിൽ ടൈലുകൾ ലഭ്യമല്ല.' : 'No tiles available in this category.'}
                            </p>
                        </div>
                    ) : (
                        <TileGrid
                            tiles={displayedTiles}
                            onTileTap={handleTileTap}
                            displayLanguage={displayLanguage}
                            isLowVision={isLowVision}
                        />
                    )}
                </div>

                {/* AI Board generator section */}
                <div className={`p-5 rounded-2xl border flex flex-col gap-4 ${
                    isLowVision 
                        ? 'border-yellow-400 bg-black text-yellow-400' 
                        : 'border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 shadow-xs'
                }`}>
                    <div className="flex items-center gap-2.5">
                        <Icons.Sparkles className={isLowVision ? 'text-yellow-400' : 'text-primary dark:text-accent-autism'} size={20} />
                        <h2 className="font-bold text-base-md">
                            {displayLanguage === 'ml' ? 'പുതിയ എഐ ബോർഡ് നിർമ്മിക്കുക' : 'Create Custom AI Board'}
                        </h2>
                    </div>

                    <p className={`text-xs leading-relaxed ${isLowVision ? 'text-yellow-400/80' : 'text-gray-400 dark:text-gray-500'}`}>
                        {displayLanguage === 'ml' 
                            ? 'ഏതെങ്കിലും സാഹചര്യം തിരഞ്ഞെടുക്കുക അല്ലെങ്കിൽ നൽകുക (ഉദാ: സ്കൂൾ, കളിസ്ഥലം), എഐ ഉടൻ തന്നെ അനുയോജ്യമായ ആശയങ്ങൾ നിർമ്മിക്കും.' 
                            : 'Suggest a scenario (e.g., "visiting zoo", "bedtime routine") to generate a temporary contextual board instantly using AI.'}
                    </p>

                    {/* Quick Suggestions scroll */}
                    <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
                        {suggestionChips.map((chip, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleGenerateBoard(rawEnglishSuggestions[idx])}
                                disabled={isGenerating}
                                className={`px-3 py-1.5 rounded-full border font-bold text-xs shrink-0 transition-all active:scale-95 ${
                                    isLowVision
                                        ? 'border-yellow-400 hover:bg-yellow-400 hover:text-black text-yellow-400'
                                        : 'border-gray-250 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-150'
                                }`}
                            >
                                {chip}
                            </button>
                        ))}
                    </div>

                    {/* Search / Input Field */}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={aiQuery}
                            onChange={(e) => setAiQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleGenerateBoard(aiQuery)}
                            disabled={isGenerating}
                            placeholder={
                                displayLanguage === 'ml' 
                                    ? 'ഇവിടെ ടൈപ്പ് ചെയ്യുക (ഉദാ: പാർക്കിൽ)...' 
                                    : 'Type a custom scenario (e.g. at the park)...'
                            }
                            className={`flex-1 px-4 py-3 rounded-xl border text-base-sm focus:outline-none focus:ring-2 ${
                                isLowVision
                                    ? 'bg-black border-yellow-400 text-yellow-400 placeholder-yellow-400/40 focus:ring-yellow-400'
                                    : 'bg-gray-50 dark:bg-gray-950 border-gray-250 dark:border-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:ring-primary/20'
                            }`}
                        />
                        <button
                            onClick={() => handleGenerateBoard(aiQuery)}
                            disabled={isGenerating || !aiQuery.trim()}
                            className={`px-5 py-3 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 ${
                                isGenerating || !aiQuery.trim()
                                    ? 'opacity-40 cursor-not-allowed bg-gray-300 dark:bg-gray-800 text-gray-500'
                                    : isLowVision
                                        ? 'bg-yellow-400 text-black hover:bg-yellow-500'
                                        : 'bg-primary dark:bg-accent-autism text-white hover:bg-primary-dark shadow-sm'
                            }`}
                        >
                            {isGenerating ? (
                                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Icons.Plus size={16} strokeWidth={2.5} />
                                    <span>{displayLanguage === 'ml' ? 'നിർമ്മിക്കുക' : 'Create'}</span>
                                </>
                            )}
                        </button>
                    </div>

                    {error && (
                        <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
                            isLowVision 
                                ? 'border-yellow-400 text-yellow-400 bg-black' 
                                : 'border-red-150 dark:border-red-950/20 text-red-500 bg-red-50 dark:bg-red-950/10'
                        }`}>
                            <Icons.AlertTriangle size={14} />
                            <span>{error}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
