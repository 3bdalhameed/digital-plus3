import { GlobalConfig } from "payload/types";

export const Settings: GlobalConfig = {
  slug: "settings",
  label: "إعدادات الموقع",
  admin: {
    group: "الإعدادات",
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "siteName",
      label: "اسم الموقع",
      type: "text",
      defaultValue: "ديجيتال بلس",
    },
    {
      name: "logo",
      label: "الشعار",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "favicon",
      label: "أيقونة المتصفح",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "contactEmail",
      label: "البريد الإلكتروني",
      type: "email",
    },
    {
      name: "whatsappNumber",
      label: "رقم الواتساب",
      type: "text",
    },
    {
      name: "supportHours",
      label: "ساعات الدعم",
      type: "text",
    },
    {
      name: "orderNotificationEmails",
      label: "إشعارات الطلبات — مستلمون إضافيون",
      type: "textarea",
      admin: {
        description: "أدخل بريد إلكتروني واحد في كل سطر — يُضاف إلى إشعارات تغيير حالة الطلب بجانب المدراء تلقائياً",
      },
    },
    {
      type: "collapsible",
      label: "روابط التواصل الاجتماعي",
      fields: [
        { name: "instagramUrl",  label: "Instagram",   type: "text" },
        { name: "twitterUrl",   label: "Twitter / X", type: "text" },
        { name: "facebookUrl",  label: "Facebook",    type: "text" },
        { name: "tiktokUrl",    label: "TikTok",      type: "text" },
        { name: "youtubeUrl",   label: "YouTube",     type: "text" },
        { name: "telegramUrl",  label: "Telegram",    type: "text" },
        { name: "whatsappUrl",  label: "WhatsApp",    type: "text" },
      ],
    },
    // Exit-intent discount popup. Copy is fully editable per language;
    // storefront falls back to hardcoded defaults if a field is blank
    // so a half-configured setup still shows something reasonable.
    {
      type: "collapsible",
      label: "نافذة نية المغادرة (عرض الخصم)",
      fields: [
        {
          name: "exitPopupEnabled",
          label: "تفعيل النافذة",
          type: "checkbox",
          defaultValue: true,
        },
        {
          name: "exitPopupCouponCode",
          label: "كود الخصم المعروض",
          type: "text",
          defaultValue: "PLUS7",
          admin: { description: "اكتب الكود بالإنجليزية (يظهر كما هو داخل النافذة)" },
        },
        {
          type: "row",
          fields: [
            { name: "exitPopupHeadlineAr",    label: "العنوان (عربي)",       type: "text", defaultValue: "🛑 لحظة قبل ما تغلق الشاشة!" },
            { name: "exitPopupHeadlineEn",    label: "العنوان (English)",    type: "text", defaultValue: "🛑 Wait — before you go!" },
          ],
        },
        {
          type: "row",
          fields: [
            { name: "exitPopupSubheadlineAr", label: "العنوان الفرعي (عربي)",    type: "text",     defaultValue: "🤝 لا تذهب بدون عرض حصري قبل المغادرة" },
            { name: "exitPopupSubheadlineEn", label: "العنوان الفرعي (English)", type: "text",     defaultValue: "🤝 Don't leave without your exclusive offer" },
          ],
        },
        {
          type: "row",
          fields: [
            { name: "exitPopupBodyAr", label: "نص الجسم (عربي)",    type: "textarea", defaultValue: "استخدم كود الخصم التالي عند الشراء واحصل على خصم فوري على كل المنتجات الرقمية في المتجر." },
            { name: "exitPopupBodyEn", label: "نص الجسم (English)", type: "textarea", defaultValue: "Use this discount code at checkout and get an instant discount on every digital product in the store." },
          ],
        },
      ],
    },
  ],
};
