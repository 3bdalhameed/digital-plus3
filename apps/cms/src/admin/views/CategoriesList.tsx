// @ts-nocheck
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { NavLink, useHistory, useLocation } from 'react-router-dom';
import { useConfig } from 'payload/components/utilities';

/* ─────────────────────────────────────────────────────────────
   Custom Categories list view — replaces Payload's default
   table at /admin/collections/categories with a card-grid +
   stats strip + search, matching the ProductsList pattern.
   Each card shows: icon thumbnail, Arabic + English names, slug,
   position, brand-logo count, active state, last-updated date.
   ──────────────────────────────────────────────────────────── */

type MediaRef = string | { id: string; url?: string; alt?: string; sizes?: any };

type Category = {
  id: string;
  nameAr?: string;
  nameEn?: string;
  slug?: string;
  description?: string;
  image?: MediaRef;
  icon?: MediaRef;
  brandLogos?: Array<{ logo?: MediaRef }>;
  position?: number;
  isActive?: boolean;
  updatedAt?: string;
};

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

const mediaUrl = (m?: MediaRef, base = ''): string => {
  if (!m) return '';
  if (typeof m === 'string') return '';
  if (m.url) return m.url.startsWith('http') ? m.url : `${base}${m.url}`;
  return '';
};

/* ─────────────────────────────────────────────────────────── */

const CategoriesList: React.FC<{
  collection: any;
  data: {
    docs: Category[];
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
  const currentActiveFilter = params.get('where[isActive][equals]') || 'all';

  const [searchInput, setSearchInput] = useState(currentSearch);

  /* Debounce search → URL */
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

  /* Stats independent of paginated data */
  const [stats, setStats] = useState<{ total: number; active: number; inactive: number }>({
    total: 0, active: 0, inactive: 0,
  });
  useEffect(() => {
    const url = `${serverURL}/api/categories`;
    Promise.all([
      fetch(`${url}?limit=0&depth=0`, { credentials: 'include' }).then((r) => r.json()),
      fetch(`${url}?limit=0&depth=0&where[isActive][equals]=true`,  { credentials: 'include' }).then((r) => r.json()),
      fetch(`${url}?limit=0&depth=0&where[isActive][equals]=false`, { credentials: 'include' }).then((r) => r.json()),
    ])
      .then(([all, on, off]) => {
        setStats({
          total:    all.totalDocs ?? 0,
          active:   on.totalDocs ?? 0,
          inactive: off.totalDocs ?? 0,
        });
      })
      .catch((err) => console.error('[CategoriesList] stats fetch failed', err));
  }, [serverURL]);

  const docs = data?.docs || [];
  const totalPages = data?.totalPages || 1;
  const currentPage = data?.page || 1;

  return (
    <div className="pl" dir="rtl">
      {/* Header */}
      <header className="pl__header">
        <div className="pl__title-wrap">
          <h1 className="pl__title">التصنيفات</h1>
          <span className="pl__title-count">{stats.total.toLocaleString('ar-SA')}</span>
        </div>
        {hasCreatePermission && (
          <NavLink to={newDocumentURL} className="pl__create-btn">
            <span className="pl__plus">+</span>
            <span>إنشاء تصنيف جديد</span>
          </NavLink>
        )}
      </header>

      {/* Stats strip — 3 buckets for categories */}
      <div className="pl__stats pl__stats--3">
        {[
          { id: 'all',   label: 'الكل',     count: stats.total,    emoji: '📂', color: '#7C3AED', param: null },
          { id: 'true',  label: 'نشط',      count: stats.active,   emoji: '✅', color: '#059669', param: 'true' },
          { id: 'false', label: 'غير نشط', count: stats.inactive, emoji: '⏸️', color: '#64748B', param: 'false' },
        ].map((s) => {
          const active = currentActiveFilter === s.id || (s.id === 'all' && currentActiveFilter === 'all');
          return (
            <button
              key={s.id}
              type="button"
              className={`pl__stat ${active ? 'pl__stat--active' : ''}`}
              onClick={() => updateParam('where[isActive][equals]', s.param)}
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

      {/* Search */}
      <div className="pl__controls">
        <div className="pl__search">
          <svg className="pl__search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            placeholder="ابحث في التصنيفات..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput && (
            <button
              type="button"
              className="pl__search-clear"
              onClick={() => setSearchInput('')}
              aria-label="مسح البحث"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Grid / empty */}
      {docs.length === 0 ? (
        <div className="pl__empty">
          <div className="pl__empty-emoji">📭</div>
          <div className="pl__empty-title">لا توجد تصنيفات</div>
          <div className="pl__empty-sub">
            {currentSearch ? `لم نجد نتائج لـ "${currentSearch}"` : 'ابدأ بإنشاء أول تصنيف'}
          </div>
          {hasCreatePermission && !currentSearch && (
            <NavLink to={newDocumentURL} className="pl__create-btn">
              <span className="pl__plus">+</span>
              <span>إنشاء تصنيف جديد</span>
            </NavLink>
          )}
        </div>
      ) : (
        <div className="pl__grid pl__grid--compact">
          {docs.map((c) => {
            const iconUrl = mediaUrl(c.icon, serverURL) || mediaUrl(c.image, serverURL);
            const brandsCount = c.brandLogos?.length ?? 0;
            const isActive = c.isActive !== false;
            const editUrl = `/admin/collections/categories/${c.id}`;

            return (
              <NavLink key={c.id} to={editUrl} className="pl-card pl-card--compact">
                {/* Icon column */}
                <div className="pl-card__icon">
                  {iconUrl ? (
                    <img src={iconUrl} alt={c.nameAr || c.nameEn || ''} loading="lazy" />
                  ) : (
                    <span className="pl-card__icon-placeholder">📁</span>
                  )}
                </div>

                {/* Main body */}
                <div className="pl-card__body pl-card__body--row">
                  <div className="pl-card__heading">
                    <h3 className="pl-card__name-ar">
                      {c.nameAr || <span className="pl-card__name-empty">—</span>}
                    </h3>
                    {c.nameEn && <p className="pl-card__name-en" dir="ltr">{c.nameEn}</p>}
                  </div>

                  {c.description && <p className="pl-card__description">{c.description}</p>}

                  <div className="pl-card__meta-row">
                    {c.slug && (
                      <span className="pl-card__chip" dir="ltr" title="slug">
                        <span aria-hidden>/</span>{c.slug}
                      </span>
                    )}
                    {brandsCount > 0 && (
                      <span className="pl-card__chip" title="عدد شعارات العلامات التجارية">
                        <span aria-hidden>🏷️</span> {brandsCount.toLocaleString('ar-SA')} شعار
                      </span>
                    )}
                    {typeof c.position === 'number' && (
                      <span className="pl-card__chip pl-card__chip--position" title="الترتيب">
                        <span aria-hidden>≡</span>{' '}
                        <span dir="ltr">{c.position.toLocaleString('en-US')}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Active badge — right column */}
                <div className="pl-card__side">
                  <span className={`pl-card__status ${isActive ? 'pl-card__status--on' : 'pl-card__status--off'}`}>
                    <span className="pl-card__status-dot" />
                    {isActive ? 'نشط' : 'غير نشط'}
                  </span>
                  <span className="pl-card__updated">{fmtDate(c.updatedAt)}</span>
                </div>
              </NavLink>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="pl__pagination" aria-label="ترقيم الصفحات">
          <button
            type="button"
            className="pl__page-btn"
            onClick={() => goPage(Math.max(1, currentPage - 1))}
            disabled={!data?.hasPrevPage}
          >
            <span aria-hidden>›</span>
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((n) => n === 1 || n === totalPages || Math.abs(n - currentPage) <= 1)
            .reduce<(number | 'gap')[]>((acc, n, i, arr) => {
              if (i > 0 && (n as number) - (arr[i - 1] as number) > 1) acc.push('gap');
              acc.push(n);
              return acc;
            }, [])
            .map((n, idx) =>
              n === 'gap' ? (
                <span key={`gap-${idx}`} className="pl__page-gap">…</span>
              ) : (
                <button
                  key={n}
                  type="button"
                  className={`pl__page-btn ${n === currentPage ? 'pl__page-btn--active' : ''}`}
                  onClick={() => goPage(n as number)}
                >
                  {(n as number).toLocaleString('ar-SA')}
                </button>
              )
            )}

          <button
            type="button"
            className="pl__page-btn"
            onClick={() => goPage(Math.min(totalPages, currentPage + 1))}
            disabled={!data?.hasNextPage}
          >
            <span aria-hidden>‹</span>
          </button>

          <span className="pl__page-info">
            {data?.totalDocs?.toLocaleString('ar-SA') || 0} تصنيف · صفحة{' '}
            {currentPage.toLocaleString('ar-SA')} من {totalPages.toLocaleString('ar-SA')}
          </span>
        </nav>
      )}
    </div>
  );
};

export default CategoriesList;
