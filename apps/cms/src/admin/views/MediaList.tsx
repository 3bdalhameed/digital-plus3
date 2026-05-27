// @ts-nocheck
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { NavLink, useHistory, useLocation } from 'react-router-dom';
import { useConfig } from 'payload/components/utilities';

type Media = {
  id: string;
  filename?: string;
  alt?: string;
  url?: string;
  filesize?: number;
  mimeType?: string;
  width?: number;
  height?: number;
  sizes?: Record<string, { url?: string }>;
  updatedAt?: string;
  createdAt?: string;
};

const fmtSize = (bytes?: number): string => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
};

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

const isImage = (m?: Media) => (m?.mimeType || '').startsWith('image/');

const MediaList: React.FC<{
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
  const currentMimeFilter = params.get('where[mimeType][like]') || 'all';
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

  const [stats, setStats] = useState({ total: 0, images: 0, docs: 0 });
  useEffect(() => {
    const url = `${serverURL}/api/media`;
    Promise.all([
      fetch(`${url}?limit=0&depth=0`, { credentials: 'include' }).then((r) => r.json()),
      fetch(`${url}?limit=0&depth=0&where[mimeType][like]=image`, { credentials: 'include' }).then((r) => r.json()),
      fetch(`${url}?limit=0&depth=0&where[mimeType][like]=application/pdf`, { credentials: 'include' }).then((r) => r.json()),
    ])
      .then(([all, img, d]) => {
        setStats({ total: all.totalDocs ?? 0, images: img.totalDocs ?? 0, docs: d.totalDocs ?? 0 });
      })
      .catch((err) => console.error('[MediaList] stats fetch failed', err));
  }, [serverURL]);

  const docs = data?.docs || [];
  const totalPages = data?.totalPages || 1;
  const currentPage = data?.page || 1;

  return (
    <div className="pl" dir="rtl">
      <header className="pl__header">
        <div className="pl__title-wrap">
          <h1 className="pl__title">الوسائط</h1>
          <span className="pl__title-count">{stats.total.toLocaleString('ar-SA')}</span>
        </div>
        {hasCreatePermission && (
          <NavLink to={newDocumentURL} className="pl__create-btn">
            <span className="pl__plus">+</span>
            <span>رفع ملف</span>
          </NavLink>
        )}
      </header>

      <div className="pl__stats pl__stats--3">
        {[
          { id: 'all',    label: 'الكل',    count: stats.total,  emoji: '🗂️', color: '#7C3AED', param: null },
          { id: 'image',  label: 'صور',     count: stats.images, emoji: '🖼️', color: '#059669', param: 'image' },
          { id: 'pdf',    label: 'مستندات', count: stats.docs,   emoji: '📄', color: '#D97706', param: 'application/pdf' },
        ].map((s) => {
          const active = (s.id === 'all' && currentMimeFilter === 'all') || (s.param && currentMimeFilter === s.param);
          return (
            <button
              key={s.id}
              type="button"
              className={`pl__stat ${active ? 'pl__stat--active' : ''}`}
              onClick={() => updateParam('where[mimeType][like]', s.param)}
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
          <input type="search" placeholder="ابحث باسم الملف..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
          {searchInput && <button type="button" className="pl__search-clear" onClick={() => setSearchInput('')} aria-label="مسح البحث">×</button>}
        </div>
      </div>

      {docs.length === 0 ? (
        <div className="pl__empty">
          <div className="pl__empty-emoji">📭</div>
          <div className="pl__empty-title">لا توجد ملفات</div>
          <div className="pl__empty-sub">ابدأ برفع أول ملف وسائط</div>
        </div>
      ) : (
        <div className="pl-media-grid">
          {docs.map((m: Media) => {
            const thumbUrl = m.sizes?.thumbnail?.url || m.url;
            const fullUrl = thumbUrl ? (thumbUrl.startsWith('http') ? thumbUrl : `${serverURL}${thumbUrl}`) : '';
            const editUrl = `/admin/collections/media/${m.id}`;
            const dims = m.width && m.height ? `${m.width}×${m.height}` : '';

            return (
              <NavLink key={m.id} to={editUrl} className="pl-media-card">
                <div className="pl-media-card__thumb">
                  {isImage(m) && fullUrl ? (
                    <img src={fullUrl} alt={m.alt || m.filename || ''} loading="lazy" />
                  ) : (
                    <span className="pl-media-card__placeholder">
                      {(m.mimeType || '').includes('pdf') ? '📄' : '📁'}
                    </span>
                  )}
                </div>
                <div className="pl-media-card__body">
                  <p className="pl-media-card__name" dir="ltr" title={m.filename}>{m.filename}</p>
                  <div className="pl-media-card__meta">
                    <span>{fmtSize(m.filesize)}</span>
                    {dims && <span dir="ltr">{dims}</span>}
                  </div>
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
            {data?.totalDocs?.toLocaleString('ar-SA') || 0} ملف · صفحة {currentPage.toLocaleString('ar-SA')} من {totalPages.toLocaleString('ar-SA')}
          </span>
        </nav>
      )}
    </div>
  );
};

export default MediaList;
