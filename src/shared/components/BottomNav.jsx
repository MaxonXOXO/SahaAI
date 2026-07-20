import { Home, Sparkles, LayoutGrid, TrendingUp, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import useProfileStore from '../../store/useProfileStore';
import useSettingsStore from '../../store/useSettingsStore';
import { translate } from '../../shared/lib/translations';

/**
 * BottomNav — persistent bottom tab bar.
 * 4 items: Home | Learn | Tools | Progress
 * Profile is accessed via the avatar button on the Home screen.
 */
const TABS = [
    { key: 'home', labelKey: 'home', icon: Home, path: '/home' },
    { key: 'learn', labelKey: 'learn', icon: Sparkles, path: '/learn' },
    { key: 'tools', labelKey: 'tools', icon: LayoutGrid, path: '/tools' },
    { key: 'progress', labelKey: 'progress', icon: TrendingUp, path: '/progress' },
];

export default function BottomNav() {
    const navigate = useNavigate();
    const location = useLocation();
    const needs = useProfileStore((s) => s.needs);
    const displayLanguage = useSettingsStore((s) => s.displayLanguage);

    const isLowVision = needs?.lowVision;
    const isAdhd = needs?.adhd;

    return (
        <nav
            className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-around"
            style={{
                background: 'var(--a11y-surface)',
                borderColor: isLowVision ? '#FACC15' : 'rgba(0,0,0,0.08)',
                borderWidth: isLowVision ? '3px' : '0px',
                borderTopWidth: '0px',
                paddingTop: isLowVision ? '0.625rem' : '0.375rem',
                paddingBottom: isLowVision ? '0.875rem' : '0.5rem',
                minHeight: 'var(--a11y-min-touch)',
                transition: 'var(--a11y-transition)',
            }}
        >
            {TABS.map(({ key, labelKey, icon: Icon, path }) => {
                const isActive = location.pathname === path || location.pathname.startsWith(path + '/');
                const label = translate(labelKey, displayLanguage);

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
                                width: isLowVision ? '1.75rem' : isAdhd ? '1.5rem' : 'var(--a11y-icon-size)',
                                height: isLowVision ? '1.75rem' : isAdhd ? '1.5rem' : 'var(--a11y-icon-size)',
                                color: isActive ? 'var(--a11y-primary)' : 'var(--a11y-text-muted)',
                                strokeWidth: isActive ? 2.5 : 1.8,
                            }}
                        />
                        <span
                            style={{
                                fontFamily: 'var(--a11y-font-body)',
                                fontSize: isLowVision ? '0.8125rem' : '0.6875rem',
                                fontWeight: isActive ? 700 : 400,
                                color: isActive ? 'var(--a11y-primary)' : 'var(--a11y-text-muted)',
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
