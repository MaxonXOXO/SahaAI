import { useNavigate } from 'react-router-dom';
import { Bell, BookOpen, Zap, Users, Calculator, Eye, FileText, Sparkles, MessageSquare, ListChecks } from 'lucide-react';
import Card from '../../shared/components/Card';
import IconButton from '../../shared/components/IconButton';
import useProfileStore from '../../store/useProfileStore';

const NEED_META = {
    dyslexia: { label: 'Dyslexia', icon: BookOpen, color: 'bg-accent-dyslexia' },
    adhd: { label: 'ADHD', icon: Zap, color: 'bg-accent-adhd' },
    autism: { label: 'Autism', icon: Users, color: 'bg-accent-autism' },
    dyscalculia: { label: 'Dyscalculia', icon: Calculator, color: 'bg-accent-dyscalculia' },
    lowVision: { label: 'Low Vision', icon: Eye, color: 'bg-accent-lowvision' },
};

const QUICK_ACCESS = [
    { key: 'read', label: 'Read Text', icon: FileText, path: '/reading-mode', color: 'bg-primary' },
    { key: 'math', label: 'Math Helper', icon: Calculator, path: '/math-helper', color: 'bg-accent-dyscalculia' },
    { key: 'social', label: 'Social Stories', icon: MessageSquare, path: '/social-story', color: 'bg-accent-autism' },
    { key: 'focus', label: 'Focus Mode', icon: Sparkles, path: '/focus-mode', color: 'bg-accent-adhd' },
    { key: 'vision', label: 'Vision Assistant', icon: Eye, path: '/vision-assistant', color: 'bg-accent-lowvision' },
    { key: 'routine', label: 'Routine Builder', icon: ListChecks, path: '/routine-builder', color: 'bg-accent-dyslexia' },
];

export default function DashboardScreen() {
    const navigate = useNavigate();
    const name = useProfileStore((s) => s.name);
    const username = useProfileStore((s) => s.username);
    const needs = useProfileStore((s) => s.needs);

    const displayName = name || username || 'there';
    const activeNeeds = Object.entries(needs).filter(([, active]) => active);

    return (
        <div className="flex-1 flex flex-col px-4 py-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h1 className="text-base-md font-bold text-gray-800 dark:text-gray-100">
                        Hello, {displayName} 👋
                    </h1>
                    <p className="text-base-sm text-gray-400">You're doing great today.</p>
                </div>
                <IconButton icon={Bell} label="Notifications" variant="default" />
            </div>

            {activeNeeds.length > 0 && (
                <Card title="Your Accessibility Profile" className="mb-4">
                    <div className="flex gap-3 mt-1">
                        {activeNeeds.map(([key]) => {
                            const meta = NEED_META[key];
                            if (!meta) return null;
                            const Icon = meta.icon;
                            return (
                                <div key={key} className="flex flex-col items-center gap-1">
                                    <div className={`${meta.color} w-10 h-10 rounded-full flex items-center justify-center`}>
                                        <Icon size={18} className="text-white" />
                                    </div>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{meta.label}</span>
                                </div>
                            );
                        })}
                        <button
                            onClick={() => navigate('/settings')}
                            className="ml-auto self-center text-xs text-primary font-semibold"
                        >
                            View & Edit
                        </button>
                    </div>
                </Card>
            )}

            <p className="text-base-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">
                Quick Access
            </p>
            <div className="grid grid-cols-2 gap-3">
                {QUICK_ACCESS.map(({ key, label, icon: Icon, path, color }) => (
                    <Card key={key} onClick={() => navigate(path)}>
                        <div className={`${color} w-9 h-9 rounded-full flex items-center justify-center mb-2`}>
                            <Icon size={18} className="text-white" />
                        </div>
                        <p className="text-base-sm font-medium text-gray-800 dark:text-gray-100">
                            {label}
                        </p>
                    </Card>
                ))}
            </div>
        </div>
    );
}