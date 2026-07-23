// @ts-nocheck
import React, { useCallback, useEffect, useState } from "react";
import { DefaultTemplate } from "payload/components/templates";

/**
 * Admin view for abandoned (not-yet-checked-out) carts.
 * Registered under admin.components.views → /admin/abandoned-carts.
 *
 * Reads GET /api/abandoned-carts (raw SQL against the abandoned_carts
 * table the storefront cart-sync writes) and POST
 * /api/abandoned-carts/test-email (fires a sample reminder so admins
 * can verify the Resend wiring without waiting on the hourly sweep).
 */

type Cart = {
  user_email: string;
  user_name: string | null;
  cart_data: any;
  completed_at: string | null;
  updated_at: string;
  created_at: string;
  reminder_3h_sent_at: string | null;
  reminder_6h_sent_at: string | null;
};

const fmtDate = (d?: string | null) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("ar-EG-u-nu-latn", {
      day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true,
    });
  } catch { return String(d); }
};

const hoursAgo = (d?: string | null): string => {
  if (!d) return "—";
  const ms = Date.now() - new Date(d).getTime();
  if (!Number.isFinite(ms)) return "—";
  const h = Math.floor(ms / 3_600_000);
  if (h < 1) return "أقل من ساعة";
  if (h < 24) return `${h} ساعة`;
  return `${Math.floor(h / 24)} يوم`;
};

function itemsOf(cartData: any): Array<{ name: string; quantity: number }> {
  const arr = Array.isArray(cartData) ? cartData : [];
  return arr.map((it: any) => ({
    // cart-sync stores items flat as { productId, name, quantity, ... }
    // so the name is at it.name; fall back to a nested product object.
    name: it?.name || it?.product?.nameAr || it?.product?.name?.ar || it?.product?.nameEn || "منتج",
    quantity: Number(it?.quantity ?? 1),
  }));
}

export default function AbandonedCartsView(props: any) {
  return (
    <DefaultTemplate {...props}>
      <AbandonedCartsInner />
    </DefaultTemplate>
  );
}

function AbandonedCartsInner() {
  const [carts, setCarts] = useState<Cart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Test-email box
  const [testEmail, setTestEmail] = useState("");
  const [testWhich, setTestWhich] = useState<1 | 2>(1);
  const [testBusy, setTestBusy] = useState(false);
  const [testMsg, setTestMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/abandoned-carts?status=active", {
        credentials: "include",
        cache: "no-store",
      });
      if (res.status === 403) { setError("ليس لديك صلاحية لعرض هذه الصفحة."); setCarts([]); return; }
      if (!res.ok) { setError("تعذّر تحميل السلات."); setCarts([]); return; }
      const data = await res.json();
      setCarts(data.carts ?? []);
    } catch {
      setError("تعذّر الاتصال بالخادم.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const sendTest = async () => {
    setTestMsg(null);
    const email = testEmail.trim();
    if (!email || !email.includes("@")) {
      setTestMsg({ ok: false, text: "أدخل بريداً صحيحاً." });
      return;
    }
    setTestBusy(true);
    try {
      const res = await fetch("/api/abandoned-carts/test-email", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, which: testWhich }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setTestMsg({ ok: true, text: `تم إرسال بريد تجريبي إلى ${email}` });
      } else {
        setTestMsg({ ok: false, text: data?.error || "تعذّر الإرسال." });
      }
    } catch {
      setTestMsg({ ok: false, text: "تعذّر الاتصال بالخادم." });
    } finally {
      setTestBusy(false);
    }
  };

  return (
    <div style={{ padding: "32px 24px", maxWidth: 1000, margin: "0 auto" }} dir="rtl">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1e1b4b", margin: 0 }}>السلات المتروكة</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>
            سلات العملاء التي تحتوي منتجات ولم يكتمل شراؤها بعد. يُرسل تذكير تلقائياً بعد 3 و6 ساعات.
          </p>
        </div>
        <button
          onClick={load}
          style={{ padding: "8px 14px", fontSize: 13, fontWeight: 700, color: "#5B21B6", background: "white", border: "1px solid #e0e7ff", borderRadius: 10, cursor: "pointer" }}
        >
          {loading ? "..." : "تحديث"}
        </button>
      </div>

      {/* Test-email box */}
      <div style={{ background: "#F5F3FF", border: "1px solid #e0e7ff", borderRadius: 14, padding: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#5B21B6", marginBottom: 10 }}>
          إرسال بريد تجريبي للتحقق من الإعداد
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="email"
            dir="ltr"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="test@example.com"
            style={{ flex: "1 1 240px", minWidth: 220, padding: "9px 12px", borderRadius: 10, border: "1px solid #ddd6fe", fontSize: 14, outline: "none" }}
          />
          <select
            value={testWhich}
            onChange={(e) => setTestWhich(Number(e.target.value) === 2 ? 2 : 1)}
            style={{ padding: "9px 12px", borderRadius: 10, border: "1px solid #ddd6fe", fontSize: 13, fontWeight: 700, color: "#5B21B6", background: "white", cursor: "pointer" }}
          >
            <option value={1}>تذكير 3 ساعات</option>
            <option value={2}>تذكير 6 ساعات</option>
          </select>
          <button
            onClick={sendTest}
            disabled={testBusy}
            style={{ padding: "9px 18px", fontSize: 13, fontWeight: 800, color: "white", background: "#7C3AED", border: "none", borderRadius: 10, cursor: testBusy ? "wait" : "pointer", opacity: testBusy ? 0.6 : 1 }}
          >
            {testBusy ? "جاري الإرسال..." : "إرسال تجريبي"}
          </button>
        </div>
        {testMsg && (
          <p style={{ margin: "10px 0 0", fontSize: 13, fontWeight: 700, color: testMsg.ok ? "#166534" : "#991b1b" }}>
            {testMsg.text}
          </p>
        )}
      </div>

      {error && (
        <div style={{ padding: 12, background: "#fee2e2", color: "#991b1b", borderRadius: 10, marginBottom: 16, fontSize: 14 }}>
          {error}
        </div>
      )}

      {carts.length === 0 && !loading && !error && (
        <div style={{ padding: 48, textAlign: "center", color: "#6b7280", background: "white", borderRadius: 14, border: "1px solid #e5e7eb" }}>
          لا توجد سلات متروكة حالياً.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {carts.map((c) => {
          const items = itemsOf(c.cart_data);
          return (
            <div key={c.user_email} style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 14, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#1e1b4b" }}>{c.user_name || "زبون"}</div>
                  <a href={`mailto:${c.user_email}`} style={{ fontSize: 12, color: "#7C3AED", textDecoration: "none", direction: "ltr", display: "inline-block" }}>
                    {c.user_email}
                  </a>
                </div>
                <div style={{ textAlign: "left", fontSize: 11, color: "#6b7280" }}>
                  <div>آخر نشاط: {fmtDate(c.updated_at)}</div>
                  <div style={{ marginTop: 2 }}>متروكة منذ {hoursAgo(c.updated_at)}</div>
                </div>
              </div>

              <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
                {items.map((it, i) => (
                  <span key={i} style={{ fontSize: 12, background: "#f5f3ff", color: "#5B21B6", padding: "3px 10px", borderRadius: 999, fontWeight: 600 }}>
                    {it.name} ×{it.quantity}
                  </span>
                ))}
              </div>

              <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid #f3f4f6", display: "flex", gap: 8, flexWrap: "wrap", fontSize: 11 }}>
                <span style={{ padding: "2px 8px", borderRadius: 999, fontWeight: 700, background: c.reminder_3h_sent_at ? "#d1fae5" : "#fef3c7", color: c.reminder_3h_sent_at ? "#065f46" : "#92400e" }}>
                  تذكير 3س: {c.reminder_3h_sent_at ? `أُرسل (${fmtDate(c.reminder_3h_sent_at)})` : "لم يُرسل"}
                </span>
                <span style={{ padding: "2px 8px", borderRadius: 999, fontWeight: 700, background: c.reminder_6h_sent_at ? "#d1fae5" : "#fef3c7", color: c.reminder_6h_sent_at ? "#065f46" : "#92400e" }}>
                  تذكير 6س: {c.reminder_6h_sent_at ? `أُرسل (${fmtDate(c.reminder_6h_sent_at)})` : "لم يُرسل"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
