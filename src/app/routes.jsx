import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import BottomNav from '../shared/components/BottomNav';
import SignupScreen from '../features/auth/SignupScreen';
import LoginScreen from '../features/auth/LoginScreen';
import LanguageSelectionScreen from '../features/language-selection/Languageselectionscreen';
import SplashScreen from '../features/splash/SplashScreen';
import ProfileSetupScreen from '../features/profile-setup/ProfileSetupScreen';
import DashboardScreen from '../features/dashboard/DashboardScreen';
import ChatListScreen from '../features/ai-chat/ChatListScreen';
import ChatScreen from '../features/ai-chat/ChatScreen';
import ProfileScreen from '../features/profile/ProfileScreen';
import EditProfileScreen from '../features/profile/EditProfileScreen';
import ReadingModeScreen from '../features/reading-mode/ReadingModeScreen';
import VisionAssistant from '../features/vision-assistant/VisionAssistant';
import ToolsScreen from '../features/tools/ToolsScreen';
import ProgressScreen from '../features/progress/ProgressScreen';
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
                    <Route path="/"              element={<SplashScreen />} />
                    <Route path="/language"      element={<LanguageSelectionScreen />} />
                    <Route path="/signup"        element={<SignupScreen />} />
                    <Route path="/login"         element={<LoginScreen />} />
                    <Route path="/profile-setup" element={<ProfileSetupScreen />} />

                    {/* Main tabs */}
                    <Route path="/dashboard"     element={<DashboardScreen />} />
                    <Route path="/ai-chat"       element={<ChatListScreen />} />
                    <Route path="/ai-chat/:chatId" element={<ChatScreen />} />
                    <Route path="/tools"         element={<ToolsScreen />} />
                    <Route path="/progress"      element={<ProgressScreen />} />
                    <Route path="/profile"       element={<ProfileScreen />} />
                    <Route path="/edit-profile"  element={<EditProfileScreen />} />

                    {/* Feature screens */}
                    <Route path="/reading-mode"          element={<ReadingModeScreen />} />
                    <Route path="/text-simplifier"       element={<Placeholder name="AI Text Simplifier" />} />
                    <Route path="/math-helper"           element={<Placeholder name="Dyscalculia Math Helper" />} />
                    <Route path="/focus-mode"            element={<Placeholder name="ADHD Focus Mode" />} />
                    <Route path="/routine-builder"       element={<Placeholder name="Routine Builder" />} />
                    <Route path="/social-story"          element={<Placeholder name="Social Story Generator" />} />
                    <Route path="/conversation-practice" element={<Placeholder name="Conversation Practice" />} />
                    <Route path="/vision-assistant"      element={<VisionAssistant />} />
                    <Route path="/document-reader"       element={<Placeholder name="Document Reader" />} />
                    <Route path="/settings"              element={<Placeholder name="Settings" />} />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
            {!hideNav && <BottomNav />}
        </>
    );
}