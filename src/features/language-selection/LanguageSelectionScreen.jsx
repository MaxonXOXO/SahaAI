import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import Button from '../../shared/components/Button';
import useProfileStore from '../../store/useProfileStore';

const LANGUAGES = [
    { code: 'en', label: 'English', native: 'English', badge: 'EN' },
    { code: 'ml', label: 'Malayalam', native: 'മലയാളം', badge: 'മല' },
];

export default function LanguageSelectionScreen() {
    const navigate = useNavigate();
    const updateProfile = useProfileStore((s) => s.updateProfile);
    const [selected, setSelected] = useState('en');

    const handleContinue = async () => {
        await updateProfile({ language: selected });
        navigate('/profile-setup');
    };

    return (
        <div className="flex-1 flex flex-col justify-center px-6 py-8">
            <h1 className="text-base-lg font-bold text-gray-800 dark:text-gray-100 mb-1">
                Choose Your Preferred Language
            </h1>
            <p className="text-base-sm text-gray-400 mb-6">
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

            <Button onClick={handleContinue} className="mt-8 w-full">
                Continue
            </Button>
        </div>
    );
}