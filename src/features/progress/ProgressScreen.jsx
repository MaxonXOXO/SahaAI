import { motion } from 'framer-motion';
import { Flame, Trophy, Calendar, Check, BookOpen } from 'lucide-react';
import ScreenHeader from '../../shared/components/ScreenHeader';
import useProfileStore from '../../store/useProfileStore';
import useSettingsStore from '../../store/useSettingsStore';
import useProgressStats from '../../shared/hooks/useProgressStats';
import { translate } from '../../shared/lib/translations';

// Circular SVG Progress Ring Widget
function ProgressCircle({ percentage, size = 120, strokeWidth = 10, strokeClass = "stroke-primary", title, subtitle, centerLabel }) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (Math.min(percentage, 100) / 100) * circumference;

    return (
        <div className="flex flex-col items-center p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-750 shadow-sm flex-1">
            <div className="relative" style={{ width: size, height: size }}>
                <svg className="w-full h-full transform -rotate-90">
                    {/* Background track */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        className="stroke-gray-100 dark:stroke-gray-700 fill-none"
                        strokeWidth={strokeWidth}
                    />
                    {/* Animated progress track */}
                    <motion.circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        className={`fill-none ${strokeClass}`}
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-base-md font-extrabold text-gray-800 dark:text-gray-100 leading-none">
                        {centerLabel || `${Math.round(percentage)}%`}
                    </span>
                </div>
            </div>
            <p className="text-base-sm font-bold text-gray-800 dark:text-gray-100 mt-4 text-center">
                {title}
            </p>
            <p className="text-xs text-gray-400 mt-1 text-center truncate w-full">
                {subtitle}
            </p>
        </div>
    );
}

export default function ProgressScreen() {
    const primaryMode = useProfileStore((s) => s.primaryMode);
    const displayLanguage = useSettingsStore((s) => s.displayLanguage);

    // Real data from activity_log via Supabase
    const {
        dailyStreak,
        focusSessionsWeek,
        mathAccuracy,
        readingStreak,
        activeDays,
        totalSessions,
        loading,
    } = useProgressStats();

    const isLowVision = primaryMode === 'lowVision';

    // Accent Stroke Color to match the user's primary mode
    const getPrimaryModeStrokeClass = (mode) => {
        switch (mode) {
            case 'adhd': return 'stroke-accent-adhd';
            case 'dyslexia': return 'stroke-accent-dyslexia';
            case 'autism': return 'stroke-accent-autism';
            case 'dyscalculia': return 'stroke-accent-dyscalculia';
            case 'lowVision': return 'stroke-yellow-400';
            default: return 'stroke-primary';
        }
    };

    const getPrimaryModeTextClass = (mode) => {
        switch (mode) {
            case 'adhd': return 'text-accent-adhd';
            case 'dyslexia': return 'text-accent-dyslexia';
            case 'autism': return 'text-accent-autism';
            case 'dyscalculia': return 'text-accent-dyscalculia';
            case 'lowVision': return 'text-yellow-400';
            default: return 'text-primary';
        }
    };

    // Calculate details for the last 7 calendar days
    const getStreakCalendar = () => {
        const days = [];
        const weekdays = displayLanguage === 'ml'
            ? ['ഞാ', 'തി', 'ചൊ', 'ബു', 'വ്യാ', 'വെ', 'ശ']
            : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() - i);
            const dateKey = targetDate.toISOString().split('T')[0];
            const isCompleted = activeDays.has(dateKey);
            const isToday = i === 0;

            days.push({
                label: weekdays[targetDate.getDay()],
                isCompleted,
                isToday,
                dayNumber: targetDate.getDate()
            });
        }
        return days;
    };

    const calendarDays = getStreakCalendar();
    const activeColorClass = getPrimaryModeTextClass(primaryMode);

    if (loading) {
        return (
            <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 pb-24">
                <ScreenHeader title={translate('progressTitle', displayLanguage)} showBack={false} />
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                            className="w-8 h-8 border-3 border-gray-200 border-t-primary rounded-full"
                        />
                        <p className="text-sm text-gray-400">{translate('loading', displayLanguage)}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 overflow-y-auto pb-24">
            <ScreenHeader title={translate('progressTitle', displayLanguage)} showBack={false} />

            <div className="px-4 py-4 flex flex-col gap-6">
                
                {/* Duolingo-style Streak Card */}
                <div className={`relative overflow-hidden rounded-3xl p-6 text-white bg-gradient-to-br ${
                    isLowVision 
                        ? 'from-black to-black border-2 border-yellow-400' 
                        : 'from-amber-500 to-orange-600 shadow-lg shadow-orange-500/20'
                }`}>
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-md">
                                {translate('dailyStreak', displayLanguage)}
                            </span>
                            <h2 className="text-3xl font-extrabold mt-3 flex items-baseline gap-1.5">
                                {translate('streakValue', displayLanguage, { count: dailyStreak })}
                            </h2>
                            <p className="text-xs text-white/90 mt-1 max-w-[200px]">
                                {dailyStreak > 0 
                                    ? translate('streakSubtitle', displayLanguage)
                                    : (displayLanguage === 'ml' ? 'സ്ട്രീക്ക് ആരംഭിക്കാൻ ഇന്ന് ഏതെങ്കിലും ഉപകരണം ഉപയോഗിക്കുക!' : 'Use any tool today to start your streak!')}
                            </p>
                        </div>
                        <div className="relative flex items-center justify-center pr-2">
                            {/* Glowing Flame Icon */}
                            <motion.div
                                animate={{ scale: [1, 1.08, 1] }}
                                transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                            >
                                <Flame size={72} className={isLowVision ? 'text-yellow-400' : 'text-amber-200 drop-shadow-[0_4px_12px_rgba(251,191,36,0.5)]'} />
                            </motion.div>
                        </div>
                    </div>

                    {/* Total sessions badge */}
                    {totalSessions > 0 && (
                        <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between">
                            <span className="text-xs text-white/70">
                                {displayLanguage === 'ml' ? 'ആകെ പൂർത്തിയാക്കിയ സെഷനുകൾ' : 'Total sessions logged'}
                            </span>
                            <span className="text-sm font-bold">{totalSessions}</span>
                        </div>
                    )}
                </div>

                {/* Circular Stats Rings */}
                <div className="flex gap-4">
                    <ProgressCircle
                        percentage={(focusSessionsWeek / 5) * 100}
                        strokeClass={getPrimaryModeStrokeClass(primaryMode)}
                        title={translate('weeklyFocus', displayLanguage)}
                        subtitle={translate('sessionsGoal', displayLanguage, { current: focusSessionsWeek, goal: 5 })}
                        centerLabel={`${focusSessionsWeek}/5`}
                    />
                    <ProgressCircle
                        percentage={mathAccuracy}
                        strokeClass={getPrimaryModeStrokeClass(primaryMode)}
                        title={translate('mathAccuracy', displayLanguage)}
                        subtitle={translate('accuracySubtitle', displayLanguage)}
                        centerLabel={`${mathAccuracy}%`}
                    />
                </div>

                {/* Streak Calendar (Last 7 Days) */}
                <div className="p-5 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-750 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Calendar size={18} className={activeColorClass} />
                        <h3 className="text-base-sm font-bold text-gray-800 dark:text-gray-100">
                            {translate('streakGridTitle', displayLanguage)}
                        </h3>
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                        {calendarDays.map((day, idx) => (
                            <div key={idx} className="flex flex-col items-center">
                                <span className="text-[10px] font-semibold text-gray-400 uppercase">
                                    {day.label}
                                </span>
                                <div className={`
                                    w-9 h-9 rounded-full flex items-center justify-center mt-1.5 transition-all text-xs font-bold
                                    ${day.isCompleted 
                                        ? isLowVision 
                                            ? 'bg-yellow-400 text-black border border-yellow-400' 
                                            : 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
                                        : day.isToday 
                                            ? isLowVision 
                                                ? 'border-2 border-yellow-400 text-yellow-400' 
                                                : 'border-2 border-orange-500 text-orange-500 bg-orange-500/5'
                                            : 'bg-gray-50 dark:bg-gray-750 text-gray-400 border border-gray-100 dark:border-gray-700'}
                                `}>
                                    {day.isCompleted ? (
                                        <Check size={16} strokeWidth={3} />
                                    ) : (
                                        day.dayNumber
                                    )}
                                </div>
                                {day.isToday && (
                                    <span className={`text-[8px] font-bold mt-1 uppercase ${activeColorClass}`}>
                                        {translate('today', displayLanguage)}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Additional Stats Section */}
                <div className="flex flex-col gap-3">
                    <h3 className="text-base-sm font-bold text-gray-800 dark:text-gray-100 px-1">
                        {displayLanguage === 'ml' ? 'പഠന നാഴികക്കല്ലുകൾ' : 'Learning Milestones'}
                    </h3>

                    {/* Reading Streak Card */}
                    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-750 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                <BookOpen size={20} />
                            </div>
                            <div>
                                <h4 className="text-base-sm font-bold text-gray-800 dark:text-gray-100">
                                    {displayLanguage === 'ml' ? 'വായനാ സ്ട്രീക്ക്' : 'Reading Streak'}
                                </h4>
                                <p className="text-xs text-gray-400">
                                    {displayLanguage === 'ml' ? 'തുടർച്ചയായി വായന നടത്തിയ ദിവസങ്ങൾ' : 'Consecutive days with reading activity'}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-base-md font-extrabold text-blue-500">
                                {readingStreak}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400 block">
                                {displayLanguage === 'ml' ? 'ദിവസങ്ങൾ' : 'days'}
                            </span>
                        </div>
                    </div>

                    {/* Achievements Unlock */}
                    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-750 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                                <Trophy size={20} />
                            </div>
                            <div>
                                <h4 className="text-base-sm font-bold text-gray-800 dark:text-gray-100">
                                    {displayLanguage === 'ml' ? 'അടുത്ത നേട്ടം' : 'Next Achievement'}
                                </h4>
                                <p className="text-xs text-gray-400">
                                    {dailyStreak >= 5 
                                        ? (displayLanguage === 'ml' ? '14 ദിവസത്തെ സ്ട്രീക്ക് പൂർത്തിയാക്കുക!' : 'Reach 14 days streak!') 
                                        : (displayLanguage === 'ml' ? '5 ദിവസത്തെ സ്ട്രീക്ക് പൂർത്തിയാക്കുക!' : 'Reach 5 days streak!')}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-bold text-purple-500 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20">
                                {dailyStreak}/{dailyStreak >= 5 ? 14 : 5} {displayLanguage === 'ml' ? 'ദിവസം' : 'days'}
                            </span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
