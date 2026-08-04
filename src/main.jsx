import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App.jsx';
import './index.css'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch((error) => {
      console.warn('SahaAI offline support could not be registered.', error);
    });
  });
}

// Make the installed app behave like a touch-first application instead of a
// browser page. Editable fields remain selectable through the CSS exceptions.
window.addEventListener('contextmenu', (event) => event.preventDefault());
window.addEventListener('dragstart', (event) => event.preventDefault());
window.addEventListener('gesturestart', (event) => event.preventDefault());


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
