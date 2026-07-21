// @ts-nocheck
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { NavLink, useHistory, useLocation } from 'react-router-dom';
import { useConfig } from 'payload/components/utilities';

type CustomerRef = string | { id: string; email?: string; name?: string };

type Order = {
  id: string;
  orderNumber?: string;
  customer?: CustomerRef;
  status?: 'pending' | 'paid' | 'in_progress' | 'delivered' | 'disputed' | 'refunded' | 'cancelled';
  confirmedBy?: 'customer' | 'auto' | 'admin' | null;
  totalAmount?: number;
  currency?: string;
  items?: any[];
  createdAt?: string;
  updatedAt?: string;
};

/** Small chip explaining who took the paid → delivered decision on this
 *  order. Nothing renders while the field is null. */
const CONFIRMED_BY: Record<string, { label: string; bg: string; color: string; emoji: string }> = {
  customer: { label: 'أكّده العميل',      bg: '#DCFCE7', color: '#166534', emoji: '👤' },
  auto:     { label: 'تلقائي بعد 7 أيام', bg: '#FEF3C7', color: '#854D0E', emoji: '⏱️' },
  admin:    { label: 'أكّده المشرف',       bg: '#EDE9FE', color: '#5B21B6', emoji: '🛡️' },
};

const STATUS: Record<string, { label: string; bg: string; color: string; dot: string; emoji: string }> = {
  pending:     { label: 'قيد الانتظار', bg: '#FEF3C7', color: '#854D0E', dot: '#D97706', emoji: '🕐' },
  paid:        { label: 'مدفوع',        bg: '#DCFCE7', color: '#166534', dot: '#10B981', emoji: '✅' },
  in_progress: { label: 'قيد التنفيذ',  bg: '#E0E7FF', color: '#3730A3', dot: '#4F46E5', emoji: '⏳' },
  delivered:   { label: 'تم التسليم',  bg: '#EDE9FE', color: '#5B21B6', dot: '#7C3AED', emoji: '📦' },
  disputed:  { label: 'متنازع عليه', bg: '#FEE2E2', color: '#991B1B', dot: '#DC2626', emoji: '⚠️' },
  refunded:  { label: 'مسترد',        bg: '#F1F5F9', color: '#475569', dot: '#64748B', emoji: '🔄' },
  cancelled: { label: 'ملغي',         bg: '#FEE2E2', color: '#991B1B', dot: '#DC2626', emoji: '❌' },
};

// Order the status "folders" flow left→right through the lifecycle,
// with the exception states last. Drives both the count fetch and
// the filter chip row.
const ORDERED_STATUSES = [
  'pending', 'paid', 'in_progress', 'delivered', 'disputed', 'refunded', 'cancelled',
] as const;

const customerLabel = (c?: CustomerRef): string => {
  if (!c || typeof c === 'string') return '';
  return c.name || c.email || '';
};
const customerEmail = (c?: CustomerRef): string => {
  if (!c || typeof c === 'string') return '';
  return c.email || '';
};

const fmtMoney = (v?: number, c?: string) =>
  typeof v === 'number'
    ? `${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${c || ''}`.trim()
    : '—';

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('ar-u-nu-latn', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

const OrdersList: React.FC<{
  collection: any;
  data: {
    docs: Order[];
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

  // Per-status counts so every filter "folder" can show a live badge.
  // ORDERED_STATUSES drives both the count fetches and the chip row.
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [stats, setStats] = useState({ total: 0, issues: 0, revenue: 0 });
  useEffect(() => {
    const url = `${serverURL}/api/orders`;
    const statusList = ORDERED_STATUSES;
    Promise.all([
      fetch(`${url}?limit=0&depth=0`, { credentials: 'include' }).then((r) => r.json()),
      ...statusList.map((st) =>
        fetch(`${url}?limit=0&depth=0&where[status][equals]=${st}`, { credentials: 'include' })
          .then((r) => r.json())
          .then((j) => [st, j.totalDocs ?? 0] as [string, number]),
      ),
      fetch(`${url}?limit=500&depth=0&where[status][in][]=paid&where[status][in][]=delivered`, { credentials: 'include' }).then((r) => r.json()),
    ])
      .then((results) => {
        const all = results[0] as any;
        const rev = results[results.length - 1] as any;
        const pairs = results.slice(1, -1) as [string, number][];
        const byStatus: Record<string, number> = {};
        for (const [st, c] of pairs) byStatus[st] = c;
        const revenue = (rev.docs || []).reduce((s: number, o: any) => s + (o.totalAmount ?? 0), 0);
        setCounts(byStatus);
        setStats({
          total:   all.totalDocs ?? 0,
          issues:  (byStatus.disputed ?? 0) + (byStatus.refunded ?? 0) + (byStatus.cancelled ?? 0),
          revenue,
        });
      })
      .catch((err) => console.error('[OrdersList] stats fetch failed', err));
  }, [serverURL]);

  const docs = data?.docs || [];
  const totalPages = data?.totalPages || 1;
  const currentPage = data?.page || 1;

  return (
    <div className="pl" dir="rtl">
      <header className="pl__header">
        <div className="pl__title-wrap">
          <h1 className="pl__title">الطلبات</h1>
          <span className="pl__title-count">{stats.total.toLocaleString('en-US')}</span>
        </div>
        {hasCreatePermission && (
          <NavLink to={newDocumentURL} className="pl__create-btn">
            <span className="pl__plus">+</span>
            <span>إنشاء طلب جديد</span>
          </NavLink>
        )}
      </header>

      <div className="pl__stats">
        {[
          { id: 'all',         label: 'كل الطلبات',   count: stats.total,             emoji: '📋', color: '#7C3AED', param: null },
          { id: 'pending',     label: 'قيد الانتظار', count: counts.pending ?? 0,     emoji: '🕐', color: '#D97706', param: 'pending' },
          { id: 'in_progress', label: 'قيد التنفيذ',  count: counts.in_progress ?? 0, emoji: '⏳', color: '#4F46E5', param: 'in_progress' },
          { id: 'delivered',   label: 'تم التسليم',  count: counts.delivered ?? 0,   emoji: '📦', color: '#7C3AED', param: 'delivered' },
        ].map((s) => {
          const active = currentStatusFilter === s.id || (s.id === 'all' && currentStatusFilter === 'all');
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

      {/* Status "folders" — one filter chip per status, each with a
          live count. Clicking filters the list to that status; the
          active one is highlighted. "الكل" clears the filter. */}
      <div className="pl__folders">
        <button
          type="button"
          className={`pl__folder ${currentStatusFilter === 'all' ? 'pl__folder--active' : ''}`}
          onClick={() => updateParam('where[status][equals]', null)}
        >
          <span className="pl__folder-label">الكل</span>
          <span className="pl__folder-count">{stats.total.toLocaleString('en-US')}</span>
        </button>
        {ORDERED_STATUSES.map((st) => {
          const meta = STATUS[st];
          const active = currentStatusFilter === st;
          return (
            <button
              key={st}
              type="button"
              className={`pl__folder ${active ? 'pl__folder--active' : ''}`}
              onClick={() => updateParam('where[status][equals]', st)}
              style={{
                '--folder-bg': meta.bg,
                '--folder-color': meta.color,
                '--folder-dot': meta.dot,
              } as React.CSSProperties}
            >
              <span className="pl__folder-emoji" aria-hidden>{meta.emoji}</span>
              <span className="pl__folder-label">{meta.label}</span>
              <span className="pl__folder-count">{(counts[st] ?? 0).toLocaleString('en-US')}</span>
            </button>
          );
        })}
      </div>

      {/* Revenue + issues bar */}
      {(stats.revenue > 0 || stats.issues > 0) && (
        <div className="pl__highlight-bar">
          {stats.revenue > 0 && (
            <div className="pl__highlight pl__highlight--positive">
              <span className="pl__highlight-icon" aria-hidden>💰</span>
              <div className="pl__highlight-text">
                <span className="pl__highlight-label">الإيرادات المؤكدة</span>
                <span className="pl__highlight-value" dir="ltr">{fmtMoney(stats.revenue, 'USD')}</span>
              </div>
            </div>
          )}
          {stats.issues > 0 && (
            <button
              type="button"
              className="pl__highlight pl__highlight--warning"
              onClick={() => updateParam('where[status][in]', 'disputed,refunded,cancelled')}
            >
              <span className="pl__highlight-icon" aria-hidden>⚠️</span>
              <div className="pl__highlight-text">
                <span className="pl__highlight-label">طلبات تحتاج مراجعة</span>
                <span className="pl__highlight-value">{stats.issues.toLocaleString('en-US')}</span>
              </div>
            </button>
          )}
        </div>
      )}

      <div className="pl__controls">
        <div className="pl__search">
          <svg className="pl__search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            placeholder="ابحث برقم الطلب..."
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
          <div className="pl__empty-title">لا توجد طلبات</div>
          <div className="pl__empty-sub">{currentSearch ? `لم نجد نتائج لـ "${currentSearch}"` : 'الطلبات الجديدة ستظهر هنا'}</div>
        </div>
      ) : (
        <div className="pl__grid pl__grid--compact">
          {docs.map((o) => {
            const status = STATUS[o.status || 'pending'];
            const itemCount = Array.isArray(o.items) ? o.items.length : 0;
            const editUrl = `/admin/collections/orders/${o.id}`;
            const custName = customerLabel(o.customer);
            const custEmail = customerEmail(o.customer);

            return (
              <NavLink key={o.id} to={editUrl} className="pl-card pl-card--compact">
                <div className="pl-card__icon pl-card__icon--mono" aria-hidden>
                  <span style={{ fontSize: 18 }}>{status.emoji}</span>
                </div>

                <div className="pl-card__body pl-card__body--row">
                  <div className="pl-card__heading">
                    <h3 className="pl-card__name-ar pl-card__order-number" dir="ltr">
                      {o.orderNumber || `#${String(o.id).slice(0, 8)}`}
                    </h3>
                    <span className={`pl-card__status`} style={{ background: status.bg, color: status.color }}>
                      <span className="pl-card__status-dot" style={{ background: status.dot }} />
                      {status.label}
                    </span>
                    {/* Confirmation source — only for delivered orders
                        where we know who flipped the switch. */}
                    {o.status === 'delivered' && o.confirmedBy && CONFIRMED_BY[o.confirmedBy] && (
                      <span
                        className="pl-card__status"
                        style={{
                          background: CONFIRMED_BY[o.confirmedBy].bg,
                          color:      CONFIRMED_BY[o.confirmedBy].color,
                        }}
                        title="مصدر تأكيد الاستلام"
                      >
                        <span aria-hidden>{CONFIRMED_BY[o.confirmedBy].emoji}</span>
                        {CONFIRMED_BY[o.confirmedBy].label}
                      </span>
                    )}
                    {/* Paid orders that haven't been confirmed yet get an
                        explicit "waiting" chip so support can spot them
                        without reading the status pill twice. */}
                    {o.status === 'paid' && (
                      <span
                        className="pl-card__status"
                        style={{ background: '#FEF3C7', color: '#854D0E' }}
                        title="لم يؤكد العميل الاستلام بعد"
                      >
                        <span aria-hidden>⏳</span>
                        بانتظار تأكيد العميل
                      </span>
                    )}
                  </div>

                  <div className="pl-card__meta-row">
                    {custName && (
                      <span className="pl-card__chip" title="العميل">
                        <span aria-hidden>👤</span> {custName}
                      </span>
                    )}
                    {custEmail && custEmail !== custName && (
                      <span className="pl-card__chip" dir="ltr" title="البريد">
                        <span aria-hidden>✉️</span> {custEmail}
                      </span>
                    )}
                    {itemCount > 0 && (
                      <span className="pl-card__chip" title="عدد المنتجات">
                        <span aria-hidden>🛍️</span> {itemCount.toLocaleString('en-US')} منتج
                      </span>
                    )}
                  </div>
                </div>

                <div className="pl-card__side">
                  <span className="pl-card__price" dir="ltr">{fmtMoney(o.totalAmount, o.currency)}</span>
                  <span className="pl-card__updated">{fmtDate(o.createdAt)}</span>
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
            {data?.totalDocs?.toLocaleString('en-US') || 0} طلب · صفحة {currentPage.toLocaleString('en-US')} من {totalPages.toLocaleString('en-US')}
          </span>
        </nav>
      )}
    </div>
  );
};

export default OrdersList;
