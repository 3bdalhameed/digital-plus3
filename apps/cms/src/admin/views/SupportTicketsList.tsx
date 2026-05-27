// @ts-nocheck
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { NavLink, useHistory, useLocation } from 'react-router-dom';
import { useConfig } from 'payload/components/utilities';

type Ticket = {
  id: string;
  order?: any;
  customer?: any;
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';
  channel?: 'platform' | 'whatsapp' | 'email';
  messages?: Array<{ sender?: string; text?: string; timestamp?: string }>;
  createdAt?: string;
  updatedAt?: string;
};

const STATUS: Record<string, { label: string; bg: string; color: string; dot: string; emoji: string }> = {
  open:        { label: 'مفتوح',         bg: '#FEE2E2', color: '#991B1B', dot: '#DC2626', emoji: '🆕' },
  in_progress: { label: 'قيد المعالجة', bg: '#FEF3C7', color: '#854D0E', dot: '#D97706', emoji: '⏳' },
  resolved:    { label: 'محلول',         bg: '#DCFCE7', color: '#166534', dot: '#10B981', emoji: '✅' },
  closed:      { label: 'مغلق',          bg: '#F1F5F9', color: '#475569', dot: '#64748B', emoji: '🔒' },
};

const CHANNEL: Record<string, { label: string; emoji: string }> = {
  platform: { label: 'المنصة',  emoji: '🌐' },
  whatsapp: { label: 'واتساب',  emoji: '💬' },
  email:    { label: 'بريد',    emoji: '✉️' },
};

const refLabel = (r?: any): string => {
  if (!r || typeof r === 'string') return '';
  return r.orderNumber || r.name || r.email || '';
};

const fmtDateTime = (d?: string) =>
  d ? new Date(d).toLocaleString('ar-SA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

const SupportTicketsList: React.FC<{
  collection: any;
  data: any;
  hasCreatePermission?: boolean;
  newDocumentURL: string;
}> = ({ data, hasCreatePermission, newDocumentURL }) => {
  const { serverURL } = useConfig();
  const history = useHistory();
  const location = useLocation();

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const currentStatusFilter = params.get('where[status][equals]') || 'all';
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

  const [stats, setStats] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0 });
  useEffect(() => {
    const url = `${serverURL}/api/support-tickets`;
    Promise.all([
      fetch(`${url}?limit=0&depth=0`, { credentials: 'include' }).then((r) => r.json()),
      fetch(`${url}?limit=0&depth=0&where[status][equals]=open`,         { credentials: 'include' }).then((r) => r.json()),
      fetch(`${url}?limit=0&depth=0&where[status][equals]=in_progress`,  { credentials: 'include' }).then((r) => r.json()),
      fetch(`${url}?limit=0&depth=0&where[status][equals]=resolved`,     { credentials: 'include' }).then((r) => r.json()),
    ])
      .then(([all, op, ip, rs]) => {
        setStats({ total: all.totalDocs ?? 0, open: op.totalDocs ?? 0, inProgress: ip.totalDocs ?? 0, resolved: rs.totalDocs ?? 0 });
      })
      .catch((err) => console.error('[SupportTicketsList] stats fetch failed', err));
  }, [serverURL]);

  const docs = data?.docs || [];
  const totalPages = data?.totalPages || 1;
  const currentPage = data?.page || 1;

  return (
    <div className="pl" dir="rtl">
      <header className="pl__header">
        <div className="pl__title-wrap">
          <h1 className="pl__title">تذاكر الدعم</h1>
          <span className="pl__title-count">{stats.total.toLocaleString('ar-SA')}</span>
        </div>
        {hasCreatePermission && (
          <NavLink to={newDocumentURL} className="pl__create-btn">
            <span className="pl__plus">+</span>
            <span>تذكرة جديدة</span>
          </NavLink>
        )}
      </header>

      <div className="pl__stats">
        {[
          { id: 'all',         label: 'الكل',          count: stats.total,      emoji: '🎫', color: '#7C3AED', param: null },
          { id: 'open',        label: 'مفتوح',        count: stats.open,       emoji: '🆕', color: '#DC2626', param: 'open' },
          { id: 'in_progress', label: 'قيد المعالجة', count: stats.inProgress, emoji: '⏳', color: '#D97706', param: 'in_progress' },
          { id: 'resolved',    label: 'محلول',         count: stats.resolved,   emoji: '✅', color: '#059669', param: 'resolved' },
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
          <input type="search" placeholder="ابحث في التذاكر..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
          {searchInput && <button type="button" className="pl__search-clear" onClick={() => setSearchInput('')} aria-label="مسح البحث">×</button>}
        </div>
      </div>

      {docs.length === 0 ? (
        <div className="pl__empty">
          <div className="pl__empty-emoji">📭</div>
          <div className="pl__empty-title">لا توجد تذاكر</div>
          <div className="pl__empty-sub">التذاكر الجديدة ستظهر هنا</div>
        </div>
      ) : (
        <div className="pl__grid pl__grid--compact">
          {docs.map((t) => {
            const status = STATUS[t.status || 'open'];
            const channel = CHANNEL[t.channel || 'platform'];
            const orderName = refLabel(t.order);
            const customerName = refLabel(t.customer);
            const lastMessage = Array.isArray(t.messages) && t.messages.length > 0 ? t.messages[t.messages.length - 1] : null;
            const editUrl = `/admin/collections/support-tickets/${t.id}`;

            return (
              <NavLink key={t.id} to={editUrl} className="pl-card pl-card--compact">
                <div className="pl-card__icon pl-card__icon--mono" style={{ background: status.bg, color: status.color }} aria-hidden>
                  <span style={{ fontSize: 18 }}>{status.emoji}</span>
                </div>

                <div className="pl-card__body pl-card__body--row">
                  <div className="pl-card__heading">
                    <h3 className="pl-card__name-ar pl-card__order-number" dir="ltr">#{t.id.slice(-8).toUpperCase()}</h3>
                    <span className="pl-card__status" style={{ background: status.bg, color: status.color }}>
                      <span className="pl-card__status-dot" style={{ background: status.dot }} />
                      {status.label}
                    </span>
                  </div>

                  {lastMessage?.text && (
                    <p className="pl-card__description" dir="auto">{lastMessage.text}</p>
                  )}

                  <div className="pl-card__meta-row">
                    {customerName && (
                      <span className="pl-card__chip" title="العميل">
                        <span aria-hidden>👤</span> {customerName}
                      </span>
                    )}
                    {orderName && (
                      <span className="pl-card__chip pl-card__chip--position" dir="ltr" title="الطلب">
                        <span aria-hidden>📋</span> {orderName}
                      </span>
                    )}
                    <span className="pl-card__chip" title="القناة">
                      <span aria-hidden>{channel.emoji}</span> {channel.label}
                    </span>
                    {Array.isArray(t.messages) && t.messages.length > 0 && (
                      <span className="pl-card__chip" title="عدد الرسائل">
                        <span aria-hidden>💬</span> {t.messages.length.toLocaleString('ar-SA')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="pl-card__side">
                  <span className="pl-card__updated">{fmtDateTime(t.updatedAt || t.createdAt)}</span>
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
            {data?.totalDocs?.toLocaleString('ar-SA') || 0} تذكرة · صفحة {currentPage.toLocaleString('ar-SA')} من {totalPages.toLocaleString('ar-SA')}
          </span>
        </nav>
      )}
    </div>
  );
};

export default SupportTicketsList;
