import { useNavigate } from 'react-router-dom';
import { Brain } from 'lucide-react';
import Button from '../../shared/components/Button';

export default function SplashScreen() {
    const navigate = useNavigate();

    return (
        <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 text-center">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Brain size={44} className="text-primary" />
            </div>

            <h1 className="text-base-lg font-extrabold text-primary mb-1">
                SahaAI
            </h1>
            <p className="text-base-md font-semibold text-gray-800 dark:text-gray-100">
                One AI Assistant.
            </p>
            <p className="text-base-md font-semibold text-gray-800 dark:text-gray-100 mb-10">
                Many Accessibility Needs.
            </p>

            <Button onClick={() => navigate('/signup')} className="w-full">
                Get Started
            </Button>
        </div>
    );
}