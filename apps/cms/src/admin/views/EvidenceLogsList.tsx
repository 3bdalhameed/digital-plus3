// @ts-nocheck
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { NavLink, useHistory, useLocation } from 'react-router-dom';
import { useConfig } from 'payload/components/utilities';

type EvidenceLog = {
  id: string;
  type?: 'terms_acceptance' | 'payment' | 'delivery' | 'access' | 'usage_confirmation' | 'support_note' | 'screenshot';
  order?: any;
  customer?: any;
  timestamp?: string;
  ipAddress?: string;
  device?: string;
  browser?: string;
  attachments?: any[];
  internalNote?: string;
  createdAt?: string;
};

const TYPE_LABEL: Record<string, { label: string; emoji: string; bg: string; color: string }> = {
  terms_acceptance:    { label: 'قبول الشروط',     emoji: '📜', bg: '#EDE9FE', color: '#5B21B6' },
  payment:             { label: 'دفع',              emoji: '💳', bg: '#DCFCE7', color: '#166534' },
  delivery:            { label: 'تسليم',            emoji: '📦', bg: '#DBEAFE', color: '#1E40AF' },
  access:              { label: 'وصول',             emoji: '🔓', bg: '#FEF3C7', color: '#854D0E' },
  usage_confirmation:  { label: 'تأكيد الاستخدام',  emoji: '✅', bg: '#DCFCE7', color: '#166534' },
  support_note:        { label: 'ملاحظة دعم',      emoji: '📝', bg: '#F1F5F9', color: '#475569' },
  screenshot:          { label: 'لقطة شاشة',       emoji: '📷', bg: '#FCE7F3', color: '#9D174D' },
};

const fmtDateTime = (d?: string) =>
  d ? new Date(d).toLocaleString('ar-u-nu-latn', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

const refLabel = (r?: any): string => {
  if (!r || typeof r === 'string') return '';
  return r.orderNumber || r.name || r.email || r.title || '';
};

const EvidenceLogsList: React.FC<{
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
  const currentTypeFilter = params.get('where[type][equals]') || 'all';
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

  const [stats, setStats] = useState({ total: 0, payment: 0, delivery: 0, screenshot: 0 });
  useEffect(() => {
    const url = `${serverURL}/api/evidence-logs`;
    Promise.all([
      fetch(`${url}?limit=0&depth=0`, { credentials: 'include' }).then((r) => r.json()),
      fetch(`${url}?limit=0&depth=0&where[type][equals]=payment`,    { credentials: 'include' }).then((r) => r.json()),
      fetch(`${url}?limit=0&depth=0&where[type][equals]=delivery`,   { credentials: 'include' }).then((r) => r.json()),
      fetch(`${url}?limit=0&depth=0&where[type][equals]=screenshot`, { credentials: 'include' }).then((r) => r.json()),
    ])
      .then(([all, p, d, s]) => {
        setStats({ total: all.totalDocs ?? 0, payment: p.totalDocs ?? 0, delivery: d.totalDocs ?? 0, screenshot: s.totalDocs ?? 0 });
      })
      .catch((err) => console.error('[EvidenceLogsList] stats fetch failed', err));
  }, [serverURL]);

  const docs = data?.docs || [];
  const totalPages = data?.totalPages || 1;
  const currentPage = data?.page || 1;

  return (
    <div className="pl" dir="rtl">
      <header className="pl__header">
        <div className="pl__title-wrap">
          <h1 className="pl__title">سجلات الأدلة</h1>
          <span className="pl__title-count">{stats.total.toLocaleString('en-US')}</span>
        </div>
        {hasCreatePermission && (
          <NavLink to={newDocumentURL} className="pl__create-btn">
            <span className="pl__plus">+</span>
            <span>سجل دليل جديد</span>
          </NavLink>
        )}
      </header>

      <div className="pl__stats">
        {[
          { id: 'all',        label: 'الكل',          count: stats.total,      emoji: '📑', color: '#7C3AED', param: null },
          { id: 'payment',    label: 'دفع',           count: stats.payment,    emoji: '💳', color: '#059669', param: 'payment' },
          { id: 'delivery',   label: 'تسليم',         count: stats.delivery,   emoji: '📦', color: '#2563EB', param: 'delivery' },
          { id: 'screenshot', label: 'لقطات شاشة',   count: stats.screenshot, emoji: '📷', color: '#9D174D', param: 'screenshot' },
        ].map((s) => {
          const active = currentTypeFilter === s.id || (s.id === 'all' && currentTypeFilter === 'all');
          return (
            <button
              key={s.id}
              type="button"
              className={`pl__stat ${active ? 'pl__stat--active' : ''}`}
              onClick={() => updateParam('where[type][equals]', s.param)}
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
          <input type="search" placeholder="ابحث في السجلات..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
          {searchInput && <button type="button" className="pl__search-clear" onClick={() => setSearchInput('')} aria-label="مسح البحث">×</button>}
        </div>
      </div>

      {docs.length === 0 ? (
        <div className="pl__empty">
          <div className="pl__empty-emoji">📭</div>
          <div className="pl__empty-title">لا توجد سجلات</div>
          <div className="pl__empty-sub">السجلات تُنشأ تلقائياً عند الأحداث</div>
        </div>
      ) : (
        <div className="pl__grid pl__grid--compact">
          {docs.map((l) => {
            const t = TYPE_LABEL[l.type || 'support_note'] || TYPE_LABEL.support_note;
            const orderName = refLabel(l.order);
            const customerName = refLabel(l.customer);
            const attachmentCount = Array.isArray(l.attachments) ? l.attachments.length : 0;
            const editUrl = `/admin/collections/evidence-logs/${l.id}`;

            return (
              <NavLink key={l.id} to={editUrl} className="pl-card pl-card--compact">
                <div className="pl-card__icon pl-card__icon--mono" style={{ background: t.bg, color: t.color }} aria-hidden>
                  <span style={{ fontSize: 18 }}>{t.emoji}</span>
                </div>

                <div className="pl-card__body pl-card__body--row">
                  <div className="pl-card__heading">
                    <h3 className="pl-card__name-ar">{t.label}</h3>
                    {orderName && <span className="pl-card__chip pl-card__chip--position" dir="ltr">{orderName}</span>}
                  </div>

                  <div className="pl-card__meta-row">
                    {customerName && (
                      <span className="pl-card__chip" title="العميل">
                        <span aria-hidden>👤</span> {customerName}
                      </span>
                    )}
                    {l.ipAddress && (
                      <span className="pl-card__chip" dir="ltr" title="IP">
                        <span aria-hidden>🌐</span> {l.ipAddress}
                      </span>
                    )}
                    {attachmentCount > 0 && (
                      <span className="pl-card__chip" title="مرفقات">
                        <span aria-hidden>📎</span> {attachmentCount.toLocaleString('en-US')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="pl-card__side">
                  <span className="pl-card__updated">{fmtDateTime(l.timestamp || l.createdAt)}</span>
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
            {data?.totalDocs?.toLocaleString('en-US') || 0} سجل · صفحة {currentPage.toLocaleString('en-US')} من {totalPages.toLocaleString('en-US')}
          </span>
        </nav>
      )}
    </div>
  );
};

export default EvidenceLogsList;
