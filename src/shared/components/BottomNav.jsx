import { Home, Sparkles, BookOpen, TrendingUp, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import useProfileStore from '../../store/useProfileStore';

/**
 * BottomNav — persistent bottom tab bar.
 *
 * Adaptive behaviour:
 *   - Low Vision:  taller bar, icons + labels always visible, high contrast active
 *   - ADHD:        larger icons, bold active label
 *   - Autism:      labels always show (never icon-only), no animation on tap
 *   - Dyslexia:    OpenDyslexic labels via CSS var font override
 *
 * Tabs: Home / AI / Learn / Progress / Profile
 */
const TABS = [
    { key: 'home',     label: 'Home',     icon: Home,       path: '/dashboard' },
    { key: 'ai',       label: 'AI',       icon: Sparkles,   path: '/ai-chat' },
    { key: 'learn',    label: 'Learn',    icon: BookOpen,   path: '/learn' },
    { key: 'progress', label: 'Progress', icon: TrendingUp, path: '/progress' },
    { key: 'profile',  label: 'Profile',  icon: User,       path: '/profile' },
];

export default function BottomNav() {
    const navigate  = useNavigate();
    const location  = useLocation();
    const needs     = useProfileStore((s) => s.needs);

    // Autism mode: always show labels (never icon-only) — already the default
    // Low Vision: larger tap zones
    const isLowVision = needs.lowVision;
    const isAdhd      = needs.adhd;

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 border-t z-20 flex items-center justify-around"
            style={{
                background:   'var(--a11y-surface)',
                borderColor:  isLowVision ? '#FACC15' : 'rgba(0,0,0,0.08)',
                borderWidth:  isLowVision ? '3px' : '1px',
                paddingTop:   isLowVision ? '10px' : '6px',
                paddingBottom: isLowVision ? '14px' : '8px',
                minHeight:    'var(--a11y-min-touch)',
                transition:   'var(--a11y-transition)',
            }}
        >
            {TABS.map(({ key, label, icon: Icon, path }) => {
                const isActive = location.pathname === path || location.pathname.startsWith(path + '/');

                return (
                    <button
                        key={key}
                        onClick={() => navigate(path)}
                        aria-label={label}
                        aria-current={isActive ? 'page' : undefined}
                        className="flex flex-col items-center justify-center gap-0.5 flex-1"
                        style={{
                            minHeight: 'var(--a11y-min-touch)',
                            transition: 'var(--a11y-transition)',
                        }}
                    >
                        <Icon
                            style={{
                                width:  isLowVision ? '28px' : isAdhd ? '24px' : 'var(--a11y-icon-size)',
                                height: isLowVision ? '28px' : isAdhd ? '24px' : 'var(--a11y-icon-size)',
                                color:  isActive ? 'var(--a11y-primary)' : 'var(--a11y-text-muted)',
                                strokeWidth: isActive ? 2.5 : 1.8,
                            }}
                        />
                        <span
                            style={{
                                fontFamily:  'var(--a11y-font-body)',
                                fontSize:    isLowVision ? '13px' : '11px',
                                fontWeight:  isActive ? 700 : 400,
                                color:       isActive ? 'var(--a11y-primary)' : 'var(--a11y-text-muted)',
                                letterSpacing: 'var(--a11y-letter-spacing)',
                            }}
                        >
                            {label}
                        </span>
                    </button>
                );
            })}
        </nav>
    );
}