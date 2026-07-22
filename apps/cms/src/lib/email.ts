const STATUS_AR: Record<string, string> = {
  pending:     "قيد الانتظار",
  paid:        "مدفوع",
  in_progress: "قيد التنفيذ",
  delivered:   "تم التسليم",
  cancelled:   "ملغي",
};

const STATUS_ICON: Record<string, string> = {
  pending:     "🕐",
  paid:        "✅",
  in_progress: "⏳",
  delivered:   "📦",
  cancelled:   "❌",
};

const STATUS_COLOR: Record<string, string> = {
  pending:     "#f59e0b",
  paid:        "#10b981",
  in_progress: "#4f46e5",
  delivered:   "#7C3AED",
  cancelled:   "#ef4444",
};

async function sendViaResend(opts: {
  to: string | string[];
  subject: string;
  html: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from   = process.env.RESEND_FROM_EMAIL || "noreply@example.com";
  if (!apiKey || apiKey === "placeholder") return false;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `ديجيتال بلس <${from}>`,
        to: Array.isArray(opts.to) ? opts.to : [opts.to],
        subject: opts.subject,
        html: opts.html,
      }),
    });
    return res.ok;
  } catch (err) {
    console.error("[email] send failed:", err);
    return false;
  }
}

/** Default customer-facing message per status (used when the CMS
 *  Email Templates global leaves the field blank). */
const DEFAULT_MESSAGES: Record<string, string> = {
  paid:        "تم استلام دفعتك بنجاح! سيتم تسليم طلبك قريباً.",
  in_progress: "طلبك قيد التنفيذ الآن، وسنعلمك فور اكتماله.",
  delivered:   "تم تسليم طلبك. نتمنى أن تستمتع بمشترياتك!",
  cancelled:   "تم إلغاء طلبك. تواصل معنا إذا كان لديك أي استفسار.",
};

/** Substitute {name} {orderNumber} {status} {oldStatus} {icon} in a
 *  CMS-authored template string. */
function fillTemplate(
  tpl: string,
  vars: { name: string; orderNumber: string; status: string; oldStatus: string; icon: string },
): string {
  return tpl
    .replace(/\{name\}/g, vars.name)
    .replace(/\{orderNumber\}/g, vars.orderNumber)
    .replace(/\{status\}/g, vars.status)
    .replace(/\{oldStatus\}/g, vars.oldStatus)
    .replace(/\{icon\}/g, vars.icon);
}

export async function sendOrderStatusChangeEmail({
  customerEmail,
  customerName,
  orderNumber,
  oldStatus,
  newStatus,
  orderId,
  payload,
  contactEmail,
}: {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  oldStatus: string;
  newStatus: string;
  orderId: string | number;
  payload: any;
  /** Optional secondary email the customer added at checkout. Gets a
   *  copy of the customer notification alongside their account email. */
  contactEmail?: string | null;
}): Promise<void> {
  const storeUrl  = process.env.STOREFRONT_URL || "http://localhost:3000";
  const cmsUrl    = process.env.PAYLOAD_PUBLIC_SERVER_URL || "http://localhost:3001";
  const label     = STATUS_AR[newStatus] ?? newStatus;
  const icon      = STATUS_ICON[newStatus] ?? "📋";
  const color     = STATUS_COLOR[newStatus] ?? "#7C3AED";
  const oldLabel  = STATUS_AR[oldStatus] ?? oldStatus;

  // Pull editable copy from the CMS Email Templates global. Every
  // field is optional -- fall back to the hardcoded defaults below
  // when blank so a fresh install still sends complete emails.
  let tpl: any = {};
  try {
    tpl = (await payload.findGlobal({ slug: "email-templates", overrideAccess: true })) ?? {};
  } catch (e) {
    console.error("[email] failed to load email-templates global:", e);
  }

  const vars = { name: customerName, orderNumber, status: label, oldStatus: oldLabel, icon };

  const headerTitle = tpl.orderStatusHeaderTitle?.trim() || "تحديث حالة طلبك";
  const footerText  = tpl.orderStatusFooter?.trim() || "فريق الدعم جاهز لمساعدتك على مدار الساعة";
  const ctaLabel    = tpl.orderStatusCtaLabel?.trim() || "عرض تفاصيل الطلب";

  // Per-status message: CMS override wins, else built-in default, else
  // a generic line.
  const cmsMsgKey: Record<string, string | undefined> = {
    paid:        tpl.msgPaid,
    in_progress: tpl.msgInProgress,
    delivered:   tpl.msgDelivered,
    cancelled:   tpl.msgCancelled,
  };
  const rawMessage =
    (cmsMsgKey[newStatus]?.trim()) ||
    (tpl.msgDefault?.trim()) ||
    DEFAULT_MESSAGES[newStatus] ||
    "تم تحديث حالة طلبك.";
  const message = fillTemplate(rawMessage, vars);

  const subject =
    (tpl.orderStatusSubject?.trim()
      ? fillTemplate(tpl.orderStatusSubject.trim(), vars)
      : `${icon} تحديث طلبك ${orderNumber} — ${label}`);

  // ── Customer email ────────────────────────────────────────────────────────
  const customerHtml = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:40px 20px;background:#F3F0FF;font-family:'Cairo','Tajawal',Arial,sans-serif;direction:rtl;">
  <div style="max-width:560px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(124,58,237,0.12);">

    <div style="background:linear-gradient(135deg,#7C3AED,#A855F7);padding:28px 32px;text-align:center;">
      <div style="font-size:40px;margin-bottom:8px;">${icon}</div>
      <h1 style="color:white;margin:0;font-size:20px;font-weight:700;">${headerTitle}</h1>
      <p style="color:#EDE9FE;margin:8px 0 0;font-size:14px;">مرحباً ${customerName}</p>
    </div>

    <div style="padding:32px;">
      <div style="background:#F3F0FF;border-radius:12px;padding:16px 20px;margin-bottom:24px;text-align:center;">
        <p style="margin:0 0 4px;color:#6b7280;font-size:13px;">رقم الطلب</p>
        <p style="margin:0;color:#7C3AED;font-size:17px;font-weight:800;">${orderNumber}</p>
      </div>

      <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:24px;flex-wrap:wrap;">
        <span style="background:#f3f4f6;color:#6b7280;padding:8px 16px;border-radius:20px;font-size:14px;">${oldLabel}</span>
        <span style="color:#9ca3af;font-size:20px;">←</span>
        <span style="background:${color}22;color:${color};padding:8px 16px;border-radius:20px;font-size:14px;font-weight:700;">${label}</span>
      </div>

      <p style="color:#4b5563;font-size:14px;text-align:center;margin:0 0 28px;">
        ${message}
      </p>

      <div style="text-align:center;">
        <a href="${storeUrl}/orders"
           style="display:inline-block;background:linear-gradient(135deg,#7C3AED,#A855F7);color:white;text-decoration:none;padding:13px 32px;border-radius:12px;font-weight:700;font-size:15px;">
          ${ctaLabel}
        </a>
      </div>
    </div>

    <div style="background:#F3F0FF;padding:18px 32px;text-align:center;">
      <p style="color:#6D28D9;margin:0;font-size:13px;">${footerText}</p>
    </div>
  </div>
</body>
</html>`;

  // Send to the account email plus the optional secondary contact
  // email, deduped + normalized.
  const recipients = [...new Set(
    [customerEmail, contactEmail]
      .map((e) => e?.trim().toLowerCase())
      .filter((e): e is string => !!e && e.includes("@")),
  )];
  await sendViaResend({
    to: recipients.length ? recipients : customerEmail,
    subject,
    html: customerHtml,
  });

  // ── Admin email ───────────────────────────────────────────────────────────
  const adminEmails = await getAdminEmails(payload);
  if (adminEmails.length === 0) return;

  const adminHtml = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:32px 20px;background:#f9fafb;font-family:'Cairo','Tajawal',Arial,sans-serif;direction:rtl;">
  <div style="max-width:520px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:#1e1b4b;padding:20px 28px;">
      <h1 style="color:white;margin:0;font-size:17px;font-weight:700;">${icon} تغيير حالة طلب</h1>
    </div>
    <div style="padding:24px 28px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:8px 0;color:#6b7280;width:130px;">رقم الطلب</td><td style="padding:8px 0;font-weight:700;color:#1e1b4b;">${orderNumber}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;">العميل</td><td style="padding:8px 0;color:#1e1b4b;">${customerName} (${customerEmail})</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;">الحالة القديمة</td><td style="padding:8px 0;color:#6b7280;">${oldLabel}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;">الحالة الجديدة</td><td style="padding:8px 0;font-weight:700;color:${color};">${label}</td></tr>
      </table>
      <div style="margin-top:20px;">
        <a href="${cmsUrl}/admin/collections/orders/${orderId}"
           style="display:inline-block;background:#7C3AED;color:white;text-decoration:none;padding:10px 24px;border-radius:8px;font-weight:700;font-size:14px;">
          فتح الطلب في لوحة التحكم
        </a>
      </div>
    </div>
  </div>
</body>
</html>`;

  await sendViaResend({
    to: adminEmails,
    subject: `${icon} طلب ${orderNumber}: ${oldLabel} ← ${label}`,
    html: adminHtml,
  });
}

async function getAdminEmails(payload: any): Promise<string[]> {
  const emails = new Set<string>();

  try {
    // 1. All users with super_admin or admin role
    const usersResult = await payload.find({
      collection: "users",
      where: { role: { in: ["super_admin", "admin"] } },
      limit: 100,
      overrideAccess: true,
    });
    for (const u of usersResult?.docs ?? []) {
      if (u.email) emails.add(u.email);
    }
  } catch (e) {
    console.error("[email] failed to fetch admin users:", e);
  }

  try {
    // 2. Extra recipients configured in Settings global
    const settings = await payload.findGlobal({
      slug: "settings",
      overrideAccess: true,
    }) as any;
    const extraRaw = (settings?.orderNotificationEmails as string | undefined) ?? "";
    for (const line of extraRaw.split("\n")) {
      const trimmed = line.trim();
      if (trimmed) emails.add(trimmed);
    }
  } catch (e) {
    console.error("[email] failed to fetch settings recipients:", e);
  }

  return [...emails];
}

/**
 * Abandoned-cart reminder email. Sent by the hourly sweep (see
 * runAbandonedCartReminders in payload.config.ts) 3h then 6h after a
 * signed-in shopper leaves items in the cart without checking out.
 *
 * `which` (1 = 3h, 2 = 6h) only tweaks the copy; the 6h nudge is a
 * little more urgent. Returns whether Resend accepted the send so the
 * caller can decide whether to stamp reminder_Nh_sent_at.
 */
export async function sendAbandonedCartEmail(opts: {
  email: string;
  name: string;
  items: Array<{ name: string; quantity: number }>;
  which: 1 | 2;
  /** Optional CMS Email Templates global. Any blank field falls back
   *  to the built-in default below. */
  tpl?: any;
}): Promise<boolean> {
  const storeUrl = process.env.STOREFRONT_URL || "http://localhost:3000";
  const first = opts.name?.trim() || "عزيزنا العميل";
  const tpl = opts.tpl ?? {};

  // {name} substitution for the CMS-authored fields.
  const fill = (s?: string) => (s || "").replace(/\{name\}/g, first);
  const pick = (v: string | undefined, fallback: string) => {
    const t = fill(v)?.trim();
    return t || fallback;
  };

  const headline = opts.which === 2
    ? pick(tpl.cartReminderSecondHeadline, "سلتك لا تزال بانتظارك ⏳")
    : pick(tpl.cartReminderFirstHeadline, "نسيت شيئاً في سلتك؟ 🛒");
  const sub = opts.which === 2
    ? pick(tpl.cartReminderSecondBody, "منتجاتك قد تنفد قريباً — أكمل طلبك الآن قبل فوات الفرصة.")
    : pick(tpl.cartReminderFirstBody, "لقد تركت بعض المنتجات في سلتك. أكمل طلبك في أي وقت.");
  const ctaLabel = pick(tpl.cartReminderCtaLabel, "إكمال الطلب");
  const footerText = pick(tpl.cartReminderFooter, "فريق الدعم جاهز لمساعدتك على مدار الساعة");

  const rows = opts.items
    .map(
      (it) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #EDE9FE;color:#1e1b4b;font-size:14px;">${it.name || "منتج"}</td>
        <td style="padding:10px 0;border-bottom:1px solid #EDE9FE;color:#6b7280;font-size:13px;text-align:left;">×${it.quantity}</td>
      </tr>`,
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:40px 20px;background:#F3F0FF;font-family:'Cairo','Tajawal',Arial,sans-serif;direction:rtl;">
  <div style="max-width:560px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(124,58,237,0.12);">
    <div style="background:linear-gradient(135deg,#9c65fa,#7C3AED);padding:30px 32px;text-align:center;">
      <div style="font-size:40px;margin-bottom:6px;">🛍️</div>
      <h1 style="color:white;margin:0;font-size:20px;font-weight:700;">${headline}</h1>
      <p style="color:#EDE9FE;margin:8px 0 0;font-size:14px;">مرحباً ${first}</p>
    </div>
    <div style="padding:32px;">
      <p style="color:#4b5563;font-size:14px;text-align:center;margin:0 0 22px;">${sub}</p>
      <table style="width:100%;border-collapse:collapse;">${rows}</table>
      <div style="text-align:center;margin-top:28px;">
        <a href="${storeUrl}/cart"
           style="display:inline-block;background:linear-gradient(135deg,#9c65fa,#7C3AED);color:white;text-decoration:none;padding:13px 34px;border-radius:12px;font-weight:700;font-size:15px;">
          ${ctaLabel}
        </a>
      </div>
    </div>
    <div style="background:#F3F0FF;padding:18px 32px;text-align:center;">
      <p style="color:#6D28D9;margin:0;font-size:13px;">${footerText}</p>
    </div>
  </div>
</body>
</html>`;

  const subject = opts.which === 2
    ? pick(tpl.cartReminderSecondSubject, "⏳ سلتك بانتظارك — أكمل طلبك")
    : pick(tpl.cartReminderFirstSubject, "🛒 نسيت شيئاً في سلتك؟");

  return sendViaResend({
    to: opts.email,
    subject,
    html,
  });
}
