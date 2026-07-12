import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';

/**
 * App shell — mobile-only viewport.
 * Fixed max-width container simulates a phone screen on desktop browsers
 * during development; on real mobile it just fills the viewport.
 */
export default function App() {
    return (
        <BrowserRouter>
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex justify-center">
                <div className="w-full max-w-[420px] min-h-screen bg-surface dark:bg-surface-dark relative flex flex-col shadow-xl">
                    <AppRoutes />
                </div>
            </div>
        </BrowserRouter>
    );
}