import { lazy, Suspense } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import BottomNav from '../shared/components/BottomNav';
import { getRouteMeta } from './config/routeMeta';

// Route-level splitting keeps the initial PWA shell quick to open. Heavy
// vision, maths, camera, and reading code is requested only when needed.
const SignupScreen = lazy(() => import('../features/auth/SignupScreen'));
const LoginScreen = lazy(() => import('../features/auth/LoginScreen'));
const LanguageSelectionScreen = lazy(() => import('../features/language-selection/LanguageSelectionScreen'));
const AgeRangeScreen = lazy(() => import('../features/onboarding/AgeRangeScreen'));
const RegionScreen = lazy(() => import('../features/onboarding/RegionScreen'));
const SplashScreen = lazy(() => import('../features/splash/SplashScreen'));
const ProfileSetupScreen = lazy(() => import('../features/profile-setup/Profilesetupscreen'));
const DashboardScreen = lazy(() => import('../features/dashboard/DashboardScreen'));
const HomeScreen = lazy(() => import('../features/home/HomeScreen'));
const ChatListScreen = lazy(() => import('../features/ai-chat/ChatListScreen'));
const ChatScreen = lazy(() => import('../features/ai-chat/ChatScreen'));
const ProfileScreen = lazy(() => import('../features/profile/ProfileScreen'));
const EditProfileScreen = lazy(() => import('../features/profile/EditProfileScreen'));
const ReadingModeScreen = lazy(() => import('../features/reading-mode/ReadingModeScreen'));
const MathHelperScreen = lazy(() => import('../features/math-helper/MathHelperScreen'));
const VisionAssistant = lazy(() => import('../features/vision-assistant/VisionAssistant'));
const ToolsScreen = lazy(() => import('../features/tools/ToolsScreen'));
const ProgressScreen = lazy(() => import('../features/progress/ProgressScreen'));
const AACBoardScreen = lazy(() => import('../features/aac-board/AACBoardScreen'));
const FocusModeScreen = lazy(() => import('../features/focus-mode/FocusModeScreen'));
const SocialStoryScreen = lazy(() => import('../features/social-story/SocialStoryScreen'));
const RoutineBuilderScreen = lazy(() => import('../features/routine-builder/RoutineBuilderScreen'));
const LearnScreen = lazy(() => import('../features/learn/LearnScreen'));
const LearnDetailScreen = lazy(() => import('../features/learn/LearnDetailScreen'));
const SpeechTherapyScreen = lazy(() => import('../features/speech-therapy/SpeechTherapyScreen'));
const DiaryMemoryScreen = lazy(() => import('../features/dear-diary/DiaryMemoryScreen'));
const VisualNavigatorScreen = lazy(() => import('../features/visual-navigator/VisualNavigatorScreen'));


/**
 * Temporary placeholder — swap for real feature screen as each
 * teammate builds their section. Keeps routing testable meanwhile.
 */
function Placeholder({ name }) {
    return (
        <div className="flex-1 flex items-center justify-center p-6 text-center">
            <div>
                <p className="text-base-md font-semibold text-gray-700 dark:text-gray-200">
                    {name}
                </p>
                <p className="text-base-sm text-gray-400 mt-1">Screen not built yet</p>
            </div>
        </div>
    );
}

export default function AppRoutes() {
    const location = useLocation();
    const { hideNav } = getRouteMeta(location.pathname);

    return (
        <>
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <Suspense fallback={<div className="flex-1" aria-busy="true" />}>
                <Routes>
                    {/* Onboarding */}
                    <Route path="/" element={<SplashScreen />} />
                    <Route path="/signup" element={<SignupScreen />} />
                    <Route path="/login" element={<LoginScreen />} />
                    <Route path="/language" element={<LanguageSelectionScreen />} />
                    <Route path="/age-range" element={<AgeRangeScreen />} />
                    <Route path="/region" element={<RegionScreen />} />
                    <Route path="/profile-setup" element={<ProfileSetupScreen />} />

                    {/* Main tabs */}
                    <Route path="/home" element={<HomeScreen />} />
                    <Route path="/dashboard" element={<DashboardScreen />} />
                    <Route path="/ai-chat" element={<ChatListScreen />} />
                    <Route path="/ai-chat/:chatId" element={<ChatScreen />} />
                    <Route path="/learn" element={<LearnScreen />} />
                    <Route path="/learn/:cardId" element={<LearnDetailScreen />} />
                    <Route path="/tools" element={<ToolsScreen />} />
                    <Route path="/progress" element={<ProgressScreen />} />
                    <Route path="/profile" element={<ProfileScreen />} />
                    <Route path="/edit-profile" element={<EditProfileScreen />} />

                    {/* Feature screens */}
                    <Route path="/reading-mode" element={<ReadingModeScreen />} />
                    <Route path="/text-simplifier" element={<Placeholder name="AI Text Simplifier" />} />
                    <Route path="/focus-mode" element={<FocusModeScreen />} />
                    <Route path="/math-helper" element={<MathHelperScreen />} />
                    <Route path="/routine-builder" element={<RoutineBuilderScreen />} />
                    <Route path="/social-story" element={<SocialStoryScreen />} />
                    <Route path="/conversation-practice" element={<Placeholder name="Conversation Practice" />} />
                    <Route path="/vision-assistant" element={<VisionAssistant />} />
                    <Route path="/document-reader" element={<Placeholder name="Document Reader" />} />
                    <Route path="/settings" element={<Navigate to="/profile" replace />} />
                    <Route path="/aac-board" element={<AACBoardScreen />} />
                    <Route path="/speech-therapy" element={<SpeechTherapyScreen />} />
                    <Route path="/dear-diary" element={<DiaryMemoryScreen />} />
                    <Route path="/visual-navigator" element={<VisualNavigatorScreen />} />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                </Suspense>
            </div>
            {!hideNav && <BottomNav />}
        </>
    );
}
