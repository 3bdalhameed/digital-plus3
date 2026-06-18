// @ts-nocheck
import React, { useEffect, useState, useMemo } from "react";
import { useFormFields, useConfig } from "payload/components/utilities";

/* ─────────────────────────────────────────────────────────────
   OrderSummaryCards
   Renders a Shopify-style two-column summary at the top of the
   Order edit page: header (number + status + date), items card,
   totals card, customer + addresses sidebar. The default Payload
   edit form continues below for actually editing fields.
   ──────────────────────────────────────────────────────────── */

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  pending:   { bg: "#FEF3C7", color: "#854D0E", label: "قيد الانتظار" },
  paid:      { bg: "#DCFCE7", color: "#166534", label: "مدفوع" },
  delivered: { bg: "#EDE9FE", color: "#5B21B6", label: "تم التسليم" },
  disputed:  { bg: "#FEE2E2", color: "#991B1B", label: "متنازع عليه" },
  refunded:  { bg: "#F3F4F6", color: "#374151", label: "مسترد" },
  cancelled: { bg: "#FEE2E2", color: "#991B1B", label: "ملغي" },
};

const fmtMoney = (n?: number | null, currency?: string | null) => {
  if (typeof n !== "number") return "—";
  return `${currency || ""} ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`.trim();
};

const fmtDate = (d?: string | null) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("en-US", {
      month: "long", day: "numeric", year: "numeric",
      hour: "numeric", minute: "2-digit", hour12: true,
    });
  } catch { return String(d); }
};

const OrderSummaryCards: React.FC = () => {
  const { serverURL, routes } = useConfig();
  const api = routes?.api || "/api";

  // Pull live form values via Payload's useFormFields. Each entry is
  // { value, initialValue, valid }. We use `value` so the cards reflect
  // unsaved edits in real time.
  const fields = useFormFields(([fields]) => fields);
  const get = (k: string) => fields?.[k]?.value;
  const items = (get("items") as any[]) || [];
  // useFormFields flattens nested array fields with dot notation, so we
  // walk the flat keys to assemble each item.
  const itemList = useMemo(() => {
    const out: Array<{ productId: any; quantity: number; unitPrice: number; totalPrice: number }> = [];
    for (let i = 0; i < items.length; i++) {
      out.push({
        productId: fields[`items.${i}.product`]?.value,
        quantity:  Number(fields[`items.${i}.quantity`]?.value ?? 1),
        unitPrice: Number(fields[`items.${i}.unitPrice`]?.value ?? 0),
        totalPrice: Number(fields[`items.${i}.totalPrice`]?.value ?? 0),
      });
    }
    return out;
  }, [fields, items.length]);

  const orderNumber  = get("orderNumber") as string | undefined;
  const status       = (get("status") as string) || "pending";
  const totalAmount  = Number(get("totalAmount") ?? 0);
  const currency     = (get("currency") as string) || "USD";
  const createdAt    = get("createdAt") as string | undefined;
  const customerId   = get("customer") as any;

  // ── Resolve relations (customer + product details) via API ──
  const [customer, setCustomer] = useState<any>(null);
  const [productMap, setProductMap] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!customerId) { setCustomer(null); return; }
    fetch(`${serverURL}${api}/customers/${typeof customerId === "object" ? customerId?.id : customerId}?depth=0`, { credentials: "include" })
      .then((r) => r.json())
      .then((c) => setCustomer(c))
      .catch(() => setCustomer(null));
  }, [customerId, serverURL, api]);

  useEffect(() => {
    const ids = [...new Set(itemList.map((i) => typeof i.productId === "object" ? i.productId?.id : i.productId).filter(Boolean).map(String))];
    if (!ids.length) { setProductMap({}); return; }
    const idsQuery = ids.map((id) => `where[id][in][]=${encodeURIComponent(id)}`).join("&");
    fetch(`${serverURL}${api}/products?depth=1&limit=${ids.length}&${idsQuery}`, { credentials: "include" })
      .then((r) => r.json())
      .then((json) => {
        const map: Record<string, any> = {};
        for (const p of json.docs || []) map[String(p.id)] = p;
        setProductMap(map);
      })
      .catch(() => setProductMap({}));
  }, [itemList.map((i) => i.productId).join(","), serverURL, api]);

  // ── Customer order count badge ──
  const [customerOrderCount, setCustomerOrderCount] = useState<number | null>(null);
  useEffect(() => {
    if (!customer?.id) { setCustomerOrderCount(null); return; }
    fetch(`${serverURL}${api}/orders?limit=0&depth=0&where[customer][equals]=${customer.id}`, { credentials: "include" })
      .then((r) => r.json())
      .then((j) => setCustomerOrderCount(typeof j?.totalDocs === "number" ? j.totalDocs : null))
      .catch(() => setCustomerOrderCount(null));
  }, [customer?.id, serverURL, api]);

  const statusStyle = STATUS_STYLE[status] || STATUS_STYLE.pending;
  const subtotal = itemList.reduce((s, it) => s + (it.totalPrice || it.unitPrice * it.quantity), 0);
  const discount = Math.max(0, subtotal - totalAmount);

  return (
    <div className="osc" dir="rtl">
      {/* ── Header strip ───────────────────────────────────── */}
      <div className="osc__header">
        <div className="osc__header-left">
          <h2 className="osc__order-number">{orderNumber || "—"}</h2>
          <span className="osc__badge" style={{ background: statusStyle.bg, color: statusStyle.color }}>
            <span className="osc__badge-dot" style={{ background: statusStyle.color }} />
            {statusStyle.label}
          </span>
        </div>
        <div className="osc__header-meta">
          {fmtDate(createdAt)}
        </div>
      </div>

      {/* ── Two columns ────────────────────────────────────── */}
      <div className="osc__grid">

        {/* MAIN COLUMN */}
        <div className="osc__main">

          {/* Items card */}
          <div className="osc__card">
            <div className="osc__card-header">
              <span className="osc__pill" style={{ background: statusStyle.bg, color: statusStyle.color }}>
                {statusStyle.label}
              </span>
            </div>
            <div className="osc__items">
              {itemList.length === 0 && <div className="osc__empty">لا توجد منتجات</div>}
              {itemList.map((it, idx) => {
                const productKey = typeof it.productId === "object" ? it.productId?.id : it.productId;
                const p = productKey ? productMap[String(productKey)] : null;
                const thumb = p?.images?.[0]?.image?.url
                  || p?.images?.[0]?.image?.sizes?.thumbnail?.url
                  || "";
                const name = p?.nameAr || p?.nameEn || p?.slug || `منتج ${idx + 1}`;
                return (
                  <div key={idx} className="osc__item">
                    <div className="osc__item-thumb">
                      {thumb ? <img src={thumb} alt={name} loading="lazy" /> : <span>📦</span>}
                    </div>
                    <div className="osc__item-body">
                      <div className="osc__item-name">{name}</div>
                      {p?.slug && <a className="osc__item-link" href={`/admin/collections/products/${p.id}`}>/{p.slug}</a>}
                    </div>
                    <div className="osc__item-qty">×{it.quantity}</div>
                    <div className="osc__item-price">{fmtMoney(it.totalPrice || it.unitPrice * it.quantity, currency)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Totals card */}
          <div className="osc__card">
            <div className="osc__totals">
              <div className="osc__totals-row">
                <span className="osc__totals-label">المجموع الفرعي</span>
                <span className="osc__totals-meta">{itemList.length} عنصر</span>
                <span className="osc__totals-value">{fmtMoney(subtotal, currency)}</span>
              </div>
              {discount > 0 && (
                <div className="osc__totals-row">
                  <span className="osc__totals-label">الخصم</span>
                  <span className="osc__totals-meta">—</span>
                  <span className="osc__totals-value osc__totals-value--neg">-{fmtMoney(discount, currency)}</span>
                </div>
              )}
              <div className="osc__totals-row osc__totals-row--strong">
                <span className="osc__totals-label">المجموع الكلي</span>
                <span className="osc__totals-meta" />
                <span className="osc__totals-value">{fmtMoney(totalAmount, currency)}</span>
              </div>
              {status === "paid" || status === "delivered" ? (
                <div className="osc__totals-row osc__totals-row--paid">
                  <span className="osc__totals-label">مدفوع</span>
                  <span className="osc__totals-meta" />
                  <span className="osc__totals-value">{fmtMoney(totalAmount, currency)}</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* SIDEBAR COLUMN */}
        <aside className="osc__side">

          {/* Customer */}
          <div className="osc__card">
            <div className="osc__side-section-head">العميل</div>
            {customer ? (
              <div className="osc__customer">
                <a className="osc__customer-name" href={`/admin/collections/customers/${customer.id}`}>
                  {customer.name || customer.email}
                </a>
                {customerOrderCount != null && (
                  <a className="osc__customer-orders" href={`/admin/collections/orders?where[customer][equals]=${customer.id}`}>
                    {customerOrderCount.toLocaleString("en-US")} طلب
                  </a>
                )}

                <div className="osc__side-sub">معلومات التواصل</div>
                {customer.email && <a className="osc__side-link" href={`mailto:${customer.email}`} dir="ltr">{customer.email}</a>}
                {customer.phone ? (
                  <div dir="ltr" className="osc__side-text">{customer.phone}</div>
                ) : (
                  <div className="osc__side-muted">لا يوجد رقم هاتف</div>
                )}
              </div>
            ) : (
              <div className="osc__empty">جاري التحميل…</div>
            )}
          </div>

        </aside>
      </div>
    </div>
  );
};

export default OrderSummaryCards;
