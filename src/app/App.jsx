/**
 * App.jsx — Root application shell.
 *
 * Composes providers in the correct order:
 *   BrowserRouter → SessionProvider → AccessibilityProvider → AppRoutes
 *
 * All adaptive logic lives in the providers and hooks layers.
 * This file should stay under ~30 lines. Do not add logic here.
 */
import { BrowserRouter }         from 'react-router-dom';
import SessionProvider           from './providers/SessionProvider';
import AccessibilityProvider     from './providers/AccessibilityProvider';
import AppRoutes                 from './routes';

export default function App() {
    return (
        <BrowserRouter>
            <SessionProvider>
                <AccessibilityProvider>
                    <AppRoutes />
                </AccessibilityProvider>
            </SessionProvider>
        </BrowserRouter>
    );
}