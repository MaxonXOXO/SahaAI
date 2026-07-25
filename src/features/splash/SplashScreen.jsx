import { useNavigate } from 'react-router-dom';
import Button from '../../shared/components/Button';
import splashImg from '../../assets/splash-screen.png';

export default function SplashScreen() {
    const navigate = useNavigate();

    return (
        <div 
            className="flex-1 flex flex-col items-center justify-end px-6 pb-16 min-h-screen relative select-none"
            style={{
                backgroundImage: `url(${splashImg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            }}
        >
            {/* Bottom Button Area - floating cleanly above the full-screen background */}
            <div className="w-full max-w-[360px] mx-auto z-10 shrink-0">
                <Button onClick={() => navigate('/signup')} className="w-full py-4 text-base-lg font-bold shadow-2xl">
                    Get Started
                </Button>
            </div>
        </div>
    );
}