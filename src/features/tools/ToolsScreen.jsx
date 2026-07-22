import { useNavigate } from 'react-router-dom';
import {
    Eye,
    FileText,
    MessageSquare,
    Calculator,
    Sparkles,
    ListChecks,
    Volume2,
    BookOpen,
    Bookmark,
    ChevronRight,
    Navigation
} from 'lucide-react';

import ScreenHeader from '../../shared/components/ScreenHeader';
import useProfileStore from '../../store/useProfileStore';
import useSettingsStore from '../../store/useSettingsStore';
import { translate } from '../../shared/lib/translations';

// Image imports from assets/Tools
import visionAssistantImg from '../../assets/Tools/vision-assistant.png';
import readTextImg from '../../assets/Tools/read-text.png';
import socialStoryImg from '../../assets/Tools/social-story.png';
import mathHelperImg from '../../assets/Tools/math-helper.png';
import aacBoardImg from '../../assets/Tools/aac-board.png';
import focusModeImg from '../../assets/Tools/focus-mode.png';
import routineBuilderImg from '../../assets/Tools/routine-builder.png';
import speechAssistantImg from '../../assets/Tools/speech-assistant.png';
import learnImg from '../../assets/Tools/learn.png';

/**
 * ToolsScreen — Rich 2-column feature directory matching the modern SahaAI tools UI.
 */
const TOOLS_LIST = [
    {
        key: 'visualNavigator',
        title: 'Visual Navigator',
        description: 'Live camera and voice guidance for nearby surroundings.',
        icon: Navigation,
        path: '/visual-navigator',
        image: visionAssistantImg,
        bgTint: 'bg-[#E8F4FF] dark:bg-sky-950/40',
        badgeBg: 'bg-[#7C3AED]',
    },
    {
        key: 'vision',
        title: 'Vision Assistant',
        description: 'Describe surroundings and read visual information.',
        icon: Eye,
        path: '/vision-assistant',
        image: visionAssistantImg,
        bgTint: 'bg-[#F4EFFD] dark:bg-purple-950/40',
        badgeBg: 'bg-[#7C3AED]',
    },
    {
        key: 'read',
        title: 'Read Text',
        description: 'Scan any text and listen or view it in your preferred way.',
        icon: FileText,
        path: '/reading-mode',
        image: readTextImg,
        bgTint: 'bg-[#F4EFFD] dark:bg-purple-950/40',
        badgeBg: 'bg-[#7C3AED]',
    },
    {
        key: 'social',
        title: 'Social Stories',
        description: 'Read stories that help understand situations better.',
        icon: MessageSquare,
        path: '/social-story',
        image: socialStoryImg,
        bgTint: 'bg-[#F4EFFD] dark:bg-purple-950/40',
        badgeBg: 'bg-[#7C3AED]',
    },
    {
        key: 'math',
        title: 'Math Helper',
        description: 'Solve problems step-by-step with visual support.',
        icon: Calculator,
        path: '/math-helper',
        image: mathHelperImg,
        bgTint: 'bg-[#F4EFFD] dark:bg-purple-950/40',
        badgeBg: 'bg-[#7C3AED]',
    },
    {
        key: 'aacBoard',
        title: 'AAC Board',
        description: 'Express easily using pictures, symbols and voice.',
        icon: MessageSquare,
        path: '/aac-board',
        image: aacBoardImg,
        bgTint: 'bg-[#F4EFFD] dark:bg-purple-950/40',
        badgeBg: 'bg-[#7C3AED]',
    },
    {
        key: 'focus',
        title: 'Focus Mode',
        description: 'Stay focused with calming sounds and timers.',
        icon: Sparkles,
        path: '/focus-mode',
        image: focusModeImg,
        bgTint: 'bg-[#F4EFFD] dark:bg-purple-950/40',
        badgeBg: 'bg-[#7C3AED]',
    },
    {
        key: 'routine',
        title: 'Routine Builder',
        description: 'Plan and manage daily routines visually.',
        icon: ListChecks,
        path: '/routine-builder',
        image: routineBuilderImg,
        bgTint: 'bg-[#F4EFFD] dark:bg-purple-950/40',
        badgeBg: 'bg-[#7C3AED]',
    },
    {
        key: 'speechTherapy',
        title: 'Speech Therapy',
        description: 'Practice speech with exercises and voice feedback.',
        icon: Volume2,
        path: '/speech-therapy',
        image: speechAssistantImg,
        bgTint: 'bg-[#F4EFFD] dark:bg-purple-950/40',
        badgeBg: 'bg-[#7C3AED]',
    },
    {
        key: 'learnFeed',
        title: 'Learning Feed',
        description: 'Personalized learning content just for you.',
        icon: BookOpen,
        path: '/learn',
        image: learnImg,
        bgTint: 'bg-[#E8F8F0] dark:bg-emerald-950/40',
        badgeBg: 'bg-[#7C3AED]',
    },
    {
        key: 'dearDiary',
        title: 'Dear Diary & Memory',
        description: 'Personal journal entries & smart searchable memory notes.',
        icon: Bookmark,
        path: '/dear-diary',
        image: socialStoryImg,
        bgTint: 'bg-[#F4EFFD] dark:bg-purple-950/40',
        badgeBg: 'bg-[#7C3AED]',
    },
];


export default function ToolsScreen() {
    const navigate = useNavigate();
    const primaryMode = useProfileStore((s) => s.primaryMode);
    const displayLanguage = useSettingsStore((s) => s.displayLanguage);

    const isLowVision = primaryMode === 'lowVision';

    return (
        <div
            className="flex-1 flex flex-col min-h-0 overflow-y-auto pb-28"
            style={{
                background: 'var(--a11y-bg)',
                color: 'var(--a11y-text)',
                transition: 'var(--a11y-transition)',
            }}
        >
            <ScreenHeader
                title={translate('allToolsTitle', displayLanguage)}
                showBack={false}
            />

            {/* Grid Container */}
            <div className="px-4 sm:px-6 pt-2 pb-6 max-w-6xl mx-auto w-full">
                <div className="grid grid-cols-1 min-[480px]:grid-cols-2 gap-3.5 sm:gap-4">
                    {TOOLS_LIST.map((tool) => {
                        const Icon = tool.icon;

                        return (
                            <button
                                key={tool.key}
                                onClick={() => navigate(tool.path)}
                                className="group relative flex flex-row items-stretch rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden text-left p-2 sm:p-2.5 active:scale-[0.99] h-36 sm:h-40"
                            >
                                {/* Left Section: Image with Soft Tinted Background */}
                                <div className={`w-[44%] sm:w-[46%] shrink-0 rounded-2xl ${tool.bgTint} flex items-center justify-center p-0 overflow-hidden relative`}>
                                    <img
                                        src={tool.image}
                                        alt={tool.title}
                                        className="w-full h-full object-contain scale-125 sm:scale-130 transition-transform duration-300 group-hover:scale-135 drop-shadow-xs"
                                    />
                                </div>

                                {/* Right Section: Badge Icon & Larger Text Title */}
                                <div className="flex-1 flex flex-col justify-center gap-2 pl-3 pr-2 py-2 min-w-0">
                                    {/* Icon Badge */}
                                    <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl ${tool.badgeBg} text-white flex items-center justify-center shadow-xs shrink-0`}>
                                        <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white" />
                                    </div>

                                    {/* Title */}
                                    <h3 className="font-extrabold text-gray-900 dark:text-white text-sm sm:text-base md:text-lg leading-tight tracking-tight group-hover:text-[#7C3AED] transition-colors">
                                        {tool.title}
                                    </h3>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
