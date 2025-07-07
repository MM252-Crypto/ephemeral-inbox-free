import { useEffect, useState } from 'react';

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: any;
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
  };
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    show(): void;
    hide(): void;
    enable(): void;
    disable(): void;
    setText(text: string): void;
    onClick(callback: () => void): void;
    offClick(callback: () => void): void;
  };
  BackButton: {
    isVisible: boolean;
    show(): void;
    hide(): void;
    onClick(callback: () => void): void;
    offClick(callback: () => void): void;
  };
  ready(): void;
  expand(): void;
  close(): void;
  sendData(data: string): void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

export const useTelegramWebApp = () => {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initTelegram = () => {
      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        setWebApp(tg);
        
        // Initialize the app
        tg.ready();
        tg.expand();
        
        // Apply Telegram theme
        document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#ffffff');
        document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#000000');
        document.documentElement.style.setProperty('--tg-theme-hint-color', tg.themeParams.hint_color || '#999999');
        document.documentElement.style.setProperty('--tg-theme-link-color', tg.themeParams.link_color || '#2481cc');
        document.documentElement.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color || '#2481cc');
        document.documentElement.style.setProperty('--tg-theme-button-text-color', tg.themeParams.button_text_color || '#ffffff');
        document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', tg.themeParams.secondary_bg_color || '#f1f1f1');
        
        setIsLoading(false);
      }
    };

    // Try to initialize immediately
    initTelegram();

    // If not available immediately, wait for script to load
    if (!window.Telegram?.WebApp) {
      const checkTelegram = setInterval(() => {
        if (window.Telegram?.WebApp) {
          initTelegram();
          clearInterval(checkTelegram);
        }
      }, 100);

      // Cleanup after 5 seconds if still not loaded
      setTimeout(() => {
        clearInterval(checkTelegram);
        if (!window.Telegram?.WebApp) {
          console.log('Running outside Telegram - using fallback');
          setIsLoading(false);
        }
      }, 5000);

      return () => clearInterval(checkTelegram);
    }
  }, []);

  const isTelegramEnvironment = webApp !== null;

  return {
    webApp,
    isLoading,
    isTelegramEnvironment,
    user: webApp?.initDataUnsafe?.user,
    colorScheme: webApp?.colorScheme || 'light',
    themeParams: webApp?.themeParams || {},
  };
};