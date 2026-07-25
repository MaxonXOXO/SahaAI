import { useNavigate } from 'react-router-dom';
import Button from '../../shared/components/Button';
import splashImg from '../../assets/splash-screen.png';

export default function SplashScreen() {
    const navigate = useNavigate();

    return (
        <div className="flex-1 flex flex-col items-center justify-between px-6 py-10 min-h-screen bg-surface dark:bg-surface-dark relative select-none">
            {/* Center Image Container */}
            <div className="flex-1 flex items-center justify-center w-full max-w-[360px] mx-auto my-auto">
                <img 
                    src={splashImg} 
                    alt="SahaAI Splash Screen" 
                    className="w-full h-auto object-contain max-h-[55vh] rounded-3xl"
                />
            </div>

            {/* Bottom Button Area - pushed downwards to avoid overlap */}
            <div className="w-full max-w-[360px] mx-auto mt-6 shrink-0 pb-4">
                <Button onClick={() => navigate('/signup')} className="w-full py-4 text-base-lg font-bold">
                    Get Started
                </Button>
            </div>
        </div>
    );
}