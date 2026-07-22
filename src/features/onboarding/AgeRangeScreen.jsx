import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, User, GraduationCap, ShieldCheck } from 'lucide-react';
import Button from '../../shared/components/Button';
import useProfileStore from '../../store/useProfileStore';
import useSettingsStore from '../../store/useSettingsStore';
import { translate } from '../../shared/lib/translations';
import { supabase } from '../../shared/lib/supabaseClient';

const AGE_OPTIONS = [
    {
        key: 'under_13',
        labelEn: 'Under 13',
        labelMl: '13 വയസ്സിൽ താഴെ',
        icon: User,
        descEn: 'For young learners',
        descMl: 'ചെറുപ്പക്കാരായ പഠിതാക്കൾക്കായി'
    },
    {
        key: '13_17',
        labelEn: '13–17',
        labelMl: '13–17 വയസ്സ്',
        icon: GraduationCap,
        descEn: 'For teens & students',
        descMl: 'കൗമാരക്കാർക്കും വിദ്യാർത്ഥികൾക്കുമായി'
    },
    {
        key: '18_plus',
        labelEn: '18+',
        labelMl: '18 വയസ്സും അതിൽ കൂടുതലും',
        icon: ShieldCheck,
        descEn: 'For adult learners',
        descMl: 'മുതിർന്ന പഠിതാക്കൾക്കായി'
    },
];

export default function AgeRangeScreen() {
    const navigate = useNavigate();
    const id = useProfileStore((s) => s.id);
    const storeAgeRange = useProfileStore((s) => s.age_range);
    const storeLang = useProfileStore((s) => s.language);
    const displayLanguage = useSettingsStore((s) => s.displayLanguage) || storeLang || 'en';

    const [selected, setSelected] = useState(storeAgeRange || '13_17');
    const [loading, setLoading] = useState(false);

    const handleContinue = async () => {
        if (!selected) return;
        setLoading(true);

        const isMinor = selected === 'under_13' || selected === '13_17';

        // Update local Zustand state
        useProfileStore.setState({ age_range: selected, is_minor: isMinor });

        // Direct Supabase update
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const userId = id || session?.user?.id;

            if (userId) {
                await supabase
                    .from('profiles')
                    .update({ age_range: selected })
                    .eq('id', userId);
            }
        } catch (err) {
            console.error('Failed to update age_range in Supabase:', err);
        } finally {
            setLoading(false);
            navigate('/region');
        }
    };

    return (
        <div className="flex-1 flex flex-col justify-between px-6 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
            {/* Top Progress Dots (Step 3 of 5) */}
            <div>
                <div className="flex items-center justify-center gap-1.5 mb-6">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary/30" />
                    <div className="w-2.5 h-2.5 rounded-full bg-primary/30" />
                    <div className="w-8 h-2.5 rounded-full bg-primary" />
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-700" />
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-700" />
                </div>

                {/* Title & Description */}
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                    {translate('ageRangeTitle', displayLanguage)}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                    {translate('ageRangeDesc', displayLanguage)}
                </p>

                {/* Large Tap Target Selection Buttons */}
                <div className="flex flex-col gap-4">
                    {AGE_OPTIONS.map((opt) => {
                        const isSelected = selected === opt.key;
                        const Icon = opt.icon;
                        const label = displayLanguage === 'ml' ? opt.labelMl : opt.labelEn;
                        const desc = displayLanguage === 'ml' ? opt.descMl : opt.descEn;

                        return (
                            <button
                                key={opt.key}
                                onClick={() => setSelected(opt.key)}
                                className={`
                                    flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-200
                                    ${isSelected
                                        ? 'border-primary bg-primary/10 shadow-md ring-2 ring-primary/20'
                                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'}
                                `}
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isSelected ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                                    <Icon size={24} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-base font-bold text-gray-900 dark:text-gray-100">
                                        {label}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        {desc}
                                    </p>
                                </div>
                                <div
                                    className={`
                                        w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors
                                        ${isSelected ? 'border-primary bg-primary' : 'border-gray-300 dark:border-gray-600'}
                                    `}
                                >
                                    {isSelected && <Check size={16} className="text-white" />}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Bottom Action Button */}
            <div className="mt-8 pt-4">
                <Button onClick={handleContinue} disabled={loading} className="w-full py-4 text-base font-semibold">
                    {loading ? 'Saving...' : 'Continue'}
                </Button>
            </div>
        </div>
    );
}
