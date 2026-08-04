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
    Navigation
} from 'lucide-react';

import ScreenHeader from '../../shared/components/ScreenHeader';
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
        titleMl: 'വിഷ്വൽ നാവിഗേറ്റർ',
        description: 'Live camera and voice guidance for nearby surroundings.',
        icon: Navigation,
        path: '/visual-navigator',
        image: visionAssistantImg,
        bgTint: 'bg-[#E8F4FF] dark:bg-sky-950/40',
    },
    {
        key: 'vision',
        title: 'Vision Assistant',
        titleMl: 'ദൃശ്യ സഹായി',
        description: 'Describe surroundings and read visual information.',
        icon: Eye,
        path: '/vision-assistant',
        image: visionAssistantImg,
        bgTint: 'bg-[#F4EFFD] dark:bg-purple-950/40',
    },
    {
        key: 'read',
        title: 'Read Text',
        titleMl: 'വാചകം വായിക്കുക',
        description: 'Scan any text and listen or view it in your preferred way.',
        icon: FileText,
        path: '/reading-mode',
        image: readTextImg,
        bgTint: 'bg-[#F4EFFD] dark:bg-purple-950/40',
    },
    {
        key: 'social',
        title: 'Social Stories',
        titleMl: 'സാമൂഹിക കഥകൾ',
        description: 'Read stories that help understand situations better.',
        icon: MessageSquare,
        path: '/social-story',
        image: socialStoryImg,
        bgTint: 'bg-[#F4EFFD] dark:bg-purple-950/40',
    },
    {
        key: 'math',
        title: 'Math Helper',
        titleMl: 'ഗണിത സഹായി',
        description: 'Solve problems step-by-step with visual support.',
        icon: Calculator,
        path: '/math-helper',
        image: mathHelperImg,
        bgTint: 'bg-[#F4EFFD] dark:bg-purple-950/40',
    },
    {
        key: 'aacBoard',
        title: 'AAC Board',
        titleMl: 'ആശയവിനിമയ ബോർഡ്',
        description: 'Express easily using pictures, symbols and voice.',
        icon: MessageSquare,
        path: '/aac-board',
        image: aacBoardImg,
        bgTint: 'bg-[#F4EFFD] dark:bg-purple-950/40',
    },
    {
        key: 'focus',
        title: 'Focus Mode',
        titleMl: 'ശ്രദ്ധാ മോഡ്',
        description: 'Stay focused with calming sounds and timers.',
        icon: Sparkles,
        path: '/focus-mode',
        image: focusModeImg,
        bgTint: 'bg-[#F4EFFD] dark:bg-purple-950/40',
    },
    {
        key: 'routine',
        title: 'Routine Builder',
        titleMl: 'ദിനചര്യ നിർമ്മാതാവ്',
        description: 'Plan and manage daily routines visually.',
        icon: ListChecks,
        path: '/routine-builder',
        image: routineBuilderImg,
        bgTint: 'bg-[#F4EFFD] dark:bg-purple-950/40',
    },
    {
        key: 'speechTherapy',
        title: 'Speech Therapy',
        titleMl: 'സംസാര പരിശീലനം',
        description: 'Practice speech with exercises and voice feedback.',
        icon: Volume2,
        path: '/speech-therapy',
        image: speechAssistantImg,
        bgTint: 'bg-[#F4EFFD] dark:bg-purple-950/40',
    },
    {
        key: 'learnFeed',
        title: 'Learning Feed',
        titleMl: 'പഠന ഫീഡ്',
        description: 'Personalized learning content just for you.',
        icon: BookOpen,
        path: '/learn',
        image: learnImg,
        bgTint: 'bg-[#E8F8F0] dark:bg-emerald-950/40',
    },
    {
        key: 'dearDiary',
        title: 'Dear Diary & Memory',
        titleMl: 'പ്രിയ ഡയറി & ഓർമ്മ',
        description: 'Personal journal entries & smart searchable memory notes.',
        icon: Bookmark,
        path: '/dear-diary',
        image: socialStoryImg,
        bgTint: 'bg-[#F4EFFD] dark:bg-purple-950/40',
    },
];


export default function ToolsScreen() {
    const navigate = useNavigate();
    const displayLanguage = useSettingsStore((s) => s.displayLanguage);

    return (
        <div
            className="flex-1 flex flex-col min-h-0 overflow-y-auto overscroll-contain"
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
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    {TOOLS_LIST.map((tool) => {
                        const Icon = tool.icon;

                        return (
                            <button
                                key={tool.key}
                                onClick={() => navigate(tool.path, { state: { from: '/tools' } })}
                                className="group relative flex min-w-0 items-stretch gap-2 rounded-2xl sm:rounded-3xl bg-white dark:bg-gray-900 border-2 border-primary/25 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden text-left p-2 active:scale-[0.99] h-[132px] sm:h-[148px]"
                            >
                                {/* Left Section: Image with Soft Tinted Background */}
                                <div className={`w-[48%] shrink-0 rounded-xl sm:rounded-2xl ${tool.bgTint} flex items-center justify-center p-0 overflow-hidden relative`}>
                                    <img
                                        src={tool.image}
                                        alt={displayLanguage === 'ml' ? tool.titleMl : tool.title}
                                        className="w-full h-full object-contain scale-125 transition-transform duration-300 group-hover:scale-135 drop-shadow-xs"
                                    />
                                </div>

                                {/* Right Section: identity icon and title only. */}
                                <div className="flex-1 flex min-w-0 flex-col justify-center gap-2 py-2 pr-1">
                                    {/* Icon Badge */}
                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shadow-xs shrink-0" style={{ backgroundColor: 'var(--a11y-primary)', color: 'var(--a11y-bg)' }}>
                                        <Icon className="w-4 h-4" />
                                    </div>

                                    {/* Title */}
                                    <h3 className="font-extrabold text-gray-900 dark:text-white text-[13px] sm:text-base leading-tight tracking-tight break-words group-hover:text-primary transition-colors">
                                        {displayLanguage === 'ml' ? tool.titleMl : tool.title}
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
