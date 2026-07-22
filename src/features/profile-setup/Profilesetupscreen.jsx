import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, BookOpen, Zap, Users, Calculator, Eye, ArrowLeft } from 'lucide-react';
import Button from '../../shared/components/Button';
import useProfileStore from '../../store/useProfileStore';
import useSettingsStore from '../../store/useSettingsStore';
import { supabase } from '../../shared/lib/supabaseClient';

const NEEDS = [
    { key: 'dyslexia', labelEn: 'Dyslexia', labelMl: 'ഡിസ്‌ലെക്സിയ (Dyslexia)', icon: BookOpen },
    { key: 'adhd', labelEn: 'ADHD', labelMl: 'എഡിഎച്ച്ഡി (ADHD)', icon: Zap },
    { key: 'autism', labelEn: 'Autism', labelMl: 'ഓട്ടിസം (Autism)', icon: Users },
    { key: 'dyscalculia', labelEn: 'Dyscalculia', labelMl: 'ഡിസ്‌കാൽക്കുലിയ (Dyscalculia)', icon: Calculator },
    { key: 'lowVision', labelEn: 'Low Vision', labelMl: 'കുറഞ്ഞ കാഴ്ച (Low Vision)', icon: Eye },
];

export default function ProfileSetupScreen() {
    const navigate = useNavigate();
    const id = useProfileStore((s) => s.id);
    const storeLang = useProfileStore((s) => s.language);
    const displayLanguage = useSettingsStore((s) => s.displayLanguage) || storeLang || 'en';

    const [step, setStep] = useState('needs'); // 'needs' or 'primaryMode'
    const [selectedNeeds, setSelectedNeeds] = useState([]);
    const [primaryMode, setPrimaryMode] = useState(null);

    const toggleNeedLocal = (key) => {
        setSelectedNeeds((prev) =>
            prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
        );
    };

    const handleContinueNeeds = () => {
        if (selectedNeeds.length > 1) {
            setStep('primaryMode');
        } else {
            const singleMode = selectedNeeds.length === 1 ? selectedNeeds[0] : null;
            saveProfile(singleMode);
        }
    };

    const handleContinuePrimaryMode = () => {
        if (!primaryMode && selectedNeeds.length > 0) {
            saveProfile(selectedNeeds[0]);
        } else {
            saveProfile(primaryMode);
        }
    };

    const saveProfile = async (finalPrimaryMode) => {
        const needs = {
            dyslexia: selectedNeeds.includes('dyslexia'),
            adhd: selectedNeeds.includes('adhd'),
            autism: selectedNeeds.includes('autism'),
            dyscalculia: selectedNeeds.includes('dyscalculia'),
            lowVision: selectedNeeds.includes('lowVision'),
        };

        // Update local Zustand state
        useProfileStore.setState({ needs, primaryMode: finalPrimaryMode });

        // Direct Supabase update using session user id
        const { data: { session } } = await supabase.auth.getSession();
        const userId = id || session?.user?.id;

        if (userId) {
            const { error } = await supabase
                .from('profiles')
                .update({
                    has_dyslexia: needs.dyslexia,
                    has_adhd: needs.adhd,
                    has_autism: needs.autism,
                    has_dyscalculia: needs.dyscalculia,
                    has_low_vision: needs.lowVision,
                    primary_mode: finalPrimaryMode,
                })
                .eq('id', userId);

            if (error) console.error('Profile setup save error:', error.message);
        }

        navigate('/home');
    };

    if (step === 'primaryMode') {
        const availableNeeds = NEEDS.filter(n => selectedNeeds.includes(n.key));

        return (
            <div className="flex-1 flex flex-col justify-between px-6 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
                <div>
                    <button
                        onClick={() => setStep('needs')}
                        className="flex items-center text-gray-500 mb-6 gap-2 w-max"
                    >
                        <ArrowLeft size={20} />
                        <span className="text-base-sm font-semibold">
                            {displayLanguage === 'ml' ? 'തിരികെ' : 'Back'}
                        </span>
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                        {displayLanguage === 'ml' ? 'പ്രധാന ഫോക്കസ്' : 'Primary Focus'}
                    </h1>
                    <p className="text-sm text-gray-400 mb-6">
                        {displayLanguage === 'ml'
                            ? 'നിങ്ങൾ ഒന്നിലധികം അവസ്ഥകൾ തിരഞ്ഞെടുത്തു. ഏതിനാണ് ഹോം സ്‌ക്രീനിൽ മുൻഗണന നൽകേണ്ടത്?'
                            : 'You selected multiple needs. Which one should we optimize your home screen for?'}
                    </p>

                    <div className="flex flex-col gap-3 mb-8">
                        {availableNeeds.map(({ key, labelEn, labelMl, icon: Icon }) => {
                            const isSelected = primaryMode === key;
                            const label = displayLanguage === 'ml' ? labelMl : labelEn;

                            return (
                                <button
                                    key={key}
                                    onClick={() => setPrimaryMode(key)}
                                    className={`
                                        flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-colors
                                        ${isSelected ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}
                                    `}
                                >
                                    <Icon size={20} className={isSelected ? 'text-primary' : 'text-gray-400'} />
                                    <span className="flex-1 text-base font-semibold text-gray-800 dark:text-gray-100">
                                        {label}
                                    </span>
                                    <div
                                        className={`
                                            w-6 h-6 rounded-full border-2 flex items-center justify-center
                                            ${isSelected ? 'border-primary' : 'border-gray-300'}
                                        `}
                                    >
                                        {isSelected && <div className="w-3 h-3 rounded-full bg-primary" />}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-8 pt-4">
                    <Button
                        onClick={handleContinuePrimaryMode}
                        className="w-full py-4 text-base font-semibold"
                        disabled={!primaryMode}
                    >
                        {displayLanguage === 'ml' ? 'പൂർത്തിയാക്കുക' : 'Finish Setup'}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col justify-between px-6 py-8 overflow-y-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div>
                {/* Top Progress Dots (Step 5 of 5) */}
                <div className="flex items-center justify-center gap-1.5 mb-6">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary/30" />
                    <div className="w-2.5 h-2.5 rounded-full bg-primary/30" />
                    <div className="w-2.5 h-2.5 rounded-full bg-primary/30" />
                    <div className="w-2.5 h-2.5 rounded-full bg-primary/30" />
                    <div className="w-8 h-2.5 rounded-full bg-primary" />
                </div>

                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                    {displayLanguage === 'ml' ? 'നിങ്ങളുടെ പ്രത്യേകത എന്താണ്? ✨' : "What's your special ability? ✨"}
                </h1>
                <p className="text-sm text-gray-400 mb-6">
                    {displayLanguage === 'ml'
                        ? 'നിങ്ങൾക്ക് അനുയോജ്യമായവ തിരഞ്ഞെടുക്കുക — ഞങ്ങൾ ആപ്പ് അതിനനുസരിച്ച് രൂപപ്പെടുത്തും.'
                        : "Pick all that fit you — we'll shape the app around it."}
                </p>

                <div className="flex flex-col gap-3 mb-8">
                    {NEEDS.map(({ key, labelEn, labelMl, icon: Icon }) => {
                        const isSelected = selectedNeeds.includes(key);
                        const label = displayLanguage === 'ml' ? labelMl : labelEn;

                        return (
                            <button
                                key={key}
                                onClick={() => toggleNeedLocal(key)}
                                className={`
                                    flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-colors
                                    ${isSelected ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}
                                `}
                            >
                                <Icon size={20} className={isSelected ? 'text-primary' : 'text-gray-400'} />
                                <span className="flex-1 text-base font-medium text-gray-800 dark:text-gray-100">
                                    {label}
                                </span>
                                <div
                                    className={`
                                        w-6 h-6 rounded-md border-2 flex items-center justify-center
                                        ${isSelected ? 'border-primary bg-primary' : 'border-gray-300'}
                                    `}
                                >
                                    {isSelected && <Check size={14} className="text-white" />}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="mt-8 pt-4">
                <Button onClick={handleContinueNeeds} className="w-full py-4 text-base font-semibold">
                    {displayLanguage === 'ml' ? 'തുടരുക' : 'Continue'}
                </Button>
            </div>
        </div>
    );
}