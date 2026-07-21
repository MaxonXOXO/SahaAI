import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const getTodayStr = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getYesterdayStr = () => {
    const now = new Date();
    now.setDate(now.getDate() - 1);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * useFocusStore — Feature-local Zustand store for ADHD Focus Mode.
 *
 * Uses persist middleware (localStorage key: 'saha_focus_store') so timer state,
 * daily streak, session count, timer view preference, picture reveal seed,
 * and task breakdown steps survive tab switches, screen navigation, and browser refresh.
 *
 * CRITICAL DESIGN: The timer countdown is DERIVED from `endTime`, NOT stored or decremented.
 * `endTime` holds the target completion timestamp (in ms).
 * This makes the timer 100% drift-proof and immune to interval throttling.
 */
const useFocusStore = create(
    persist(
        (set, get) => ({
            mode: 'focus', // 'focus' | 'break'
            durationMinutes: 25,
            endTime: null, // timestamp in ms, null when not running
            pausedSecondsLeft: null, // null unless paused mid-session
            isRunning: false,
            distractionCount: 0,
            soundEnabled: true,
            currentStepTitle: null, // optional step title linked to active focus session

            // Timer Style & Reveal Feature State (persisted)
            timerStyle: 'classic', // 'classic' | 'reveal'
            revealSeed: null, // number | null

            // Streak & Session Engagement State (persisted)
            lastSessionDate: '',
            streakDays: 0,
            sessionsToday: 0,

            // Task Breakdown State (persisted)
            taskTitle: '',
            steps: [],
            completedStepIds: [],

            setTimerStyle: (style) => set({ timerStyle: style }),

            startTimer: (newMode, minutes, stepTitle) => {
                const targetMode = newMode || get().mode;
                const targetMins = minutes || get().durationMinutes;
                const now = Date.now();
                const currentSeed = get().revealSeed;
                const newSeed = targetMode === 'focus'
                    ? (currentSeed && get().isRunning ? currentSeed : Math.floor(Math.random() * 1000000) + 1)
                    : null;

                set({
                    mode: targetMode,
                    durationMinutes: targetMins,
                    endTime: now + targetMins * 60 * 1000,
                    pausedSecondsLeft: null,
                    isRunning: true,
                    currentStepTitle: stepTitle || null,
                    revealSeed: newSeed,
                });
            },

            pauseTimer: () => {
                const { endTime, isRunning, durationMinutes } = get();
                if (!isRunning) return;
                let remaining = 0;
                if (endTime) {
                    remaining = Math.max(0, Math.round((endTime - Date.now()) / 1000));
                } else {
                    remaining = durationMinutes * 60;
                }
                set({
                    pausedSecondsLeft: remaining,
                    endTime: null,
                    isRunning: false,
                });
            },

            resumeTimer: () => {
                const { pausedSecondsLeft, durationMinutes, isRunning } = get();
                if (isRunning) return; // Bail only if already running!
                const secondsToRun = pausedSecondsLeft ?? durationMinutes * 60;
                const now = Date.now();
                set({
                    endTime: now + secondsToRun * 1000,
                    pausedSecondsLeft: null,
                    isRunning: true,
                });
            },

            resetTimer: () => {
                set({
                    isRunning: false,
                    endTime: null,
                    pausedSecondsLeft: null,
                    distractionCount: 0,
                    currentStepTitle: null,
                    revealSeed: null,
                });
            },

            finishSession: () => {
                set({
                    isRunning: false,
                    endTime: null,
                    pausedSecondsLeft: null,
                });
            },

            recordSessionCompletion: (isFocus = true) => {
                const { lastSessionDate, streakDays, sessionsToday } = get();
                const today = getTodayStr();
                const yesterday = getYesterdayStr();

                let newStreak = streakDays;
                let currentTodayCount = lastSessionDate === today ? sessionsToday : 0;

                if (lastSessionDate === today) {
                    if (isFocus) {
                        currentTodayCount += 1;
                    }
                } else if (lastSessionDate === yesterday) {
                    if (isFocus) {
                        newStreak = streakDays + 1;
                        currentTodayCount = 1;
                    }
                } else {
                    if (isFocus) {
                        newStreak = 1;
                        currentTodayCount = 1;
                    }
                }

                set({
                    lastSessionDate: today,
                    streakDays: newStreak,
                    sessionsToday: currentTodayCount,
                });
            },

            setMode: (newMode, minutes) => {
                set({
                    mode: newMode,
                    durationMinutes: minutes,
                    isRunning: false,
                    endTime: null,
                    pausedSecondsLeft: null,
                    currentStepTitle: newMode === 'break' ? null : get().currentStepTitle,
                    revealSeed: null,
                });
            },

            logDistraction: () => {
                set((state) => ({ distractionCount: state.distractionCount + 1 }));
            },

            toggleSound: () => {
                set((state) => ({ soundEnabled: !state.soundEnabled }));
            },

            // Breakdown Actions
            setBreakdown: (title, steps) => {
                set({
                    taskTitle: title,
                    steps: steps,
                    completedStepIds: [],
                });
            },

            toggleStepCompleted: (stepId) => {
                set((state) => {
                    const isDone = state.completedStepIds.includes(stepId);
                    const nextCompleted = isDone
                        ? state.completedStepIds.filter((id) => id !== stepId)
                        : [...state.completedStepIds, stepId];

                    const updates = { completedStepIds: nextCompleted };

                    // If being marked completed (not un-checked)
                    if (!isDone) {
                        const step = state.steps.find((s) => s.id === stepId);
                        if (step && step.title === state.currentStepTitle) {
                            updates.currentStepTitle = null;
                            if (state.isRunning) {
                                updates.isRunning = false;
                                updates.endTime = null;
                                updates.pausedSecondsLeft = null;
                            }
                        }
                    }

                    return updates;
                });
            },

            clearBreakdown: () => {
                set({
                    taskTitle: '',
                    steps: [],
                    completedStepIds: [],
                });
            },
        }),
        {
            name: 'saha_focus_store',
        }
    )
);

export default useFocusStore;
