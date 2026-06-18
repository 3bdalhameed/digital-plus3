// @ts-nocheck
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { NavLink, useHistory, useLocation } from 'react-router-dom';
import { useConfig } from 'payload/components/utilities';

/* ─────────────────────────────────────────────────────────────
   Custom Products list view — replaces Payload's default table.
   Renders a card-grid layout with thumbnail + bilingual names +
   status / type pills + price, plus a top stats strip and search.
   Pagination + sort + filter URL state stays compatible with the
   default Payload routing.
   ──────────────────────────────────────────────────────────── */

type Product = {
  id: string;
  nameAr?: string;
  nameEn?: string;
  slug?: string;
  type?: string;
  status?: 'draft' | 'published' | 'archived';
  badge?: 'none' | 'new' | 'offer' | 'hot' | 'limited';
  price?: number;
  comparePrice?: number;
  currency?: string;
  totalSales?: number;
  updatedAt?: string;
  images?: Array<{ image?: { id: string; url?: string; sizes?: any } | string }>;
};

const STATUS: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  draft:     { label: 'مسودة',  bg: '#F1F5F9', color: '#475569', dot: '#94A3B8' },
  published: { label: 'منشور',  bg: '#DCFCE7', color: '#166534', dot: '#10B981' },
  archived:  { label: 'مؤرشف', bg: '#FEF3C7', color: '#854D0E', dot: '#D97706' },
};

const TYPE_LABEL: Record<string, string> = {
  software_subscription: 'اشتراك',
  license_key:           'مفتاح',
  invitation:            'دعوة',
  gaming_card:           'بطاقة',
  ai_subscription:       'ذكاء اصطناعي',
};

const BADGE: Record<string, { label: string; emoji: string; bg: string; color: string }> = {
  new:     { label: 'جديد',   emoji: '🟢', bg: '#DCFCE7', color: '#166534' },
  offer:   { label: 'عرض',     emoji: '🔴', bg: '#FEE2E2', color: '#991B1B' },
  hot:     { label: 'رائج',    emoji: '🔥', bg: '#FFE4E6', color: '#9F1239' },
  limited: { label: 'محدود',  emoji: '⚠️', bg: '#FEF3C7', color: '#854D0E' },
};

const fmtPrice = (v?: number, c?: string) =>
  typeof v === 'number'
    ? `${v.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${c || ''}`.trim()
    : '—';

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('ar-u-nu-latn', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

/* ─────────────────────────────────────────────────────────── */

const ProductsList: React.FC<{
  collection: any;
  data: {
    docs: Product[];
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
  const currentStatusFilter = params.get('where[status][equals]') || 'all';

  const [searchInput, setSearchInput] = useState(currentSearch);

  /* Debounce search input → URL */
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

  /* ─── Stats by status — fetched independently of paginated data ── */
  const [stats, setStats] = useState<{ total: number; published: number; draft: number; archived: number }>({
    total: 0, published: 0, draft: 0, archived: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const url = `${serverURL}/api/products`;
        const [all, pub, drft, arch] = await Promise.all([
          fetch(`${url}?limit=0&depth=0`, { credentials: 'include' }).then((r) => r.json()),
          fetch(`${url}?limit=0&depth=0&where[status][equals]=published`, { credentials: 'include' }).then((r) => r.json()),
          fetch(`${url}?limit=0&depth=0&where[status][equals]=draft`,     { credentials: 'include' }).then((r) => r.json()),
          fetch(`${url}?limit=0&depth=0&where[status][equals]=archived`,  { credentials: 'include' }).then((r) => r.json()),
        ]);
        setStats({
          total:     all.totalDocs ?? 0,
          published: pub.totalDocs ?? 0,
          draft:     drft.totalDocs ?? 0,
          archived:  arch.totalDocs ?? 0,
        });
      } catch (err) {
        console.error('[ProductsList] failed to fetch stats', err);
      }
    };
    fetchStats();
  }, [serverURL]);

  const docs = data?.docs || [];
  const totalPages = data?.totalPages || 1;
  const currentPage = data?.page || 1;

  /* ─── Image URL hydration ────────────────────────────────────────
     Payload's admin list controller fetches docs with depth=0, so
     `images[0].image` arrives as the media ID rather than the full
     media object with a `url`. Re-fetch just the visible products
     with depth=1 and remember each one's thumbnail in a Map. */
  const [imageMap, setImageMap] = useState<Record<string, string>>({});
  useEffect(() => {
    const ids = docs.map((d) => d.id).filter(Boolean);
    if (!ids.length) {
      setImageMap({});
      return;
    }
    const idsQuery = ids.map((id) => `where[id][in][]=${encodeURIComponent(String(id))}`).join('&');
    const url = `${serverURL}/api/products?depth=1&limit=${ids.length}&${idsQuery}`;
    fetch(url, { credentials: 'include' })
      .then((r) => r.json())
      .then((json) => {
        const map: Record<string, string> = {};
        for (const p of json.docs || []) {
          const img = p.images?.[0]?.image;
          const url = (img && typeof img === 'object') ? (img.url || img.sizes?.thumbnail?.url || '') : '';
          if (url) map[String(p.id)] = url;
        }
        setImageMap(map);
      })
      .catch((err) => console.error('[ProductsList] thumbnail refetch failed', err));
    // Re-run whenever the visible doc IDs change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverURL, docs.map((d) => d.id).join(',')]);

  /* ─── Render ───────────────────────────────────────────── */
  return (
    <div className="pl" dir="rtl">
      {/* ── Header ─────────────────────────────────────── */}
      <header className="pl__header">
        <div className="pl__title-wrap">
          <h1 className="pl__title">المنتجات</h1>
          <span className="pl__title-count">{stats.total.toLocaleString('en-US')}</span>
        </div>
        {hasCreatePermission && (
          <NavLink to={newDocumentURL} className="pl__create-btn">
            <span className="pl__plus">+</span>
            <span>إنشاء منتج جديد</span>
          </NavLink>
        )}
      </header>

      {/* ── Stats strip ──────────────────────────────── */}
      <div className="pl__stats">
        {[
          { id: 'all',       label: 'الكل',     count: stats.total,     emoji: '📦', color: '#7C3AED' },
          { id: 'published', label: 'منشور',    count: stats.published, emoji: '✅', color: '#059669' },
          { id: 'draft',     label: 'مسودة',    count: stats.draft,     emoji: '✏️', color: '#64748B' },
          { id: 'archived',  label: 'مؤرشف',   count: stats.archived,  emoji: '📁', color: '#D97706' },
        ].map((s) => {
          const active = currentStatusFilter === s.id || (s.id === 'all' && currentStatusFilter === 'all');
          return (
            <button
              key={s.id}
              type="button"
              className={`pl__stat ${active ? 'pl__stat--active' : ''}`}
              onClick={() => updateParam('where[status][equals]', s.id === 'all' ? null : s.id)}
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

      {/* ── Search + actions row ─────────────────────── */}
      <div className="pl__controls">
        <div className="pl__search">
          <svg className="pl__search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            placeholder="ابحث في المنتجات..."
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

      {/* ── Cards grid ──────────────────────────────── */}
      {docs.length === 0 ? (
        <div className="pl__empty">
          <div className="pl__empty-emoji">📭</div>
          <div className="pl__empty-title">لا توجد منتجات</div>
          <div className="pl__empty-sub">
            {currentSearch ? `لم نجد نتائج لـ "${currentSearch}"` : 'ابدأ بإنشاء منتجك الأول'}
          </div>
          {hasCreatePermission && !currentSearch && (
            <NavLink to={newDocumentURL} className="pl__create-btn">
              <span className="pl__plus">+</span>
              <span>إنشاء منتج جديد</span>
            </NavLink>
          )}
        </div>
      ) : (
        <div className="pl__grid">
          {docs.map((p) => {
            const status = STATUS[p.status || 'draft'] || STATUS.draft;
            const badge = p.badge && p.badge !== 'none' ? BADGE[p.badge] : null;
            const firstImage = p.images?.[0]?.image;
            // Depth=1 refetch result first; fall back to whatever the list
            // controller happened to give us in case the refetch hasn't
            // landed yet (or returns nothing).
            const thumb =
              imageMap[String(p.id)] ||
              (firstImage && typeof firstImage === 'object'
                ? firstImage.url || (firstImage.sizes?.thumbnail?.url ?? '')
                : '');
            const editUrl = `/admin/collections/products/${p.id}`;

            return (
              <NavLink key={p.id} to={editUrl} className="pl-card">
                {/* Thumbnail with status dot */}
                <div className="pl-card__thumb">
                  {thumb ? (
                    <img src={thumb.startsWith('http') ? thumb : `${serverURL}${thumb}`} alt={p.nameAr || p.nameEn || ''} loading="lazy" />
                  ) : (
                    <span className="pl-card__thumb-placeholder">📦</span>
                  )}
                  {badge && (
                    <span className="pl-card__badge" style={{ background: badge.bg, color: badge.color }}>
                      <span aria-hidden>{badge.emoji}</span> {badge.label}
                    </span>
                  )}
                </div>

                {/* Body */}
                <div className="pl-card__body">
                  <h3 className="pl-card__name-ar" dir="rtl">
                    {p.nameAr || <span className="pl-card__name-empty">—</span>}
                  </h3>
                  {p.nameEn && (
                    <p className="pl-card__name-en" dir="ltr">
                      {p.nameEn}
                    </p>
                  )}

                  <div className="pl-card__meta">
                    {p.type && (
                      <span className="pl-card__type">{TYPE_LABEL[p.type] || p.type}</span>
                    )}
                    <span
                      className="pl-card__status"
                      style={{ background: status.bg, color: status.color }}
                    >
                      <span className="pl-card__status-dot" style={{ background: status.dot }} />
                      {status.label}
                    </span>
                  </div>

                  <div className="pl-card__footer">
                    <div className="pl-card__price-wrap" dir="ltr">
                      {p.comparePrice && p.comparePrice > (p.price ?? 0) && (
                        <span className="pl-card__compare-price">{fmtPrice(p.comparePrice, p.currency)}</span>
                      )}
                      <span className="pl-card__price">{fmtPrice(p.price, p.currency)}</span>
                    </div>
                    <div className="pl-card__sales">
                      <span aria-hidden>🛒</span>
                      <span dir="ltr">{(p.totalSales ?? 0).toLocaleString('en-US')}</span>
                    </div>
                  </div>

                  <div className="pl-card__updated">آخر تحديث: {fmtDate(p.updatedAt)}</div>
                </div>
              </NavLink>
            );
          })}
        </div>
      )}

      {/* ── Pagination ──────────────────────────────── */}
      {totalPages > 1 && (
        <nav className="pl__pagination" aria-label="ترقيم الصفحات">
          <button
            type="button"
            className="pl__page-btn"
            onClick={() => goPage(Math.max(1, currentPage - 1))}
            disabled={!data?.hasPrevPage}
            aria-label="الصفحة السابقة"
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
                  {(n as number).toLocaleString('en-US')}
                </button>
              )
            )}

          <button
            type="button"
            className="pl__page-btn"
            onClick={() => goPage(Math.min(totalPages, currentPage + 1))}
            disabled={!data?.hasNextPage}
            aria-label="الصفحة التالية"
          >
            <span aria-hidden>‹</span>
          </button>

          <span className="pl__page-info">
            {data?.totalDocs?.toLocaleString('en-US') || 0} منتج · صفحة {currentPage.toLocaleString('en-US')} من{' '}
            {totalPages.toLocaleString('en-US')}
          </span>
        </nav>
      )}
    </div>
  );
};

export default ProductsList;
