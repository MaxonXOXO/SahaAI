import { useNavigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import ScreenHeader from '../../shared/components/ScreenHeader';
import useProfileStore from '../../store/useProfileStore';
import useSettingsStore from '../../store/useSettingsStore';
import { TILE_REGISTRY } from '../dashboard/dashboardModes';
import { translate } from '../../shared/lib/translations';

/**
 * ALL_TOOLS — The 9 core features, always shown, never filtered by profile.
 * This is the "everything, always" screen. Profile only affects theming.
 */
const ALL_TOOLS = [
    { key: 'vision',        tileKey: 'vision' },
    { key: 'read',          tileKey: 'read' },
    { key: 'aacBoard',      tileKey: 'aacBoard' },
    { key: 'social',        tileKey: 'social' },
    { key: 'math',          tileKey: 'math' },
    { key: 'focus',         tileKey: 'focus' },
    { key: 'routine',       tileKey: 'routine' },
    { key: 'speechTherapy', tileKey: 'speechTherapy' },
    { key: 'learnFeed',     tileKey: null, path: '/learn' },  // Special: Learning Feed
];

export default function ToolsScreen() {
    const navigate = useNavigate();
    const primaryMode = useProfileStore((s) => s.primaryMode);
    const displayLanguage = useSettingsStore((s) => s.displayLanguage);

    const isLowVision = primaryMode === 'lowVision';

    return (
        <div
            className="flex-1 flex flex-col min-h-0 overflow-y-auto pb-24"
            style={{
                background: 'var(--a11y-bg)',
                color: 'var(--a11y-text)',
                transition: 'var(--a11y-transition)',
            }}
        >
            <ScreenHeader
                title={translate('allToolsTitle', displayLanguage)}
                showBack={false}
            />

            {/* Subtitle */}
            <div className="px-5 pt-2 pb-4">
                <p
                    className="text-sm"
                    style={{
                        fontFamily: 'var(--a11y-font-body)',
                        color: 'var(--a11y-text-muted)',
                    }}
                >
                    {translate('allToolsDesc', displayLanguage)}
                </p>
            </div>

            {/* ── Flat 2-Column Grid ──────────────────────────────────────── */}
            <div
                className="grid grid-cols-2 gap-4 px-5"
            >
                {ALL_TOOLS.map((item) => {
                    // Special handling for Learning Feed (not in TILE_REGISTRY)
                    if (item.key === 'learnFeed') {
                        return (
                            <button
                                key={item.key}
                                onClick={() => navigate('/learn')}
                                className="flex flex-row items-center text-left hover:scale-[1.02] transition-transform duration-250 active:scale-[0.98]"
                                style={{
                                    background: 'var(--a11y-surface)',
                                    borderRadius: 'var(--a11y-border-radius)',
                                    border: `var(--a11y-border-width) solid rgba(0,0,0,0.07)`,
                                    padding: isLowVision ? '24px 20px' : '20px',
                                    minHeight: isLowVision ? '120px' : '100px',
                                    boxShadow: 'var(--a11y-shadow)',
                                    transition: 'var(--a11y-transition)',
                                    gap: '16px',
                                }}
                            >
                                <div
                                    className="flex items-center justify-center shrink-0 rounded-[1.25rem]"
                                    style={{
                                        width: isLowVision ? '64px' : '56px',
                                        height: isLowVision ? '64px' : '56px',
                                        background: 'var(--a11y-primary)',
                                    }}
                                >
                                    <BookOpen
                                        size={isLowVision ? 30 : 26}
                                        className="text-white"
                                    />
                                </div>
                                <span
                                    className="font-bold leading-tight"
                                    style={{
                                        fontFamily: 'var(--a11y-font-body)',
                                        fontSize: isLowVision ? '1.2rem' : '1.05rem',
                                        color: 'var(--a11y-text)',
                                    }}
                                >
                                    {translate('learnFeed', displayLanguage)}
                                </span>
                            </button>
                        );
                    }

                    const tile = TILE_REGISTRY[item.tileKey];
                    if (!tile) return null;
                    const Icon = tile.icon;

                    return (
                        <button
                            key={item.key}
                            onClick={() => navigate(tile.path)}
                            className="flex flex-row items-center text-left hover:scale-[1.02] transition-transform duration-250 active:scale-[0.98]"
                            style={{
                                background: 'var(--a11y-surface)',
                                borderRadius: 'var(--a11y-border-radius)',
                                border: `var(--a11y-border-width) solid rgba(0,0,0,0.07)`,
                                padding: isLowVision ? '24px 20px' : '20px',
                                minHeight: isLowVision ? '120px' : '100px',
                                boxShadow: 'var(--a11y-shadow)',
                                transition: 'var(--a11y-transition)',
                                gap: '16px',
                            }}
                        >
                            <div
                                className="flex items-center justify-center shrink-0 rounded-[1.25rem]"
                                style={{
                                    width: isLowVision ? '64px' : '56px',
                                    height: isLowVision ? '64px' : '56px',
                                    background: 'var(--a11y-primary)',
                                }}
                            >
                                <Icon
                                    size={isLowVision ? 30 : 26}
                                    className="text-white"
                                />
                            </div>
                            <span
                                className="font-bold leading-tight"
                                style={{
                                    fontFamily: 'var(--a11y-font-body)',
                                    fontSize: isLowVision ? '1.2rem' : '1.05rem',
                                    color: 'var(--a11y-text)',
                                }}
                            >
                                {translate('tile_' + item.tileKey, displayLanguage)}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
