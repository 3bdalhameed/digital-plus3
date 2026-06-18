// @ts-nocheck
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { NavLink, useHistory, useLocation } from 'react-router-dom';
import { useConfig } from 'payload/components/utilities';

type Customer = {
  id: string;
  email?: string;
  name?: string;
  phone?: string;
  twoFactorEnabled?: boolean;
  orders?: any[];
  createdAt?: string;
  updatedAt?: string;
};

const initials = (s?: string): string => {
  if (!s) return '?';
  const trimmed = s.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return trimmed.slice(0, 2).toUpperCase();
};

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('ar-u-nu-latn', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

const avatarBg = (seed?: string): string => {
  if (!seed) return 'linear-gradient(135deg,#7C3AED,#6366F1)';
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0xffffffff;
  const palettes = [
    'linear-gradient(135deg,#7C3AED,#6366F1)',
    'linear-gradient(135deg,#EC4899,#F43F5E)',
    'linear-gradient(135deg,#10B981,#14B8A6)',
    'linear-gradient(135deg,#F59E0B,#EF4444)',
    'linear-gradient(135deg,#3B82F6,#06B6D4)',
    'linear-gradient(135deg,#8B5CF6,#EC4899)',
  ];
  return palettes[Math.abs(h) % palettes.length];
};

const CustomersList: React.FC<{
  collection: any;
  data: {
    docs: Customer[];
    totalDocs: number;
    totalPages: number;
    page: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
  hasCreatePermission?: boolean;
  newDocumentURL: string;
}> = ({ data, hasCreatePermission, newDocumentURL }) => {
  const { serverURL } = useConfig();
  const history = useHistory();
  const location = useLocation();

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const currentSearch = params.get('search') || '';
  const [searchInput, setSearchInput] = useState(currentSearch);

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput === currentSearch) return;
      const next = new URLSearchParams(location.search);
      if (searchInput) next.set('search', searchInput);
      else next.delete('search');
      next.set('page', '1');
      history.push(`${location.pathname}?${next.toString()}`);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const goPage = useCallback(
    (page: number) => {
      const next = new URLSearchParams(location.search);
      next.set('page', String(page));
      history.push(`${location.pathname}?${next.toString()}`);
    },
    [history, location.pathname, location.search]
  );

  const [stats, setStats] = useState({ total: 0, with2fa: 0, withOrders: 0 });
  useEffect(() => {
    const url = `${serverURL}/api/customers`;
    Promise.all([
      fetch(`${url}?limit=0&depth=0`, { credentials: 'include' }).then((r) => r.json()),
      fetch(`${url}?limit=0&depth=0&where[twoFactorEnabled][equals]=true`, { credentials: 'include' }).then((r) => r.json()),
      fetch(`${url}?limit=0&depth=0&where[orders][exists]=true`, { credentials: 'include' }).then((r) => r.json()),
    ])
      .then(([all, twofa, withOrders]) => {
        setStats({
          total: all.totalDocs ?? 0,
          with2fa: twofa.totalDocs ?? 0,
          withOrders: withOrders.totalDocs ?? 0,
        });
      })
      .catch((err) => console.error('[CustomersList] stats fetch failed', err));
  }, [serverURL]);

  const docs = data?.docs || [];
  const totalPages = data?.totalPages || 1;
  const currentPage = data?.page || 1;

  return (
    <div className="pl" dir="rtl">
      <header className="pl__header">
        <div className="pl__title-wrap">
          <h1 className="pl__title">العملاء</h1>
          <span className="pl__title-count">{stats.total.toLocaleString('en-US')}</span>
        </div>
        {hasCreatePermission && (
          <NavLink to={newDocumentURL} className="pl__create-btn">
            <span className="pl__plus">+</span>
            <span>إضافة عميل</span>
          </NavLink>
        )}
      </header>

      <div className="pl__stats pl__stats--3">
        {[
          { id: 'total',      label: 'كل العملاء',        count: stats.total,      emoji: '👥', color: '#7C3AED' },
          { id: 'withOrders', label: 'عملاء لديهم طلبات', count: stats.withOrders, emoji: '🛒', color: '#059669' },
          { id: 'with2fa',    label: 'مفعل 2FA',           count: stats.with2fa,    emoji: '🔐', color: '#2563EB' },
        ].map((s) => (
          <div key={s.id} className="pl__stat" style={{ '--stat-accent': s.color } as React.CSSProperties}>
            <span className="pl__stat-emoji">{s.emoji}</span>
            <span className="pl__stat-text">
              <span className="pl__stat-count">{s.count.toLocaleString('en-US')}</span>
              <span className="pl__stat-label">{s.label}</span>
            </span>
          </div>
        ))}
      </div>

      <div className="pl__controls">
        <div className="pl__search">
          <svg className="pl__search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            placeholder="ابحث بالاسم أو البريد..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput && (
            <button type="button" className="pl__search-clear" onClick={() => setSearchInput('')} aria-label="مسح البحث">×</button>
          )}
        </div>
      </div>

      {docs.length === 0 ? (
        <div className="pl__empty">
          <div className="pl__empty-emoji">📭</div>
          <div className="pl__empty-title">لا يوجد عملاء</div>
          <div className="pl__empty-sub">{currentSearch ? `لم نجد نتائج لـ "${currentSearch}"` : 'العملاء سيظهرون هنا'}</div>
        </div>
      ) : (
        <div className="pl__grid pl__grid--compact">
          {docs.map((c) => {
            const ordersCount = Array.isArray(c.orders) ? c.orders.length : 0;
            const editUrl = `/admin/collections/customers/${c.id}`;

            return (
              <NavLink key={c.id} to={editUrl} className="pl-card pl-card--compact">
                <div className="pl-card__avatar" style={{ background: avatarBg(c.email) }} aria-hidden>
                  {initials(c.name || c.email)}
                </div>

                <div className="pl-card__body pl-card__body--row">
                  <div className="pl-card__heading">
                    <h3 className="pl-card__name-ar">{c.name || <span className="pl-card__name-empty">بدون اسم</span>}</h3>
                  </div>
                  {c.email && <p className="pl-card__name-en" dir="ltr">{c.email}</p>}

                  <div className="pl-card__meta-row">
                    {c.phone && (
                      <span className="pl-card__chip" dir="ltr" title="رقم الهاتف">
                        <span aria-hidden>📞</span> {c.phone}
                      </span>
                    )}
                    {ordersCount > 0 && (
                      <span className="pl-card__chip pl-card__chip--position" title="عدد الطلبات">
                        <span aria-hidden>🛒</span> {ordersCount.toLocaleString('en-US')} طلب
                      </span>
                    )}
                    {c.twoFactorEnabled && (
                      <span className="pl-card__chip" title="مفعل 2FA">
                        <span aria-hidden>🔐</span> 2FA
                      </span>
                    )}
                  </div>
                </div>

                <div className="pl-card__side">
                  <span className="pl-card__updated">انضم: {fmtDate(c.createdAt)}</span>
                </div>
              </NavLink>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="pl__pagination">
          <button type="button" className="pl__page-btn" onClick={() => goPage(Math.max(1, currentPage - 1))} disabled={!data?.hasPrevPage}>›</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((n) => n === 1 || n === totalPages || Math.abs(n - currentPage) <= 1)
            .reduce<(number | 'gap')[]>((acc, n, i, arr) => {
              if (i > 0 && (n as number) - (arr[i - 1] as number) > 1) acc.push('gap');
              acc.push(n);
              return acc;
            }, [])
            .map((n, idx) =>
              n === 'gap' ? <span key={`gap-${idx}`} className="pl__page-gap">…</span>
              : <button key={n} type="button" className={`pl__page-btn ${n === currentPage ? 'pl__page-btn--active' : ''}`} onClick={() => goPage(n as number)}>{(n as number).toLocaleString('en-US')}</button>
            )}
          <button type="button" className="pl__page-btn" onClick={() => goPage(Math.min(totalPages, currentPage + 1))} disabled={!data?.hasNextPage}>‹</button>
          <span className="pl__page-info">
            {data?.totalDocs?.toLocaleString('en-US') || 0} عميل · صفحة {currentPage.toLocaleString('en-US')} من {totalPages.toLocaleString('en-US')}
          </span>
        </nav>
      )}
    </div>
  );
};

export default CustomersList;
