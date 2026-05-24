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
      link.id   = 'cairo-font';
      link.rel  = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap';
      document.head.appendChild(link);
    }

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
        [class*="nav__link--active"],
        [class*="nav__link"][aria-current] {
          border-right: 3px solid #A78BFA !important;
          background: rgba(167,139,250,0.15) !important;
        }
        select {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%237C3AED' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") !important;
          background-repeat: no-repeat !important;
          background-position: left 12px center !important;
          padding-left: 36px !important;
          -webkit-appearance: none !important;
          appearance: none !important;
        }
      `;
      document.head.appendChild(style);
    }

    /* ── Back button ─────────────────────────────────────────────────────── */
    const BTN_ID = 'dp-back-btn';

    const isDashboard = () => {
      const p = window.location.pathname;
      return p === '/admin' || p === '/admin/' || p === '/admin/index.html';
    };

    const showBtn = () => {
      const existing = document.getElementById(BTN_ID);
      if (isDashboard()) {
        if (existing) existing.remove();
        return;
      }
      if (existing) return;

      const btn = document.createElement('button');
      btn.id = BTN_ID;
      btn.setAttribute('dir', 'rtl');
      btn.innerHTML = '&#8594; رجوع'; // right-arrow (looks like back in RTL)

      Object.assign(btn.style, {
        position:     'fixed',
        bottom:       '28px',
        left:         '28px',
        right:        'auto',
        zIndex:       '9999',
        background:   'linear-gradient(135deg,#7C3AED,#9333EA)',
        color:        '#ffffff',
        border:       'none',
        borderRadius: '12px',
        padding:      '10px 20px',
        fontSize:     '14px',
        fontFamily:   "'Cairo','Tajawal',sans-serif",
        fontWeight:   '700',
        cursor:       'pointer',
        boxShadow:    '0 4px 18px rgba(124,58,237,0.38)',
        transition:   'all 0.15s',
        direction:    'rtl',
        display:      'flex',
        alignItems:   'center',
        gap:          '6px',
      });

      btn.onmouseenter = () => {
        btn.style.transform = 'translateY(-2px)';
        btn.style.boxShadow = '0 7px 24px rgba(124,58,237,0.48)';
      };
      btn.onmouseleave = () => {
        btn.style.transform = 'none';
        btn.style.boxShadow = '0 4px 18px rgba(124,58,237,0.38)';
      };
      btn.onclick = () => window.history.back();

      document.body.appendChild(btn);
    };

    // Run on mount
    showBtn();

    // Intercept SPA navigation (history.pushState / replaceState)
    const wrap = (method: string) => {
      const orig = (history as any)[method].bind(history);
      (history as any)[method] = (...args: any[]) => {
        orig(...args);
        setTimeout(showBtn, 80); // small delay lets the URL update settle
      };
      return orig;
    };
    const origPush    = wrap('pushState');
    const origReplace = wrap('replaceState');
    window.addEventListener('popstate', showBtn);

    return () => {
      // Restore originals on unmount
      (history as any).pushState    = origPush;
      (history as any).replaceState = origReplace;
      window.removeEventListener('popstate', showBtn);
      document.getElementById(BTN_ID)?.remove();
    };
  }, []);

  return <>{children}</>;
}
