import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, BookOpen, Zap, Users, Calculator, Eye } from 'lucide-react';
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

const ROLES = [
    { key: 'student', label: 'Student' },
    { key: 'parent', label: 'Parent' },
    { key: 'teacher', label: 'Teacher' },
];

export default function ProfileSetupScreen() {
    const navigate = useNavigate();
    const id = useProfileStore((s) => s.id);

    const [selectedNeeds, setSelectedNeeds] = useState([]);
    const [role, setRole] = useState('student');

    const toggleNeedLocal = (key) => {
        setSelectedNeeds((prev) =>
            prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
        );
    };

    const handleContinue = async () => {
        const needs = {
            dyslexia: selectedNeeds.includes('dyslexia'),
            adhd: selectedNeeds.includes('adhd'),
            autism: selectedNeeds.includes('autism'),
            dyscalculia: selectedNeeds.includes('dyscalculia'),
            lowVision: selectedNeeds.includes('lowVision'),
        };

        // Update local Zustand state
        useProfileStore.setState({ needs, role });

        // Direct Supabase update using session user id
        const { data: { session } } = await supabase.auth.getSession();
        const userId = id || session?.user?.id;

        if (userId) {
            const { error } = await supabase
                .from('profiles')
                .update({
                    role,
                    has_dyslexia: needs.dyslexia,
                    has_adhd: needs.adhd,
                    has_autism: needs.autism,
                    has_dyscalculia: needs.dyscalculia,
                    has_low_vision: needs.lowVision,
                })
                .eq('id', userId);

            if (error) console.error('Profile setup save error:', error.message);
        }

        navigate('/dashboard');
    };

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

            <p className="text-base-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                I am a
            </p>
            <div className="flex gap-2 mb-8">
                {ROLES.map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setRole(key)}
                        className={`
              flex-1 py-2 rounded-card border-2 text-base-sm font-medium transition-colors
              ${role === key
                                ? 'border-primary bg-primary text-white'
                                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'}
            `}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <Button onClick={handleContinue} className="w-full">
                Continue
            </Button>
        </div>
    );
}