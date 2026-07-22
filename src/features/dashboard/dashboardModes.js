import { FileText, Calculator, MessageSquare, Sparkles, Eye, ListChecks, Type, Volume2, Gamepad2, Settings2, Moon, Search, Camera, ScanText } from 'lucide-react';

// Central registry of all possible quick access tiles
export const TILE_REGISTRY = {
    read: { label: 'Read Text', icon: FileText, path: '/reading-mode', color: 'bg-primary' },
    math: { label: 'Math Helper', icon: Calculator, path: '/math-helper', color: 'bg-primary' },
    social: { label: 'Social Stories', icon: MessageSquare, path: '/social-story', color: 'bg-primary' },
    focus: { label: 'Focus Mode', icon: Sparkles, path: '/focus-mode', color: 'bg-primary' },
    vision: { label: 'Vision Assistant', icon: Eye, path: '/vision-assistant', color: 'bg-primary' },
    routine: { label: 'Routine Builder', icon: ListChecks, path: '/routine-builder', color: 'bg-primary' },
    textSimplifier: { label: 'Text Simplifier', icon: Type, path: '/text-simplifier', color: 'bg-primary' },
    readAloud: { label: 'Read Aloud', icon: Volume2, path: '/reading-mode', color: 'bg-primary' },
    dyslexiaFont: { label: 'Dyslexia Font', icon: Type, path: '/settings', color: 'bg-primary' },
    spellCheck: { label: 'Spell Check', icon: FileText, path: '/text-simplifier', color: 'bg-primary' },
    highlighter: { label: 'Highlighter', icon: Sparkles, path: '/reading-mode', color: 'bg-primary' },
    aiChat: { label: 'Learn', icon: MessageSquare, path: '/learn', color: 'bg-primary' },
    mathSolver: { label: 'Math Solver', icon: Calculator, path: '/math-helper', color: 'bg-primary' },
    numberSense: { label: 'Number Sense', icon: Calculator, path: '/math-helper', color: 'bg-primary' },
    stepSolver: { label: 'Step Solver', icon: ListChecks, path: '/math-helper', color: 'bg-primary' },
    formulaSheet: { label: 'Formula Sheet', icon: FileText, path: '/math-helper', color: 'bg-primary' },
    mathGames: { label: 'Math Games', icon: Gamepad2, path: '/math-helper', color: 'bg-primary' },
    visualAssistant: { label: 'Visual Assistant', icon: Eye, path: '/vision-assistant', color: 'bg-primary' },
    calmCorner: { label: 'Calm Corner', icon: Moon, path: '/focus-mode', color: 'bg-primary' },
    magnifier: { label: 'Magnifier', icon: Search, path: '/vision-assistant', color: 'bg-primary' },
    highContrast: { label: 'High Contrast', icon: Eye, path: '/settings', color: 'bg-primary' },
    textReader: { label: 'Text Reader', icon: Volume2, path: '/vision-assistant', color: 'bg-primary' },
    largeKeyboard: { label: 'Large Keyboard', icon: Type, path: '/settings', color: 'bg-primary' },
    colorInverter: { label: 'Color Inverter', icon: Settings2, path: '/settings', color: 'bg-primary' },
    aacBoard: { label: 'AAC Board', icon: MessageSquare, path: '/aac-board', color: 'bg-primary' },
    speechTherapy: { label: 'Speech Therapy', icon: Volume2, path: '/speech-therapy', color: 'bg-primary' },
};

// Configuration for each primary mode
export const DASHBOARD_MODES = {
    adhd: {
        label: 'ADHD Mode',
        themeColor: 'text-accent-adhd',
        bgLight: 'bg-accent-adhd/10',
        greeting: "Let's focus on one step at a time.",
        heroTitle: "FOCUS TIMER",
        tiles: ['read', 'math', 'focus', 'routine', 'social', 'vision'],
    },
    dyslexia: {
        label: 'Dyslexia Mode',
        themeColor: 'text-accent-dyslexia',
        bgLight: 'bg-accent-dyslexia/10',
        greeting: "Let's make reading easier.",
        heroTitle: "READING ASSISTANT",
        tiles: ['textSimplifier', 'readAloud', 'dyslexiaFont', 'spellCheck', 'highlighter', 'aiChat'],
    },
    autism: {
        label: 'Autism Mode',
        themeColor: 'text-accent-autism',
        bgLight: 'bg-accent-autism/10',
        greeting: "Here's your plan for today.",
        heroTitle: "TODAY'S SCHEDULE",
        tiles: ['social', 'aacBoard', 'speechTherapy', 'routine', 'visualAssistant', 'calmCorner', 'aiChat'],
    },
    dyscalculia: {
        label: 'Dyscalculia Mode',
        themeColor: 'text-accent-dyscalculia',
        bgLight: 'bg-accent-dyscalculia/10',
        greeting: "Math can be simple!",
        heroTitle: "MATH HELPER",
        tiles: ['mathSolver', 'numberSense', 'stepSolver', 'formulaSheet', 'mathGames', 'aiChat'],
    },
    lowVision: {
        label: 'Low Vision Mode',
        themeColor: 'text-yellow-400',
        bgLight: 'bg-gray-900',
        greeting: "We've enhanced everything for better visibility.",
        heroTitle: "VISION ASSISTANT",
        tiles: ['magnifier', 'highContrast', 'textReader', 'largeKeyboard', 'colorInverter', 'aiChat'],
    },
    default: {
        label: 'Default Mode',
        themeColor: 'text-primary',
        bgLight: 'bg-primary/5',
        greeting: "Ready to learn something new?",
        heroTitle: "GET STARTED",
        tiles: ['read', 'math', 'focus', 'routine', 'aacBoard', 'speechTherapy', 'aiChat'],
    }
};
