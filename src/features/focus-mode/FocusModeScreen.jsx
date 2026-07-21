import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Flame, ListChecks, HeartHandshake } from 'lucide-react';
import ScreenHeader from '../../shared/components/ScreenHeader';
import FocusSessionTab from './FocusSessionTab';
import TaskBreakdownTab from './TaskBreakdownTab';
import CheckInTab from './CheckInTab';
import useProfileStore from '../../store/useProfileStore';
import useFocusStore from './useFocusStore';

const TABS = [
    { key: 'focus', label: 'Focus Timer', icon: Flame },
    { key: 'tasks', label: 'Task Breakdown', icon: ListChecks },
    { key: 'checkin', label: 'Check-In', icon: HeartHandshake },
];

export default function FocusModeScreen() {
    const [searchParams] = useSearchParams();
    const paramTab = searchParams.get('tab');
    const initialTab = TABS.some((t) => t.key === paramTab) ? paramTab : 'focus';

    const [activeTab, setActiveTab] = useState(initialTab);
    const primaryMode = useProfileStore((s) => s.primaryMode);
    const isLowVision = primaryMode === 'lowVision';
    const streakDays = useFocusStore((s) => s.streakDays);

    return (
        <div className={`flex-1 flex flex-col h-[calc(100dvh-5rem)] overflow-y-auto ${isLowVision ? 'bg-gray-950 text-white' : 'bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100'}`}>
            <ScreenHeader
                title="ADHD Focus Mode"
                showBack={true}
                rightAction={
                    streakDays >= 1 ? (
                        <div className="flex items-center gap-1 text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                            🔥 {streakDays}-day streak
                        </div>
                    ) : null
                }
            />

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
                                        ? 'bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 shadow-sm border border-red-200 dark:border-red-800/60'
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
                {activeTab === 'focus' && (
                    <FocusSessionTab onNavigateToCheckin={() => setActiveTab('checkin')} />
                )}
                {activeTab === 'tasks' && (
                    <TaskBreakdownTab onNavigateToFocus={() => setActiveTab('focus')} />
                )}
                {activeTab === 'checkin' && <CheckInTab />}
            </div>
        </div>
    );
}
