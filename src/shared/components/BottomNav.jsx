import { Home, Sparkles, BookOpen, TrendingUp, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * BottomNav — persistent bottom tab bar (see Dashboard sketch:
 * Home / AI / Learn / Progress / Profile).
 *
 * Renders on main app screens, not on onboarding (splash, language,
 * profile-setup) or full-screen feature flows.
 */
const TABS = [
    { key: 'home', label: 'Home', icon: Home, path: '/dashboard' },
    { key: 'ai', label: 'AI', icon: Sparkles, path: '/ai-chat' },
    { key: 'learn', label: 'Learn', icon: BookOpen, path: '/learn' },
    { key: 'progress', label: 'Progress', icon: TrendingUp, path: '/progress' },
    { key: 'profile', label: 'Profile', icon: User, path: '/profile' },
];

export default function BottomNav() {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-surface dark:bg-surface-dark border-t border-gray-100 dark:border-gray-700 flex items-center justify-around py-2 z-20">
            {TABS.map(({ key, label, icon: Icon, path }) => {
                const isActive = location.pathname === path;
                return (
                    <button
                        key={key}
                        onClick={() => navigate(path)}
                        aria-label={label}
                        aria-current={isActive ? 'page' : undefined}
                        className="min-h-touch min-w-touch flex flex-col items-center justify-center gap-0.5 px-2"
                    >
                        <Icon
                            size={22}
                            className={isActive ? 'text-primary' : 'text-gray-400'}
                            strokeWidth={isActive ? 2.5 : 2}
                        />
                        <span className={`text-xs ${isActive ? 'text-primary font-semibold' : 'text-gray-400'}`}>
                            {label}
                        </span>
                    </button>
                );
            })}
        </nav>
    );
}