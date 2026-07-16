import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowRight, Sparkles } from 'lucide-react';
import ScreenHeader from '../../shared/components/ScreenHeader';
import useProfileStore from '../../store/useProfileStore';
import { DASHBOARD_MODES, TILE_REGISTRY } from '../dashboard/dashboardModes';

// Descriptions for every tool to make the directory informative
const TILE_DESCRIPTIONS = {
    read: 'Read scanned images and documents with text-to-speech support.',
    math: 'Solve arithmetic problems with step-by-step guidance.',
    social: 'Practice conversations with custom AI-generated social scripts.',
    focus: 'A calming screen with a structured task list and white noise timer.',
    vision: 'Speech and contrast helpers tailored for low-vision reading.',
    routine: 'Organize your day with simple checklists and visual milestones.',
    textSimplifier: 'Simplify advanced vocabulary and paragraphs using AI.',
    readAloud: 'Read text contents aloud with custom speed.',
    dyslexiaFont: 'Enable readable font overlays across the app.',
    spellCheck: 'AI-assisted writing assistant with dyslexia corrections.',
    highlighter: 'Custom digital highlights to assist visual reading tracking.',
    aiChat: 'Personalized AI assistant configured for your accessibility needs.',
    mathSolver: 'Break down complex math calculations visually.',
    numberSense: 'Train visual recognition of quantities and calculations.',
    stepSolver: 'Step-by-step helper to solve math homework questions.',
    formulaSheet: 'Interactive cheatsheet with clear, spaced math formulas.',
    mathGames: 'Engage with numeric games to build math confidence.',
    visualAssistant: 'Voice-based description assistant for surroundings.',
    calmCorner: 'Soothing sounds, animations, and breathing exercises.',
    magnifier: 'Use your camera zoom to enlarge reading surfaces.',
    highContrast: 'Toggle high-contrast themes for visual clarity.',
    textReader: 'Scans printed texts and reads them aloud instantly.',
    largeKeyboard: 'Larger keyboard layout settings for ease of input.',
    colorInverter: 'Toggle inverted color mapping to reduce glare.',
};

const CATEGORIES = [
    {
        id: 'reading',
        title: 'Reading & Writing',
        description: 'Tools for reading assistance, speech, and translation',
        tiles: ['read', 'textSimplifier', 'readAloud', 'dyslexiaFont', 'spellCheck', 'highlighter']
    },
    {
        id: 'math',
        title: 'Math & Logic',
        description: 'Calculators, visual step solvers, and arithmetic assistance',
        tiles: ['math', 'mathSolver', 'numberSense', 'stepSolver', 'formulaSheet', 'mathGames']
    },
    {
        id: 'focus',
        title: 'Focus & Routine',
        description: 'ADHD focus helpers, structured routines, and sensory relaxation',
        tiles: ['focus', 'routine', 'calmCorner']
    },
    {
        id: 'sensory',
        title: 'Sensory & Vision',
        description: 'High contrast screens, text readers, color adjustment, and magnification',
        tiles: ['vision', 'visualAssistant', 'magnifier', 'highContrast', 'textReader', 'largeKeyboard', 'colorInverter']
    },
    {
        id: 'ai',
        title: 'AI Assistants',
        description: 'Interactive conversation helpers and social story generators',
        tiles: ['aiChat', 'social']
    }
];

export default function ToolsScreen() {
    const navigate = useNavigate();
    const primaryMode = useProfileStore((s) => s.primaryMode);
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
            const matchesSearch = tile.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (TILE_DESCRIPTIONS[tileKey] || '').toLowerCase().includes(searchQuery.toLowerCase());
            return matchesSearch;
        });
        return { ...category, tiles };
    }).filter(category => category.tiles.length > 0);

    return (
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 overflow-y-auto pb-6">
            <ScreenHeader title="All Tools" showBack={false} />

            {/* Sticky Search Bar */}
            <div className="sticky top-0 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-md px-4 py-3 z-10 border-b border-gray-100 dark:border-gray-800">
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search tools, helpers, settings..."
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
                        filteredCategories.map((category) => (
                            <motion.div
                                key={category.id}
                                layout
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex flex-col"
                            >
                                <div className="mb-3 px-1">
                                    <h2 className="text-base-md font-bold text-gray-800 dark:text-gray-100">
                                        {category.title}
                                    </h2>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {category.description}
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
                                                            {tile.label}
                                                        </span>
                                                        {isPrimary && (
                                                            <span className={`
                                                                text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 shrink-0
                                                                ${getPrimaryModeBgClass(primaryMode)}
                                                            `}>
                                                                <Sparkles size={8} />
                                                                Focus
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                                                        {TILE_DESCRIPTIONS[tileKey] || 'Adaptive assistant tool.'}
                                                    </p>
                                                </div>

                                                <ArrowRight className="text-gray-300 dark:text-gray-600 shrink-0" size={18} />
                                            </button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="py-12 text-center"
                        >
                            <p className="text-base-md font-semibold text-gray-700 dark:text-gray-300">
                                No tools matched your search
                            </p>
                            <p className="text-base-sm text-gray-400 mt-1">
                                Try searching for another name or concept
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
