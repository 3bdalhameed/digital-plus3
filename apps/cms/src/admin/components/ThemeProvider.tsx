// @ts-nocheck
import React, { useEffect } from 'react';

// ──────────────────────────────────────────────────────────────
// Synchronous module-level setup — runs when the admin bundle
// parses this module, BEFORE React mounts and before first paint.
// This is Payload v2's closest equivalent to a synchronous inline
// <script> in <head>: the admin shell can't be templated, but
// top-level module code executes before any React render.
// ──────────────────────────────────────────────────────────────
if (typeof document !== 'undefined') {
  const root = document.documentElement;
  root.setAttribute('dir', 'rtl');
  root.setAttribute('lang', 'ar');
  root.setAttribute('data-theme', 'light');
  try { localStorage.setItem('payload-theme', 'light'); } catch {}

  // Cairo font — inject the <link> as early as possible so the
  // first paint uses Cairo rather than the Tahoma/Arial fallback.
  if (!document.getElementById('cairo-font')) {
    const preconnect1 = document.createElement('link');
    preconnect1.rel = 'preconnect';
    preconnect1.href = 'https://fonts.googleapis.com';
    document.head.appendChild(preconnect1);

    const preconnect2 = document.createElement('link');
    preconnect2.rel = 'preconnect';
    preconnect2.href = 'https://fonts.gstatic.com';
    preconnect2.crossOrigin = 'anonymous';
    document.head.appendChild(preconnect2);

    const link = document.createElement('link');
    link.id   = 'cairo-font';
    link.rel  = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap';
    document.head.appendChild(link);
  }
}

export default function ThemeProvider({ children }: { children?: React.ReactNode }) {
  useEffect(() => {
    // Re-assert dir/lang/theme after mount in case Payload's own
    // ThemeProvider (or any other downstream effect) overwrites them.
    const root = document.documentElement;
    root.setAttribute('dir', 'rtl');
    root.setAttribute('lang', 'ar');
    root.setAttribute('data-theme', 'light');

    // Runtime CSS overrides
    if (!document.getElementById('brand-runtime')) {
      const style = document.createElement('style');
      style.id = 'brand-runtime';
      style.textContent = `
        :root {
          --theme-success:     #7C3AED;
          --color-success-500: 124, 58, 237;
          --color-success-100: 237, 233, 254;
        }
        :focus-visible {
          outline: 2px solid #7C3AED !important;
          outline-offset: 2px !important;
        }
        /* Native <select> chevron — logical properties so the
           chevron + padding land on the inline-end side regardless
           of direction. In RTL the inline-end is physical-left. */
        select {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%237C3AED' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") !important;
          background-repeat: no-repeat !important;
          padding-inline-end: 36px !important;
          padding-inline-start: 14px !important;
          -webkit-appearance: none !important;
          appearance: none !important;
        }
        html[dir="rtl"] select { background-position: left 12px center !important; }
        html:not([dir="rtl"]) select { background-position: right 12px center !important; }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return <>{children}</>;
}
