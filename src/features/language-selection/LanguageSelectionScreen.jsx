import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import Button from '../../shared/components/Button';
import useProfileStore from '../../store/useProfileStore';
import { supabase } from '../../shared/lib/supabaseClient';

const LANGUAGES = [
    { code: 'en', label: 'English', native: 'English', badge: 'EN' },
    { code: 'ml', label: 'Malayalam', native: 'മലയാളം', badge: 'മல' },
];

export default function LanguageSelectionScreen() {
    const navigate = useNavigate();
    const id = useProfileStore((s) => s.id);
    const storeLanguage = useProfileStore((s) => s.language);

    // Seed from store so re-visits don't reset to 'en'
    const [selected, setSelected] = useState(storeLanguage || 'en');

    const handleContinue = async () => {
        // Update local Zustand profile store & settings store immediately
        useProfileStore.setState({ language: selected });
        useSettingsStore.getState().updateSettings({
            displayLanguage: selected,
            ttsLanguage: selected,
            aiLanguage: selected,
            speechLanguage: selected,
        });

        try {
            // Direct Supabase update using session user id
            const { data: { session } } = await supabase.auth.getSession();
            const userId = id || session?.user?.id;

            if (userId) {
                await supabase
                    .from('profiles')
                    .update({ language: selected })
                    .eq('id', userId);
            }
        } catch (err) {
            console.error('Failed to update language in Supabase:', err);
        } finally {
            navigate('/age-range');
        }
    };

    return (
        <div className="flex-1 flex flex-col justify-between px-6 py-8 min-h-screen bg-gray-50 dark:bg-gray-900">
            <div>
                {/* Top Progress Dots (Step 2 of 5) */}
                <div className="flex items-center justify-center gap-1.5 mb-6">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary/30" />
                    <div className="w-8 h-2.5 rounded-full bg-primary" />
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-700" />
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-700" />
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-700" />
                </div>

                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                    Choose Your Preferred Language
                </h1>
                <p className="text-sm text-gray-400 mb-6">
                    You can change this anytime in settings.
                </p>

            <div className="flex flex-col gap-3">
                {LANGUAGES.map((lang) => {
                    const isSelected = selected === lang.code;
                    return (
                        <button
                            key={lang.code}
                            onClick={() => setSelected(lang.code)}
                            className={`
                flex items-center gap-4 p-4 rounded-card border-2 text-left transition-colors
                ${isSelected
                                    ? 'border-primary bg-primary/5'
                                    : 'border-gray-200 dark:border-gray-700'}
              `}
                        >
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-base-sm">
                                {lang.badge}
                            </div>
                            <div className="flex-1">
                                <p className="text-base-sm font-semibold text-gray-800 dark:text-gray-100">
                                    {lang.label}
                                </p>
                                <p className="text-base-sm text-gray-400">{lang.native}</p>
                            </div>
                            <div
                                className={`
                  w-6 h-6 rounded-full border-2 flex items-center justify-center
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
                <Button onClick={handleContinue} className="w-full py-4 text-base font-semibold">
                    Continue
                </Button>
            </div>
        </div>
    );
}