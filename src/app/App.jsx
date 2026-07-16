/**
 * App.jsx — Root application shell.
 *
 * Composes providers in the correct order:
 *   BrowserRouter
 *     → SessionProvider
 *       → AccessibilityProvider
 *         → LayoutProvider
 *           → ThemeProvider
 *             → AppRoutes
 *
 * All concerns (Session, Accessibility, Viewport/Layout, Theme) are split cleanly.
 */
import { BrowserRouter }         from 'react-router-dom';
import SessionProvider           from './providers/SessionProvider';
import AccessibilityProvider     from './providers/AccessibilityProvider';
import LayoutProvider            from './providers/LayoutProvider';
import ThemeProvider             from './providers/ThemeProvider';
import AppRoutes                 from './routes';

export default function App() {
    return (
        <BrowserRouter>
            <SessionProvider>
                <AccessibilityProvider>
                    <LayoutProvider>
                        <ThemeProvider>
                            <AppRoutes />
                        </ThemeProvider>
                    </LayoutProvider>
                </AccessibilityProvider>
            </SessionProvider>
        </BrowserRouter>
    );
}