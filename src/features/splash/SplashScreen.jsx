import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../shared/components/Button';
import useProfileStore from '../../store/useProfileStore';
import splashImg from '../../assets/splash-screen.png';

export default function SplashScreen() {
    const navigate = useNavigate();
    const isAuthenticated = useProfileStore((s) => s.isAuthenticated);
    const sessionReady = useProfileStore((s) => s.sessionReady);

    useEffect(() => {
        if (sessionReady && isAuthenticated) {
            navigate('/home', { replace: true });
        }
    }, [isAuthenticated, navigate, sessionReady]);

    return (
        <div 
            className="flex-1 flex flex-col items-center justify-end px-6 pb-32 min-h-screen relative select-none"
            style={{
                backgroundImage: `url(${splashImg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            }}
        >
            {/* Bottom Button Area - enlarged and positioned further upwards */}
            <div className="w-full max-w-[390px] mx-auto z-10 shrink-0 px-2">
                <Button 
                    onClick={() => navigate('/signup')} 
                    className="w-full py-5 text-xl font-extrabold tracking-wider uppercase shadow-2xl rounded-3xl"
                >
                    Get Started
                </Button>
            </div>
        </div>
    );
}
