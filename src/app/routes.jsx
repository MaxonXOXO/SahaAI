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
import ReadingModeScreen from '../features/reading-mode/ReadingModeScreen';

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

// Routes where BottomNav should be hidden (onboarding / full-screen flows)
const NO_NAV_ROUTES = [
    '/', '/language', '/profile-setup', '/signup', '/login'
];

export default function AppRoutes() {
    const location = useLocation();
    // Hide nav on onboarding routes and inside individual chat screens
    const showNav = !NO_NAV_ROUTES.includes(location.pathname)
        && !location.pathname.startsWith('/ai-chat/');

    return (
        <>
            <div className={`flex-1 flex flex-col ${showNav ? 'pb-16' : ''}`}>
                <Routes>
                    {/* Onboarding */}
                    <Route path="/" element={<SplashScreen />} />
                    <Route path="/language" element={<LanguageSelectionScreen />} />
                    <Route path="/signup" element={<SignupScreen />} />
                    <Route path="/login" element={<LoginScreen />} />
                    <Route path="/profile-setup" element={<ProfileSetupScreen />} />

                    {/* Main tabs */}
                    <Route path="/dashboard" element={<DashboardScreen />} />
                    <Route path="/ai-chat" element={<ChatListScreen />} />
                    <Route path="/ai-chat/:chatId" element={<ChatScreen />} />
                    <Route path="/learn" element={<Placeholder name="Learn" />} />
                    <Route path="/progress" element={<Placeholder name="Progress Dashboard" />} />
                    <Route path="/profile" element={<Placeholder name="Profile & Settings" />} />

                    {/* Feature screens */}
                    <Route path="/reading-mode" element={<ReadingModeScreen />} />
                    <Route path="/text-simplifier" element={<Placeholder name="AI Text Simplifier" />} />
                    <Route path="/math-helper" element={<Placeholder name="Dyscalculia Math Helper" />} />
                    <Route path="/focus-mode" element={<Placeholder name="ADHD Focus Mode" />} />
                    <Route path="/routine-builder" element={<Placeholder name="Routine Builder" />} />
                    <Route path="/social-story" element={<Placeholder name="Social Story Generator" />} />
                    <Route path="/conversation-practice" element={<Placeholder name="Conversation Practice" />} />
                    <Route path="/vision-assistant" element={<Placeholder name="Vision Assistant" />} />
                    <Route path="/document-reader" element={<Placeholder name="Document Reader" />} />
                    <Route path="/settings" element={<Placeholder name="Settings" />} />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
            {showNav && <BottomNav />}
        </>
    );
}