import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowRight, Sparkles } from 'lucide-react';
import ScreenHeader from '../../shared/components/ScreenHeader';
import useProfileStore from '../../store/useProfileStore';
import useSettingsStore from '../../store/useSettingsStore';
import { DASHBOARD_MODES, TILE_REGISTRY } from '../dashboard/dashboardModes';
import { translate } from '../../shared/lib/translations';

const CATEGORY_MAP = {
    reading: { titleKey: 'categories.readingWriting', descKey: 'categories.readingWriting_desc' },
    math: { titleKey: 'categories.mathNumbers', descKey: 'categories.mathNumbers_desc' },
    focus: { titleKey: 'categories.focusRoutines', descKey: 'categories.focusRoutines_desc' },
    sensory: { titleKey: 'categories.sensoryVision', descKey: 'categories.sensoryVision_desc' },
    ai: { titleKey: 'categories.aiChatbot', descKey: 'categories.aiChatbot_desc' }
};

const CATEGORIES = [
    {
        id: 'reading',
        tiles: ['read', 'textSimplifier', 'readAloud', 'dyslexiaFont', 'spellCheck', 'highlighter']
    },
    {
        id: 'math',
        tiles: ['math', 'mathSolver', 'numberSense', 'stepSolver', 'formulaSheet', 'mathGames']
    },
    {
        id: 'focus',
        tiles: ['focus', 'routine', 'calmCorner']
    },
    {
        id: 'sensory',
        tiles: ['vision', 'visualAssistant', 'magnifier', 'highContrast', 'textReader', 'largeKeyboard', 'colorInverter']
    },
    {
        id: 'ai',
        tiles: ['aiChat', 'social', 'aacBoard', 'speechTherapy']
    }
];

export default function ToolsScreen() {
    const navigate = useNavigate();
    const primaryMode = useProfileStore((s) => s.primaryMode);
    const displayLanguage = useSettingsStore((s) => s.displayLanguage);
    const [searchQuery, setSearchQuery] = useState('');

    const isLowVision = primaryMode === 'lowVision';

    // Highlight/Border matching the user's active theme
    const getPrimaryModeBorderClass = (mode) => {
        switch (mode) {
            case 'adhd': return 'border-accent-adhd';
            case 'dyslexia': return 'border-accent-dyslexia';
            case 'autism': return 'border-accent-autism';
            case 'dyscalculia': return 'border-accent-dyscalculia';
            case 'lowVision': return 'border-yellow-400';
            default: return 'border-primary';
        }
    };

    const getPrimaryModeBgClass = (mode) => {
        switch (mode) {
            case 'adhd': return 'bg-accent-adhd/10 text-accent-adhd border-accent-adhd/20';
            case 'dyslexia': return 'bg-accent-dyslexia/10 text-accent-dyslexia border-accent-dyslexia/20';
            case 'autism': return 'bg-accent-autism/10 text-accent-autism border-accent-autism/20';
            case 'dyscalculia': return 'bg-accent-dyscalculia/10 text-accent-dyscalculia border-accent-dyscalculia/20';
            case 'lowVision': return 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30';
            default: return 'bg-primary/10 text-primary border-primary/20';
        }
    };

    const isPrimaryTool = (tileKey) => {
        if (!primaryMode) return false;
        const modeConfig = DASHBOARD_MODES[primaryMode];
        return modeConfig?.tiles?.includes(tileKey);
    };

    // Filter tools based on search query
    const filteredCategories = CATEGORIES.map(category => {
        const tiles = category.tiles.filter(tileKey => {
            const tile = TILE_REGISTRY[tileKey];
            if (!tile) return false;
            
            const label = translate('tile_' + tileKey, displayLanguage);
            const desc = translate('tile_' + tileKey + '_desc', displayLanguage);
            
            const matchesSearch = label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                desc.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesSearch;
        });
        return { ...category, tiles };
    }).filter(category => category.tiles.length > 0);

    return (
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 overflow-y-auto pb-24">
            <ScreenHeader title={translate('toolsTitle', displayLanguage)} showBack={false} />

            {/* Sticky Search Bar */}
            <div className="sticky top-0 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-md px-4 py-3 z-10 border-b border-gray-100 dark:border-gray-800">
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder={translate('searchPlaceholder', displayLanguage)}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-base-sm"
                    />
                </div>
            </div>

            {/* Tools Directory */}
            <div className="px-4 py-4 flex flex-col gap-6">
                <AnimatePresence mode="popLayout">
                    {filteredCategories.length > 0 ? (
                        filteredCategories.map((category) => {
                            const catMeta = CATEGORY_MAP[category.id] || { titleKey: category.id, descKey: '' };
                            return (
                                <motion.div
                                    key={category.id}
                                    layout
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="flex flex-col animate-none"
                                >
                                    <div className="mb-3 px-1">
                                        <h2 className="text-base-md font-bold text-gray-800 dark:text-gray-100">
                                            {translate(catMeta.titleKey, displayLanguage)}
                                        </h2>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {translate(catMeta.descKey, displayLanguage)}
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        {category.tiles.map((tileKey) => {
                                            const tile = TILE_REGISTRY[tileKey];
                                            const isPrimary = isPrimaryTool(tileKey);
                                            const Icon = tile.icon;

                                            return (
                                                <button
                                                    key={tileKey}
                                                    onClick={() => navigate(tile.path)}
                                                    className={`
                                                        w-full flex items-center gap-4 p-4 rounded-2xl text-left bg-white dark:bg-gray-800 border-2 transition-all hover:scale-[1.01] active:scale-[0.99]
                                                        ${isPrimary 
                                                            ? `${getPrimaryModeBorderClass(primaryMode)} shadow-sm` 
                                                            : 'border-gray-100 dark:border-gray-750 shadow-xs'}
                                                    `}
                                                >
                                                    {/* Icon container */}
                                                    <div className={`
                                                        w-12 h-12 rounded-2xl flex items-center justify-center shrink-0
                                                        ${isLowVision ? 'bg-transparent text-yellow-400 border border-yellow-400/30' : tile.color}
                                                    `}>
                                                        <Icon size={24} className={isLowVision ? 'text-yellow-400' : 'text-white'} />
                                                    </div>

                                                    {/* Title & Description */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-base-sm font-bold text-gray-800 dark:text-gray-100 truncate">
                                                                {translate('tile_' + tileKey, displayLanguage)}
                                                            </span>
                                                            {isPrimary && (
                                                                <span className={`
                                                                    text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 shrink-0
                                                                    ${getPrimaryModeBgClass(primaryMode)}
                                                                `}>
                                                                    <Sparkles size={8} />
                                                                    {translate('primaryFocus', displayLanguage)}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                                                            {translate('tile_' + tileKey + '_desc', displayLanguage)}
                                                        </p>
                                                    </div>

                                                    <ArrowRight className="text-gray-300 dark:text-gray-600 shrink-0" size={18} />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            );
                        })
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="py-12 text-center"
                        >
                            <p className="text-base-md font-semibold text-gray-700 dark:text-gray-300">
                                {displayLanguage === 'ml' ? 'തിരച്ചിലുമായി പൊരുത്തപ്പെടുന്ന ഉപകരണങ്ങളൊന്നുമില്ല' : 'No tools matched your search'}
                            </p>
                            <p className="text-base-sm text-gray-400 mt-1">
                                {displayLanguage === 'ml' ? 'മറ്റൊരു പേരോ ആശയമോ തിരയാൻ ശ്രമിക്കുക' : 'Try searching for another name or concept'}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
