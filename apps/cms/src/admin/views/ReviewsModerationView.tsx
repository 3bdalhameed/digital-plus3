// @ts-nocheck
import React, { useCallback, useEffect, useState } from "react";

/**
 * Custom Payload admin view for the review moderation queue.
 * Registered under admin.components.views so it renders at
 * /admin/reviews-moderation inside the Payload panel (uses the same
 * layout / sidebar / header as any built-in collection view).
 *
 * Talks to two custom Payload endpoints (`GET`/`POST
 * /api/reviews-moderation`) which do a raw SQL query against the
 * reviews table -- we can't register Reviews as a real Payload
 * collection because its schema shape breaks the Drizzle adapter.
 *
 * The endpoints themselves check `req.user.role`; this component
 * just renders whatever the API returns and reports errors.
 */

type Review = {
  id: number;
  product_id: number;
  order_id: number;
  rating: number;
  comment: string | null;
  source: "customer" | "auto" | string;
  status: "pending" | "approved" | "rejected" | string;
  created_at: string;
  product_name: string | null;
  product_slug: string | null;
  customer_email: string | null;
  customer_name: string | null;
};

const TABS = ["pending", "approved", "rejected", "all"] as const;
type Tab = (typeof TABS)[number];

const TAB_LABELS_AR: Record<Tab, string> = {
  pending:  "بانتظار المراجعة",
  approved: "تمت الموافقة",
  rejected: "مرفوضة",
  all:      "كل التقييمات",
};

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  pending:  { bg: "#fef3c7", color: "#92400e", label: "بانتظار المراجعة" },
  approved: { bg: "#d1fae5", color: "#065f46", label: "معتمد" },
  rejected: { bg: "#fee2e2", color: "#991b1b", label: "مرفوض" },
};

function Stars({ rating }: { rating: number }) {
  const filled = Math.max(0, Math.min(5, rating));
  return (
    <span style={{ display: "inline-flex", gap: 2, letterSpacing: 1 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} style={{ color: i < filled ? "#fbbf24" : "#d1d5db", fontSize: 16 }}>
          ★
        </span>
      ))}
    </span>
  );
}

export default function ReviewsModerationView() {
  const [tab, setTab] = useState<Tab>("pending");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reviews-moderation?status=${tab}`, {
        credentials: "include",
        cache: "no-store",
      });
      if (res.status === 403) {
        setError("ليس لديك صلاحية لعرض هذه الصفحة.");
        setReviews([]);
        return;
      }
      if (!res.ok) {
        setError("تعذّر تحميل التقييمات.");
        setReviews([]);
        return;
      }
      const data = await res.json();
      setReviews(data.reviews ?? []);
    } catch {
      setError("تعذّر الاتصال بالخادم.");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  async function moderate(id: number, nextStatus: "approved" | "rejected" | "pending") {
    setBusyId(id);
    try {
      const res = await fetch("/api/reviews-moderation", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== id));
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div style={{ padding: "32px 24px", maxWidth: 960, margin: "0 auto" }} dir="rtl">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1e1b4b", margin: 0 }}>
            مراجعة التقييمات
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>
            التقييمات التي يرسلها العملاء تظهر هنا بانتظار موافقتك قبل عرضها على صفحة المنتج.
          </p>
        </div>
        <button
          onClick={load}
          style={{
            padding: "8px 14px",
            fontSize: 13,
            fontWeight: 700,
            color: "#5B21B6",
            background: "white",
            border: "1px solid #e0e7ff",
            borderRadius: 10,
            cursor: "pointer",
          }}
        >
          {loading ? "..." : "تحديث"}
        </button>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 8,
          padding: 6,
          background: "#f5f3ff",
          borderRadius: 14,
          marginBottom: 20,
        }}
      >
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              padding: "10px 14px",
              fontSize: 13,
              fontWeight: 700,
              borderRadius: 10,
              cursor: "pointer",
              border: "none",
              background: tab === t ? "white" : "transparent",
              color: tab === t ? "#5B21B6" : "#7C3AED",
              boxShadow: tab === t ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
            }}
          >
            {TAB_LABELS_AR[t]}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ padding: 12, background: "#fee2e2", color: "#991b1b", borderRadius: 10, marginBottom: 16, fontSize: 14 }}>
          {error}
        </div>
      )}

      {reviews.length === 0 && !loading && !error && (
        <div style={{ padding: 48, textAlign: "center", color: "#6b7280", background: "white", borderRadius: 14, border: "1px solid #e5e7eb" }}>
          لا توجد تقييمات في هذه القائمة.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {reviews.map((r) => {
          const sty = STATUS_STYLES[r.status] ?? { bg: "#e5e7eb", color: "#374151", label: r.status };
          return (
            <div
              key={r.id}
              style={{
                background: "white",
                border: "1px solid #e5e7eb",
                borderRadius: 14,
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <Stars rating={r.rating} />
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        background: sty.bg,
                        color: sty.color,
                        padding: "2px 8px",
                        borderRadius: 999,
                      }}
                    >
                      {sty.label}
                    </span>
                    {r.source === "auto" && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          background: "#ede9fe",
                          color: "#5B21B6",
                          padding: "2px 8px",
                          borderRadius: 999,
                        }}
                      >
                        تلقائي
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1e1b4b" }}>
                    {r.product_name ?? `منتج رقم ${r.product_id}`}
                  </p>
                  {r.product_slug && (
                    <a
                      href={`/admin/collections/products?where[slug][equals]=${r.product_slug}`}
                      style={{ fontSize: 11, color: "#7C3AED", textDecoration: "none" }}
                    >
                      /{r.product_slug}
                    </a>
                  )}
                </div>
                <div style={{ textAlign: "left", fontSize: 11, color: "#6b7280", flexShrink: 0 }}>
                  <div>{new Date(r.created_at).toLocaleDateString("ar-EG-u-nu-latn")}</div>
                  <div style={{ marginTop: 4 }}>طلب #{r.order_id}</div>
                </div>
              </div>

              {r.comment && (
                <p style={{ margin: 0, padding: 12, background: "#f9fafb", borderRadius: 10, fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
                  &ldquo;{r.comment}&rdquo;
                </p>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, paddingTop: 10, borderTop: "1px solid #f3f4f6", fontSize: 11 }}>
                <span style={{ color: "#6b7280" }}>
                  {r.customer_name ?? "زبون"}
                  {r.customer_email && (
                    <span style={{ color: "#9ca3af", direction: "ltr", display: "inline-block", marginInlineStart: 6 }}>
                      · {r.customer_email}
                    </span>
                  )}
                </span>
                <div style={{ display: "flex", gap: 6 }}>
                  {r.status !== "approved" && (
                    <button
                      onClick={() => moderate(r.id, "approved")}
                      disabled={busyId === r.id}
                      style={{
                        padding: "6px 14px",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "white",
                        background: "#10b981",
                        border: "none",
                        borderRadius: 8,
                        cursor: busyId === r.id ? "wait" : "pointer",
                        opacity: busyId === r.id ? 0.5 : 1,
                      }}
                    >
                      ✓ موافقة
                    </button>
                  )}
                  {r.status !== "rejected" && (
                    <button
                      onClick={() => moderate(r.id, "rejected")}
                      disabled={busyId === r.id}
                      style={{
                        padding: "6px 14px",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "white",
                        background: "#ef4444",
                        border: "none",
                        borderRadius: 8,
                        cursor: busyId === r.id ? "wait" : "pointer",
                        opacity: busyId === r.id ? 0.5 : 1,
                      }}
                    >
                      ✕ رفض
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
