// @ts-nocheck
import React, { useEffect } from 'react';

export default function ThemeProvider({ children }: { children?: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.setAttribute('dir', 'rtl');
    document.documentElement.setAttribute('lang', 'ar');
    try { localStorage.setItem('payload-theme', 'light'); } catch {}

    // Load Cairo font
    if (!document.getElementById('cairo-font')) {
      const link = document.createElement('link');
      link.id = 'cairo-font';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap';
      document.head.appendChild(link);
    }
  }, []);
  return <>{children}</>;
}
