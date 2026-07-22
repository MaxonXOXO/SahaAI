import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, MapPin, Search } from 'lucide-react';
import Button from '../../shared/components/Button';
import useProfileStore from '../../store/useProfileStore';
import useSettingsStore from '../../store/useSettingsStore';
import { translate } from '../../shared/lib/translations';
import { supabase } from '../../shared/lib/supabaseClient';

const REGIONS = [
    { key: 'Kerala', labelEn: 'Kerala', labelMl: 'കേരളം' },
    { key: 'Tamil Nadu', labelEn: 'Tamil Nadu', labelMl: 'തമിഴ്നാട്' },
    { key: 'Karnataka', labelEn: 'Karnataka', labelMl: 'കർണാടക' },
    { key: 'Maharashtra', labelEn: 'Maharashtra', labelMl: 'മഹാരാഷ്ട്ര' },
    { key: 'Delhi', labelEn: 'Delhi', labelMl: 'ഡൽഹി' },
    { key: 'Telangana', labelEn: 'Telangana', labelMl: 'തെലങ്കാന' },
    { key: 'Andhra Pradesh', labelEn: 'Andhra Pradesh', labelMl: 'ആന്ധ്രാപ്രദേശ്' },
    { key: 'West Bengal', labelEn: 'West Bengal', labelMl: 'പശ്ചിമ ബംഗാൾ' },
    { key: 'Gujarat', labelEn: 'Gujarat', labelMl: 'ഗുജറാത്ത്' },
    { key: 'Uttar Pradesh', labelEn: 'Uttar Pradesh', labelMl: 'ഉത്തർപ്രദേശ്' },
    { key: 'Other Region', labelEn: 'Other Indian State / Region', labelMl: 'മറ്റ് പ്രദേശം' },
    { key: 'Outside India', labelEn: 'Outside India', labelMl: 'ഇന്ത്യയ്ക്ക് പുറത്ത്' },
];

export default function RegionScreen() {
    const navigate = useNavigate();
    const id = useProfileStore((s) => s.id);
    const storeRegion = useProfileStore((s) => s.region);
    const storeLang = useProfileStore((s) => s.language);
    const displayLanguage = useSettingsStore((s) => s.displayLanguage) || storeLang || 'en';

    const [selected, setSelected] = useState(storeRegion || 'Kerala');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);

    // Filter regions based on search input
    const filteredRegions = useMemo(() => {
        if (!searchQuery.trim()) return REGIONS;
        const q = searchQuery.toLowerCase().trim();
        return REGIONS.filter(
            (r) =>
                r.labelEn.toLowerCase().includes(q) ||
                r.labelMl.toLowerCase().includes(q)
        );
    }, [searchQuery]);

    const handleContinue = async () => {
        if (!selected) return;
        setLoading(true);

        // Update local Zustand state
        useProfileStore.setState({ region: selected });

        // Direct Supabase update
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const userId = id || session?.user?.id;

            if (userId) {
                await supabase
                    .from('profiles')
                    .update({ region: selected })
                    .eq('id', userId);
            }
        } catch (err) {
            console.error('Failed to update region in Supabase:', err);
        } finally {
            setLoading(false);
            navigate('/profile-setup');
        }
    };

    return (
        <div className="flex-1 flex flex-col justify-between px-6 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
            {/* Top Progress Dots (Step 4 of 5) */}
            <div>
                <div className="flex items-center justify-center gap-1.5 mb-6">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary/30" />
                    <div className="w-2.5 h-2.5 rounded-full bg-primary/30" />
                    <div className="w-2.5 h-2.5 rounded-full bg-primary/30" />
                    <div className="w-8 h-2.5 rounded-full bg-primary" />
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-700" />
                </div>

                {/* Title & Description */}
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                    {translate('regionTitle', displayLanguage)}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    {translate('regionDesc', displayLanguage)}
                </p>

                {/* Search Bar Input */}
                <div className="flex items-center gap-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 mb-4 shadow-xs">
                    <Search size={20} className="text-gray-400 shrink-0" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={translate('searchRegionPlaceholder', displayLanguage)}
                        className="flex-1 bg-transparent outline-none text-base text-gray-800 dark:text-gray-100 placeholder-gray-400"
                    />
                </div>

                {/* Selectable Region Options */}
                <div className="flex flex-col gap-2.5 max-h-[360px] overflow-y-auto pr-1">
                    {filteredRegions.map((reg) => {
                        const isSelected = selected === reg.key;
                        const label = displayLanguage === 'ml' ? reg.labelMl : reg.labelEn;

                        return (
                            <button
                                key={reg.key}
                                onClick={() => setSelected(reg.key)}
                                className={`
                                    flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-150
                                    ${isSelected
                                        ? 'border-primary bg-primary/10 shadow-xs'
                                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'}
                                `}
                            >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                                    <MapPin size={20} />
                                </div>
                                <span className="flex-1 text-base font-semibold text-gray-900 dark:text-gray-100">
                                    {label}
                                </span>
                                <div
                                    className={`
                                        w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0
                                        ${isSelected ? 'border-primary bg-primary' : 'border-gray-300 dark:border-gray-600'}
                                    `}
                                >
                                    {isSelected && <Check size={14} className="text-white" />}
                                </div>
                            </button>
                        );
                    })}

                    {filteredRegions.length === 0 && (
                        <p className="text-center text-sm text-gray-400 py-6">
                            No matching regions found.
                        </p>
                    )}
                </div>
            </div>

            {/* Bottom Action Button */}
            <div className="mt-6 pt-4">
                <Button onClick={handleContinue} disabled={loading || !selected} className="w-full py-4 text-base font-semibold">
                    {loading ? 'Saving...' : 'Continue'}
                </Button>
            </div>
        </div>
    );
}
