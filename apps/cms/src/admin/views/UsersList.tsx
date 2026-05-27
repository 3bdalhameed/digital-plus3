// @ts-nocheck
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { NavLink, useHistory, useLocation } from 'react-router-dom';
import { useConfig } from 'payload/components/utilities';

type User = {
  id: string;
  email?: string;
  name?: string;
  role?: 'super_admin' | 'admin' | 'support' | 'viewer' | 'catalog' | 'orders';
  createdAt?: string;
  updatedAt?: string;
};

const ROLE: Record<string, { label: string; emoji: string; bg: string; color: string }> = {
  super_admin: { label: 'مدير عام',     emoji: '🔑', bg: '#FEE2E2', color: '#991B1B' },
  admin:       { label: 'مدير',         emoji: '⚙️', bg: '#EDE9FE', color: '#5B21B6' },
  support:     { label: 'دعم فني',      emoji: '🎧', bg: '#DBEAFE', color: '#1E40AF' },
  catalog:     { label: 'مدير الكتالوج', emoji: '📦', bg: '#DCFCE7', color: '#166534' },
  orders:      { label: 'مدير الطلبات',  emoji: '🛒', bg: '#FEF3C7', color: '#854D0E' },
  viewer:      { label: 'مشاهد',        emoji: '👁️', bg: '#F1F5F9', color: '#475569' },
};

const initials = (s?: string): string => {
  if (!s) return '?';
  const parts = s.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return s.slice(0, 2).toUpperCase();
};

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
  ];
  return palettes[Math.abs(h) % palettes.length];
};

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

const UsersList: React.FC<{
  collection: any;
  data: any;
  hasCreatePermission?: boolean;
  newDocumentURL: string;
}> = ({ data, hasCreatePermission, newDocumentURL }) => {
  const { serverURL } = useConfig();
  const history = useHistory();
  const location = useLocation();

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const currentSearch = params.get('search') || '';
  const currentRoleFilter = params.get('where[role][equals]') || 'all';
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

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(location.search);
      if (value === null || value === '') next.delete(key);
      else next.set(key, value);
      next.set('page', '1');
      history.push(`${location.pathname}?${next.toString()}`);
    },
    [history, location.pathname, location.search]
  );

  const goPage = useCallback(
    (page: number) => {
      const next = new URLSearchParams(location.search);
      next.set('page', String(page));
      history.push(`${location.pathname}?${next.toString()}`);
    },
    [history, location.pathname, location.search]
  );

  const [stats, setStats] = useState({ total: 0, admins: 0, support: 0, others: 0 });
  useEffect(() => {
    const url = `${serverURL}/api/users`;
    Promise.all([
      fetch(`${url}?limit=0&depth=0`, { credentials: 'include' }).then((r) => r.json()),
      fetch(`${url}?limit=0&depth=0&where[role][in][]=super_admin&where[role][in][]=admin`, { credentials: 'include' }).then((r) => r.json()),
      fetch(`${url}?limit=0&depth=0&where[role][equals]=support`, { credentials: 'include' }).then((r) => r.json()),
      fetch(`${url}?limit=0&depth=0&where[role][in][]=catalog&where[role][in][]=orders&where[role][in][]=viewer`, { credentials: 'include' }).then((r) => r.json()),
    ])
      .then(([all, adm, sup, oth]) => {
        setStats({ total: all.totalDocs ?? 0, admins: adm.totalDocs ?? 0, support: sup.totalDocs ?? 0, others: oth.totalDocs ?? 0 });
      })
      .catch((err) => console.error('[UsersList] stats fetch failed', err));
  }, [serverURL]);

  const docs = data?.docs || [];
  const totalPages = data?.totalPages || 1;
  const currentPage = data?.page || 1;

  return (
    <div className="pl" dir="rtl">
      <header className="pl__header">
        <div className="pl__title-wrap">
          <h1 className="pl__title">المستخدمون</h1>
          <span className="pl__title-count">{stats.total.toLocaleString('ar-SA')}</span>
        </div>
        {hasCreatePermission && (
          <NavLink to={newDocumentURL} className="pl__create-btn">
            <span className="pl__plus">+</span>
            <span>إضافة مستخدم</span>
          </NavLink>
        )}
      </header>

      <div className="pl__stats">
        {[
          { id: 'all',     label: 'الكل',         count: stats.total,   emoji: '👥', color: '#7C3AED', param: null },
          { id: 'admins',  label: 'مديرون',       count: stats.admins,  emoji: '🔑', color: '#991B1B', param: 'admin' },
          { id: 'support', label: 'دعم فني',     count: stats.support, emoji: '🎧', color: '#1E40AF', param: 'support' },
          { id: 'others',  label: 'أدوار أخرى', count: stats.others,  emoji: '👤', color: '#475569', param: null },
        ].map((s) => {
          const active = (s.id === 'all' && currentRoleFilter === 'all') || (s.param && currentRoleFilter === s.param);
          return (
            <button
              key={s.id}
              type="button"
              className={`pl__stat ${active ? 'pl__stat--active' : ''}`}
              onClick={() => updateParam('where[role][equals]', s.param)}
              style={{ '--stat-accent': s.color } as React.CSSProperties}
            >
              <span className="pl__stat-emoji">{s.emoji}</span>
              <span className="pl__stat-text">
                <span className="pl__stat-count">{s.count.toLocaleString('ar-SA')}</span>
                <span className="pl__stat-label">{s.label}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="pl__controls">
        <div className="pl__search">
          <svg className="pl__search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input type="search" placeholder="ابحث بالاسم أو البريد..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
          {searchInput && <button type="button" className="pl__search-clear" onClick={() => setSearchInput('')} aria-label="مسح البحث">×</button>}
        </div>
      </div>

      {docs.length === 0 ? (
        <div className="pl__empty">
          <div className="pl__empty-emoji">📭</div>
          <div className="pl__empty-title">لا يوجد مستخدمون</div>
        </div>
      ) : (
        <div className="pl__grid pl__grid--compact">
          {docs.map((u) => {
            const role = ROLE[u.role || 'viewer'] || ROLE.viewer;
            const editUrl = `/admin/collections/users/${u.id}`;

            return (
              <NavLink key={u.id} to={editUrl} className="pl-card pl-card--compact">
                <div className="pl-card__avatar" style={{ background: avatarBg(u.email) }} aria-hidden>
                  {initials(u.name || u.email)}
                </div>

                <div className="pl-card__body pl-card__body--row">
                  <div className="pl-card__heading">
                    <h3 className="pl-card__name-ar">{u.name || <span className="pl-card__name-empty">بدون اسم</span>}</h3>
                  </div>
                  {u.email && <p className="pl-card__name-en" dir="ltr">{u.email}</p>}

                  <div className="pl-card__meta-row">
                    <span className="pl-card__status" style={{ background: role.bg, color: role.color }}>
                      <span aria-hidden>{role.emoji}</span> {role.label}
                    </span>
                  </div>
                </div>

                <div className="pl-card__side">
                  <span className="pl-card__updated">انضم: {fmtDate(u.createdAt)}</span>
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
              : <button key={n} type="button" className={`pl__page-btn ${n === currentPage ? 'pl__page-btn--active' : ''}`} onClick={() => goPage(n as number)}>{(n as number).toLocaleString('ar-SA')}</button>
            )}
          <button type="button" className="pl__page-btn" onClick={() => goPage(Math.min(totalPages, currentPage + 1))} disabled={!data?.hasNextPage}>‹</button>
          <span className="pl__page-info">
            {data?.totalDocs?.toLocaleString('ar-SA') || 0} مستخدم · صفحة {currentPage.toLocaleString('ar-SA')} من {totalPages.toLocaleString('ar-SA')}
          </span>
        </nav>
      )}
    </div>
  );
};

export default UsersList;
