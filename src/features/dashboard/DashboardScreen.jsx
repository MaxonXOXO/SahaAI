import { useNavigate } from 'react-router-dom';
import { Bell, Settings, Clock, ChevronRight } from 'lucide-react';
import Card from '../../shared/components/Card';
import IconButton from '../../shared/components/IconButton';
import useProfileStore from '../../store/useProfileStore';
import useSettingsStore from '../../store/useSettingsStore';
import { DASHBOARD_MODES, TILE_REGISTRY } from './dashboardModes';
import Button from '../../shared/components/Button';
import useRecentActivity from '../../shared/hooks/useRecentActivity';
import { getEventLabel, getEventLink, EVENT_REGISTRY } from '../../shared/lib/eventRegistry';
import { translate } from '../../shared/lib/translations';

export default function DashboardScreen() {
    const navigate = useNavigate();
    const name = useProfileStore((s) => s.name);
    const username = useProfileStore((s) => s.username);
    const primaryMode = useProfileStore((s) => s.primaryMode);
    const displayLanguage = useSettingsStore((s) => s.displayLanguage);
    const { recentItems, loading: recentLoading } = useRecentActivity(5);

    const displayName = name || username || 'there';
    
    // Fallback to default if no mode is set
    const modeKey = primaryMode && DASHBOARD_MODES[primaryMode] ? primaryMode : 'default';
    const config = DASHBOARD_MODES[modeKey];

    // For Low Vision, we might want a darker background. 
    // Just a quick check to apply a specific wrapper style if needed based on the config.
    const isLowVision = modeKey === 'lowVision';
    const containerClasses = `flex-1 flex flex-col px-4 py-4 overflow-y-auto pb-24 transition-colors duration-300 ${isLowVision ? 'bg-gray-950 text-white' : 'bg-white dark:bg-gray-900'}`;
    const textClasses = isLowVision ? 'text-gray-100' : 'text-gray-800 dark:text-gray-100';
    const subTextClasses = isLowVision ? 'text-gray-300' : 'text-gray-400';

    return (
        <div className={containerClasses}>
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h1 className={`text-base-md font-bold ${textClasses}`}>
                        {translate('welcomeBack', displayLanguage)}, {displayName}! {isLowVision ? '👁️' : '👋'}
                    </h1>
                    <p className={`text-base-sm mt-1 ${subTextClasses}`}>
                        {translate('greeting_' + modeKey, displayLanguage)}
                    </p>
                </div>
                <IconButton 
                    icon={Bell} 
                    label={translate('notifications', displayLanguage)} 
                    variant="default" 
                    className={isLowVision ? 'text-yellow-400 border-yellow-400' : ''} 
                />
            </div>

            {/* Configurable Hero Card based on Mode */}
            <p className={`text-xs font-bold tracking-wider mb-2 uppercase ${config.themeColor}`}>
                {translate('hero_' + modeKey, displayLanguage)}
            </p>
            <Card className={`mb-6 p-5 border-2 ${isLowVision ? 'border-yellow-400 bg-gray-900' : `border-transparent ${config.bgLight}`}`}>
                <div className="flex flex-col items-center justify-center py-4">
                    <p className={`text-center font-medium ${isLowVision ? 'text-white' : 'text-gray-700 dark:text-gray-200'}`}>
                        {translate('hero_text_' + modeKey, displayLanguage)}
                    </p>
                    
                    <Button 
                        className={`mt-6 w-full ${isLowVision ? 'bg-yellow-400 text-black hover:bg-yellow-500' : ''}`}
                        onClick={() => navigate('/settings')}
                    >
                        {translate('hero_btn_' + modeKey, displayLanguage)}
                    </Button>
                </div>
            </Card>

            {/* ── Recently Used Section ─────────────────────────────────────── */}
            {!recentLoading && recentItems.length > 0 && (
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <Clock size={14} className={isLowVision ? 'text-yellow-400' : 'text-gray-400'} />
                        <p className={`text-xs font-bold tracking-wider uppercase ${isLowVision ? 'text-yellow-400' : 'text-gray-400'}`}>
                            {translate('recentlyUsed', displayLanguage)}
                        </p>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {recentItems.map((item, idx) => {
                            const link = getEventLink(item.event_type);
                            const rawLabel = getEventLabel(item.event_type);
                            const entry = EVENT_REGISTRY[item.event_type];
                            
                            // Try to find a matching tile for translation and its icon
                            const matchedTileEntry = Object.entries(TILE_REGISTRY).find(
                                ([_, t]) => entry && t.path === entry.path
                            );
                            const matchedTileKey = matchedTileEntry ? matchedTileEntry[0] : null;
                            const matchedTile = matchedTileEntry ? matchedTileEntry[1] : null;
                            const Icon = matchedTile?.icon;
                            
                            const label = matchedTileKey 
                                ? translate('tile_' + matchedTileKey, displayLanguage) 
                                : rawLabel;

                            return (
                                <button
                                    key={`${item.event_type}-${idx}`}
                                    onClick={() => link && navigate(link)}
                                    className={`
                                        shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-full border text-xs font-semibold transition-all
                                        hover:scale-[1.02] active:scale-[0.98]
                                        ${isLowVision
                                            ? 'bg-gray-900 border-yellow-400/60 text-yellow-400'
                                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-gray-300'}
                                    `}
                                >
                                    {Icon && <Icon size={14} className={isLowVision ? 'text-yellow-400' : 'text-gray-400'} />}
                                    {label}
                                    <ChevronRight size={12} className="opacity-40" />
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between mb-3">
                <p className={`text-xs font-bold tracking-wider uppercase ${config.themeColor}`}>
                    {translate('quickAccess', displayLanguage)}
                </p>
                <IconButton 
                    icon={Settings} 
                    size={16} 
                    label={translate('editTiles', displayLanguage)} 
                    onClick={() => navigate('/settings')}
                    className={isLowVision ? 'text-yellow-400 border-transparent' : 'text-gray-400 border-transparent'}
                />
            </div>

            <div className="grid grid-cols-3 gap-3">
                {config.tiles.map((tileKey) => {
                    const tile = TILE_REGISTRY[tileKey];
                    if (!tile) return null;
                    const Icon = tile.icon;
                    return (
                        <button 
                            key={tileKey} 
                            onClick={() => navigate(tile.path)}
                            className={`flex flex-col items-center justify-center p-3 rounded-card border-2 transition-all 
                                ${isLowVision 
                                    ? 'bg-gray-900 border-yellow-400 hover:bg-gray-800' 
                                    : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-gray-200'}
                            `}
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${isLowVision ? 'bg-transparent text-yellow-400' : tile.color}`}>
                                <Icon size={20} className={isLowVision ? 'text-yellow-400' : 'text-white'} />
                            </div>
                            <span className={`text-xs text-center font-medium ${isLowVision ? 'text-yellow-400' : 'text-gray-700 dark:text-gray-200'}`}>
                                {translate('tile_' + tileKey, displayLanguage)}
                            </span>
                        </button>
                    );
                })}
            </div>
            
            <div className={`mt-8 p-3 rounded-card text-center text-xs font-medium border
                ${isLowVision ? 'bg-yellow-400 text-black border-yellow-400' : `${config.bgLight} ${config.themeColor} border-transparent`}
            `}>
                {translate('tip_' + modeKey, displayLanguage)}
            </div>
        </div>
    );
}