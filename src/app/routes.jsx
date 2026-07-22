import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import BottomNav from '../shared/components/BottomNav';
import SignupScreen from '../features/auth/SignupScreen';
import LoginScreen from '../features/auth/LoginScreen';
import LanguageSelectionScreen from '../features/language-selection/Languageselectionscreen';
import AgeRangeScreen from '../features/onboarding/AgeRangeScreen';
import RegionScreen from '../features/onboarding/RegionScreen';
import SplashScreen from '../features/splash/SplashScreen';
import ProfileSetupScreen from '../features/profile-setup/ProfileSetupScreen';
import DashboardScreen from '../features/dashboard/DashboardScreen';
import HomeScreen from '../features/home/HomeScreen';
import ChatListScreen from '../features/ai-chat/ChatListScreen';
import ChatScreen from '../features/ai-chat/ChatScreen';
import ProfileScreen from '../features/profile/ProfileScreen';
import EditProfileScreen from '../features/profile/EditProfileScreen';
import ReadingModeScreen from '../features/reading-mode/ReadingModeScreen';
import MathHelperScreen from '../features/math-helper/MathHelperScreen';
import VisionAssistant from '../features/vision-assistant/VisionAssistant';
import ToolsScreen from '../features/tools/ToolsScreen';
import ProgressScreen from '../features/progress/ProgressScreen';
import AACBoardScreen from '../features/aac-board/AACBoardScreen';
import FocusModeScreen from '../features/focus-mode/FocusModeScreen';
import SocialStoryScreen from '../features/social-story/SocialStoryScreen';
import LearnScreen from '../features/learn/LearnScreen';
import LearnDetailScreen from '../features/learn/LearnDetailScreen';
import SpeechTherapyScreen from '../features/speech-therapy/SpeechTherapyScreen';
import DiaryMemoryScreen from '../features/dear-diary/DiaryMemoryScreen';
import VisualNavigatorScreen from '../features/visual-navigator/VisualNavigatorScreen';
import { getRouteMeta } from './config/routeMeta';


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
            <div className={`flex-1 flex flex-col min-h-0 ${hideNav ? '' : 'pb-16'}`}>
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
                    <Route path="/dashboard" element={<Navigate to="/home" replace />} />
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
                    <Route path="/routine-builder" element={<Placeholder name="Routine Builder" />} />
                    <Route path="/social-story" element={<SocialStoryScreen />} />
                    <Route path="/conversation-practice" element={<Placeholder name="Conversation Practice" />} />
                    <Route path="/vision-assistant" element={<VisionAssistant />} />
                    <Route path="/document-reader" element={<Placeholder name="Document Reader" />} />
                    <Route path="/settings" element={<Placeholder name="Settings" />} />
                    <Route path="/aac-board" element={<AACBoardScreen />} />
                    <Route path="/speech-therapy" element={<SpeechTherapyScreen />} />
                    <Route path="/dear-diary" element={<DiaryMemoryScreen />} />
                    <Route path="/visual-navigator" element={<VisualNavigatorScreen />} />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
            {!hideNav && <BottomNav />}
        </>
    );
}
