import { useEffect, useState } from 'react';

type InstallPrompt = Event & {
  prompt: () => Promise<unknown>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const standalone = window.matchMedia('(display-mode: standalone)');
const iosNavigator = navigator as Navigator & { standalone?: boolean };
const isInstalled = () => standalone.matches || iosNavigator.standalone === true;
const appleMobile = /iPhone|iPad|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export function useAppInstall() {
  const [installed, setInstalled] = useState(isInstalled);
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    };
    const onInstall = () => { setInstalled(true); setPrompt(null); };
    const onDisplayMode = () => setInstalled(isInstalled());
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstall);
    standalone.addEventListener('change', onDisplayMode);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstall);
      standalone.removeEventListener('change', onDisplayMode);
    };
  }, []);

  async function install() {
    if (!prompt) { setShowInstructions(true); return; }
    setPrompt(null);
    try {
      await prompt.prompt();
      if ((await prompt.userChoice).outcome === 'accepted') setInstalled(true);
    } catch {
      setShowInstructions(true);
    }
  }

  return { installed, appleMobile, showInstructions, closeInstructions: () => setShowInstructions(false), install };
}
