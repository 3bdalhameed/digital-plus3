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
  ],
};
