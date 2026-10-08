import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {applyA11yPrefs, readA11yPrefs} from './components/AccessibilityMenu';
import './index.css';

// Apply saved accessibility preferences before the first paint.
applyA11yPrefs(readA11yPrefs());

createRoot(document.getElementById('root')!).render(<App />);
