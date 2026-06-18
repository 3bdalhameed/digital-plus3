// @ts-nocheck
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { NavLink, useHistory, useLocation } from 'react-router-dom';
import { useConfig } from 'payload/components/utilities';

/* ─────────────────────────────────────────────────────────────
   Custom Posts (blog) list view — header + stats strip +
   search + card grid + pagination. Matches the pattern used by
   CategoriesList / SubcategoriesList so styles in custom.css
   (.pl, .pl-card, .pl__stat …) apply without changes.
   ──────────────────────────────────────────────────────────── */

type Post = {
  id: string;
  title?: string;
  slug?: string;
  excerpt?: string;
  featuredImageUrl?: string;
  publishedAt?: string;
  author?: string;
  status?: 'published' | 'draft';
  tags?: Array<{ tag?: string }>;
  updatedAt?: string;
};

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('ar-u-nu-latn', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

const PostsList: React.FC<{
  data: {
    docs: Post[];
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
  const currentStatus = params.get('where[status][equals]') || 'all';

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

  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0 });
  useEffect(() => {
    const url = `${serverURL}/api/posts`;
    Promise.all([
      fetch(`${url}?limit=0&depth=0`, { credentials: 'include' }).then((r) => r.json()),
      fetch(`${url}?limit=0&depth=0&where[status][equals]=published`, { credentials: 'include' }).then((r) => r.json()),
      fetch(`${url}?limit=0&depth=0&where[status][equals]=draft`,     { credentials: 'include' }).then((r) => r.json()),
    ])
      .then(([all, pub, drf]) =>
        setStats({
          total: all.totalDocs ?? 0,
          published: pub.totalDocs ?? 0,
          draft: drf.totalDocs ?? 0,
        })
      )
      .catch((err) => console.error('[PostsList] stats fetch failed', err));
  }, [serverURL]);

  const docs = data?.docs || [];
  const totalPages = data?.totalPages || 1;
  const currentPage = data?.page || 1;

  return (
    <div className="pl" dir="rtl">
      <header className="pl__header">
        <div className="pl__title-wrap">
          <h1 className="pl__title">المدونة</h1>
          <span className="pl__title-count">{stats.total.toLocaleString('en-US')}</span>
        </div>
        {hasCreatePermission && (
          <NavLink to={newDocumentURL} className="pl__create-btn">
            <span className="pl__plus">+</span>
            <span>كتابة مقالة جديدة</span>
          </NavLink>
        )}
      </header>

      <div className="pl__stats pl__stats--3">
        {[
          { id: 'all',       label: 'الكل',   count: stats.total,     emoji: '📝', color: '#7C3AED', param: null },
          { id: 'published', label: 'منشور', count: stats.published, emoji: '✅', color: '#059669', param: 'published' },
          { id: 'draft',     label: 'مسودة', count: stats.draft,     emoji: '📋', color: '#64748B', param: 'draft' },
        ].map((s) => {
          const active = currentStatus === s.id || (s.id === 'all' && currentStatus === 'all');
          return (
            <button
              key={s.id}
              type="button"
              className={`pl__stat ${active ? 'pl__stat--active' : ''}`}
              onClick={() => updateParam('where[status][equals]', s.param)}
              style={{ '--stat-accent': s.color } as React.CSSProperties}
            >
              <span className="pl__stat-emoji">{s.emoji}</span>
              <span className="pl__stat-text">
                <span className="pl__stat-count">{s.count.toLocaleString('en-US')}</span>
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
          <input
            type="search"
            placeholder="ابحث في المقالات..."
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
          <div className="pl__empty-title">لا توجد مقالات</div>
          <div className="pl__empty-sub">
            {currentSearch ? `لم نجد نتائج لـ "${currentSearch}"` : 'ابدأ بكتابة أول مقالة'}
          </div>
          {hasCreatePermission && !currentSearch && (
            <NavLink to={newDocumentURL} className="pl__create-btn">
              <span className="pl__plus">+</span>
              <span>كتابة مقالة جديدة</span>
            </NavLink>
          )}
        </div>
      ) : (
        <div className="pl__grid pl__grid--compact">
          {docs.map((p) => {
            const imgUrl = p.featuredImageUrl || '';
            const isPublished = p.status !== 'draft';
            const editUrl = `/admin/collections/posts/${p.id}`;
            const tagCount = p.tags?.length ?? 0;

            return (
              <NavLink key={p.id} to={editUrl} className="pl-card pl-card--compact">
                <div className="pl-card__icon">
                  {imgUrl ? (
                    <img src={imgUrl} alt={p.title || ''} loading="lazy" />
                  ) : (
                    <span className="pl-card__icon-placeholder">📝</span>
                  )}
                </div>

                <div className="pl-card__body pl-card__body--row">
                  <div className="pl-card__heading">
                    <h3 className="pl-card__name-ar">
                      {p.title || <span className="pl-card__name-empty">—</span>}
                    </h3>
                  </div>

                  {p.excerpt && (
                    <p className="pl-card__description">
                      {p.excerpt.length > 140 ? `${p.excerpt.slice(0, 140)}…` : p.excerpt}
                    </p>
                  )}

                  <div className="pl-card__meta-row">
                    {p.slug && (
                      <span className="pl-card__chip" dir="ltr" title="slug">
                        <span aria-hidden>/</span>{p.slug}
                      </span>
                    )}
                    {p.author && (
                      <span className="pl-card__chip" title="الكاتب">
                        <span aria-hidden>✍️</span> {p.author}
                      </span>
                    )}
                    {tagCount > 0 && (
                      <span className="pl-card__chip" title="عدد الوسوم">
                        <span aria-hidden>🏷️</span> {tagCount.toLocaleString('en-US')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="pl-card__side">
                  <span className={`pl-card__status ${isPublished ? 'pl-card__status--on' : 'pl-card__status--off'}`}>
                    <span className="pl-card__status-dot" />
                    {isPublished ? 'منشور' : 'مسودة'}
                  </span>
                  <span className="pl-card__updated">{fmtDate(p.publishedAt || p.updatedAt)}</span>
                </div>
              </NavLink>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="pl__pagination" aria-label="ترقيم الصفحات">
          <button type="button" className="pl__page-btn" onClick={() => goPage(Math.max(1, currentPage - 1))} disabled={!data?.hasPrevPage}>
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
                  {(n as number).toLocaleString('en-US')}
                </button>
              )
            )}

          <button type="button" className="pl__page-btn" onClick={() => goPage(Math.min(totalPages, currentPage + 1))} disabled={!data?.hasNextPage}>
            <span aria-hidden>‹</span>
          </button>

          <span className="pl__page-info">
            {data?.totalDocs?.toLocaleString('en-US') || 0} مقالة · صفحة{' '}
            {currentPage.toLocaleString('en-US')} من {totalPages.toLocaleString('en-US')}
          </span>
        </nav>
      )}
    </div>
  );
};

export default PostsList;
