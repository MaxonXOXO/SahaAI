import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ListChecks, LayoutTemplate, Play } from 'lucide-react';
import ScreenHeader from '../../shared/components/ScreenHeader';
import useProfileStore from '../../store/useProfileStore';
import useRoutineStore from './useRoutineStore';
import RoutinesTab from './RoutinesTab';
import TemplatesTab from './TemplatesTab';
import RunTab from './RunTab';

const TABS = [
    { key: 'routines', label: 'My Routines', icon: ListChecks },
    { key: 'templates', label: 'Templates', icon: LayoutTemplate },
    { key: 'run', label: 'Run', icon: Play },
];

export default function RoutineBuilderScreen() {
    const [searchParams] = useSearchParams();
    const paramTab = searchParams.get('tab');
    const initialTab = TABS.some((t) => t.key === paramTab) ? paramTab : 'routines';
    const [activeTab, setActiveTab] = useState(initialTab);

    const userId = useProfileStore((s) => s.id);
    const primaryMode = useProfileStore((s) => s.primaryMode);
    const isLowVision = primaryMode === 'lowVision';

    const loadRoutines = useRoutineStore((s) => s.loadRoutines);
    const hasLoaded = useRoutineStore((s) => s.hasLoaded);
    const setActiveRoutineId = useRoutineStore((s) => s.setActiveRoutineId);

    useEffect(() => {
        if (userId && !hasLoaded) loadRoutines(userId);
    }, [userId, hasLoaded, loadRoutines]);

    const goToRun = (routineId) => {
        setActiveRoutineId(routineId);
        setActiveTab('run');
    };

    return (
        <div
            className={`flex-1 flex flex-col min-h-screen ${
                isLowVision ? 'bg-gray-950 text-white' : 'bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100'
            }`}
        >
            <ScreenHeader title="Routine Builder" showBack={true} />

            <div className="p-4 flex flex-col gap-5 max-w-[420px] mx-auto w-full pb-20">
                {/* Mode Tabs */}
                <div className="grid grid-cols-3 gap-2 bg-gray-100 dark:bg-gray-800/80 p-1.5 rounded-2xl">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isSelected = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex flex-col items-center justify-center py-2.5 rounded-xl text-xs font-bold transition-all min-h-touch ${
                                    isSelected
                                        ? 'bg-white dark:bg-gray-700 text-primary shadow-sm border border-primary/30'
                                        : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'
                                }`}
                            >
                                <Icon size={18} className="mb-1" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Sub-mode Active View */}
                {activeTab === 'routines' && <RoutinesTab onRun={goToRun} />}
                {activeTab === 'templates' && <TemplatesTab onCreated={goToRun} />}
                {activeTab === 'run' && <RunTab onNeedRoutines={() => setActiveTab('routines')} />}
            </div>
        </div>
    );
}
