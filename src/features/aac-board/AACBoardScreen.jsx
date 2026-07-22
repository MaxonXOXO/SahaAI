import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useProfileStore from '../../store/useProfileStore';
import useSettingsStore from '../../store/useSettingsStore';
import { logActivity } from '../../shared/lib/logActivity';
import ScreenHeader from '../../shared/components/ScreenHeader';
import SentenceStrip from './SentenceStrip';
import TileGrid from './TileGrid';
import useTextToSpeech from './useTextToSpeech';
import { DEFAULT_TILES, CATEGORIES } from './defaultTiles';
import { generateAACTiles } from '../../shared/lib/aiClient';
import * as Icons from 'lucide-react';

const QUICK_SUGGESTIONS_EN = [
    'At the doctor',
    'Bedtime routine',
    'Mealtime',
    'Playground',
    'School day',
    'Feeling sick'
];

const QUICK_SUGGESTIONS_ML = [
    'ഡോക്ടറെ കാണുമ്പോൾ',
    'ഉറങ്ങുന്ന സമയം',
    'ഭക്ഷണസമയം',
    'കളിസ്ഥലം',
    'സ്കൂൾ സമയം',
    'അസുഖമുള്ളപ്പോൾ'
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
    const [currentPage, setCurrentPage] = useState(1);
    const [isSpeaking, setIsSpeaking] = useState(false);
    
    // AI Boards State (loaded from localStorage cache)
    const [aiBoards, setAiBoards] = useState(() => {
        const cached = localStorage.getItem('aac_ai_boards');
        return cached ? JSON.parse(cached) : [];
    });
    
    const [showCreateInput, setShowCreateInput] = useState(false);
    const [aiQuery, setAiQuery] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState(null);

    // Reset page to 1 when changing tabs
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab]);

    // Category Tabs list (static categories + custom AI boards)
    const categoryTabs = [
        { id: 'core', labelEn: 'Core Words', labelMl: 'ആവശ്യങ്ങൾ', icon: 'Heart', color: 'emerald' },
        { id: 'feelings', labelEn: 'Feelings', labelMl: 'വികാരങ്ങൾ', icon: 'Smile', color: 'amber' },
        { id: 'people_places', labelEn: 'People & Places', labelMl: 'സ്ഥലങ്ങൾ', icon: 'Users', color: 'purple' },
        { id: 'actions', labelEn: 'Actions', labelMl: 'പ്രവർത്തനങ്ങൾ', icon: 'Activity', color: 'blue' },
        ...aiBoards.map(board => ({
            id: `ai-${board.id}`,
            labelEn: board.name,
            labelMl: board.name,
            icon: 'Sparkles',
            color: 'purple',
            isCustom: true,
            boardId: board.id
        }))
    ];

    // Determine current active tiles
    const activeTabObj = categoryTabs.find(t => t.id === activeTab);
    let allTabTiles = [];
    if (activeTabObj?.isCustom) {
        const board = aiBoards.find(b => b.id === activeTabObj.boardId);
        allTabTiles = board ? board.tiles : [];
    } else {
        allTabTiles = DEFAULT_TILES.filter(t => t.category === activeTab);
    }

    // Pagination logic (8 tiles per page)
    const TILES_PER_PAGE = 8;
    const totalPages = Math.max(1, Math.ceil(allTabTiles.length / TILES_PER_PAGE));
    const startIndex = (currentPage - 1) * TILES_PER_PAGE;
    const displayedTiles = allTabTiles.slice(startIndex, startIndex + TILES_PER_PAGE);

    // Handlers
    const handleTileTap = (tile) => {
        setSelectedTiles(prev => [...prev, tile]);
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

        logActivity(userId, 'aac_phrase_spoken', { wordCount: selectedTiles.length });
    };

    const handleGenerateBoard = async (topic) => {
        if (!topic || topic.trim() === '') return;
        setIsGenerating(true);
        setError(null);
        try {
            const generated = await generateAACTiles(topic, profile);
            
            const colors = ['green', 'blue', 'yellow', 'purple', 'red'];
            const newTiles = generated.map((t, idx) => ({
                id: `ai-${topic.replace(/\s+/g, '-').toLowerCase()}-${idx}-${Date.now()}`,
                labelEn: t.labelEn,
                labelMl: t.labelMl,
                iconName: t.iconName || 'Sparkles',
                category: 'ai',
                tileColor: colors[idx % colors.length]
            }));

            const newBoard = {
                id: `board-${Date.now()}`,
                name: topic,
                tiles: newTiles
            };

            const updatedBoards = [newBoard, ...aiBoards].slice(0, 5);
            setAiBoards(updatedBoards);
            localStorage.setItem('aac_ai_boards', JSON.stringify(updatedBoards));
            
            setActiveTab(`ai-${newBoard.id}`);
            setAiQuery('');
            setShowCreateInput(false);
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

    return (
        <div className={`flex-1 flex flex-col min-h-0 overflow-y-auto ${
            isLowVision 
                ? 'bg-black text-yellow-400 font-bold' 
                : 'bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100'
        }`}>
            {/* Top Screen Header */}
            <ScreenHeader 
                title={displayLanguage === 'ml' ? 'സംഭാഷണ സഹായി (AAC)' : 'AAC Board'} 
                showBack={true} 
            />


            {/* Main Area */}
            <div className="flex-1 max-w-3xl w-full mx-auto px-4 py-4 flex flex-col gap-6 pb-28">
                {/* 1. Sentence Builder Area */}
                <SentenceStrip
                    items={selectedTiles}
                    onRemoveItem={handleRemoveItem}
                    onClear={handleClear}
                    onSpeak={handleSpeakPhrase}
                    isSpeaking={isSpeaking}
                    displayLanguage={displayLanguage}
                    isLowVision={isLowVision}
                />

                {/* 2. Choose a Category Section */}
                <div className="flex flex-col gap-2.5">
                    <h2 className="text-base font-extrabold text-gray-900 dark:text-white px-1">
                        {displayLanguage === 'ml' ? 'വിഭാഗം തിരഞ്ഞെടുക്കുക' : 'Choose a Category'}
                    </h2>
                    
                    {/* Horizontal scroll/grid of categories */}
                    <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                        {categoryTabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            const IconComp = Icons[tab.icon] || Icons.Grid;

                            let activeStyle = '';
                            if (isLowVision) {
                                activeStyle = isActive
                                    ? 'bg-yellow-400 text-black border-yellow-400'
                                    : 'bg-black text-yellow-400 border-yellow-400';
                            } else {
                                activeStyle = isActive
                                    ? 'bg-[#EBF8F2] dark:bg-emerald-950/70 border-2 border-emerald-500 text-emerald-900 dark:text-emerald-100 shadow-xs'
                                    : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800';
                            }

                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex flex-col items-center justify-center gap-1.5 py-3 px-4 rounded-2xl border min-w-[105px] shrink-0 font-extrabold text-xs sm:text-sm transition-all duration-200 active:scale-95 ${activeStyle}`}
                                >
                                    <IconComp
                                        size={22}
                                        className={
                                            isActive
                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                : tab.id === 'feelings'
                                                ? 'text-amber-500'
                                                : tab.id === 'people_places'
                                                ? 'text-purple-500'
                                                : tab.id === 'actions'
                                                ? 'text-blue-500'
                                                : 'text-gray-400'
                                        }
                                    />
                                    <span className="truncate max-w-[90px]">
                                        {displayLanguage === 'ml' ? tab.labelMl : tab.labelEn}
                                    </span>
                                    {tab.isCustom && (
                                        <button
                                            onClick={(e) => handleDeleteBoard(tab.boardId, e)}
                                            className="text-gray-400 hover:text-red-500 ml-1"
                                            aria-label="Delete"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 3. AAC Grid & Pagination Section */}
                <div className="flex flex-col gap-4">
                    {displayedTiles.length === 0 ? (
                        <div className="py-12 text-center rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center gap-2">
                            <Icons.AlertCircle className="text-gray-400" size={32} />
                            <p className="font-bold text-gray-500 text-sm">
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

                    {/* Pagination Bar matching mockup */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-2 px-1">
                            {/* Previous Button */}
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-bold text-xs sm:text-sm transition-all ${
                                    currentPage === 1
                                        ? 'opacity-40 cursor-not-allowed bg-gray-100 dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-800'
                                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 active:scale-95 shadow-xs'
                                }`}
                            >
                                <Icons.ArrowLeft size={16} />
                                <span>{displayLanguage === 'ml' ? 'മുമ്പത്തേത്' : 'Previous'}</span>
                            </button>

                            {/* Page dot indicator */}
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <div className="flex items-center gap-1.5">
                                    {Array.from({ length: totalPages }).map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={`w-2 h-2 rounded-full transition-all ${
                                                currentPage === idx + 1
                                                    ? 'bg-emerald-600 w-4'
                                                    : 'bg-gray-300 dark:bg-gray-700'
                                            }`}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Next Button */}
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-bold text-xs sm:text-sm transition-all ${
                                    currentPage === totalPages
                                        ? 'opacity-40 cursor-not-allowed bg-gray-100 dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-800'
                                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 active:scale-95 shadow-xs'
                                }`}
                            >
                                <span>{displayLanguage === 'ml' ? 'അടുത്തത്' : 'Next'}</span>
                                <Icons.ArrowRight size={16} />
                            </button>
                        </div>
                    )}
                </div>

                {/* 4. Create Custom Board Card Section matching mockup */}
                <div className="flex flex-col gap-2.5">
                    <h2 className="text-base font-extrabold text-gray-900 dark:text-white px-1">
                        {displayLanguage === 'ml' ? 'കസ്റ്റം ബോർഡ് നിർമ്മിക്കുക' : 'Create Custom Board'}
                    </h2>

                    <div className="rounded-3xl border border-purple-100 dark:border-purple-900/60 bg-purple-50/60 dark:bg-purple-950/40 p-4 sm:p-5 flex flex-col gap-4 shadow-xs">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                {/* Wand icon */}
                                <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-900/80 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0">
                                    <Icons.Sparkles className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white leading-tight">
                                        {displayLanguage === 'ml' ? 'സാഹചര്യം വിവരിക്കുക' : 'Describe a situation or activity.'}
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        {displayLanguage === 'ml' ? 'ഉദാഹരണം: ഡോക്ടറെ കാണുമ്പോൾ, ഉറങ്ങുന്ന സമയം' : 'Example: At the doctor, Bedtime routine'}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowCreateInput(prev => !prev)}
                                className="bg-[#6C5CE7] hover:bg-[#5B4BC4] text-white px-4 sm:px-5 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm flex items-center gap-1.5 shrink-0 shadow-sm transition-all active:scale-95"
                            >
                                <Icons.Plus size={16} strokeWidth={3} />
                                <span>{displayLanguage === 'ml' ? 'നിർമ്മിക്കുക' : 'Create'}</span>
                            </button>
                        </div>

                        {/* Input Row expandable */}
                        {(showCreateInput || isGenerating) && (
                            <div className="pt-2 border-t border-purple-100 dark:border-purple-900/40 space-y-3">
                                {/* Quick suggestion chips */}
                                <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
                                    {suggestionChips.map((chip, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleGenerateBoard(QUICK_SUGGESTIONS_EN[idx])}
                                            disabled={isGenerating}
                                            className="px-3 py-1.5 rounded-full bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-200 font-bold text-xs shrink-0 hover:bg-purple-100 dark:hover:bg-purple-900 transition-all active:scale-95"
                                        >
                                            {chip}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={aiQuery}
                                        onChange={(e) => setAiQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleGenerateBoard(aiQuery)}
                                        disabled={isGenerating}
                                        placeholder={
                                            displayLanguage === 'ml'
                                                ? 'ഇവിടെ ടൈപ്പ് ചെയ്യുക (ഉദാ: സ്കൂൾ ദിവസം)...'
                                                : 'Type activity (e.g. at the doctor)...'
                                        }
                                        className="flex-1 px-4 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-purple-200 dark:border-purple-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
                                    />
                                    <button
                                        onClick={() => handleGenerateBoard(aiQuery)}
                                        disabled={isGenerating || !aiQuery.trim()}
                                        className="px-4 py-2.5 rounded-xl bg-purple-600 text-white font-bold text-xs sm:text-sm hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
                                    >
                                        {isGenerating ? (
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <span>Generate</span>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 text-xs font-bold flex items-center gap-2">
                                <Icons.AlertTriangle size={14} />
                                <span>{error}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
