// @ts-nocheck
import React, { useEffect } from 'react';

export default function ThemeProvider({ children }: { children?: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    try { localStorage.setItem('payload-theme', 'light'); } catch {}
  }, []);
  return <>{children}</>;
}
