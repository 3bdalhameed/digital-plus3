// @ts-nocheck
import React, { useEffect } from 'react';

export default function ThemeProvider({ children }: { children?: React.ReactNode }) {
  useEffect(() => {
    // Force light theme and Arabic RTL
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.setAttribute('dir', 'rtl');
    document.documentElement.setAttribute('lang', 'ar');
    try { localStorage.setItem('payload-theme', 'light'); } catch {}

    // Cairo font (weights 400–800)
    if (!document.getElementById('cairo-font')) {
      const link = document.createElement('link');
      link.id = 'cairo-font';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap';
      document.head.appendChild(link);
    }

    // Extra runtime overrides that CSS variables alone can't reach
    if (!document.getElementById('brand-runtime')) {
      const style = document.createElement('style');
      style.id = 'brand-runtime';
      style.textContent = `
        /* Payload's internal success color → brand purple */
        :root {
          --theme-success:        #7C3AED;
          --color-success-500:    124, 58, 237;
          --color-success-100:    237, 233, 254;
        }

        /* Sidebar brand mark */
        .nav__brand svg path { fill: #C4B5FD !important; }

        /* Focus rings */
        :focus-visible {
          outline: 2px solid #7C3AED !important;
          outline-offset: 2px !important;
        }

        /* Active nav item left-border indicator */
        [class*="nav__link--active"],
        [class*="nav__link"][aria-current] {
          border-right: 3px solid #A78BFA !important;
          background: rgba(167,139,250,0.15) !important;
        }

        /* Table sort arrows */
        [class*="sort"] svg, [class*="sort-icon"] { color: #7C3AED !important; }

        /* Select arrow */
        select { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%237C3AED' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") !important; background-repeat: no-repeat !important; background-position: left 12px center !important; padding-left: 36px !important; appearance: none !important; }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return <>{children}</>;
}
