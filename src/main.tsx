import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Detecção avançada de PWA e iOS para adaptação perfeita de Notch e Ilha Dinâmica em todos os modelos
if (typeof window !== 'undefined') {
  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  if (isIOS) {
    document.documentElement.classList.add('is-ios');
  }

  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;

  if (isStandalone) {
    document.documentElement.classList.add('is-standalone');
    if (window.innerWidth <= 768) {
      document.documentElement.classList.add('is-standalone-mobile');
    }
    if (isIOS) {
      document.documentElement.classList.add('is-ios-pwa');
    }
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
