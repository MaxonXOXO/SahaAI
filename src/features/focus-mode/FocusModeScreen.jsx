import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import ScreenHeader from '../../shared/components/ScreenHeader';
import FocusSessionTab from './FocusSessionTab';
import TaskBreakdownTab from './TaskBreakdownTab';
import CheckInTab from './CheckInTab';
import useProfileStore from '../../store/useProfileStore';
import useFocusStore from './useFocusStore';

const TABS = [
    { key: 'focus', label: 'Focus Timer' },
    { key: 'tasks', label: 'Tasks' },
    { key: 'checkin', label: 'Check-In' },
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
        <div className={`relative flex-1 flex flex-col h-[calc(100dvh-5rem)] overflow-y-auto ${
            isLowVision
                ? 'bg-gray-950 text-white'
                : 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-slate-950 to-purple-950 text-slate-100'
        }`}>
            <style>{`
                @keyframes dustDrift {
                    0% { transform: translateY(0px) translateX(0px); opacity: 0.3; }
                    50% { transform: translateY(-18px) translateX(12px); opacity: 0.7; }
                    100% { transform: translateY(0px) translateX(0px); opacity: 0.3; }
                }
                @keyframes floatContainer {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-6px); }
                    100% { transform: translateY(0px); }
                }
                .animate-float-slow {
                    animation: floatContainer 5s ease-in-out infinite;
                }
                .animate-dust {
                    animation: dustDrift 8s ease-in-out infinite;
                }
            `}</style>

            {/* Background Dust Particles Overlay */}
            {!isLowVision && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                    {Array.from({ length: 16 }).map((_, i) => {
                        const top = `${(i * 19) % 95}%`;
                        const left = `${(i * 23) % 95}%`;
                        const size = `${(i % 3) + 2}px`;
                        const delay = `${(i * 0.4).toFixed(1)}s`;
                        return (
                            <div
                                key={i}
                                className="absolute rounded-full bg-amber-300/60 animate-dust shadow-[0_0_8px_rgba(245,158,11,0.8)]"
                                style={{
                                    top,
                                    left,
                                    width: size,
                                    height: size,
                                    animationDelay: delay,
                                }}
                            />
                        );
                    })}
                </div>
            )}

            <div className="relative z-10 flex flex-col h-full min-h-0 flex-1">
                <ScreenHeader
                    title="ADHD Focus Mode"
                    showBack={true}
                    rightAction={
                        streakDays >= 1 ? (
                            <div className="flex items-center gap-1.5 text-xs font-black text-amber-300 bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-500/40 shadow-md backdrop-blur-xs animate-float-slow">
                                <Sparkles size={13} className="text-amber-400 animate-pulse" /> {streakDays}-day streak
                            </div>
                        ) : null
                    }
                />

                <div className="p-3 sm:p-4 flex flex-col gap-3 max-w-[420px] mx-auto w-full flex-1 min-h-0 pb-3">
                    {/* Mode Tabs — Floating Segmented Pill Container */}
                    <div className="flex items-center shrink-0 bg-slate-900/80 border border-slate-700/60 shadow-xl shadow-indigo-950/50 backdrop-blur-md rounded-2xl p-1 w-full animate-float-slow">
                        {TABS.map((tab) => {
                            const isSelected = activeTab === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`flex-1 rounded-xl py-2 text-xs font-extrabold transition-all text-center ${
                                        isSelected
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                            : 'text-slate-400 hover:text-slate-200'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Sub-mode Active View Container with Flex-1 Height Pass-Through */}
                    <div className="w-full flex-1 min-h-0 flex flex-col h-full animate-float-slow" style={{ animationDelay: '0.4s' }}>
                        {activeTab === 'focus' && (
                            <FocusSessionTab onNavigateToCheckin={() => setActiveTab('checkin')} />
                        )}
                        {activeTab === 'tasks' && (
                            <TaskBreakdownTab onNavigateToFocus={() => setActiveTab('focus')} />
                        )}
                        {activeTab === 'checkin' && <CheckInTab />}
                    </div>
                </div>
            </div>
        </div>
    );
}
