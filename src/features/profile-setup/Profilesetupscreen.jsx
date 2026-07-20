import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, BookOpen, Zap, Users, Calculator, Eye, ArrowLeft } from 'lucide-react';
import Button from '../../shared/components/Button';
import useProfileStore from '../../store/useProfileStore';
import { supabase } from '../../shared/lib/supabaseClient';

const NEEDS = [
    { key: 'dyslexia', label: 'Dyslexia', icon: BookOpen },
    { key: 'adhd', label: 'ADHD', icon: Zap },
    { key: 'autism', label: 'Autism', icon: Users },
    { key: 'dyscalculia', label: 'Dyscalculia', icon: Calculator },
    { key: 'lowVision', label: 'Low Vision', icon: Eye },
];

export default function ProfileSetupScreen() {
    const navigate = useNavigate();
    const id = useProfileStore((s) => s.id);

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
            <div className="flex-1 flex flex-col px-6 py-8 overflow-y-auto">
                <button 
                    onClick={() => setStep('needs')}
                    className="flex items-center text-gray-500 mb-6 gap-2 w-max"
                >
                    <ArrowLeft size={20} />
                    <span className="text-base-sm">Back</span>
                </button>
                <h1 className="text-base-lg font-bold text-gray-800 dark:text-gray-100 mb-1">
                    Primary Focus
                </h1>
                <p className="text-base-sm text-gray-400 mb-6">
                    You selected multiple needs. Which one should we optimize your home screen for?
                </p>

                <div className="flex flex-col gap-3 mb-8">
                    {availableNeeds.map(({ key, label, icon: Icon }) => {
                        const isSelected = primaryMode === key;
                        return (
                            <button
                                key={key}
                                onClick={() => setPrimaryMode(key)}
                                className={`
                                    flex items-center gap-3 p-4 rounded-card border-2 text-left transition-colors
                                    ${isSelected ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-700'}
                                `}
                            >
                                <Icon size={20} className={isSelected ? 'text-primary' : 'text-gray-400'} />
                                <span className="flex-1 text-base-sm font-medium text-gray-800 dark:text-gray-100">
                                    {label} Mode
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

                <Button 
                    onClick={handleContinuePrimaryMode} 
                    className="w-full mt-auto"
                    disabled={!primaryMode}
                >
                    Finish Setup
                </Button>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col px-6 py-8 overflow-y-auto">
            <h1 className="text-base-lg font-bold text-gray-800 dark:text-gray-100 mb-1">
                What's your special ability? ✨
            </h1>
            <p className="text-base-sm text-gray-400 mb-6">
                Pick all that fit you — we'll shape the app around it.
            </p>

            <div className="flex flex-col gap-3 mb-8">
                {NEEDS.map(({ key, label, icon: Icon }) => {
                    const isSelected = selectedNeeds.includes(key);
                    return (
                        <button
                            key={key}
                            onClick={() => toggleNeedLocal(key)}
                            className={`
                flex items-center gap-3 p-4 rounded-card border-2 text-left transition-colors
                ${isSelected ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-700'}
              `}
                        >
                            <Icon size={20} className={isSelected ? 'text-primary' : 'text-gray-400'} />
                            <span className="flex-1 text-base-sm font-medium text-gray-800 dark:text-gray-100">
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

            <Button onClick={handleContinueNeeds} className="w-full mt-auto">
                Continue
            </Button>
        </div>
    );
}